// Version: 0.0.13delta
// Codename: Celestia
// Basic THREE.js example with multiple objects
import * as THREE from 'https://unpkg.com/three@0.159.0/build/three.module.js';
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

  const labels = [];
  function addLabel(mesh, text, colorHex, offsetY = -1, className = 'object-label') {
    const el = document.createElement(className === 'object-label' ? 'h3' : 'div');
    el.className = className;
    el.style.color = colorHex;
    el.textContent = text;
    container.appendChild(el);
    labels.push({ mesh, el, offsetY });
  }

  addLabel(mesh1, 'Demo One', '#fff');
  addLabel(mesh1, 'lorem ipsum doloret sit amet', '#fff', -1.5, 'object-info');
  addLabel(mesh2, 'Demo Two', '#fff');
  addLabel(mesh2, 'lorem ipsum doloret sit amet', '#fff', -1.5, 'object-info');
  addLabel(mesh3, 'Demo Three', '#fff');
  addLabel(mesh3, 'lorem ipsum doloret sit amet', '#fff', -1.5, 'object-info');

  // Chunky voxel-style DEMOS heading
  // Each cube will move with a sinusoidal offset along the Z axis
  const LETTERS = {
    D: ['11110', '10001', '10001', '10001', '10001', '10001', '11110'],
    E: ['11111', '10000', '10000', '11110', '10000', '10000', '11111'],
    M: ['10001', '11011', '10101', '10001', '10001', '10001', '10001'],
    O: ['01110', '10001', '10001', '10001', '10001', '10001', '01110'],
    S: ['01111', '10000', '10000', '01110', '00001', '00001', '11110']
  };

  const textCubes = [];

  function createVoxelText(text) {
    const size = 0.4;
    const depth = 0.4;
    const colors = [0xff0000, 0xff5800, 0xffd500, 0x009b48, 0x0045ad, 0xffffff];
    const availableColors = [...colors];
    const group = new THREE.Group();
    let offsetX = 0;
    text.toUpperCase().split('').forEach(ch => {
      const pattern = LETTERS[ch];
      if (!pattern) {
        offsetX += size * 6;
        return;
      }
      const letterGroup = new THREE.Group();
      if (availableColors.length === 0) {
        availableColors.push(...colors);
      }
      const color = availableColors.splice(
        Math.floor(Math.random() * availableColors.length),
        1
      )[0];
      const letterMaterial = new THREE.MeshStandardMaterial({ color });
      pattern.forEach((row, y) => {
        row.split('').forEach((bit, x) => {
          if (bit === '1') {
            const cube = new THREE.Mesh(
              new THREE.BoxGeometry(size, size, depth),
              letterMaterial
            );
            cube.position.set(x * size, (pattern.length - y - 1) * size, 0);
            cube.castShadow = true;
            cube.receiveShadow = true;
            cube.userData.phase = Math.random() * Math.PI * 2; // independent wave
            cube.userData.rotSpeed = new THREE.Vector3(0, 0, 0);
            letterGroup.add(cube);
            textCubes.push(cube);
          }
        });
      });
      const letterBox = new THREE.Box3().setFromObject(letterGroup);
      const letterCenter = letterBox.getCenter(new THREE.Vector3());
      const letterWidth = letterBox.getSize(new THREE.Vector3()).x;
      letterGroup.children.forEach(c => {
        c.position.sub(letterCenter);
        c.userData.initialX = c.position.x;
        c.userData.initialZ = c.position.z;
      });
      letterGroup.position.x = offsetX + letterWidth / 2;
      group.add(letterGroup);
      offsetX += letterWidth + size;
    });
    const box = new THREE.Box3().setFromObject(group);
    const center = box.getCenter(new THREE.Vector3());
    group.children.forEach(c => c.position.sub(center));
    group.scale.set(2 / 3, 2 / 3, 2 / 3);
    group.position.set(0, 4.35, 0.5);
    group.rotation.x = 0; // face the camera directly
    return group;
  }

  const textMesh = createVoxelText('DEMOS');
  scene.add(textMesh);
  console.info('Voxel text added', textMesh.position);

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
    textCubes.forEach(cube => {
      const { rotSpeed } = cube.userData;
      cube.rotation.x += rotSpeed.x;
      cube.rotation.y += rotSpeed.y;
      cube.rotation.z += rotSpeed.z;
    });
    // apply wind effect to each text cube
    textCubes.forEach(cube => {
      const { initialX, initialZ, phase } = cube.userData;
      cube.position.z = initialZ + Math.sin(timestamp / 500 + phase) * 0.1;
      cube.position.x = initialX + Math.sin(timestamp / 600 + phase) * 0.15;
    });
    // update object labels
    labels.forEach(({ mesh, el, offsetY }) => {
      const pos = mesh.position.clone();
      pos.y += offsetY;
      pos.project(camera);
      const x = (pos.x * 0.5 + 0.5) * container.clientWidth;
      const y = (-pos.y * 0.5 + 0.5) * container.clientHeight;
      // position label so its top aligns with the computed point
      el.style.transform = `translate(-50%, 0) translate(${x}px, ${y}px)`;
    });
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

