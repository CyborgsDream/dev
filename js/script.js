// Version: 0.1.0
// Codename: Celestia
// Basic THREE.js example with multiple objects
import * as THREE from 'https://unpkg.com/three@0.159.0/build/three.module.js';
import { initConsoleLogs } from '../shared/consolelogs.js';
import { initLabels, addLabel } from './labels.js';
import { initScene, scene, meshes, renderer, camera } from './scene.js';
import { initInteraction } from './interaction.js';

function selectTheme() {
  return new Promise(resolve => {
    const selector = document.getElementById('theme-selection');
    selector.style.display = 'flex';
    selector.querySelectorAll('button').forEach(btn => {
      btn.addEventListener('click', () => {
        const theme = btn.dataset.theme;
          const link = document.getElementById('theme-link');
          let href = 'css/style.css';
          if (theme === 'light') href = 'css/style-light.css';
          else if (theme === 'futuristic') href = 'css/style-futuristic.css';
          link.href = href;
          localStorage.setItem('theme', theme);
          selector.style.display = 'none';
          resolve(theme);
      });
    });
  });
}

const theme = await selectTheme();
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
    a.textContent = app.file;
    li.appendChild(a);
    demoList.appendChild(li);
  });
}

const container = document.getElementById('scene-container');
const fpsCounter = document.getElementById('fps-counter');

initLabels(container);
initScene(container, fpsCounter);

const radius = 4;
apps.forEach((app, i) => {
  const angle = (i / apps.length) * Math.PI * 2;
  const x = Math.cos(angle) * radius;
  const z = Math.sin(angle) * radius;
  const geometry = i % 2 === 0
    ? new THREE.IcosahedronGeometry(1.2)
    : new THREE.TorusGeometry(0.9, 0.3, 16, 30);
  const color = i % 2 === 0 ? 0xff6600 : 0x0096d6;
  const mesh = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ color }));
  mesh.position.set(x, 2, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  scene.add(mesh);
  meshes.push(mesh);
  const offsetX = x < 0 ? -20 : 20;
  addLabel(mesh, app.name, labelColor, -1, 'object-label', offsetX);
  addLabel(mesh, app.short, labelColor, -1.5, 'object-info', offsetX);
});

initInteraction({ container, renderer, camera, meshes, apps });
