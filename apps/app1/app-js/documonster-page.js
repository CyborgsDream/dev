/* DocuMonster Workbench runtime */
(function(){
  'use strict';

  const DOC_VERSION = '0.9.9';
  const OS_RELEASE = 'DocuMonster Workbench 3.11R';
  const STORAGE_KEY = 'documonster.workbench.doc';
  const FORMAT_PREFIX = 'DMON1:';
  const DEFAULT_FOOTER = 'DocuMonster Studio';

  const pagesEl = document.getElementById('pages');
  const thumbsEl = document.getElementById('thumbs');
  const curEl = document.getElementById('cur');
  const totEl = document.getElementById('tot');
  const gotoEl = document.getElementById('goto');
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');
  const firstBtn = document.getElementById('firstBtn');
  const lastBtn = document.getElementById('lastBtn');
  const goBtn = document.getElementById('goBtn');
  const pdfBtn = document.getElementById('pdfBtn');
  const pdfTrimBtn = document.getElementById('pdfTrimBtn');
  const chkGuides = document.getElementById('chkGuides');
  const chkCrops = document.getElementById('chkCrops');
  const chkColor = document.getElementById('chkColor');
  const chkReg = document.getElementById('chkReg');
  const chkSafe = document.getElementById('chkSafe');
  const chkShop = document.getElementById('chkShop');
  const chkMirror = document.getElementById('chkMirror');
  const selColorPreset = document.getElementById('selColorPreset');
  const releaseLabel = document.getElementById('releaseLabel');
  const verEl = document.getElementById('ver');

  const editorStatus = document.getElementById('editorStatus');
  const pageLabel = document.getElementById('pageLabel');
  const editNone = document.getElementById('editNone');
  const editColumns = document.getElementById('editColumns');
  const editFrame = document.getElementById('editFrame');
  const colCountInput = document.getElementById('colCount');
  const colGapInput = document.getElementById('colGap');
  const colContentArea = document.getElementById('colContent');
  const applyColumnContentBtn = document.getElementById('applyColumnContent');
  const frameTypeSelect = document.getElementById('frameType');
  const frameXInput = document.getElementById('frameX');
  const frameYInput = document.getElementById('frameY');
  const frameWInput = document.getElementById('frameW');
  const frameHInput = document.getElementById('frameH');
  const frameHeadingInput = document.getElementById('frameHeading');
  const frameWrapSelect = document.getElementById('frameWrap');
  const frameContentArea = document.getElementById('frameContent');
  const frameSrcInput = document.getElementById('frameSrc');
  const frameTextWrapper = document.getElementById('frameTextWrapper');
  const frameImageWrapper = document.getElementById('frameImageWrapper');
  const applyFrameContentBtn = document.getElementById('applyFrameContent');
  const deleteBlockBtn = document.getElementById('deleteBlockBtn');
  const addPageBtn = document.getElementById('addPageBtn');
  const duplicatePageBtn = document.getElementById('duplicatePageBtn');
  const fileLoader = document.getElementById('fileLoader');

  const menus = Array.from(document.querySelectorAll('.menu'));
  const menuButtons = Array.from(document.querySelectorAll('.menu > button'));
  const menuItems = Array.from(document.querySelectorAll('.menu-item'));

  const highlightPhrases = [
    'DocuMonster layout',
    'print-ready workflow',
    'vector finesse',
    'spot color balance',
    'baseline grid',
    'press proof preview'
  ];

  const defaultImage = 'data:image/svg+xml;utf8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="400" height="280" viewBox="0 0 400 280"><defs><linearGradient id="g" x1="0" x2="1" y1="0" y2="1"><stop offset="0" stop-color="#eef3ff"/><stop offset="1" stop-color="#d9e8ff"/></linearGradient></defs><rect width="400" height="280" fill="url(#g)"/><text x="50%" y="45%" dominant-baseline="middle" text-anchor="middle" font-family="Tahoma,Segoe UI,Arial" font-size="26" fill="#223">DocuMonster</text><text x="50%" y="65%" dominant-baseline="middle" text-anchor="middle" font-family="Tahoma,Segoe UI,Arial" font-size="16" fill="#223">Image Frame</text></svg>');

  let docState = loadDocFromStorage() || createInitialDoc();
  let pages = [];
  let curIndex = 0;
  let selectedBlock = null;
  let dirty = false;
  let currentFileName = null;
  let idCounter = 1;
  const observer = new IntersectionObserver(handleIntersection, {root:null, rootMargin:'0px', threshold:[0.6]});

  syncIdCounter(docState);
  releaseLabel.textContent = OS_RELEASE;
  verEl.textContent = OS_RELEASE + ' • v' + DOC_VERSION;
  document.title = 'DocuMonster — ' + OS_RELEASE + ' (Build ' + DOC_VERSION + ')';

  renderDocument();
  applyToggles();
  applyColorPreset();
  markSaved();
  snapTo(0,{behavior:'auto'});
  updateEditor();
  updateFrameEditors();

  menuButtons.forEach(btn=>{
    btn.addEventListener('click',e=>{
      const menu = btn.parentElement;
      const open = menu.classList.contains('open');
      closeMenus();
      if(!open){ menu.classList.add('open'); btn.focus(); }
      e.stopPropagation();
    });
  });
  document.addEventListener('click',e=>{ if(!e.target.closest('.menu')) closeMenus(); });
  document.addEventListener('keydown',e=>{ if(e.key==='Escape') closeMenus(); });
  menuItems.forEach(item=> item.addEventListener('click',()=>{ const action=item.dataset.action; if(action) handleMenuAction(action); closeMenus(); }));

  [chkGuides,chkCrops,chkColor,chkReg,chkSafe,chkShop].forEach(el=> el.addEventListener('change', applyToggles));
  selColorPreset.addEventListener('change', applyColorPreset);

  prevBtn.addEventListener('click',()=>snapTo(curIndex-1));
  nextBtn.addEventListener('click',()=>snapTo(curIndex+1));
  firstBtn.addEventListener('click',()=>snapTo(0));
  lastBtn.addEventListener('click',()=>snapTo(pages.length-1));
  goBtn.addEventListener('click',()=>{ const v=parseInt(gotoEl.value,10)||1; snapTo(v-1); });
  gotoEl.addEventListener('keydown',e=>{ if(e.key==='Enter'){ const v=parseInt(gotoEl.value,10)||1; snapTo(v-1); }});
  window.addEventListener('keydown',e=>{
    if(e.target === gotoEl) return;
    if(e.key==='ArrowRight'||e.key==='PageDown') snapTo(curIndex+1);
    if(e.key==='ArrowLeft'||e.key==='PageUp') snapTo(curIndex-1);
    if(e.key==='Home') snapTo(0);
    if(e.key==='End') snapTo(pages.length-1);
  });

  pdfBtn.addEventListener('click',()=>exportPdf('bleed'));
  pdfTrimBtn.addEventListener('click',()=>exportPdf('trim'));
  window.addEventListener('afterprint', postPrint);

  colCountInput.addEventListener('change',()=> updateSelectedBlock(block=>{ block.columnCount=Math.max(1,parseInt(colCountInput.value,10)||1); }));
  colGapInput.addEventListener('change',()=> updateSelectedBlock(block=>{ block.gap = colGapInput.value || '6mm'; }));
  applyColumnContentBtn.addEventListener('click',()=> updateSelectedBlock(block=>{ block.paragraphs = parseParagraphs(colContentArea.value); }));

  frameTypeSelect.addEventListener('change',()=>{ updateFrameEditors(); updateSelectedBlock(block=>{ block.frameType = frameTypeSelect.value; if(block.frameType==='image'){ block.content=''; } else { block.src=''; } }); });
  [frameXInput,frameYInput,frameWInput,frameHInput].forEach(input=> input.addEventListener('change',()=> updateSelectedBlock(block=>{
    block.x = frameXInput.value || block.x || '20mm';
    block.y = frameYInput.value || block.y || '40mm';
    block.width = frameWInput.value || block.width || '60mm';
    block.height = frameHInput.value || block.height || '40mm';
  })));
  frameHeadingInput.addEventListener('change',()=> updateSelectedBlock(block=>{ block.heading = frameHeadingInput.value || ''; }));
  frameWrapSelect.addEventListener('change',()=> updateSelectedBlock(block=>{ block.wrap = frameWrapSelect.value; }));
  applyFrameContentBtn.addEventListener('click',()=> updateSelectedBlock(block=>{
    if(block.frameType==='image'){
      block.src = frameSrcInput.value || defaultImage;
    } else {
      block.content = frameContentArea.value.trim();
    }
  }));

  deleteBlockBtn.addEventListener('click', deleteSelectedBlock);
  addPageBtn.addEventListener('click',()=> addBlankPage(curIndex));
  duplicatePageBtn.addEventListener('click', duplicateCurrentPage);
  fileLoader.addEventListener('change', handleFileSelection);

  window.addEventListener('resize', buildThumbnails);
  window.addEventListener('beforeunload',e=>{ if(dirty){ e.preventDefault(); e.returnValue=''; } });
  pagesEl.addEventListener('click',e=>{ if(!e.target.closest('.editable-block')) clearSelection(); });

  function handleMenuAction(action){
    switch(action){
      case 'newDoc':
        newDocument();
        break;
      case 'openDoc':
        fileLoader.value='';
        fileLoader.click();
        break;
      case 'saveDoc':
        saveDocument();
        break;
      case 'saveAsDoc':
        saveDocumentAs();
        break;
      case 'exportJSON':
        exportJson();
        break;
      case 'pdfBleed':
        exportPdf('bleed');
        break;
      case 'pdfTrim':
        exportPdf('trim');
        break;
      case 'toggleMirror':
        chkMirror.checked = !chkMirror.checked;
        break;
      case 'addColumns1':
        addColumnsFlow(1);
        break;
      case 'addColumns2':
        addColumnsFlow(2);
        break;
      case 'addColumns3':
        addColumnsFlow(3);
        break;
      case 'addTextFrame':
        addFrame('text');
        break;
      case 'addImageFrame':
        addFrame('image');
        break;
      case 'addPageAfter':
        addBlankPage(curIndex);
        break;
      case 'duplicatePage':
        duplicateCurrentPage();
        break;
      default:
        break;
    }
  }

  function applyToggles(){
    document.body.classList.toggle('hide-guides', !chkGuides.checked);
    document.body.classList.toggle('hide-crops', !chkCrops.checked);
    document.body.classList.toggle('hide-colorbar', !chkColor.checked);
    document.body.classList.toggle('hide-reg', !chkReg.checked);
    document.body.classList.toggle('hide-safe', !chkSafe.checked);
    document.body.classList.toggle('printshop', chkShop.checked);
  }

  function applyColorPreset(){
    const preset = selColorPreset.value;
    const bars = document.querySelectorAll('.marks .colorbar');
    bars.forEach(bar=>{
      bar.innerHTML='';
      let patches = [];
      if(preset==='ugra'){
        patches = ['c','m','y','k'];
        for(let i=0;i<=20;i++){
          const val = Math.round((i/20)*90);
          patches.push('g'+(val||'90'));
        }
      } else {
        patches = ['c','m','y','k','r','g','b','w','g10','g20','g30','g40','g50','g60','g70','g80','g90'];
      }
      patches.forEach(p=>{ const d=document.createElement('div'); d.className='patch '+p; bar.appendChild(d); });
    });
  }

  function renderDocument(){
    pagesEl.innerHTML='';
    docState.pages.forEach((page,idx)=>{
      const sheet=document.createElement('section');
      sheet.className='sheet '+(idx%2?'even':'odd');
      sheet.dataset.index=String(idx);
      sheet.dataset.pageId = page.id;
      const trim=makeTrim(sheet);
      const content=document.createElement('div');
      content.className='content';
      trim.appendChild(content);

      if(page.title || page.strap){
        const head=document.createElement('header');
        head.className='head';
        if(page.title){ const h1=document.createElement('h1'); h1.className='title'; h1.textContent=page.title; head.appendChild(h1); }
        if(page.strap){ const h3=document.createElement('h3'); h3.textContent=page.strap; head.appendChild(h3); }
        content.appendChild(head);
      }

      const wrapLayer=document.createElement('div');
      wrapLayer.className='wrap-layer';
      content.appendChild(wrapLayer);

      const overlay=document.createElement('div');
      overlay.className='frame-layer';
      trim.appendChild(overlay);

      (page.blocks||[]).forEach(block=>{
        if(block.type==='columns'){
          renderColumnsBlock(block, content, idx);
        }
      });

      (page.blocks||[]).forEach(block=>{
        if(block.type==='frame'){
          renderFrame(block, overlay, wrapLayer, idx);
        }
      });

      const foot=document.createElement('footer');
      foot.className='foot';
      const total = docState.pages.length;
      foot.innerHTML='<span>'+(page.footer || docState.metadata?.footerLeft || DEFAULT_FOOTER)+'</span>' +
        '<span>Page '+(idx+1)+' / '+total+' • build '+DOC_VERSION+'</span>';
      content.appendChild(foot);

      addMarks(sheet, idx, docState.pages.length);
      pagesEl.appendChild(sheet);
    });

    pages = Array.from(document.querySelectorAll('.sheet'));
    totEl.textContent = String(pages.length);
    updateNavigationState();
    rebuildObserver();
    buildThumbnails();
    applyColorPreset();
    highlightSelection();
  }

  function renderColumnsBlock(block, container, pageIdx){
    const flow=document.createElement('div');
    flow.className='cols split editable-block';
    flow.dataset.blockId = block.id;
    flow.dataset.type = 'columns';
    flow.dataset.pageIndex = String(pageIdx);
    const count = Math.max(1, parseInt(block.columnCount,10)||1);
    flow.style.columnCount = String(count);
    flow.style.columnGap = block.gap || '6mm';

    const paragraphs = block.paragraphs || [];
    if(paragraphs.length===0){
      const p=document.createElement('p');
      p.textContent='Start typing in the editor to populate this flow.';
      flow.appendChild(p);
    } else {
      paragraphs.forEach(text=>{
        const entry = (text||'').trim();
        if(!entry) return;
        if(entry.startsWith('### ')){
          const h3=document.createElement('h3');
          h3.textContent=entry.slice(4);
          flow.appendChild(h3);
        } else if(entry.startsWith('## ')){
          const h2=document.createElement('h2');
          h2.textContent=entry.slice(3);
          flow.appendChild(h2);
        } else {
          const p=document.createElement('p');
          p.textContent=entry;
          flow.appendChild(p);
        }
      });
    }

    flow.addEventListener('click', handleBlockClick, {capture:true});
    container.appendChild(flow);
  }

  function renderFrame(block, overlayLayer, wrapLayer, pageIdx){
    const frame=document.createElement('div');
    frame.className='frame editable-block';
    frame.dataset.blockId = block.id;
    frame.dataset.type = 'frame';
    frame.dataset.pageIndex = String(pageIdx);
    frame.style.left = block.x || '30mm';
    frame.style.top = block.y || '40mm';
    frame.style.width = block.width || '60mm';
    frame.style.height = block.height || '40mm';

    if(block.frameType==='image'){
      frame.classList.add('image-frame');
      if(block.heading){
        const heading=document.createElement('div');
        heading.className='frame-heading';
        heading.textContent=block.heading;
        frame.appendChild(heading);
      }
      const img=document.createElement('img');
      img.src = block.src || defaultImage;
      img.alt = block.heading || 'DocuMonster frame image';
      frame.appendChild(img);
    } else {
      frame.classList.add('text-frame');
      if(block.heading){
        const heading=document.createElement('div');
        heading.className='frame-heading';
        heading.textContent=block.heading;
        frame.appendChild(heading);
      }
      const chunks = (block.content || '').split(/
{2,}/).map(s=>s.trim()).filter(Boolean);
      if(chunks.length===0){
        chunks.push('Add your frame copy here.');
      }
      chunks.forEach(chunk=>{
        const p=document.createElement('p');
        p.textContent=chunk;
        frame.appendChild(p);
      });
    }

    frame.addEventListener('click', handleBlockClick, {capture:true});
    overlayLayer.appendChild(frame);

    const wrap = block.wrap || 'overlay';
    if(wrap !== 'overlay'){
      const wrapBox=document.createElement('div');
      wrapBox.className='wrap-box '+(wrap==='push' ? 'push' : wrap);
      const height = block.height || '40mm';
      wrapBox.style.height = height;
      wrapBox.style.marginTop = block.y || '0';
      if(wrap==='push'){
        wrapBox.style.width='100%';
      } else if(wrap==='wrap-left'){
        wrapBox.style.width = block.width || '40mm';
        wrapBox.style.marginLeft = block.x || '0';
      } else if(wrap==='wrap-right'){
        wrapBox.style.width = block.width || '40mm';
        wrapBox.style.marginRight = block.x || '0';
      }
      wrapLayer.appendChild(wrapBox);
    }
  }

  function handleBlockClick(e){
    e.stopPropagation();
    const target = e.currentTarget;
    const pageIdx = parseInt(target.dataset.pageIndex,10) || 0;
    const blockId = target.dataset.blockId;
    selectBlock(pageIdx, blockId);
  }

  function selectBlock(pageIdx, blockId){
    selectedBlock = {pageIndex:pageIdx, blockId:blockId};
    highlightSelection();
    updateEditor();
  }

  function clearSelection(){
    selectedBlock = null;
    highlightSelection();
    updateEditor();
  }

  function highlightSelection(){
    document.querySelectorAll('[data-block-id].selected').forEach(el=>el.classList.remove('selected'));
    if(!selectedBlock) return;
    const selector = '[data-block-id="'+selectedBlock.blockId+'"][data-page-index="'+selectedBlock.pageIndex+'"]';
    const el = pagesEl.querySelector(selector);
    if(el) el.classList.add('selected');
  }

  function updateEditor(){
    pageLabel.textContent = pages.length ? (curIndex+1)+' / '+pages.length : '0 / 0';
    deleteBlockBtn.disabled = !selectedBlock;
    editColumns.classList.remove('active');
    editFrame.classList.remove('active');
    editNone.classList.remove('hidden');

    if(!selectedBlock){
      return;
    }

    const found = findBlock(selectedBlock);
    if(!found.block){
      selectedBlock = null;
      updateEditor();
      return;
    }

    if(found.block.type==='columns'){
      editColumns.classList.add('active');
      editNone.classList.add('hidden');
      colCountInput.value = found.block.columnCount || 1;
      colGapInput.value = found.block.gap || '6mm';
      colContentArea.value = (found.block.paragraphs || []).join('\n\n');
    } else if(found.block.type==='frame'){
      editFrame.classList.add('active');
      editNone.classList.add('hidden');
      frameTypeSelect.value = found.block.frameType || 'text';
      frameXInput.value = found.block.x || '30mm';
      frameYInput.value = found.block.y || '40mm';
      frameWInput.value = found.block.width || '60mm';
      frameHInput.value = found.block.height || '40mm';
      frameHeadingInput.value = found.block.heading || '';
      frameWrapSelect.value = found.block.wrap || 'overlay';
      frameContentArea.value = found.block.content || '';
      frameSrcInput.value = found.block.src || defaultImage;
      updateFrameEditors();
    }
  }

  function updateFrameEditors(){
    if(frameTypeSelect.value === 'image'){
      frameTextWrapper.classList.add('hidden');
      frameImageWrapper.classList.remove('hidden');
    } else {
      frameTextWrapper.classList.remove('hidden');
      frameImageWrapper.classList.add('hidden');
    }
  }

  function parseParagraphs(input){
    const chunks = (input||'').split(/\n\s*\n/).map(s=>s.trim()).filter(Boolean);
    return chunks.length ? chunks : ['Add your story here.'];
  }

  function updateSelectedBlock(mutator){
    if(!selectedBlock) return;
    const found = findBlock(selectedBlock);
    if(!found.block) return;
    mutator(found.block, found.page);
    markDirty();
    persistDoc();
    renderDocument();
    selectBlock(selectedBlock.pageIndex, selectedBlock.blockId);
  }

  function deleteSelectedBlock(){
    if(!selectedBlock) return;
    const found = findBlock(selectedBlock);
    if(!found.block) return;
    const idx = found.page.blocks.indexOf(found.block);
    if(idx>=0){
      found.page.blocks.splice(idx,1);
      selectedBlock = null;
      markDirty();
      persistDoc();
      renderDocument();
      updateEditor();
    }
  }

  function addColumnsFlow(columns){
    const block = {
      type:'columns',
      id: nextId('flow'),
      columnCount: columns,
      gap: columns>=3 ? '5mm' : '6mm',
      paragraphs: generateFlowParagraphs(columns)
    };
    insertBlock(block);
  }

  function addFrame(type){
    const block = {
      type:'frame',
      id: nextId('frame'),
      frameType: type,
      heading: type==='text' ? 'New Callout' : 'Image Callout',
      content: type==='text' ? generateFrameText() : '',
      src: type==='image' ? defaultImage : '',
      x: '32mm',
      y: '82mm',
      width: type==='image' ? '70mm' : '64mm',
      height: type==='image' ? '56mm' : '54mm',
      wrap: type==='image' ? 'wrap-right' : 'overlay'
    };
    insertBlock(block);
  }

  function insertBlock(block){
    if(!docState.pages.length){
      docState.pages.push(createBlankPage('New Spread'));
    }
    const page = docState.pages[curIndex];
    page.blocks = page.blocks || [];
    let insertAt = page.blocks.length;
    if(selectedBlock && selectedBlock.pageIndex===curIndex){
      const found = findBlock(selectedBlock);
      const idx = found.page.blocks.indexOf(found.block);
      if(idx>=0) insertAt = idx+1;
    }
    page.blocks.splice(insertAt,0,block);
    markDirty();
    persistDoc();
    renderDocument();
    selectBlock(curIndex, block.id);
  }

  function addBlankPage(afterIndex){
    const page = createBlankPage('New Spread '+(docState.pages.length+1));
    const insertAt = Math.max(0, Math.min(docState.pages.length, afterIndex+1));
    docState.pages.splice(insertAt,0,page);
    markDirty();
    persistDoc();
    renderDocument();
    snapTo(insertAt,{behavior:'auto'});
  }

  function duplicateCurrentPage(){
    if(!docState.pages.length) return;
    const original = docState.pages[curIndex];
    const copy = clonePage(original);
    const insertAt = curIndex+1;
    docState.pages.splice(insertAt,0,copy);
    markDirty();
    persistDoc();
    renderDocument();
    snapTo(insertAt,{behavior:'auto'});
  }

  function newDocument(){
    if(dirty && !confirm('Discard unsaved changes?')) return;
    docState = createInitialDoc();
    syncIdCounter(docState);
    currentFileName = null;
    selectedBlock = null;
    markSaved();
    persistDoc();
    renderDocument();
    snapTo(0,{behavior:'auto'});
    updateEditor();
  }

  function saveDocument(){
    const name = currentFileName || ('DocuMonster-'+new Date().toISOString().slice(0,10)+'.dmon');
    downloadDoc(name);
  }

  function saveDocumentAs(){
    const suggestion = currentFileName || ('DocuMonster-'+Date.now()+'.dmon');
    const name = prompt('Save document as', suggestion);
    if(!name) return;
    currentFileName = name.endswith('.dmon') ? name : name + '.dmon';
    downloadDoc(currentFileName);
  }

  function downloadDoc(name){
    const payload = packDocument(docState);
    triggerDownload(name, payload);
    markSaved();
  }

  function exportJson(){
    const payload = JSON.stringify(docState, null, 2);
    triggerDownload('documonster.json', payload);
  }

  function exportPdf(mode){
    prePrintCommon();
    if(mode==='bleed'){
      injectPrintStyle('@page{size:216mm 303mm;margin:0} html,body{width:216mm;height:303mm;margin:0;padding:0} #pages{margin:0} .sheet{left:0;top:0;width:216mm!important;height:303mm!important;margin:0!important;position:relative!important} .trim{left:3mm!important;top:3mm!important;width:210mm!important;height:297mm!important} :root{--m-top:12mm;--m-bot:12mm;--m-in:12mm;--m-out:12mm}');
      setTimeout(()=>window.print(),100);
    } else {
      const prev={crops:chkCrops.checked,color:chkColor.checked,reg:chkReg.checked};
      chkCrops.checked=false; chkColor.checked=false; chkReg.checked=false;
      applyToggles();
      injectPrintStyle('@page{size:210mm 297mm;margin:0} html,body{width:210mm;height:297mm;margin:0;padding:0} #pages{margin:0} .sheet{left:0;top:0;width:210mm!important;height:297mm!important;margin:0!important;position:relative!important} .trim{left:0!important;top:0!important;width:210mm!important;height:297mm!important} :root{--m-top:12mm;--m-bot:12mm;--m-in:12mm;--m-out:12mm}');
      setTimeout(()=>window.print(),100);
      const restore=()=>{
        chkCrops.checked=prev.crops; chkColor.checked=prev.color; chkReg.checked=prev.reg;
        applyToggles();
        window.removeEventListener('afterprint', restore);
      };
      window.addEventListener('afterprint', restore);
    }
  }

  function prePrintCommon(){
    applyToggles();
    document.body.classList.toggle('pdf-mirror', !!chkMirror.checked);
    thumbsEl.innerHTML='';
    closeMenus();
    window.scrollTo({top:0,behavior:'auto'});
  }

  function postPrint(){
    const t=document.getElementById('print-style');
    if(t) t.remove();
    renderDocument();
    snapTo(curIndex,{behavior:'auto'});
  }

  function injectPrintStyle(css){
    let t=document.getElementById('print-style');
    if(t) t.remove();
    t=document.createElement('style');
    t.id='print-style';
    t.type='text/css';
    t.appendChild(document.createTextNode(css));
    document.head.appendChild(t);
  }

  function makeTrim(sheet){
    const t=document.createElement('div');
    t.className='trim';
    ['tl','tr','bl','br'].forEach(c=>{
      const m=document.createElement('div');
      m.className='crop '+c;
      t.appendChild(m);
    });
    sheet.appendChild(t);
    return t;
  }

  function addMarks(sheet, idx, total){
    const m=document.createElement('div');
    m.className='marks';
    const cb=document.createElement('div');
    cb.className='colorbar';
    m.appendChild(cb);
    const info=document.createElement('div');
    info.className='info';
    info.textContent = OS_RELEASE+' • v'+DOC_VERSION+' — page '+(idx+1)+'/'+total;
    m.appendChild(info);
    ['tl','tr','bl','br'].forEach(pos=>{
      const r=document.createElement('div');
      r.className='reg '+pos;
      m.appendChild(r);
    });
    const safe=document.createElement('div');
    safe.className='safe-area';
    m.appendChild(safe);
    const slur=document.createElement('div');
    slur.className='slur';
    m.appendChild(slur);
    sheet.appendChild(m);
  }

  function buildThumbnails(){
    thumbsEl.innerHTML='';
    if(!pages.length) return;
    const r=pages[0].getBoundingClientRect();
    const baseW=r.width||pages[0].offsetWidth||1000;
    const baseH=r.height||pages[0].offsetHeight||1400;
    pages.forEach((p,idx)=>{
      const wrap=document.createElement('div');
      wrap.className='thumb';
      wrap.dataset.index=String(idx);
      const mini=document.createElement('div');
      mini.className='mini-wrap';
      const clone=p.cloneNode(true);
      clone.style.pointerEvents='none';
      mini.appendChild(clone);
      wrap.appendChild(mini);
      const meta=document.createElement('div');
      meta.className='mini-meta';
      meta.textContent='Page '+(idx+1);
      wrap.appendChild(meta);
      wrap.addEventListener('click',()=>snapTo(idx));
      thumbsEl.appendChild(wrap);
      const availW=mini.clientWidth;
      let scale=availW/baseW;
      if(!isFinite(scale)||scale<=0){ scale=0.2; }
      clone.style.transformOrigin='top left';
      clone.style.transform='scale('+scale.toFixed(4)+')';
      mini.style.height=(baseH*scale)+'px';
    });
    setActiveThumb();
  }

  function setActiveThumb(){
    thumbsEl.querySelectorAll('.thumb.active').forEach(el=>el.classList.remove('active'));
    const t=thumbsEl.querySelector('.thumb[data-index="'+curIndex+'"]');
    if(t) t.classList.add('active');
  }

  function updateNavigationState(){
    if(pages.length){
      curEl.textContent = String(curIndex+1);
      gotoEl.value = String(curIndex+1);
    } else {
      curEl.textContent = '0';
      gotoEl.value = '0';
    }
    gotoEl.max = String(Math.max(1, pages.length || 1));
    prevBtn.disabled = curIndex<=0;
    firstBtn.disabled = curIndex<=0;
    nextBtn.disabled = curIndex>=pages.length-1 || !pages.length;
    lastBtn.disabled = curIndex>=pages.length-1 || !pages.length;
    pageLabel.textContent = pages.length ? (curIndex+1)+' / '+pages.length : '0 / 0';
  }

  function snapTo(idx, opts){
    if(!pages.length) return;
    const clamped=Math.max(0,Math.min(pages.length-1,idx));
    curIndex=clamped;
    updateNavigationState();
    setActiveThumb();
    const behavior = opts && opts.behavior ? opts.behavior : 'smooth';
    if(behavior !== 'none'){
      pages[clamped].scrollIntoView({behavior, block:'start'});
    }
    updateEditor();
  }

  function handleIntersection(entries){
    let topMost=null;
    let topY=Infinity;
    entries.forEach(entry=>{
      if(entry.isIntersecting){
        const rect=entry.target.getBoundingClientRect();
        if(rect.top>=0 && rect.top<topY){
          topY=rect.top;
          topMost=entry.target;
        }
      }
    });
    if(topMost){
      const idx=pages.indexOf(topMost);
      if(idx>=0 && idx!==curIndex){
        curIndex=idx;
        updateNavigationState();
        setActiveThumb();
        updateEditor();
      }
    }
  }

  function rebuildObserver(){
    observer.disconnect();
    pages.forEach(p=>observer.observe(p));
  }

  function markDirty(){
    dirty = true;
    updateStatus();
  }

  function markSaved(){
    dirty = false;
    updateStatus();
  }

  function updateStatus(){
    editorStatus.textContent = (dirty ? 'Modified' : 'Saved') + (currentFileName ? ' • '+currentFileName : '');
  }

  function persistDoc(){
    try{
      const payload = packDocument(docState);
      localStorage.setItem(STORAGE_KEY, payload);
    } catch(err){
      console.warn('DocuMonster storage write failed', err);
    }
  }

  function triggerDownload(name, data){
    const blob=new Blob([data], {type:'text/plain'});
    const url=URL.createObjectURL(blob);
    const a=document.createElement('a');
    a.href=url;
    a.download=name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(()=>URL.revokeObjectURL(url), 1000);
  }
  function handleFileSelection(evt){
    const file = evt.target.files && evt.target.files[0];
    if(!file) return;
    const reader = new FileReader();
    reader.onload = e=>{
      try{
        importDocument(e.target.result, file.name);
      } catch(err){
        alert('Unable to load document: '+err.message);
        console.error(err);
      }
    };
    reader.readAsText(file);
  }

  function importDocument(raw, fileName){
    const doc = unpackDocument(raw);
    if(!doc || !Array.isArray(doc.pages)){
      throw new Error('Invalid DocuMonster file');
    }
    docState = doc;
    syncIdCounter(docState);
    currentFileName = fileName || null;
    selectedBlock = null;
    markSaved();
    persistDoc();
    renderDocument();
    snapTo(0,{behavior:'auto'});
    updateEditor();
  }

  function closeMenus(){
    menus.forEach(menu=>menu.classList.remove('open'));
  }

  function findBlock(sel){
    if(!sel) return {};
    const page = docState.pages[sel.pageIndex];
    if(!page) return {};
    const block = (page.blocks||[]).find(b=>b.id===sel.blockId);
    return {page, block};
  }

  function loadDocFromStorage(){
    try{
      const raw = localStorage.getItem(STORAGE_KEY);
      if(!raw) return null;
      return unpackDocument(raw);
    } catch(err){
      console.warn('DocuMonster storage unavailable', err);
      return null;
    }
  }

  function packDocument(doc){
    const json = JSON.stringify(doc);
    return FORMAT_PREFIX + compressToBase64(json);
  }

  function unpackDocument(raw){
    if(!raw) return null;
    if(raw.startsWith(FORMAT_PREFIX)){
      const payload = raw.slice(FORMAT_PREFIX.length);
      const json = decompressFromBase64(payload);
      return JSON.parse(json);
    }
    return JSON.parse(raw);
  }

  function syncIdCounter(doc){
    let max=0;
    doc.pages.forEach(page=>{
      max=Math.max(max, extractId(page.id));
      (page.blocks||[]).forEach(block=>{
        max=Math.max(max, extractId(block.id));
      });
    });
    idCounter = max+1;
  }

  function extractId(id){
    const match = /-(\d+)$/.exec(id||'');
    return match ? parseInt(match[1],10) : 0;
  }

  function nextId(prefix){
    return prefix+'-'+(idCounter++);
  }

  function generateFlowParagraphs(cols){
    return [
      '## '+cols+'-Column Mix',
      'DocuMonster balances '+cols+' column '+(cols>1?'flows':'flow')+' while preserving precise gutters and bleed.',
      '### Edit & iterate',
      'Use the editor pane to tweak gaps, headings, and magazine-ready wrap behaviours.',
      'Keep press marks visible with the Output menu even while experimenting with layouts.'
    ];
  }

  function generateFrameText(){
    const phrase = highlightPhrases[Math.floor(Math.random()*highlightPhrases.length)] || 'DocuMonster layout';
    return 'Pin feature highlights into this frame.\nUse wrap controls to orchestrate magazine layouts.\n'+phrase+' ready.';
  }

  function createBlankPage(title){
    return {
      id: nextId('page'),
      title: title || 'New Spread',
      strap: 'Compose freely',
      footer: DEFAULT_FOOTER,
      blocks: [
        {
          type:'columns',
          id: nextId('flow'),
          columnCount:2,
          gap:'6mm',
          paragraphs:[
            '## Fresh layout',
            'Start typing to replace this placeholder copy.',
            'Use the Edit menu to add frames or more flows.'
          ]
        }
      ]
    };
  }

  function clonePage(page){
    const copy = JSON.parse(JSON.stringify(page));
    copy.id = nextId('page');
    copy.blocks = (copy.blocks||[]).map(block=>{
      const b = Object.assign({}, block);
      b.id = nextId(block.type==='frame' ? 'frame' : 'flow');
      return b;
    });
    return copy;
  }

  function createInitialDoc(){
    const doc = {
      name: 'DocuMonster Launch Guide',
      codename: OS_RELEASE,
      metadata: { footerLeft: DEFAULT_FOOTER },
      pages: []
    };

    doc.pages.push({
      id: nextId('page'),
      title: 'Blueprint the Issue',
      strap: 'Plan • Compose • Export',
      footer: DEFAULT_FOOTER,
      blocks: [
        {
          type:'columns',
          id: nextId('flow'),
          columnCount:2,
          gap:'6mm',
          paragraphs:[
            '## Welcome to DocuMonster OS',
            'DocuMonster Workbench 3.11R introduces AmiPro-inspired menus, rapid layout serialization, and polished PDF export toggles right in the browser.',
            '### Snapshot-ready documents',
            'Use the File menu to save compressed .dmon files or load previous spreads instantly. Layout fidelity is preserved down to every millimetre.',
            'The Output menu routes to press-ready bleed signatures or trim proofs without leaving your creative flow.'
          ]
        },
        {
          type:'frame',
          id: nextId('frame'),
          frameType:'text',
          heading:'Launch Capsule',
          content: generateFrameText(),
          x:'122mm',
          y:'46mm',
          width:'66mm',
          height:'52mm',
          wrap:'wrap-left'
        },
        {
          type:'columns',
          id: nextId('flow'),
          columnCount:3,
          gap:'5mm',
          paragraphs:[
            '## Command palette',
            'Mix column flows on the same page, add spotlight frames, or duplicate spreads from the Edit menu.',
            '### Precision layout',
            'Toggle guides, safe areas, and registration targets live while you design.',
            'Need an inline illustration? Drop a text frame with wrap-right behaviour to weave copy around your art.',
            'DocuMonster keeps thumbnails synced with the current scroll position so long documents stay manageable.'
          ]
        },
        {
          type:'frame',
          id: nextId('frame'),
          frameType:'image',
          heading:'Inking Preview',
          src: defaultImage,
          x:'28mm',
          y:'162mm',
          width:'80mm',
          height:'58mm',
          wrap:'push'
        }
      ]
    });

    doc.pages.push({
      id: nextId('page'),
      title: 'Editorial Playground',
      strap: 'Blend columns, frames, and flows',
      footer: 'Workbench Preview',
      blocks: [
        {
          type:'columns',
          id: nextId('flow'),
          columnCount:1,
          gap:'6mm',
          paragraphs:[
            '## Storyboarding made practical',
            'Start with a one-column draft, then branch into denser layouts. DocuMonster preserves text semantics and print metrics across every revision.',
            '### Intelligent wrap options',
            'Each frame can overlay, push content, or hug left and right margins. Use the editor to tweak coordinates in millimetres or pixels to match your brand grid.'
          ]
        },
        {
          type:'frame',
          id: nextId('frame'),
          frameType:'text',
          heading:'Frame Controls',
          content:'Double-click values in the editor to fine-tune.\nSwitch wrap modes for instant magazine-style layouts.\nExport to JSON to hand off to automation scripts.',
          x:'102mm',
          y:'118mm',
          width:'72mm',
          height:'62mm',
          wrap:'wrap-right'
        },
        {
          type:'columns',
          id: nextId('flow'),
          columnCount:2,
          gap:'7mm',
          paragraphs: generateFlowParagraphs(2)
        },
        {
          type:'columns',
          id: nextId('flow'),
          columnCount:3,
          gap:'6mm',
          paragraphs: generateFlowParagraphs(3)
        }
      ]
    });

    return doc;
  }
  function compressToBase64(input){
    if(input == null) return '';
    return LZ.compressToBase64(input);
  }

  function decompressFromBase64(input){
    if(!input) return '';
    return LZ.decompressFromBase64(input);
  }

  const LZ = (function(){
    const f = String.fromCharCode;
    const keyStrBase64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
    const baseReverseDic = {};

    function getBaseValue(alphabet, character){
      if(!baseReverseDic[alphabet]){
        baseReverseDic[alphabet] = {};
        for(let i=0;i<alphabet.length;i++){
          baseReverseDic[alphabet][alphabet.charAt(i)] = i;
        }
      }
      return baseReverseDic[alphabet][character];
    }

    function compressToBase64(input){
      if(input == null) return '';
      const res = _compress(input, 6, a=>keyStrBase64.charAt(a));
      switch(res.length % 4){
        default:
        case 0: return res;
        case 1: return res+'===';
        case 2: return res+'==';
        case 3: return res+'=';
      }
    }

    function decompressFromBase64(input){
      if(!input) return '';
      input = input.replace(/=+$/, '');
      return _decompress(input.length, 32, index=>getBaseValue(keyStrBase64, input.charAt(index)));
    }

    function _compress(uncompressed, bitsPerChar, getCharFromInt){
      if(uncompressed == null) return '';
      let i, value;
      const context_dictionary = {};
      const context_dictionaryToCreate = {};
      let context_c;
      let context_wc;
      let context_w = '';
      let context_enlargeIn = 2;
      let context_dictSize = 3;
      let context_numBits = 2;
      const context_data = [];
      let context_data_val = 0;
      let context_data_position = 0;

      for(i=0; i<uncompressed.length; i+=1){
        context_c = uncompressed.charAt(i);
        if(!Object.prototype.hasOwnProperty.call(context_dictionary, context_c)){
          context_dictionary[context_c] = context_dictSize++;
          context_dictionaryToCreate[context_c] = true;
        }
        context_wc = context_w + context_c;
        if(Object.prototype.hasOwnProperty.call(context_dictionary, context_wc)){
          context_w = context_wc;
        } else {
          if(Object.prototype.hasOwnProperty.call(context_dictionaryToCreate, context_w)){
            if(context_w.charCodeAt(0) < 256){
              for(let j=0;j<context_numBits;j++){
                context_data_val = (context_data_val << 1);
                if(context_data_position == bitsPerChar-1){
                  context_data_position = 0;
                  context_data.push(getCharFromInt(context_data_val));
                  context_data_val = 0;
                } else {
                  context_data_position++;
                }
              }
              value = context_w.charCodeAt(0);
              for(let j=0;j<8;j++){
                context_data_val = (context_data_val << 1) | (value & 1);
                if(context_data_position == bitsPerChar-1){
                  context_data_position = 0;
                  context_data.push(getCharFromInt(context_data_val));
                  context_data_val = 0;
                } else {
                  context_data_position++;
                }
                value >>= 1;
              }
            } else {
              value = 1;
              for(let j=0;j<context_numBits;j++){
                context_data_val = (context_data_val << 1) | value;
                if(context_data_position == bitsPerChar-1){
                  context_data_position = 0;
                  context_data.push(getCharFromInt(context_data_val));
                  context_data_val = 0;
                } else {
                  context_data_position++;
                }
                value = 0;
              }
              value = context_w.charCodeAt(0);
              for(let j=0;j<16;j++){
                context_data_val = (context_data_val << 1) | (value & 1);
                if(context_data_position == bitsPerChar-1){
                  context_data_position = 0;
                  context_data.push(getCharFromInt(context_data_val));
                  context_data_val = 0;
                } else {
                  context_data_position++;
                }
                value >>= 1;
              }
            }
            context_enlargeIn--;
            if(context_enlargeIn === 0){
              context_enlargeIn = Math.pow(2, context_numBits);
              context_numBits++;
            }
            delete context_dictionaryToCreate[context_w];
          } else {
            value = context_dictionary[context_w];
            for(let j=0;j<context_numBits;j++){
              context_data_val = (context_data_val << 1) | (value & 1);
              if(context_data_position == bitsPerChar-1){
                context_data_position = 0;
                context_data.push(getCharFromInt(context_data_val));
                context_data_val = 0;
              } else {
                context_data_position++;
              }
              value >>= 1;
            }
          }
          context_enlargeIn--;
          if(context_enlargeIn === 0){
            context_enlargeIn = Math.pow(2, context_numBits);
            context_numBits++;
          }
          context_dictionary[context_wc] = context_dictSize++;
          context_w = String(context_c);
        }
      }

      if(context_w !== ''){
        if(Object.prototype.hasOwnProperty.call(context_dictionaryToCreate, context_w)){
          if(context_w.charCodeAt(0) < 256){
            for(let j=0;j<context_numBits;j++){
              context_data_val = (context_data_val << 1);
              if(context_data_position == bitsPerChar-1){
                context_data_position = 0;
                context_data.push(getCharFromInt(context_data_val));
                context_data_val = 0;
              } else {
                context_data_position++;
              }
            }
            value = context_w.charCodeAt(0);
            for(let j=0;j<8;j++){
              context_data_val = (context_data_val << 1) | (value & 1);
              if(context_data_position == bitsPerChar-1){
                context_data_position = 0;
                context_data.push(getCharFromInt(context_data_val));
                context_data_val = 0;
              } else {
                context_data_position++;
              }
              value >>= 1;
            }
          } else {
            value = 1;
            for(let j=0;j<context_numBits;j++){
              context_data_val = (context_data_val << 1) | value;
              if(context_data_position == bitsPerChar-1){
                context_data_position = 0;
                context_data.push(getCharFromInt(context_data_val));
                context_data_val = 0;
              } else {
                context_data_position++;
              }
              value = 0;
            }
            value = context_w.charCodeAt(0);
            for(let j=0;j<16;j++){
              context_data_val = (context_data_val << 1) | (value & 1);
              if(context_data_position == bitsPerChar-1){
                context_data_position = 0;
                context_data.push(getCharFromInt(context_data_val));
                context_data_val = 0;
              } else {
                context_data_position++;
              }
              value >>= 1;
            }
          }
          context_enlargeIn--;
          if(context_enlargeIn === 0){
            context_enlargeIn = Math.pow(2, context_numBits);
            context_numBits++;
          }
          delete context_dictionaryToCreate[context_w];
        } else {
          value = context_dictionary[context_w];
          for(let j=0;j<context_numBits;j++){
            context_data_val = (context_data_val << 1) | (value & 1);
            if(context_data_position == bitsPerChar-1){
              context_data_position = 0;
              context_data.push(getCharFromInt(context_data_val));
              context_data_val = 0;
            } else {
              context_data_position++;
            }
            value >>= 1;
          }
        }
        context_enlargeIn--;
        if(context_enlargeIn === 0){
          context_enlargeIn = Math.pow(2, context_numBits);
          context_numBits++;
        }
      }

      value = 2;
      for(let j=0;j<context_numBits;j++){
        context_data_val = (context_data_val << 1) | (value & 1);
        if(context_data_position == bitsPerChar-1){
          context_data_position = 0;
          context_data.push(getCharFromInt(context_data_val));
          context_data_val = 0;
        } else {
          context_data_position++;
        }
        value >>= 1;
      }

      while(true){
        context_data_val = (context_data_val << 1);
        if(context_data_position == bitsPerChar-1){
          context_data.push(getCharFromInt(context_data_val));
          break;
        } else {
          context_data_position++;
        }
      }
      return context_data.join('');
    }

    function _decompress(length, resetValue, getNextValue){
      let dictionary = [];
      let next;
      let enlargeIn = 4;
      let dictSize = 4;
      let numBits = 3;
      let entry = '';
      let result = [];
      let w;
      let bits, resb, maxpower, power;
      let c;
      let data = {value:getNextValue(0), position:resetValue, index:1};

      for(let i=0;i<3;i+=1){
        dictionary[i] = i;
      }

      bits = 0; power = 1; maxpower = Math.pow(2,2);
      while(power != maxpower){
        resb = data.value & data.position;
        data.position >>= 1;
        if(data.position === 0){
          data.position = resetValue;
          data.value = getNextValue(data.index++);
        }
        bits |= (resb>0 ? 1:0) * power;
        power <<= 1;
      }
      switch(bits){
        case 0:
          bits = 0; power = 1; maxpower = Math.pow(2,8);
          while(power != maxpower){
            resb = data.value & data.position;
            data.position >>= 1;
            if(data.position === 0){
              data.position = resetValue;
              data.value = getNextValue(data.index++);
            }
            bits |= (resb>0 ? 1:0) * power;
            power <<= 1;
          }
          c = f(bits);
          break;
        case 1:
          bits = 0; power = 1; maxpower = Math.pow(2,16);
          while(power != maxpower){
            resb = data.value & data.position;
            data.position >>= 1;
            if(data.position === 0){
              data.position = resetValue;
              data.value = getNextValue(data.index++);
            }
            bits |= (resb>0 ? 1:0) * power;
            power <<= 1;
          }
          c = f(bits);
          break;
        case 2:
          return '';
      }
      dictionary[3] = c;
      w = c;
      result.push(c);

      while(true){
        if(data.index > length){ return result.join(''); }

        bits = 0; power = 1; maxpower = Math.pow(2,numBits);
        while(power != maxpower){
          resb = data.value & data.position;
          data.position >>= 1;
          if(data.position === 0){
            data.position = resetValue;
            data.value = getNextValue(data.index++);
          }
          bits |= (resb>0 ? 1:0) * power;
          power <<= 1;
        }

        switch(c = bits){
          case 0:
            bits = 0; power = 1; maxpower = Math.pow(2,8);
            while(power != maxpower){
              resb = data.value & data.position;
              data.position >>= 1;
              if(data.position === 0){
                data.position = resetValue;
                data.value = getNextValue(data.index++);
              }
              bits |= (resb>0 ? 1:0) * power;
              power <<= 1;
            }
            dictionary[dictSize++] = f(bits);
            c = dictSize-1;
            enlargeIn--;
            break;
          case 1:
            bits = 0; power = 1; maxpower = Math.pow(2,16);
            while(power != maxpower){
              resb = data.value & data.position;
              data.position >>= 1;
              if(data.position === 0){
                data.position = resetValue;
                data.value = getNextValue(data.index++);
              }
              bits |= (resb>0 ? 1:0) * power;
              power <<= 1;
            }
            dictionary[dictSize++] = f(bits);
            c = dictSize-1;
            enlargeIn--;
            break;
          case 2:
            return result.join('');
        }

        if(enlargeIn === 0){
          enlargeIn = Math.pow(2, numBits);
          numBits++;
        }

        if(dictionary[c]){
          entry = dictionary[c];
        } else {
          if(c === dictSize){
            entry = w + w.charAt(0);
          } else {
            return '';
          }
        }
        result.push(entry);

        dictionary[dictSize++] = w + entry.charAt(0);
        enlargeIn--;
        w = entry;

        if(enlargeIn === 0){
          enlargeIn = Math.pow(2, numBits);
          numBits++;
        }
      }
    }

    return {compressToBase64, decompressFromBase64};
  })();

})();
