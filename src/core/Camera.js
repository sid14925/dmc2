import * as THREE from 'three';

// Fixed-angle camera system inspired by DMC1's cinematic camera
export class Camera {
  constructor(game) {
    this.game = game;
    this.camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 100);
    this.targetPos = new THREE.Vector3();
    this.currentPos = new THREE.Vector3();
    this.lookAtTarget = new THREE.Vector3();
    this.currentLookAt = new THREE.Vector3();
    this.shakeOffset = new THREE.Vector3();

    // Camera presets for different rooms
    this.presets = [
      // Room 0: High angle overview
      { offset: new THREE.Vector3(0, 12, 14), lookOffset: new THREE.Vector3(0, 0, 0) },
      // Room 1: Side angle
      { offset: new THREE.Vector3(14, 8, 0), lookOffset: new THREE.Vector3(0, 0, 0) },
      // Room 2: Low dramatic angle
      { offset: new THREE.Vector3(-5, 6, 12), lookOffset: new THREE.Vector3(0, 1, 0) },
      // Room 3: High corner
      { offset: new THREE.Vector3(10, 14, 10), lookOffset: new THREE.Vector3(0, 0, 0) },
      // Room 4: Boss room - wide shot
      { offset: new THREE.Vector3(0, 10, 18), lookOffset: new THREE.Vector3(0, 1, 0) },
    ];
    this.currentPreset = 0;
    this.transitionSpeed = 2.0;
  }

  init() {
    this.camera.position.set(0, 12, 14);
    this.currentPos.copy(this.camera.position);
    this.currentLookAt.set(0, 0, 0);
    this.camera.lookAt(0, 0, 0);
  }

  reset() {
    this.currentPreset = this.game.currentRoom % this.presets.length;
  }

  onResize(w, h) {
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  update(dt) {
    const player = this.game.player;
    if (!player) return;

    const preset = this.presets[this.currentPreset];
    const playerPos = player.position;

    // Camera follows player with offset
    this.targetPos.copy(playerPos).add(preset.offset);
    this.lookAtTarget.copy(playerPos).add(preset.lookOffset);

    // Smooth follow
    const lerpFactor = 1 - Math.exp(-this.transitionSpeed * dt);
    this.currentPos.lerp(this.targetPos, lerpFactor);
    this.currentLookAt.lerp(this.lookAtTarget, lerpFactor);

    this.camera.position.copy(this.currentPos).add(this.shakeOffset);
    this.camera.lookAt(this.currentLookAt);
  }

  applyShake(intensity) {
    this.shakeOffset.set(
      (Math.random() - 0.5) * 2 * intensity,
      (Math.random() - 0.5) * 2 * intensity,
      (Math.random() - 0.5) * 2 * intensity
    );
  }
}
