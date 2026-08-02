import { ppmEngine } from '../engine/ppm-engine';

export type PresetType = 'clean' | 'warm-tube' | 'blues-crunch' | 'heavy-metal' | 'custom';

export class AudioWorkstation {
  private ctx: AudioContext | null = null;
  private workletNode: AudioWorkletNode | null = null;
  private sharedBuffer: SharedArrayBuffer | null = null;
  private floatView: Float32Array | null = null;
  private isRunning: boolean = false;

  public async startGuitarRig(): Promise<void> {
    if (this.isRunning) return;

    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    this.ctx = new AudioCtx({ latencyHint: 'interactive', sampleRate: 96000 });

    // Expand SharedArrayBuffer to 10 float32 slots (40 bytes)
    this.sharedBuffer = new SharedArrayBuffer(40);
    this.floatView = new Float32Array(this.sharedBuffer);

    this.applyPreset('blues-crunch');

    await this.ctx.audioWorklet.addModule('/dsp-worklet-processor.js');

    const stream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
    });

    const micSource = this.ctx.createMediaStreamSource(stream);
    this.workletNode = new AudioWorkletNode(this.ctx, 'coral-dsp-processor', {
      numberOfInputs: 1,
      numberOfOutputs: 1,
      outputChannelCount: [2],
      processorOptions: { sab: this.sharedBuffer },
    });

    micSource.connect(this.workletNode);
    this.workletNode.connect(this.ctx.destination);
    this.isRunning = true;
  }

  /**
   * Applies Instant DSP Tone Presets
   */
  public applyPreset(preset: PresetType): void {
    if (!this.floatView) return;

    switch (preset) {
      case 'clean':
        this.setPedalParams({ tubeMix: 0.1, tubeDrive: 1.0, bluesMix: 0.0, metalMix: 0.0, cutoff: 8000 });
        break;
      case 'warm-tube':
        this.setPedalParams({ tubeMix: 0.8, tubeDrive: 2.2, bluesMix: 0.0, metalMix: 0.0, cutoff: 6500 });
        break;
      case 'blues-crunch':
        // Blends Tube Warmth + Soft Blues Overdrive
        this.setPedalParams({ tubeMix: 0.4, tubeDrive: 1.8, bluesMix: 0.7, bluesDrive: 2.5, metalMix: 0.0, cutoff: 5200 });
        break;
      case 'heavy-metal':
        // High Gain Metal Hard Clipping + Tight Cabinet Cutoff
        this.setPedalParams({ tubeMix: 0.3, tubeDrive: 2.0, bluesMix: 0.0, metalMix: 0.95, metalDrive: 6.0, cutoff: 4200 });
        break;
    }
  }

  /**
   * Individual Pedal Parameter Mix Control (0.0 to 1.0)
   */
  public setPedalParams(params: {
    gateThr?: number;
    tubeDrive?: number; tubeMix?: number;
    bluesDrive?: number; bluesMix?: number;
    metalDrive?: number; metalMix?: number;
    cutoff?: number; delayTime?: number; delayFb?: number;
  }): void {
    if (!this.floatView) return;

    if (params.gateThr !== undefined) this.floatView[0] = params.gateThr;
    if (params.tubeDrive !== undefined) this.floatView[1] = params.tubeDrive;
    if (params.tubeMix !== undefined) this.floatView[2] = params.tubeMix;
    if (params.bluesDrive !== undefined) this.floatView[3] = params.bluesDrive;
    if (params.bluesMix !== undefined) this.floatView[4] = params.bluesMix;
    if (params.metalDrive !== undefined) this.floatView[5] = params.metalDrive;
    if (params.metalMix !== undefined) this.floatView[6] = params.metalMix;
    if (params.cutoff !== undefined) this.floatView[7] = params.cutoff;
    if (params.delayTime !== undefined) this.floatView[8] = params.delayTime;
    if (params.delayFb !== undefined) this.floatView[9] = params.delayFb;
  }

  public stop(): void {
    if (this.ctx) {
      this.ctx.close();
      this.isRunning = false;
    }
  }
}

export const audioWorkstation = new AudioWorkstation();
