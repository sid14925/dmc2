// Style Rank system - D to SSS
export class StyleRank {
  constructor(game) {
    this.game = game;
    this.ranks = ['D', 'C', 'B', 'A', 'S', 'SS', 'SSS'];
    this.rankColors = ['#666666', '#4488ff', '#44ff44', '#ffff44', '#ff8844', '#ff4444', '#ff00ff'];
    this.currentRank = 0;
    this.bestRank = 0;
    this.points = 0;
    this.thresholds = [0, 50, 120, 220, 350, 500, 700];
    this.decayRate = 15;
    this.decayDelay = 2.0;
    this.timeSinceLastHit = 0;
    this.comboCount = 0;
    this.lastAttackType = '';
    this.varietyBonus = 1.0;
    this.attackTypes = new Set();
  }

  reset() {
    this.currentRank = 0;
    this.bestRank = 0;
    this.points = 0;
    this.comboCount = 0;
    this.timeSinceLastHit = 0;
    this.attackTypes.clear();
    this.varietyBonus = 1.0;
  }

  onHit(attackType) {
    this.timeSinceLastHit = 0;
    this.comboCount++;

    // Variety bonus - using different attacks gives more points
    if (attackType !== this.lastAttackType) {
      this.varietyBonus = Math.min(3.0, this.varietyBonus + 0.3);
    }
    this.lastAttackType = attackType;
    this.attackTypes.add(attackType);

    // Points based on attack type and variety
    let basePoints;
    switch (attackType) {
      case 'sword1': basePoints = 10; break;
      case 'sword2': basePoints = 15; break;
      case 'sword3': basePoints = 25; break;
      case 'stinger': basePoints = 30; break;
      case 'highTime': basePoints = 20; break;
      case 'aerial': basePoints = 18; break;
      case 'gun': basePoints = 5; break;
      default: basePoints = 8;
    }

    this.points += basePoints * this.varietyBonus;

    // Check rank up
    const prevRank = this.currentRank;
    for (let i = this.ranks.length - 1; i >= 0; i--) {
      if (this.points >= this.thresholds[i]) {
        this.currentRank = i;
        break;
      }
    }

    if (this.currentRank > prevRank) {
      this.game.audio.playSFX('styleUp');
      this.game.hud.flashStyle();
    }

    if (this.currentRank > this.bestRank) {
      this.bestRank = this.currentRank;
    }

    // Build DT gauge
    this.game.player.dtGauge = Math.min(
      this.game.player.maxDT,
      this.game.player.dtGauge + basePoints * 0.3
    );
  }

  onPlayerHit() {
    // Getting hit drops rank significantly
    this.points = Math.max(0, this.points - 100);
    this.comboCount = 0;
    this.varietyBonus = 1.0;
    this.attackTypes.clear();
    // Recalculate rank
    this.currentRank = 0;
    for (let i = this.ranks.length - 1; i >= 0; i--) {
      if (this.points >= this.thresholds[i]) {
        this.currentRank = i;
        break;
      }
    }
  }

  update(dt) {
    this.timeSinceLastHit += dt;
    // Decay points over time if no hits
    if (this.timeSinceLastHit > this.decayDelay) {
      this.points = Math.max(0, this.points - this.decayRate * dt);
      this.varietyBonus = Math.max(1.0, this.varietyBonus - dt * 0.5);
      // Recalculate rank
      this.currentRank = 0;
      for (let i = this.ranks.length - 1; i >= 0; i--) {
        if (this.points >= this.thresholds[i]) {
          this.currentRank = i;
          break;
        }
      }
    }

    // Reset combo if too long without hit
    if (this.timeSinceLastHit > 3.0) {
      this.comboCount = 0;
      this.attackTypes.clear();
    }
  }

  getRankText() {
    return this.ranks[this.currentRank];
  }

  getRankColor() {
    return this.rankColors[this.currentRank];
  }

  getComboCount() {
    return this.comboCount;
  }
}
