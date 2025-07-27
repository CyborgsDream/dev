WinAPI.createWindow('clock');
setInterval(() => {
    const el = document.getElementById('live-clock');
    if (el) {
        el.textContent = new Date().toLocaleTimeString();
    }
}, 1000);
