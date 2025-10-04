import * as THREE from 'https://unpkg.com/three@0.159.0/build/three.module.js';
import { updateLabels } from './labels.js';

export let scene;
export let camera;
export let renderer;
export let meshes;

export function initScene(container, fpsCounter) {
  function setContainerSize() {
    const aspect = 16 / 9;
    const parent = container.parentElement;
    let maxWidth = window.innerWidth;
    let maxHeight = window.innerHeight;

    if (parent) {
      const styles = window.getComputedStyle(parent);
      const paddingX = (parseFloat(styles.paddingLeft) || 0) + (parseFloat(styles.paddingRight) || 0);
      const paddingY = (parseFloat(styles.paddingTop) || 0) + (parseFloat(styles.paddingBottom) || 0);
      const parentWidth = parent.clientWidth - paddingX;
      const parentHeight = parent.clientHeight - paddingY;
      if (parentWidth > 0) {
        maxWidth = Math.min(maxWidth, parentWidth);
      }
      if (parentHeight > 0) {
        maxHeight = Math.min(maxHeight, parentHeight);
      }
    }

    let width = maxWidth;
    let height = width / aspect;
    if (height > maxHeight) {
      height = maxHeight;
      width = height * aspect;
    }

    container.style.width = `${width}px`;
    container.style.height = `${height}px`;
    return { width, height };
  }

  scene = new THREE.Scene();
  const { width: initW, height: initH } = setContainerSize();
  camera = new THREE.PerspectiveCamera(60, initW / initH, 0.1, 1000);
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(initW, initH);
  renderer.setClearColor(0x001533);
  renderer.shadowMap.enabled = true;
  container.appendChild(renderer.domElement);

  // Ground with custom height pattern
  console.info('Generating ground geometry');
  const groundSize = 32;
  const baseGeometry = new THREE.PlaneGeometry(groundSize, groundSize, groundSize, groundSize);
  const groundGeo = baseGeometry.toNonIndexed();
  baseGeometry.dispose();
  const pos = groundGeo.attributes.position;
  const vertexCount = pos.count;

  const heights = new Float32Array(vertexCount);
  let minHeight = Infinity;
  let maxHeight = -Infinity;

  const primaryFrequency = 0.35;
  const secondaryFrequency = 0.18;
  const tertiaryFrequency = 0.6;
  const amplitude = 1.2;

  for (let i = 0; i < vertexCount; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const distance = Math.sqrt(x * x + y * y);

    const ridges = Math.sin(x * primaryFrequency) * Math.cos(y * primaryFrequency);
    const waves = Math.sin((x + y) * secondaryFrequency) * 0.7;
    const swirl = Math.cos(distance * tertiaryFrequency) * 0.5;
    const falloff = Math.exp(-(distance * distance) / (groundSize * 2.2));

    const height = (ridges * 0.9 + waves + swirl * 0.6) * amplitude * falloff;
    heights[i] = height;
    minHeight = Math.min(minHeight, height);
    maxHeight = Math.max(maxHeight, height);
  }

  const lift = -minHeight + 0.25;
  const scale = 2.1;
  minHeight = Infinity;
  maxHeight = -Infinity;

  for (let i = 0; i < vertexCount; i++) {
    const finalHeight = (heights[i] + lift) * scale;
    heights[i] = finalHeight;
    pos.setZ(i, finalHeight);
    minHeight = Math.min(minHeight, finalHeight);
    maxHeight = Math.max(maxHeight, finalHeight);
  }

  const range = maxHeight - minHeight || 1;
  const colors = new Float32Array(vertexCount * 3);
  const color = new THREE.Color();
  for (let i = 0; i < vertexCount; i++) {
    const height = heights[i];
    const t = THREE.MathUtils.clamp((height - minHeight) / range, 0, 1);
    const hue = THREE.MathUtils.lerp(0.35, 0.08, t);
    const lightness = THREE.MathUtils.lerp(0.32, 0.72, t);
    color.setHSL(hue, 0.55, lightness);
    colors[i * 3] = color.r;
    colors[i * 3 + 1] = color.g;
    colors[i * 3 + 2] = color.b;
  }
  groundGeo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  groundGeo.computeVertexNormals();

  const groundMat = new THREE.MeshStandardMaterial({
    vertexColors: true,
    flatShading: true,
    roughness: 0.85,
    metalness: 0.15
  });
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

  meshes = [];
  console.info('Meshes initialized');

  // Chunky voxel-style DEMOS heading
  const LETTERS = {
    D: ['11110', '10001', '10001', '10001', '10001', '10001', '11110'],
    E: ['11111', '10000', '10000', '11110', '10000', '10000', '11111'],
    M: ['10001', '11011', '10101', '10001', '10001', '10001', '10001'],
    O: ['01110', '10001', '10001', '10001', '10001', '10001', '01110'],
    S: ['01111', '10000', '10000', '01110', '00001', '00001', '11110'],
    N: ['10001', '11001', '10101', '10011', '10001', '10001', '10001'],
    T: ['11111', '00100', '00100', '00100', '00100', '00100', '00100'],
    W: ['10001', '10001', '10001', '10101', '10101', '10101', '01010'],
    H: ['10001', '10001', '10001', '11111', '10001', '10001', '10001'],
    R: ['11110', '10001', '10001', '11110', '10100', '10010', '10001']
  };

  const textCubes = [];
  const textLetters = [];

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
      const color = availableColors.splice(Math.floor(Math.random() * availableColors.length), 1)[0];
      const letterMaterial = new THREE.MeshStandardMaterial({ color });
      pattern.forEach((row, y) => {
        row.split('').forEach((bit, x) => {
          if (bit === '1') {
            const cube = new THREE.Mesh(new THREE.BoxGeometry(size, size, depth), letterMaterial);
            cube.position.set(x * size, (pattern.length - y - 1) * size, 0);
            cube.castShadow = true;
            cube.receiveShadow = true;
            cube.userData.phase = Math.random() * Math.PI * 2;
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
      textLetters.push(letterGroup);
      offsetX += letterWidth + size;
    });
    const box = new THREE.Box3().setFromObject(group);
    const center = box.getCenter(new THREE.Vector3());
    group.children.forEach(c => c.position.sub(center));
    textLetters.forEach(letter => {
      letter.userData.initialZ = letter.position.z;
      letter.userData.phase = Math.random() * Math.PI * 2;
    });
    group.scale.set(0.55, 0.55, 0.55);
    group.position.set(0, 4, 0.5);
    group.rotation.x = 0;
    return group;
  }

  const textMesh = createVoxelText('DEMOS');
  scene.add(textMesh);
  console.info('Voxel text added', textMesh.position);

  camera.position.set(0, 7.5, 5);
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
    meshes.forEach(mesh => {
      mesh.rotation.x += 0.005;
      mesh.rotation.y += 0.01;
    });
    textCubes.forEach(cube => {
      const { rotSpeed, initialX, phase } = cube.userData;
      cube.rotation.x += rotSpeed.x;
      cube.rotation.y += rotSpeed.y;
      cube.rotation.z += rotSpeed.z;
      cube.position.x = initialX + Math.sin(timestamp / 600 + phase) * 0.05;
    });
    textLetters.forEach(letter => {
      const { initialZ, phase } = letter.userData;
      letter.position.z = initialZ + Math.sin(timestamp / 600 + phase) * 0.05;
    });
    updateLabels(camera, timestamp);
    renderer.render(scene, camera);
  }

  function onWindowResize() {
    const { width, height } = setContainerSize();
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
  window.addEventListener('pointerup', checkOrientation);

  function updateViewportHeight() {
    document.documentElement.style.setProperty('--vh', `${window.innerHeight * 0.01}px`);
  }
  window.addEventListener('resize', updateViewportHeight);
  window.addEventListener('orientationchange', updateViewportHeight);
  updateViewportHeight();
  onWindowResize();
  checkOrientation();

  requestAnimationFrame(animate);
}
