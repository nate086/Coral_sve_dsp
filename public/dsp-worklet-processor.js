class CoralDspProcessor extends AudioWorkletProcessor {
  constructor(options) {
    super();
    // Access SharedArrayBuffer passed from Main Thread
    this.sab = options.processorOptions.sab;
    this.params = new Float32Array(this.sab);

    // Filter and State Memory (Pre-allocated for Zero GC)
    this.filterState = 0;
    this.delayBufferLeft = new Float32Array(96000); // 1-second max ring buffer at 96kHz
    this.delayBufferRight = new Float32Array(96000);
    this.writeIndex = 0;
  }

  process(inputs, outputs) {
    const input = inputs[0];
    const output = outputs[0];

    // If no active guitar input signal yet, return true to keep thread live
    if (!input || !input[0] || input[0].length === 0) return true;

    const inputChannel = input[0];
    const outputLeft = output[0];
    const outputRight = output[1] || output[0];
    const frameCount = inputChannel.length;

    // Zero-Latency Read from Shared Memory Array Pointer
    // Index 0: Drive | Index 1: Cutoff Hz | Index 2: Delay Time (s) | Index 3: Feedback Gain
    const drive = this.params[0] || 1.0;
    const cutoff = this.params[1] || 8000;
    const delayTime = Math.min(1.0, Math.max(0.01, this.params[2] || 0.2));
    const feedback = Math.min(0.85, Math.max(0.0, this.params[3] || 0.3));

    const delaySamples = Math.floor(delayTime * 96000);

    for (let i = 0; i < frameCount; ++i) {
      let sample = inputChannel[i];

      // 1. Soft-Clipping Overdrive (SVE Dynamic Wave-shaping)
      sample = Math.tanh(sample * drive);

      // 2. Single-Pole Resonant Low-Pass Filter
      const rc = 1.0 / (2.0 * Math.PI * cutoff);
      const alpha = (1.0 / 96000) / (rc + (1.0 / 96000));
      this.filterState += alpha * (sample - this.filterState);
      sample = this.filterState;

      // 3. Stereo Delay Tap
      const readIndex = (this.writeIndex - delaySamples + 96000) % 96000;
      const delayedSampleLeft = this.delayBufferLeft[readIndex];
      const delayedSampleRight = this.delayBufferRight[readIndex];

      // Store current sample + feedback into delay ring buffer
      this.delayBufferLeft[this.writeIndex] = sample + delayedSampleLeft * feedback;
      this.delayBufferRight[this.writeIndex] = sample + delayedSampleRight * feedback;

      this.writeIndex = (this.writeIndex + 1) % 96000;

      // Final Output Stream
      outputLeft[i] = sample + delayedSampleLeft * 0.5;
      outputRight[i] = sample + delayedSampleRight * 0.5;
    }

    return true;
  }
}

registerProcessor('coral-dsp-processor', CoralDspProcessor);
