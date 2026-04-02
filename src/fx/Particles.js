import * as THREE from 'three';

export class ParticleSystem {
  constructor(game) {
    this.game = game;
    this.particles = [];
    this.fireballs = [];
  }

  init() {
    // Nothing needed
  }

  update(dt) {
    // Update particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      if (p.life <= 0) {
        this.game.scene.remove(p.mesh);
        this.particles.splice(i, 1);
        continue;
      }

      const lifeRatio = p.life / p.maxLife;

      // Move
      p.mesh.position.x += p.vx * dt;
      p.mesh.position.y += p.vy * dt;
      p.mesh.position.z += p.vz * dt;

      // Gravity
      if (p.gravity) {
        p.vy -= 10 * dt;
      }

      // Fade out
      if (p.mesh.material) {
        p.mesh.material.opacity = lifeRatio * p.startOpacity;
      }

      // Scale
      if (p.shrink) {
        const s = lifeRatio * p.startScale;
        p.mesh.scale.setScalar(s);
      }

      // Rotation
      if (p.rotSpeed) {
        p.mesh.rotation.z += p.rotSpeed * dt;
      }
    }

    // Update fireballs (boss projectiles)
    for (let i = this.fireballs.length - 1; i >= 0; i--) {
      const fb = this.fireballs[i];
      fb.life -= dt;
      fb.mesh.position.x += fb.dir.x * fb.speed * dt;
      fb.mesh.position.y += fb.dir.y * fb.speed * dt;
      fb.mesh.position.z += fb.dir.z * fb.speed * dt;

      // Rotate
      fb.mesh.rotation.x += dt * 5;
      fb.mesh.rotation.y += dt * 3;

      // Fire trail
      if (Math.random() < 0.5) {
        this.spawnFireParticle(fb.mesh.position.clone());
      }

      // Check hit player
      const dist = fb.mesh.position.distanceTo(fb.game.player.position.clone().add(new THREE.Vector3(0, 1, 0)));
      if (dist < 1.2) {
        if (!fb.game.player.invulnerable && !fb.game.player.isDodging()) {
          fb.game.player.takeDamage(15, fb.dir.clone());
          fb.game.styleRank.onPlayerHit();
          fb.game.shake(0.3, 0.15);
        }
        this.spawnHitSpark(fb.mesh.position.clone());
        this.game.scene.remove(fb.mesh);
        this.fireballs.splice(i, 1);
        continue;
      }

      if (fb.life <= 0) {
        this.game.scene.remove(fb.mesh);
        this.fireballs.splice(i, 1);
      }
    }
  }

  clear() {
    for (const p of this.particles) {
      this.game.scene.remove(p.mesh);
    }
    this.particles = [];
    for (const fb of this.fireballs) {
      this.game.scene.remove(fb.mesh);
    }
    this.fireballs = [];
  }

  spawnParticle(pos, config) {
    const geo = config.geo || new THREE.SphereGeometry(0.1, 4, 4);
    const mat = new THREE.MeshBasicMaterial({
      color: config.color || 0xffffff,
      transparent: true,
      opacity: config.opacity || 1,
      depthWrite: false,
    });

    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(pos);
    if (config.scale) mesh.scale.setScalar(config.scale);
    this.game.scene.add(mesh);

    const particle = {
      mesh,
      life: config.life || 0.5,
      maxLife: config.life || 0.5,
      vx: config.vx || 0,
      vy: config.vy || 0,
      vz: config.vz || 0,
      gravity: config.gravity || false,
      shrink: config.shrink !== false,
      startOpacity: config.opacity || 1,
      startScale: config.scale || 1,
      rotSpeed: config.rotSpeed || 0,
    };

    this.particles.push(particle);
    return particle;
  }

  spawnHitSpark(pos) {
    const colors = [0xff8844, 0xffcc44, 0xff4444, 0xffffff];
    for (let i = 0; i < 8; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 4;
      const upSpeed = 1 + Math.random() * 3;
      this.spawnParticle(pos.clone(), {
        color: colors[Math.floor(Math.random() * colors.length)],
        scale: 0.05 + Math.random() * 0.08,
        life: 0.2 + Math.random() * 0.3,
        vx: Math.cos(angle) * speed,
        vy: upSpeed,
        vz: Math.sin(angle) * speed,
        gravity: true,
        opacity: 1,
      });
    }
  }

  spawnSlashTrail(pos, isDT) {
    const color = isDT ? 0xff2200 : 0x8888ff;
    this.spawnParticle(pos.clone(), {
      color,
      geo: new THREE.PlaneGeometry(0.3, 0.6),
      scale: 1,
      life: 0.15,
      opacity: 0.6,
      rotSpeed: 10,
      shrink: true,
    });
  }

  spawnMuzzleFlash(pos) {
    this.spawnParticle(pos.clone(), {
      color: 0xffff44,
      scale: 0.15,
      life: 0.06,
      opacity: 1,
      shrink: false,
    });
    // Add a brief point light
    const light = new THREE.PointLight(0xffaa00, 3, 3);
    light.position.copy(pos);
    this.game.scene.add(light);
    setTimeout(() => this.game.scene.remove(light), 50);
  }

  spawnBulletTrail(from, to) {
    const dir = to.clone().sub(from);
    const length = dir.length();
    const mid = from.clone().add(dir.multiplyScalar(0.5));

    const geo = new THREE.CylinderGeometry(0.01, 0.01, length, 4);
    const mat = new THREE.MeshBasicMaterial({
      color: 0xffff88,
      transparent: true,
      opacity: 0.5,
    });
    const trail = new THREE.Mesh(geo, mat);
    trail.position.copy(mid);
    trail.lookAt(to);
    trail.rotateX(Math.PI / 2);
    this.game.scene.add(trail);

    const particle = {
      mesh: trail,
      life: 0.08,
      maxLife: 0.08,
      vx: 0, vy: 0, vz: 0,
      gravity: false,
      shrink: false,
      startOpacity: 0.5,
      startScale: 1,
    };
    this.particles.push(particle);
  }

  spawnDeathBurst(pos) {
    // Dark red/purple burst
    for (let i = 0; i < 20; i++) {
      const angle = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      const speed = 2 + Math.random() * 4;
      this.spawnParticle(pos.clone(), {
        color: Math.random() < 0.5 ? 0x880044 : 0x440022,
        scale: 0.1 + Math.random() * 0.15,
        life: 0.5 + Math.random() * 0.5,
        vx: Math.cos(angle) * Math.sin(phi) * speed,
        vy: Math.cos(phi) * speed,
        vz: Math.sin(angle) * Math.sin(phi) * speed,
        gravity: true,
        opacity: 0.8,
      });
    }

    // Red orb particles floating up
    for (let i = 0; i < 5; i++) {
      this.spawnParticle(pos.clone().add(new THREE.Vector3(
        (Math.random() - 0.5) * 1,
        Math.random() * 0.5,
        (Math.random() - 0.5) * 1
      )), {
        color: 0xff0000,
        scale: 0.08,
        life: 1.0 + Math.random() * 0.5,
        vx: (Math.random() - 0.5) * 0.5,
        vy: 2 + Math.random() * 2,
        vz: (Math.random() - 0.5) * 0.5,
        gravity: false,
        opacity: 0.9,
      });
    }
  }

  spawnDTActivation(pos) {
    // Dramatic explosion of red energy
    for (let i = 0; i < 30; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 3 + Math.random() * 6;
      this.spawnParticle(pos.clone(), {
        color: Math.random() < 0.3 ? 0xff0000 : 0xff4400,
        scale: 0.1 + Math.random() * 0.2,
        life: 0.3 + Math.random() * 0.5,
        vx: Math.cos(angle) * speed,
        vy: Math.random() * 5,
        vz: Math.sin(angle) * speed,
        gravity: false,
        opacity: 0.9,
        shrink: true,
      });
    }
  }

  spawnFireParticle(pos) {
    const colors = [0xff4400, 0xff8800, 0xffcc00, 0xff2200];
    this.spawnParticle(pos, {
      color: colors[Math.floor(Math.random() * colors.length)],
      scale: 0.06 + Math.random() * 0.1,
      life: 0.3 + Math.random() * 0.4,
      vx: (Math.random() - 0.5) * 1,
      vy: 1 + Math.random() * 2,
      vz: (Math.random() - 0.5) * 1,
      gravity: false,
      opacity: 0.7,
      shrink: true,
    });
  }

  spawnFireball(pos, dir, game) {
    const geo = new THREE.SphereGeometry(0.4, 6, 6);
    const mat = new THREE.MeshBasicMaterial({
      color: 0xff4400,
      transparent: true,
      opacity: 0.9,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(pos);
    this.game.scene.add(mesh);

    // Inner glow
    const inner = new THREE.Mesh(
      new THREE.SphereGeometry(0.25, 6, 6),
      new THREE.MeshBasicMaterial({ color: 0xffcc00 })
    );
    mesh.add(inner);

    // Point light
    const light = new THREE.PointLight(0xff4400, 3, 5);
    mesh.add(light);

    this.fireballs.push({
      mesh,
      dir: dir.clone(),
      speed: 8,
      life: 3,
      game,
    });
  }

  spawnGroundSlam(pos) {
    // Ring of dust/debris
    for (let i = 0; i < 24; i++) {
      const angle = (i / 24) * Math.PI * 2;
      const speed = 5 + Math.random() * 3;
      this.spawnParticle(pos.clone().add(new THREE.Vector3(0, 0.2, 0)), {
        color: Math.random() < 0.5 ? 0x888866 : 0x666644,
        scale: 0.15 + Math.random() * 0.15,
        life: 0.4 + Math.random() * 0.3,
        vx: Math.cos(angle) * speed,
        vy: 1 + Math.random() * 2,
        vz: Math.sin(angle) * speed,
        gravity: true,
        opacity: 0.6,
        shrink: true,
      });
    }

    // Fire ring
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2;
      this.spawnParticle(pos.clone().add(new THREE.Vector3(
        Math.cos(angle) * 2, 0.1, Math.sin(angle) * 2
      )), {
        color: 0xff4400,
        scale: 0.2,
        life: 0.5,
        vx: Math.cos(angle) * 2,
        vy: 3,
        vz: Math.sin(angle) * 2,
        gravity: false,
        opacity: 0.8,
        shrink: true,
      });
    }
  }
}
