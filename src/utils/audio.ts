/**
 * Web Audio API synthesizer for the Cowrywise NOUN Ambassadors Raffle Draw site
 * Provides satisfying skeuomorphic tactility through completely client-side generated sound.
 */

class AudioEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;

  private initCtx() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    return this.isMuted;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public playClick() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(150, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(80, this.ctx.currentTime + 0.08);

      gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.08);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.08);
    } catch (e) {
      console.warn("Audio failure: ", e);
    }
  }

  /**
   * Play a short mechanical click/tick for the scroll reel.
   * Decreasing speed of calls creates the perfect deceleration effect.
   */
  public playTick(pitch: number = 600) {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = "triangle";
      osc.frequency.setValueAtTime(pitch, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(150, this.ctx.currentTime + 0.03);

      gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.03);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.03);
    } catch (e) {
      // ignore
    }
  }

  /**
   * Play a triumphant fanfare sequence
   */
  public playWin() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      // Notes of a C Major Arpeggio with a rich texture
      const notes = [
        { note: 261.63, time: 0 },    // C4
        { note: 329.63, time: 0.1 },  // E4
        { note: 392.00, time: 0.2 },  // G4
        { note: 523.25, time: 0.3 },  // C5
        { note: 659.25, time: 0.45 }, // E5
        { note: 783.99, time: 0.6 },  // G5
        { note: 1046.50, time: 0.75 } // C6
      ];

      notes.forEach(({ note, time }) => {
        if (!this.ctx) return;
        const oNode = this.ctx.createOscillator();
        const gNode = this.ctx.createGain();

        // Let's make it a warm brassy pulse using standard triangle/saw mix or triangle
        oNode.type = "triangle";
        oNode.frequency.setValueAtTime(note, now + time);
        
        // Add a secondary harmonic subtle sweep
        oNode.frequency.exponentialRampToValueAtTime(note * 1.01, now + time + 0.4);

        gNode.gain.setValueAtTime(0, now + time);
        gNode.gain.linearRampToValueAtTime(0.15, now + time + 0.03);
        gNode.gain.exponentialRampToValueAtTime(0.001, now + time + 0.5);

        oNode.connect(gNode);
        gNode.connect(this.ctx.destination);

        oNode.start(now + time);
        oNode.stop(now + time + 0.5);
      });
    } catch (e) {
      console.warn("Audio win arpeggio failed: ", e);
    }
  }
}

export const audio = new AudioEngine();
