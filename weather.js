// weather.js - Day/Night Cycle and Weather Engine for Nikku's Dream Garden

class GardenWeather {
  constructor() {
    this.gameTime = 480; // Starts at 08:00 AM (480 minutes from midnight)
    this.currentWeather = 'sunny'; // sunny, cloudy, rain, storm, fog, windy
    this.weatherHistory = [];
    this.daysGardening = 1;
    this.lastTickTime = Date.now();
    
    // Light percentages for overlays
    this.timePhases = {
      morning: { start: 360, end: 719, name: 'Morning' },      // 06:00 - 11:59
      afternoon: { start: 720, end: 1079, name: 'Afternoon' },  // 12:00 - 17:59
      evening: { start: 1080, end: 1319, name: 'Evening' },    // 18:00 - 21:59
      night: { start: 1320, end: 359, name: 'Night' }          // 22:00 - 05:59
    };
  }

  // Set initial state from loaded save file
  loadState(savedData) {
    if (savedData) {
      this.gameTime = savedData.gameTime !== undefined ? savedData.gameTime : 480;
      this.currentWeather = savedData.currentWeather || 'sunny';
      this.daysGardening = savedData.daysGardening || 1;
      this.weatherHistory = savedData.weatherHistory || [];
    }
  }

  // Returns data to be saved
  saveState() {
    return {
      gameTime: this.gameTime,
      currentWeather: this.currentWeather,
      daysGardening: this.daysGardening,
      weatherHistory: this.weatherHistory
    };
  }

  // Update clock by 1 game minute per real second
  tick() {
    this.gameTime = (this.gameTime + 1) % 1440; // 1440 minutes in a 24h day
    
    // If it rolls over midnight, start a new day and roll new weather
    if (this.gameTime === 0) {
      this.daysGardening++;
      this.rollNewWeather();
      // Auto-water check on new day if weather is rain or storm
      if (typeof window !== 'undefined' && window.gameEngine) {
        window.gameEngine.onNewDay();
      }
    }

    // Play random thunder SFX during storms
    if (this.currentWeather === 'storm' && Math.random() < 0.005) {
      this.triggerThunderFlash();
    }
  }

  rollNewWeather() {
    const roll = Math.random();
    let newWeather = 'sunny';
    
    if (roll < 0.35) newWeather = 'sunny';
    else if (roll < 0.60) newWeather = 'cloudy';
    else if (roll < 0.75) newWeather = 'rain';
    else if (roll < 0.85) newWeather = 'windy';
    else if (roll < 0.93) newWeather = 'fog';
    else newWeather = 'storm';

    this.currentWeather = newWeather;
    this.weatherHistory.push(newWeather);
    if (this.weatherHistory.length > 30) this.weatherHistory.shift();

    // Trigger audio changes
    if (typeof audioManager !== 'undefined' && audioManager.initialized) {
      audioManager.setRainSound(newWeather === 'rain' || newWeather === 'storm', newWeather === 'storm');
    }
    
    // Trigger visual updates
    this.updateWeatherUI();
  }

  forceWeather(weatherType) {
    this.currentWeather = weatherType;
    if (typeof audioManager !== 'undefined' && audioManager.initialized) {
      audioManager.setRainSound(weatherType === 'rain' || weatherType === 'storm', weatherType === 'storm');
    }
    this.updateWeatherUI();
  }

  getTimeString() {
    const hrs = Math.floor(this.gameTime / 60);
    const mins = Math.floor(this.gameTime % 60);
    const ampm = hrs >= 12 ? 'PM' : 'AM';
    const formattedHrs = hrs % 12 === 0 ? 12 : hrs % 12;
    const formattedMins = mins < 10 ? '0' + mins : mins;
    return `${formattedHrs}:${formattedMins} ${ampm}`;
  }

  getCurrentPhase() {
    const t = this.gameTime;
    if (t >= 360 && t < 720) return 'morning';
    if (t >= 720 && t < 1080) return 'afternoon';
    if (t >= 1080 && t < 1320) return 'evening';
    return 'night';
  }

  // Get angle in degrees for sunflowers to rotate.
  // 06:00 is -90deg, 12:00 is 0deg, 18:00 is 90deg. Night returns 0deg (idle).
  getSunAngle() {
    const t = this.gameTime;
    if (t >= 360 && t <= 1080) { // between 06:00 and 18:00
      // Map 360..1080 to -75deg to +75deg (smooth face movement)
      const ratio = (t - 360) / 720; // 0 to 1
      return -70 + (ratio * 140);
    }
    return 0; // standard facing center at night
  }

  // Get color overlay filters to represent lighting
  getOverlayStyle() {
    const t = this.gameTime;
    let r = 0, g = 0, b = 0, a = 0;

    // Interpolate overlays between boundaries
    if (t >= 300 && t < 480) { // Dawn transition: 05:00 - 08:00
      const ratio = (t - 300) / 180;
      // Start night (blue-purple) to soft morning gold
      r = Math.floor(180 - (ratio * 80));
      g = Math.floor(100 + (ratio * 50));
      b = Math.floor(255 - (ratio * 150));
      a = 0.5 - (ratio * 0.4); // fade out dark overlay
    } else if (t >= 480 && t < 1020) { // Day clear: 08:00 - 17:00
      r = 255; g = 255; b = 255; a = 0; // perfectly clear
    } else if (t >= 1020 && t < 1140) { // Sunset golden hour: 17:00 - 19:00
      const ratio = (t - 1020) / 120;
      r = 255;
      g = Math.floor(160 - (ratio * 80)); // goes red-orange
      b = Math.floor(80 + (ratio * 40));
      a = ratio * 0.35; // sunset filter increases
    } else if (t >= 1140 && t < 1260) { // Dusk transition: 19:00 - 21:00
      const ratio = (t - 1140) / 120;
      // Sunset orange to deep purple-blue night
      r = Math.floor(255 - (ratio * 240));
      g = Math.floor(80 - (ratio * 60));
      b = Math.floor(120 + (ratio * 100));
      a = 0.35 + (ratio * 0.35); // increases dark overlay
    } else { // Deep night: 21:00 - 05:00
      r = 15; g = 20; b = 60; a = 0.65; // dark blue-violet shade
    }

    return `rgba(${r}, ${g}, ${b}, ${a})`;
  }

  // Adjust plant growth calculations based on weather multipliers
  getWeatherGrowthMultiplier() {
    switch (this.currentWeather) {
      case 'sunny': return 1.5;     // sunshine speeds growth
      case 'cloudy': return 1.0;
      case 'rain': return 0.8;      // rain speeds water, but grows slightly slower
      case 'storm': return 0.5;     // stormy weather slows down growth
      case 'fog': return 0.9;
      case 'windy': return 1.1;     // wind stirs pollen, slightly helping
      default: return 1.0;
    }
  }

  // Water evaporation speed
  getWaterLossMultiplier() {
    switch (this.currentWeather) {
      case 'sunny': return 1.8;      // sun dries soil rapidly
      case 'cloudy': return 1.0;
      case 'rain': return -3.0;     // negative means water increases (+15% of capacity per min)
      case 'storm': return -5.0;    // storm waters soil extremely fast (+25% of capacity per min)
      case 'fog': return 0.2;       // fog preserves hydration
      case 'windy': return 1.3;     // wind accelerates dry out
      default: return 1.0;
    }
  }

  updateWeatherUI() {
    const overlay = document.getElementById('sky-overlay');
    if (overlay) {
      overlay.style.backgroundColor = this.getOverlayStyle();
    }
    
    const weatherIndicator = document.getElementById('weather-status');
    const weatherEmoji = document.getElementById('weather-emoji');
    if (weatherIndicator && weatherEmoji) {
      let emoji = '☀';
      let label = 'Sunny';
      switch (this.currentWeather) {
        case 'sunny': emoji = '☀'; label = 'Sunny'; break;
        case 'cloudy': emoji = '☁'; label = 'Cloudy'; break;
        case 'rain': emoji = '🌧'; label = 'Rainy'; break;
        case 'storm': emoji = '⛈'; label = 'Stormy'; break;
        case 'fog': emoji = '🌫'; label = 'Foggy'; break;
        case 'windy': emoji = '💨'; label = 'Windy'; break;
      }
      weatherEmoji.textContent = emoji;
      weatherIndicator.textContent = label;
    }
    
    // Toggle active weather container class
    const container = document.getElementById('game-container');
    if (container) {
      container.className = `weather-${this.currentWeather} phase-${this.getCurrentPhase()}`;
    }
  }

  triggerThunderFlash() {
    const overlay = document.getElementById('thunder-flash');
    if (overlay) {
      overlay.classList.add('flash-active');
      if (typeof audioManager !== 'undefined' && audioManager.initialized) {
        audioManager.playSFXStormThunder();
      }
      setTimeout(() => {
        overlay.classList.remove('flash-active');
      }, 150);
    }
  }
}

// Global instance
const weatherEngine = new GardenWeather();
