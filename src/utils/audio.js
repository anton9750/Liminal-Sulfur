// src/utils/audio.js
// Synthesizes all game audio with the Web Audio API. No external assets.
// Systems: ambient hum, footsteps (carpet thuds), breathing (sanity-tied),
// monster growls, distant thumps, jump-scare sting, exit chime, music.

export class AudioSystem {
  constructor() {
    this.audioCtx = null;
    this.noiseInterval = null;
    this.masterGain = null;

    // Exposed nodes for dynamic control
    this.breathGain = null;
    this.humGain = null;
    this.monsterGrowlInterval = null;

    // Music playback state
    this.musicBuffer = null;
    this.musicSource = null;
    this.musicGain = null;
  }

  start() {
    if (this.audioCtx) return;
    this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const ctx = this.audioCtx;

    this.masterGain = ctx.createGain();
    this.masterGain.gain.value = 1;
    this.masterGain.connect(ctx.destination);

    // ── Electrical hum (60 Hz + 120 Hz) ──────────────────────────────
    const osc = ctx.createOscillator();
    osc.type = 'sine'; osc.frequency.value = 60;
    this.humGain = ctx.createGain();
    this.humGain.gain.value = 0.025;
    osc.connect(this.humGain).connect(this.masterGain);
    osc.start();

    const osc2 = ctx.createOscillator();
    osc2.type = 'triangle'; osc2.frequency.value = 120;
    const g2 = ctx.createGain(); g2.gain.value = 0.012;
    osc2.connect(g2).connect(this.masterGain);
    osc2.start();

    // ── Breathing (starts quiet, rises with sanity loss) ──────────────
    this.breathGain = ctx.createGain();
    this.breathGain.gain.value = 0;
    this._startBreathing();

    // ── Distant thuds (random) ────────────────────────────────────────
    this.noiseInterval = setInterval(() => {
      if (Math.random() < 0.25) this._playDistantNoise();
    }, 7000);
  }

  // ── Music loading and playback ────────────────────────────────────
  async loadMusic(url) {
    if (!this.audioCtx) return;
    try {
      const res = await fetch(url);
      const arrayBuffer = await res.arrayBuffer();
      this.musicBuffer = await this.audioCtx.decodeAudioData(arrayBuffer);
    } catch (e) {
      console.error("Music load failed:", e);
      throw e;
    }
  }

  playMusic() {
    if (!this.audioCtx || !this.musicBuffer || this.musicSource) return;
    this.musicSource = this.audioCtx.createBufferSource();
    this.musicSource.buffer = this.musicBuffer;
    this.musicSource.loop = true;
    
    this.musicGain = this.audioCtx.createGain();
    this.musicGain.gain.value = 0.4;
    
    this.musicSource.connect(this.musicGain).connect(this.masterGain);
    this.musicSource.start();
  }

  stopMusic() {
    if (this.musicSource) {
      this.musicSource.stop();
      this.musicSource.disconnect();
      this.musicSource = null;
    }
  }

  // ── Breathing oscillator (LFO-shaped noise) ────────────────────────
  _startBreathing() {
    const ctx = this.audioCtx;
    const breathLoop = () => {
      if (!this.audioCtx) return;
      this._playBreathPuff(0.6, 1200, true);
      setTimeout(() => {
        if (!this.audioCtx) return;
        this._playBreathPuff(0.9, 800, false);
        setTimeout(breathLoop, 2200);
      }, 700);
    };
    setTimeout(breathLoop, 500);
  }

  _playBreathPuff(dur, freq, inhale) {
    if (!this.audioCtx || !this.breathGain) return;
    const ctx = this.audioCtx;
    const bufSize = Math.floor(ctx.sampleRate * dur);
    const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) {
      const t = i / bufSize;
      const env = Math.sin(t * Math.PI);
      data[i] = (Math.random() * 2 - 1) * env * 0.5;
    }
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = freq;
    filter.Q.value = 2;
    src.connect(filter).connect(this.breathGain).connect(this.masterGain);
    src.start();
  }

  // ── Footstep: muffled carpet thud ────────────────────────────────
  playFootstep() {
    if (!this.audioCtx) return;
    const ctx = this.audioCtx;
    const bufSize = Math.floor(ctx.sampleRate * 0.08);
    const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / bufSize * 10);
    }
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass'; filter.frequency.value = 220 + Math.random() * 80;
    const g = ctx.createGain(); g.gain.value = 0.18 + Math.random() * 0.06;
    src.connect(filter).connect(g).connect(this.masterGain);
    src.start();
  }

  // ── Monster growl / scrape ────────────────────────────────────────
  playMonsterGrowl(volume = 0.12) {
    if (!this.audioCtx) return;
    const ctx = this.audioCtx;
    const dur = 0.4 + Math.random() * 0.3;
    const bufSize = Math.floor(ctx.sampleRate * dur);
    const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
    const data = buf.getChannelData(0);
    const baseFreq = 55 + Math.random() * 30;
    for (let i = 0; i < bufSize; i++) {
      const t = i / ctx.sampleRate;
      data[i] = Math.sin(2 * Math.PI * baseFreq * t + Math.sin(2 * Math.PI * 2 * t) * 3)
        * Math.exp(-t / dur * 2) * (0.6 + 0.4 * Math.random());
    }
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass'; filter.frequency.value = 350;
    const dist = ctx.createWaveShaper();
    const curve = new Float32Array(256);
    for (let i = 0; i < 256; i++) {
      const x = (i * 2 / 255) - 1;
      curve[i] = (Math.PI + 80) * x / (Math.PI + 80 * Math.abs(x));
    }
    dist.curve = curve;
    const g = ctx.createGain(); g.gain.value = volume;
    src.connect(dist).connect(filter).connect(g).connect(this.masterGain);
    src.start();
  }

  // ── Jump-scare loud sting ─────────────────────────────────────────
  playJumpScare() {
    if (!this.audioCtx) return;
    const ctx = this.audioCtx;
    const boom = ctx.createOscillator();
    boom.type = 'sawtooth'; boom.frequency.setValueAtTime(80, ctx.currentTime);
    boom.frequency.exponentialRampToValueAtTime(20, ctx.currentTime + 0.4);
    const bGain = ctx.createGain();
    bGain.gain.setValueAtTime(0.9, ctx.currentTime);
    bGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
    const bFilter = ctx.createBiquadFilter();
    bFilter.type = 'lowpass'; bFilter.frequency.value = 200;
    boom.connect(bFilter).connect(bGain).connect(this.masterGain);
    boom.start(); boom.stop(ctx.currentTime + 0.5);

    const bufSize = Math.floor(ctx.sampleRate * 0.6);
    const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) {
      const t = i / bufSize;
      data[i] = (Math.random() * 2 - 1) * (1 - t) * (t < 0.05 ? t / 0.05 : 1);
    }
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass'; filter.frequency.value = 3000; filter.Q.value = 0.5;
    const sg = ctx.createGain(); sg.gain.value = 0.6;
    src.connect(filter).connect(sg).connect(this.masterGain);
    src.start();
  }

  // ── Exit portal chime ─────────────────────────────────────────────
  playExitChime() {
    if (!this.audioCtx) return;
    const ctx = this.audioCtx;
    [523, 659, 784, 1047].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      osc.type = 'sine'; osc.frequency.value = freq;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0, ctx.currentTime + i * 0.15);
      g.gain.linearRampToValueAtTime(0.15, ctx.currentTime + i * 0.15 + 0.05);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.15 + 1.2);
      osc.connect(g).connect(this.masterGain);
      osc.start(ctx.currentTime + i * 0.15);
      osc.stop(ctx.currentTime + i * 0.15 + 1.3);
    });
  }

  setBreathIntensity(t) {
    if (!this.breathGain) return;
    this.breathGain.gain.setTargetAtTime(t * 0.14, this.audioCtx.currentTime, 0.5);
  }

  _playDistantNoise() {
    if (!this.audioCtx) return;
    const ctx = this.audioCtx;
    const bufferSize = ctx.sampleRate * 0.6;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / bufferSize * 4);
    }
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 250 + Math.random() * 200;
    const gain = ctx.createGain();
    gain.gain.value = 0.12;
    src.connect(filter).connect(gain).connect(this.masterGain);
    src.start();
  }

  stop() {
    this.stopMusic();
    if (this.noiseInterval) clearInterval(this.noiseInterval);
    this.noiseInterval = null;
    if (this.monsterGrowlInterval) clearInterval(this.monsterGrowlInterval);
    this.monsterGrowlInterval = null;
    if (this.audioCtx) { this.audioCtx.close(); this.audioCtx = null; }
  }
}