import * as THREE from 'three';
import { FSM } from '../utils/FSM.js';

export class Player {
  constructor(game) {
    this.game = game;
    this.position = new THREE.Vector3(0, 0, 0);
    this.velocity = new THREE.Vector3();
    this.rotation = 0; // Y-axis rotation
    this.mesh = null;

    // Stats
    this.maxHP = 100;
    this.hp = 100;
    this.speed = 6;
    this.runSpeed = 9;
    this.dodgeSpeed = 15;
    this.gravity = -25;
    this.jumpForce = 10;
    this.yVelocity = 0;
    this.grounded = true;

    // Combat
    this.invulnerable = false;
    this.invulnerableTimer = 0;
    this.attackTimer = 0;
    this.attackDuration = 0;
    this.comboStep = 0;
    this.comboTimer = 0;
    this.comboWindow = 0.4;
    this.currentAttackType = 'none';
    this.currentHitEnemies = new Set();
    this.shootCooldown = 0;
    this.dodgeTimer = 0;

    // Devil Trigger
    this.dtGauge = 0;
    this.maxDT = 100;
    this.dtActive = false;
    this.dtDrainRate = 15;
    this.dtDamageMultiplier = 1.5;
    this.dtRegenRate = 2; // HP regen per second

    // Sword trail positions
    this.swordTip = new THREE.Vector3();

    // Animation
    this.animTime = 0;
    this.flashTimer = 0;

    // FSM states
    this.fsm = new FSM(this, {
      idle: {
        enter: (p) => { p.animTime = 0; },
        update: (p, dt) => {
          p.idleAnim(dt);
          p.checkTransitions(dt);
        }
      },
      walk: {
        update: (p, dt) => {
          p.moveAnim(dt);
          p.applyMovement(dt, p.speed);
          p.checkTransitions(dt);
        }
      },
      run: {
        update: (p, dt) => {
          p.moveAnim(dt * 1.5);
          p.applyMovement(dt, p.runSpeed);
          p.checkTransitions(dt);
        }
      },
      attack1: {
        enter: (p) => {
          p.attackTimer = 0;
          p.attackDuration = 0.35;
          p.currentAttackType = 'sword1';
          p.currentHitEnemies.clear();
          p.comboStep = 1;
          p.game.audio.playSFX('swordSwing');
        },
        update: (p, dt, t) => {
          p.attackAnim(dt, 1);
          p.attackTimer += dt;
          if (p.attackTimer >= p.attackDuration) {
            p.comboTimer = p.comboWindow;
            if (p.game.input.attackPressed || p.game.input.attack) {
              p.fsm.transition('attack2');
            } else {
              p.fsm.transition('idle');
            }
          }
        }
      },
      attack2: {
        enter: (p) => {
          p.attackTimer = 0;
          p.attackDuration = 0.3;
          p.currentAttackType = 'sword2';
          p.currentHitEnemies.clear();
          p.comboStep = 2;
          p.game.audio.playSFX('swordSwing');
        },
        update: (p, dt) => {
          p.attackAnim(dt, 2);
          p.attackTimer += dt;
          if (p.attackTimer >= p.attackDuration) {
            if (p.game.input.attackPressed || p.game.input.attack) {
              p.fsm.transition('attack3');
            } else {
              p.fsm.transition('idle');
            }
          }
        }
      },
      attack3: {
        enter: (p) => {
          p.attackTimer = 0;
          p.attackDuration = 0.5;
          p.currentAttackType = 'sword3';
          p.currentHitEnemies.clear();
          p.comboStep = 3;
          p.game.audio.playSFX('swordSwing');
          // Lunge forward
          const dir = p.getForward();
          p.velocity.x = dir.x * 5;
          p.velocity.z = dir.z * 5;
        },
        update: (p, dt) => {
          p.attackAnim(dt, 3);
          p.attackTimer += dt;
          p.velocity.x *= 0.9;
          p.velocity.z *= 0.9;
          p.position.x += p.velocity.x * dt;
          p.position.z += p.velocity.z * dt;
          if (p.attackTimer >= p.attackDuration) {
            p.fsm.transition('idle');
          }
        }
      },
      stinger: {
        enter: (p) => {
          p.attackTimer = 0;
          p.attackDuration = 0.4;
          p.currentAttackType = 'stinger';
          p.currentHitEnemies.clear();
          p.game.audio.playSFX('swordSwing');
          const dir = p.getForward();
          p.velocity.x = dir.x * 18;
          p.velocity.z = dir.z * 18;
        },
        update: (p, dt) => {
          p.stingerAnim(dt);
          p.attackTimer += dt;
          p.velocity.x *= 0.92;
          p.velocity.z *= 0.92;
          p.position.x += p.velocity.x * dt;
          p.position.z += p.velocity.z * dt;
          if (p.attackTimer >= p.attackDuration) {
            p.fsm.transition('idle');
          }
        }
      },
      highTime: {
        enter: (p) => {
          p.attackTimer = 0;
          p.attackDuration = 0.45;
          p.currentAttackType = 'highTime';
          p.currentHitEnemies.clear();
          p.yVelocity = 8;
          p.grounded = false;
          p.game.audio.playSFX('swordSwing');
        },
        update: (p, dt) => {
          p.highTimeAnim(dt);
          p.attackTimer += dt;
          p.yVelocity += p.gravity * dt;
          p.position.y += p.yVelocity * dt;
          if (p.position.y <= 0) {
            p.position.y = 0;
            p.grounded = true;
          }
          if (p.attackTimer >= p.attackDuration) {
            if (!p.grounded) p.fsm.transition('aerial');
            else p.fsm.transition('idle');
          }
        }
      },
      aerial: {
        enter: (p) => {
          p.attackTimer = 0;
          p.attackDuration = 0.3;
          p.currentAttackType = 'aerial';
          p.currentHitEnemies.clear();
        },
        update: (p, dt) => {
          p.aerialAnim(dt);
          p.attackTimer += dt;
          p.yVelocity += p.gravity * dt;
          p.position.y += p.yVelocity * dt;
          if (p.position.y <= 0) {
            p.position.y = 0;
            p.grounded = true;
            p.fsm.transition('idle');
            return;
          }
          if (p.attackTimer >= p.attackDuration) {
            if (p.game.input.attackPressed) {
              p.currentHitEnemies.clear();
              p.attackTimer = 0;
              p.game.audio.playSFX('swordSwing');
            } else {
              p.fsm.transition('fall');
            }
          }
        }
      },
      fall: {
        update: (p, dt) => {
          p.yVelocity += p.gravity * dt;
          p.position.y += p.yVelocity * dt;
          if (p.position.y <= 0) {
            p.position.y = 0;
            p.grounded = true;
            p.fsm.transition('idle');
          }
        }
      },
      shoot: {
        enter: (p) => {
          p.attackTimer = 0;
          p.shootCooldown = 0;
        },
        update: (p, dt) => {
          p.shootAnim(dt);
          p.attackTimer += dt;
          p.shootCooldown -= dt;
          if (p.shootCooldown <= 0 && p.game.input.shoot) {
            p.fireGun();
            p.shootCooldown = 0.12;
          }
          if (!p.game.input.shoot) {
            p.fsm.transition('idle');
          }
          // Can cancel into sword attack
          if (p.game.input.attackPressed) {
            p.fsm.transition('attack1');
          }
        }
      },
      dodge: {
        enter: (p) => {
          p.dodgeTimer = 0.35;
          p.invulnerable = true;
          p.game.audio.playSFX('dodge');
          // Dodge in movement direction or backward
          const input = p.game.input;
          if (input.hasMovement()) {
            const angle = input.getMoveAngle();
            p.velocity.x = Math.sin(angle) * p.dodgeSpeed;
            p.velocity.z = Math.cos(angle) * p.dodgeSpeed;
          } else {
            const dir = p.getForward();
            p.velocity.x = -dir.x * p.dodgeSpeed;
            p.velocity.z = -dir.z * p.dodgeSpeed;
          }
        },
        update: (p, dt) => {
          p.dodgeAnim(dt);
          p.dodgeTimer -= dt;
          p.velocity.x *= 0.88;
          p.velocity.z *= 0.88;
          p.position.x += p.velocity.x * dt;
          p.position.z += p.velocity.z * dt;
          if (p.dodgeTimer <= 0) {
            p.invulnerable = false;
            p.fsm.transition('idle');
          }
        }
      },
      jump: {
        enter: (p) => {
          p.yVelocity = p.jumpForce;
          p.grounded = false;
        },
        update: (p, dt) => {
          p.jumpAnim(dt);
          p.yVelocity += p.gravity * dt;
          p.position.y += p.yVelocity * dt;
          // Air movement
          const input = p.game.input;
          if (input.hasMovement()) {
            const angle = input.getMoveAngle();
            p.position.x += Math.sin(angle) * p.speed * 0.7 * dt;
            p.position.z += Math.cos(angle) * p.speed * 0.7 * dt;
            p.rotation = angle;
          }
          if (p.position.y <= 0) {
            p.position.y = 0;
            p.grounded = true;
            p.fsm.transition('idle');
          }
          // Can attack in air
          if (p.game.input.attackPressed) {
            p.fsm.transition('aerial');
          }
        }
      },
      hit: {
        enter: (p) => {
          p.attackTimer = 0;
          p.invulnerable = true;
          p.invulnerableTimer = 0.8;
        },
        update: (p, dt) => {
          p.hitAnim(dt);
          p.attackTimer += dt;
          p.velocity.x *= 0.9;
          p.velocity.z *= 0.9;
          p.position.x += p.velocity.x * dt;
          p.position.z += p.velocity.z * dt;
          if (p.attackTimer > 0.3) {
            p.fsm.transition('idle');
          }
        }
      },
      dead: {
        enter: (p) => {
          p.animTime = 0;
        },
        update: (p, dt) => {
          p.deadAnim(dt);
        }
      }
    }, 'idle');
  }

  init() {
    this.buildModel();
    this.game.scene.add(this.mesh);
  }

  buildModel() {
    this.mesh = new THREE.Group();

    const bodyMat = new THREE.MeshLambertMaterial({ color: 0xcc0000 }); // Red coat
    const skinMat = new THREE.MeshLambertMaterial({ color: 0xf5c6a0 });
    const darkMat = new THREE.MeshLambertMaterial({ color: 0x222222 });
    const silverMat = new THREE.MeshLambertMaterial({ color: 0xaaaacc });
    const hairMat = new THREE.MeshLambertMaterial({ color: 0xeeeeee }); // White hair

    // Body/Torso
    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.8, 0.35), bodyMat);
    torso.position.y = 1.3;
    torso.castShadow = true;
    this.mesh.add(torso);
    this.torso = torso;

    // Coat tails
    const coatTailL = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.7, 0.15), bodyMat);
    coatTailL.position.set(-0.15, 0.55, -0.1);
    coatTailL.castShadow = true;
    this.mesh.add(coatTailL);
    this.coatTailL = coatTailL;

    const coatTailR = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.7, 0.15), bodyMat);
    coatTailR.position.set(0.15, 0.55, -0.1);
    coatTailR.castShadow = true;
    this.mesh.add(coatTailR);
    this.coatTailR = coatTailR;

    // Head
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 8), skinMat);
    head.position.y = 1.9;
    head.castShadow = true;
    this.mesh.add(head);
    this.head = head;

    // Hair (spiky white)
    const hair = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.25, 6), hairMat);
    hair.position.y = 2.1;
    hair.castShadow = true;
    this.mesh.add(hair);

    // Left arm
    this.leftArm = new THREE.Group();
    this.leftArm.position.set(-0.4, 1.55, 0);
    const lArm = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.55, 0.15), bodyMat);
    lArm.position.y = -0.25;
    this.leftArm.add(lArm);
    this.mesh.add(this.leftArm);

    // Right arm
    this.rightArm = new THREE.Group();
    this.rightArm.position.set(0.4, 1.55, 0);
    const rArm = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.55, 0.15), bodyMat);
    rArm.position.y = -0.25;
    this.rightArm.add(rArm);
    this.mesh.add(this.rightArm);

    // Left leg
    this.leftLeg = new THREE.Group();
    this.leftLeg.position.set(-0.15, 0.9, 0);
    const lLeg = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.7, 0.18), darkMat);
    lLeg.position.y = -0.35;
    this.leftLeg.add(lLeg);
    // Boot
    const lBoot = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.2, 0.25), darkMat);
    lBoot.position.set(0, -0.7, 0.03);
    this.leftLeg.add(lBoot);
    this.mesh.add(this.leftLeg);

    // Right leg
    this.rightLeg = new THREE.Group();
    this.rightLeg.position.set(0.15, 0.9, 0);
    const rLeg = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.7, 0.18), darkMat);
    rLeg.position.y = -0.35;
    this.rightLeg.add(rLeg);
    const rBoot = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.2, 0.25), darkMat);
    rBoot.position.set(0, -0.7, 0.03);
    this.rightLeg.add(rBoot);
    this.mesh.add(this.rightLeg);

    // Rebellion sword (on back by default, in hand when attacking)
    this.sword = new THREE.Group();
    const blade = new THREE.Mesh(new THREE.BoxGeometry(0.06, 1.4, 0.02), silverMat);
    blade.position.y = 0.7;
    this.sword.add(blade);
    const hilt = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.15, 0.06), new THREE.MeshLambertMaterial({ color: 0x8b4513 }));
    this.sword.add(hilt);
    const guard = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.06, 0.08), silverMat);
    guard.position.y = 0.05;
    this.sword.add(guard);
    this.sword.position.set(0.1, 1.2, -0.25);
    this.sword.rotation.z = 0.1;
    this.mesh.add(this.sword);

    // Guns (Ebony & Ivory) - in holsters
    const gunMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
    this.gunL = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.04, 0.2), gunMat);
    this.gunL.position.set(-0.35, 0.9, 0.05);
    this.mesh.add(this.gunL);
    this.gunR = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.04, 0.2), gunMat);
    this.gunR.position.set(0.35, 0.9, 0.05);
    this.mesh.add(this.gunR);

    // Devil Trigger aura (hidden by default)
    this.dtAura = new THREE.PointLight(0xff0000, 0, 5);
    this.dtAura.position.y = 1.3;
    this.mesh.add(this.dtAura);

    // DT overlay mesh
    this.dtOverlay = new THREE.Mesh(
      new THREE.SphereGeometry(1, 8, 8),
      new THREE.MeshBasicMaterial({ color: 0xff0000, transparent: true, opacity: 0, wireframe: true })
    );
    this.dtOverlay.position.y = 1;
    this.mesh.add(this.dtOverlay);
  }

  reset() {
    this.hp = this.maxHP;
    this.dtGauge = 0;
    this.dtActive = false;
    this.position.set(0, 0, 0);
    this.velocity.set(0, 0, 0);
    this.rotation = 0;
    this.yVelocity = 0;
    this.grounded = true;
    this.invulnerable = false;
    this.invulnerableTimer = 0;
    this.comboStep = 0;
    this.comboTimer = 0;
    this.fsm.transition('idle');
    this.updateMeshTransform();
  }

  enterRoom() {
    this.position.set(0, 0, 5);
    this.rotation = Math.PI;
    this.velocity.set(0, 0, 0);
    this.updateMeshTransform();
  }

  update(dt) {
    // Invulnerability timer
    if (this.invulnerableTimer > 0) {
      this.invulnerableTimer -= dt;
      if (this.invulnerableTimer <= 0) {
        this.invulnerable = false;
      }
      // Flash effect
      this.flashTimer += dt * 15;
      this.mesh.visible = Math.sin(this.flashTimer) > 0;
    } else {
      this.mesh.visible = true;
      this.flashTimer = 0;
    }

    // Combo timeout
    if (this.comboTimer > 0) {
      this.comboTimer -= dt;
      if (this.comboTimer <= 0) {
        this.comboStep = 0;
      }
    }

    // Devil Trigger
    if (this.dtActive) {
      this.dtGauge -= this.dtDrainRate * dt;
      this.hp = Math.min(this.maxHP, this.hp + this.dtRegenRate * dt);
      this.dtAura.intensity = 3 + Math.sin(Date.now() * 0.01) * 1;
      this.dtOverlay.material.opacity = 0.15 + Math.sin(Date.now() * 0.008) * 0.05;
      this.dtOverlay.rotation.y += dt * 2;
      if (this.dtGauge <= 0) {
        this.deactivateDT();
      }
    }

    this.fsm.update(dt);
    this.updateMeshTransform();
  }

  checkTransitions(dt) {
    const input = this.game.input;

    if (this.hp <= 0) {
      this.fsm.transition('dead');
      this.game.gameOver();
      return;
    }

    // Devil Trigger activation
    if (input.devilTriggerPressed && this.dtGauge >= 30 && !this.dtActive) {
      this.activateDT();
    } else if (input.devilTriggerPressed && this.dtActive) {
      this.deactivateDT();
    }

    // Dodge has priority
    if (input.dodgePressed && this.grounded) {
      this.fsm.transition('dodge');
      return;
    }

    // Jump
    if (input.jumpPressed && this.grounded) {
      this.fsm.transition('jump');
      return;
    }

    // Attacks
    if (input.attackPressed) {
      if (input.hasMovement() && this.comboStep === 0) {
        // Forward + attack = stinger (if running)
        const mag = input.getMoveMagnitude();
        if (mag > 0.8) {
          this.fsm.transition('stinger');
          return;
        }
      }
      if (input.jumpPressed || (!this.grounded)) {
        this.fsm.transition('highTime');
        return;
      }
      this.fsm.transition('attack1');
      return;
    }

    // Shoot
    if (input.shoot && !input.attack) {
      this.fsm.transition('shoot');
      return;
    }

    // Movement
    if (input.hasMovement()) {
      const mag = input.getMoveMagnitude();
      this.fsm.transition(mag > 0.7 ? 'run' : 'walk');
    } else if (this.fsm.current === 'walk' || this.fsm.current === 'run') {
      this.fsm.transition('idle');
    }
  }

  applyMovement(dt, speed) {
    const input = this.game.input;
    if (!input.hasMovement()) return;
    const angle = input.getMoveAngle();
    // Get camera-relative direction
    const camAngle = Math.atan2(
      this.game.camera.camera.position.x - this.position.x,
      this.game.camera.camera.position.z - this.position.z
    );
    const worldAngle = angle + camAngle;
    this.position.x += Math.sin(worldAngle) * speed * dt;
    this.position.z += Math.cos(worldAngle) * speed * dt;
    this.rotation = worldAngle;
  }

  getForward() {
    return new THREE.Vector3(Math.sin(this.rotation), 0, Math.cos(this.rotation));
  }

  isAttacking() {
    const s = this.fsm.current;
    return s === 'attack1' || s === 'attack2' || s === 'attack3' ||
           s === 'stinger' || s === 'highTime' || s === 'aerial';
  }

  isDodging() {
    return this.fsm.current === 'dodge';
  }

  getAttackRange() {
    switch (this.currentAttackType) {
      case 'stinger': return 2.5;
      case 'highTime': return 1.8;
      case 'aerial': return 1.5;
      default: return 2.0;
    }
  }

  getAttackDamage() {
    let base;
    switch (this.currentAttackType) {
      case 'sword1': base = 8; break;
      case 'sword2': base = 10; break;
      case 'sword3': base = 15; break;
      case 'stinger': base = 18; break;
      case 'highTime': base = 12; break;
      case 'aerial': base = 7; break;
      case 'gun': base = 3; break;
      default: base = 5;
    }
    return this.dtActive ? base * this.dtDamageMultiplier : base;
  }

  getAttackDirection() {
    return this.getForward();
  }

  fireGun() {
    this.currentAttackType = 'gun';
    this.game.audio.playSFX('gunshot');

    const forward = this.getForward();
    const origin = this.position.clone().add(new THREE.Vector3(0, 1.3, 0));

    // Muzzle flash particle
    const muzzlePos = origin.clone().add(forward.clone().multiplyScalar(0.8));
    this.game.particles.spawnMuzzleFlash(muzzlePos);

    // Raycast to nearest enemy
    let closestEnemy = null;
    let closestDist = 20;
    for (const enemy of this.game.enemyManager.enemies) {
      if (enemy.dead) continue;
      const toEnemy = enemy.position.clone().sub(this.position);
      const dist = toEnemy.length();
      toEnemy.normalize();
      const dot = forward.dot(toEnemy);
      if (dot > 0.5 && dist < closestDist) {
        closestDist = dist;
        closestEnemy = enemy;
      }
    }

    if (closestEnemy) {
      const damage = this.getAttackDamage();
      closestEnemy.takeDamage(damage, forward, 'gun');
      this.game.styleRank.onHit('gun');
      this.game.addRedOrbs(Math.floor(damage));
      this.game.particles.spawnHitSpark(closestEnemy.position.clone().add(new THREE.Vector3(0, 1, 0)));

      // Bullet trail
      this.game.particles.spawnBulletTrail(muzzlePos, closestEnemy.position.clone().add(new THREE.Vector3(0, 1, 0)));
    }

    // Face nearest enemy while shooting
    if (closestEnemy) {
      const dir = closestEnemy.position.clone().sub(this.position);
      this.rotation = Math.atan2(dir.x, dir.z);
    }
  }

  takeDamage(amount, direction) {
    if (this.invulnerable || this.fsm.current === 'dead') return;
    this.hp -= amount;
    this.game.audio.playSFX('playerHit');
    this.velocity.copy(direction).multiplyScalar(-5);
    this.velocity.y = 0;
    if (this.hp <= 0) {
      this.hp = 0;
      this.fsm.transition('dead');
      this.game.gameOver();
    } else {
      this.fsm.transition('hit');
    }
  }

  activateDT() {
    this.dtActive = true;
    this.game.audio.playSFX('devilTrigger');
    this.game.shake(0.4, 0.3);
    // Visual change - make coat darker red, add aura
    this.torso.material = new THREE.MeshLambertMaterial({ color: 0x660000, emissive: 0x330000 });
    this.game.particles.spawnDTActivation(this.position.clone().add(new THREE.Vector3(0, 1, 0)));
  }

  deactivateDT() {
    this.dtActive = false;
    this.dtAura.intensity = 0;
    this.dtOverlay.material.opacity = 0;
    this.torso.material = new THREE.MeshLambertMaterial({ color: 0xcc0000 });
  }

  updateMeshTransform() {
    this.mesh.position.copy(this.position);
    this.mesh.rotation.y = this.rotation;
  }

  // Animation methods - procedural animation via bone transforms
  idleAnim(dt) {
    this.animTime += dt;
    const t = this.animTime;
    // Subtle breathing
    this.torso.position.y = 1.3 + Math.sin(t * 2) * 0.02;
    // Coat sway
    this.coatTailL.rotation.x = Math.sin(t * 1.5) * 0.05;
    this.coatTailR.rotation.x = Math.sin(t * 1.5 + 0.5) * 0.05;
    // Arms relaxed
    this.leftArm.rotation.x = 0;
    this.rightArm.rotation.x = 0;
    this.leftArm.rotation.z = 0.1;
    this.rightArm.rotation.z = -0.1;
    // Legs straight
    this.leftLeg.rotation.x = 0;
    this.rightLeg.rotation.x = 0;
    // Sword on back
    this.sword.position.set(0.1, 1.2, -0.25);
    this.sword.rotation.set(0.3, 0, 0.1);
  }

  moveAnim(dt) {
    this.animTime += dt;
    const t = this.animTime;
    const cycle = Math.sin(t * 8);
    // Legs walk cycle
    this.leftLeg.rotation.x = cycle * 0.5;
    this.rightLeg.rotation.x = -cycle * 0.5;
    // Arms swing opposite to legs
    this.leftArm.rotation.x = -cycle * 0.3;
    this.rightArm.rotation.x = cycle * 0.3;
    this.leftArm.rotation.z = 0.1;
    this.rightArm.rotation.z = -0.1;
    // Body bounce
    this.torso.position.y = 1.3 + Math.abs(Math.sin(t * 8)) * 0.04;
    // Coat sway
    this.coatTailL.rotation.x = cycle * 0.15;
    this.coatTailR.rotation.x = -cycle * 0.12;
  }

  attackAnim(dt, step) {
    this.animTime += dt;
    const progress = this.attackTimer / this.attackDuration;

    // Bring sword to hand
    this.sword.position.set(0.4, 1.5, 0.3);

    switch (step) {
      case 1: // Horizontal slash right
        this.rightArm.rotation.x = -1.2 + progress * 2.4;
        this.rightArm.rotation.z = -0.5 + progress * 1.0;
        this.sword.rotation.set(0, progress * Math.PI, -0.5 + progress * 1.0);
        this.torso.rotation.y = -0.3 + progress * 0.6;
        break;
      case 2: // Horizontal slash left
        this.rightArm.rotation.x = 1.2 - progress * 2.4;
        this.rightArm.rotation.z = 0.5 - progress * 1.0;
        this.sword.rotation.set(0, Math.PI - progress * Math.PI, 0.5 - progress * 1.0);
        this.torso.rotation.y = 0.3 - progress * 0.6;
        break;
      case 3: // Overhead slam
        this.rightArm.rotation.x = -2.0 + progress * 3.5;
        this.rightArm.rotation.z = 0;
        this.sword.rotation.set(-2.0 + progress * 3.5, 0, 0);
        this.torso.rotation.y = 0;
        this.torso.position.y = 1.3 - progress * 0.15;
        break;
    }

    this.leftArm.rotation.x = -0.3;
    this.leftArm.rotation.z = 0.3;

    // Spawn slash trail
    if (progress > 0.2 && progress < 0.7) {
      const swordWorldPos = new THREE.Vector3();
      this.sword.getWorldPosition(swordWorldPos);
      swordWorldPos.y += 0.7;
      this.game.particles.spawnSlashTrail(swordWorldPos, this.dtActive);
    }
  }

  stingerAnim(dt) {
    const progress = this.attackTimer / this.attackDuration;
    this.sword.position.set(0.4, 1.3, 0.5);
    this.rightArm.rotation.x = -1.5;
    this.rightArm.rotation.z = 0;
    this.sword.rotation.set(-1.5, 0, 0);
    this.torso.rotation.y = 0;
    this.leftArm.rotation.x = 0.5;
    // Legs in lunge
    this.leftLeg.rotation.x = -0.5;
    this.rightLeg.rotation.x = 0.5;
  }

  highTimeAnim(dt) {
    const progress = this.attackTimer / this.attackDuration;
    this.sword.position.set(0.4, 1.5, 0.3);
    this.rightArm.rotation.x = 1.5 - progress * 3.5;
    this.sword.rotation.set(1.5 - progress * 3.5, 0, 0);
    this.torso.position.y = 1.3 + progress * 0.2;
  }

  aerialAnim(dt) {
    this.animTime += dt;
    const cycle = Math.sin(this.animTime * 12);
    this.sword.position.set(0.4, 1.5, 0.3);
    this.rightArm.rotation.x = cycle * 1.5;
    this.sword.rotation.set(cycle * 1.5, 0, 0);
    this.leftLeg.rotation.x = -0.3;
    this.rightLeg.rotation.x = 0.3;
  }

  shootAnim(dt) {
    this.animTime += dt;
    // Arms extended forward holding guns
    this.leftArm.rotation.x = -1.5;
    this.leftArm.rotation.z = 0.3;
    this.rightArm.rotation.x = -1.5;
    this.rightArm.rotation.z = -0.3;
    // Guns in hands
    this.gunL.position.set(-0.5, 1.55, 0.5);
    this.gunR.position.set(0.5, 1.55, 0.5);
    // Recoil
    const recoil = Math.sin(this.animTime * 30) * 0.03;
    this.gunL.position.z -= recoil;
    this.gunR.position.z += recoil;
    // Sword on back
    this.sword.position.set(0.1, 1.2, -0.25);
    this.sword.rotation.set(0.3, 0, 0.1);
  }

  dodgeAnim(dt) {
    this.animTime += dt;
    const progress = 1 - (this.dodgeTimer / 0.35);
    // Lean and tuck
    this.torso.rotation.x = Math.sin(progress * Math.PI) * 0.8;
    this.torso.position.y = 1.3 - Math.sin(progress * Math.PI) * 0.3;
    this.leftLeg.rotation.x = Math.sin(progress * Math.PI) * 0.5;
    this.rightLeg.rotation.x = -Math.sin(progress * Math.PI) * 0.3;
  }

  jumpAnim(dt) {
    this.leftLeg.rotation.x = -0.3;
    this.rightLeg.rotation.x = 0.2;
    this.leftArm.rotation.x = -0.3;
    this.rightArm.rotation.x = -0.3;
    this.coatTailL.rotation.x = 0.3;
    this.coatTailR.rotation.x = 0.3;
  }

  hitAnim(dt) {
    const progress = this.attackTimer / 0.3;
    this.torso.rotation.x = -0.3 * (1 - progress);
    this.torso.position.y = 1.3 - 0.1 * (1 - progress);
  }

  deadAnim(dt) {
    this.animTime += dt;
    if (this.animTime < 0.5) {
      // Fall down
      const progress = this.animTime / 0.5;
      this.mesh.rotation.x = progress * Math.PI / 2;
      this.mesh.position.y = Math.max(0, 0.5 - progress * 0.5);
    }
  }
}
