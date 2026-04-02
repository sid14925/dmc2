// Input manager - aggregates touch controls into game actions
export class Input {
  constructor(game) {
    this.game = game;

    // Movement (from joystick)
    this.moveX = 0;
    this.moveY = 0;

    // Action buttons
    this.attack = false;
    this.attackPressed = false;
    this.shoot = false;
    this.jump = false;
    this.jumpPressed = false;
    this.dodge = false;
    this.dodgePressed = false;
    this.devilTrigger = false;
    this.devilTriggerPressed = false;
    this.lockOn = false;

    // Previous frame states for press detection
    this._prevAttack = false;
    this._prevJump = false;
    this._prevDodge = false;
    this._prevDT = false;

    // Keyboard support for testing
    this.keys = {};
    window.addEventListener('keydown', e => {
      this.keys[e.code] = true;
    });
    window.addEventListener('keyup', e => {
      this.keys[e.code] = false;
    });
  }

  update() {
    // Detect press (rising edge)
    this.attackPressed = this.attack && !this._prevAttack;
    this.jumpPressed = this.jump && !this._prevJump;
    this.dodgePressed = this.dodge && !this._prevDodge;
    this.devilTriggerPressed = this.devilTrigger && !this._prevDT;

    this._prevAttack = this.attack;
    this._prevJump = this.jump;
    this._prevDodge = this.dodge;
    this._prevDT = this.devilTrigger;

    // Keyboard fallback
    if (this.keys['KeyW'] || this.keys['ArrowUp']) this.moveY = -1;
    else if (this.keys['KeyS'] || this.keys['ArrowDown']) this.moveY = 1;
    else if (!this.game.touchControls.joystickActive) this.moveY = 0;

    if (this.keys['KeyA'] || this.keys['ArrowLeft']) this.moveX = -1;
    else if (this.keys['KeyD'] || this.keys['ArrowRight']) this.moveX = 1;
    else if (!this.game.touchControls.joystickActive) this.moveX = 0;

    if (this.keys['KeyJ']) this.attack = true;
    if (this.keys['KeyK']) this.shoot = true;
    if (this.keys['Space']) this.jump = true;
    if (this.keys['KeyL']) this.dodge = true;
    if (this.keys['KeyU']) this.devilTrigger = true;
  }

  getMoveMagnitude() {
    return Math.min(1, Math.sqrt(this.moveX * this.moveX + this.moveY * this.moveY));
  }

  getMoveAngle() {
    return Math.atan2(this.moveX, this.moveY);
  }

  hasMovement() {
    return this.getMoveMagnitude() > 0.15;
  }
}
