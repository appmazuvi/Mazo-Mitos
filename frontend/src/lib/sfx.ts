let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return null;
    ctx = new AudioCtx();
  }
  if (ctx.state === "suspended") ctx.resume().catch(() => {});
  return ctx;
}

function tone(freq: number, start: number, duration: number, type: OscillatorType, gainPeak: number, out: GainNode, audioCtx: AudioContext) {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);
  gain.gain.setValueAtTime(0, start);
  gain.gain.linearRampToValueAtTime(gainPeak, start + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
  osc.connect(gain);
  gain.connect(out);
  osc.start(start);
  osc.stop(start + duration + 0.02);
}

function play(fn: (audioCtx: AudioContext, out: GainNode, now: number) => void, volume = 0.18) {
  const audioCtx = getCtx();
  if (!audioCtx) return;
  const out = audioCtx.createGain();
  out.gain.value = volume;
  out.connect(audioCtx.destination);
  fn(audioCtx, out, audioCtx.currentTime);
}

export const sfx = {
  cardPlay: () =>
    play((c, out, t) => {
      tone(320, t, 0.09, "triangle", 0.5, out, c);
      tone(480, t + 0.04, 0.12, "sine", 0.35, out, c);
    }),
  cardDraw: () =>
    play((c, out, t) => {
      tone(700, t, 0.06, "sine", 0.3, out, c);
      tone(900, t + 0.03, 0.08, "sine", 0.25, out, c);
    }, 0.12),
  attack: () =>
    play((c, out, t) => {
      tone(180, t, 0.1, "sawtooth", 0.5, out, c);
      tone(90, t + 0.03, 0.16, "square", 0.4, out, c);
    }, 0.16),
  impact: () =>
    play((c, out, t) => {
      const noiseBuf = c.createBuffer(1, c.sampleRate * 0.08, c.sampleRate);
      const data = noiseBuf.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
      const src = c.createBufferSource();
      src.buffer = noiseBuf;
      const gain = c.createGain();
      gain.gain.setValueAtTime(0.4, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
      src.connect(gain);
      gain.connect(out);
      src.start(t);
    }, 0.22),
  heal: () =>
    play((c, out, t) => {
      tone(500, t, 0.12, "sine", 0.3, out, c);
      tone(650, t + 0.07, 0.14, "sine", 0.3, out, c);
      tone(800, t + 0.14, 0.16, "sine", 0.28, out, c);
    }, 0.14),
  turnStart: () =>
    play((c, out, t) => {
      tone(440, t, 0.14, "sine", 0.35, out, c);
      tone(660, t + 0.1, 0.18, "sine", 0.3, out, c);
    }, 0.15),
  click: () =>
    play((c, out, t) => {
      tone(600, t, 0.04, "square", 0.25, out, c);
    }, 0.08),
  victory: () =>
    play((c, out, t) => {
      [523, 659, 784, 1046].forEach((f, i) => tone(f, t + i * 0.11, 0.3, "triangle", 0.4, out, c));
    }, 0.2),
  defeat: () =>
    play((c, out, t) => {
      [392, 349, 293, 220].forEach((f, i) => tone(f, t + i * 0.16, 0.35, "sine", 0.3, out, c));
    }, 0.18),
};
