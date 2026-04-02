// Heads-Up Display - HP, DT gauge, Style rank, Red Orbs
export class HUD {
  constructor(game) {
    this.game = game;
    this.container = null;
    this.elements = {};
    this.styleFlashTimer = 0;
    this.orbFlashTimer = 0;
  }

  init() {
    this.container = document.createElement('div');
    this.container.id = 'hud';
    this.container.style.cssText = `
      position: fixed; top: 0; left: 0; width: 100%; height: 100%;
      pointer-events: none; z-index: 15; display: none;
      font-family: 'Segoe UI', Arial, sans-serif;
    `;
    document.getElementById('ui-overlay').appendChild(this.container);

    this.createHPBar();
    this.createDTBar();
    this.createStyleMeter();
    this.createOrbCounter();
    this.createRoomIndicator();
  }

  createHPBar() {
    const wrapper = document.createElement('div');
    wrapper.style.cssText = `
      position: absolute; top: 15px; left: 15px;
    `;

    const label = document.createElement('div');
    label.style.cssText = `font-size: 10px; color: #888; margin-bottom: 2px; letter-spacing: 2px;`;
    label.textContent = 'VITALITY';
    wrapper.appendChild(label);

    const barBg = document.createElement('div');
    barBg.style.cssText = `
      width: 180px; height: 12px;
      background: rgba(0,0,0,0.6);
      border: 1px solid #444;
      border-radius: 2px; overflow: hidden;
    `;
    const bar = document.createElement('div');
    bar.style.cssText = `
      width: 100%; height: 100%;
      background: linear-gradient(180deg, #44ff44, #228822);
      transition: width 0.2s;
    `;
    barBg.appendChild(bar);
    wrapper.appendChild(barBg);

    this.elements.hpBar = bar;
    this.container.appendChild(wrapper);
  }

  createDTBar() {
    const wrapper = document.createElement('div');
    wrapper.style.cssText = `
      position: absolute; top: 48px; left: 15px;
    `;

    const label = document.createElement('div');
    label.style.cssText = `font-size: 10px; color: #888; margin-bottom: 2px; letter-spacing: 2px;`;
    label.textContent = 'DEVIL TRIGGER';
    wrapper.appendChild(label);

    const barBg = document.createElement('div');
    barBg.style.cssText = `
      width: 140px; height: 10px;
      background: rgba(0,0,0,0.6);
      border: 1px solid #444;
      border-radius: 2px; overflow: hidden;
    `;
    const bar = document.createElement('div');
    bar.style.cssText = `
      width: 0%; height: 100%;
      background: linear-gradient(180deg, #ff4444, #880000);
      transition: width 0.15s;
    `;
    barBg.appendChild(bar);
    wrapper.appendChild(barBg);

    this.elements.dtBar = bar;
    this.container.appendChild(wrapper);
  }

  createStyleMeter() {
    const wrapper = document.createElement('div');
    wrapper.style.cssText = `
      position: absolute; top: 15px; right: 80px;
      text-align: right;
    `;

    const rank = document.createElement('div');
    rank.style.cssText = `
      font-size: 48px; font-weight: bold; font-style: italic;
      color: #666; text-shadow: 0 0 10px currentColor;
      transition: color 0.2s, text-shadow 0.2s;
      line-height: 1;
    `;
    rank.textContent = 'D';
    wrapper.appendChild(rank);
    this.elements.styleRank = rank;

    const combo = document.createElement('div');
    combo.style.cssText = `
      font-size: 14px; color: #888;
      margin-top: -5px; letter-spacing: 1px;
    `;
    combo.textContent = '';
    wrapper.appendChild(combo);
    this.elements.comboCounter = combo;

    const label = document.createElement('div');
    label.style.cssText = `font-size: 10px; color: #555; letter-spacing: 3px; margin-top: 2px;`;
    label.textContent = 'STYLE';
    wrapper.appendChild(label);

    this.container.appendChild(wrapper);
  }

  createOrbCounter() {
    const wrapper = document.createElement('div');
    wrapper.style.cssText = `
      position: absolute; bottom: 15px; left: 15px;
      display: flex; align-items: center; gap: 6px;
    `;

    // Red orb icon
    const icon = document.createElement('div');
    icon.style.cssText = `
      width: 16px; height: 16px; border-radius: 50%;
      background: radial-gradient(circle, #ff4444, #880000);
      box-shadow: 0 0 6px #ff0000;
    `;
    wrapper.appendChild(icon);

    const count = document.createElement('div');
    count.style.cssText = `font-size: 16px; color: #ff4444; font-weight: bold;`;
    count.textContent = '0';
    wrapper.appendChild(count);
    this.elements.orbCount = count;

    this.container.appendChild(wrapper);
  }

  createRoomIndicator() {
    const indicator = document.createElement('div');
    indicator.style.cssText = `
      position: absolute; top: 50%; left: 50%;
      transform: translate(-50%, -50%);
      font-size: 28px; font-weight: bold; color: #cc0000;
      text-shadow: 0 0 20px #ff0000;
      opacity: 0; transition: opacity 0.5s;
      letter-spacing: 4px; text-transform: uppercase;
    `;
    this.elements.roomIndicator = indicator;
    this.container.appendChild(indicator);
  }

  update(dt) {
    const player = this.game.player;
    const style = this.game.styleRank;

    // HP bar
    const hpPercent = (player.hp / player.maxHP) * 100;
    this.elements.hpBar.style.width = `${hpPercent}%`;
    if (hpPercent < 30) {
      this.elements.hpBar.style.background = `linear-gradient(180deg, #ff4444, #882222)`;
    } else {
      this.elements.hpBar.style.background = `linear-gradient(180deg, #44ff44, #228822)`;
    }

    // DT bar
    const dtPercent = (player.dtGauge / player.maxDT) * 100;
    this.elements.dtBar.style.width = `${dtPercent}%`;
    if (player.dtActive) {
      this.elements.dtBar.style.background = `linear-gradient(180deg, #ff8844, #ff2200)`;
      this.elements.dtBar.style.boxShadow = '0 0 10px #ff4400';
    } else {
      this.elements.dtBar.style.background = `linear-gradient(180deg, #ff4444, #880000)`;
      this.elements.dtBar.style.boxShadow = 'none';
    }

    // Style rank
    this.elements.styleRank.textContent = style.getRankText();
    this.elements.styleRank.style.color = style.getRankColor();
    this.elements.styleRank.style.textShadow = `0 0 15px ${style.getRankColor()}`;

    // Style flash effect
    if (this.styleFlashTimer > 0) {
      this.styleFlashTimer -= dt;
      const scale = 1 + this.styleFlashTimer * 2;
      this.elements.styleRank.style.transform = `scale(${scale})`;
    } else {
      this.elements.styleRank.style.transform = 'scale(1)';
    }

    // Combo counter
    const combo = style.getComboCount();
    if (combo > 1) {
      this.elements.comboCounter.textContent = `${combo} HITS`;
    } else {
      this.elements.comboCounter.textContent = '';
    }

    // Orb counter
    this.elements.orbCount.textContent = this.game.redOrbs;
    if (this.orbFlashTimer > 0) {
      this.orbFlashTimer -= dt;
      this.elements.orbCount.style.color = '#ffff44';
    } else {
      this.elements.orbCount.style.color = '#ff4444';
    }
  }

  flashStyle() {
    this.styleFlashTimer = 0.3;
  }

  flashOrbs() {
    this.orbFlashTimer = 0.3;
  }

  showRoomName(name) {
    this.elements.roomIndicator.textContent = name;
    this.elements.roomIndicator.style.opacity = '1';
    setTimeout(() => {
      this.elements.roomIndicator.style.opacity = '0';
    }, 2000);
  }

  show() {
    this.container.style.display = 'block';
  }

  hide() {
    this.container.style.display = 'none';
  }
}
