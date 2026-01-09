import * as THREE from 'https://unpkg.com/three@0.159.0/build/three.module.js';

export let selectApp;
export let hideAppInfo;
export let onPick;

export function initInteraction({ container, renderer, camera, meshes, apps, onSelect }) {
  const infoBox = document.getElementById('app-info');
  const infoTitle = infoBox.querySelector('h2');
  const infoText = infoBox.querySelector('p');
  const runBtn = document.getElementById('run-app');
  const closeBtn = document.getElementById('close-info');
  let ignoreNextContainerClick = false;
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();
  let activeIndex = -1;
  let hoveredIndex = -1;

  function getMeshFromIntersect(intersect) {
    let obj = intersect.object;
    while (obj && !meshes.includes(obj)) {
      obj = obj.parent;
    }
    return obj;
  }

  function applyHighlight() {
    const targetIndex = hoveredIndex !== -1 ? hoveredIndex : activeIndex;
    meshes.forEach((mesh, i) => {
      const highlight = mesh.userData && mesh.userData.highlight;
      if (highlight) highlight.visible = i === targetIndex;
    });
  }

  function ensureInfoBoxVisible() {
    if (infoBox.style.display !== 'block') {
      infoBox.style.display = 'block';
    }
    if (!infoBox.classList.contains('visible')) {
      requestAnimationFrame(() => infoBox.classList.add('visible'));
    }
  }

  function updateInfoBox(index) {
    const data = apps[index];
    infoTitle.textContent = data.name;
    infoText.textContent = data.long;
    runBtn.onclick = e => {
      e.stopPropagation();
      window.location.href = data.file;
    };
    ensureInfoBoxVisible();
  }

  function previewApp(index) {
    hoveredIndex = index;
    updateInfoBox(index);
    applyHighlight();
  }

  selectApp = function (index) {
    const data = apps[index];
    meshes.forEach((m, i) => {
      m.material.transparent = true;
      const baseScale = (m.userData && m.userData.baseScale) || 1;
      if (i === index) {
        m.scale.setScalar(baseScale * 1.35);
        m.material.opacity = 1;
      } else {
        m.scale.setScalar(baseScale);
        m.material.opacity = 0.35;
      }
    });
    updateInfoBox(index);
    runBtn.style.pointerEvents = 'none';
    setTimeout(() => {
      runBtn.style.pointerEvents = 'auto';
    }, 300);
    ignoreNextContainerClick = true;
    activeIndex = index;
    if (typeof onSelect === 'function') {
      onSelect(index);
    }
    hoveredIndex = -1;
    applyHighlight();
  };

  hideAppInfo = function () {
    infoBox.classList.remove('visible');
    setTimeout(() => {
      infoBox.style.display = 'none';
    }, 300);
    meshes.forEach(m => {
      const baseScale = (m.userData && m.userData.baseScale) || 1;
      m.scale.setScalar(baseScale);
      m.material.opacity = 1;
      m.material.transparent = false;
    });
    activeIndex = -1;
    hoveredIndex = -1;
    applyHighlight();
  };

  onPick = function (event) {
    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);
    const hit = raycaster.intersectObjects(meshes, true);
    if (hit.length) {
      const mesh = getMeshFromIntersect(hit[0]);
      if (mesh) selectApp(meshes.indexOf(mesh));
    }
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

  renderer.domElement.addEventListener('pointermove', event => {
    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);
    const hit = raycaster.intersectObjects(meshes, true);
    if (hit.length) {
      const mesh = getMeshFromIntersect(hit[0]);
      if (mesh) {
        const index = meshes.indexOf(mesh);
        if (index !== hoveredIndex) previewApp(index);
        return;
      }
    }
    if (hoveredIndex !== -1) {
      hoveredIndex = -1;
      applyHighlight();
      if (activeIndex === -1) {
        hideAppInfo();
      }
    }
  });
}
