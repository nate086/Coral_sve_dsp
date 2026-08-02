class CoralDspProcessor extends AudioWorkletProcessor {
  constructor(options) {
    super();
    this.sab = options.processorOptions.sab;
    this.params = new Float32Array(this.sab);

    // Filter and State Memory (Zero GC Allocation)
    this.gateEnvelope = 0.0;
    this.filterState = 0.0;
    this.tubeDcOffset = 0.0; // Eliminates DC bias from asymmetric tube curves

    // Stereo Delay Ring Buffer (96kHz)
    this.delayBufferLeft = new Float32Array(96000);
    this.delayBufferRight = new Float32Array(96000);
    this.writeIndex = 0;

    // Chorus LFO State
    this.lfoPhase = 0.0;
    this.chorusBuffer = new Float32Array(4800);
    this.chorusWriteIndex = 0;
  }

  // ==========================================
  // DISTORTION CURVE ALGORITHMS
  // ==========================================

  // 1. Vacuum Tube Preamp (Asymmetric Triode Simulation)
  processTube(sample, drive) {
    const x = sample * drive;
    // Asymmetric soft-clip adding rich even harmonics (2nd & 4th)
    if (x < -3) return -1;
    if (x > 3) return 1;
    let out = x > 0 ? Math.tanh(x) : Math.sinh(x) / Math.cosh(x * 1.2);
    return out;
  }

  // 2. Blues Overdrive (Symetric Soft Clipping + Mid-Range Bump)
  processBlues(sample, drive) {
    const x = sample * drive;
    // Soft S-curve mathematical saturation
    return (2 / Math.PI) * Math.atan(x * 1.5);
  }

  // 3. Heavy Metal High-Gain (Hard Clipping + Aggressive Compression)
  processMetal(sample, drive) {
    const x = sample * (drive * 3.0); // Extreme boost
    // Hard limit threshold (Rectified Square wave approximation)
    if (x > 0.8) return 0.8;
    if (x < -0.8) return -0.8;
    return x;
  }

  process(inputs, outputs) {
    const input = inputs[0];
    const output = outputs[0];

    if (!input || !input[0] || input[0].length === 0) return true;

    const inputChannel = input[0];
    const outputLeft = output[0];
    const outputRight = output[1] || output[0];
    const frameCount = inputChannel.length;

    // --- Shared Memory Array Parameter Map ---
    // [0] Gate Thr    [1] Tube Drive   [2] Tube Mix   [3] Blues Drive  [4] Blues Mix
    // [5] Metal Drive [6] Metal Mix    [7] Cutoff     [8] Delay Time   [9] Delay FB
    const gateThr = this.params[0] !== undefined ? this.params[0] : 0.015;
    const tubeDrive = this.params[1] || 1.5;
    const tubeMix = this.params[2] !== undefined ? this.params[2] : 0.0;
    const bluesDrive = this.params[3] || 2.0;
    const bluesMix = this.params[4] !== undefined ? this.params[4] : 0.0;
    const metalDrive = this.params[5] || 4.0;
    const metalMix = this.params[6] !== undefined ? this.params[6] : 0.0;
    const cutoff = this.params[7] || 5000;
    const delayTime = Math.min(1.0, Math.max(0.01, this.params[8] || 0.25));
    const feedback = Math.min(0.85, Math.max(0.0, this.params[9] || 0.3));

    const delaySamples = Math.floor(delayTime * 96000);

    for (let i = 0; i < frameCount; ++i) {
      let drySample = inputChannel[i];
      let sample = drySample;

      // 1. Noise Gate
      const absSample = Math.abs(sample);
      if (absSample > gateThr) {
        this.gateEnvelope = 0.9 * this.gateEnvelope + 0.1;
      } else {
        this.gateEnvelope *= 0.995;
      }
      sample *= this.gateEnvelope;

      // 2. MIXABLE PEDAL CHAIN (Parallel / Cascaded Blending)
      let wetSignal = 0.0;
      let activeMixSum = 0.0;

      // Tube Stage
      if (tubeMix > 0.001) {
        const tubeOut = this.processTube(sample, tubeDrive);
        wetSignal += tubeOut * tubeMix;
        activeMixSum += tubeMix;
      }

      // Blues Overdrive Stage
      if (bluesMix > 0.001) {
        const bluesOut = this.processBlues(sample, bluesDrive);
        wetSignal += bluesOut * bluesMix;
        activeMixSum += bluesMix;
      }

      // Metal High-Gain Stage
      if (metalMix > 0.001) {
        const metalOut = this.processMetal(sample, metalDrive);
        wetSignal += metalOut * metalMix;
        activeMixSum += metalMix;
      }

      // Blend Mixable Pedals with Clean Dry Signal
      if (activeMixSum > 0.0) {
        const normalizedWet = wetSignal / Math.max(1.0, activeMixSum);
        sample = sample * (1.0 - Math.min(1.0, activeMixSum)) + normalizedWet * Math.min(1.0, activeMixSum);
      }

      // 3. Cabinet Filter
      const rc = 1.0 / (2.0 * Math.PI * cutoff);
      const alpha = (1.0 / 96000) / (rc + (1.0 / 96000));
      this.filterState += alpha * (sample - this.filterState);
      sample = this.filterState;

      // 4. Stereo Delay Loop
      const readIndex = (this.writeIndex - delaySamples + 96000) % 96000;
      const delayedLeft = this.delayBufferLeft[readIndex];
      const delayedRight = this.delayBufferRight[readIndex];

      this.delayBufferLeft[this.writeIndex] = sample + delayedLeft * feedback;
      this.delayBufferRight[this.writeIndex] = sample + delayedRight * feedback;

      this.writeIndex = (this.writeIndex + 1) % 96000;

      // Final Output Stage
      outputLeft[i] = sample + delayedLeft * 0.4;
      outputRight[i] = sample + delayedRight * 0.4;
    }

    return true;
  }
}

registerProcessor('coral-dsp-processor', CoralDspProcessor);
