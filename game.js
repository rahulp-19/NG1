// game.js - Core Game Engine and Save/Load Systems for Nikku's Dream Garden

class GardenGame {
  constructor() {
    // Game state variables
    this.coins = 500;
    this.daysGardening = 1;
    this.dailyStreak = 1;
    this.lastLoginTimestamp = Date.now();
    this.debugTimeOffset = 0; // cumulative offset in milliseconds for fast-forward debug
    
    // Inventory
    this.inventory = {
      seeds: {
        sunflower_common: 5,
        rose_red: 5,
        daisy_white: 5
      },
      decorations: {}
    };

    // Tools and upgrades
    this.currentTool = 'inspect';
    this.activeSeed = 'sunflower_common';
    this.activeDecor = '';
    this.wateringCanTier = 1; // 1 = Basic, 2 = Advanced, 3 = Hose
    this.unlockedSprinklers = false;

    // Grid data (20x20)
    this.grid = [];
    this.gridSize = 20;

    // Statistics
    this.stats = {
      flowersGrown: 0,
      sunflowersGrown: 0,
      totalCoinsEarned: 500,
      waterApplied: 0,
      hybridsBred: 0
    };

    // Lists for tracking
    this.unlockedEncyclopedia = new Set(['sunflower_common', 'rose_red', 'daisy_white']);
    this.unlockedAchievements = new Set();
    
    // Camera pan & zoom properties
    this.zoomScale = 1.0;
    this.panX = 0;
    this.panY = 0;
    this.isDragging = false;
    this.startX = 0;
    this.startY = 0;

    // Audio status
    this.audioInitialized = false;
  }

  // --- STARTUP AND SYSTEM INITS ---

  init() {
    this.setupGrid();
    this.loadGame();
    this.setupEventListeners();
    this.setupPanAndZoom();
    this.populateShop();
    this.populateEncyclopedia();
    this.populateAchievements();
    this.updateHUD();

    // Show initial welcome or welcome back modal
    const isNew = !localStorage.getItem('nikkus_dream_garden_save');
    if (isNew) {
      document.getElementById('first-launch-modal').style.display = 'flex';
    } else {
      this.calculateOfflineProgress();
    }

    // Auto-save interval (30 seconds)
    setInterval(() => {
      this.saveGame();
    }, 30000);

    // Weather Tick interval (1 second = 1 game minute)
    setInterval(() => {
      weatherEngine.tick();
      this.updateClockHUD();
      this.updateSunflowerRotations();
      this.decayWaterProgress();
    }, 1000);
  }

  setupGrid() {
    this.grid = [];
    const gridContainer = document.getElementById('garden-grid');
    gridContainer.innerHTML = '';

    for (let r = 0; r < this.gridSize; r++) {
      this.grid[r] = [];
      for (let c = 0; c < this.gridSize; c++) {
        // Default tile is grassy plain
        const tile = {
          row: r,
          col: c,
          type: 'grass', // grass, soil, path, fence
          item: null,     // flower object or decoration object
          fertilizedAt: 0, // timestamp
          fertilizerEnd: 0
        };
        this.grid[r][c] = tile;

        const tileEl = document.createElement('div');
        tileEl.className = 'garden-tile tile-grass';
        tileEl.dataset.row = r;
        tileEl.dataset.col = c;
        
        tileEl.addEventListener('click', (e) => this.handleTileClick(r, c, e));
        tileEl.addEventListener('mouseenter', () => this.handleTileHover(r, c, true));
        tileEl.addEventListener('mouseleave', () => this.handleTileHover(r, c, false));

        gridContainer.appendChild(tileEl);
      }
    }
  }

  // --- SAVE AND LOAD ---

  saveGame() {
    const saveData = {
      coins: this.coins,
      daysGardening: weatherEngine.daysGardening,
      dailyStreak: this.dailyStreak,
      lastLoginTimestamp: Date.now(),
      debugTimeOffset: this.debugTimeOffset,
      inventory: this.inventory,
      wateringCanTier: this.wateringCanTier,
      unlockedSprinklers: this.unlockedSprinklers,
      unlockedEncyclopedia: Array.from(this.unlockedEncyclopedia),
      unlockedAchievements: Array.from(this.unlockedAchievements),
      stats: this.stats,
      weather: weatherEngine.saveState(),
      grid: this.serializeGrid()
    };

    localStorage.setItem('nikkus_dream_garden_save', JSON.stringify(saveData));
    console.log('Game auto-saved.');
  }

  loadGame() {
    const saved = localStorage.getItem('nikkus_dream_garden_save');
    if (!saved) return;

    try {
      const data = JSON.parse(saved);
      this.coins = data.coins !== undefined ? data.coins : 500;
      this.dailyStreak = data.dailyStreak || 1;
      this.lastLoginTimestamp = data.lastLoginTimestamp || Date.now();
      this.debugTimeOffset = data.debugTimeOffset || 0;
      this.inventory = data.inventory || this.inventory;
      this.wateringCanTier = data.wateringCanTier || 1;
      this.unlockedSprinklers = data.unlockedSprinklers || false;
      this.stats = data.stats || this.stats;

      if (data.unlockedEncyclopedia) {
        this.unlockedEncyclopedia = new Set(data.unlockedEncyclopedia);
      }
      if (data.unlockedAchievements) {
        this.unlockedAchievements = new Set(data.unlockedAchievements);
      }

      if (data.weather) {
        weatherEngine.loadState(data.weather);
      }

      this.deserializeGrid(data.grid);
      console.log('Save state loaded successfully.');
    } catch (e) {
      console.error('Failed to load save state:', e);
    }
  }

  serializeGrid() {
    const serialized = [];
    for (let r = 0; r < this.gridSize; r++) {
      for (let c = 0; c < this.gridSize; c++) {
        const tile = this.grid[r][c];
        if (tile.type !== 'grass' || tile.item) {
          serialized.push({
            r: r,
            c: c,
            type: tile.type,
            fertilizedAt: tile.fertilizedAt,
            fertilizerEnd: tile.fertilizerEnd,
            item: tile.item ? {
              id: tile.item.id,
              type: tile.item.type, // 'flower' or 'decor'
              plantedAt: tile.item.plantedAt,
              wateredAt: tile.item.wateredAt,
              hydration: tile.item.hydration,
              health: tile.item.health,
              quality: tile.item.quality || 'Normal',
              growthStage: tile.item.growthStage
            } : null
          });
        }
      }
    }
    return serialized;
  }

  deserializeGrid(serializedList) {
    if (!serializedList) return;
    serializedList.forEach(t => {
      if (t.r < this.gridSize && t.c < this.gridSize) {
        const tile = this.grid[t.r][t.c];
        tile.type = t.type;
        tile.fertilizedAt = t.fertilizedAt || 0;
        tile.fertilizerEnd = t.fertilizerEnd || 0;

        if (t.item) {
          if (t.item.type === 'flower') {
            const base = getFlowerById(t.item.id);
            if (base) {
              tile.item = {
                ...base,
                type: 'flower',
                plantedAt: t.item.plantedAt,
                wateredAt: t.item.wateredAt,
                hydration: t.item.hydration,
                health: t.item.health,
                quality: t.item.quality || 'Normal',
                growthStage: t.item.growthStage || 0
              };
            }
          } else if (t.item.type === 'decor') {
            const base = getDecorationById(t.item.id);
            if (base) {
              tile.item = {
                ...base,
                type: 'decor',
                plantedAt: t.item.plantedAt
              };
            }
          }
        }
        this.updateTileVisual(t.r, t.c);
      }
    });
  }

  // --- OFFLINE PROGRESS ENGINE ---

  calculateOfflineProgress() {
    const now = Date.now();
    const elapsedMs = now - this.lastLoginTimestamp;
    if (elapsedMs < 10000) return; // ignore anything less than 10 seconds

    console.log(`Calculating offline progress for ${elapsedMs / 1000}s`);

    // Check daily streak rollovers
    const lastDate = new Date(this.lastLoginTimestamp).toDateString();
    const currentDate = new Date(now).toDateString();
    
    if (lastDate !== currentDate) {
      const diffTime = Math.abs(now - this.lastLoginTimestamp);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 1) {
        this.dailyStreak++;
        this.showNotification(`🔥 Daily Streak continued! Day ${this.dailyStreak}`);
      } else {
        this.dailyStreak = 1;
        this.showNotification(`🌸 Welcome back! Started a new streak.`);
      }
      this.giveStreakReward(this.dailyStreak);
    }

    // Progress plant growth and decay hydration
    let countFlowersGrown = 0;
    let countSunflowersGrown = 0;

    for (let r = 0; r < this.gridSize; r++) {
      for (let c = 0; c < this.gridSize; c++) {
        const tile = this.grid[r][c];
        if (tile.item && tile.item.type === 'flower') {
          const flower = tile.item;
          
          // 1. Calculate offline hydration decay
          // Apply weather average (let's assume base water decay)
          const baseLoss = flower.waterNeeds || 0.1;
          const decayRatePerHour = baseLoss * 15; // drops 15% * needs per hour
          const hoursElapsed = elapsedMs / (1000 * 3600);
          
          // Adjust if offline during rainy weather
          let rainAdjust = 0;
          if (weatherEngine.currentWeather === 'rain') rainAdjust = 25 * hoursElapsed;
          else if (weatherEngine.currentWeather === 'storm') rainAdjust = 50 * hoursElapsed;
          
          flower.hydration = Math.max(0, Math.min(100, flower.hydration - (decayRatePerHour * hoursElapsed) + rainAdjust));

          // 2. Calculate growth progress
          if (flower.growthStage < 4) {
            let growthMultiplier = 1.0;
            if (flower.hydration > 50) growthMultiplier = 1.0;
            else if (flower.hydration > 25) growthMultiplier = 0.5;
            else growthMultiplier = 0.0; // wilted plants do not grow

            // Apply fertilizer boost if active
            const compostActive = tile.fertilizerEnd > now;
            if (compostActive) growthMultiplier *= 2.0;

            const baseGrowthMs = flower.growthHours * 3600 * 1000;
            const currentAgeMs = (now - flower.plantedAt) + this.debugTimeOffset;
            const adjustedAgeMs = currentAgeMs * growthMultiplier;

            const progressRatio = Math.min(1.0, adjustedAgeMs / baseGrowthMs);
            const oldStage = flower.growthStage;
            
            if (progressRatio >= 1.0) {
              flower.growthStage = 4;
              countFlowersGrown++;
              if (flower.isSunflower) countSunflowersGrown++;
            } else if (progressRatio >= 0.75) {
              flower.growthStage = 3;
            } else if (progressRatio >= 0.50) {
              flower.growthStage = 2;
            } else if (progressRatio >= 0.25) {
              flower.growthStage = 1;
            } else {
              flower.growthStage = 0;
            }

            // Unlock in encyclopedia if bloomed offline
            if (flower.growthStage === 4 && oldStage < 4) {
              this.unlockedEncyclopedia.add(flower.id);
            }
          }

          // 3. Health decay if completely dry
          if (flower.hydration === 0) {
            const healthDecayPerHour = 4.0; // dies in 25 hours dry
            flower.health = Math.max(0, flower.health - (healthDecayPerHour * hoursElapsed));
          } else {
            flower.health = Math.min(100, flower.health + (2.0 * hoursElapsed)); // slowly heals if hydrated
          }

          this.updateTileVisual(r, c);
        }
      }
    }

    // Update stats
    this.stats.flowersGrown += countFlowersGrown;
    this.stats.sunflowersGrown += countSunflowersGrown;

    // Show Welcome Back modal
    document.getElementById('stat-days').textContent = weatherEngine.daysGardening;
    document.getElementById('stat-flowers').textContent = this.stats.flowersGrown;
    document.getElementById('stat-sunflowers').textContent = this.stats.sunflowersGrown;
    document.getElementById('stat-value').textContent = this.calculateGardenValue();
    document.getElementById('stat-completion').textContent = `${Math.floor((this.unlockedEncyclopedia.size / FLOWERS.length) * 100)}%`;
    document.getElementById('stat-streak').textContent = `${this.dailyStreak} Day${this.dailyStreak > 1 ? 's' : ''}`;
    
    document.getElementById('welcome-back-modal').style.display = 'flex';
  }

  calculateGardenValue() {
    let value = this.coins;
    for (let r = 0; r < this.gridSize; r++) {
      for (let c = 0; c < this.gridSize; c++) {
        const tile = this.grid[r][c];
        if (tile.item) {
          if (tile.item.type === 'flower' && tile.item.growthStage === 4) {
            value += tile.item.sellValue || 0;
          } else if (tile.item.type === 'decor') {
            value += tile.item.sellValue || 0;
          }
        }
      }
    }
    return value;
  }

  giveStreakReward(streak) {
    let prizeCoins = 50;
    let prizeLabel = '';

    if (streak % 30 === 0) {
      this.inventory.seeds['blue_rose'] = (this.inventory.seeds['blue_rose'] || 0) + 1;
      prizeLabel = 'Legendary Midnight Blue Rose Seed!';
    } else if (streak % 7 === 0) {
      this.inventory.seeds['ghost_orchid'] = (this.inventory.seeds['ghost_orchid'] || 0) + 1;
      prizeLabel = 'Rare Ghost Orchid Seed!';
    } else if (streak % 3 === 0) {
      this.inventory.decorations['bird_bath'] = (this.inventory.decorations['bird_bath'] || 0) + 1;
      prizeLabel = 'Stone Bird Bath Decoration!';
    } else {
      prizeCoins = streak * 50;
      this.addCoins(prizeCoins);
      prizeLabel = `${prizeCoins} Coins!`;
    }

    setTimeout(() => {
      this.showNotification(`🎁 Day ${streak} Reward: Recieved ${prizeLabel}`);
    }, 1500);
  }

  // --- WATER DECAY AND AUTOMATION Ticks ---

  decayWaterProgress() {
    const isRaining = weatherEngine.currentWeather === 'rain' || weatherEngine.currentWeather === 'storm';
    const rateMultiplier = weatherEngine.getWaterLossMultiplier();

    for (let r = 0; r < this.gridSize; r++) {
      for (let c = 0; c < this.gridSize; c++) {
        const tile = this.grid[r][c];
        
        // Sprinkler logic
        if (tile.type === 'decor' && tile.item && tile.item.id === 'fountain_stone') {
          // Fountain waters its 8 neighbors automatically every tick!
          this.waterNeighbors(r, c, 5);
        }

        if (tile.item && tile.item.type === 'flower') {
          const flower = tile.item;
          
          if (isRaining) {
            // Weather waters plants
            flower.hydration = Math.min(100, flower.hydration - (rateMultiplier * 0.1));
            flower.health = Math.min(100, flower.health + 0.1);
          } else {
            // Hydration decay
            const baseDecay = flower.waterNeeds || 0.1;
            flower.hydration = Math.max(0, flower.hydration - (baseDecay * rateMultiplier * 0.05));
          }

          // Health damage if dry
          if (flower.hydration === 0) {
            flower.health = Math.max(0, flower.health - 0.1);
          }

          // Dynamic growth updates in real time
          this.updateRealTimeGrowth(tile);
          this.updateTileVisual(r, c);
        }
      }
    }
  }

  waterNeighbors(row, col, amount) {
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        const nr = row + dr;
        const nc = col + dc;
        if (nr >= 0 && nr < this.gridSize && nc >= 0 && nc < this.gridSize) {
          const nTile = this.grid[nr][nc];
          if (nTile.item && nTile.item.type === 'flower') {
            nTile.item.hydration = Math.min(100, nTile.item.hydration + amount);
            if (nTile.type === 'soil') nTile.type = 'soil-wet';
          }
        }
      }
    }
  }

  updateRealTimeGrowth(tile) {
    const flower = tile.item;
    if (!flower || flower.growthStage >= 4) return;

    let growthMultiplier = weatherEngine.getWeatherGrowthMultiplier();
    
    // Water limits growth
    if (flower.hydration <= 0) growthMultiplier = 0.0;
    else if (flower.hydration <= 25) growthMultiplier *= 0.25;
    else if (flower.hydration <= 50) growthMultiplier *= 0.65;

    // Apply compost booster
    if (tile.fertilizerEnd > Date.now()) {
      growthMultiplier *= 2.0;
    }

    const elapsedMs = (Date.now() - flower.plantedAt) + this.debugTimeOffset;
    const baseGrowthMs = flower.growthHours * 3600 * 1000;
    const progress = Math.min(1.0, (elapsedMs * growthMultiplier) / baseGrowthMs);

    const oldStage = flower.growthStage;

    if (progress >= 1.0) {
      flower.growthStage = 4;
      this.stats.flowersGrown++;
      if (flower.isSunflower) this.stats.sunflowersGrown++;
      this.unlockedEncyclopedia.add(flower.id);
      this.showNotification(`🌸 Your ${flower.name} has Bloomed!`);
      this.checkAchievements();
      
      // Check for breeding trigger when blooming
      this.triggerBreedingAttempt(tile.row, tile.col);
    } else if (progress >= 0.75) {
      flower.growthStage = 3;
    } else if (progress >= 0.50) {
      flower.growthStage = 2;
    } else if (progress >= 0.25) {
      flower.growthStage = 1;
    }
  }

  // --- HYBRID BREEDING ATTEMPT ---

  triggerBreedingAttempt(row, col) {
    const tile = this.grid[row][col];
    if (!tile.item || tile.item.type !== 'flower' || tile.item.growthStage !== 4) return;

    const parentA = tile.item;
    
    // Look at surrounding 4 directions for another fully blooming parent
    const dirs = [[-1,0], [1,0], [0,-1], [0,1]];
    const randomDir = dirs[Math.floor(Math.random() * dirs.length)];
    const nr = row + randomDir[0];
    const nc = col + randomDir[1];

    if (nr >= 0 && nr < this.gridSize && nc >= 0 && nc < this.gridSize) {
      const neighbor = this.grid[nr][nc];
      if (neighbor.item && neighbor.item.type === 'flower' && neighbor.item.growthStage === 4) {
        const parentB = neighbor.item;
        
        // Query child formula
        const childId = getHybridChild(parentA.id, parentB.id);
        if (childId) {
          // Breeding rolled! We find an empty adjacent tile to sprout seed
          const emptySlot = this.findFreeAdjacentSlot(row, col);
          if (emptySlot) {
            const childBase = getFlowerById(childId);
            const babyTile = this.grid[emptySlot.r][emptySlot.c];
            
            // Till soil automatically
            babyTile.type = 'soil-wet';
            babyTile.item = {
              ...childBase,
              type: 'flower',
              plantedAt: Date.now(),
              wateredAt: Date.now(),
              hydration: 100,
              health: 100,
              quality: 'Normal',
              growthStage: 0
            };

            this.stats.hybridsBred++;
            this.updateTileVisual(emptySlot.r, emptySlot.c);
            this.showFloatText(emptySlot.r, emptySlot.c, `✨ Sprouted Hybrid: ${childBase.name}!`, '#b19ffb');
            this.showNotification(`🧪 Magic! Crossed ${parentA.name} + ${parentB.name} into ${childBase.name}!`);
            this.checkAchievements();
            this.saveGame();
          }
        }
      }
    }
  }

  findFreeAdjacentSlot(row, col) {
    // Check surrounding 8 slots for a completely empty grassy tile
    const slots = [];
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue;
        const nr = row + dr;
        const nc = col + dc;
        if (nr >= 0 && nr < this.gridSize && nc >= 0 && nc < this.gridSize) {
          const t = this.grid[nr][nc];
          if (t.type === 'grass' && !t.item) {
            slots.push({ r: nr, c: nc });
          }
        }
      }
    }
    if (slots.length > 0) {
      return slots[Math.floor(Math.random() * slots.length)];
    }
    return null;
  }

  onNewDay() {
    // Runs when weather rolls on midnight.
    // Daily updates like hybrid mutations in windy weather.
    if (weatherEngine.currentWeather === 'windy') {
      // Windy weather boosts cross pollination breeding checks
      for (let r = 0; r < this.gridSize; r++) {
        for (let c = 0; c < this.gridSize; c++) {
          if (Math.random() < 0.1) this.triggerBreedingAttempt(r, c);
        }
      }
    }
  }

  // --- CLOCK AND TIME INTERPOLATION ---

  updateClockHUD() {
    const clock = document.getElementById('game-clock');
    const dayCounter = document.getElementById('days-count');
    if (clock) clock.textContent = weatherEngine.getTimeString();
    if (dayCounter) dayCounter.textContent = `Day ${weatherEngine.daysGardening}`;
  }

  updateSunflowerRotations() {
    // Only query sunflower wrappers
    const sunAngle = weatherEngine.getSunAngle();
    const sunflowers = document.querySelectorAll('.sunflower-special');
    sunflowers.forEach(sf => {
      sf.style.setProperty('--sun-angle', `${sunAngle}deg`);
    });
  }

  // --- ACTIONS AND TILE CLICKS ---

  handleTileClick(row, col, e) {
    const tile = this.grid[row][col];
    
    // Play Click SFX
    audioManager.playSFXClick();

    switch (this.currentTool) {
      case 'inspect':
        this.inspectTile(row, col);
        break;

      case 'shovel':
        if (tile.item) {
          // Dig up item
          const item = tile.item;
          let refund = 0;
          if (item.type === 'decor') {
            refund = Math.floor(item.sellValue * 0.5);
            this.addCoins(refund);
            this.showFloatText(row, col, `⛏️ Dug up ${item.name} (+${refund} 🪙)`, '#e74c3c');
          } else {
            this.showFloatText(row, col, `⛏️ Dig up flower`, '#e74c3c');
          }
          tile.item = null;
          audioManager.playSFXDig();
        } else if (tile.type === 'grass') {
          // Till grass to dry soil
          tile.type = 'soil-dry';
          this.showFloatText(row, col, '⛏️ Tilled Soil', '#8c6747');
          audioManager.playSFXDig();
        } else if (tile.type === 'soil-dry' || tile.type === 'soil-wet' || tile.type === 'path') {
          // Revert soil/path back to grass
          tile.type = 'grass';
          this.showFloatText(row, col, '⛏️ Plotted Grass', '#8bbd82');
          audioManager.playSFXDig();
        }
        this.updateTileVisual(row, col);
        this.saveGame();
        break;

      case 'plant':
        if (tile.type !== 'soil-dry' && tile.type !== 'soil-wet') {
          this.showFloatText(row, col, '⚠️ Till soil first!', '#e74c3c');
          return;
        }
        if (tile.item) {
          this.showFloatText(row, col, '⚠️ Spot occupied!', '#e74c3c');
          return;
        }
        
        // Place seed
        const seedCount = this.inventory.seeds[this.activeSeed] || 0;
        if (seedCount <= 0) {
          this.showFloatText(row, col, '⚠️ Out of seeds!', '#e74c3c');
          return;
        }

        const flowerBase = getFlowerById(this.activeSeed);
        if (flowerBase) {
          tile.item = {
            ...flowerBase,
            type: 'flower',
            plantedAt: Date.now(),
            wateredAt: Date.now(),
            hydration: tile.type === 'soil-wet' ? 100 : 40,
            health: 100,
            quality: 'Normal',
            growthStage: 0
          };
          this.inventory.seeds[this.activeSeed]--;
          audioManager.playSFXPlant();
          this.showFloatText(row, col, `🌱 Planted ${flowerBase.name}`, '#58874e');
          this.updateTileVisual(row, col);
          this.updateSeedPickerUI();
          this.checkAchievements();
          this.saveGame();
        }
        break;

      case 'water':
        if (tile.item && tile.item.type === 'flower') {
          this.waterTileAction(row, col);
        } else if (tile.type === 'soil-dry') {
          tile.type = 'soil-wet';
          this.updateTileVisual(row, col);
          audioManager.playSFXWatering();
          this.showFloatText(row, col, '💧 Watered Soil', '#3498db');
          this.saveGame();
        }
        break;

      case 'decorate':
        if (tile.item) {
          this.showFloatText(row, col, '⚠️ Spot occupied!', '#e74c3c');
          return;
        }
        const decorCount = this.inventory.decorations[this.activeDecor] || 0;
        if (decorCount <= 0) {
          this.showFloatText(row, col, '⚠️ Out of decoration stock!', '#e74c3c');
          return;
        }

        const decorBase = getDecorationById(this.activeDecor);
        if (decorBase) {
          tile.item = {
            ...decorBase,
            type: 'decor',
            plantedAt: Date.now()
          };
          
          if (decorBase.category === 'Path') {
            tile.type = 'path';
          } else if (decorBase.category === 'Fence') {
            tile.type = 'fence';
          }

          this.inventory.decorations[this.activeDecor]--;
          audioManager.playSFXPlant();
          this.showFloatText(row, col, `🧱 Placed ${decorBase.name}`, '#9b59b6');
          this.updateTileVisual(row, col);
          this.updateDecorPickerUI();
          this.saveGame();
        }
        break;

      case 'fertilize':
        if (!tile.item || tile.item.type !== 'flower') {
          this.showFloatText(row, col, '⚠️ Target flowers only!', '#e74c3c');
          return;
        }
        if (tile.fertilizerEnd > Date.now()) {
          this.showFloatText(row, col, '⚠️ Already fertilized!', '#e74c3c');
          return;
        }
        
        // Fertilizer costs 15 coins to apply instantly
        if (this.coins < 15) {
          this.showFloatText(row, col, '⚠️ Needs 15 Coins!', '#e74c3c');
          return;
        }

        this.coins -= 15;
        tile.fertilizedAt = Date.now();
        tile.fertilizerEnd = Date.now() + (12 * 3600 * 1000); // 12 hours of 2x speed
        audioManager.playSFXPlant();
        this.showFloatText(row, col, '✨ Applied Compost! (2x Speed)', '#ffda79');
        this.updateHUD();
        this.updateTileVisual(row, col);
        this.saveGame();
        break;
    }
  }

  waterTileAction(row, col) {
    const applyWater = (r, c) => {
      if (r >= 0 && r < this.gridSize && c >= 0 && c < this.gridSize) {
        const tile = this.grid[r][c];
        if (tile.item && tile.item.type === 'flower') {
          const oldHydration = tile.item.hydration;
          
          // Boost quality chance on watering can tier
          let qualBoost = '';
          if (this.wateringCanTier === 2 && Math.random() < 0.1 && tile.item.quality === 'Normal') {
            tile.item.quality = 'Bronze';
            qualBoost = ' ✨';
          }

          tile.item.hydration = Math.min(100, tile.item.hydration + 50);
          if (tile.type === 'soil-dry') tile.type = 'soil-wet';
          this.updateTileVisual(r, c);
          
          this.stats.waterApplied++;
          this.checkAchievements();
          return true;
        } else if (tile.type === 'soil-dry') {
          tile.type = 'soil-wet';
          this.updateTileVisual(r, c);
          return true;
        }
        return false;
      }
      return false;
    };

    // Watering can actions based on tier
    if (this.wateringCanTier === 3) {
      // Hose (3x3 grid)
      let wateredAny = false;
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (applyWater(row + dr, col + dc)) wateredAny = true;
        }
      }
      if (wateredAny) {
        audioManager.playSFXWatering();
        this.showFloatText(row, col, '💧 Hose Spray (3x3)', '#3498db');
      }
    } else {
      // Single tile
      if (applyWater(row, col)) {
        audioManager.playSFXWatering();
        const canName = this.wateringCanTier === 2 ? 'Advanced Can' : 'Watering Can';
        this.showFloatText(row, col, `💧 ${canName}`, '#3498db');
      }
    }
    this.saveGame();
  }

  inspectTile(row, col) {
    const tile = this.grid[row][col];
    if (!tile.item) {
      this.showFloatText(row, col, `Plot: ${tile.type.toUpperCase()}`, '#8bbd82');
      return;
    }

    if (tile.item.type === 'flower') {
      // 1. Center camera on the clicked flower tile smoothly and zoom in
      this.zoomToTile(row, col);

      // 2. Open the 3D Close-Up Inspector Modal
      this.open3DInspector(row, col);
    } else if (tile.item.type === 'decor') {
      this.showFloatText(row, col, `Decor: ${tile.item.name}\n${tile.item.desc}`, '#9b59b6');
    }
  }

  zoomToTile(row, col) {
    const tileEl = document.querySelector(`[data-row='${row}'][data-col='${col}']`);
    if (!tileEl) return;

    const map = document.getElementById('garden-map');
    
    // Smooth cinematic zoom transition duration
    map.style.transition = 'transform 0.8s cubic-bezier(0.25, 1, 0.3, 1)';

    // Get screenspace viewport center
    const view = document.getElementById('map-viewport').getBoundingClientRect();
    const viewCenterX = view.left + view.width / 2;
    const viewCenterY = view.top + view.height / 2;

    // Get screenspace tile center
    const tileRect = tileEl.getBoundingClientRect();
    const tileCenterX = tileRect.left + tileRect.width / 2;
    const tileCenterY = tileRect.top + tileRect.height / 2;

    // Calculate translation difference in screenspace
    const diffX = viewCenterX - tileCenterX;
    const diffY = viewCenterY - tileCenterY;

    // Shift pan settings
    this.panX += diffX;
    this.panY += diffY;
    this.zoomScale = 1.45; // zoom in close

    // Reapply transform
    map.style.transform = `translate(${this.panX}px, ${this.panY}px) scale(${this.zoomScale}) rotateX(55deg) rotateZ(-45deg)`;

    // Restore original drag-pan quick transition after zoom completes
    setTimeout(() => {
      map.style.transition = 'transform 0.15s cubic-bezier(0.25, 0.8, 0.25, 1)';
    }, 800);
  }

  open3DInspector(row, col) {
    const tile = this.grid[row][col];
    const flower = tile.item;
    if (!flower) return;

    const modal = document.getElementById('flower-inspector-modal');
    modal.style.display = 'flex';

    // Set text descriptions and names
    document.getElementById('inspect-title').textContent = `🌸 ${flower.name} Close-Up 🌸`;
    document.getElementById('inspect-desc').textContent = flower.desc || '';

    // Determine correct emoji representation based on growth stage
    let displayEmoji = flower.emoji;
    let stageLabel = 'Blooming';

    if (flower.growthStage === 0) {
      displayEmoji = '🟤';
      stageLabel = 'Seed';
    } else if (flower.growthStage === 1) {
      displayEmoji = '🌱';
      stageLabel = 'Sprout';
    } else if (flower.growthStage === 2) {
      displayEmoji = '🌿';
      stageLabel = 'Young Plant';
    } else if (flower.growthStage === 3) {
      displayEmoji = '🪴';
      stageLabel = 'Budding';
    }

    // Assign to crossed billboards in the spinning 3D container
    document.getElementById('inspect-emoji-a').textContent = displayEmoji;
    document.getElementById('inspect-emoji-b').textContent = displayEmoji;
    document.getElementById('inspect-emoji-c').textContent = displayEmoji;

    // Update status labels
    const updateStats = () => {
      document.getElementById('inspect-stat-hydration').textContent = `${Math.floor(flower.hydration)}%`;
      document.getElementById('inspect-stat-health').textContent = `${Math.floor(flower.health)}%`;
      document.getElementById('inspect-stat-quality').textContent = flower.quality || 'Normal';
      document.getElementById('inspect-stat-age').textContent = stageLabel;

      // Show/Hide Harvest button
      const harvestBtn = document.getElementById('btn-inspect-harvest');
      if (flower.growthStage === 4) {
        harvestBtn.style.display = 'inline-block';
      } else {
        harvestBtn.style.display = 'none';
      }
    };
    updateStats();

    // Wire Water button click listener
    const waterBtn = document.getElementById('btn-inspect-water');
    const newWaterBtn = waterBtn.cloneNode(true);
    waterBtn.parentNode.replaceChild(newWaterBtn, waterBtn);
    newWaterBtn.addEventListener('click', () => {
      this.waterTileAction(row, col);
      updateStats();
      this.showNotification(`💧 Watered ${flower.name}!`);
    });

    // Wire Harvest button click listener
    const harvestBtn = document.getElementById('btn-inspect-harvest');
    const newHarvestBtn = harvestBtn.cloneNode(true);
    harvestBtn.parentNode.replaceChild(newHarvestBtn, harvestBtn);
    newHarvestBtn.addEventListener('click', () => {
      let value = flower.sellValue || 10;
      if (flower.quality === 'Gold') value = Math.floor(value * 2.0);
      else if (flower.quality === 'Silver') value = Math.floor(value * 1.5);
      else if (flower.quality === 'Bronze') value = Math.floor(value * 1.25);

      this.harvestFlower(row, col, value);
      modal.style.display = 'none'; // close modal since it is harvested
      this.saveGame();
    });

    // Wire Close button click listener
    const closeBtn = document.getElementById('btn-inspect-close');
    const newCloseBtn = closeBtn.cloneNode(true);
    closeBtn.parentNode.replaceChild(newCloseBtn, closeBtn);
    newCloseBtn.addEventListener('click', () => {
      modal.style.display = 'none';
      audioManager.playSFXClick();
      this.saveGame();
    });
  }

  harvestFlower(row, col, value) {
    const tile = this.grid[row][col];
    const flower = tile.item;
    
    // Harvest animation & coins
    this.addCoins(value);
    this.showFloatText(row, col, `✨ Harvested! +${value} 🪙`, '#ffd700');
    audioManager.playSFXAchievement();
    
    // Check if harvesting gives seeds back (Sunflowers drop sunflower seeds!)
    if (flower.isSunflower) {
      const seedsGained = 1 + Math.floor(Math.random() * 2);
      this.inventory.seeds['sunflower_common'] = (this.inventory.seeds['sunflower_common'] || 0) + seedsGained;
      this.showNotification(`🌻 Harvested Sunflowers! Recieved ${seedsGained} Sunflower seeds!`);
    }

    tile.item = null;
    this.updateTileVisual(row, col);
    this.saveGame();
  }

  handleTileHover(row, col, enter) {
    const tileEl = document.querySelector(`[data-row='${row}'][data-col='${col}']`);
    if (!tileEl) return;
    
    if (enter) {
      tileEl.classList.add('tile-hover');
    } else {
      tileEl.classList.remove('tile-hover');
    }
  }

  updateTileVisual(row, col) {
    const tile = this.grid[row][col];
    const tileEl = document.querySelector(`[data-row='${row}'][data-col='${col}']`);
    if (!tileEl) return;

    // Reset classes
    tileEl.className = 'garden-tile';
    
    // Apply background classes
    if (tile.type === 'grass') tileEl.classList.add('tile-grass');
    else if (tile.type === 'soil-dry') tileEl.classList.add('tile-soil-dry');
    else if (tile.type === 'soil-wet') tileEl.classList.add('tile-soil-wet');
    else if (tile.type === 'path') tileEl.classList.add('tile-path');
    else if (tile.type === 'fence') tileEl.classList.add('tile-fence');

    // Wipe previous inner nodes
    tileEl.innerHTML = '';

    if (tile.item) {
      if (tile.item.type === 'flower') {
        const flower = tile.item;
        
        const wrapper = document.createElement('div');
        wrapper.className = `flower-wrapper`;
        
        // Sunflower class
        if (flower.isSunflower) {
          wrapper.classList.add('sunflower-special');
        }

        // Growth stage class
        let stageClass = 'stage-seed';
        if (flower.growthStage === 1) stageClass = 'stage-sprout';
        else if (flower.growthStage === 2) stageClass = 'stage-young';
        else if (flower.growthStage === 3) stageClass = 'stage-budding';
        else if (flower.growthStage === 4) stageClass = 'stage-blooming';
        wrapper.classList.add(stageClass);

        const emojiEl = document.createElement('span');
        emojiEl.className = 'flower-emoji';
        
        // Growth stage emojis
        if (flower.growthStage === 0) emojiEl.textContent = '🟤'; // Seed
        else if (flower.growthStage === 1) emojiEl.textContent = '🌱'; // Sprout
        else if (flower.growthStage === 2) emojiEl.textContent = '🌿'; // Young plant
        else if (flower.growthStage === 3) emojiEl.textContent = '🪴'; // Budding/Potted
        else emojiEl.textContent = flower.emoji; // Blooming

        wrapper.appendChild(emojiEl);
        tileEl.appendChild(wrapper);

        // Quality badge
        if (flower.growthStage === 4 && flower.quality && flower.quality !== 'Normal') {
          const badge = document.createElement('div');
          badge.className = `quality-badge ${flower.quality}`;
          badge.textContent = flower.quality[0];
          tileEl.appendChild(badge);
        }

        // Hydration Bar
        const barBg = document.createElement('div');
        barBg.className = 'water-bar-bg';
        const barFill = document.createElement('div');
        barFill.className = 'water-bar-fill';
        if (flower.hydration <= 25) barFill.classList.add('wilting');
        barFill.style.width = `${flower.hydration}%`;
        barBg.appendChild(barFill);
        
        const hud = document.createElement('div');
        hud.className = 'tile-hud';
        hud.appendChild(barBg);
        tileEl.appendChild(hud);

        // Compost visual effect (glowing sparkles around plant)
        if (tile.fertilizerEnd > Date.now()) {
          const compostGlow = document.createElement('div');
          compostGlow.className = 'quality-badge';
          compostGlow.style.background = 'transparent';
          compostGlow.style.top = 'auto';
          compostGlow.style.bottom = '10px';
          compostGlow.textContent = '✨';
          tileEl.appendChild(compostGlow);
        }

      } else if (tile.item.type === 'decor') {
        const decor = tile.item;
        const decorEl = document.createElement('span');
        decorEl.className = 'decor-emoji';
        decorEl.style.fontSize = '34px';
        decorEl.textContent = decor.emoji;
        
        // Night glowing lanterns
        const phase = weatherEngine.getCurrentPhase();
        if (decor.lightRadius > 0 && phase === 'night') {
          decorEl.style.filter = `drop-shadow(0 0 10px ${decor.glowColor || 'yellow'})`;
        }

        tileEl.appendChild(decorEl);
      }
    }
  }

  // --- COIN MANAGER AND UI UPDATES ---

  addCoins(amount) {
    this.coins += amount;
    this.stats.totalCoinsEarned += amount;
    this.updateHUD();
    this.checkAchievements();
  }

  updateHUD() {
    const coinCount = document.getElementById('coin-count');
    if (coinCount) coinCount.textContent = this.coins;
  }

  // --- FLOATING FEEDBACK TEXT ---

  showFloatText(row, col, text, color = '#ffffff') {
    const tileEl = document.querySelector(`[data-row='${row}'][data-col='${col}']`);
    if (!tileEl) return;

    const floatEl = document.createElement('div');
    floatEl.className = 'float-text';
    floatEl.style.color = color;
    
    // Support multiline details text
    floatEl.innerHTML = text.replace(/\n/g, '<br>');

    // Position float text centered on the tile
    const rect = tileEl.getBoundingClientRect();
    const view = document.getElementById('map-viewport').getBoundingClientRect();
    
    const posX = rect.left - view.left + rect.width / 2;
    const posY = rect.top - view.top;

    floatEl.style.left = `${posX}px`;
    floatEl.style.top = `${posY}px`;

    document.getElementById('map-viewport').appendChild(floatEl);

    setTimeout(() => {
      floatEl.remove();
    }, 1200);
  }

  showNotification(text) {
    const container = document.getElementById('notif-container');
    if (!container) return;

    const notif = document.createElement('div');
    notif.className = 'notification';
    notif.innerHTML = `🔔 <span>${text}</span>`;
    
    container.appendChild(notif);
    
    setTimeout(() => {
      notif.remove();
    }, 3500);
  }

  // --- PAN AND ZOOM CAMERA INTERACTION ---

  setupPanAndZoom() {
    const viewport = document.getElementById('map-viewport');
    const map = document.getElementById('garden-map');
    
    // Zoom limits
    const minZoom = 0.5;
    const maxZoom = 1.6;

    const applyTransform = () => {
      map.style.transform = `translate(${this.panX}px, ${this.panY}px) scale(${this.zoomScale}) rotateX(55deg) rotateZ(-45deg)`;
    };

    // Zooming handlers
    viewport.addEventListener('wheel', (e) => {
      e.preventDefault();
      const zoomFactor = 0.08;
      if (e.deltaY < 0) {
        this.zoomScale = Math.min(maxZoom, this.zoomScale + zoomFactor);
      } else {
        this.zoomScale = Math.max(minZoom, this.zoomScale - zoomFactor);
      }
      applyTransform();
    }, { passive: false });

    // Drag / Pan handlers
    viewport.addEventListener('mousedown', (e) => {
      if (e.target.closest('.hud-panel') || e.target.closest('#side-nav') || e.target.closest('#map-controls') || e.target.closest('#debug-panel')) return;
      this.isDragging = true;
      this.startX = e.clientX - this.panX;
      this.startY = e.clientY - this.panY;
    });

    window.addEventListener('mousemove', (e) => {
      if (!this.isDragging) return;
      this.panX = e.clientX - this.startX;
      this.panY = e.clientY - this.startY;
      applyTransform();
    });

    window.addEventListener('mouseup', () => {
      this.isDragging = false;
    });

    // Touch Support for Mobile Drag/Zoom
    let tpCache = [];
    viewport.addEventListener('touchstart', (e) => {
      if (e.target.closest('.hud-panel') || e.target.closest('#side-nav') || e.target.closest('#map-controls')) return;
      if (e.touches.length === 1) {
        this.isDragging = true;
        this.startX = e.touches[0].clientX - this.panX;
        this.startY = e.touches[0].clientY - this.panY;
      } else if (e.touches.length === 2) {
        tpCache = [e.touches[0], e.touches[1]];
      }
    });

    viewport.addEventListener('touchmove', (e) => {
      if (e.touches.length === 1 && this.isDragging) {
        this.panX = e.touches[0].clientX - this.startX;
        this.panY = e.touches[0].clientY - this.startY;
        applyTransform();
      } else if (e.touches.length === 2 && tpCache.length === 2) {
        // Handle Pinch to Zoom
        const distStart = Math.hypot(tpCache[0].clientX - tpCache[1].clientX, tpCache[0].clientY - tpCache[1].clientY);
        const distEnd = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
        
        const delta = (distEnd - distStart) * 0.005;
        this.zoomScale = Math.max(minZoom, Math.min(maxZoom, this.zoomScale + delta));
        applyTransform();
      }
    });

    viewport.addEventListener('touchend', () => {
      this.isDragging = false;
      tpCache = [];
    });

    // Button controls click bindings
    document.getElementById('btn-zoom-in').addEventListener('click', () => {
      this.zoomScale = Math.min(maxZoom, this.zoomScale + 0.15);
      applyTransform();
    });
    document.getElementById('btn-zoom-out').addEventListener('click', () => {
      this.zoomScale = Math.max(minZoom, this.zoomScale - 0.15);
      applyTransform();
    });
    document.getElementById('btn-recenter').addEventListener('click', () => {
      this.zoomScale = 1.0;
      this.panX = 0;
      this.panY = 0;
      applyTransform();
    });
  }

  getTileSize() {
    return parseInt(getComputedStyle(document.documentElement).getPropertyValue('--tile-size')) || 76;
  }

  // --- TAB PANELS & HUD DRAWERS POPULATION ---

  populateShop() {
    const shopContainer = document.getElementById('shop-items-container');
    const tabs = document.querySelectorAll('.shop-tab-btn');
    
    let currentTab = 'seeds';

    const renderShop = () => {
      shopContainer.innerHTML = '';
      
      if (currentTab === 'seeds') {
        // List seeds
        FLOWERS.filter(f => !f.isHybrid).forEach(f => {
          const card = document.createElement('div');
          card.className = 'shop-card';
          card.innerHTML = `
            <div class="shop-card-emoji">${f.emoji}</div>
            <div class="shop-card-info">
              <div class="shop-card-name">${f.name} Seeds</div>
              <div class="shop-card-desc">Growth: ${f.growthHours}h. Rarity: ${f.rarity}</div>
              <div class="shop-card-cost">🪙 ${f.buyPrice}</div>
            </div>
            <button class="shop-buy-btn" data-id="${f.id}">Buy</button>
          `;
          
          card.querySelector('.shop-buy-btn').addEventListener('click', () => this.buySeed(f));
          shopContainer.appendChild(card);
        });
      } else if (currentTab === 'decorations') {
        // List decorations
        DECORATIONS.forEach(d => {
          const card = document.createElement('div');
          card.className = 'shop-card';
          card.innerHTML = `
            <div class="shop-card-emoji">${d.emoji}</div>
            <div class="shop-card-info">
              <div class="shop-card-name">${d.name}</div>
              <div class="shop-card-desc">${d.desc}</div>
              <div class="shop-card-cost">🪙 ${d.buyPrice}</div>
            </div>
            <button class="shop-buy-btn" data-id="${d.id}">Buy</button>
          `;

          card.querySelector('.shop-buy-btn').addEventListener('click', () => this.buyDecor(d));
          shopContainer.appendChild(card);
        });
      } else if (currentTab === 'upgrades') {
        // List upgrades
        const upgrades = [
          { id: 'can_adv', name: 'Advanced Watering Can', emoji: '💧', desc: 'Adds 10% chance to boost flower quality tier on watering.', cost: 250, bought: this.wateringCanTier >= 2 },
          { id: 'can_hose', name: 'Garden Hose', emoji: '🚿', desc: 'Waters 3x3 grids of plants simultaneously.', cost: 600, bought: this.wateringCanTier >= 3 },
          { id: 'can_sprinkler', name: 'Fountain Automatic Waterer', emoji: '⛲', desc: 'Unlock Tiered Stone Fountains to water adjacent flowers automatically.', cost: 1200, bought: this.unlockedSprinklers }
        ];

        upgrades.forEach(u => {
          const card = document.createElement('div');
          card.className = 'shop-card';
          card.innerHTML = `
            <div class="shop-card-emoji">${u.emoji}</div>
            <div class="shop-card-info">
              <div class="shop-card-name">${u.name}</div>
              <div class="shop-card-desc">${u.desc}</div>
              <div class="shop-card-cost">${u.bought ? 'Purchased' : '🪙 ' + u.cost}</div>
            </div>
            <button class="shop-buy-btn" ${u.bought ? 'disabled style="background:#bdc3c7;"' : ''}>${u.bought ? 'Owned' : 'Buy'}</button>
          `;

          if (!u.bought) {
            card.querySelector('.shop-buy-btn').addEventListener('click', () => this.buyUpgrade(u));
          }
          shopContainer.appendChild(card);
        });
      }
    };

    tabs.forEach(t => {
      t.addEventListener('click', (e) => {
        tabs.forEach(btn => btn.classList.remove('active'));
        e.target.classList.add('active');
        currentTab = e.target.dataset.tab;
        renderShop();
      });
    });

    renderShop();
  }

  buySeed(flower) {
    if (this.coins < flower.buyPrice) {
      this.showNotification('⚠️ Not enough coins for seeds!');
      return;
    }
    this.coins -= flower.buyPrice;
    this.inventory.seeds[flower.id] = (this.inventory.seeds[flower.id] || 0) + 1;
    this.showNotification(`🛒 Bought 1x ${flower.name} seed.`);
    this.updateHUD();
    this.updateSeedPickerUI();
    this.saveGame();
    audioManager.playSFXClick();
  }

  buyDecor(decor) {
    if (this.coins < decor.buyPrice) {
      this.showNotification('⚠️ Not enough coins for decorations!');
      return;
    }
    this.coins -= decor.buyPrice;
    this.inventory.decorations[decor.id] = (this.inventory.decorations[decor.id] || 0) + 1;
    this.showNotification(`🛒 Bought 1x ${decor.name}.`);
    this.updateHUD();
    this.updateDecorPickerUI();
    this.saveGame();
    audioManager.playSFXClick();
  }

  buyUpgrade(up) {
    if (this.coins < up.cost) {
      this.showNotification('⚠️ Not enough coins for this upgrade!');
      return;
    }

    this.coins -= up.cost;
    if (up.id === 'can_adv') this.wateringCanTier = 2;
    else if (up.id === 'can_hose') this.wateringCanTier = 3;
    else if (up.id === 'can_sprinkler') this.unlockedSprinklers = true;

    this.showNotification(`🛒 Purchased Upgrade: ${up.name}`);
    this.populateShop(); // refresh owned status
    this.updateHUD();
    this.saveGame();
    audioManager.playSFXAchievement();
  }

  populateEncyclopedia() {
    const container = document.getElementById('encyclopedia-items-grid');
    container.innerHTML = '';

    // Show unlocked percentage
    const totalCount = FLOWERS.length;
    const unlockedCount = this.unlockedEncyclopedia.size;
    const ratio = Math.floor((unlockedCount / totalCount) * 100);
    
    document.getElementById('encyclopedia-percent').textContent = `${ratio}%`;
    document.getElementById('encyclopedia-progress').style.width = `${ratio}%`;

    FLOWERS.forEach(f => {
      const isUnlocked = this.unlockedEncyclopedia.has(f.id);
      const card = document.createElement('div');
      card.className = `encyclopedia-card ${isUnlocked ? '' : 'locked'}`;
      card.innerHTML = `
        <div class="ency-emoji">${isUnlocked ? f.emoji : '❓'}</div>
        <div class="ency-name">${isUnlocked ? f.name : 'Unknown'}</div>
      `;

      if (isUnlocked) {
        card.addEventListener('click', () => this.showEncyclopediaDetail(f));
      }
      container.appendChild(card);
    });
  }

  showEncyclopediaDetail(f) {
    const overlay = document.getElementById('encyclopedia-detail');
    overlay.style.display = 'flex';

    document.getElementById('ency-detail-emoji').textContent = f.emoji;
    document.getElementById('ency-detail-name').textContent = f.name;
    document.getElementById('ency-detail-desc').textContent = f.desc;
    document.getElementById('ency-detail-growth').textContent = `${f.growthHours} Hours`;
    
    let waterLvl = 'Moderate';
    if (f.waterNeeds < 0.1) waterLvl = 'Low';
    else if (f.waterNeeds > 0.18) waterLvl = 'High';
    document.getElementById('ency-detail-water').textContent = waterLvl;
    
    document.getElementById('ency-detail-sell').textContent = `${f.sellValue} coins`;
    document.getElementById('ency-detail-type').textContent = f.isHybrid ? 'Hybrid Breed' : 'Standard Flower';

    // Set rarity label class styling
    const rarityLabel = document.getElementById('ency-detail-rarity');
    rarityLabel.textContent = f.rarity;
    rarityLabel.className = `detail-rarity ${f.rarity}`;
  }

  populateAchievements() {
    const list = document.getElementById('achievements-list-container');
    list.innerHTML = '';

    const ACHIEVEMENTS_LIST = [
      { id: 'first_flower', title: 'First Flower Bloom', desc: 'Grow and bloom your very first flower!', reward: 50, check: () => this.stats.flowersGrown >= 1 },
      { id: 'ten_flowers', title: 'Garden Enthusiast', desc: 'Grow and bloom 10 flowers.', reward: 150, check: () => this.stats.flowersGrown >= 10 },
      { id: 'hundred_flowers', title: 'Master Florist', desc: 'Grow and bloom 100 flowers.', reward: 500, check: () => this.stats.flowersGrown >= 100 },
      { id: 'hybrid_sprout', title: 'Genetic Botanist', desc: 'Breed your first hybrid flower!', reward: 200, check: () => this.stats.hybridsBred >= 1 },
      { id: 'sunflower_field', title: 'Nikku\'s Field', desc: 'Have 10 blooming sunflowers planted on grid simultaneously.', reward: 300, check: () => this.countSunflowersOnGrid() >= 10 },
      { id: 'gold_flower', title: 'Flawless Bloom', desc: 'Harvest a flower of Gold Quality.', reward: 250, check: () => this.hasGoldQualityOnGrid() }
    ];

    ACHIEVEMENTS_LIST.forEach(ac => {
      const isDone = this.unlockedAchievements.has(ac.id);
      const card = document.createElement('div');
      card.className = 'shop-card';
      card.style.background = isDone ? 'rgba(193, 240, 193, 0.2)' : 'rgba(255,255,255,0.7)';
      card.innerHTML = `
        <div class="shop-card-emoji">${isDone ? '🏆' : '🔒'}</div>
        <div class="shop-card-info">
          <div class="shop-card-name" style="${isDone ? 'text-decoration:line-through;color:#555;' : ''}">${ac.title}</div>
          <div class="shop-card-desc">${ac.desc}</div>
          <div class="shop-card-cost" style="color:${isDone ? '#27ae60' : '#e67e22'}">${isDone ? 'Unlocked!' : 'Reward: 🪙 ' + ac.reward}</div>
        </div>
      `;
      list.appendChild(card);
    });
  }

  countSunflowersOnGrid() {
    let count = 0;
    for (let r = 0; r < this.gridSize; r++) {
      for (let c = 0; c < this.gridSize; c++) {
        const tile = this.grid[r][c];
        if (tile.item && tile.item.type === 'flower' && tile.item.isSunflower && tile.item.growthStage === 4) {
          count++;
        }
      }
    }
    return count;
  }

  hasGoldQualityOnGrid() {
    // Actually we can check when a quality changes, but we check here
    for (let r = 0; r < this.gridSize; r++) {
      for (let c = 0; c < this.gridSize; c++) {
        const tile = this.grid[r][c];
        if (tile.item && tile.item.type === 'flower' && tile.item.quality === 'Gold') {
          return true;
        }
      }
    }
    return false;
  }

  checkAchievements() {
    const ACHIEVEMENTS_LIST = [
      { id: 'first_flower', title: 'First Flower Bloom', desc: 'Grow and bloom your very first flower!', reward: 50, check: () => this.stats.flowersGrown >= 1 },
      { id: 'ten_flowers', title: 'Garden Enthusiast', desc: 'Grow and bloom 10 flowers.', reward: 150, check: () => this.stats.flowersGrown >= 10 },
      { id: 'hundred_flowers', title: 'Master Florist', desc: 'Grow and bloom 100 flowers.', reward: 500, check: () => this.stats.flowersGrown >= 100 },
      { id: 'hybrid_sprout', title: 'Genetic Botanist', desc: 'Breed your first hybrid flower!', reward: 200, check: () => this.stats.hybridsBred >= 1 },
      { id: 'sunflower_field', title: 'Nikku\'s Field', desc: 'Have 10 blooming sunflowers planted on grid simultaneously.', reward: 300, check: () => this.countSunflowersOnGrid() >= 10 },
      { id: 'gold_flower', title: 'Flawless Bloom', desc: 'Harvest a flower of Gold Quality.', reward: 250, check: () => this.hasGoldQualityOnGrid() }
    ];

    ACHIEVEMENTS_LIST.forEach(ac => {
      if (!this.unlockedAchievements.has(ac.id) && ac.check()) {
        this.unlockedAchievements.add(ac.id);
        this.addCoins(ac.reward);
        this.showNotification(`🏆 Achievement Unlocked: ${ac.title}! Recieved +${ac.reward} 🪙`);
        audioManager.playSFXAchievement();
      }
    });

    this.populateAchievements();
  }

  // --- FLOATING SEED PICKER UPDATES ---

  updateSeedPickerUI() {
    const container = document.getElementById('seed-picker-list');
    container.innerHTML = '';

    let hasSeeds = false;
    Object.keys(this.inventory.seeds).forEach(seedId => {
      const count = this.inventory.seeds[seedId];
      if (count > 0) {
        hasSeeds = true;
        const fl = getFlowerById(seedId);
        if (fl) {
          const item = document.createElement('div');
          item.className = `seed-picker-item ${this.activeSeed === seedId ? 'active' : ''}`;
          item.innerHTML = `
            <div class="seed-item-emoji">${fl.emoji}</div>
            <div style="font-size:8px;font-weight:bold;text-align:center;margin-top:2px;">${fl.name}</div>
            <div class="seed-item-count">${count}</div>
          `;
          
          item.addEventListener('click', () => {
            this.activeSeed = seedId;
            this.updateSeedPickerUI();
            this.showNotification(`Seed selected: ${fl.name}`);
            document.getElementById('seed-picker').style.display = 'none';
          });

          container.appendChild(item);
        }
      }
    });

    if (!hasSeeds) {
      container.innerHTML = '<div style="font-size:10px;grid-column: span 4;text-align:center;color:#999;padding:10px;">No seeds left! Buy seeds from the shop.</div>';
    }
  }

  // --- FLOATING DECORATION PICKER UPDATES ---

  updateDecorPickerUI() {
    const container = document.getElementById('decor-picker-list');
    container.innerHTML = '';

    let hasDecor = false;
    Object.keys(this.inventory.decorations).forEach(decorId => {
      const count = this.inventory.decorations[decorId];
      if (count > 0) {
        hasDecor = true;
        const dc = getDecorationById(decorId);
        if (dc) {
          const item = document.createElement('div');
          item.className = `decor-picker-item ${this.activeDecor === decorId ? 'active' : ''}`;
          item.innerHTML = `
            <div class="seed-item-emoji">${dc.emoji}</div>
            <div style="font-size:8px;font-weight:bold;text-align:center;margin-top:2px;">${dc.name}</div>
            <div class="seed-item-count">${count}</div>
          `;
          
          item.addEventListener('click', () => {
            this.activeDecor = decorId;
            this.updateDecorPickerUI();
            this.showNotification(`Decor selected: ${dc.name}`);
            document.getElementById('decor-picker').style.display = 'none';
          });

          container.appendChild(item);
        }
      }
    });

    if (!hasDecor) {
      container.innerHTML = '<div style="font-size:10px;grid-column: span 4;text-align:center;color:#999;padding:10px;">Inventory empty! Purchase decorations in shop.</div>';
    }
  }

  // --- REGISTER INTERACTION EVENT LISTENERS ---

  setupEventListeners() {
    // Sliding panel buttons
    const panels = {
      shop: document.getElementById('panel-shop'),
      encyclopedia: document.getElementById('panel-encyclopedia'),
      achievements: document.getElementById('panel-achievements')
    };

    const closeAllPanels = () => {
      Object.values(panels).forEach(p => p.classList.remove('panel-open'));
      document.getElementById('encyclopedia-detail').style.display = 'none';
    };

    document.getElementById('btn-shop').addEventListener('click', () => {
      closeAllPanels();
      panels.shop.classList.add('panel-open');
      this.populateShop();
      audioManager.playSFXClick();
    });

    document.getElementById('btn-encyclopedia').addEventListener('click', () => {
      closeAllPanels();
      panels.encyclopedia.classList.add('panel-open');
      this.populateEncyclopedia();
      audioManager.playSFXClick();
    });

    document.getElementById('btn-achievements').addEventListener('click', () => {
      closeAllPanels();
      panels.achievements.classList.add('panel-open');
      this.populateAchievements();
      audioManager.playSFXClick();
    });

    // Close buttons on panels
    document.querySelectorAll('.close-panel-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        closeAllPanels();
        audioManager.playSFXClick();
      });
    });

    document.getElementById('btn-ency-detail-back').addEventListener('click', () => {
      document.getElementById('encyclopedia-detail').style.display = 'none';
      audioManager.playSFXClick();
    });

    // Tool Belt Button selector
    const toolButtons = document.querySelectorAll('.tool-button');
    toolButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        toolButtons.forEach(b => b.classList.remove('active'));
        const tool = btn.dataset.tool;
        btn.classList.add('active');
        this.currentTool = tool;
        audioManager.playSFXClick();

        // Close details drawers
        document.getElementById('seed-picker').style.display = 'none';
        document.getElementById('decor-picker').style.display = 'none';

        if (tool === 'plant') {
          this.updateSeedPickerUI();
          document.getElementById('seed-picker').style.display = 'block';
        } else if (tool === 'decorate') {
          this.updateDecorPickerUI();
          document.getElementById('decor-picker').style.display = 'block';
        }
      });
    });

    // Mute sound toggle button
    const soundBtn = document.getElementById('btn-sound');
    soundBtn.addEventListener('click', () => {
      const active = audioManager.toggleMusic();
      audioManager.toggleAmbient(active);
      soundBtn.textContent = active ? '🔊' : '🔇';
      soundBtn.title = active ? 'Mute Sound' : 'Enable Sound';
      
      if (active) {
        this.showNotification('🔊 Atmospheric synthesis enabled!');
      } else {
        this.showNotification('🔇 Atmospheric sound muted.');
      }
    });

    // START GAME / RESUME GATES
    document.getElementById('btn-start-game').addEventListener('click', () => {
      document.getElementById('first-launch-modal').style.display = 'none';
      
      // Auto enable sound on start
      audioManager.init();
      audioManager.toggleMusic(true);
      audioManager.toggleAmbient(true);
      document.getElementById('btn-sound').textContent = '🔊';
      
      // Spawn creatures
      natureSystem.init(document.getElementById('particle-overlay'));
      this.saveGame();
    });

    document.getElementById('btn-resume-game').addEventListener('click', () => {
      document.getElementById('welcome-back-modal').style.display = 'none';
      
      // Auto enable sound on start
      audioManager.init();
      audioManager.toggleMusic(true);
      audioManager.toggleAmbient(true);
      document.getElementById('btn-sound').textContent = '🔊';

      // Spawn creatures
      natureSystem.init(document.getElementById('particle-overlay'));
      this.saveGame();
    });

    // --- DEBUG FAST FORWARD AND ACTIONS ---
    
    document.getElementById('btn-dbg-time').addEventListener('click', () => {
      // Advance growth offset by 6 hours (6 * 3600 * 1000 milliseconds)
      const offsetMs = 6 * 3600 * 1000;
      this.debugTimeOffset += offsetMs;
      
      // Advance clock day time as well
      weatherEngine.gameTime = (weatherEngine.gameTime + (6 * 60)) % 1440;
      this.updateClockHUD();

      // Rerun growth checks on all plants immediately
      for (let r = 0; r < this.gridSize; r++) {
        for (let c = 0; c < this.gridSize; c++) {
          const tile = this.grid[r][c];
          if (tile.item && tile.item.type === 'flower') {
            this.updateRealTimeGrowth(tile);
            this.updateTileVisual(r, c);
          }
        }
      }
      this.showNotification('⏩ Advanced garden time by 6 Hours!');
      audioManager.playSFXAchievement();
      this.saveGame();
    });

    document.getElementById('btn-dbg-water').addEventListener('click', () => {
      // Refill all plants water levels to full
      for (let r = 0; r < this.gridSize; r++) {
        for (let c = 0; c < this.gridSize; c++) {
          const tile = this.grid[r][c];
          if (tile.item && tile.item.type === 'flower') {
            tile.item.hydration = 100;
            tile.item.health = 100;
            this.updateTileVisual(r, c);
          } else if (tile.type === 'soil-dry') {
            tile.type = 'soil-wet';
            this.updateTileVisual(r, c);
          }
        }
      }
      this.showNotification('💦 All plants watered completely!');
      audioManager.playSFXWatering();
      this.saveGame();
    });

    document.getElementById('btn-dbg-coins').addEventListener('click', () => {
      this.addCoins(1000);
      this.showNotification('🪙 Added 1000 debug coins.');
      audioManager.playSFXAchievement();
      this.saveGame();
    });
  }
}

// Start Game instance on DOM load
window.addEventListener('DOMContentLoaded', () => {
  window.gameEngine = new GardenGame();
  window.gameEngine.init();
});
