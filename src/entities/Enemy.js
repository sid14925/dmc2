import * as THREE from 'three';
import { FSM } from '../utils/FSM.js';

let enemyIdCounter = 0;

// Base enemy class
class Enemy {
  constructor(game, type) {
    this.game = game;
    this.id = ++enemyIdCounter;
    this.type = type;
    this.position = new THREE.Vector3();
    this.velocity = new THREE.Vector3();
    this.rotation = 0;
    this.mesh = null;

    this.maxHP = 30;
    this.hp = 30;
    this.speed = 2.5;
    this.radius = 0.6;
    this.attackRange = 1.5;
    this.attackDamage = 10;
    this.dead = false;
    this.invulnerable = false;
    this.hitStunTimer = 0;
    this.deathTimer = 0;
    this.attackTimer = 0;
    this.attackCooldown = 0;
    this.attackActive = false;
    this.animTime = 0;
    this.knockbackVel = new THREE.Vector3();

    // AI
    this.aiTimer = 0;
    this.aiDecision = 'idle';
    this.strafeDir = 1;
    this.circleAngle = 0;
  }

  isAttacking() {
    return this.attackActive;
  }

  getAttackDirection() {
    return new THREE.Vector3(
      Math.sin(this.rotation), 0, Math.cos(this.rotation)
    );
  }

  takeDamage(amount, direction, attackType) {
    if (this.dead || this.invulnerable) return;
    this.hp -= amount;
    this.hitStunTimer = 0.3;
    this.attackActive = false;

    // Knockback
    this.knockbackVel.copy(direction).multiplyScalar(4);
    if (attackType === 'sword3' || attackType === 'stinger') {
      this.knockbackVel.multiplyScalar(2);
    }
    if (attackType === 'highTime') {
      this.knockbackVel.y = 5;
    }

    this.game.audio.playSFX('swordHit');

    if (this.hp <= 0) {
      this.die();
    }
  }

  die() {
    this.dead = true;
    this.deathTimer = 0;
    this.game.audio.playSFX('enemyDeath');
    this.game.particles.spawnDeathBurst(this.position.clone().add(new THREE.Vector3(0, 1, 0)));
    this.game.addRedOrbs(20 + Math.floor(Math.random() * 30));
  }

  update(dt) {
    if (this.dead) {
      this.deathTimer += dt;
      this.deathAnim(dt);
      if (this.deathTimer > 1.5) {
        return true; // Remove me
      }
      return false;
    }

    // Hitstun
    if (this.hitStunTimer > 0) {
      this.hitStunTimer -= dt;
      this.knockbackVel.x *= 0.9;
      this.knockbackVel.z *= 0.9;
      if (this.knockbackVel.y !== 0) {
        this.knockbackVel.y -= 20 * dt;
      }
      this.position.add(this.knockbackVel.clone().multiplyScalar(dt));
      if (this.position.y < 0) {
        this.position.y = 0;
        this.knockbackVel.y = 0;
      }
      this.hitAnim(dt);
      this.updateMeshTransform();
      return false;
    }

    // Attack cooldown
    if (this.attackCooldown > 0) this.attackCooldown -= dt;

    // AI update
    this.updateAI(dt);
    this.updateMeshTransform();
    return false;
  }

  updateAI(dt) {
    // Override in subclasses
  }

  updateMeshTransform() {
    if (this.mesh) {
      this.mesh.position.copy(this.position);
      this.mesh.rotation.y = this.rotation;
    }
  }

  facePlayer() {
    const player = this.game.player;
    const dir = player.position.clone().sub(this.position);
    this.rotation = Math.atan2(dir.x, dir.z);
  }

  distToPlayer() {
    return this.position.distanceTo(this.game.player.position);
  }

  hitAnim(dt) {}
  deathAnim(dt) {}
  idleAnim(dt) {}
  walkAnim(dt) {}
  attackAnim(dt) {}
}

// Marionette - puppet demon, basic melee enemy
class Marionette extends Enemy {
  constructor(game) {
    super(game, 'marionette');
    this.maxHP = 40;
    this.hp = 40;
    this.speed = 3;
    this.attackDamage = 8;
    this.attackRange = 1.8;
    this.buildModel();
  }

  buildModel() {
    this.mesh = new THREE.Group();
    const mat = new THREE.MeshLambertMaterial({ color: 0x8b6914 });
    const darkMat = new THREE.MeshLambertMaterial({ color: 0x4a3a0a });
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0xff0000 });

    // Body - thin puppet torso
    this.torso = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.7, 0.25), mat);
    this.torso.position.y = 1.2;
    this.torso.castShadow = true;
    this.mesh.add(this.torso);

    // Head - puppet head with creepy face
    this.headGroup = new THREE.Group();
    this.headGroup.position.y = 1.75;
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.3, 0.25), mat);
    this.headGroup.add(head);
    // Red eyes
    const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.04, 4, 4), eyeMat);
    eyeL.position.set(-0.08, 0.05, 0.13);
    this.headGroup.add(eyeL);
    const eyeR = new THREE.Mesh(new THREE.SphereGeometry(0.04, 4, 4), eyeMat);
    eyeR.position.set(0.08, 0.05, 0.13);
    this.headGroup.add(eyeR);
    this.mesh.add(this.headGroup);

    // Arms - long thin puppet arms
    this.leftArm = new THREE.Group();
    this.leftArm.position.set(-0.3, 1.45, 0);
    const lArm = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.6, 0.1), darkMat);
    lArm.position.y = -0.3;
    this.leftArm.add(lArm);
    // Blade/claw on arm
    const lBlade = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.25, 0.04),
      new THREE.MeshLambertMaterial({ color: 0xaaaaaa }));
    lBlade.position.y = -0.65;
    this.leftArm.add(lBlade);
    this.mesh.add(this.leftArm);

    this.rightArm = new THREE.Group();
    this.rightArm.position.set(0.3, 1.45, 0);
    const rArm = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.6, 0.1), darkMat);
    rArm.position.y = -0.3;
    this.rightArm.add(rArm);
    const rBlade = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.25, 0.04),
      new THREE.MeshLambertMaterial({ color: 0xaaaaaa }));
    rBlade.position.y = -0.65;
    this.rightArm.add(rBlade);
    this.mesh.add(this.rightArm);

    // Legs
    this.leftLeg = new THREE.Group();
    this.leftLeg.position.set(-0.12, 0.85, 0);
    const lLeg = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.6, 0.12), darkMat);
    lLeg.position.y = -0.3;
    this.leftLeg.add(lLeg);
    this.mesh.add(this.leftLeg);

    this.rightLeg = new THREE.Group();
    this.rightLeg.position.set(0.12, 0.85, 0);
    const rLeg = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.6, 0.12), darkMat);
    rLeg.position.y = -0.3;
    this.rightLeg.add(rLeg);
    this.mesh.add(this.rightLeg);

    // Puppet strings (visual)
    const stringMat = new THREE.MeshBasicMaterial({ color: 0x888888 });
    for (let i = -1; i <= 1; i += 2) {
      const string = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.005, 1.5, 4), stringMat);
      string.position.set(i * 0.15, 2.5, 0);
      this.mesh.add(string);
    }

    // HP bar
    this.hpBarBg = new THREE.Mesh(
      new THREE.PlaneGeometry(0.8, 0.08),
      new THREE.MeshBasicMaterial({ color: 0x333333 })
    );
    this.hpBarBg.position.set(0, 2.3, 0);
    this.hpBarBg.lookAt(0, 2.3, 1);
    this.mesh.add(this.hpBarBg);

    this.hpBar = new THREE.Mesh(
      new THREE.PlaneGeometry(0.78, 0.06),
      new THREE.MeshBasicMaterial({ color: 0xff0000 })
    );
    this.hpBar.position.set(0, 2.3, 0.001);
    this.hpBar.lookAt(0, 2.3, 1);
    this.mesh.add(this.hpBar);
  }

  updateAI(dt) {
    this.animTime += dt;
    const dist = this.distToPlayer();
    this.facePlayer();

    // Update HP bar
    const hpRatio = this.hp / this.maxHP;
    this.hpBar.scale.x = Math.max(0.01, hpRatio);
    this.hpBar.position.x = -(1 - hpRatio) * 0.39;

    // Make HP bar face camera
    if (this.game.camera) {
      this.hpBarBg.quaternion.copy(this.game.camera.camera.quaternion);
      this.hpBar.quaternion.copy(this.game.camera.camera.quaternion);
    }

    // Attack timer
    if (this.attackActive) {
      this.attackTimer += dt;
      this.attackAnim(dt);
      if (this.attackTimer > 0.4) {
        this.attackActive = false;
        this.attackCooldown = 1.0 + Math.random() * 0.5;
      }
      return;
    }

    // AI state machine
    this.aiTimer -= dt;
    if (this.aiTimer <= 0) {
      this.aiTimer = 0.5 + Math.random() * 0.5;
      if (dist < this.attackRange && this.attackCooldown <= 0) {
        this.aiDecision = 'attack';
      } else if (dist < 8) {
        this.aiDecision = Math.random() < 0.7 ? 'chase' : 'strafe';
        this.strafeDir = Math.random() < 0.5 ? 1 : -1;
      } else {
        this.aiDecision = 'idle';
      }
    }

    switch (this.aiDecision) {
      case 'chase': {
        const dir = this.game.player.position.clone().sub(this.position).normalize();
        this.position.x += dir.x * this.speed * dt;
        this.position.z += dir.z * this.speed * dt;
        this.walkAnim(dt);
        break;
      }
      case 'strafe': {
        const toPlayer = this.game.player.position.clone().sub(this.position);
        const perpendicular = new THREE.Vector3(-toPlayer.z, 0, toPlayer.x).normalize();
        this.position.x += perpendicular.x * this.speed * 0.6 * this.strafeDir * dt;
        this.position.z += perpendicular.z * this.speed * 0.6 * this.strafeDir * dt;
        // Also close distance slowly
        toPlayer.normalize();
        this.position.x += toPlayer.x * this.speed * 0.3 * dt;
        this.position.z += toPlayer.z * this.speed * 0.3 * dt;
        this.walkAnim(dt);
        break;
      }
      case 'attack': {
        this.attackActive = true;
        this.attackTimer = 0;
        break;
      }
      default:
        this.idleAnim(dt);
    }

    // Keep in bounds
    const bounds = this.game.level.getBounds();
    this.position.x = Math.max(bounds.minX + 0.5, Math.min(bounds.maxX - 0.5, this.position.x));
    this.position.z = Math.max(bounds.minZ + 0.5, Math.min(bounds.maxZ - 0.5, this.position.z));
  }

  idleAnim(dt) {
    // Jerky puppet idle
    const t = this.animTime;
    this.torso.position.y = 1.2 + Math.sin(t * 3) * 0.03;
    this.headGroup.rotation.z = Math.sin(t * 2) * 0.1;
    this.leftArm.rotation.x = Math.sin(t * 1.5) * 0.2;
    this.rightArm.rotation.x = Math.sin(t * 1.5 + 1) * 0.2;
    this.leftArm.rotation.z = -0.4;
    this.rightArm.rotation.z = 0.4;
  }

  walkAnim(dt) {
    const t = this.animTime;
    const cycle = Math.sin(t * 6);
    this.leftLeg.rotation.x = cycle * 0.4;
    this.rightLeg.rotation.x = -cycle * 0.4;
    this.leftArm.rotation.x = -cycle * 0.3 - 0.3;
    this.rightArm.rotation.x = cycle * 0.3 - 0.3;
    this.leftArm.rotation.z = -0.4;
    this.rightArm.rotation.z = 0.4;
    // Jerky head bob
    this.headGroup.rotation.z = Math.sin(t * 8) * 0.15;
    this.torso.position.y = 1.2 + Math.abs(cycle) * 0.03;
  }

  attackAnim(dt) {
    const progress = this.attackTimer / 0.4;
    // Swipe attack - arms slash forward
    this.leftArm.rotation.x = -2.0 + progress * 3.0;
    this.rightArm.rotation.x = -2.0 + progress * 3.0;
    this.leftArm.rotation.z = -0.3 + progress * 0.6;
    this.rightArm.rotation.z = 0.3 - progress * 0.6;
    this.torso.rotation.x = -0.2 + progress * 0.4;
  }

  hitAnim(dt) {
    this.torso.rotation.x = -0.3;
    this.headGroup.rotation.z = 0.3;
  }

  deathAnim(dt) {
    const progress = Math.min(1, this.deathTimer / 1.0);
    // Fall apart / dissolve
    this.mesh.rotation.z = progress * Math.PI * 0.4;
    this.mesh.position.y = -progress * 0.5;
    this.mesh.scale.setScalar(1 - progress * 0.5);
    // Fade out
    this.mesh.traverse(child => {
      if (child.isMesh && child.material) {
        child.material.transparent = true;
        child.material.opacity = 1 - progress;
      }
    });
  }
}

// Phantom - fire spider boss
class Phantom extends Enemy {
  constructor(game) {
    super(game, 'phantom');
    this.maxHP = 300;
    this.hp = 300;
    this.speed = 2;
    this.radius = 2.0;
    this.attackRange = 3.0;
    this.attackDamage = 20;

    // Boss patterns
    this.phase = 0; // 0: charge, 1: fireball, 2: ground slam
    this.patternTimer = 0;
    this.chargeSpeed = 12;
    this.chargeDir = new THREE.Vector3();
    this.fireballCooldown = 0;

    this.buildModel();
  }

  buildModel() {
    this.mesh = new THREE.Group();
    const bodyMat = new THREE.MeshLambertMaterial({ color: 0x8b2500, emissive: 0x331000 });
    const shellMat = new THREE.MeshLambertMaterial({ color: 0x5c1a00, emissive: 0x1a0800 });
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0xff4400 });
    const fireMat = new THREE.MeshBasicMaterial({ color: 0xff6600, transparent: true, opacity: 0.7 });

    // Main body - large spider abdomen
    const body = new THREE.Mesh(new THREE.SphereGeometry(1.2, 8, 6), bodyMat);
    body.scale.set(1, 0.6, 1.3);
    body.position.y = 1.2;
    body.castShadow = true;
    this.mesh.add(body);
    this.body = body;

    // Shell/armor plates
    const shell = new THREE.Mesh(new THREE.SphereGeometry(1.3, 8, 4), shellMat);
    shell.scale.set(1, 0.4, 1.2);
    shell.position.y = 1.5;
    shell.castShadow = true;
    this.mesh.add(shell);

    // Head
    const headGroup = new THREE.Group();
    headGroup.position.set(0, 1.2, 1.3);
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.5, 0.6), bodyMat);
    headGroup.add(head);
    // Multiple eyes
    for (let i = -1; i <= 1; i++) {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.08, 6, 6), eyeMat);
      eye.position.set(i * 0.2, 0.1, 0.3);
      headGroup.add(eye);
    }
    // Mandibles
    const mandL = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.3), shellMat);
    mandL.position.set(-0.3, -0.15, 0.3);
    mandL.rotation.y = 0.3;
    headGroup.add(mandL);
    const mandR = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.3), shellMat);
    mandR.position.set(0.3, -0.15, 0.3);
    mandR.rotation.y = -0.3;
    headGroup.add(mandR);
    this.mesh.add(headGroup);
    this.headGroup = headGroup;

    // Legs - 8 spider legs (4 per side)
    this.legs = [];
    for (let side = -1; side <= 1; side += 2) {
      for (let i = 0; i < 4; i++) {
        const leg = new THREE.Group();
        const angle = (i / 3 - 0.5) * Math.PI * 0.6;
        leg.position.set(side * 0.8, 1.0, Math.sin(angle) * 0.8);

        // Upper leg
        const upper = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.8, 0.12), shellMat);
        upper.position.set(side * 0.3, 0.1, 0);
        upper.rotation.z = side * -0.8;
        leg.add(upper);

        // Lower leg
        const lower = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.9, 0.08), bodyMat);
        lower.position.set(side * 0.7, -0.3, 0);
        lower.rotation.z = side * 0.3;
        leg.add(lower);

        this.mesh.add(leg);
        this.legs.push(leg);
      }
    }

    // Fire aura
    this.fireLight = new THREE.PointLight(0xff4400, 2, 8);
    this.fireLight.position.y = 1.5;
    this.mesh.add(this.fireLight);

    // Tail with fire
    const tail = new THREE.Mesh(new THREE.ConeGeometry(0.3, 1.5, 6), fireMat);
    tail.position.set(0, 1.5, -1.5);
    tail.rotation.x = Math.PI * 0.3;
    this.mesh.add(tail);
    this.tail = tail;

    // HP bar (larger for boss)
    this.hpBarBg = new THREE.Mesh(
      new THREE.PlaneGeometry(2.5, 0.12),
      new THREE.MeshBasicMaterial({ color: 0x333333 })
    );
    this.hpBarBg.position.set(0, 3, 0);
    this.mesh.add(this.hpBarBg);

    this.hpBar = new THREE.Mesh(
      new THREE.PlaneGeometry(2.45, 0.1),
      new THREE.MeshBasicMaterial({ color: 0xff4400 })
    );
    this.hpBar.position.set(0, 3, 0.001);
    this.mesh.add(this.hpBar);

    this.mesh.scale.setScalar(1.3);
  }

  updateAI(dt) {
    this.animTime += dt;
    const dist = this.distToPlayer();

    // Update HP bar
    const hpRatio = this.hp / this.maxHP;
    this.hpBar.scale.x = Math.max(0.01, hpRatio);
    this.hpBar.position.x = -(1 - hpRatio) * 1.225;
    if (this.game.camera) {
      this.hpBarBg.quaternion.copy(this.game.camera.camera.quaternion);
      this.hpBar.quaternion.copy(this.game.camera.camera.quaternion);
    }

    // Animate fire
    this.fireLight.intensity = 2 + Math.sin(this.animTime * 8) * 0.5;
    this.tail.material.opacity = 0.5 + Math.sin(this.animTime * 6) * 0.2;
    this.tail.rotation.z = Math.sin(this.animTime * 3) * 0.2;

    // Spawn fire particles
    if (Math.random() < 0.3) {
      const pos = this.position.clone().add(new THREE.Vector3(
        (Math.random() - 0.5) * 2, 1.5 + Math.random(), (Math.random() - 0.5) * 2
      ));
      this.game.particles.spawnFireParticle(pos);
    }

    // Leg animation
    for (let i = 0; i < this.legs.length; i++) {
      this.legs[i].rotation.x = Math.sin(this.animTime * 4 + i * 0.8) * 0.2;
    }

    // Attack handling
    if (this.attackActive) {
      this.attackTimer += dt;
      this.performAttack(dt);
      return;
    }

    this.facePlayer();
    this.patternTimer -= dt;

    if (this.patternTimer <= 0) {
      this.patternTimer = 2.0 + Math.random() * 1.5;

      // Choose attack pattern based on distance and HP
      const hpPercent = this.hp / this.maxHP;
      if (dist < 4 && Math.random() < 0.5) {
        this.phase = 2; // Ground slam
        this.attackActive = true;
        this.attackTimer = 0;
      } else if (dist > 5 && Math.random() < 0.6) {
        this.phase = 1; // Fireball
        this.attackActive = true;
        this.attackTimer = 0;
      } else if (Math.random() < 0.7) {
        this.phase = 0; // Charge
        this.attackActive = true;
        this.attackTimer = 0;
        this.chargeDir.copy(this.game.player.position).sub(this.position).normalize();
      } else {
        // Move closer
        const dir = this.game.player.position.clone().sub(this.position).normalize();
        this.position.x += dir.x * this.speed * dt;
        this.position.z += dir.z * this.speed * dt;
      }

      // Get more aggressive at low HP
      if (hpPercent < 0.3) {
        this.patternTimer *= 0.6;
        this.attackDamage = 25;
      }
    } else {
      // Move towards player slowly between attacks
      if (dist > 4) {
        const dir = this.game.player.position.clone().sub(this.position).normalize();
        this.position.x += dir.x * this.speed * dt;
        this.position.z += dir.z * this.speed * dt;
      }
    }

    // Keep in bounds
    const bounds = this.game.level.getBounds();
    this.position.x = Math.max(bounds.minX + 1.5, Math.min(bounds.maxX - 1.5, this.position.x));
    this.position.z = Math.max(bounds.minZ + 1.5, Math.min(bounds.maxZ - 1.5, this.position.z));
  }

  performAttack(dt) {
    switch (this.phase) {
      case 0: // Charge
        if (this.attackTimer < 0.5) {
          // Windup
          this.body.position.y = 1.2 - this.attackTimer * 0.3;
        } else if (this.attackTimer < 1.2) {
          // Charge forward
          this.position.x += this.chargeDir.x * this.chargeSpeed * dt;
          this.position.z += this.chargeDir.z * this.chargeSpeed * dt;
          this.attackRange = 2.5;
          // Check hit
          if (this.distToPlayer() < 2.5) {
            this.attackActive = true;
          }
        }
        if (this.attackTimer > 1.2) {
          this.attackActive = false;
          this.attackCooldown = 1.0;
          this.body.position.y = 1.2;
        }
        break;

      case 1: // Fireball
        if (this.attackTimer > 0.3 && this.attackTimer < 0.4) {
          // Spawn fireball projectile
          this.fireballCooldown = 999;
          const dir = this.game.player.position.clone().sub(this.position).normalize();
          this.game.particles.spawnFireball(
            this.position.clone().add(new THREE.Vector3(0, 1.2, 0)).add(dir.clone().multiplyScalar(1.5)),
            dir,
            this.game
          );
        }
        if (this.attackTimer > 0.8) {
          this.attackActive = false;
        }
        break;

      case 2: // Ground slam
        if (this.attackTimer < 0.4) {
          // Rise up
          this.mesh.position.y = this.attackTimer * 5;
        } else if (this.attackTimer < 0.6) {
          // Slam down
          this.mesh.position.y = Math.max(0, 2 - (this.attackTimer - 0.4) * 15);
        } else if (this.attackTimer < 0.7) {
          // Impact
          if (this.attackTimer - dt < 0.6) {
            this.game.shake(0.5, 0.3);
            this.attackRange = 4.0;
            this.attackDamage = 25;
            this.game.particles.spawnGroundSlam(this.position.clone());
          }
        }
        if (this.attackTimer > 1.0) {
          this.attackActive = false;
          this.mesh.position.y = 0;
          this.attackRange = 3.0;
          this.attackDamage = 20;
        }
        break;
    }
  }

  hitAnim(dt) {
    this.body.position.y = 1.2 + 0.1;
    this.mesh.rotation.z = Math.sin(this.animTime * 20) * 0.05;
  }

  deathAnim(dt) {
    const progress = Math.min(1, this.deathTimer / 1.5);
    this.mesh.rotation.z = Math.sin(progress * 20) * 0.1 * (1 - progress);
    this.mesh.position.y = -progress * 1;
    this.mesh.scale.setScalar(1.3 * (1 - progress * 0.5));
    this.fireLight.intensity = 2 * (1 - progress);
    // Lots of fire particles during death
    if (Math.random() < 0.5) {
      const pos = this.position.clone().add(new THREE.Vector3(
        (Math.random() - 0.5) * 3, Math.random() * 2, (Math.random() - 0.5) * 3
      ));
      this.game.particles.spawnFireParticle(pos);
    }
  }
}

// Enemy Manager
export class EnemyManager {
  constructor(game) {
    this.game = game;
    this.enemies = [];
    this.waveSpawned = false;
  }

  spawnWave(roomIndex) {
    this.clearAll();

    const waves = [
      // Room 0: 3 marionettes
      () => { this.spawnMarionettes(3); },
      // Room 1: 5 marionettes
      () => { this.spawnMarionettes(5); },
      // Room 2: 4 marionettes
      () => { this.spawnMarionettes(4); },
      // Room 3: 6 marionettes
      () => { this.spawnMarionettes(6); },
      // Room 4: Phantom boss + 2 marionettes
      () => {
        this.spawnBoss();
        this.spawnMarionettes(2);
      },
    ];

    const idx = Math.min(roomIndex, waves.length - 1);
    waves[idx]();
    this.waveSpawned = true;
  }

  spawnMarionettes(count) {
    for (let i = 0; i < count; i++) {
      const m = new Marionette(this.game);
      const angle = (i / count) * Math.PI * 2;
      const radius = 4 + Math.random() * 3;
      m.position.set(Math.sin(angle) * radius, 0, Math.cos(angle) * radius);
      m.rotation = angle + Math.PI;
      this.enemies.push(m);
      this.game.scene.add(m.mesh);
    }
  }

  spawnBoss() {
    const boss = new Phantom(this.game);
    boss.position.set(0, 0, -5);
    this.enemies.push(boss);
    this.game.scene.add(boss.mesh);
  }

  update(dt) {
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const shouldRemove = this.enemies[i].update(dt);
      if (shouldRemove) {
        this.game.scene.remove(this.enemies[i].mesh);
        this.enemies.splice(i, 1);
      }
    }
  }

  allDead() {
    return this.enemies.length === 0;
  }

  clearAll() {
    for (const enemy of this.enemies) {
      this.game.scene.remove(enemy.mesh);
    }
    this.enemies = [];
    this.waveSpawned = false;
  }
}
