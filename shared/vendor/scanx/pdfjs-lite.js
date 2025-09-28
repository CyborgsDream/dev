(function(global) {
  if (global.pdfjsLib) {
    return;
  }

  function toUint8(bytes) {
    return bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  }

  function decodeLatin1(bytes) {
    const view = toUint8(bytes);
    let out = '';
    for (let i = 0; i < view.length; i++) {
      out += String.fromCharCode(view[i]);
    }
    return out;
  }

  function decodeUtf8(bytes) {
    const view = toUint8(bytes);
    let out = '';
    for (let i = 0; i < view.length; i++) {
      const byte1 = view[i];
      if (byte1 < 0x80) {
        out += String.fromCharCode(byte1);
        continue;
      }
      if (byte1 >= 0xc0 && byte1 < 0xe0) {
        if (i + 1 >= view.length) break;
        const byte2 = view[++i] & 0x3f;
        out += String.fromCharCode(((byte1 & 0x1f) << 6) | byte2);
        continue;
      }
      if (byte1 >= 0xe0 && byte1 < 0xf0) {
        if (i + 2 >= view.length) break;
        const byte2 = view[++i] & 0x3f;
        const byte3 = view[++i] & 0x3f;
        out += String.fromCharCode(((byte1 & 0x0f) << 12) | (byte2 << 6) | byte3);
        continue;
      }
      if (byte1 >= 0xf0) {
        if (i + 3 >= view.length) break;
        const byte2 = view[++i] & 0x3f;
        const byte3 = view[++i] & 0x3f;
        const byte4 = view[++i] & 0x3f;
        let codePoint = ((byte1 & 0x07) << 18) | (byte2 << 12) | (byte3 << 6) | byte4;
        codePoint -= 0x10000;
        out += String.fromCharCode(0xd800 + (codePoint >> 10), 0xdc00 + (codePoint & 0x3ff));
        continue;
      }
    }
    return out;
  }

  function createDecoder(label, options) {
    if (typeof TextDecoder === 'function') {
      const candidates = label === 'latin1' ? ['latin1', 'iso-8859-1'] : [label];
      for (const candidate of candidates) {
        try {
          return new TextDecoder(candidate, options);
        } catch (err) {
          // Try the next candidate or fallback implementation below.
        }
      }
    }
    if (label === 'latin1' || label === 'iso-8859-1') {
      return { decode: decodeLatin1 };
    }
    if (label === 'utf-8') {
      return { decode: decodeUtf8 };
    }
    return { decode: decodeLatin1 };
  }

  const latin1Decoder = createDecoder('latin1');
  const utf8Decoder = createDecoder('utf-8', { fatal: false });

  function decodePdfString(raw) {
    let result = '';
    for (let i = 0; i < raw.length; i++) {
      const ch = raw[i];
      if (ch === '\\') {
        i++;
        if (i >= raw.length) break;
        const next = raw[i];
        if (next >= '0' && next <= '7') {
          let octal = next;
          let count = 1;
          while (count < 3 && i + 1 < raw.length) {
            const peek = raw[i + 1];
            if (peek >= '0' && peek <= '7') {
              octal += peek;
              i++;
              count++;
            } else {
              break;
            }
          }
          result += String.fromCharCode(parseInt(octal, 8));
        } else {
          const mapped = {
            'n': '\n',
            'r': '\r',
            't': '\t',
            'b': '\b',
            'f': '\f',
            '\\': '\\',
            '(': '(',
            ')': ')'
          }[next];
          result += mapped !== undefined ? mapped : next;
        }
      } else {
        result += ch;
      }
    }
    return result;
  }

  function readPdfString(source, index) {
    let depth = 1;
    let value = '';
    let i = index + 1;
    while (i < source.length && depth > 0) {
      const ch = source[i];
      if (ch === '\\') {
        value += ch;
        i++;
        if (i < source.length) {
          value += source[i];
          i++;
        }
        continue;
      }
      if (ch === '(') {
        depth++;
        value += ch;
        i++;
        continue;
      }
      if (ch === ')') {
        depth--;
        if (depth === 0) {
          i++;
          break;
        }
        value += ch;
        i++;
        continue;
      }
      value += ch;
      i++;
    }
    return { value, nextIndex: i };
  }

  function readArray(source, index) {
    let items = [];
    let i = index + 1;
    while (i < source.length) {
      const ch = source[i];
      if (ch === ']') {
        i++;
        break;
      }
      if (ch === '(') {
        const parsed = readPdfString(source, i);
        items.push(decodePdfString(parsed.value));
        i = parsed.nextIndex;
        continue;
      }
      if (/\s/.test(ch)) {
        i++;
        continue;
      }
      // Ignore numbers and other tokens in TJ arrays
      let token = '';
      while (i < source.length) {
        const tokenCh = source[i];
        if (tokenCh === '(' || tokenCh === ']' || /\s/.test(tokenCh)) {
          break;
        }
        token += tokenCh;
        i++;
      }
      if (token === '') {
        i++;
      }
    }
    return { items, nextIndex: i };
  }

  function decodeStreamToString(bytes) {
    try {
      return utf8Decoder.decode(bytes);
    } catch (err) {
      return latin1Decoder.decode(bytes);
    }
  }

  async function extractStreamBytes(obj, bytesView) {
    if (!obj.streamRange) {
      return null;
    }
    let data = bytesView.subarray(obj.streamRange.start, obj.streamRange.end);
    if (!obj.filters || !obj.filters.length) {
      return data;
    }
    let current = data;
    for (const filter of obj.filters) {
      if (filter === 'FlateDecode') {
        if (typeof DecompressionStream === 'function') {
          const ds = new DecompressionStream('deflate');
          const reader = new Response(new Blob([current]).stream().pipeThrough(ds));
          const buffer = await reader.arrayBuffer();
          current = new Uint8Array(buffer);
        } else {
          console.warn('ScanX lite cannot decode Flate streams without DecompressionStream support');
          return null;
        }
      } else {
        console.warn('ScanX lite skipped unsupported PDF filter', filter);
        return null;
      }
    }
    return current;
  }

  function collectObjects(fileText) {
    const objects = new Map();
    const regex = /(\d+)\s+(\d+)\s+obj([\s\S]*?)endobj/g;
    let match;
    while ((match = regex.exec(fileText))) {
      const objectId = match[1];
      const raw = match[3];
      const streamIndex = match[0].indexOf('stream');
      const entry = {
        id: objectId,
        raw,
        filters: null,
        streamRange: null
      };
      if (streamIndex !== -1) {
        const streamStart = match.index + streamIndex + 'stream'.length;
        let dataStart = streamStart;
        while (fileText[dataStart] === '\r' || fileText[dataStart] === '\n') {
          dataStart++;
        }
        const endIndex = match[0].lastIndexOf('endstream');
        if (endIndex !== -1) {
          let dataEnd = match.index + endIndex;
          while (fileText[dataEnd - 1] === '\r' || fileText[dataEnd - 1] === '\n') {
            dataEnd--;
          }
          entry.streamRange = { start: dataStart, end: dataEnd };
        }
      }
      const filterMatch = raw.match(/\/Filter\s*(\[[^\]]+\]|[^\s]+)/);
      if (filterMatch) {
        const token = filterMatch[1];
        let filters = [];
        if (token.startsWith('[')) {
          filters = token
            .replace(/^[\[]|[\]]$/g, '')
            .split(/\s+/)
            .filter(Boolean)
            .map(t => t.replace(/\//g, ''));
        } else {
          filters = [token.replace(/\//g, '')];
        }
        entry.filters = filters;
      }
      objects.set(objectId, entry);
    }
    return objects;
  }

  function extractPageContent(pageObj, objects) {
    const contentsMatch = pageObj.raw.match(/\/Contents\s+([^\n\r]+)/);
    const streams = [];
    if (contentsMatch) {
      const token = contentsMatch[1].trim();
      if (token.startsWith('[')) {
        const refs = token
          .replace(/^[\[]|[\]]$/g, '')
          .split(/\s+/)
          .filter(Boolean)
          .filter(entry => entry.endsWith('R'))
          .map(entry => entry.replace(/R$/, '').trim());
        for (const ref of refs) {
          const [id] = ref.split(' ');
          const target = objects.get(id);
          if (target && target.streamRange) {
            streams.push(target);
          }
        }
      } else if (token.endsWith('R')) {
        const [id] = token.replace(/R$/, '').trim().split(' ');
        const target = objects.get(id);
        if (target && target.streamRange) {
          streams.push(target);
        }
      }
    }
    if (!streams.length && pageObj.streamRange) {
      streams.push(pageObj);
    }
    return streams;
  }

  function buildTextItemsFromStreamText(streamText) {
    const items = [];
    let pendingBreak = false;
    let i = 0;
    while (i < streamText.length) {
      const ch = streamText[i];
      if (ch === '(') {
        const parsed = readPdfString(streamText, i);
        const decoded = decodePdfString(parsed.value);
        i = parsed.nextIndex;
        i = skipWhitespace(streamText, i);
        if (streamText.startsWith('Tj', i)) {
          i += 2;
          items.push({ str: decoded, hasEOL: pendingBreak });
          pendingBreak = false;
          continue;
        }
        if (streamText.startsWith("'", i)) {
          i += 1;
          items.push({ str: decoded, hasEOL: true });
          pendingBreak = false;
          continue;
        }
      } else if (ch === '[') {
        const parsed = readArray(streamText, i);
        i = parsed.nextIndex;
        i = skipWhitespace(streamText, i);
        if (streamText.startsWith('TJ', i)) {
          i += 2;
          const combined = parsed.items.join('');
          items.push({ str: combined, hasEOL: pendingBreak });
          pendingBreak = false;
          continue;
        }
      } else if (streamText.startsWith('T*', i)) {
        pendingBreak = true;
        i += 2;
        continue;
      } else if (streamText.startsWith('Td', i) || streamText.startsWith('TD', i)) {
        pendingBreak = true;
        i += 2;
        continue;
      }
      i++;
    }
    return items;
  }

  function skipWhitespace(str, index) {
    let i = index;
    while (i < str.length && /\s/.test(str[i])) {
      i++;
    }
    return i;
  }

  function buildPages(objects, bytesView) {
    const pages = [];
    for (const obj of objects.values()) {
      if (!/\/Type\s+\/Page/.test(obj.raw)) {
        continue;
      }
      pages.push(async () => {
        const contentObjs = extractPageContent(obj, objects);
        const pageItems = [];
        for (const streamObj of contentObjs) {
          try {
            const streamBytes = await extractStreamBytes(streamObj, bytesView);
            if (!streamBytes) continue;
            const streamText = decodeStreamToString(streamBytes);
            const items = buildTextItemsFromStreamText(streamText);
            pageItems.push(...items);
          } catch (err) {
            console.warn('ScanX lite parser skipped a content stream', err);
          }
        }
        return pageItems;
      });
    }
    return pages;
  }

  function createDocumentProxy(pageResolvers) {
    return {
      numPages: pageResolvers.length,
      getPage(index) {
        if (index < 1 || index > pageResolvers.length) {
          return Promise.reject(new Error('Invalid page index'));
        }
        return Promise.resolve({
          getTextContent() {
            return pageResolvers[index - 1]().then(items => ({ items }));
          }
        });
      }
    };
  }

  async function parsePdf(data) {
    const bytes = data instanceof ArrayBuffer ? new Uint8Array(data) : new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
    const text = latin1Decoder.decode(bytes);
    const objects = collectObjects(text);
    const pageResolvers = buildPages(objects, bytes);
    return createDocumentProxy(pageResolvers);
  }

  global.pdfjsLib = {
    getDocument(params) {
      const data = params && params.data ? params.data : null;
      if (!data) {
        throw new Error('ScanX lite requires in-memory PDF data.');
      }
      const promise = parsePdf(data);
      return { promise };
    },
    GlobalWorkerOptions: { workerSrc: null }
  };
  global.pdfjsLib.__scanxLite = true;
})(typeof window !== 'undefined' ? window : globalThis);
