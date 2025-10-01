const id = WinAPI.createWindow('terminal');

const win = document.getElementById(id);
const screen = win?.querySelector('.terminal-screen');
const outputEl = win?.querySelector('.terminal-output');
const inputEl = win?.querySelector('.terminal-input');
const hintsEl = win?.querySelector('.terminal-hints');

if (screen) {
    screen.focus();
    screen.addEventListener('click', () => screen.focus());
}

let buffer = '';
const history = [];
let historyIndex = -1;

function appendOutput(text = '') {
    if (!outputEl) return;
    const lines = Array.isArray(text) ? text : String(text).split('\n');
    lines.forEach(line => {
        const div = document.createElement('div');
        div.className = 'terminal-row';
        div.textContent = line;
        outputEl.appendChild(div);
    });
    outputEl.parentElement?.scrollTo({ top: outputEl.parentElement.scrollHeight });
}

function updateInput() {
    if (!inputEl) return;
    inputEl.textContent = buffer;
    outputEl?.parentElement?.scrollTo({ top: outputEl.parentElement.scrollHeight });
}

function showHints(message) {
    if (!hintsEl) return;
    hintsEl.innerHTML = message;
}

const commands = {
    help() {
        appendOutput([
            'Available commands:',
            '  help       Show this help message',
            '  clear      Clear the screen',
            '  date       Show the current date',
            '  time       Show the current time',
            '  version    Display Orbit OS version',
            '  echo TEXT  Repeat the provided text'
        ]);
    },
    clear() {
        if (outputEl) outputEl.innerHTML = '';
    },
    cls() {
        commands.clear();
    },
    date() {
        appendOutput(new Date().toLocaleDateString());
    },
    time() {
        appendOutput(new Date().toLocaleTimeString());
    },
    version() {
        appendOutput('Orbit OS v0.1.2');
    },
    echo(...args) {
        appendOutput(args.join(' '));
    }
};

function executeCommand(raw) {
    const input = raw.trim();
    appendOutput(`orbit> ${input}`);
    if (!input) return;

    const [cmd, ...args] = input.split(/\s+/);
    const fn = commands[cmd.toLowerCase()];
    if (fn) {
        fn(...args);
    } else {
        appendOutput(`Unknown command: ${cmd}. Type "help".`);
    }
}

if (screen) {
    screen.addEventListener('keydown', event => {
        if (event.key === 'Backspace') {
            event.preventDefault();
            buffer = buffer.slice(0, -1);
            updateInput();
            return;
        }
        if (event.key === 'Enter') {
            event.preventDefault();
            const current = buffer;
            history.push(current);
            historyIndex = history.length;
            executeCommand(current);
            buffer = '';
            updateInput();
            return;
        }
        if (event.key === 'ArrowUp') {
            event.preventDefault();
            if (historyIndex > 0) {
                historyIndex -= 1;
                buffer = history[historyIndex] ?? '';
                updateInput();
            }
            return;
        }
        if (event.key === 'ArrowDown') {
            event.preventDefault();
            if (historyIndex < history.length - 1) {
                historyIndex += 1;
                buffer = history[historyIndex] ?? '';
            } else {
                historyIndex = history.length;
                buffer = '';
            }
            updateInput();
            return;
        }
        if (event.key === 'Tab') {
            event.preventDefault();
            return;
        }
        if (event.key.length === 1 && !event.ctrlKey && !event.metaKey) {
            buffer += event.key;
            updateInput();
            return;
        }
    });
}

appendOutput([
    'Orbit OS v0.1.2 CLI',
    '(c) 2025 CyborgsDream',
    `System date: ${new Date().toLocaleDateString()}`,
    `System time: ${new Date().toLocaleTimeString()}`,
    ''
]);
showHints('Type <strong>help</strong> to list available commands.');
updateInput();
