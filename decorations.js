// decorations.js - Decoration Database for Nikku's Dream Garden

const DECORATIONS = [
  {
    id: 'stone_path',
    name: 'Stone Path',
    emoji: '🪨',
    category: 'Path',
    buyPrice: 5,
    sellValue: 2,
    walkable: true,
    desc: 'Smooth stone tiles for building beautiful pathways through your flowers.',
    lightRadius: 0
  },
  {
    id: 'wooden_fence',
    name: 'Wooden Fence',
    emoji: '🧱',
    category: 'Fence',
    buyPrice: 10,
    sellValue: 4,
    walkable: false,
    desc: 'A cozy wooden fence to border your garden fields and protect plants.',
    lightRadius: 0
  },
  {
    id: 'garden_bench_wood',
    name: 'Cozy Wooden Bench',
    emoji: '🪑',
    category: 'Furniture',
    buyPrice: 50,
    sellValue: 20,
    walkable: false,
    desc: 'A lovely wooden bench to sit on and enjoy the garden aroma.',
    lightRadius: 0
  },
  {
    id: 'garden_bench_marble',
    name: 'Marble Garden Bench',
    emoji: '🛋️',
    category: 'Furniture',
    buyPrice: 150,
    sellValue: 60,
    walkable: false,
    desc: 'An elegant carved white marble bench, feels smooth and cool.',
    lightRadius: 0
  },
  {
    id: 'lantern_wood',
    name: 'Paper Lantern',
    emoji: '🏮',
    category: 'Lighting',
    buyPrice: 30,
    sellValue: 12,
    walkable: false,
    desc: 'Emits a soft, warm orange glow. Looks dreamy after sunset.',
    lightRadius: 3,
    glowColor: 'rgba(255, 120, 0, 0.4)'
  },
  {
    id: 'garden_light_post',
    name: 'Tall Garden Post Light',
    emoji: '💡',
    category: 'Lighting',
    buyPrice: 80,
    sellValue: 30,
    walkable: false,
    desc: 'A classical iron street-lamp post that turns on automatically at night.',
    lightRadius: 5,
    glowColor: 'rgba(255, 255, 180, 0.5)'
  },
  {
    id: 'flower_arch_rose',
    name: 'Rose Flower Archway',
    emoji: '⛩️',
    category: 'Structure',
    buyPrice: 200,
    sellValue: 80,
    walkable: true,
    desc: 'A stunning wooden arch wrapped in climbing pink roses.',
    lightRadius: 0
  },
  {
    id: 'flower_arch_jasmine',
    name: 'Jasmine Flower Archway',
    emoji: '⛩️',
    category: 'Structure',
    buyPrice: 220,
    sellValue: 90,
    walkable: true,
    desc: 'A beautiful archway releasing a rich sweet jasmine aroma.',
    lightRadius: 0
  },
  {
    id: 'bird_bath',
    name: 'Stone Bird Bath',
    emoji: '⛲',
    category: 'Water',
    buyPrice: 120,
    sellValue: 45,
    walkable: false,
    desc: 'A water basin that attracts songbirds, fluttering around the garden.',
    lightRadius: 0
  },
  {
    id: 'fountain_stone',
    name: 'Stone Tiered Fountain',
    emoji: '⛲',
    category: 'Water',
    buyPrice: 500,
    sellValue: 200,
    walkable: false,
    desc: 'A majestic marble fountain with three tiers of splashing water.',
    lightRadius: 0
  },
  {
    id: 'garden_gazebo',
    name: 'White Gazebo',
    emoji: '🏛️',
    category: 'Structure',
    buyPrice: 1000,
    sellValue: 400,
    walkable: false,
    desc: 'A stunning Victorian garden pavilion. The ultimate centerpiece.',
    lightRadius: 2,
    glowColor: 'rgba(255, 240, 200, 0.2)'
  },
  {
    id: 'wind_chime',
    name: 'Bamboo Wind Chimes',
    emoji: '🎐',
    category: 'Acoustic',
    buyPrice: 40,
    sellValue: 15,
    walkable: false,
    desc: 'Clinks gently in the wind, producing calming acoustic echoes.',
    lightRadius: 0
  },
  {
    id: 'bonsai_tree',
    name: 'Ancient Bonsai Tree',
    emoji: '🪴',
    category: 'Flora',
    buyPrice: 300,
    sellValue: 120,
    walkable: false,
    desc: 'A miniature pine tree styled over decades in a ceramic tray.',
    lightRadius: 0
  },
  {
    id: 'cherry_blossom_tree',
    name: 'Weeping Cherry Tree',
    emoji: '🌳',
    category: 'Flora',
    buyPrice: 600,
    sellValue: 240,
    walkable: false,
    desc: 'A large tree that drops pink cherry petals over the ground.',
    lightRadius: 0
  }
];

const DECORATION_DB = {};
DECORATIONS.forEach(d => {
  DECORATION_DB[d.id] = d;
});

function getDecorationById(id) {
  return DECORATION_DB[id] || null;
}

if (typeof module !== 'undefined') {
  module.exports = {
    DECORATIONS,
    DECORATION_DB,
    getDecorationById
  };
}
