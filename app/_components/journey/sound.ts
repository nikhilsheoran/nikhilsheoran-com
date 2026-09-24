/**
 * Procedural room sound, so the page ships no audio files. Everything is
 * synthesised from filtered noise:
 *   room tone   – low band-passed pink noise
 *   city        – brown noise through a low-pass, slowly swelling; louder near the window
 *   pass        – a short airy sweep when the next work arrives
 *   key clicks  – a bright tick plus a soft thock when typing on the Mac
 * Browsers only allow audio after a user gesture, so start() runs from a click.
 */
export class RoomSound {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private city: GainNode | null = null;
  private noise: AudioBuffer | null = null;

  get running() {
    return this.ctx?.state === "running";
  }

  async start() {
    if (!this.ctx) this.build();
    await this.ctx!.resume();
    this.master!.gain.setTargetAtTime(1, this.ctx!.currentTime, 0.4);
  }

  stop() {
    if (!this.ctx || !this.master) return;
    this.master.gain.setTargetAtTime(0, this.ctx.currentTime, 0.15);
    const ctx = this.ctx;
    window.setTimeout(() => {
      if (this.master && this.master.gain.value < 0.01) void ctx.suspend();
    }, 700);
  }

  /** 0 = far from the window, 1 = right beside it. */
  setWindowProximity(amount: number) {
    if (!this.ctx || !this.city) return;
    this.city.gain.setTargetAtTime(
      0.035 + 0.05 * Math.max(0, Math.min(1, amount)),
      this.ctx.currentTime,
      0.5,
    );
  }

  pass() {
    if (!this.running) return;
    const ctx = this.ctx!;
    const t = ctx.currentTime;
    const source = this.noiseSource();
    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.Q.value = 0.8;
    filter.frequency.setValueAtTime(300, t);
    filter.frequency.exponentialRampToValueAtTime(1400, t + 0.45);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.05, t + 0.18);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.6);
    source.connect(filter).connect(gain).connect(this.master!);
    source.start(t, Math.random() * 2, 0.65);
  }

  key() {
    if (!this.running) return;
    const ctx = this.ctx!;
    const t = ctx.currentTime;
    const tick = this.noiseSource();
    const bright = ctx.createBiquadFilter();
    bright.type = "bandpass";
    bright.frequency.value = 2600 + Math.random() * 1400;
    bright.Q.value = 1.4;
    const tickGain = ctx.createGain();
    tickGain.gain.setValueAtTime(0.07, t);
    tickGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.035);
    tick.connect(bright).connect(tickGain).connect(this.master!);
    tick.start(t, Math.random() * 2, 0.04);

    const thock = ctx.createOscillator();
    thock.frequency.setValueAtTime(180 + Math.random() * 40, t);
    thock.frequency.exponentialRampToValueAtTime(90, t + 0.04);
    const thockGain = ctx.createGain();
    thockGain.gain.setValueAtTime(0.05, t);
    thockGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
    thock.connect(thockGain).connect(this.master!);
    thock.start(t);
    thock.stop(t + 0.06);
  }

  dispose() {
    void this.ctx?.close();
    this.ctx = null;
  }

  private build() {
    const ctx = new AudioContext();
    this.ctx = ctx;
    this.master = ctx.createGain();
    this.master.gain.value = 0;
    this.master.connect(ctx.destination);

    // Four seconds of white noise, reused by every voice.
    const length = ctx.sampleRate * 4;
    this.noise = ctx.createBuffer(1, length, ctx.sampleRate);
    const white = this.noise.getChannelData(0);
    for (let i = 0; i < length; i++) white[i] = Math.random() * 2 - 1;

    // Room tone: pinkish, low and steady.
    const room = this.noiseSource(true);
    const roomFilter = ctx.createBiquadFilter();
    roomFilter.type = "bandpass";
    roomFilter.frequency.value = 170;
    roomFilter.Q.value = 0.6;
    const roomGain = ctx.createGain();
    roomGain.gain.value = 0.05;
    room.connect(roomFilter).connect(roomGain).connect(this.master);
    room.start();

    // City: brown noise (integrated white) with a slow traffic swell.
    const brown = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = brown.getChannelData(0);
    let last = 0;
    for (let i = 0; i < length; i++) {
      last = (last + 0.02 * white[i]) / 1.02;
      data[i] = last * 3.5;
    }
    const traffic = ctx.createBufferSource();
    traffic.buffer = brown;
    traffic.loop = true;
    const lowpass = ctx.createBiquadFilter();
    lowpass.type = "lowpass";
    lowpass.frequency.value = 520;
    this.city = ctx.createGain();
    this.city.gain.value = 0.035;
    const swell = ctx.createOscillator();
    swell.frequency.value = 0.07;
    const swellDepth = ctx.createGain();
    swellDepth.gain.value = 0.012;
    swell.connect(swellDepth).connect(this.city.gain);
    traffic.connect(lowpass).connect(this.city).connect(this.master);
    traffic.start();
    swell.start();
  }

  private noiseSource(loop = false) {
    const source = this.ctx!.createBufferSource();
    source.buffer = this.noise;
    source.loop = loop;
    return source;
  }
}
