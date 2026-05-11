WinAPI.createWindow('activity');

window.fetchActivity = async function() {
    const el = document.getElementById('activity-area');
    if (!el) return;
    el.textContent = 'Loading...';
    try {
        const res = await fetch('https://www.boredapi.com/api/activity/');
        const data = await res.json();
        el.textContent = data.activity;
    } catch {
        el.textContent = 'Error fetching activity.';
    }
};

fetchActivity();
