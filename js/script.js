// Basic THREE.js example with multiple objects
console.log('Responsive boilerplate loaded');

// Ensure THREE is available
if (typeof THREE !== 'undefined') {
  const container = document.getElementById('scene-container');
  const fpsCounter = document.getElementById('fps-counter');
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setClearColor(0x000033);
  renderer.shadowMap.enabled = true;
  container.appendChild(renderer.domElement);

  // Ground (standard material for debugging visibility)
  const groundGeo = new THREE.PlaneGeometry(50, 50);
  const groundMat = new THREE.MeshStandardMaterial({ color: 0x222222 });
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = 0;
  ground.receiveShadow = true;
  scene.add(ground);

  // Lighting
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
  scene.add(ambientLight);

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

  // Helper function to create elevated mesh
  function createMesh(geometry, color, x) {
    const material = new THREE.MeshStandardMaterial({ color });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, 3, 0);
    mesh.castShadow = true;
    scene.add(mesh);
    return mesh;
  }

  // Create objects
  const mesh1 = createMesh(new THREE.IcosahedronGeometry(1.5), 0xff6600, -4);
  const mesh2 = createMesh(new THREE.TorusGeometry(1.2, 0.4, 16, 30), 0x0096D6, 0);
  const mesh3 = createMesh(new THREE.DodecahedronGeometry(1.5), 0x9932cc, 4);

  camera.position.set(0, 6, 10);
  camera.lookAt(0, 1, 0);

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
    renderer.render(scene, camera);
  }

  function onWindowResize() {
    const width = container.clientWidth;
    const height = container.clientHeight;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
    checkOrientation();
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
  }

  window.addEventListener('resize', onWindowResize);
  window.addEventListener('orientationchange', checkOrientation);
  onWindowResize();
  checkOrientation();

  requestAnimationFrame(animate);
}
