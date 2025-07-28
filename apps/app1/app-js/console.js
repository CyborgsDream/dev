const id = WinAPI.createWindow('console-log');
import('../../shared/consolelogs.js').then(({ initConsoleLogs }) => {
    const el = document.getElementById(id)?.querySelector('.console-log-window');
    if (el) initConsoleLogs({ container: el, removeAfter: null });
});
