// Version: 0.0.8
// Codename: Celestia
// Basic THREE.js example with multiple objects
import * as THREE from 'https://unpkg.com/three@0.159.0/build/three.module.js';
import { FontLoader } from 'https://unpkg.com/three@0.159.0/examples/jsm/loaders/FontLoader.js?module';
import { TextGeometry } from 'https://unpkg.com/three@0.159.0/examples/jsm/geometries/TextGeometry.js?module';
const consoleLogEl = document.getElementById('console-log');
if (consoleLogEl) {
  const methods = ['log', 'info', 'warn', 'error'];
  const original = {};
  methods.forEach(m => {
    original[m] = console[m].bind(console);
    console[m] = (...args) => {
      original[m](...args);
      const msg = args
        .map(a => (typeof a === 'object' ? JSON.stringify(a) : String(a)))
        .join(' ');
      const line = document.createElement('div');
      line.className = `console-line ${m}`;
      line.textContent = `[${m}] ${msg}`;
      consoleLogEl.appendChild(line);
      consoleLogEl.scrollTop = consoleLogEl.scrollHeight;
      setTimeout(() => line.remove(), 12000);
    };
  });
}
console.log('Responsive boilerplate loaded');

// Initialize scene
const container = document.getElementById('scene-container');
const fpsCounter = document.getElementById('fps-counter');
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  75,
  container.clientWidth / container.clientHeight,
  0.1,
  1000
);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(container.clientWidth, container.clientHeight);
renderer.setClearColor(0x000033);
renderer.shadowMap.enabled = true;
container.appendChild(renderer.domElement);

  // Ground with custom height pattern
  console.info('Generating ground geometry');
  const groundSize = 32;
  const groundGeo = new THREE.PlaneGeometry(
    groundSize,
    groundSize,
    groundSize,
    groundSize
  );
  const pos = groundGeo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const height = i % 2 === 0 ? 0 : -1;
    pos.setZ(i, height);
  }
  groundGeo.computeVertexNormals();

  const groundMat = new THREE.MeshStandardMaterial({ color: 0x222222 });
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = 0;
  ground.receiveShadow = true;
  scene.add(ground);
  console.info('Ground added', ground.position);

  // Lighting
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
  scene.add(ambientLight);
  console.info('Ambient light added');

  const dirLight = new THREE.DirectionalLight(0xffffff, 0.9);
  dirLight.position.set(5, 10, 5);
  dirLight.castShadow = true;
  dirLight.shadow.mapSize.width = 2048;
  dirLight.shadow.mapSize.height = 2048;
  dirLight.shadow.camera.left = -15;
  dirLight.shadow.camera.right = 15;
  dirLight.shadow.camera.top = 15;
  dirLight.shadow.camera.bottom = -15;
  dirLight.shadow.camera.near = 1;
  dirLight.shadow.camera.far = 50;
  scene.add(dirLight);
  console.info('Directional light added');

  // Helper function to create elevated mesh
  function createMesh(geometry, color, x, z = 1) {
    const material = new THREE.MeshStandardMaterial({ color });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, 1.5, z); // lowered to center objects
    mesh.castShadow = true;
    scene.add(mesh);
    return mesh;
  }

  // Create objects
  const mesh1 = createMesh(new THREE.IcosahedronGeometry(1.2), 0xff6600, -4);
  const mesh2 = createMesh(new THREE.TorusGeometry(0.9, 0.3, 16, 30), 0x0096D6, 0);
  const mesh3 = createMesh(new THREE.DodecahedronGeometry(1.2), 0x9932cc, 4);
  console.info('Meshes created', mesh1.position, mesh2.position, mesh3.position);

  // 3D text heading
  let textMesh;
  const fontLoader = new FontLoader();
  fontLoader.load(
    'https://unpkg.com/three@0.159.0/examples/fonts/helvetiker_regular.typeface.json',
    font => {
      const textGeo = new TextGeometry('DEMOS', {
        font: font,
        size: 1,
        height: 0.2,
        curveSegments: 12,
        bevelEnabled: true,
        bevelThickness: 0.02,
        bevelSize: 0.02,
        bevelSegments: 2
      });
      textGeo.center();
      const textMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
      textMat.onBeforeCompile = shader => {
        shader.uniforms.time = { value: 0 };
        shader.vertexShader = shader.vertexShader.replace(
          '#include <common>',
          '#include <common>\nuniform float time;'
        );
        shader.vertexShader = shader.vertexShader.replace(
          '#include <begin_vertex>',
          `vec3 transformed = vec3(position);
           transformed.x += sin(2.0 * position.y + time * 2.0) * 0.1;
           transformed.y += sin(2.0 * position.x + time * 2.0) * 0.1;`
        );
        textMesh.userData.shader = shader;
      };
      textMesh = new THREE.Mesh(textGeo, textMat);
      textMesh.position.set(0, 4.2, 0.5);
      textMesh.rotation.x = -Math.PI / 8;
      scene.add(textMesh);
      console.info('3D text added', textMesh.position);
    }
  );

  camera.position.set(0, 7, 5);
  camera.lookAt(0, 2, 0);

  let lastTime;
  let frames = 0;

  function animate(timestamp) {
    requestAnimationFrame(animate);
    if (lastTime === undefined) lastTime = timestamp;
    frames++;
    if (timestamp - lastTime >= 1000) {
      const fps = Math.round((frames * 1000) / (timestamp - lastTime));
      if (fpsCounter) fpsCounter.textContent = fps + ' FPS';
      frames = 0;
      lastTime = timestamp;
    }
    [mesh1, mesh2, mesh3].forEach(mesh => {
      mesh.rotation.x += 0.005;
      mesh.rotation.y += 0.01;
    });
    if (textMesh && textMesh.userData.shader) {
      textMesh.userData.shader.uniforms.time.value = timestamp / 1000;
    }
    renderer.render(scene, camera);
  }

  function onWindowResize() {
    const width = container.clientWidth;
    const height = container.clientHeight;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
    checkOrientation();
    console.info('Window resized', { width, height });
  }

  function checkOrientation() {
    const isLandscape = window.matchMedia('(orientation: landscape)').matches;
    const isMobile = window.innerWidth <= 768;
    if (isMobile && isLandscape) {
      if (!document.fullscreenElement && container.requestFullscreen) {
        container.requestFullscreen();
      }
    } else {
      if (document.fullscreenElement && document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
    console.info('Orientation checked', { isLandscape, isMobile });
  }

  window.addEventListener('resize', onWindowResize);
  window.addEventListener('orientationchange', checkOrientation);
  window.addEventListener('click', checkOrientation);
  window.addEventListener('touchend', checkOrientation);
  onWindowResize();
  checkOrientation();

  requestAnimationFrame(animate);

