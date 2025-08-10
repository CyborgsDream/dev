// Simple in-browser console log monitor
let installed = false;
let containers = [];
let history = [];
let logFilter = null; // Set of log levels to display
const methods = ['log', 'info', 'warn', 'error'];
const original = {};

function appendLine(type, msg, el) {
  const line = document.createElement('div');
  line.className = `console-line ${type}`;
  line.textContent = `[${type}] ${msg}`;
  el.appendChild(line);
  el.scrollTop = el.scrollHeight;
  return line;
}

export function initConsoleLogs({ container, removeAfter = 3000, filter } = {}) {
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

  if (filter && Array.isArray(filter) && filter.length) {
    logFilter = new Set(filter);
  }

  containers.push({ el: container, removeAfter });
  history.forEach(({ type, msg }) => {
    if (logFilter && !logFilter.has(type)) return;
    appendLine(type, msg, container);
  });

  if (!installed) {
    installed = true;
    methods.forEach(m => {
      original[m] = console[m].bind(console);
      console[m] = (...args) => {
        original[m](...args);
        const msg = args
          .map(a => {
            try {
              return typeof a === 'object' ? JSON.stringify(a) : String(a);
            } catch {
              return String(a);
            }
          })
          .join(' ');
        history.push({ type: m, msg });
        if (logFilter && !logFilter.has(m)) return;
        containers.forEach(({ el, removeAfter: rm }) => {
          const line = appendLine(m, msg, el);
          if (rm) setTimeout(() => line.remove(), rm);
        });
      };
    });
  }

  function setFilter(types) {
    logFilter = types && types.length ? new Set(types) : null;
    containers.forEach(({ el }) => {
      el.innerHTML = '';
      history.forEach(({ type, msg }) => {
        if (logFilter && !logFilter.has(type)) return;
        appendLine(type, msg, el);
      });
    });
  }

  function clear() {
    history = [];
    containers.forEach(({ el }) => (el.innerHTML = ''));
  }

  function restore() {
    // revert console methods and clear state
    methods.forEach(m => (console[m] = original[m]));
    installed = false;
    containers = [];
    history = [];
    logFilter = null;
  }

  return { container, restore, setFilter, clear };
}
