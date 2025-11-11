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

  // Subtle grid floor so nothing blocks the hero objects
  console.info('Creating background grid floor');
  const gridSize = 40;
  const grid = new THREE.GridHelper(gridSize, 60, 0x114b9a, 0x093569);
  grid.position.y = 0;

  const positions = grid.geometry?.attributes?.position;
  if (positions) {
    const posArray = positions.array;
    const flatRadius = 6;
    const ringStart = flatRadius + 1.5;
    const ringEnd = gridSize * 0.5 - 3;
    const maxRadius = gridSize * 0.5;
    const hillScale = 1.85;
    const cornerSpikeRadius = 5.5;
    const cornerSpikeHeight = 8.5;

    for (let i = 0; i < posArray.length; i += 3) {
      const x = posArray[i];
      const z = posArray[i + 2];
      const distance = Math.sqrt(x * x + z * z);

      if (distance <= flatRadius) {
        posArray[i + 1] = 0;
        continue;
      }

      const ringBlend = Math.max(Math.min((distance - ringStart) / Math.max(ringEnd - ringStart, 0.0001), 1), 0);
      const edgeFade = distance > ringEnd
        ? 1 - Math.min((distance - ringEnd) / Math.max(maxRadius - ringEnd, 0.0001), 1)
        : 1;
      const ringStrength = Math.pow(Math.max(distance - flatRadius, 0) / Math.max(ringEnd - flatRadius, 0.0001), 1.35);

      const angle = Math.atan2(z, x);
      const angularWave = Math.pow(Math.abs(Math.sin(angle * 6.5) * Math.cos(angle * 3.1)), 1.4);
      const radialSpike = Math.pow(Math.abs(Math.sin((distance - flatRadius) * 1.8)), 1.8);
      const latticeNoise = Math.abs(Math.sin(x * 0.7) * Math.sin(z * 0.7));
      const diagonalNoise = Math.abs(Math.sin((x + z) * 0.55));

      const baseHeight = (0.5 + angularWave * 0.7 + radialSpike * 0.8 + latticeNoise * 0.6 + diagonalNoise * 0.35)
        * ringBlend * ringStrength * edgeFade * hillScale;

      const edgeX = Math.max(Math.abs(x) - (maxRadius - cornerSpikeRadius), 0);
      const edgeZ = Math.max(Math.abs(z) - (maxRadius - cornerSpikeRadius), 0);
      const cornerDistance = Math.hypot(edgeX, edgeZ);
      const cornerBlend = Math.max(1 - cornerDistance / cornerSpikeRadius, 0);
      const cornerWave = Math.pow(Math.abs(Math.sin((x + z) * 0.45)), 1.2);
      const cornerSpike = Math.pow(cornerBlend, 2.4) * (0.6 + cornerWave * 0.4) * cornerSpikeHeight;

      posArray[i + 1] = baseHeight + cornerSpike;
    }

    positions.needsUpdate = true;
    grid.geometry.computeBoundingBox();
    grid.geometry.computeBoundingSphere();
  }

  if (grid.material && 'opacity' in grid.material) {
    grid.material.opacity = 0.45;
    grid.material.transparent = true;
    grid.material.depthWrite = false;
  }
  scene.add(grid);
  console.info('Grid floor added');

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

  camera.position.set(0, 4.5, 8.5);
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
