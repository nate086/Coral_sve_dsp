import { ppmEngine } from '../engine/ppm-engine';

export class AudioWorkstation {
  private ctx: AudioContext | null = null;
  private workletNode: AudioWorkletNode | null = null;
  private sharedBuffer: SharedArrayBuffer | null = null;
  private floatView: Float32Array | null = null;
  private isRunning: boolean = false;

  public async startGuitarRig(): Promise<void> {
    if (this.isRunning) return;

    // 1. Force low-latency interactive hardware context at 96kHz
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    this.ctx = new AudioCtx({
      latencyHint: 'interactive',
      sampleRate: 96000,
    });

    // 2. Pre-allocate SharedArrayBuffer for 0ms parameter pointer writes
    // Slots: [0: Drive, 1: Cutoff, 2: DelayTime, 3: Feedback]
    this.sharedBuffer = new SharedArrayBuffer(16);
    this.floatView = new Float32Array(this.sharedBuffer);

    // Initialize Default Parameter Values
    this.floatView[0] = 1.5;   // Base Drive
    this.floatView[1] = 3500;  // Base Cutoff (3.5 kHz)
    this.floatView[2] = 0.25;  // Delay Time (250 ms)
    this.floatView[3] = 0.35;  // Delay Feedback

    // 3. Load AudioWorklet Module
    await this.ctx.audioWorklet.addModule('/dsp-worklet-processor.js');

    // 4. Request raw, uncolored guitar stream (iRig / USB Interface)
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: false,
      },
    });

    const micSource = this.ctx.createMediaStreamSource(stream);

    // 5. Instantiate DSP Worklet Node
    this.workletNode = new AudioWorkletNode(this.ctx, 'coral-dsp-processor', {
      numberOfInputs: 1,
      numberOfOutputs: 1,
      outputChannelCount: [2],
      processorOptions: {
        sab: this.sharedBuffer,
      },
    });

    // Route Audio: Interface Mic Input -> WASM DSP Worklet -> Speakers / Headphones
    micSource.connect(this.workletNode);
    this.workletNode.connect(this.ctx.destination);

    this.isRunning = true;
  }

  /**
   * Synthesizes live SVE Entropy & Latent Drift metrics with PPM Safety Shields
   * Directly mutates RAM Float32 view with 0ms latency!
   */
  public updateSvePpmSteering(entropyScore: number, latentDrift: number): void {
    if (!this.floatView) return;

    // Evaluate PPM Shield Rules
    ppmEngine.evaluateState(entropyScore, latentDrift);
    const ppmState = ppmEngine.getState();

    // Map SVE metrics to dynamic pedal controls
    let targetDrive = 1.0 + latentDrift * 10.0;       // Sweep Overdrive (1.0 - 11.0)
    let targetCutoff = 800 + entropyScore * 12000;     // Sweep Resonant Filter (800Hz - 12.8kHz)
    let targetFeedback = Math.min(0.8, entropyScore * 0.75);

    // PPM Safety Overrides
    if (ppmState.threatLevel === 'critical') {
      targetDrive = 0.8;      // Instant transient damping
      targetCutoff = 1500;    // Filter emergency rollback
    } else if (ppmState.threatLevel === 'elevated') {
      targetDrive *= 0.6;     // Dynamic soft clamping
    }

    // Atomic 0ms Write directly to system RAM
    this.floatView[0] = targetDrive;
    this.floatView[1] = targetCutoff;
    this.floatView[3] = targetFeedback;
  }

  public stop(): void {
    if (this.ctx) {
      this.ctx.close();
      this.isRunning = false;
    }
  }
}

export const audioWorkstation = new AudioWorkstation();
