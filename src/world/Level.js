import * as THREE from 'three';

export class Level {
  constructor(game) {
    this.game = game;
    this.roomGroup = null;
    this.bounds = { minX: -8, maxX: 8, minZ: -8, maxZ: 8 };
    this.door = null;
    this.doorOpen = false;
    this.doorLight = null;
    this.torchLights = [];
  }

  getBounds() {
    return this.bounds;
  }

  buildRoom(index) {
    // Remove old room
    if (this.roomGroup) {
      this.game.scene.remove(this.roomGroup);
    }
    this.roomGroup = new THREE.Group();
    this.doorOpen = false;
    this.torchLights = [];

    const rooms = [
      () => this.buildEntranceHall(),
      () => this.buildCorridorRoom(),
      () => this.buildCathedralRoom(),
      () => this.buildDungeonRoom(),
      () => this.buildBossArena(),
    ];

    const idx = Math.min(index, rooms.length - 1);
    rooms[idx]();

    // Add ambient light
    const ambient = new THREE.AmbientLight(0x111122, 0.3);
    this.roomGroup.add(ambient);

    // Hemisphere light for subtle fill
    const hemi = new THREE.HemisphereLight(0x0a0a20, 0x0a0a0a, 0.2);
    this.roomGroup.add(hemi);

    this.game.scene.add(this.roomGroup);
  }

  // Room 0: Entrance hall with pillars
  buildEntranceHall() {
    this.bounds = { minX: -8, maxX: 8, minZ: -8, maxZ: 8 };
    this.buildFloor(16, 16, 0x2a2a2a);
    this.buildWalls(16, 16, 5, 0x3a2a1a);

    // Pillars
    for (let x = -1; x <= 1; x += 2) {
      for (let z = -1; z <= 1; z += 2) {
        this.addPillar(x * 4, z * 4, 5, 0x4a3a2a);
      }
    }

    // Torches
    this.addTorch(-7.5, 2.5, -7.5);
    this.addTorch(7.5, 2.5, -7.5);
    this.addTorch(-7.5, 2.5, 7.5);
    this.addTorch(7.5, 2.5, 7.5);

    // Center chandelier light
    const chandelier = new THREE.PointLight(0xff8844, 1.5, 15);
    chandelier.position.set(0, 4.5, 0);
    chandelier.castShadow = true;
    chandelier.shadow.mapSize.set(512, 512);
    this.roomGroup.add(chandelier);

    // Chandelier mesh
    const chandelierMesh = new THREE.Group();
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.5, 0.05, 8, 12),
      new THREE.MeshLambertMaterial({ color: 0x8a7a5a })
    );
    ring.rotation.x = Math.PI / 2;
    chandelierMesh.add(ring);
    const chain = new THREE.Mesh(
      new THREE.CylinderGeometry(0.02, 0.02, 0.5, 4),
      new THREE.MeshLambertMaterial({ color: 0x666666 })
    );
    chain.position.y = 0.25;
    chandelierMesh.add(chain);
    chandelierMesh.position.set(0, 4.5, 0);
    this.roomGroup.add(chandelierMesh);

    // Door at north wall
    this.addDoor(0, 0, -7.9);

    // Decorative arches
    this.addArch(-3, 0, -7.9, 0);
    this.addArch(3, 0, -7.9, 0);
  }

  // Room 1: Long corridor
  buildCorridorRoom() {
    this.bounds = { minX: -5, maxX: 5, minZ: -12, maxZ: 12 };
    this.buildFloor(10, 24, 0x222222);
    this.buildWalls(10, 24, 5, 0x352520);

    // Pillars along corridor
    for (let z = -10; z <= 10; z += 5) {
      this.addPillar(-4, z, 5, 0x3a2a1a);
      this.addPillar(4, z, 5, 0x3a2a1a);
    }

    // Torches
    for (let z = -10; z <= 10; z += 5) {
      this.addTorch(-4.8, 2.5, z);
      this.addTorch(4.8, 2.5, z);
    }

    this.addDoor(0, 0, -11.9);
  }

  // Room 2: Cathedral with high ceiling
  buildCathedralRoom() {
    this.bounds = { minX: -10, maxX: 10, minZ: -10, maxZ: 10 };
    this.buildFloor(20, 20, 0x1a1a2a);
    this.buildWalls(20, 20, 8, 0x2a2a3a);

    // Grand pillars
    for (let x = -1; x <= 1; x += 2) {
      for (let z = -2; z <= 2; z++) {
        this.addPillar(x * 6, z * 3, 8, 0x3a3a4a);
      }
    }

    // Stained glass (colored lights)
    const colors = [0xff0000, 0x0000ff, 0x00ff00, 0xffff00];
    for (let i = 0; i < 4; i++) {
      const light = new THREE.PointLight(colors[i], 0.5, 8);
      const angle = (i / 4) * Math.PI * 2;
      light.position.set(Math.sin(angle) * 9, 5, Math.cos(angle) * 9);
      this.roomGroup.add(light);

      // Glass panel
      const glass = new THREE.Mesh(
        new THREE.PlaneGeometry(2, 3),
        new THREE.MeshBasicMaterial({
          color: colors[i],
          transparent: true,
          opacity: 0.3,
          side: THREE.DoubleSide
        })
      );
      glass.position.copy(light.position);
      glass.lookAt(0, 5, 0);
      this.roomGroup.add(glass);
    }

    // Altar in center
    const altar = new THREE.Mesh(
      new THREE.BoxGeometry(2, 1, 1),
      new THREE.MeshLambertMaterial({ color: 0x444444 })
    );
    altar.position.set(0, 0.5, -6);
    altar.castShadow = true;
    altar.receiveShadow = true;
    this.roomGroup.add(altar);

    this.addTorch(-9.5, 3, -9.5);
    this.addTorch(9.5, 3, -9.5);
    this.addTorch(-9.5, 3, 9.5);
    this.addTorch(9.5, 3, 9.5);
    this.addTorch(0, 4, -9.5);

    this.addDoor(0, 0, -9.9);
  }

  // Room 3: Dungeon
  buildDungeonRoom() {
    this.bounds = { minX: -7, maxX: 7, minZ: -7, maxZ: 7 };
    this.buildFloor(14, 14, 0x1a1a1a);
    this.buildWalls(14, 14, 4, 0x2a1a1a);

    // Prison cells (cage meshes)
    for (let x = -1; x <= 1; x += 2) {
      const cage = new THREE.Group();
      // Bars
      for (let i = -2; i <= 2; i++) {
        const bar = new THREE.Mesh(
          new THREE.CylinderGeometry(0.03, 0.03, 3, 4),
          new THREE.MeshLambertMaterial({ color: 0x555555 })
        );
        bar.position.set(i * 0.3, 1.5, 0);
        cage.add(bar);
      }
      // Top bar
      const topBar = new THREE.Mesh(
        new THREE.BoxGeometry(1.4, 0.06, 0.06),
        new THREE.MeshLambertMaterial({ color: 0x555555 })
      );
      topBar.position.y = 3;
      cage.add(topBar);

      cage.position.set(x * 5.5, 0, -4);
      this.roomGroup.add(cage);
    }

    // Chains hanging from ceiling
    for (let i = 0; i < 5; i++) {
      const chain = new THREE.Mesh(
        new THREE.CylinderGeometry(0.02, 0.02, 2 + Math.random(), 4),
        new THREE.MeshLambertMaterial({ color: 0x666666 })
      );
      chain.position.set(
        (Math.random() - 0.5) * 10,
        3 + Math.random(),
        (Math.random() - 0.5) * 10
      );
      this.roomGroup.add(chain);
    }

    // Dim red lighting
    const redLight = new THREE.PointLight(0xff2200, 1, 12);
    redLight.position.set(0, 3, 0);
    this.roomGroup.add(redLight);

    this.addTorch(-6.5, 2, -6.5);
    this.addTorch(6.5, 2, -6.5);
    this.addTorch(-6.5, 2, 6.5);
    this.addTorch(6.5, 2, 6.5);

    this.addDoor(0, 0, -6.9);
  }

  // Room 4: Boss arena
  buildBossArena() {
    this.bounds = { minX: -12, maxX: 12, minZ: -12, maxZ: 12 };
    this.buildFloor(24, 24, 0x1a0a0a);
    this.buildWalls(24, 24, 7, 0x3a1a0a);

    // Lava cracks in floor (emissive lines)
    for (let i = 0; i < 8; i++) {
      const crack = new THREE.Mesh(
        new THREE.PlaneGeometry(0.15, 4 + Math.random() * 6),
        new THREE.MeshBasicMaterial({ color: 0xff4400, transparent: true, opacity: 0.6 })
      );
      crack.rotation.x = -Math.PI / 2;
      crack.rotation.z = Math.random() * Math.PI;
      crack.position.set(
        (Math.random() - 0.5) * 18,
        0.01,
        (Math.random() - 0.5) * 18
      );
      this.roomGroup.add(crack);
    }

    // Grand pillars (some broken)
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const height = i % 3 === 0 ? 3 : 7; // Some pillars broken
      this.addPillar(Math.sin(angle) * 9, Math.cos(angle) * 9, height, 0x4a2a1a);
    }

    // Fire braziers
    for (let i = 0; i < 4; i++) {
      const angle = (i / 4) * Math.PI * 2 + Math.PI / 4;
      const x = Math.sin(angle) * 10;
      const z = Math.cos(angle) * 10;
      this.addBrazier(x, z);
    }

    // Central demonic circle
    const circle = new THREE.Mesh(
      new THREE.RingGeometry(3, 3.2, 32),
      new THREE.MeshBasicMaterial({ color: 0x880000, side: THREE.DoubleSide })
    );
    circle.rotation.x = -Math.PI / 2;
    circle.position.y = 0.01;
    this.roomGroup.add(circle);

    // Pentagram
    const pentaShape = new THREE.BufferGeometry();
    const points = [];
    for (let i = 0; i < 5; i++) {
      const a1 = (i * 2 % 5) / 5 * Math.PI * 2 - Math.PI / 2;
      const a2 = ((i * 2 + 2) % 5) / 5 * Math.PI * 2 - Math.PI / 2;
      points.push(Math.cos(a1) * 2.8, 0.02, Math.sin(a1) * 2.8);
      points.push(Math.cos(a2) * 2.8, 0.02, Math.sin(a2) * 2.8);
    }
    pentaShape.setAttribute('position', new THREE.Float32BufferAttribute(points, 3));
    const pentagram = new THREE.LineSegments(
      pentaShape,
      new THREE.LineBasicMaterial({ color: 0xff0000 })
    );
    this.roomGroup.add(pentagram);

    // Dramatic lighting
    const mainLight = new THREE.PointLight(0xff4400, 2, 20);
    mainLight.position.set(0, 6, 0);
    mainLight.castShadow = true;
    this.roomGroup.add(mainLight);

    // No door in boss room (victory on kill)
    this.door = null;
  }

  buildFloor(width, depth, color) {
    // Tiled floor
    const floorGeo = new THREE.PlaneGeometry(width, depth, width, depth);
    const floorMat = new THREE.MeshLambertMaterial({ color });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    this.roomGroup.add(floor);

    // Grid lines for stone tiles
    const gridHelper = new THREE.GridHelper(Math.max(width, depth), Math.max(width, depth), 0x333333, 0x222222);
    gridHelper.position.y = 0.01;
    this.roomGroup.add(gridHelper);
  }

  buildWalls(width, depth, height, color) {
    const wallMat = new THREE.MeshLambertMaterial({ color, side: THREE.DoubleSide });
    const hw = width / 2;
    const hd = depth / 2;

    // North wall
    const north = new THREE.Mesh(new THREE.PlaneGeometry(width, height), wallMat);
    north.position.set(0, height / 2, -hd);
    north.receiveShadow = true;
    this.roomGroup.add(north);

    // South wall
    const south = new THREE.Mesh(new THREE.PlaneGeometry(width, height), wallMat);
    south.position.set(0, height / 2, hd);
    south.rotation.y = Math.PI;
    south.receiveShadow = true;
    this.roomGroup.add(south);

    // East wall
    const east = new THREE.Mesh(new THREE.PlaneGeometry(depth, height), wallMat);
    east.position.set(hw, height / 2, 0);
    east.rotation.y = -Math.PI / 2;
    east.receiveShadow = true;
    this.roomGroup.add(east);

    // West wall
    const west = new THREE.Mesh(new THREE.PlaneGeometry(depth, height), wallMat);
    west.position.set(-hw, height / 2, 0);
    west.rotation.y = Math.PI / 2;
    west.receiveShadow = true;
    this.roomGroup.add(west);

    // Ceiling
    const ceiling = new THREE.Mesh(
      new THREE.PlaneGeometry(width, depth),
      new THREE.MeshLambertMaterial({ color: 0x1a1a1a, side: THREE.DoubleSide })
    );
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.y = height;
    this.roomGroup.add(ceiling);
  }

  addPillar(x, z, height, color) {
    const pillar = new THREE.Mesh(
      new THREE.CylinderGeometry(0.4, 0.5, height, 8),
      new THREE.MeshLambertMaterial({ color })
    );
    pillar.position.set(x, height / 2, z);
    pillar.castShadow = true;
    pillar.receiveShadow = true;
    this.roomGroup.add(pillar);

    // Base
    const base = new THREE.Mesh(
      new THREE.CylinderGeometry(0.6, 0.7, 0.3, 8),
      new THREE.MeshLambertMaterial({ color })
    );
    base.position.set(x, 0.15, z);
    this.roomGroup.add(base);

    // Capital
    const capital = new THREE.Mesh(
      new THREE.CylinderGeometry(0.6, 0.4, 0.3, 8),
      new THREE.MeshLambertMaterial({ color })
    );
    capital.position.set(x, height - 0.15, z);
    this.roomGroup.add(capital);
  }

  addTorch(x, y, z) {
    const torch = new THREE.Group();

    // Bracket
    const bracket = new THREE.Mesh(
      new THREE.BoxGeometry(0.1, 0.4, 0.1),
      new THREE.MeshLambertMaterial({ color: 0x4a3a2a })
    );
    torch.add(bracket);

    // Flame holder
    const holder = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.05, 0.15, 6),
      new THREE.MeshLambertMaterial({ color: 0x4a3a2a })
    );
    holder.position.y = 0.25;
    torch.add(holder);

    // Flame (simple glowing sphere)
    const flame = new THREE.Mesh(
      new THREE.SphereGeometry(0.08, 6, 6),
      new THREE.MeshBasicMaterial({ color: 0xff8844 })
    );
    flame.position.y = 0.35;
    torch.add(flame);

    // Light
    const light = new THREE.PointLight(0xff6633, 1.0, 8);
    light.position.y = 0.35;
    light.castShadow = false; // Save performance
    torch.add(light);
    this.torchLights.push({ light, baseIntensity: 1.0 });

    torch.position.set(x, y, z);
    this.roomGroup.add(torch);
  }

  addBrazier(x, z) {
    const brazier = new THREE.Group();
    // Bowl
    const bowl = new THREE.Mesh(
      new THREE.CylinderGeometry(0.5, 0.3, 0.4, 8),
      new THREE.MeshLambertMaterial({ color: 0x555555 })
    );
    bowl.position.y = 1;
    brazier.add(bowl);
    // Stand
    const stand = new THREE.Mesh(
      new THREE.CylinderGeometry(0.15, 0.25, 1, 6),
      new THREE.MeshLambertMaterial({ color: 0x444444 })
    );
    stand.position.y = 0.5;
    brazier.add(stand);
    // Fire light
    const light = new THREE.PointLight(0xff4400, 2, 10);
    light.position.y = 1.5;
    brazier.add(light);
    this.torchLights.push({ light, baseIntensity: 2.0 });

    brazier.position.set(x, 0, z);
    this.roomGroup.add(brazier);
  }

  addArch(x, y, z, rotY) {
    const archMat = new THREE.MeshLambertMaterial({ color: 0x4a3a2a });
    const arch = new THREE.Group();

    // Left column
    const left = new THREE.Mesh(new THREE.BoxGeometry(0.3, 3, 0.3), archMat);
    left.position.set(-0.8, 1.5, 0);
    arch.add(left);

    // Right column
    const right = new THREE.Mesh(new THREE.BoxGeometry(0.3, 3, 0.3), archMat);
    right.position.set(0.8, 1.5, 0);
    arch.add(right);

    // Top (arch shape approximated with a box)
    const top = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.3, 0.3), archMat);
    top.position.y = 3;
    arch.add(top);

    arch.position.set(x, y, z);
    arch.rotation.y = rotY;
    this.roomGroup.add(arch);
  }

  addDoor(x, y, z) {
    this.door = new THREE.Group();

    // Door frame
    const frameMat = new THREE.MeshLambertMaterial({ color: 0x5a4a3a });
    const frameL = new THREE.Mesh(new THREE.BoxGeometry(0.2, 3.5, 0.3), frameMat);
    frameL.position.set(-1, 1.75, 0);
    this.door.add(frameL);
    const frameR = new THREE.Mesh(new THREE.BoxGeometry(0.2, 3.5, 0.3), frameMat);
    frameR.position.set(1, 1.75, 0);
    this.door.add(frameR);
    const frameTop = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.2, 0.3), frameMat);
    frameTop.position.set(0, 3.5, 0);
    this.door.add(frameTop);

    // Door panels (these will move when opening)
    this.doorPanelL = new THREE.Mesh(
      new THREE.BoxGeometry(0.9, 3.3, 0.15),
      new THREE.MeshLambertMaterial({ color: 0x3a2a1a })
    );
    this.doorPanelL.position.set(-0.45, 1.65, 0);
    this.door.add(this.doorPanelL);

    this.doorPanelR = new THREE.Mesh(
      new THREE.BoxGeometry(0.9, 3.3, 0.15),
      new THREE.MeshLambertMaterial({ color: 0x3a2a1a })
    );
    this.doorPanelR.position.set(0.45, 1.65, 0);
    this.door.add(this.doorPanelR);

    // Lock glow (red when locked, green when open)
    this.doorLight = new THREE.PointLight(0xff0000, 1, 3);
    this.doorLight.position.set(0, 2, 0.3);
    this.door.add(this.doorLight);

    const lockGem = new THREE.Mesh(
      new THREE.SphereGeometry(0.08, 6, 6),
      new THREE.MeshBasicMaterial({ color: 0xff0000 })
    );
    lockGem.position.set(0, 2, 0.15);
    this.door.add(lockGem);
    this.lockGem = lockGem;

    this.door.position.set(x, y, z);
    this.roomGroup.add(this.door);
  }

  openDoor() {
    if (!this.door || this.doorOpen) return;
    this.doorOpen = true;
    this.game.audio.playSFX('doorOpen');

    // Change door color to green
    this.doorLight.color.setHex(0x00ff00);
    this.lockGem.material.color.setHex(0x00ff00);

    // Animate door opening
    const animateDoor = () => {
      let progress = 0;
      const interval = setInterval(() => {
        progress += 0.02;
        if (progress >= 1) {
          clearInterval(interval);
          // Create trigger zone
          this.createDoorTrigger();
          return;
        }
        this.doorPanelL.position.x = -0.45 - progress * 0.8;
        this.doorPanelR.position.x = 0.45 + progress * 0.8;
      }, 16);
    };
    animateDoor();
  }

  createDoorTrigger() {
    // Check if player walks through door
    const checkTrigger = () => {
      if (!this.doorOpen || this.game.state !== 'playing') return;
      const playerPos = this.game.player.position;
      const doorPos = this.door.position;
      const dist = Math.sqrt(
        Math.pow(playerPos.x - doorPos.x, 2) +
        Math.pow(playerPos.z - doorPos.z, 2)
      );
      if (dist < 2) {
        this.game.nextRoom();
        return;
      }
      requestAnimationFrame(checkTrigger);
    };
    checkTrigger();
  }
}
