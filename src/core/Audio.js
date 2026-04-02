// Audio manager using Web Audio API
export class Audio {
  constructor(game) {
    this.game = game;
    this.ctx = null;
    this.bgmGain = null;
    this.sfxGain = null;
    this.bgmSource = null;
    this.initialized = false;
  }

  init() {
    // Audio context is created on first user interaction
    const initAudio = () => {
      if (this.initialized) return;
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.bgmGain = this.ctx.createGain();
      this.bgmGain.gain.value = 0.3;
      this.bgmGain.connect(this.ctx.destination);
      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.value = 0.5;
      this.sfxGain.connect(this.ctx.destination);
      this.initialized = true;
    };
    document.addEventListener('touchstart', initAudio, { once: true });
    document.addEventListener('click', initAudio, { once: true });
  }

  // Generate simple synth sounds procedurally
  playSFX(type) {
    if (!this.initialized) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;

    switch (type) {
      case 'swordSwing': {
        // Whoosh sound
        const noise = ctx.createBufferSource();
        const buf = ctx.createBuffer(1, ctx.sampleRate * 0.15, ctx.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < data.length; i++) {
          data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
        }
        noise.buffer = buf;
        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(2000, now);
        filter.frequency.exponentialRampToValueAtTime(500, now + 0.15);
        filter.Q.value = 2;
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
        noise.connect(filter).connect(gain).connect(this.sfxGain);
        noise.start(now);
        break;
      }
      case 'swordHit': {
        // Impact sound
        const osc = ctx.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(200, now);
        osc.frequency.exponentialRampToValueAtTime(50, now + 0.1);
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.5, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
        osc.connect(gain).connect(this.sfxGain);
        osc.start(now);
        osc.stop(now + 0.15);
        // Add noise burst
        const noise = ctx.createBufferSource();
        const buf = ctx.createBuffer(1, ctx.sampleRate * 0.08, ctx.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
        noise.buffer = buf;
        const ng = ctx.createGain();
        ng.gain.setValueAtTime(0.4, now);
        ng.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
        noise.connect(ng).connect(this.sfxGain);
        noise.start(now);
        break;
      }
      case 'gunshot': {
        const osc = ctx.createOscillator();
        osc.type = 'square';
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.exponentialRampToValueAtTime(80, now + 0.05);
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
        osc.connect(gain).connect(this.sfxGain);
        osc.start(now);
        osc.stop(now + 0.08);
        break;
      }
      case 'dodge': {
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.exponentialRampToValueAtTime(400, now + 0.1);
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        osc.connect(gain).connect(this.sfxGain);
        osc.start(now);
        osc.stop(now + 0.1);
        break;
      }
      case 'devilTrigger': {
        // Dramatic power-up sound
        for (let i = 0; i < 3; i++) {
          const osc = ctx.createOscillator();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(100 + i * 100, now);
          osc.frequency.exponentialRampToValueAtTime(400 + i * 200, now + 0.5);
          const gain = ctx.createGain();
          gain.gain.setValueAtTime(0.2, now);
          gain.gain.linearRampToValueAtTime(0.3, now + 0.2);
          gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
          osc.connect(gain).connect(this.sfxGain);
          osc.start(now);
          osc.stop(now + 0.5);
        }
        break;
      }
      case 'enemyHit': {
        const osc = ctx.createOscillator();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.exponentialRampToValueAtTime(60, now + 0.1);
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        osc.connect(gain).connect(this.sfxGain);
        osc.start(now);
        osc.stop(now + 0.1);
        break;
      }
      case 'enemyDeath': {
        const noise = ctx.createBufferSource();
        const buf = ctx.createBuffer(1, ctx.sampleRate * 0.4, ctx.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / data.length, 2);
        noise.buffer = buf;
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
        noise.connect(gain).connect(this.sfxGain);
        noise.start(now);
        break;
      }
      case 'playerHit': {
        const osc = ctx.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.exponentialRampToValueAtTime(100, now + 0.2);
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
        osc.connect(gain).connect(this.sfxGain);
        osc.start(now);
        osc.stop(now + 0.2);
        break;
      }
      case 'gameOver': {
        for (let i = 0; i < 4; i++) {
          const osc = ctx.createOscillator();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(400 - i * 80, now + i * 0.3);
          const gain = ctx.createGain();
          gain.gain.setValueAtTime(0, now + i * 0.3);
          gain.gain.linearRampToValueAtTime(0.2, now + i * 0.3 + 0.05);
          gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.3 + 0.3);
          osc.connect(gain).connect(this.sfxGain);
          osc.start(now + i * 0.3);
          osc.stop(now + i * 0.3 + 0.3);
        }
        break;
      }
      case 'victory': {
        const notes = [523, 659, 784, 1047];
        for (let i = 0; i < notes.length; i++) {
          const osc = ctx.createOscillator();
          osc.type = 'triangle';
          osc.frequency.value = notes[i];
          const gain = ctx.createGain();
          gain.gain.setValueAtTime(0, now + i * 0.15);
          gain.gain.linearRampToValueAtTime(0.2, now + i * 0.15 + 0.05);
          gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.15 + 0.4);
          osc.connect(gain).connect(this.sfxGain);
          osc.start(now + i * 0.15);
          osc.stop(now + i * 0.15 + 0.4);
        }
        break;
      }
      case 'doorOpen': {
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(200, now);
        osc.frequency.linearRampToValueAtTime(600, now + 0.3);
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
        osc.connect(gain).connect(this.sfxGain);
        osc.start(now);
        osc.stop(now + 0.4);
        break;
      }
      case 'styleUp': {
        const osc = ctx.createOscillator();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.linearRampToValueAtTime(1200, now + 0.15);
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
        osc.connect(gain).connect(this.sfxGain);
        osc.start(now);
        osc.stop(now + 0.2);
        break;
      }
    }
  }

  playBGM() {
    if (!this.initialized) return;
    this.stopBGM();
    // Generate a dark, rhythmic BGM procedurally
    const ctx = this.ctx;
    const duration = 8; // loop length in seconds
    const sampleRate = ctx.sampleRate;
    const length = sampleRate * duration;
    const buffer = ctx.createBuffer(2, length, sampleRate);

    for (let ch = 0; ch < 2; ch++) {
      const data = buffer.getChannelData(ch);
      for (let i = 0; i < length; i++) {
        const t = i / sampleRate;
        const beat = t * 2.5; // ~150 BPM
        const beatPhase = beat % 1;

        // Bass drum on beats
        let sample = 0;
        if (beatPhase < 0.1) {
          const env = 1 - beatPhase / 0.1;
          sample += Math.sin(2 * Math.PI * (80 - 40 * beatPhase) * t) * env * 0.3;
        }

        // Distorted power chord
        const chordFreq = (Math.floor(beat) % 4 < 2) ? 55 : 62;
        const saw = ((t * chordFreq * 2) % 1) * 2 - 1;
        const saw2 = ((t * chordFreq * 3) % 1) * 2 - 1;
        sample += (Math.tanh(saw * 3) * 0.08 + Math.tanh(saw2 * 3) * 0.06);

        // Hi-hat on off-beats
        if (beatPhase > 0.5 && beatPhase < 0.55) {
          sample += (Math.random() * 2 - 1) * 0.05 * (1 - (beatPhase - 0.5) / 0.05);
        }

        // Snare on beats 2 and 4
        const bar = beat % 4;
        if ((bar > 1 && bar < 1.08) || (bar > 3 && bar < 3.08)) {
          const snareEnv = 1 - (bar % 1 - Math.floor(bar % 1)) / 0.08;
          sample += (Math.random() * 2 - 1) * 0.12 * Math.max(0, snareEnv);
        }

        // Eerie pad (stereo)
        const padFreq = ch === 0 ? 220 : 221; // slight detune for width
        sample += Math.sin(2 * Math.PI * padFreq * t) * 0.02;
        sample += Math.sin(2 * Math.PI * padFreq * 1.5 * t) * 0.015;

        data[i] = sample * 0.7;
      }
    }

    this.bgmSource = ctx.createBufferSource();
    this.bgmSource.buffer = buffer;
    this.bgmSource.loop = true;
    this.bgmSource.connect(this.bgmGain);
    this.bgmSource.start();
  }

  stopBGM() {
    if (this.bgmSource) {
      try { this.bgmSource.stop(); } catch (e) {}
      this.bgmSource = null;
    }
  }

  pauseBGM() {
    if (this.ctx && this.ctx.state === 'running') {
      this.ctx.suspend();
    }
  }

  resumeAudio() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }
}
