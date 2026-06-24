// audio.js - Web Audio API Procedural Synthesizer for Nikku's Dream Garden

class GardenAudio {
  constructor() {
    this.ctx = null;
    this.initialized = false;

    // Node gain controls
    this.masterGain = null;
    this.musicGain = null;
    this.ambientGain = null;
    this.sfxGain = null;

    // Generators and loops references
    this.windNode = null;
    this.rainNode = null;
    this.musicInterval = null;
    this.birdTimeout = null;

    // Settings
    this.musicEnabled = false;
    this.ambientEnabled = false;
    this.sfxEnabled = true;

    // Volume configuration (0 to 1)
    this.volMaster = 0.8;
    this.volMusic = 0.5;
    this.volAmbient = 0.4;
    this.volSFX = 0.6;
    
    // Play states
    this.isMusicPlaying = false;
    this.isAmbientPlaying = false;
    
    // Scale for procedural music: F# major pentatonic (very soothing, black keys)
    this.scale = [185.00, 207.65, 233.08, 277.18, 311.13, 369.99, 415.30, 466.16, 554.37, 622.25];
    this.chords = [
      [185.00, 233.08, 277.18, 369.99], // F# maj7 (open)
      [207.65, 277.18, 311.13, 415.30], // G#sus4
      [233.08, 277.18, 369.99, 466.16], // A#m7
      [277.18, 311.13, 415.30, 554.37]  // C#sus2
    ];
    this.currentChordIndex = 0;
  }

  // Initialize Audio Context on user click/interaction
  init() {
    if (this.initialized) return;
    
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioContext();
      
      // Setup Gain Nodes
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.volMaster, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.setValueAtTime(this.volMusic, this.ctx.currentTime);
      this.musicGain.connect(this.masterGain);

      this.ambientGain = this.ctx.createGain();
      this.ambientGain.gain.setValueAtTime(this.volAmbient, this.ctx.currentTime);
      this.ambientGain.connect(this.masterGain);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.setValueAtTime(this.volSFX, this.ctx.currentTime);
      this.sfxGain.connect(this.masterGain);

      // Create Delay Node for melodic effects (adds depth to music)
      this.delayNode = this.ctx.createDelay(1.5);
      this.delayFeedback = this.ctx.createGain();
      this.delayNode.delayTime.setValueAtTime(0.6, this.ctx.currentTime);
      this.delayFeedback.gain.setValueAtTime(0.4, this.ctx.currentTime);
      
      // Delay routing: input -> delay -> feedback -> delay -> musicGain
      this.delayNode.connect(this.delayFeedback);
      this.delayFeedback.connect(this.delayNode);
      this.delayNode.connect(this.musicGain);

      this.initialized = true;
      console.log('GardenAudio procedural synthesizer initialized successfully.');

      // Start loops if enabled
      if (this.musicEnabled) this.startMusic();
      if (this.ambientEnabled) this.startAmbient();
    } catch (e) {
      console.warn('Web Audio API not supported or blocked: ', e);
    }
  }

  resumeContext() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  setMasterVolume(val) {
    this.volMaster = parseFloat(val);
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.volMaster, this.ctx.currentTime);
    }
  }

  setMusicVolume(val) {
    this.volMusic = parseFloat(val);
    if (this.musicGain && this.ctx) {
      this.musicGain.gain.setValueAtTime(this.volMusic, this.ctx.currentTime);
    }
  }

  setAmbientVolume(val) {
    this.volAmbient = parseFloat(val);
    if (this.ambientGain && this.ctx) {
      this.ambientGain.gain.setValueAtTime(this.volAmbient, this.ctx.currentTime);
    }
  }

  setSFXVolume(val) {
    this.volSFX = parseFloat(val);
    if (this.sfxGain && this.ctx) {
      this.sfxGain.gain.setValueAtTime(this.volSFX, this.ctx.currentTime);
    }
  }

  toggleMusic(forceState) {
    this.musicEnabled = forceState !== undefined ? forceState : !this.musicEnabled;
    if (this.musicEnabled) {
      this.init();
      this.resumeContext();
      this.startMusic();
    } else {
      this.stopMusic();
    }
    return this.musicEnabled;
  }

  toggleAmbient(forceState) {
    this.ambientEnabled = forceState !== undefined ? forceState : !this.ambientEnabled;
    if (this.ambientEnabled) {
      this.init();
      this.resumeContext();
      this.startAmbient();
    } else {
      this.stopAmbient();
    }
    return this.ambientEnabled;
  }

  toggleSFX(forceState) {
    this.sfxEnabled = forceState !== undefined ? forceState : !this.sfxEnabled;
    return this.sfxEnabled;
  }

  // --- AMBIENT SOUND GENERATORS (Procedural Noise) ---
  
  createNoiseBuffer() {
    const bufferSize = 2 * this.ctx.sampleRate;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }

  startAmbient() {
    if (this.isAmbientPlaying || !this.initialized) return;
    this.isAmbientPlaying = true;

    // --- WIND SYNTHESIS ---
    const windBuffer = this.createNoiseBuffer();
    const windSource = this.ctx.createBufferSource();
    windSource.buffer = windBuffer;
    windSource.loop = true;

    // Filter to shape wind sound (resonant lowpass)
    const windFilter = this.ctx.createBiquadFilter();
    windFilter.type = 'lowpass';
    windFilter.Q.value = 3.0;
    
    // Wind Modulator LFO (creates gusts)
    const windLFO = this.ctx.createOscillator();
    windLFO.type = 'sine';
    windLFO.frequency.setValueAtTime(0.08, this.ctx.currentTime); // very slow oscillation
    
    const windLFOGain = this.ctx.createGain();
    windLFOGain.gain.setValueAtTime(250, this.ctx.currentTime); // modulates filter by 250Hz

    // Bind LFO -> Filter Cutoff
    windLFO.connect(windLFOGain);
    windLFOGain.connect(windFilter.frequency);
    
    windFilter.frequency.setValueAtTime(350, this.ctx.currentTime); // Base cutoff
    
    // Wind Volume Gain
    const windGain = this.ctx.createGain();
    windGain.gain.setValueAtTime(0.12, this.ctx.currentTime);

    // Connections
    windSource.connect(windFilter);
    windFilter.connect(windGain);
    windGain.connect(this.ambientGain);

    windSource.start(0);
    windLFO.start(0);

    // Save nodes to kill later
    this.windNode = { source: windSource, filter: windFilter, lfo: windLFO, gain: windGain };

    // --- BIRD CHIRP SCHEDULER ---
    const scheduleBirds = () => {
      if (!this.isAmbientPlaying) return;
      
      const nextChirpDelay = 8000 + Math.random() * 15000; // chirp every 8-23 seconds
      this.birdTimeout = setTimeout(() => {
        this.playBirdChirp();
        scheduleBirds();
      }, nextChirpDelay);
    };
    scheduleBirds();
  }

  stopAmbient() {
    this.isAmbientPlaying = false;
    if (this.windNode) {
      try {
        this.windNode.source.stop();
        this.windNode.lfo.stop();
      } catch (e) {}
      this.windNode = null;
    }
    if (this.rainNode) {
      try {
        this.rainNode.source.stop();
      } catch (e) {}
      this.rainNode = null;
    }
    if (this.birdTimeout) {
      clearTimeout(this.birdTimeout);
    }
  }

  // Dynamically start rain sounds when weather changes
  setRainSound(active, isStorm = false) {
    if (!this.initialized || !this.ambientEnabled) return;
    
    if (active) {
      if (this.rainNode) return; // already running

      const rainBuffer = this.createNoiseBuffer();
      const rainSource = this.ctx.createBufferSource();
      rainSource.buffer = rainBuffer;
      rainSource.loop = true;

      const rainFilter = this.ctx.createBiquadFilter();
      rainFilter.type = 'bandpass';
      rainFilter.frequency.setValueAtTime(isStorm ? 1200 : 1500, this.ctx.currentTime);
      rainFilter.Q.value = 1.0;

      const rainGain = this.ctx.createGain();
      rainGain.gain.setValueAtTime(isStorm ? 0.15 : 0.08, this.ctx.currentTime);

      rainSource.connect(rainFilter);
      rainFilter.connect(rainGain);
      rainGain.connect(this.ambientGain);
      
      rainSource.start(0);
      this.rainNode = { source: rainSource, gain: rainGain, filter: rainFilter };
    } else {
      if (this.rainNode) {
        try {
          this.rainNode.source.stop();
        } catch (e) {}
        this.rainNode = null;
      }
    }
  }

  playBirdChirp() {
    if (!this.initialized || !this.isAmbientPlaying) return;

    const now = this.ctx.currentTime;
    const chirpsCount = 2 + Math.floor(Math.random() * 3); // 2-4 chirps in quick succession
    
    let timeOffset = 0;
    for (let c = 0; c < chirpsCount; c++) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc.connect(gain);
      gain.connect(this.ambientGain);

      osc.type = 'sine';
      const baseFreq = 2800 + Math.random() * 1000;
      osc.frequency.setValueAtTime(baseFreq, now + timeOffset);
      
      // Sweep pitch up and down quickly
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.4, now + timeOffset + 0.05);
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.8, now + timeOffset + 0.12);

      gain.gain.setValueAtTime(0, now + timeOffset);
      gain.gain.linearRampToValueAtTime(0.04, now + timeOffset + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + timeOffset + 0.15);

      osc.start(now + timeOffset);
      osc.stop(now + timeOffset + 0.16);

      timeOffset += 0.18 + Math.random() * 0.1; // gap between chirps
    }
  }

  // --- PROCEDURAL MUSIC SYNTHESIS ---
  
  startMusic() {
    if (this.isMusicPlaying || !this.initialized) return;
    this.isMusicPlaying = true;

    // Start chord progression and melody generator
    let beat = 0;
    const playTick = () => {
      if (!this.isMusicPlaying) return;

      const now = this.ctx.currentTime;

      // Every 16 beats, change background chord
      if (beat % 16 === 0) {
        this.currentChordIndex = (this.currentChordIndex + 1) % this.chords.length;
        this.playBackgroundPad(this.chords[this.currentChordIndex], now);
      }

      // 40% chance to play a melody note on each tick (smooth tempo)
      if (Math.random() < 0.45 && beat % 2 === 0) {
        // Pick a note from the F# pentatonic scale
        const noteIndex = Math.floor(Math.random() * this.scale.length);
        const pitch = this.scale[noteIndex];
        
        // Play soft melody note
        this.playMelodyNote(pitch, now);
      }

      beat++;
      // Tick every 800ms
      this.musicInterval = setTimeout(playTick, 800);
    };

    playTick();
  }

  stopMusic() {
    this.isMusicPlaying = false;
    if (this.musicInterval) {
      clearTimeout(this.musicInterval);
    }
  }

  playBackgroundPad(chordFreqs, time) {
    // Play warm background synth drone for 13 seconds
    const padDuration = 13.5;
    
    chordFreqs.forEach((freq) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq / 2, time); // Drone is 1 octave lower

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(200, time);
      filter.frequency.linearRampToValueAtTime(380, time + padDuration / 2);
      filter.frequency.linearRampToValueAtTime(200, time + padDuration);

      gain.gain.setValueAtTime(0, time);
      gain.gain.linearRampToValueAtTime(0.06, time + 2.0); // slow attack
      gain.gain.setValueAtTime(0.06, time + padDuration - 3.0);
      gain.gain.linearRampToValueAtTime(0, time + padDuration); // slow decay

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.musicGain);

      osc.start(time);
      osc.stop(time + padDuration + 0.5);
    });
  }

  playMelodyNote(freq, time) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = Math.random() > 0.5 ? 'sine' : 'triangle';
    osc.frequency.setValueAtTime(freq, time);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1000, time);
    filter.Q.value = 1.0;

    // Envelopes
    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(0.06, time + 0.15); // soft attack
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 2.5); // long decay

    // Routing: connect to delayNode for echo, and directly to musicGain
    osc.connect(filter);
    filter.connect(gain);
    
    gain.connect(this.musicGain);
    gain.connect(this.delayNode);

    osc.start(time);
    osc.stop(time + 2.8);
  }

  // --- SOUND EFFECTS (SFX) ---

  playSFXWatering() {
    if (!this.initialized || !this.sfxEnabled) return;
    
    const now = this.ctx.currentTime;
    const noise = this.ctx.createBufferSource();
    noise.buffer = this.createNoiseBuffer();

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1200, now);
    filter.frequency.linearRampToValueAtTime(600, now + 0.4);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.15, now + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.55);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    noise.start(now);
    noise.stop(now + 0.6);
  }

  playSFXDig() {
    if (!this.initialized || !this.sfxEnabled) return;

    const now = this.ctx.currentTime;
    
    // Low frequency thump
    const osc = this.ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(120, now);
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.15);

    // Friction scrape (filtered noise)
    const noise = this.ctx.createBufferSource();
    noise.buffer = this.createNoiseBuffer();

    const noiseFilter = this.ctx.createBiquadFilter();
    noiseFilter.type = 'lowpass';
    noiseFilter.frequency.setValueAtTime(300, now);

    const oscGain = this.ctx.createGain();
    oscGain.gain.setValueAtTime(0.25, now);
    oscGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.2);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.12, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.15);

    osc.connect(oscGain);
    oscGain.connect(this.sfxGain);

    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.25);
    noise.start(now);
    noise.stop(now + 0.2);
  }

  playSFXPlant() {
    if (!this.initialized || !this.sfxEnabled) return;

    const now = this.ctx.currentTime;
    
    // High-ish rustling sound followed by a soft note
    const noise = this.ctx.createBufferSource();
    noise.buffer = this.createNoiseBuffer();

    const noiseFilter = this.ctx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.setValueAtTime(1000, now);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0, now);
    noiseGain.gain.linearRampToValueAtTime(0.06, now + 0.05);
    noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.2);

    // Success confirmation bell
    const chime = this.ctx.createOscillator();
    chime.type = 'sine';
    chime.frequency.setValueAtTime(440, now + 0.05);
    chime.frequency.setValueAtTime(554.37, now + 0.12);

    const chimeGain = this.ctx.createGain();
    chimeGain.gain.setValueAtTime(0, now);
    chimeGain.gain.linearRampToValueAtTime(0.05, now + 0.08);
    chimeGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);

    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.sfxGain);

    chime.connect(chimeGain);
    chimeGain.connect(this.sfxGain);

    noise.start(now);
    noise.stop(now + 0.25);
    chime.start(now);
    chime.stop(now + 0.4);
  }

  playSFXAchievement() {
    if (!this.initialized || !this.sfxEnabled) return;

    const now = this.ctx.currentTime;
    const notes = [329.63, 392.00, 523.25, 659.25, 783.99, 1046.50]; // E pentatonic arpeggio sweep

    notes.forEach((freq, idx) => {
      const timeOffset = idx * 0.08;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + timeOffset);

      gain.gain.setValueAtTime(0, now + timeOffset);
      gain.gain.linearRampToValueAtTime(0.05, now + timeOffset + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + timeOffset + 0.4);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(now + timeOffset);
      osc.stop(now + timeOffset + 0.45);
    });
  }

  playSFXClick() {
    if (!this.initialized || !this.sfxEnabled) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(1000, now);
    osc.frequency.exponentialRampToValueAtTime(400, now + 0.05);

    gain.gain.setValueAtTime(0.03, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.06);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.07);
  }

  playSFXStormThunder() {
    if (!this.initialized || !this.sfxEnabled) return;

    const now = this.ctx.currentTime;
    const noise = this.ctx.createBufferSource();
    noise.buffer = this.createNoiseBuffer();

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(80, now);
    filter.frequency.linearRampToValueAtTime(20, now + 1.5);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.3, now + 0.1); // loud rumble
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 2.5);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    noise.start(now);
    noise.stop(now + 2.6);
  }
}

// Global instance
const audioManager = new GardenAudio();
