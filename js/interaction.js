import * as THREE from 'https://unpkg.com/three@0.159.0/build/three.module.js';

export let selectApp;
export let hideAppInfo;
export let onPick;

export function initInteraction({ container, renderer, camera, meshes, apps }) {
  const infoBox = document.getElementById('app-info');
  const infoTitle = infoBox.querySelector('h2');
  const infoText = infoBox.querySelector('p');
  const runBtn = document.getElementById('run-app');
  const closeBtn = document.getElementById('close-info');
  let ignoreNextContainerClick = false;
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();

  selectApp = function (index) {
    const data = apps[index];
    meshes.forEach((m, i) => {
      m.material.transparent = true;
      if (i === index) {
        m.scale.set(1.5, 1.5, 1.5);
        m.material.opacity = 1;
      } else {
        m.scale.set(1, 1, 1);
        m.material.opacity = 0.25;
      }
    });
    infoTitle.textContent = data.name;
    infoText.textContent = data.long;
    runBtn.onclick = e => {
      e.stopPropagation();
      window.location.href = data.file;
    };
    runBtn.style.pointerEvents = 'none';
    infoBox.style.display = 'block';
    requestAnimationFrame(() => infoBox.classList.add('visible'));
    setTimeout(() => {
      runBtn.style.pointerEvents = 'auto';
    }, 300);
    ignoreNextContainerClick = true;
  };

  hideAppInfo = function () {
    infoBox.classList.remove('visible');
    setTimeout(() => {
      infoBox.style.display = 'none';
    }, 1000);
    meshes.forEach(m => {
      m.scale.set(1, 1, 1);
      m.material.opacity = 1;
      m.material.transparent = false;
    });
  };

  onPick = function (event) {
    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);
    const hit = raycaster.intersectObjects(meshes);
    if (hit.length) selectApp(meshes.indexOf(hit[0].object));
  };

  closeBtn.addEventListener('pointerdown', hideAppInfo);
  container.addEventListener('pointerdown', e => {
    if (ignoreNextContainerClick) {
      ignoreNextContainerClick = false;
      return;
    }
    if (infoBox.style.display === 'block' && !infoBox.contains(e.target)) {
      hideAppInfo();
    }
  });
  window.addEventListener('keydown', e => {
    if (e.key === 'Escape' && infoBox.style.display === 'block') hideAppInfo();
  });
  renderer.domElement.addEventListener('pointerdown', onPick);
}
