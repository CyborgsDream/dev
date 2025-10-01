const id = WinAPI.createWindow('text-editor');

const win = document.getElementById(id);
const root = win?.querySelector('.text-editor');
const textarea = win?.querySelector('#text-editor-area');
const exportBtn = win?.querySelector('#text-editor-export');
const statusEl = win?.querySelector('#text-editor-status');
const statsEl = win?.querySelector('#text-editor-stats');
const menu = win?.querySelector('.text-editor-menu');
const optionsPanel = win?.querySelector('#text-editor-options');
const optionsBtn = menu?.querySelector('[data-action="options"]');
const fileInput = win?.querySelector('#text-editor-file');
const wrapToggle = win?.querySelector('#text-editor-option-wrap');
const monoToggle = win?.querySelector('#text-editor-option-mono');
const autosaveToggle = win?.querySelector('#text-editor-option-autosave');
const filenameInput = win?.querySelector('#text-editor-option-filename');
const restoreBtn = win?.querySelector('#text-editor-restore');

if (optionsPanel) {
    optionsPanel.hidden = true;
    optionsPanel.setAttribute('aria-hidden', 'true');
}

if (statusEl && !statusEl.dataset.state) {
    statusEl.dataset.state = 'info';
}

const STORAGE_KEY = 'orbit-textedit-draft';
const SETTINGS_KEY = 'orbit-textedit-settings';
const defaultSettings = {
    wrap: true,
    monospace: true,
    autosave: true,
    filename: 'orbit-notes.txt'
};

let statusTimeout = null;
let autoSaveTimeout = null;
let optionsVisible = false;
let settings = { ...defaultSettings };
let currentFilename = defaultSettings.filename;

function loadJsPDF(callback) {
    if (window.jspdf) {
        callback();
        return;
    }
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js';
    script.onload = callback;
    document.head.appendChild(script);
}

function parseSettings() {
    try {
        const stored = localStorage.getItem(SETTINGS_KEY);
        if (!stored) return;
        const parsed = JSON.parse(stored);
        if (typeof parsed === 'object' && parsed) {
            settings = {
                ...defaultSettings,
                ...parsed
            };
        }
    } catch (error) {
        console.warn('Orbit OS text editor: unable to parse settings.', error);
    }
}

function persistSettings() {
    try {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch (error) {
        console.warn('Orbit OS text editor: unable to persist settings.', error);
    }
}

function sanitizeFilename(name) {
    if (typeof name !== 'string') return defaultSettings.filename;
    const cleaned = name.replace(/[\\/:*?"<>|]+/g, '_').trim();
    if (!cleaned) return defaultSettings.filename;
    return /\.[A-Za-z0-9]+$/.test(cleaned) ? cleaned : `${cleaned}.txt`;
}

function setStatus(message, type = 'info', persist = false) {
    if (!statusEl) return;
    statusEl.textContent = message;
    statusEl.dataset.state = type;
    if (statusTimeout) {
        clearTimeout(statusTimeout);
        statusTimeout = null;
    }
    if (!persist) {
        statusTimeout = setTimeout(() => {
            if (statusEl.dataset.state === type) {
                statusEl.textContent = 'Ready.';
                statusEl.dataset.state = 'info';
            }
        }, 4000);
    }
}

function updateStats() {
    if (!textarea || !statsEl) return;
    const text = textarea.value.trim();
    const wordCount = text ? text.split(/\s+/).length : 0;
    const charCount = textarea.value.length;
    statsEl.textContent = `Words: ${wordCount} | Characters: ${charCount}`;
}

function toggleOptions(force) {
    if (!optionsPanel || !optionsBtn) return;
    const shouldShow = typeof force === 'boolean' ? force : !optionsVisible;
    optionsVisible = shouldShow;
    optionsPanel.setAttribute('aria-hidden', shouldShow ? 'false' : 'true');
    optionsPanel.hidden = !shouldShow;
    optionsBtn.setAttribute('aria-expanded', shouldShow ? 'true' : 'false');
}

function applySettings() {
    if (!root || !textarea) return;
    currentFilename = sanitizeFilename(settings.filename);
    if (filenameInput && document.activeElement !== filenameInput) {
        filenameInput.value = currentFilename;
    }
    if (wrapToggle) {
        wrapToggle.checked = Boolean(settings.wrap);
    }
    if (monoToggle) {
        monoToggle.checked = Boolean(settings.monospace);
    }
    if (autosaveToggle) {
        autosaveToggle.checked = Boolean(settings.autosave);
    }
    root.classList.toggle('text-editor--wrap', Boolean(settings.wrap));
    root.classList.toggle('text-editor--mono', Boolean(settings.monospace));
    textarea.wrap = settings.wrap ? 'soft' : 'off';
}

function saveDraftToStorage() {
    if (!textarea) return;
    try {
        localStorage.setItem(STORAGE_KEY, textarea.value);
    } catch (error) {
        console.warn('Orbit OS text editor: unable to save draft.', error);
    }
}

function scheduleAutoSave() {
    if (!settings.autosave || !textarea) return;
    if (autoSaveTimeout) {
        clearTimeout(autoSaveTimeout);
    }
    autoSaveTimeout = setTimeout(() => {
        saveDraftToStorage();
        setStatus('Draft auto-saved.', 'success');
    }, 1500);
}

function createDownload(blob, filename) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

function handleSave() {
    if (!textarea) return;
    const filename = sanitizeFilename(filenameInput?.value || settings.filename);
    settings.filename = filename;
    currentFilename = filename;
    persistSettings();
    saveDraftToStorage();
    if (autoSaveTimeout) {
        clearTimeout(autoSaveTimeout);
        autoSaveTimeout = null;
    }
    createDownload(new Blob([textarea.value], { type: 'text/plain' }), filename);
    setStatus(`Saved as ${filename}.`, 'success');
}

function handleLoadFromFile(file) {
    if (!textarea || !file) return;
    const reader = new FileReader();
    reader.onload = () => {
        const value = typeof reader.result === 'string' ? reader.result : '';
        textarea.value = value;
        updateStats();
        settings.filename = sanitizeFilename(file.name || settings.filename);
        currentFilename = settings.filename;
        persistSettings();
        if (filenameInput) {
            filenameInput.value = currentFilename;
        }
        saveDraftToStorage();
        setStatus(`Loaded ${currentFilename}.`, 'success');
    };
    reader.onerror = () => {
        setStatus('Failed to load file.', 'warning');
    };
    reader.readAsText(file);
}

function restoreDraft() {
    if (!textarea) return;
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved == null) {
        setStatus('No saved draft found.', 'warning');
        return;
    }
    textarea.value = saved;
    updateStats();
    setStatus('Draft restored from local storage.', 'success');
}

function handleAction(action) {
    if (!textarea) return;
    switch (action) {
        case 'options':
            toggleOptions();
            return;
        case 'new':
            if (textarea.value.trim() && !confirm('Clear the current document?')) {
                return;
            }
            textarea.value = '';
            updateStats();
            saveDraftToStorage();
            setStatus('New document created.');
            break;
        case 'save':
            handleSave();
            break;
        case 'load':
            if (fileInput) {
                fileInput.click();
            }
            break;
        case 'word-count':
            updateStats();
            setStatus('Word count updated.', 'info');
            break;
        default:
            break;
    }
    if (action !== 'options') {
        toggleOptions(false);
    }
}

parseSettings();
applySettings();

if (menu) {
    menu.addEventListener('click', event => {
        const target = event.target;
        if (!(target instanceof HTMLElement)) return;
        const button = target.closest('[data-action]');
        if (!(button instanceof HTMLElement)) return;
        const action = button.dataset.action;
        if (action) {
            event.preventDefault();
            handleAction(action);
        }
    });
}

if (optionsPanel && optionsBtn && win) {
    win.addEventListener('click', event => {
        const target = event.target;
        if (!(target instanceof HTMLElement)) return;
        if (!optionsVisible) return;
        if (optionsPanel.contains(target) || optionsBtn.contains(target)) return;
        toggleOptions(false);
    });

    win.addEventListener('keydown', event => {
        if (optionsVisible && event.key === 'Escape') {
            event.preventDefault();
            toggleOptions(false);
            optionsBtn.focus();
        }
    });
}

if (wrapToggle) {
    wrapToggle.addEventListener('change', () => {
        settings.wrap = wrapToggle.checked;
        applySettings();
        persistSettings();
        setStatus(`Soft wrap ${settings.wrap ? 'enabled' : 'disabled'}.`, 'info');
    });
}

if (monoToggle) {
    monoToggle.addEventListener('change', () => {
        settings.monospace = monoToggle.checked;
        applySettings();
        persistSettings();
        setStatus(`Monospace mode ${settings.monospace ? 'enabled' : 'disabled'}.`, 'info');
    });
}

if (autosaveToggle) {
    autosaveToggle.addEventListener('change', () => {
        settings.autosave = autosaveToggle.checked;
        persistSettings();
        setStatus(`Auto-save ${settings.autosave ? 'enabled' : 'disabled'}.`, 'info');
        if (!settings.autosave && autoSaveTimeout) {
            clearTimeout(autoSaveTimeout);
            autoSaveTimeout = null;
        }
    });
}

if (filenameInput) {
    filenameInput.addEventListener('change', () => {
        const cleaned = sanitizeFilename(filenameInput.value);
        filenameInput.value = cleaned;
        settings.filename = cleaned;
        currentFilename = cleaned;
        persistSettings();
        setStatus(`Default filename set to ${cleaned}.`, 'info');
    });
}

if (restoreBtn) {
    restoreBtn.addEventListener('click', () => {
        restoreDraft();
        toggleOptions(false);
    });
}

if (fileInput) {
    fileInput.addEventListener('change', () => {
        const files = fileInput.files;
        if (files && files[0]) {
            handleLoadFromFile(files[0]);
        }
        fileInput.value = '';
        toggleOptions(false);
    });
}

if (textarea) {
    textarea.addEventListener('input', () => {
        updateStats();
        setStatus('Editing…');
        if (settings.autosave) {
            scheduleAutoSave();
        }
    });

    const savedDraft = localStorage.getItem(STORAGE_KEY);
    if (savedDraft && savedDraft !== textarea.value) {
        textarea.value = savedDraft;
        setStatus('Restored auto-saved draft.', 'success');
    }
    updateStats();
}

if (exportBtn && textarea) {
    exportBtn.addEventListener('click', () => {
        loadJsPDF(() => {
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();
            const lines = doc.splitTextToSize(textarea.value || '', 180);
            doc.text(lines, 10, 10);
            const pdfName = sanitizeFilename(settings.filename || defaultSettings.filename).replace(/\.[^.]+$/, '') + '.pdf';
            doc.save(pdfName);
            setStatus('PDF exported successfully.', 'success');
        });
    });
}
