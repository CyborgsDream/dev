import * as THREE from 'https://unpkg.com/three@0.159.0/build/three.module.js';
import { updateLabels } from './labels.js';

export let scene;
export let camera;
export let renderer;
export let meshes;
const shaderMaterials = [];

function registerShaderMaterial(material) {
  shaderMaterials.push(material);
  return material;
}

export function createHeroMaterial(baseColor, accentColor) {
  return registerShaderMaterial(new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uColor: { value: baseColor.clone() },
      uAccent: { value: accentColor.clone() }
    },
    vertexShader: `
      varying vec3 vNormal;
      varying vec3 vWorld;
      varying float vRim;
      void main() {
        vNormal = normalize(normalMatrix * normal);
        vec4 worldPosition = modelMatrix * vec4(position, 1.0);
        vWorld = worldPosition.xyz;
        vec3 viewDir = normalize(cameraPosition - vWorld);
        vRim = 1.0 - max(dot(viewDir, vNormal), 0.0);
        gl_Position = projectionMatrix * viewMatrix * worldPosition;
      }
    `,
    fragmentShader: `
      precision highp float;
      uniform float uTime;
      uniform vec3 uColor;
      uniform vec3 uAccent;
      varying vec3 vNormal;
      varying vec3 vWorld;
      varying float vRim;

      float wave(vec3 p) {
        return sin(p.x * 1.6 + uTime * 0.6) * 0.4 +
               sin(p.y * 2.2 - uTime * 0.4) * 0.3 +
               cos(p.z * 1.4 + uTime * 0.5) * 0.3;
      }

      void main() {
        float shimmer = wave(vWorld) * 0.5 + 0.5;
        vec3 base = mix(uColor, uAccent, shimmer);
        float rim = pow(vRim, 2.2);
        vec3 finalColor = base + rim * uAccent * 0.8;
        gl_FragColor = vec4(finalColor, 1.0);
      }
    `
  }));
}

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

  console.info('Creating shader floor');
  const floorGeometry = new THREE.PlaneGeometry(48, 48, 180, 180);
  floorGeometry.rotateX(-Math.PI / 2);
  const floorMaterial = registerShaderMaterial(new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uBase: { value: new THREE.Color(0x071a34) },
      uGlow: { value: new THREE.Color(0x1e8fff) }
    },
    vertexShader: `
      varying vec2 vUv;
      varying float vWave;
      void main() {
        vUv = uv;
        vec3 pos = position;
        float waveX = sin((pos.x * 0.6) + uTime * 0.6);
        float waveZ = cos((pos.z * 0.55) - uTime * 0.4);
        vWave = waveX + waveZ;
        pos.y += vWave * 0.35;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
      }
    `,
    fragmentShader: `
      precision highp float;
      uniform vec3 uBase;
      uniform vec3 uGlow;
      varying vec2 vUv;
      varying float vWave;

      float gridLine(float coord) {
        float grid = abs(fract(coord - 0.5) - 0.5) / fwidth(coord);
        return 1.0 - clamp(grid, 0.0, 1.0);
      }

      void main() {
        float gridX = gridLine(vUv.x * 18.0);
        float gridY = gridLine(vUv.y * 18.0);
        float grid = max(gridX, gridY);
        float glow = smoothstep(0.1, 0.9, (vWave * 0.5 + 0.5));
        vec3 color = mix(uBase, uGlow, glow);
        color += grid * uGlow * 0.55;
        gl_FragColor = vec4(color, 1.0);
      }
    `,
    transparent: false
  }));
  const floor = new THREE.Mesh(floorGeometry, floorMaterial);
  floor.receiveShadow = true;
  scene.add(floor);
  console.info('Shader floor added');

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
    shaderMaterials.forEach(material => {
      if (material.uniforms && material.uniforms.uTime) {
        material.uniforms.uTime.value = timestamp * 0.001;
      }
    });
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
