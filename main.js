import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.118/build/three.module.js';
import {OrbitControls} from 'https://cdn.jsdelivr.net/npm/three@0.118/examples/jsm/controls/OrbitControls.js';

class WindowsXPGame {
  constructor() {
    this.score = 0;
    this.collectibles = [];
    this.player = null;
    this.velocity = new THREE.Vector3();
    this.moveSpeed = 0.3;
    this.keys = {};

    this._Initialize();
    this._SetupControls();
  }

  _Initialize() {
    // Setup renderer
    this._threejs = new THREE.WebGLRenderer({ antialias: true });
    this._threejs.shadowMap.enabled = true;
    this._threejs.shadowMap.type = THREE.PCFSoftShadowMap;
    this._threejs.setPixelRatio(window.devicePixelRatio);
    this._threejs.setSize(window.innerWidth, window.innerHeight);
    this._threejs.domElement.style.position = 'absolute';
    this._threejs.domElement.style.top = '0';
    this._threejs.domElement.style.left = '0';
    this._threejs.domElement.style.zIndex = '0';
    document.body.appendChild(this._threejs.domElement);

    // Handle window resize
    window.addEventListener('resize', () => this._OnWindowResize(), false);

    // Setup camera
    this._camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this._camera.position.set(0, 10, 20);

    // Create scene
    this._scene = new THREE.Scene();

    // Create XP Bliss skybox
    this._CreateBlissSkybox();

    // Add fog for distant hills
    this._scene.fog = new THREE.Fog(0x5a8dce, 100, 300);

    // Lighting - bright and cheerful like XP
    const sunLight = new THREE.DirectionalLight(0xffffee, 1.2);
    sunLight.position.set(50, 100, 50);
    sunLight.castShadow = true;
    sunLight.shadow.camera.left = -50;
    sunLight.shadow.camera.right = 50;
    sunLight.shadow.camera.top = 50;
    sunLight.shadow.camera.bottom = -50;
    sunLight.shadow.camera.near = 0.1;
    sunLight.shadow.camera.far = 200;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    this._scene.add(sunLight);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this._scene.add(ambientLight);

    // Create Bliss-inspired landscape
    this._CreateBlissLandscape();

    // Create player (Windows logo-inspired)
    this._CreatePlayer();

    // Create collectibles (XP gems)
    this._CreateCollectibles();

    // Add some clouds
    this._CreateClouds();

    // Setup camera to follow player
    this.cameraOffset = new THREE.Vector3(0, 8, 15);

    // Update time display
    this._UpdateTime();
    setInterval(() => this._UpdateTime(), 1000);

    // Start animation loop
    this._RAF();
  }

  _CreateBlissSkybox() {
    // Create a large sphere for the skybox with XP Bliss-inspired gradient
    const skyGeometry = new THREE.SphereGeometry(500, 32, 32);

    // Create gradient texture for XP Bliss sky
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // Create XP Bliss sky gradient (bright blue at top, lighter at horizon)
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#4a9eff');    // Top - bright sky blue
    gradient.addColorStop(0.4, '#78b4ff');  // Upper middle
    gradient.addColorStop(0.7, '#a8d0ff');  // Lower middle - lighter blue
    gradient.addColorStop(1, '#d4e8ff');    // Horizon - very light blue

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Add some white wispy clouds to the texture
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    for (let i = 0; i < 20; i++) {
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height * 0.6; // Upper part only
      const radius = 20 + Math.random() * 40;
      ctx.beginPath();
      ctx.ellipse(x, y, radius, radius * 0.6, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    const texture = new THREE.CanvasTexture(canvas);
    const skyMaterial = new THREE.MeshBasicMaterial({
      map: texture,
      side: THREE.BackSide
    });

    const sky = new THREE.Mesh(skyGeometry, skyMaterial);
    this._scene.add(sky);
  }

  _CreateBlissLandscape() {
    // Create rolling hills geometry - more detailed for better Bliss effect
    const groundGeometry = new THREE.PlaneGeometry(300, 300, 100, 100);
    const vertices = groundGeometry.getAttribute('position').array;

    // Create rolling hills like the Bliss wallpaper
    for (let i = 0; i < vertices.length; i += 3) {
      const x = vertices[i];
      const y = vertices[i + 1];

      // Create smooth, rolling hills with multiple wave patterns
      const wave1 = Math.sin(x * 0.015) * 8;
      const wave2 = Math.cos(y * 0.015) * 8;
      const wave3 = Math.sin((x + y) * 0.01) * 6;
      const wave4 = Math.cos((x - y) * 0.008) * 5;

      // Add some variation to make it more natural
      const distance = Math.sqrt(x * x + y * y);
      const falloff = Math.max(0, 1 - distance / 150);

      vertices[i + 2] = (wave1 + wave2 + wave3 + wave4) * falloff;
    }

    groundGeometry.computeVertexNormals();

    // XP Bliss vibrant green grass - more saturated and vibrant
    const groundMaterial = new THREE.MeshStandardMaterial({
      color: 0x6ec72d,  // Brighter, more vibrant green like Bliss
      flatShading: false,
      roughness: 0.85,
      metalness: 0.05
    });

    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    ground.position.y = 0;
    this._scene.add(ground);

    // Add some XP-style trees scattered on hills
    for (let i = 0; i < 15; i++) {
      const tree = this._CreateTree();
      const angle = (i / 15) * Math.PI * 2;
      const radius = 30 + Math.random() * 40;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;

      tree.position.x = x;
      tree.position.z = z;

      // Calculate height based on terrain waves
      const y = Math.sin(x * 0.015) * 8 + Math.cos(z * 0.015) * 8 +
                Math.sin((x + z) * 0.01) * 6 + Math.cos((x - z) * 0.008) * 5;
      const distance = Math.sqrt(x * x + z * z);
      const falloff = Math.max(0, 1 - distance / 150);

      tree.position.y = y * falloff;
      this._scene.add(tree);
    }
  }

  _CreateTree() {
    const tree = new THREE.Group();

    // Trunk
    const trunkGeometry = new THREE.CylinderGeometry(0.5, 0.7, 4, 8);
    const trunkMaterial = new THREE.MeshStandardMaterial({ color: 0x8b4513 });
    const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
    trunk.position.y = 2;
    trunk.castShadow = true;
    trunk.receiveShadow = true;
    tree.add(trunk);

    // Leaves (pyramid shaped)
    const leavesGeometry = new THREE.ConeGeometry(3, 6, 8);
    const leavesMaterial = new THREE.MeshStandardMaterial({ color: 0x228b22 });
    const leaves = new THREE.Mesh(leavesGeometry, leavesMaterial);
    leaves.position.y = 6;
    leaves.castShadow = true;
    leaves.receiveShadow = true;
    tree.add(leaves);

    return tree;
  }

  _CreateClouds() {
    for (let i = 0; i < 10; i++) {
      const cloud = new THREE.Group();

      // Create cloud from spheres
      for (let j = 0; j < 3; j++) {
        const sphereGeometry = new THREE.SphereGeometry(2 + Math.random() * 2, 8, 8);
        const sphereMaterial = new THREE.MeshStandardMaterial({
          color: 0xffffff,
          transparent: true,
          opacity: 0.7
        });
        const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
        sphere.position.x = (j - 1) * 3;
        sphere.position.y = Math.random();
        cloud.add(sphere);
      }

      cloud.position.set(
        (Math.random() - 0.5) * 150,
        30 + Math.random() * 20,
        (Math.random() - 0.5) * 150
      );

      this._scene.add(cloud);
    }
  }

  _CreatePlayer() {
    const playerGroup = new THREE.Group();

    // Windows logo-inspired player (4 colored squares)
    const colors = [0xff0000, 0x00ff00, 0x0000ff, 0xffff00];
    const positions = [
      [-0.6, 0.6], [0.6, 0.6],
      [-0.6, -0.6], [0.6, -0.6]
    ];

    for (let i = 0; i < 4; i++) {
      const geometry = new THREE.BoxGeometry(1, 1, 0.2);
      const material = new THREE.MeshStandardMaterial({
        color: colors[i],
        metalness: 0.3,
        roughness: 0.4
      });
      const cube = new THREE.Mesh(geometry, material);
      cube.position.x = positions[i][0];
      cube.position.y = positions[i][1];
      cube.castShadow = true;
      cube.receiveShadow = true;
      playerGroup.add(cube);
    }

    playerGroup.position.set(0, 3, 0);
    this.player = playerGroup;
    this._scene.add(playerGroup);
  }

  _CreateCollectibles() {
    // Create XP gem collectibles
    for (let i = 0; i < 20; i++) {
      const geometry = new THREE.OctahedronGeometry(1, 0);
      const material = new THREE.MeshStandardMaterial({
        color: 0x00bfff,
        metalness: 0.8,
        roughness: 0.2,
        emissive: 0x0088ff,
        emissiveIntensity: 0.3
      });
      const gem = new THREE.Mesh(geometry, material);

      const angle = Math.random() * Math.PI * 2;
      const radius = 10 + Math.random() * 50;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;

      gem.position.x = x;
      gem.position.z = z;

      // Calculate terrain height at this position
      const terrainHeight = this._GetTerrainHeight(x, z);
      gem.position.y = terrainHeight + 2 + Math.random() * 2;

      gem.castShadow = true;
      gem.receiveShadow = true;

      this._scene.add(gem);
      this.collectibles.push(gem);
    }
  }

  _GetTerrainHeight(x, z) {
    // Calculate terrain height based on the same wave patterns used for terrain
    const wave1 = Math.sin(x * 0.015) * 8;
    const wave2 = Math.cos(z * 0.015) * 8;
    const wave3 = Math.sin((x + z) * 0.01) * 6;
    const wave4 = Math.cos((x - z) * 0.008) * 5;

    const distance = Math.sqrt(x * x + z * z);
    const falloff = Math.max(0, 1 - distance / 150);

    return (wave1 + wave2 + wave3 + wave4) * falloff;
  }

  _SetupControls() {
    // Keyboard controls
    document.addEventListener('keydown', (e) => {
      this.keys[e.key.toLowerCase()] = true;
    });

    document.addEventListener('keyup', (e) => {
      this.keys[e.key.toLowerCase()] = false;
    });

    // Mouse controls for camera
    this.controls = new OrbitControls(this._camera, this._threejs.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.minDistance = 5;
    this.controls.maxDistance = 30;
    this.controls.maxPolarAngle = Math.PI / 2.2;
  }

  _UpdatePlayer() {
    if (!this.player) return;

    // Get camera direction
    const direction = new THREE.Vector3();
    this._camera.getWorldDirection(direction);
    direction.y = 0;
    direction.normalize();

    const right = new THREE.Vector3();
    right.crossVectors(direction, new THREE.Vector3(0, 1, 0));

    // Movement
    this.velocity.set(0, 0, 0);

    if (this.keys['w']) {
      this.velocity.add(direction.multiplyScalar(this.moveSpeed));
    }
    if (this.keys['s']) {
      this.velocity.add(direction.multiplyScalar(-this.moveSpeed));
    }
    if (this.keys['a']) {
      this.velocity.add(right.multiplyScalar(-this.moveSpeed));
    }
    if (this.keys['d']) {
      this.velocity.add(right.multiplyScalar(this.moveSpeed));
    }

    this.player.position.add(this.velocity);

    // Rotate player slightly while moving
    if (this.velocity.length() > 0) {
      this.player.rotation.y += 0.05;
    }

    // Keep player on terrain surface
    const terrainHeight = this._GetTerrainHeight(this.player.position.x, this.player.position.z);
    this.player.position.y = terrainHeight + 3;

    // Update camera to follow player
    this.controls.target.copy(this.player.position);
    this.controls.update();
  }

  _CheckCollisions() {
    if (!this.player) return;

    for (let i = this.collectibles.length - 1; i >= 0; i--) {
      const gem = this.collectibles[i];
      const distance = this.player.position.distanceTo(gem.position);

      if (distance < 2) {
        // Collected!
        this._scene.remove(gem);
        this.collectibles.splice(i, 1);
        this.score += 10;
        this._UpdateScore();

        // Create new gem to replace it
        this._CreateNewGem();
      }
    }

    // Rotate gems
    this.collectibles.forEach(gem => {
      gem.rotation.y += 0.02;
      gem.position.y += Math.sin(Date.now() * 0.001 + gem.position.x) * 0.01;
    });
  }

  _CreateNewGem() {
    const geometry = new THREE.OctahedronGeometry(1, 0);
    const material = new THREE.MeshStandardMaterial({
      color: 0x00bfff,
      metalness: 0.8,
      roughness: 0.2,
      emissive: 0x0088ff,
      emissiveIntensity: 0.3
    });
    const gem = new THREE.Mesh(geometry, material);

    const angle = Math.random() * Math.PI * 2;
    const radius = 15 + Math.random() * 50;
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;

    gem.position.x = x;
    gem.position.z = z;

    // Calculate terrain height at this position
    const terrainHeight = this._GetTerrainHeight(x, z);
    gem.position.y = terrainHeight + 2 + Math.random() * 2;

    gem.castShadow = true;
    gem.receiveShadow = true;

    this._scene.add(gem);
    this.collectibles.push(gem);
  }

  _UpdateScore() {
    document.getElementById('score').textContent = `Score: ${this.score}`;
  }

  _UpdateTime() {
    const now = new Date();
    const hours = now.getHours() % 12 || 12;
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const ampm = now.getHours() >= 12 ? 'PM' : 'AM';
    document.getElementById('time').textContent = `${hours}:${minutes} ${ampm}`;
  }

  _OnWindowResize() {
    this._camera.aspect = window.innerWidth / window.innerHeight;
    this._camera.updateProjectionMatrix();
    this._threejs.setSize(window.innerWidth, window.innerHeight);
  }

  _RAF() {
    requestAnimationFrame(() => {
      this._UpdatePlayer();
      this._CheckCollisions();
      this._threejs.render(this._scene, this._camera);
      this._RAF();
    });
  }
}

let _APP = null;

window.addEventListener('DOMContentLoaded', () => {
  _APP = new WindowsXPGame();
});
