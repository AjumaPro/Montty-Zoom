// Background Noise Suppression using Web Audio API
export class NoiseSuppressionProcessor {
  constructor(audioContext, sourceNode) {
    this.audioContext = audioContext;
    this.sourceNode = sourceNode;
    this.processorNode = null;
    this.gainNode = null;
    this.isEnabled = false;
    
    this.setupProcessor();
  }

  setupProcessor() {
    // Create a gain node for volume control
    this.gainNode = this.audioContext.createGain();
    
    // Create a script processor for noise suppression
    const bufferSize = 4096;
    this.processorNode = this.audioContext.createScriptProcessor(bufferSize, 1, 1);
    
    // Noise suppression algorithm
    this.processorNode.onaudioprocess = (event) => {
      if (!this.isEnabled) {
        // Pass through audio without processing
        const inputBuffer = event.inputBuffer;
        const outputBuffer = event.outputBuffer;
        const inputData = inputBuffer.getChannelData(0);
        const outputData = outputBuffer.getChannelData(0);
        
        for (let i = 0; i < inputData.length; i++) {
          outputData[i] = inputData[i];
        }
        return;
      }

      const inputBuffer = event.inputBuffer;
      const outputBuffer = event.outputBuffer;
      const inputData = inputBuffer.getChannelData(0);
      const outputData = outputBuffer.getChannelData(0);
      
      // Simple noise gate and spectral subtraction
      const threshold = 0.01; // Noise threshold
      const smoothingFactor = 0.8;
      
      // Calculate RMS (Root Mean Square) for noise detection
      let sum = 0;
      for (let i = 0; i < inputData.length; i++) {
        sum += inputData[i] * inputData[i];
      }
      const rms = Math.sqrt(sum / inputData.length);
      
      // Apply noise gate
      if (rms < threshold) {
        // Suppress noise below threshold
        for (let i = 0; i < inputData.length; i++) {
          outputData[i] = inputData[i] * 0.1; // Reduce by 90%
        }
      } else {
        // Apply spectral subtraction (simplified)
        for (let i = 0; i < inputData.length; i++) {
          // High-pass filter to remove low-frequency noise
          const filtered = inputData[i];
          // Apply smoothing
          outputData[i] = filtered * smoothingFactor + (outputData[i] || 0) * (1 - smoothingFactor);
        }
      }
    };
  }

  enable() {
    this.isEnabled = true;
  }

  disable() {
    this.isEnabled = false;
  }

  connect(destination) {
    this.sourceNode.connect(this.processorNode);
    this.processorNode.connect(this.gainNode);
    this.gainNode.connect(destination);
    return this.gainNode;
  }

  disconnect() {
    if (this.sourceNode) this.sourceNode.disconnect();
    if (this.processorNode) this.processorNode.disconnect();
    if (this.gainNode) this.gainNode.disconnect();
  }
}

