// Web Audio API synthesizer for Money Heist terminal audio effects

let audioCtx: AudioContext | null = null;
let sirenOscillator: OscillatorNode | null = null;
let sirenGain: GainNode | null = null;
let isSirenActive = false;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === "suspended") {
    audioCtx.resume();
  }
  return audioCtx;
}

/**
 * Play a short terminal key/blip sound
 */
export function playKeyBlip() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(800 + Math.random() * 200, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.04);

    gain.gain.setValueAtTime(0.04, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.045);
  } catch {
    // audio failure silent
  }
}

/**
 * Play success fanfare (Disarm sequence verified)
 */
export function playSuccessSound() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const chords = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    chords.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "triangle";
      osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.09);

      gain.gain.setValueAtTime(0, ctx.currentTime + idx * 0.09);
      gain.gain.linearRampToValueAtTime(0.12, ctx.currentTime + idx * 0.09 + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.09 + 0.45);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime + idx * 0.09);
      osc.stop(ctx.currentTime + idx * 0.09 + 0.48);
    });
  } catch {
    // silent
  }
}

/**
 * Play error / alarm buzz (Bypass rejected / Exception)
 */
export function playErrorSound() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(140, ctx.currentTime);
    osc.frequency.setValueAtTime(110, ctx.currentTime + 0.12);

    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.28);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.3);
  } catch {
    // silent
  }
}

/**
 * Toggle subtle atmospheric siren drone
 */
export function toggleSirenDrone(enable: boolean) {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    if (!enable) {
      if (sirenOscillator) {
        sirenOscillator.stop();
        sirenOscillator.disconnect();
        sirenOscillator = null;
      }
      if (sirenGain) {
        sirenGain.disconnect();
        sirenGain = null;
      }
      isSirenActive = false;
      return;
    }

    if (isSirenActive) return;

    sirenOscillator = ctx.createOscillator();
    sirenGain = ctx.createGain();

    sirenOscillator.type = "sine";
    // Subtle low pulsating frequency
    sirenOscillator.frequency.setValueAtTime(220, ctx.currentTime);

    // LFO modulation for siren pulse
    const lfo = ctx.createOscillator();
    lfo.type = "sine";
    lfo.frequency.setValueAtTime(0.6, ctx.currentTime);

    const lfoGain = ctx.createGain();
    lfoGain.gain.setValueAtTime(40, ctx.currentTime);
    lfo.connect(sirenOscillator.frequency);

    sirenGain.gain.setValueAtTime(0.02, ctx.currentTime);

    sirenOscillator.connect(sirenGain);
    sirenGain.connect(ctx.destination);

    lfo.start();
    sirenOscillator.start();
    isSirenActive = true;
  } catch {
    // silent
  }
}
