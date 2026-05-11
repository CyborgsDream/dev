const id = WinAPI.createWindow('notes');

const win = document.getElementById(id);
const area = win?.querySelector('#notes-area');
if (area) {
    const key = 'notes-content';
    area.value = localStorage.getItem(key) || '';
    area.addEventListener('input', () => {
        localStorage.setItem(key, area.value);
    });
}
