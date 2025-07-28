WinAPI.createWindow('html-studio');

setTimeout(() => {
  const win = document.querySelector('.window:last-of-type');
  if (!win) return;
  const container = win.querySelector('#htmlstudio-container') || win.querySelector('.window-content');
  fetch('html-studio.html')
    .then(r => r.text())
    .then(t => {
      const doc = new DOMParser().parseFromString(t, 'text/html');
      doc.head.querySelectorAll('style,link[rel="stylesheet"]').forEach(el => {
        container.appendChild(el.cloneNode(true));
      });
      doc.body.childNodes.forEach(node => {
        container.appendChild(node.cloneNode(true));
      });
      doc.querySelectorAll('script').forEach(scr => {
        const s = document.createElement('script');
        if (scr.src) s.src = scr.src;
        else s.textContent = scr.textContent;
        container.appendChild(s);
      });
    });
}, 0);
