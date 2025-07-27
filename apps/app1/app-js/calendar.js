WinAPI.createWindow('calendar');

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
        daysHtml += `<div class="calendar-day"></div>`;
    }

    for (let day = 1; day <= daysInMonth; day++) {
        const isToday = day === today.getDate() &&
                        month === today.getMonth() &&
                        year === today.getFullYear();
        daysHtml += `<div class="calendar-day ${isToday ? 'today' : ''}">${day}</div>`;
    }

    return daysHtml;
};

window.changeMonth = function(direction) {
    window.currentDate.setMonth(window.currentDate.getMonth() + direction);
    const header = document.getElementById('calendar-month-year');
    if (header)
        header.textContent = window.currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });

    const calendarGrid = document.querySelector('.calendar-grid');
    if (calendarGrid) {
        for (let i = 7; i < calendarGrid.children.length; i++) {
            calendarGrid.children[i].remove();
        }
        calendarGrid.insertAdjacentHTML('beforeend', window.generateCalendarDays(window.currentDate));
    }
};
