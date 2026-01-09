// Version: 1.9.1
// Codename: Celestia
// Basic THREE.js example with multiple objects
import * as THREE from 'https://unpkg.com/three@0.159.0/build/three.module.js';
import { initConsoleLogs } from '../shared/consolelogs.js';
import { initLabels, addLabel } from './labels.js';
import { initScene, scene, meshes, renderer, camera } from './scene.js';
import { initInteraction, selectApp, hideAppInfo } from './interaction.js';

function applyTheme(theme) {
  const link = document.getElementById('theme-link');
  let href = 'css/style.css';
  if (theme === 'light') href = 'css/style-light.css';
  else if (theme === 'futuristic') href = 'css/style-futuristic.css';
  link.href = href;
}

function selectTheme() {
  return new Promise(resolve => {
    const selector = document.getElementById('theme-selection');
    selector.style.display = 'flex';
    selector.querySelectorAll('button').forEach(btn => {
      btn.addEventListener('click', () => {
        const theme = btn.dataset.theme;
        applyTheme(theme);
        localStorage.setItem('theme', theme);
        selector.style.display = 'none';
        resolve(theme);
      });
    });
  });
}

let theme = localStorage.getItem('theme');
if (!theme) {
  theme = await selectTheme();
} else {
  applyTheme(theme);
}
const labelColor = theme === 'light' ? '#000' : theme === 'futuristic' ? '#0ff' : '#fff';

const { apps } = await fetch('data/index.json').then(r => r.json());
const consoleLogEl = document.getElementById('console-log');
if (consoleLogEl) {
  initConsoleLogs({
    container: consoleLogEl,
    removeAfter: 3000,
    filter: ['info', 'warn', 'error']
  });
}
console.log('DEMOS loaded');

const demoList = document.getElementById('demo-list');
if (demoList) {
  apps.forEach(app => {
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.href = app.file;
    a.textContent = app.name;
    li.appendChild(a);
    demoList.appendChild(li);
  });
}

const container = document.getElementById('scene-container');
const fpsCounter = document.getElementById('fps-counter');

initLabels(container);
initScene(container, fpsCounter);

const arcSpacing = 2.4;
const depthOffset = 0.6;
const depthCurve = 0.45;
const arcCenter = (apps.length - 1) / 2;
const focusPoint = new THREE.Vector3(0, 2, 0);
apps.forEach((app, i) => {
  const offsetIndex = i - arcCenter;
  const x = offsetIndex * arcSpacing;
  const z = depthOffset + Math.abs(offsetIndex) * depthCurve;
  const geometry = i % 2 === 0
    ? new THREE.IcosahedronGeometry(0.95)
    : new THREE.TorusGeometry(0.75, 0.22, 18, 32);
  const color = i % 2 === 0 ? 0xff6600 : 0x0096d6;
  const mesh = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ color }));
  mesh.position.set(x, 1.7, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.userData.baseScale = 1.1;
  mesh.scale.setScalar(mesh.userData.baseScale);
  mesh.userData.focusPoint = focusPoint.clone();

  const highlight = new THREE.LineSegments(
    new THREE.EdgesGeometry(geometry),
    new THREE.LineBasicMaterial({
      color: 0x00fff2,
      transparent: true,
      opacity: 0.95,
      depthTest: false,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    })
  );
  highlight.visible = false;
  highlight.scale.setScalar(1.08);
  highlight.raycast = () => {};
  mesh.add(highlight);
  mesh.userData.highlight = highlight;

  scene.add(mesh);
  meshes.push(mesh);
  const offsetX = offsetIndex < 0 ? -26 : 26;
  addLabel(mesh, app.name, labelColor, -1, 'object-label', offsetX);
  addLabel(mesh, app.short, labelColor, -1.45, 'object-info', offsetX);
});

let currentIndex = -1;
initInteraction({
  container,
  renderer,
  camera,
  meshes,
  apps,
  onSelect: index => {
    currentIndex = index;
  }
});

function setupTouchControls() {
  const touchControls = document.getElementById('touch-controls');
  const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  if (touchControls && isTouchDevice) {
    touchControls.style.display = 'flex';
    touchControls.setAttribute('aria-hidden', 'false');
  }

  const forwardBtn = document.getElementById('move-forward');
  const backBtn = document.getElementById('move-back');
  const leftBtn = document.getElementById('move-left');
  const rightBtn = document.getElementById('move-right');
  const zoomInBtn = document.getElementById('zoom-in');
  const zoomOutBtn = document.getElementById('zoom-out');
  if (!forwardBtn || !backBtn || !leftBtn || !rightBtn || !zoomInBtn || !zoomOutBtn) {
    return;
  }

  const pivot = focusPoint.clone();
  const forwardVec = new THREE.Vector3();
  const orbitOffset = new THREE.Vector3();
  const pivotOffset = new THREE.Vector3();
  const yAxis = new THREE.Vector3(0, 1, 0);
  const state = {
    forwardTarget: 0,
    orbitTarget: 0,
    forward: 0,
    orbit: 0,
    zoomDirectionTarget: 0,
    zoomDirection: 0,
    zoomTarget: camera.fov,
    zoom: camera.fov
  };
  let animationActive = false;
  let lastTime = performance.now();

  function ensureAnimation() {
    if (!animationActive) {
      animationActive = true;
      lastTime = performance.now();
      requestAnimationFrame(step);
    }
  }

  function applyCameraMotion(delta) {
    const moveSpeed = 3.2;
    const orbitSpeed = 1.3;
    const zoomSpeed = 28;
    state.forward = THREE.MathUtils.damp(state.forward, state.forwardTarget, 8, delta);
    state.orbit = THREE.MathUtils.damp(state.orbit, state.orbitTarget, 8, delta);
    state.zoomDirection = THREE.MathUtils.damp(state.zoomDirection, state.zoomDirectionTarget, 10, delta);
    state.zoom = THREE.MathUtils.damp(state.zoom, state.zoomTarget, 12, delta);

    const forwardDelta = state.forward * delta * moveSpeed;
    if (Math.abs(forwardDelta) > 0.0001) {
      camera.getWorldDirection(forwardVec);
      forwardVec.y = 0;
      if (forwardVec.lengthSq() > 0) {
        forwardVec.normalize();
        camera.position.addScaledVector(forwardVec, forwardDelta);
      }
    }

    const orbitDelta = state.orbit * delta * orbitSpeed;
    if (Math.abs(orbitDelta) > 0.0001) {
      orbitOffset.copy(camera.position).sub(pivot);
      orbitOffset.applyAxisAngle(yAxis, orbitDelta);
      camera.position.copy(orbitOffset.add(pivot));
    }

    if (Math.abs(state.zoomDirection) > 0.0001) {
      state.zoomTarget = THREE.MathUtils.clamp(
        state.zoomTarget + state.zoomDirection * delta * zoomSpeed,
        32,
        85
      );
    }

    if (Math.abs(camera.fov - state.zoom) > 0.0001) {
      camera.fov = state.zoom;
      camera.updateProjectionMatrix();
    }

    pivotOffset.copy(camera.position).sub(pivot);
    const minDistance = 4.5;
    const maxDistance = 14;
    const currentDistance = pivotOffset.length();
    if (currentDistance < minDistance || currentDistance > maxDistance) {
      pivotOffset.setLength(THREE.MathUtils.clamp(currentDistance, minDistance, maxDistance));
      camera.position.copy(pivotOffset.add(pivot));
    }

    camera.lookAt(pivot);
  }

  function step() {
    const now = performance.now();
    const delta = Math.min((now - lastTime) / 1000, 0.12);
    lastTime = now;
    applyCameraMotion(delta);

    const isMoving =
      Math.abs(state.forward - state.forwardTarget) > 0.001 ||
      Math.abs(state.orbit - state.orbitTarget) > 0.001 ||
      Math.abs(state.zoomDirection - state.zoomDirectionTarget) > 0.001 ||
      Math.abs(camera.fov - state.zoomTarget) > 0.1 ||
      Math.abs(state.forward) > 0.0005 ||
      Math.abs(state.orbit) > 0.0005 ||
      Math.abs(state.zoomDirection) > 0.0005;

    if (isMoving) {
      requestAnimationFrame(step);
    } else {
      animationActive = false;
    }
  }

  function bindPress(button, start, end) {
    if (!button) return;
    const activePointers = new Set();
    const onPointerDown = event => {
      event.preventDefault();
      activePointers.add(event.pointerId);
      if (activePointers.size === 1 && start) {
        start();
      }
      button.setPointerCapture?.(event.pointerId);
    };
    const onPointerUp = event => {
      if (activePointers.has(event.pointerId)) {
        activePointers.delete(event.pointerId);
        if (activePointers.size === 0 && end) {
          end();
        }
      }
      button.releasePointerCapture?.(event.pointerId);
    };
    button.addEventListener('pointerdown', onPointerDown);
    button.addEventListener('pointerup', onPointerUp);
    button.addEventListener('pointerleave', onPointerUp);
    button.addEventListener('pointercancel', onPointerUp);
    button.addEventListener('lostpointercapture', onPointerUp);
    button.addEventListener('contextmenu', e => e.preventDefault());
  }

  const setForwardTarget = value => {
    if (state.forwardTarget !== value) {
      state.forwardTarget = value;
      ensureAnimation();
    }
  };
  const setOrbitTarget = value => {
    if (state.orbitTarget !== value) {
      state.orbitTarget = value;
      ensureAnimation();
    }
  };
  const setZoomDirection = value => {
    if (state.zoomDirectionTarget !== value) {
      state.zoomDirectionTarget = value;
      ensureAnimation();
    }
  };

  bindPress(forwardBtn, () => setForwardTarget(1), () => setForwardTarget(0));
  bindPress(backBtn, () => setForwardTarget(-1), () => setForwardTarget(0));
  bindPress(leftBtn, () => setOrbitTarget(-1), () => setOrbitTarget(0));
  bindPress(rightBtn, () => setOrbitTarget(1), () => setOrbitTarget(0));
  bindPress(zoomInBtn, () => setZoomDirection(-1), () => setZoomDirection(0));
  bindPress(zoomOutBtn, () => setZoomDirection(1), () => setZoomDirection(0));
}

setupTouchControls();

function setupNavControls() {
  const prevBtn = document.getElementById('nav-prev');
  const nextBtn = document.getElementById('nav-next');
  const closeBtn = document.getElementById('nav-close');
  if (!prevBtn || !nextBtn || !closeBtn) {
    return;
  }

  const stepSelection = direction => {
    if (!selectApp) return;
    let index = currentIndex;
    if (typeof index !== 'number' || index < 0) {
      index = 0;
    }
    index = (index + direction + apps.length) % apps.length;
    currentIndex = index;
    selectApp(index);
  };

  prevBtn.addEventListener('click', () => stepSelection(-1));
  nextBtn.addEventListener('click', () => stepSelection(1));
  closeBtn.addEventListener('click', () => {
    if (hideAppInfo) hideAppInfo();
  });
}

setupNavControls();
