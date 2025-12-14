/**
 * Audio service using Web Audio API
 * Uses singleton pattern to avoid memory leaks from creating multiple AudioContext instances
 */

// Singleton AudioContext instance
let audioContextInstance: AudioContext | null = null;

/**
 * Gets or creates the singleton AudioContext instance
 * Handles browser compatibility and suspended state
 */
const getAudioContext = (): AudioContext | null => {
  const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;

  if (!AudioContextClass) {
    console.warn('Web Audio API not supported in this browser');
    return null;
  }

  if (!audioContextInstance) {
    audioContextInstance = new AudioContextClass();
  }

  // Resume context if suspended (handles autoplay policy)
  if (audioContextInstance.state === 'suspended') {
    audioContextInstance.resume().catch(err => {
      console.warn('Could not resume AudioContext:', err);
    });
  }

  return audioContextInstance;
};

// Sound configuration for better maintainability
const SOUND_CONFIG = {
  collect: {
    type: 'sine' as OscillatorType,
    startFreq: 500,
    endFreq: 800,
    duration: 0.15,
    gain: 0.1,
    ramp: 'exponential' as const
  },
  hit: {
    type: 'sawtooth' as OscillatorType,
    startFreq: 100,
    endFreq: 50,
    duration: 0.2,
    gain: 0.1,
    ramp: 'linear' as const
  },
  ui: {
    type: 'triangle' as OscillatorType,
    startFreq: 400,
    endFreq: 400,
    duration: 0.05,
    gain: 0.05,
    ramp: 'linear' as const
  }
} as const;

// Victory chord notes (frequency, delay)
const VICTORY_NOTES = [
  { freq: 440, delay: 0 },    // A4
  { freq: 554, delay: 0.1 },  // C#5
  { freq: 659, delay: 0.2 }   // E5
] as const;

export type SoundType = 'collect' | 'hit' | 'ui' | 'win';

/**
 * Plays a sound effect
 * @param type - The type of sound to play
 */
export const playSound = (type: SoundType): void => {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;

  if (type === 'win') {
    // Victory chord - multiple notes
    VICTORY_NOTES.forEach(({ freq, delay }) => {
      playNote(ctx, freq, now + delay, 0.5, 0.1);
    });
    return;
  }

  // Standard sounds
  const config = SOUND_CONFIG[type];
  if (!config) return;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.type = config.type;
  osc.frequency.setValueAtTime(config.startFreq, now);

  if (config.ramp === 'exponential') {
    osc.frequency.exponentialRampToValueAtTime(config.endFreq, now + config.duration);
  } else {
    osc.frequency.linearRampToValueAtTime(config.endFreq, now + config.duration);
  }

  gain.gain.setValueAtTime(config.gain, now);
  gain.gain.linearRampToValueAtTime(0, now + config.duration);

  osc.start(now);
  osc.stop(now + config.duration);
};

/**
 * Helper function to play a single note (used for chords)
 */
const playNote = (
  ctx: AudioContext,
  freq: number,
  startTime: number,
  duration: number,
  volume: number
): void => {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.type = 'sine';
  osc.frequency.value = freq;

  gain.gain.setValueAtTime(volume, startTime);
  gain.gain.linearRampToValueAtTime(0, startTime + duration);

  osc.start(startTime);
  osc.stop(startTime + duration);
};

/**
 * Cleanup function to close AudioContext when no longer needed
 * Call this when the app unmounts
 */
export const disposeAudio = (): void => {
  if (audioContextInstance) {
    audioContextInstance.close().catch(err => {
      console.warn('Error closing AudioContext:', err);
    });
    audioContextInstance = null;
  }
};
