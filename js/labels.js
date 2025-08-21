let container;
export const labels = [];

export function initLabels(cont) {
  container = cont;
}

export function addLabel(
  mesh,
  text,
  colorHex,
  offsetY = -1,
  className = 'object-label',
  offsetX = 0
) {
  const el = document.createElement(className === 'object-label' ? 'h3' : 'div');
  el.className = className;
  el.style.color = colorHex;
  let letters = null;
  if (className === 'object-label') {
    letters = [];
    el.textContent = '';
    [...text].forEach(ch => {
      const span = document.createElement('span');
      span.textContent = ch;
      span.style.display = 'inline-block';
      letters.push({ el: span, phase: Math.random() * Math.PI * 2 });
      el.appendChild(span);
    });
  } else {
    el.textContent = text;
  }
  container.appendChild(el);
  labels.push({ mesh, el, offsetY, offsetX, phase: Math.random() * Math.PI * 2, letters });
}

export function updateLabels(camera, timestamp) {
  labels.forEach(({ mesh, el, offsetY, offsetX, phase, letters }) => {
    const pos = mesh.position.clone();
    pos.y += offsetY;
    pos.project(camera);
    const x = (pos.x * 0.5 + 0.5) * container.clientWidth + offsetX;
    let y = (-pos.y * 0.5 + 0.5) * container.clientHeight;
    const wave = Math.sin(timestamp / 1000 + phase) * 5;
    y += 55 + wave;
    if (el.classList.contains('object-label')) {
      y -= 20;
    }
    el.style.transform = `translate(-50%, 0) translate(${x}px, ${y}px)`;
    if (letters) {
      letters.forEach(({ el: letterEl, phase: lp }) => {
        const offset = Math.sin(timestamp / 400 + lp) * 3;
        letterEl.style.transform = `translateY(${offset}px)`;
      });
    }
  });
}
