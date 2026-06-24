// nature.js - Animated Creatures and Insect Pollination System for Nikku's Dream Garden

class NatureSystem {
  constructor() {
    this.creatures = [];
    this.fireflies = [];
    this.container = null;
    this.active = false;
    this.pollinationInterval = null;
  }

  init(containerElement) {
    this.container = containerElement;
    this.active = true;
    this.spawnInitialCreatures();
    this.startLoop();
  }

  spawnInitialCreatures() {
    // Spawn a mix of butterflies, bees, and ladybugs
    for (let i = 0; i < 6; i++) this.spawnCreature('butterfly');
    for (let i = 0; i < 4; i++) this.spawnCreature('bee');
    for (let i = 0; i < 3; i++) this.spawnCreature('ladybug');
    for (let i = 0; i < 2; i++) this.spawnCreature('bird');
  }

  spawnCreature(type) {
    if (!this.container) return;

    const wrapper = document.createElement('div');
    wrapper.className = 'garden-creature-wrapper';

    const el = document.createElement('div');
    el.className = `garden-creature creature-${type}`;
    
    // Choose emoji & style
    let emoji = '🦋';
    let hue = Math.floor(Math.random() * 360);
    switch (type) {
      case 'butterfly':
        emoji = '🦋';
        el.style.filter = `hue-rotate(${hue}deg) drop-shadow(0 2px 4px rgba(0,0,0,0.2))`;
        break;
      case 'bee':
        emoji = '🐝';
        break;
      case 'ladybug':
        emoji = '🐞';
        break;
      case 'bird':
        emoji = '🐦';
        el.style.fontSize = '24px';
        break;
    }
    
    el.textContent = emoji;
    wrapper.appendChild(el);
    this.container.appendChild(wrapper);

    // Initial position
    const startX = Math.random() * (this.container.clientWidth || 1520);
    const startY = Math.random() * (this.container.clientHeight || 1520);

    const creature = {
      wrapper: wrapper,
      element: el,
      type: type,
      x: startX,
      y: startY,
      targetX: startX,
      targetY: startY,
      speed: type === 'bird' ? 3.0 : (type === 'bee' ? 1.5 : 1.0),
      state: 'wandering', // wandering, visiting, landing
      timer: 0,
      wingFlap: 0,
      scaleX: 1,
      angle: 0
    };

    wrapper.style.left = `${creature.x}px`;
    wrapper.style.top = `${creature.y}px`;

    this.creatures.push(creature);
  }

  startLoop() {
    const update = () => {
      if (!this.active) return;

      const phase = typeof weatherEngine !== 'undefined' ? weatherEngine.getCurrentPhase() : 'afternoon';
      const weather = typeof weatherEngine !== 'undefined' ? weatherEngine.currentWeather : 'sunny';

      // 1. Update existing insects/birds
      this.creatures.forEach(c => {
        // Stormy/night weather makes insects fly slower or hide (except fireflies)
        let actualSpeed = c.speed;
        if (weather === 'storm') actualSpeed *= 0.3;
        else if (phase === 'night' && c.type !== 'bird') actualSpeed *= 0.4;

        // Wandering logic
        if (c.state === 'wandering') {
          // If close to target, find new target
          const dx = c.targetX - c.x;
          const dy = c.targetY - c.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 10) {
            // Find blooming flower to land on, or just fly randomly
            if (c.type !== 'bird' && Math.random() < 0.3) {
              const flowerTile = this.findBloomingFlowerNear(c.x, c.y);
              if (flowerTile) {
                c.state = 'visiting';
                c.targetX = flowerTile.pixelX;
                c.targetY = flowerTile.pixelY;
                c.flowerTile = flowerTile;
                c.timer = 150 + Math.floor(Math.random() * 200); // frames to sit on flower
              } else {
                this.pickRandomTarget(c);
              }
            } else {
              this.pickRandomTarget(c);
            }
          } else {
            // Move towards target
            const angle = Math.atan2(dy, dx);
            c.angle = angle;
            c.x += Math.cos(angle) * actualSpeed;
            c.y += Math.sin(angle) * actualSpeed;
            c.scaleX = Math.cos(angle) >= 0 ? 1 : -1;
          }
        } else if (c.state === 'visiting') {
          // Sit on flower, flapping wings slowly
          c.timer--;
          
          // Pollination chance while visiting
          if (c.timer === 50 && c.type === 'bee') {
            this.triggerPollenExplosion(c.x, c.y);
            this.pollinateFlower(c.flowerTile);
          }

          if (c.timer <= 0) {
            c.state = 'wandering';
            this.pickRandomTarget(c);
          }
        }

        // Apply visual positions with a little wing-flap oscillation
        c.wingFlap += 0.2;
        const flapScaleY = c.state === 'visiting' ? 
                           1.0 + Math.sin(c.wingFlap) * 0.15 : 
                           1.0 + Math.sin(c.wingFlap * 2) * 0.3;

        c.element.style.transform = `scale(${c.scaleX}, ${flapScaleY}) rotate(${c.angle * 0.15}rad)`;
        c.wrapper.style.left = `${c.x}px`;
        c.wrapper.style.top = `${c.y}px`;
      });

      // 2. Manage fireflies at night
      if (phase === 'night') {
        if (this.fireflies.length < 25) {
          this.spawnFirefly();
        }
      }
      this.updateFireflies();

      requestAnimationFrame(update);
    };

    requestAnimationFrame(update);
  }

  pickRandomTarget(c) {
    if (!this.container) return;
    c.targetX = Math.random() * this.container.clientWidth;
    c.targetY = Math.random() * this.container.clientHeight;
  }

  findBloomingFlowerNear(x, y) {
    if (!window.gameEngine) return null;
    const grid = window.gameEngine.grid;
    const tileSize = window.gameEngine.getTileSize();
    
    // Find closest fully blooming flower in the grid
    let bestDist = 200; // max search pixel distance
    let targetTile = null;

    for (let r = 0; r < 20; r++) {
      for (let col = 0; col < 20; col++) {
        const tile = grid[r][col];
        if (tile.item && tile.item.growthStage === 4) { // fully blooming
          // Calculate center of this tile in pixels
          const tileEl = document.querySelector(`[data-row='${r}'][data-col='${col}']`);
          if (tileEl) {
            const pxX = tileEl.offsetLeft + tileEl.clientWidth / 2;
            const pxY = tileEl.offsetTop + tileEl.clientHeight / 2;
            const dx = pxX - x;
            const dy = pxY - y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < bestDist) {
              bestDist = dist;
              targetTile = { row: r, col: col, pixelX: pxX, pixelY: pxY };
            }
          }
        }
      }
    }
    return targetTile;
  }

  triggerPollenExplosion(x, y) {
    if (!this.container) return;

    for (let i = 0; i < 8; i++) {
      const p = document.createElement('div');
      p.className = 'pollen-particle';
      p.style.left = `${x}px`;
      p.style.top = `${y}px`;
      
      const angle = Math.random() * Math.PI * 2;
      const velocity = 1 + Math.random() * 2;
      const dx = Math.cos(angle) * velocity;
      const dy = Math.sin(angle) * velocity;
      
      this.container.appendChild(p);

      let px = x;
      let py = y;
      let opacity = 1.0;
      let life = 60 + Math.random() * 40;

      const anim = () => {
        px += dx;
        py += dy - 0.2; // float up slightly
        opacity -= 0.015;
        p.style.left = `${px}px`;
        p.style.top = `${py}px`;
        p.style.opacity = opacity;

        life--;
        if (life > 0 && opacity > 0) {
          requestAnimationFrame(anim);
        } else {
          p.remove();
        }
      };
      requestAnimationFrame(anim);
    }
  }

  pollinateFlower(tileInfo) {
    if (!window.gameEngine || !tileInfo) return;
    const tile = window.gameEngine.grid[tileInfo.row][tileInfo.col];
    
    // Pollination increases flower quality
    if (tile.item && tile.item.growthStage === 4) {
      const currentQuality = tile.item.quality || 'Normal';
      let nextQuality = currentQuality;
      
      if (currentQuality === 'Normal' && Math.random() < 0.20) {
        nextQuality = 'Bronze';
      } else if (currentQuality === 'Bronze' && Math.random() < 0.15) {
        nextQuality = 'Silver';
      } else if (currentQuality === 'Silver' && Math.random() < 0.08) {
        nextQuality = 'Gold';
      }

      if (nextQuality !== currentQuality) {
        tile.item.quality = nextQuality;
        window.gameEngine.updateTileVisual(tileInfo.row, tileInfo.col);
        
        // Show quality float text
        window.gameEngine.showFloatText(
          tileInfo.row, 
          tileInfo.col, 
          `🌸 Pollinated! (${nextQuality} Quality)`,
          '#ffda79'
        );
      }
    }
  }

  // --- FIREFLIES ---

  spawnFirefly() {
    if (!this.container) return;

    const el = document.createElement('div');
    el.className = 'firefly-particle';
    
    this.container.appendChild(el);

    const f = {
      element: el,
      x: Math.random() * this.container.clientWidth,
      y: Math.random() * this.container.clientHeight,
      angle: Math.random() * Math.PI * 2,
      speed: 0.3 + Math.random() * 0.4,
      glowPeriod: 2 + Math.random() * 3, // oscillation speed
      glowTimer: Math.random() * 10
    };

    el.style.left = `${f.x}px`;
    el.style.top = `${f.y}px`;
    this.fireflies.push(f);
  }

  updateFireflies() {
    const isNight = (typeof weatherEngine !== 'undefined') && (weatherEngine.getCurrentPhase() === 'night');

    for (let i = this.fireflies.length - 1; i >= 0; i--) {
      const f = this.fireflies[i];
      
      // Update position (gentle floating)
      f.angle += (Math.random() - 0.5) * 0.2;
      f.x += Math.cos(f.angle) * f.speed;
      f.y += Math.sin(f.angle) * f.speed - 0.05; // drift upwards slowly

      // Glow oscillation
      f.glowTimer += 0.05;
      const opacity = (Math.sin(f.glowTimer * f.glowPeriod) + 1.0) / 2.0;

      // Handle screen boundaries or day/night transition
      const outOfBounds = f.x < 0 || f.x > this.container.clientWidth || f.y < 0 || f.y > this.container.clientHeight;
      
      if (outOfBounds || !isNight) {
        f.element.remove();
        this.fireflies.splice(i, 1);
      } else {
        f.element.style.left = `${f.x}px`;
        f.element.style.top = `${f.y}px`;
        f.element.style.opacity = opacity;
        f.element.style.transform = `scale(${0.5 + opacity * 0.5})`;
      }
    }
  }

  cleanup() {
    this.active = false;
    this.creatures.forEach(c => c.wrapper.remove());
    this.fireflies.forEach(f => f.element.remove());
    this.creatures = [];
    this.fireflies = [];
  }
}

// Global instance
const natureSystem = new NatureSystem();
