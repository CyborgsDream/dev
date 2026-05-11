const id = WinAPI.createWindow('clock');

function getClockLocale() {
    const data = window.appData || {};
    return (data.settings && data.settings.clockFormat) || navigator.language || 'en-US';
}

const container = document.getElementById(id);
const timeEl = container?.querySelector('#gshock-time');
const dayEl = container?.querySelector('#gshock-day');
const dateEl = container?.querySelector('#gshock-date');
const modeEl = container?.querySelector('#gshock-mode');
const ampmEl = container?.querySelector('#gshock-ampm');
const toggleBtn = container?.querySelector('#gshock-toggle');
const locale = getClockLocale();
let use24 = false;

function formatTime(date) {
    if (use24) {
        return date.toLocaleTimeString('en-GB', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
    }
    const time = date.toLocaleTimeString(locale, { hour12: true, hour: '2-digit', minute: '2-digit', second: '2-digit' });
    return time.replace(/ /g, '');
}

function updateClock() {
    const now = new Date();
    if (timeEl) timeEl.textContent = formatTime(now);
    if (dayEl) dayEl.textContent = now.toLocaleDateString(locale, { weekday: 'short' }).toUpperCase();
    if (dateEl) dateEl.textContent = now.toLocaleDateString(locale, { month: 'short', day: '2-digit' }).toUpperCase();
    if (modeEl) modeEl.textContent = use24 ? '24H' : '12H';
    if (ampmEl) ampmEl.textContent = use24 ? ' ' : now.toLocaleTimeString(locale, { hour12: true }).slice(-2).toUpperCase();
}

if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
        use24 = !use24;
        toggleBtn.classList.toggle('active');
        updateClock();
    });
}

updateClock();
setInterval(updateClock, 1000);
