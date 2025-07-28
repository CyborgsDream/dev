export function initConsoleLogs({container, removeAfter=3000}={}) {
  if (!container) {
    container = document.createElement('div');
    container.id = 'console-log';
    Object.assign(container.style, {
      position: 'absolute', bottom: '0', left: '0', width: '100%',
      maxHeight: '100px', overflowY: 'auto', color: '#0f0',
      background: 'none', fontFamily: 'monospace', fontSize: '0.65rem',
      padding: '2px 4px', pointerEvents: 'none', zIndex: 30
    });
    document.body.appendChild(container);
  }
  const methods = ['log', 'info', 'warn', 'error'];
  const original = {};
  methods.forEach(m => {
    original[m] = console[m].bind(console);
    console[m] = (...args) => {
      original[m](...args);
      const msg = args.map(a => {
        try { return typeof a === 'object' ? JSON.stringify(a) : String(a); }
        catch { return String(a); }
      }).join(' ');
      const line = document.createElement('div');
      line.className = `console-line ${m}`;
      line.textContent = `[${m}] ${msg}`;
      container.appendChild(line);
      container.scrollTop = container.scrollHeight;
      if (removeAfter) setTimeout(() => line.remove(), removeAfter);
    };
  });
  return {
    container,
    restore() { methods.forEach(m => console[m] = original[m]); }
  };
}
