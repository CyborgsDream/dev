// Version: 0.1.0
// Codename: Celestia
// Basic THREE.js example with multiple objects
import { initConsoleLogs } from '../shared/consolelogs.js';
import { initLabels, addLabel } from './labels.js';
import { initScene, meshes, renderer, camera } from './scene.js';
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

const offsets = [-20, 20];
apps.forEach((app, i) => {
  const mesh = meshes[i];
  if (!mesh) return;
  const off = offsets[i] || 0;
  addLabel(mesh, app.name, '#fff', -1, 'object-label', off);
  addLabel(mesh, app.short, '#fff', -1.5, 'object-info', off);
});

initInteraction({ container, renderer, camera, meshes, apps });
