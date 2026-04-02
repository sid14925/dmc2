import * as THREE from 'three';
import { Camera } from './Camera.js';
import { Input } from './Input.js';
import { Audio } from './Audio.js';
import { Player } from '../entities/Player.js';
import { EnemyManager } from '../entities/Enemy.js';
import { Level } from '../world/Level.js';
import { HUD } from '../ui/HUD.js';
import { TouchControls } from '../ui/TouchControls.js';
import { Menu } from '../ui/Menu.js';
import { ParticleSystem } from '../fx/Particles.js';
import { StyleRank } from '../combat/StyleRank.js';

export class Game {
  constructor() {
    this.canvas = document.getElementById('game-canvas');
    this.overlay = document.getElementById('ui-overlay');

    // Renderer
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance',
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = false;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.8;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    // Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x1a1a2f);
    this.scene.fog = new THREE.FogExp2(0x1a1a2f, 0.012);

    // Clock
    this.clock = new THREE.Clock();
    this.accumulator = 0;
    this.fixedDt = 1 / 60;

    // Game state
    this.state = 'menu'; // menu, playing, paused, gameover, victory
    this.redOrbs = 0;
    this.currentRoom = 0;
    this.totalRooms = 5;
    this.screenShake = 0;
    this.screenShakeIntensity = 0;

    // Systems
    this.camera = new Camera(this);
    this.input = new Input(this);
    this.audio = new Audio(this);
    this.particles = new ParticleSystem(this);
    this.styleRank = new StyleRank(this);
    this.level = new Level(this);
    this.player = new Player(this);
    this.enemyManager = new EnemyManager(this);
    this.touchControls = new TouchControls(this);
    this.hud = new HUD(this);
    this.menu = new Menu(this);

    // Resize handler
    window.addEventListener('resize', () => this.onResize());
    this.onResize();

    // Prevent context menu on long press
    window.addEventListener('contextmenu', e => e.preventDefault());

    // Force landscape hint
    if (screen.orientation && screen.orientation.lock) {
      screen.orientation.lock('landscape').catch(() => {});
    }
  }

  init() {
    this.level.buildRoom(0);
    this.player.init();
    this.camera.init();
    this.particles.init();
    this.hud.init();
    this.touchControls.init();
    this.menu.show();
    this.audio.init();
  }

  start() {
    this.state = 'playing';
    this.menu.hide();
    this.enemyManager.spawnWave(this.currentRoom);
    this.audio.playBGM();
    this.hud.show();
    this.touchControls.show();
  }

  pause() {
    if (this.state === 'playing') {
      this.state = 'paused';
      this.menu.showPause();
      this.audio.pauseBGM();
    }
  }

  resume() {
    if (this.state === 'paused') {
      this.state = 'playing';
      this.menu.hide();
      this.audio.playBGM();
    }
  }

  gameOver() {
    this.state = 'gameover';
    this.audio.stopBGM();
    this.audio.playSFX('gameOver');
    this.menu.showGameOver();
    this.touchControls.hide();
  }

  victory() {
    this.state = 'victory';
    this.audio.stopBGM();
    this.audio.playSFX('victory');
    this.menu.showVictory(this.redOrbs, this.styleRank.bestRank);
    this.touchControls.hide();
  }

  restart() {
    this.redOrbs = 0;
    this.currentRoom = 0;
    this.screenShake = 0;
    this.styleRank.reset();
    this.enemyManager.clearAll();
    this.particles.clear();
    this.level.buildRoom(0);
    this.player.reset();
    this.camera.reset();
    this.start();
  }

  nextRoom() {
    this.currentRoom++;
    if (this.currentRoom >= this.totalRooms) {
      this.victory();
      return;
    }
    this.enemyManager.clearAll();
    this.particles.clear();
    this.level.buildRoom(this.currentRoom);
    this.player.enterRoom();
    this.camera.reset();
    this.enemyManager.spawnWave(this.currentRoom);
  }

  addRedOrbs(amount) {
    this.redOrbs += amount;
    this.hud.flashOrbs();
  }

  shake(intensity, duration) {
    this.screenShake = duration;
    this.screenShakeIntensity = intensity;
  }

  onResize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.renderer.setSize(w, h);
    this.camera.onResize(w, h);
  }

  update() {
    const delta = Math.min(this.clock.getDelta(), 0.1);

    if (this.state === 'playing') {
      this.accumulator += delta;
      while (this.accumulator >= this.fixedDt) {
        this.fixedUpdate(this.fixedDt);
        this.accumulator -= this.fixedDt;
      }
      this.lateUpdate(delta);
    }

    this.render();
    requestAnimationFrame(() => this.update());
  }

  fixedUpdate(dt) {
    this.input.update(dt);
    this.player.update(dt);
    this.enemyManager.update(dt);
    this.styleRank.update(dt);
    this.particles.update(dt);
    this.checkCollisions();
    this.checkRoomClear();
  }

  lateUpdate(dt) {
    this.camera.update(dt);
    this.hud.update(dt);

    // Screen shake
    if (this.screenShake > 0) {
      this.screenShake -= dt;
      const intensity = this.screenShakeIntensity * (this.screenShake > 0 ? 1 : 0);
      this.camera.applyShake(intensity);
    }
  }

  checkCollisions() {
    const playerPos = this.player.position;
    const playerRadius = 0.5;

    // Player attacks hitting enemies
    if (this.player.isAttacking()) {
      const attackRange = this.player.getAttackRange();
      const attackDir = this.player.getAttackDirection();
      const damage = this.player.getAttackDamage();

      for (const enemy of this.enemyManager.enemies) {
        if (enemy.dead || enemy.invulnerable) continue;
        const dist = playerPos.distanceTo(enemy.position);
        if (dist < attackRange + enemy.radius) {
          // Check if enemy is roughly in front of player
          const toEnemy = enemy.position.clone().sub(playerPos).normalize();
          const dot = attackDir.dot(toEnemy);
          if (dot > -0.3 || dist < 1.5) {
            const alreadyHit = this.player.currentHitEnemies.has(enemy.id);
            if (!alreadyHit) {
              this.player.currentHitEnemies.add(enemy.id);
              enemy.takeDamage(damage, attackDir, this.player.currentAttackType);
              this.styleRank.onHit(this.player.currentAttackType);
              this.addRedOrbs(Math.floor(damage * 2));
              this.shake(0.15, 0.1);
              this.particles.spawnHitSpark(enemy.position.clone().add(new THREE.Vector3(0, 1, 0)));
            }
          }
        }
      }
    }

    // Enemy attacks hitting player
    for (const enemy of this.enemyManager.enemies) {
      if (enemy.dead || !enemy.isAttacking()) continue;
      const dist = playerPos.distanceTo(enemy.position);
      if (dist < enemy.attackRange + playerRadius) {
        if (!this.player.invulnerable && !this.player.isDodging()) {
          this.player.takeDamage(enemy.attackDamage, enemy.getAttackDirection());
          this.styleRank.onPlayerHit();
          this.shake(0.3, 0.15);
        }
      }
    }

    // Keep player in room bounds
    const bounds = this.level.getBounds();
    playerPos.x = Math.max(bounds.minX + 0.5, Math.min(bounds.maxX - 0.5, playerPos.x));
    playerPos.z = Math.max(bounds.minZ + 0.5, Math.min(bounds.maxZ - 0.5, playerPos.z));
  }

  checkRoomClear() {
    if (this.enemyManager.allDead() && this.enemyManager.waveSpawned) {
      this.enemyManager.waveSpawned = false;
      // Brief delay then next room
      setTimeout(() => {
        if (this.state === 'playing') {
          this.level.openDoor();
        }
      }, 1500);
    }
  }

  render() {
    this.renderer.render(this.scene, this.camera.camera);
  }
}
