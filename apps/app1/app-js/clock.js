const id = WinAPI.createWindow('clock');

function getClockLocale() {
    const data = window.appData || {};
    return (data.settings && data.settings.clockFormat) || navigator.language || 'en-US';
}

const container = document.getElementById(id);
const el = container?.querySelector('#live-clock');
const btn = container?.querySelector('#toggle-clock-format');
let use24 = false;
const locale = getClockLocale();

function update() {
    if (el) el.textContent = new Date().toLocaleTimeString(locale, { hour12: !use24 });
}

setInterval(update, 1000);
update();
if (btn) {
    btn.onclick = () => {
        use24 = !use24;
        btn.textContent = use24 ? '12h' : '24h';
        console.log('Clock format toggled:', use24 ? '24h' : '12h');
        update();
    };
}
