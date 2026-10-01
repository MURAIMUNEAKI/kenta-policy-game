// 8-bit retro sound synthesizer using Web Audio API

export type BgmTrack = 'title' | 'game';

interface ThemeNote {
  lead: number;
  bass?: number;
}

// Retro arcade town / title theme in C major (180ms per 8th note, joyful & welcoming)
const TITLE_THEME: ThemeNote[] = [
  // Motif 1: Cheerful town opening
  { lead: 523.25, bass: 130.81 }, // C5, C3
  { lead: 659.25, bass: 196.00 }, // E5, G3
  { lead: 783.99, bass: 261.63 }, // G5, C4
  { lead: 659.25, bass: 196.00 }, // E5, G3
  { lead: 880.00, bass: 174.61 }, // A5, F3
  { lead: 783.99, bass: 220.00 }, // G5, A3
  { lead: 659.25, bass: 261.63 }, // E5, C4
  { lead: 523.25, bass: 196.00 }, // C5, G3

  // Phrase 2: Gentle step down & bounce
  { lead: 587.33, bass: 146.83 }, // D5, D3
  { lead: 659.25, bass: 220.00 }, // E5, A3
  { lead: 698.46, bass: 293.66 }, // F5, D4
  { lead: 587.33, bass: 220.00 }, // D5, A3
  { lead: 783.99, bass: 196.00 }, // G5, G3
  { lead: 698.46, bass: 246.94 }, // F5, B3
  { lead: 659.25, bass: 293.66 }, // E5, D4
  { lead: 587.33, bass: 196.00 }, // D5, G3

  // Motif 2: Inspiring soaring melody
  { lead: 523.25, bass: 130.81 }, // C5, C3
  { lead: 659.25, bass: 196.00 }, // E5, G3
  { lead: 783.99, bass: 261.63 }, // G5, C4
  { lead: 1046.50, bass: 196.00 }, // C6, G3
  { lead: 987.77, bass: 174.61 }, // B5, F3
  { lead: 880.00, bass: 220.00 }, // A5, A3
  { lead: 783.99, bass: 261.63 }, // G5, C4
  { lead: 659.25, bass: 196.00 }, // E5, G3

  // Phrase 4: Happy resolution back to tonic
  { lead: 698.46, bass: 174.61 }, // F5, F3
  { lead: 783.99, bass: 220.00 }, // G5, A3
  { lead: 880.00, bass: 261.63 }, // A5, C4
  { lead: 783.99, bass: 196.00 }, // G5, G3
  { lead: 659.25, bass: 164.81 }, // E5, E3
  { lead: 587.33, bass: 196.00 }, // D5, G3
  { lead: 523.25, bass: 130.81 }, // C5, C3
  { lead: 523.25, bass: 130.81 }, // C5, C3 (sustain)
];

// Fast energetic gameplay theme (135ms per note, driving policy catch sprint)
const GAME_THEME: ThemeNote[] = [
  { lead: 261.63, bass: 130.81 },
  { lead: 329.63, bass: 130.81 },
  { lead: 392.00, bass: 196.00 },
  { lead: 523.25, bass: 196.00 },
  { lead: 392.00, bass: 130.81 },
  { lead: 329.63, bass: 196.00 },
  { lead: 293.66, bass: 146.83 },
  { lead: 349.23, bass: 146.83 },
  { lead: 440.00, bass: 220.00 },
  { lead: 587.33, bass: 220.00 },
  { lead: 440.00, bass: 146.83 },
  { lead: 349.23, bass: 220.00 },
  { lead: 329.63, bass: 164.81 },
  { lead: 392.00, bass: 164.81 },
  { lead: 523.25, bass: 261.63 },
  { lead: 659.25, bass: 261.63 },
  { lead: 523.25, bass: 164.81 },
  { lead: 392.00, bass: 261.63 },
  { lead: 392.00, bass: 196.00 },
  { lead: 440.00, bass: 220.00 },
  { lead: 493.88, bass: 246.94 },
  { lead: 523.25, bass: 261.63 },
  { lead: 587.33, bass: 293.66 },
  { lead: 659.25, bass: 329.63 },
];

class SoundManager {
  private ctx: AudioContext | null = null;
  private isBgmPlaying = false;
  private bgmInterval: number | null = null;
  private currentTrack: BgmTrack | null = null;
  private targetTrack: BgmTrack = 'title';
  public isMuted = false;

  public initCtx() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public resumeContext() {
    this.initCtx();
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.isMuted) {
      this.stopBGM();
    } else {
      this.playClick();
      if (this.targetTrack) {
        this.startBGM(this.targetTrack);
      }
    }
    return this.isMuted;
  }

  public playClick() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(600, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1000, this.ctx.currentTime + 0.05);

    gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.05);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.05);
  }

  public playPolicyCatch() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(523.25, now);
    osc.frequency.setValueAtTime(659.25, now + 0.04);
    osc.frequency.setValueAtTime(783.99, now + 0.08);

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.22);
  }

  public playVoiceCatch() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.12);

    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.16);
  }

  public playFeverStar() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    [0, 0.04, 0.08, 0.12].forEach((offset, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const freqs = [659.25, 783.99, 987.77, 1318.51];

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freqs[idx], now + offset);

      gain.gain.setValueAtTime(0.12, now + offset);
      gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.14);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now + offset);
      osc.stop(now + offset + 0.14);
    });
  }

  public playObstacleHit() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.exponentialRampToValueAtTime(45, now + 0.28);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.28);
  }

  public playFeverStart() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const notes = [440, 554.37, 659.25, 880];
    notes.forEach((freq, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const startT = now + idx * 0.08;

      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, startT);

      gain.gain.setValueAtTime(0.15, startT);
      gain.gain.exponentialRampToValueAtTime(0.001, startT + 0.2);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(startT);
      osc.stop(startT + 0.2);
    });
  }

  public playClearFanfare() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const sequence = [
      { f: 523.25, d: 0.12 },
      { f: 659.25, d: 0.12 },
      { f: 783.99, d: 0.12 },
      { f: 1046.50, d: 0.45 },
    ];

    let t = now;
    sequence.forEach(({ f, d }) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(f, t);

      gain.gain.setValueAtTime(0.18, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + d);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + d);
      t += d;
    });
  }

  public playGameOver() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const sequence = [
      { f: 392.0, d: 0.15 },
      { f: 349.23, d: 0.15 },
      { f: 329.63, d: 0.18 },
      { f: 261.63, d: 0.4 },
    ];

    let t = now;
    sequence.forEach(({ f, d }) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(f, t);

      gain.gain.setValueAtTime(0.12, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + d);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + d);
      t += d;
    });
  }

  public startBGM(track: BgmTrack = 'title') {
    this.targetTrack = track;
    if (this.isMuted) return;

    // If already playing this track, keep playing
    if (this.isBgmPlaying && this.currentTrack === track) {
      return;
    }

    // Stop current track if switching
    if (this.bgmInterval) {
      clearInterval(this.bgmInterval);
      this.bgmInterval = null;
    }

    this.initCtx();
    if (!this.ctx) return;

    this.isBgmPlaying = true;
    this.currentTrack = track;

    const theme = track === 'title' ? TITLE_THEME : GAME_THEME;
    const noteSpeedMs = track === 'title' ? 180 : 135;
    let noteIdx = 0;

    const playNextNote = () => {
      if (!this.isBgmPlaying || !this.ctx || this.isMuted) return;
      const note = theme[noteIdx % theme.length];
      noteIdx++;

      const now = this.ctx.currentTime;

      // 1. Lead Melody Note
      const leadOsc = this.ctx.createOscillator();
      const leadGain = this.ctx.createGain();

      leadOsc.type = track === 'title' ? 'square' : 'triangle';
      leadOsc.frequency.setValueAtTime(note.lead, now);

      const leadVol = track === 'title' ? 0.035 : 0.045;
      leadGain.gain.setValueAtTime(leadVol, now);
      leadGain.gain.exponentialRampToValueAtTime(0.001, now + (noteSpeedMs / 1000) * 0.9);

      leadOsc.connect(leadGain);
      leadGain.connect(this.ctx.destination);

      leadOsc.start(now);
      leadOsc.stop(now + (noteSpeedMs / 1000) * 0.92);

      // 2. Bass / Harmony Note (if present)
      if (note.bass) {
        const bassOsc = this.ctx.createOscillator();
        const bassGain = this.ctx.createGain();

        bassOsc.type = 'triangle';
        bassOsc.frequency.setValueAtTime(note.bass, now);

        bassGain.gain.setValueAtTime(0.03, now);
        bassGain.gain.exponentialRampToValueAtTime(0.001, now + (noteSpeedMs / 1000) * 0.95);

        bassOsc.connect(bassGain);
        bassGain.connect(this.ctx.destination);

        bassOsc.start(now);
        bassOsc.stop(now + (noteSpeedMs / 1000) * 0.96);
      }
    };

    // Play first note immediately, then interval
    playNextNote();
    this.bgmInterval = window.setInterval(playNextNote, noteSpeedMs);
  }

  public stopBGM() {
    this.isBgmPlaying = false;
    this.currentTrack = null;
    if (this.bgmInterval) {
      clearInterval(this.bgmInterval);
      this.bgmInterval = null;
    }
  }

  public getCurrentTrack(): BgmTrack | null {
    return this.currentTrack;
  }

  public getIsPlaying(): boolean {
    return this.isBgmPlaying;
  }
}

export const sounds = new SoundManager();

