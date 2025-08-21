// Version: 0.1.0
// Codename: Celestia
// Basic THREE.js example with multiple objects
import * as THREE from 'https://unpkg.com/three@0.159.0/build/three.module.js';
import { initConsoleLogs } from '../shared/consolelogs.js';
import { initLabels, addLabel } from './labels.js';
import { initScene, scene, meshes, renderer, camera } from './scene.js';
import { initInteraction } from './interaction.js';

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
  addLabel(mesh, app.name, '#fff', -1, 'object-label', offsetX);
  addLabel(mesh, app.short, '#fff', -1.5, 'object-info', offsetX);
});

initInteraction({ container, renderer, camera, meshes, apps });
