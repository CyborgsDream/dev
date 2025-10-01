const id = WinAPI.createWindow('calendar');

const calendarWindow = document.getElementById(id);
const headerEl = calendarWindow?.querySelector('#calendar-month-year');
const gridEl = calendarWindow?.querySelector('.calendar-grid');

window.currentDate = new Date();

window.generateCalendarDays = function(date) {
    const year = date.getFullYear();
    const month = date.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDay = firstDay.getDay();

    let daysHtml = '';
    const today = new Date();

    for (let i = 0; i < startDay; i++) {
        daysHtml += '<div class="calendar-day"></div>';
    }

    for (let day = 1; day <= daysInMonth; day++) {
        const isToday = day === today.getDate() &&
                        month === today.getMonth() &&
                        year === today.getFullYear();
        daysHtml += `<div class="calendar-day ${isToday ? 'today' : ''}">${day}</div>`;
    }

    return daysHtml;
};

function renderCalendar(date) {
    if (headerEl) {
        headerEl.textContent = date.toLocaleString('default', { month: 'long', year: 'numeric' });
    }
    if (gridEl) {
        while (gridEl.children.length > 7) {
            gridEl.removeChild(gridEl.lastElementChild);
        }
        gridEl.insertAdjacentHTML('beforeend', window.generateCalendarDays(date));
    }
}

window.changeMonth = function(direction) {
    window.currentDate.setMonth(window.currentDate.getMonth() + direction);
    renderCalendar(window.currentDate);
};

renderCalendar(window.currentDate);
