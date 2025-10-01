const id = WinAPI.createWindow('text-editor');

const win = document.getElementById(id);
const textarea = win?.querySelector('#text-editor-area');
const exportBtn = win?.querySelector('#text-editor-export');
const statusEl = win?.querySelector('#text-editor-status');
const statsEl = win?.querySelector('#text-editor-stats');
const menu = win?.querySelector('.text-editor-menu');

const STORAGE_KEY = 'orbit-textedit-draft';
let statusTimeout = null;

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

function handleAction(action) {
    if (!textarea) return;
    switch (action) {
        case 'new':
            if (textarea.value.trim() && !confirm('Clear the current document?')) {
                return;
            }
            textarea.value = '';
            updateStats();
            setStatus('New document created.');
            break;
        case 'save':
            localStorage.setItem(STORAGE_KEY, textarea.value);
            setStatus('Draft saved to local storage.', 'success');
            break;
        case 'load': {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved == null) {
                setStatus('No saved draft found.', 'warning');
            } else {
                textarea.value = saved;
                updateStats();
                setStatus('Draft loaded from local storage.', 'success');
            }
            break;
        }
        case 'word-count':
            updateStats();
            setStatus('Word count updated.', 'info');
            break;
    }
}

if (menu) {
    menu.addEventListener('click', event => {
        const target = event.target;
        if (!(target instanceof HTMLElement)) return;
        const action = target.dataset.action;
        if (action) {
            event.preventDefault();
            handleAction(action);
        }
    });
}

if (textarea) {
    textarea.addEventListener('input', () => {
        updateStats();
        setStatus('Editing…');
    });
    updateStats();
}

if (exportBtn && textarea) {
    exportBtn.addEventListener('click', () => {
        loadJsPDF(() => {
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();
            const lines = doc.splitTextToSize(textarea.value || '', 180);
            doc.text(lines, 10, 10);
            doc.save('document.pdf');
            setStatus('PDF exported successfully.', 'success');
        });
    });
}

setStatus('Ready.', 'info', true);
