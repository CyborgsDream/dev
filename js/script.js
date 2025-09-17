// Version: 0.1.1
// Codename: Celestia
// Basic THREE.js example with multiple objects
import * as THREE from 'https://unpkg.com/three@0.159.0/build/three.module.js';
import { initConsoleLogs } from '../shared/consolelogs.js';
import { initLabels, addLabel } from './labels.js';
import { initScene, scene, meshes, renderer, camera } from './scene.js';
import { initInteraction } from './interaction.js';

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

// Simple character placed in front of the camera
const character = new THREE.Group();
const body = new THREE.Mesh(
  new THREE.BoxGeometry(0.5, 1.5, 0.3),
  new THREE.MeshStandardMaterial({ color: 0x00ff00 })
);
body.position.y = 0.75;
body.castShadow = true;
const head = new THREE.Mesh(
  new THREE.SphereGeometry(0.35, 16, 16),
  new THREE.MeshStandardMaterial({ color: 0xffcc99 })
);
head.position.y = 1.6;
head.castShadow = true;
character.add(body);
character.add(head);
character.scale.setScalar(0.7);
character.position.set(0, 1.2, 2.8);
scene.add(character);

const radius = 4;
apps.forEach((app, i) => {
  const angle = (i / apps.length) * Math.PI * 2;
  const x = Math.cos(angle) * radius;
  const z = Math.sin(angle) * radius;
  const geometry = i % 2 === 0
    ? new THREE.IcosahedronGeometry(0.85)
    : new THREE.TorusGeometry(0.65, 0.2, 16, 30);
  const color = i % 2 === 0 ? 0xff6600 : 0x0096d6;
  const mesh = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ color }));
  mesh.position.set(x, 1.7, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  scene.add(mesh);
  meshes.push(mesh);
  const offsetX = x < 0 ? -20 : 20;
  addLabel(mesh, app.name, labelColor, -1, 'object-label', offsetX);
  addLabel(mesh, app.short, labelColor, -1.5, 'object-info', offsetX);
});

initInteraction({ container, renderer, camera, meshes, apps });

function bindHold(btn, action) {
  let interval;
  btn.addEventListener('pointerdown', e => {
    e.preventDefault();
    action();
    interval = setInterval(action, 100);
  });
  ['pointerup', 'pointerleave', 'touchend', 'touchcancel'].forEach(ev =>
    btn.addEventListener(ev, () => clearInterval(interval))
  );
}

function setupTouchControls() {
  const forwardBtn = document.getElementById('move-forward');
  const backBtn = document.getElementById('move-back');
  const leftBtn = document.getElementById('move-left');
  const rightBtn = document.getElementById('move-right');
  const zoomInBtn = document.getElementById('zoom-in');
  const zoomOutBtn = document.getElementById('zoom-out');
  const moveStep = 0.2;
  const zoomStep = 2;
  bindHold(forwardBtn, () => {
    camera.position.z -= moveStep;
    camera.lookAt(0, 2, 0);
  });
  bindHold(backBtn, () => {
    camera.position.z += moveStep;
    camera.lookAt(0, 2, 0);
  });
  bindHold(leftBtn, () => {
    camera.position.x -= moveStep;
    camera.lookAt(0, 2, 0);
  });
  bindHold(rightBtn, () => {
    camera.position.x += moveStep;
    camera.lookAt(0, 2, 0);
  });
  bindHold(zoomInBtn, () => {
    camera.fov = Math.max(20, camera.fov - zoomStep);
    camera.updateProjectionMatrix();
  });
  bindHold(zoomOutBtn, () => {
    camera.fov = Math.min(100, camera.fov + zoomStep);
    camera.updateProjectionMatrix();
  });
}

setupTouchControls();
