// Dapur Kilat — synthesized sound effects. WebAudio only, no audio files,
// so the game stays a zero-network static bundle. Tones are short oscillator
// bursts; chopping and sizzling are filtered noise. The context is created
// lazily on the first user gesture, so autoplay rules never block it.

export function createSfx() {
  let ctx = null;
  let enabled = true;
  let sizzleNode = null;

  function ac() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  function tone(freq, dur, type, vol, slideTo, delay) {
    if (!enabled) return;
    const c = ac();
    if (!c) return;
    const t0 = c.currentTime + (delay || 0);
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = type || 'sine';
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(vol || 0.12, t0 + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(gain);
    gain.connect(c.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
  }

  function noise(dur, vol, filterFreq, delay) {
    if (!enabled) return;
    const c = ac();
    if (!c) return;
    const t0 = c.currentTime + (delay || 0);
    const len = Math.floor(c.sampleRate * dur);
    const buf = c.createBuffer(1, len, c.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = c.createBufferSource();
    src.buffer = buf;
    const filter = c.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = filterFreq || 1200;
    const gain = c.createGain();
    gain.gain.setValueAtTime(vol || 0.08, t0);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(filter);
    filter.connect(gain);
    gain.connect(c.destination);
    src.start(t0);
  }

  return {
    get enabled() { return enabled; },
    toggle() {
      enabled = !enabled;
      if (!enabled) this.stopSizzle();
      return enabled;
    },
    unlock() { ac(); },
    click() { tone(660, 0.06, 'triangle', 0.08); },
    pick() { tone(520, 0.07, 'triangle', 0.1, 760); },
    sizzle() { noise(0.3, 0.07, 5200); },
    chop() { noise(0.09, 0.14, 900); tone(180, 0.06, 'square', 0.05); },
    trash() { noise(0.16, 0.1, 500); tone(220, 0.12, 'sine', 0.06, 120); },
    fail() { tone(220, 0.22, 'sawtooth', 0.09, 140); tone(160, 0.3, 'sawtooth', 0.07, 110, 0.1); },
    serve() {
      tone(784, 0.12, 'sine', 0.12);
      tone(988, 0.12, 'sine', 0.12, null, 0.09);
      tone(1175, 0.2, 'sine', 0.12, null, 0.18);
    },
    bell() { tone(1567, 0.5, 'sine', 0.1); tone(1567, 0.4, 'sine', 0.07, null, 0.02); },
    tick() { tone(880, 0.05, 'square', 0.05); },
    startSizzle() {
      if (!enabled || sizzleNode) return;
      const c = ac();
      if (!c) return;
      const len = c.sampleRate;
      const buf = c.createBuffer(1, len, c.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
      const src = c.createBufferSource();
      src.buffer = buf;
      src.loop = true;
      const filter = c.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.value = 3000;
      const gain = c.createGain();
      gain.gain.value = 0.035;
      src.connect(filter);
      filter.connect(gain);
      gain.connect(c.destination);
      src.start();
      sizzleNode = { src, gain };
    },
    stopSizzle() {
      if (sizzleNode) {
        try { sizzleNode.src.stop(); } catch (err) { /* already stopped */ }
        sizzleNode = null;
      }
    },
  };
}
