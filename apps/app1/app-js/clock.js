WinAPI.createWindow('clock');

function getClockLocale() {
    const data = window.appData || {};
    return (data.settings && data.settings.clockFormat) || navigator.language || 'en-US';
}

setInterval(() => {
    const el = document.getElementById('live-clock');
    if (el) {
        el.textContent = new Date().toLocaleTimeString(getClockLocale());
    }
}, 1000);
