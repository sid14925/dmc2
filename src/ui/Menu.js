// Main Menu, Pause, Game Over, Victory screens
export class Menu {
  constructor(game) {
    this.game = game;
    this.container = null;
    this.currentScreen = null;
  }

  show() {
    this.showMain();
  }

  hide() {
    if (this.container) {
      this.container.style.display = 'none';
    }
  }

  createContainer() {
    if (this.container) {
      this.container.remove();
    }
    this.container = document.createElement('div');
    this.container.style.cssText = `
      position: fixed; top: 0; left: 0; width: 100%; height: 100%;
      display: flex; flex-direction: column;
      justify-content: center; align-items: center;
      background: rgba(0,0,0,0.85);
      z-index: 100; pointer-events: auto;
      font-family: 'Segoe UI', Arial, sans-serif;
    `;
    document.getElementById('ui-overlay').appendChild(this.container);
    return this.container;
  }

  showMain() {
    const c = this.createContainer();
    c.innerHTML = `
      <div style="text-align: center;">
        <h1 style="
          font-size: 56px; color: #cc0000; font-style: italic;
          text-shadow: 0 0 30px #ff0000, 0 0 60px #880000, 0 2px 4px #000;
          letter-spacing: 6px; margin-bottom: 5px; line-height: 1;
        ">DEVIL MAY CRY</h1>
        <div style="
          font-size: 14px; color: #666; letter-spacing: 8px;
          margin-bottom: 50px; text-transform: uppercase;
        ">Mobile Edition</div>

        <div id="menu-start" style="
          padding: 15px 50px; margin: 10px;
          background: linear-gradient(180deg, #cc0000, #880000);
          color: #fff; font-size: 20px; font-weight: bold;
          letter-spacing: 4px; cursor: pointer;
          border: 1px solid #ff4444; border-radius: 3px;
          text-shadow: 0 1px 2px #000;
          pointer-events: auto; touch-action: manipulation;
        ">START</div>

        <div style="
          margin-top: 40px; color: #444; font-size: 11px;
          line-height: 1.8; letter-spacing: 1px;
        ">
          <div>JOYSTICK - Move &nbsp; | &nbsp; SWORD - Attack</div>
          <div>GUN - Shoot &nbsp; | &nbsp; JUMP - Jump</div>
          <div>DODGE - Dodge Roll &nbsp; | &nbsp; DT - Devil Trigger</div>
          <div style="margin-top: 10px; color: #333;">
            Keyboard: WASD + J/K/Space/L/U
          </div>
        </div>
      </div>
    `;

    c.querySelector('#menu-start').addEventListener('touchstart', (e) => {
      e.preventDefault();
      this.game.start();
    }, { passive: false });
    c.querySelector('#menu-start').addEventListener('click', () => {
      this.game.start();
    });
  }

  showPause() {
    const c = this.createContainer();
    c.innerHTML = `
      <div style="text-align: center;">
        <h2 style="
          font-size: 36px; color: #cc0000; font-style: italic;
          text-shadow: 0 0 20px #ff0000;
          letter-spacing: 4px; margin-bottom: 30px;
        ">PAUSED</h2>

        <div id="menu-resume" style="
          padding: 12px 40px; margin: 8px;
          background: linear-gradient(180deg, #cc0000, #880000);
          color: #fff; font-size: 18px; font-weight: bold;
          letter-spacing: 3px; cursor: pointer;
          border: 1px solid #ff4444; border-radius: 3px;
          pointer-events: auto; touch-action: manipulation;
        ">RESUME</div>

        <div id="menu-restart" style="
          padding: 10px 40px; margin: 8px;
          background: rgba(255,255,255,0.1);
          color: #888; font-size: 14px;
          letter-spacing: 3px; cursor: pointer;
          border: 1px solid #444; border-radius: 3px;
          pointer-events: auto; touch-action: manipulation;
        ">RESTART</div>
      </div>
    `;

    const resume = c.querySelector('#menu-resume');
    resume.addEventListener('touchstart', (e) => { e.preventDefault(); this.game.resume(); }, { passive: false });
    resume.addEventListener('click', () => this.game.resume());

    const restart = c.querySelector('#menu-restart');
    restart.addEventListener('touchstart', (e) => { e.preventDefault(); this.game.restart(); }, { passive: false });
    restart.addEventListener('click', () => this.game.restart());
  }

  showGameOver() {
    const c = this.createContainer();
    c.style.background = 'rgba(20,0,0,0.9)';
    c.innerHTML = `
      <div style="text-align: center;">
        <div style="
          font-size: 14px; color: #660000; letter-spacing: 6px;
          margin-bottom: 10px; text-transform: uppercase;
        ">You Died</div>
        <h2 style="
          font-size: 48px; color: #cc0000; font-style: italic;
          text-shadow: 0 0 30px #ff0000, 0 0 60px #880000;
          letter-spacing: 6px; margin-bottom: 10px;
        ">GAME OVER</h2>
        <div style="
          font-size: 16px; color: #666; margin-bottom: 30px;
        ">Red Orbs: ${this.game.redOrbs}</div>

        <div id="menu-retry" style="
          padding: 12px 40px; margin: 8px auto;
          background: linear-gradient(180deg, #cc0000, #880000);
          color: #fff; font-size: 18px; font-weight: bold;
          letter-spacing: 3px; cursor: pointer;
          border: 1px solid #ff4444; border-radius: 3px;
          pointer-events: auto; touch-action: manipulation;
          display: inline-block;
        ">RETRY</div>
      </div>
    `;

    const retry = c.querySelector('#menu-retry');
    retry.addEventListener('touchstart', (e) => { e.preventDefault(); this.game.restart(); }, { passive: false });
    retry.addEventListener('click', () => this.game.restart());
  }

  showVictory(orbs, bestRankIdx) {
    const ranks = ['D', 'C', 'B', 'A', 'S', 'SS', 'SSS'];
    const rankColors = ['#666', '#4488ff', '#44ff44', '#ffff44', '#ff8844', '#ff4444', '#ff00ff'];
    const c = this.createContainer();
    c.style.background = 'rgba(0,0,10,0.9)';
    c.innerHTML = `
      <div style="text-align: center;">
        <div style="
          font-size: 14px; color: #444; letter-spacing: 8px;
          margin-bottom: 10px; text-transform: uppercase;
        ">Mission Complete</div>
        <h2 style="
          font-size: 44px; color: #ffcc00; font-style: italic;
          text-shadow: 0 0 30px #ffcc00, 0 0 60px #886600;
          letter-spacing: 6px; margin-bottom: 20px;
        ">MISSION CLEAR</h2>

        <div style="margin: 20px 0;">
          <div style="font-size: 16px; color: #888; margin: 8px;">
            Red Orbs: <span style="color: #ff4444; font-size: 24px; font-weight: bold;">${orbs}</span>
          </div>
          <div style="font-size: 16px; color: #888; margin: 8px;">
            Best Style: <span style="
              color: ${rankColors[bestRankIdx]};
              font-size: 36px; font-weight: bold; font-style: italic;
              text-shadow: 0 0 15px ${rankColors[bestRankIdx]};
            ">${ranks[bestRankIdx]}</span>
          </div>
        </div>

        <div id="menu-replay" style="
          padding: 12px 40px; margin: 20px auto 8px;
          background: linear-gradient(180deg, #ccaa00, #886600);
          color: #fff; font-size: 18px; font-weight: bold;
          letter-spacing: 3px; cursor: pointer;
          border: 1px solid #ffcc44; border-radius: 3px;
          pointer-events: auto; touch-action: manipulation;
          display: inline-block;
        ">PLAY AGAIN</div>
      </div>
    `;

    const replay = c.querySelector('#menu-replay');
    replay.addEventListener('touchstart', (e) => { e.preventDefault(); this.game.restart(); }, { passive: false });
    replay.addEventListener('click', () => this.game.restart());
  }
}
