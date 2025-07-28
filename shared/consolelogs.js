let installed = false;
let containers = [];
const methods = ['log', 'info', 'warn', 'error'];
const original = {};

export function initConsoleLogs({ container, removeAfter = 3000 } = {}) {
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

  containers.push({ el: container, removeAfter });

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
        containers.forEach(({ el, removeAfter: rm }) => {
          const line = document.createElement('div');
          line.className = `console-line ${m}`;
          line.textContent = `[${m}] ${msg}`;
          el.appendChild(line);
          el.scrollTop = el.scrollHeight;
          if (rm) setTimeout(() => line.remove(), rm);
        });
      };
    });
  }

  function restore() {
    methods.forEach(m => (console[m] = original[m]));
    installed = false;
    containers = [];
  }

  return { container, restore };
}
