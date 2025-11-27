const id = WinAPI.createWindow('terminal');

const win = document.getElementById(id);
const screen = win?.querySelector('.terminal-screen');
const outputEl = win?.querySelector('.terminal-output');
const inputEl = win?.querySelector('.terminal-input');
const hintsEl = win?.querySelector('.terminal-hints');

const ORBIT_VERSION = typeof window !== 'undefined' && window.ORBIT_VERSION
    ? window.ORBIT_VERSION
    : '0.2.0';

const terminalConfig = typeof window !== 'undefined' && window.ORBIT_TERMINAL_CONFIG
    ? window.ORBIT_TERMINAL_CONFIG
    : {};

const commandResponses = new Map();
const exactResponses = new Map();
const customPatterns = new Map();
let wildcardResponse = null;

function registerResponse(pattern, value, targetMap) {
    const trimmed = (pattern || '').trim();
    if (!trimmed) return;
    const key = trimmed.toLowerCase();
    customPatterns.set(key, trimmed);
    targetMap.set(key, { pattern: trimmed, response: value });
}

if (terminalConfig && typeof terminalConfig === 'object' && terminalConfig.responses) {
    const entries = Object.entries(terminalConfig.responses);
    entries.forEach(([pattern, value]) => {
        if (pattern === '*') {
            wildcardResponse = value;
            return;
        }
        if (pattern.includes(' ')) {
            registerResponse(pattern, value, exactResponses);
        } else {
            registerResponse(pattern, value, commandResponses);
        }
    });
}

const defaultFallback = 'Executed "{command}".';

function applyTemplate(str, context) {
    return str.replace(/\{(command|cmd|args|version|date|time|arg(\d+))\}/gi, (match, token, index) => {
        if (!token) return match;
        const lower = token.toLowerCase();
        if (lower === 'command') return context.command;
        if (lower === 'cmd') return context.cmd;
        if (lower === 'args') return context.args;
        if (lower === 'version') return context.version;
        if (lower === 'date') return context.date;
        if (lower === 'time') return context.time;
        if (lower.startsWith('arg')) {
            const argIndex = Number(index);
            if (Number.isFinite(argIndex)) {
                return context.argsArray[argIndex] ?? '';
            }
        }
        return match;
    });
}

function renderResponse(value, context, prefix = '') {
    const lines = [];
    const enqueue = (line, injectedPrefix = prefix) => {
        if (typeof line !== 'string') {
            line = line != null ? String(line) : '';
        }
        const formatted = applyTemplate(line, context);
        formatted.split(/\r?\n/).forEach(part => {
            lines.push(injectedPrefix ? `${injectedPrefix}${part}` : part);
        });
    };

    const process = (input, injectedPrefix = prefix) => {
        if (input == null) {
            return;
        }
        if (Array.isArray(input)) {
            input.forEach(item => process(item, injectedPrefix));
            return;
        }
        if (typeof input === 'object') {
            const typePrefix = input.type ? `[${String(input.type).toUpperCase()}] ` : injectedPrefix;
            let consumed = false;
            if (Array.isArray(input.lines)) {
                input.lines.forEach(item => process(item, typePrefix));
                consumed = true;
            }
            if (typeof input.message === 'string') {
                enqueue(input.message, typePrefix);
                consumed = true;
            }
            if (!consumed) {
                enqueue(JSON.stringify(input), injectedPrefix);
            }
            return;
        }
        enqueue(input, injectedPrefix);
    };

    process(value, prefix);
    return lines;
}

function createContext(rawInput, command, args) {
    const now = new Date();
    return {
        command: rawInput,
        cmd: command,
        args: args.join(' '),
        argsArray: args,
        version: ORBIT_VERSION,
        date: now.toLocaleDateString(),
        time: now.toLocaleTimeString()
    };
}

function resolveCustomResponse(input, command, args) {
    const context = createContext(input, command, args);
    const exact = exactResponses.get(input.toLowerCase());
    if (exact) {
        return { context, lines: renderResponse(exact.response, context) };
    }
    const cmdEntry = commandResponses.get(command.toLowerCase());
    if (cmdEntry) {
        return { context, lines: renderResponse(cmdEntry.response, context) };
    }
    if (wildcardResponse != null) {
        return { context, lines: renderResponse(wildcardResponse, context) };
    }
    return { context, lines: null };
}

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
        const lines = [
            'Available commands:',
            '  help       Show this help message',
            '  clear      Clear the screen',
            '  date       Show the current date',
            '  time       Show the current time',
            '  version    Display Orbit OS version',
            '  echo TEXT  Repeat the provided text'
        ];
        const custom = Array.from(customPatterns.values())
            .filter(pattern => pattern && pattern !== '*')
            .sort((a, b) => a.localeCompare(b));
        if (custom.length) {
            lines.push('', 'Custom responses:');
            custom.forEach(pattern => {
                const display = pattern.includes(' ') ? `  "${pattern}"` : `  ${pattern}`;
                lines.push(display);
            });
        }
        if (wildcardResponse != null) {
            lines.push('', 'Wildcard handler active for unmatched commands.');
        }
        appendOutput(lines);
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
        appendOutput(`Orbit OS v${ORBIT_VERSION}`);
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
        return;
    }

    const { context, lines } = resolveCustomResponse(input, cmd, args);
    if (Array.isArray(lines) && lines.length) {
        appendOutput(lines);
        return;
    }

    const fallbackSource = terminalConfig.fallback ?? defaultFallback;
    const fallbackLines = renderResponse(fallbackSource, context);
    if (fallbackLines.length) {
        appendOutput(fallbackLines);
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

const introContext = createContext('', '', []);
const bannerSource = terminalConfig.banner ?? [
    'Orbit OS v{version} CLI',
    '(c) 2025 CyborgsDream',
    'System date: {date}',
    'System time: {time}',
    ''
];
const bannerLines = renderResponse(bannerSource, introContext);
if (bannerLines.length) {
    appendOutput(bannerLines);
}

const hintMessage = typeof terminalConfig.hint === 'string'
    ? terminalConfig.hint
    : 'Type <strong>help</strong> to list available commands.';
showHints(hintMessage);
updateInput();
