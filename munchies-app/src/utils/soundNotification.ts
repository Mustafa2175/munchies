/**
 * @module utils/soundNotification
 * @description Web Audio API–based POS bell/chime synthesizer for new order notifications.
 * Produces a loud, pleasant three-tone restaurant kitchen bell chime (880→1174→1318 Hz)
 * played twice in quick succession for unmistakable audibility in a busy restaurant.
 * Zero dependency on external audio files.
 */

// ─── Singleton AudioContext ──────────────────────────────────────────────────

let audioCtx: AudioContext | null = null;

/**
 * Lazily create or retrieve the shared AudioContext.
 * The context is created in 'suspended' state until the user interacts with the page.
 */
function getAudioContext(): AudioContext {
  if (!audioCtx) {
    const Ctor =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    audioCtx = new Ctor();
  }
  return audioCtx;
}

/**
 * Resume the AudioContext if it is in a suspended state.
 * Should be called from a user-interaction handler (click/keydown/touchstart).
 */
export async function unlockAudioContext(): Promise<void> {
  const ctx = getAudioContext();
  if (ctx.state === 'suspended') {
    try {
      await ctx.resume();
    } catch {
      // silently ignore — some old browsers may reject
    }
  }
}

// ─── Chime Synthesizer ───────────────────────────────────────────────────────

/**
 * Play a single three-tone bell chime (ding-dong-ding) at the given start time.
 * Frequencies: 880 Hz → 1174 Hz → 1318 Hz with smooth gain envelope.
 */
function playChimeSequence(ctx: AudioContext, startTime: number): void {
  const tones = [
    { freq: 880, start: 0, duration: 0.18 },
    { freq: 1174, start: 0.2, duration: 0.18 },
    { freq: 1318, start: 0.42, duration: 0.28 },
  ];

  tones.forEach(({ freq, start, duration }) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, startTime + start);

    // Add slight overtone for richer bell sound
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(freq * 2.0, startTime + start);
    gain2.gain.setValueAtTime(0.15, startTime + start);
    gain2.gain.exponentialRampToValueAtTime(0.001, startTime + start + duration + 0.15);

    // Gain envelope: sharp attack → exponential decay
    gain.gain.setValueAtTime(0.55, startTime + start);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + start + duration + 0.2);

    osc.connect(gain);
    osc2.connect(gain2);
    gain.connect(ctx.destination);
    gain2.connect(ctx.destination);

    osc.start(startTime + start);
    osc.stop(startTime + start + duration + 0.25);
    osc2.start(startTime + start);
    osc2.stop(startTime + start + duration + 0.2);
  });
}

/**
 * Play the full POS bell notification: the three-tone chime plays TWICE
 * in quick succession (~0.85s apart) so it is unmistakably noticed.
 */
export function playNewOrderChime(): void {
  try {
    const ctx = getAudioContext();
    if (ctx.state === 'suspended') {
      // If somehow still suspended, silently skip (no error to the user)
      return;
    }
    const now = ctx.currentTime;
    // First chime
    playChimeSequence(ctx, now);
    // Second chime (repeated after a short gap)
    playChimeSequence(ctx, now + 0.85);
  } catch (err) {
    console.warn('[SoundNotification] Web Audio chime failed, trying fallback:', err);
    playFallbackChime();
  }
}

// ─── HTML5 Audio Fallback (data-URI sine beep) ───────────────────────────────

/**
 * Generates a tiny WAV data-URI containing a sine wave beep and plays it
 * as a last-resort fallback when WebAudio is completely unavailable.
 */
function playFallbackChime(): void {
  try {
    // Generate a short beep WAV (0.3s, 8000 Hz sample rate, 880 Hz tone)
    const sampleRate = 8000;
    const duration = 0.3;
    const numSamples = Math.floor(sampleRate * duration);
    const freq = 880;
    const buffer = new ArrayBuffer(44 + numSamples * 2);
    const view = new DataView(buffer);

    // WAV header
    const writeStr = (offset: number, str: string) => {
      for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
    };
    writeStr(0, 'RIFF');
    view.setUint32(4, 36 + numSamples * 2, true);
    writeStr(8, 'WAVE');
    writeStr(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeStr(36, 'data');
    view.setUint32(40, numSamples * 2, true);

    // Sine wave PCM samples
    for (let i = 0; i < numSamples; i++) {
      const t = i / sampleRate;
      const decay = Math.exp(-t * 6);
      const sample = Math.sin(2 * Math.PI * freq * t) * 0.4 * decay;
      view.setInt16(44 + i * 2, Math.max(-32768, Math.min(32767, sample * 32767)), true);
    }

    const blob = new Blob([buffer], { type: 'audio/wav' });
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    audio.volume = 1.0;
    audio.play().catch(() => {});
    // Play twice
    setTimeout(() => {
      const audio2 = new Audio(url);
      audio2.volume = 1.0;
      audio2.play().catch(() => {});
    }, 500);
  } catch {
    // Complete audio failure — nothing more we can do
    console.warn('[SoundNotification] All audio playback methods failed.');
  }
}

// ─── Sound Enabled Preference (localStorage) ─────────────────────────────────

const SOUND_ENABLED_KEY = 'munchies_admin_sound_enabled';

/**
 * Check if the admin notification sound is enabled.
 * Defaults to `true` on first use.
 */
export function isSoundEnabled(): boolean {
  try {
    const val = localStorage.getItem(SOUND_ENABLED_KEY);
    if (val === null) return true; // default ON
    return val === 'true';
  } catch {
    return true;
  }
}

/**
 * Set the sound enabled preference.
 */
export function setSoundEnabled(enabled: boolean): void {
  try {
    localStorage.setItem(SOUND_ENABLED_KEY, String(enabled));
  } catch {
    // localStorage may be blocked in incognito
  }
}

/**
 * Toggle the sound enabled preference and return the new value.
 */
export function toggleSoundEnabled(): boolean {
  const newVal = !isSoundEnabled();
  setSoundEnabled(newVal);
  return newVal;
}

