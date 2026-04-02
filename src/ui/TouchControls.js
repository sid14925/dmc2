// Virtual gamepad for mobile touch input
export class TouchControls {
  constructor(game) {
    this.game = game;
    this.container = null;
    this.joystickActive = false;
    this.joystickId = null;
    this.joystickOrigin = { x: 0, y: 0 };
    this.buttons = {};
    this.visible = false;
  }

  init() {
    this.container = document.createElement('div');
    this.container.id = 'touch-controls';
    this.container.style.cssText = `
      position: fixed; top: 0; left: 0; width: 100%; height: 100%;
      pointer-events: none; z-index: 20; display: none;
    `;
    document.getElementById('ui-overlay').appendChild(this.container);

    this.createJoystick();
    this.createButtons();
  }

  createJoystick() {
    const zone = document.createElement('div');
    zone.style.cssText = `
      position: absolute; left: 0; top: 0; width: 40%; height: 100%;
      pointer-events: auto; touch-action: none;
    `;

    const base = document.createElement('div');
    base.style.cssText = `
      position: absolute; left: 60px; bottom: 80px;
      width: 120px; height: 120px; border-radius: 50%;
      background: rgba(255,255,255,0.1);
      border: 2px solid rgba(255,255,255,0.2);
    `;
    this.joystickBase = base;
    zone.appendChild(base);

    const knob = document.createElement('div');
    knob.style.cssText = `
      position: absolute; left: 50%; top: 50%;
      width: 50px; height: 50px; border-radius: 50%;
      background: rgba(255,255,255,0.3);
      border: 2px solid rgba(255,255,255,0.5);
      transform: translate(-50%, -50%);
      transition: none;
    `;
    base.appendChild(knob);
    this.joystickKnob = knob;

    zone.addEventListener('touchstart', (e) => this.onJoystickStart(e), { passive: false });
    zone.addEventListener('touchmove', (e) => this.onJoystickMove(e), { passive: false });
    zone.addEventListener('touchend', (e) => this.onJoystickEnd(e), { passive: false });
    zone.addEventListener('touchcancel', (e) => this.onJoystickEnd(e), { passive: false });

    this.container.appendChild(zone);
  }

  createButtons() {
    const zone = document.createElement('div');
    zone.style.cssText = `
      position: absolute; right: 0; top: 0; width: 45%; height: 100%;
      pointer-events: auto; touch-action: none;
    `;

    // Button layout (diamond pattern like a gamepad)
    const buttonDefs = [
      { id: 'attack', label: 'SWORD', x: -90, y: -80, color: '#cc0000', size: 60 },
      { id: 'shoot', label: 'GUN', x: -155, y: -140, color: '#4488ff', size: 52 },
      { id: 'jump', label: 'JUMP', x: -30, y: -150, color: '#44cc44', size: 55 },
      { id: 'dodge', label: 'DODGE', x: -160, y: -55, color: '#cccc00', size: 50 },
      { id: 'devilTrigger', label: 'DT', x: -75, y: -210, color: '#ff4400', size: 45 },
    ];

    for (const def of buttonDefs) {
      const btn = document.createElement('div');
      btn.style.cssText = `
        position: absolute;
        right: ${-def.x}px; bottom: ${-def.y}px;
        width: ${def.size}px; height: ${def.size}px;
        border-radius: 50%;
        background: rgba(${this.hexToRgb(def.color)}, 0.25);
        border: 2px solid ${def.color};
        display: flex; align-items: center; justify-content: center;
        font-size: 10px; color: ${def.color}; font-weight: bold;
        letter-spacing: 1px;
        user-select: none; touch-action: none;
        pointer-events: auto;
      `;
      btn.textContent = def.label;
      btn.dataset.action = def.id;

      btn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        this.onButtonDown(def.id);
        btn.style.background = `rgba(${this.hexToRgb(def.color)}, 0.6)`;
        btn.style.transform = 'scale(0.9)';
      }, { passive: false });

      btn.addEventListener('touchend', (e) => {
        e.preventDefault();
        this.onButtonUp(def.id);
        btn.style.background = `rgba(${this.hexToRgb(def.color)}, 0.25)`;
        btn.style.transform = 'scale(1)';
      }, { passive: false });

      btn.addEventListener('touchcancel', (e) => {
        this.onButtonUp(def.id);
        btn.style.background = `rgba(${this.hexToRgb(def.color)}, 0.25)`;
        btn.style.transform = 'scale(1)';
      });

      zone.appendChild(btn);
      this.buttons[def.id] = btn;
    }

    // Pause button (top right)
    const pauseBtn = document.createElement('div');
    pauseBtn.style.cssText = `
      position: absolute; right: 20px; top: 20px;
      width: 40px; height: 40px;
      display: flex; align-items: center; justify-content: center;
      font-size: 18px; color: #888;
      pointer-events: auto; touch-action: none;
      border: 1px solid #444; border-radius: 5px;
      background: rgba(0,0,0,0.3);
    `;
    pauseBtn.textContent = '||';
    pauseBtn.addEventListener('touchstart', (e) => {
      e.preventDefault();
      if (this.game.state === 'playing') this.game.pause();
    }, { passive: false });
    zone.appendChild(pauseBtn);

    this.container.appendChild(zone);
  }

  hexToRgb(hex) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `${r},${g},${b}`;
  }

  onJoystickStart(e) {
    e.preventDefault();
    if (this.joystickActive) return;
    const touch = e.changedTouches[0];
    this.joystickActive = true;
    this.joystickId = touch.identifier;

    const rect = this.joystickBase.getBoundingClientRect();
    this.joystickOrigin.x = rect.left + rect.width / 2;
    this.joystickOrigin.y = rect.top + rect.height / 2;

    this.updateJoystick(touch.clientX, touch.clientY);
  }

  onJoystickMove(e) {
    e.preventDefault();
    for (const touch of e.changedTouches) {
      if (touch.identifier === this.joystickId) {
        this.updateJoystick(touch.clientX, touch.clientY);
      }
    }
  }

  onJoystickEnd(e) {
    for (const touch of e.changedTouches) {
      if (touch.identifier === this.joystickId) {
        this.joystickActive = false;
        this.joystickId = null;
        this.game.input.moveX = 0;
        this.game.input.moveY = 0;
        this.joystickKnob.style.transform = 'translate(-50%, -50%)';
      }
    }
  }

  updateJoystick(touchX, touchY) {
    const dx = touchX - this.joystickOrigin.x;
    const dy = touchY - this.joystickOrigin.y;
    const maxDist = 50;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const clampedDist = Math.min(dist, maxDist);
    const angle = Math.atan2(dy, dx);

    const nx = Math.cos(angle) * clampedDist;
    const ny = Math.sin(angle) * clampedDist;

    this.joystickKnob.style.transform = `translate(calc(-50% + ${nx}px), calc(-50% + ${ny}px))`;

    // Normalize to -1..1
    this.game.input.moveX = nx / maxDist;
    this.game.input.moveY = ny / maxDist;
  }

  onButtonDown(action) {
    const input = this.game.input;
    switch (action) {
      case 'attack': input.attack = true; break;
      case 'shoot': input.shoot = true; break;
      case 'jump': input.jump = true; break;
      case 'dodge': input.dodge = true; break;
      case 'devilTrigger': input.devilTrigger = true; break;
    }
  }

  onButtonUp(action) {
    const input = this.game.input;
    switch (action) {
      case 'attack': input.attack = false; break;
      case 'shoot': input.shoot = false; break;
      case 'jump': input.jump = false; break;
      case 'dodge': input.dodge = false; break;
      case 'devilTrigger': input.devilTrigger = false; break;
    }
  }

  show() {
    this.container.style.display = 'block';
    this.visible = true;
  }

  hide() {
    this.container.style.display = 'none';
    this.visible = false;
  }
}
