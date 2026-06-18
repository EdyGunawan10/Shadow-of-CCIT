class SoundManager {
    constructor() {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        this.context = AudioContextClass ? new AudioContextClass() : null;
        this.masterGain = null;
        this.heartbeatLastPlayed = 0;
        this.alertLastPlayed = 0;
        this.hidingLastPlayed = 0;

        if (this.context) {
            this.masterGain = this.context.createGain();
            this.masterGain.gain.value = 0.34;
            this.masterGain.connect(this.context.destination);
        }
    }

    resume() {
        if (this.context && this.context.state === 'suspended') {
            return this.context.resume();
        }
        return Promise.resolve();
    }

    createGain(value, startTime, endTime) {
        const gain = this.context.createGain();
        gain.gain.setValueAtTime(0.0001, startTime);
        gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, value), startTime + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.0001, endTime);
        gain.connect(this.masterGain);
        return gain;
    }

    playAssassinateSound() {
        if (!this.context) return;

        const now = this.context.currentTime;
        const oscillator = this.context.createOscillator();
        const gain = this.createGain(0.55, now, now + 0.22);
        const highpass = this.context.createBiquadFilter();

        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(1280, now);
        oscillator.frequency.exponentialRampToValueAtTime(120, now + 0.18);

        highpass.type = 'highpass';
        highpass.frequency.setValueAtTime(640, now);
        highpass.Q.value = 8;

        oscillator.connect(highpass);
        highpass.connect(gain);
        oscillator.start(now);
        oscillator.stop(now + 0.24);

        const bladeNoise = this.createWhiteNoise(0.15);
        const noiseGain = this.createGain(0.18, now, now + 0.11);
        const bandpass = this.context.createBiquadFilter();
        bandpass.type = 'bandpass';
        bandpass.frequency.value = 2800;
        bandpass.Q.value = 4;
        bladeNoise.connect(bandpass);
        bandpass.connect(noiseGain);
        bladeNoise.start(now);
        bladeNoise.stop(now + 0.12);
    }

    playAlertSound() {
        if (!this.context) return;

        const now = this.context.currentTime;
        if (now - this.alertLastPlayed < 0.35) return;
        this.alertLastPlayed = now;

        for (let i = 0; i < 3; i += 1) {
            const start = now + i * 0.12;
            const oscillator = this.context.createOscillator();
            const gain = this.createGain(0.22, start, start + 0.085);
            oscillator.type = 'square';
            oscillator.frequency.setValueAtTime(i % 2 === 0 ? 1060 : 1480, start);
            oscillator.connect(gain);
            oscillator.start(start);
            oscillator.stop(start + 0.09);
        }
    }

    createWhiteNoise(duration) {
        const bufferSize = Math.max(1, Math.floor(this.context.sampleRate * duration));
        const buffer = this.context.createBuffer(1, bufferSize, this.context.sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < bufferSize; i += 1) {
            data[i] = Math.random() * 2 - 1;
        }

        const source = this.context.createBufferSource();
        source.buffer = buffer;
        return source;
    }

    playHidingSound() {
        if (!this.context) return;

        const now = this.context.currentTime;
        if (now - this.hidingLastPlayed < 0.75) return;
        this.hidingLastPlayed = now;

        const noise = this.createWhiteNoise(0.85);
        const lowpass = this.context.createBiquadFilter();
        const gain = this.createGain(0.16, now, now + 0.78);

        lowpass.type = 'lowpass';
        lowpass.frequency.setValueAtTime(720, now);
        lowpass.frequency.exponentialRampToValueAtTime(260, now + 0.75);
        lowpass.Q.value = 0.8;

        noise.connect(lowpass);
        lowpass.connect(gain);
        noise.start(now);
        noise.stop(now + 0.85);
    }

    playHeartbeatSound(speed = 1) {
        if (!this.context) return;

        const now = this.context.currentTime;
        const tempo = Math.max(0.22, 0.85 - Math.min(1, speed) * 0.56);
        if (now - this.heartbeatLastPlayed < tempo) return;
        this.heartbeatLastPlayed = now;

        this.playHeartbeatPulse(now, 0.34);
        this.playHeartbeatPulse(now + 0.15, 0.24);
    }

    playHeartbeatPulse(startTime, intensity) {
        const oscillator = this.context.createOscillator();
        const gain = this.createGain(intensity, startTime, startTime + 0.13);
        const lowpass = this.context.createBiquadFilter();

        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(60, startTime);
        oscillator.frequency.exponentialRampToValueAtTime(45, startTime + 0.11);

        lowpass.type = 'lowpass';
        lowpass.frequency.value = 120;
        lowpass.Q.value = 1.2;

        oscillator.connect(lowpass);
        lowpass.connect(gain);
        oscillator.start(startTime);
        oscillator.stop(startTime + 0.14);
    }
}

window.SoundManager = SoundManager;
