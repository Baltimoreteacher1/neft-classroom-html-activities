export class SpeechTelemetry {
    audioCtx = null;
    analyser = null;
    isListening = false;
    cadenceBuffer = [];
    lastSpeechTimestamp = 0;
    constructor() { }
    async initializeAudioPipeline() {
        try {
            if (typeof navigator === 'undefined' || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                return;
            }
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            this.audioCtx = new AudioContextClass();
            const source = this.audioCtx.createMediaStreamSource(stream);
            this.analyser = this.audioCtx.createAnalyser();
            this.analyser.fftSize = 256;
            source.connect(this.analyser);
            this.isListening = true;
            this.monitorPacing();
        }
        catch (e) {
            // Graceful fallback when microphone permission denied or headless
            this.isListening = false;
        }
    }
    monitorPacing() {
        if (!this.isListening || !this.analyser)
            return;
        const bufferLength = this.analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        this.analyser.getByteFrequencyData(dataArray);
        const averageVolume = dataArray.reduce((p, c) => p + c, 0) / bufferLength;
        if (averageVolume > 30) {
            const now = performance.now();
            if (this.lastSpeechTimestamp > 0) {
                const delta = now - this.lastSpeechTimestamp;
                this.cadenceBuffer.push(delta);
                if (this.cadenceBuffer.length > 20)
                    this.cadenceBuffer.shift();
            }
            this.lastSpeechTimestamp = now;
        }
        if (typeof requestAnimationFrame !== 'undefined') {
            requestAnimationFrame(() => this.monitorPacing());
        }
    }
    getPacingMetric() {
        if (this.cadenceBuffer.length === 0)
            return { currentCadenceMs: 0, isHesitant: false };
        const avgCadence = this.cadenceBuffer.reduce((a, b) => a + b, 0) / this.cadenceBuffer.length;
        return {
            currentCadenceMs: Math.round(avgCadence),
            isHesitant: avgCadence > 1200 // Threshold for verbal pause detection
        };
    }
}
