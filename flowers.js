// flowers.js - Flower Database & Breeding Logic for Nikku's Dream Garden

const FLOWERS = [
  // --- COMMON FLOWERS ---
  { id: 'sunflower_common', name: 'Sunflower', emoji: '🌻', rarity: 'Common', growthHours: 48, sellValue: 40, buyPrice: 10, waterNeeds: 0.15, desc: 'Nikku\'s signature flower. Tall, radiant, and always turns to face the sun.', isSunflower: true },
  { id: 'rose_red', name: 'Red Rose', emoji: '🌹', rarity: 'Common', growthHours: 72, sellValue: 60, buyPrice: 15, waterNeeds: 0.20, desc: 'A classic symbol of love and beauty. Its red petals are velvety soft.' },
  { id: 'daisy_white', name: 'White Daisy', emoji: '🌼', rarity: 'Common', growthHours: 24, sellValue: 20, buyPrice: 5, waterNeeds: 0.10, desc: 'A cheerful white flower with a bright yellow center. Very easy to grow.' },
  { id: 'jasmine_white', name: 'White Jasmine', emoji: '🌼', rarity: 'Common', growthHours: 96, sellValue: 80, buyPrice: 20, waterNeeds: 0.12, desc: 'Exquisitely scented tiny white blossoms that bring sweet peace.' },
  { id: 'lily_white', name: 'White Lily', emoji: '💮', rarity: 'Common', growthHours: 48, sellValue: 45, buyPrice: 12, waterNeeds: 0.15, desc: 'Elegant and trumpet-shaped. Represents purity and grace.' },
  { id: 'tulip_red', name: 'Red Tulip', emoji: '🌷', rarity: 'Common', growthHours: 36, sellValue: 30, buyPrice: 8, waterNeeds: 0.18, desc: 'A cup-shaped spring bloom that signals the arrival of warmer days.' },
  { id: 'lavender_purple', name: 'Purple Lavender', emoji: '🪻', rarity: 'Common', growthHours: 48, sellValue: 40, buyPrice: 10, waterNeeds: 0.08, desc: 'Scented purple spikes that attract butterflies and bring calming vibes.' },
  { id: 'hibiscus_red', name: 'Red Hibiscus', emoji: '🌺', rarity: 'Common', growthHours: 60, sellValue: 50, buyPrice: 13, waterNeeds: 0.22, desc: 'A bold, tropical flower that blooms heavily in warm sunshine.' },
  { id: 'marigold_orange', name: 'Orange Marigold', emoji: '🌼', rarity: 'Common', growthHours: 24, sellValue: 22, buyPrice: 6, waterNeeds: 0.14, desc: 'Bright orange blossoms that naturally repel garden pests.' },
  { id: 'poppy_red', name: 'Red Poppy', emoji: '🌺', rarity: 'Common', growthHours: 30, sellValue: 28, buyPrice: 7, waterNeeds: 0.12, desc: 'Paper-thin red petals that dance beautifully in a light breeze.' },
  { id: 'dahlia_pink', name: 'Pink Dahlia', emoji: '🏵️', rarity: 'Common', growthHours: 48, sellValue: 44, buyPrice: 11, waterNeeds: 0.16, desc: 'Stunning geometric layers of soft pink petals.' },
  { id: 'zinnia_yellow', name: 'Yellow Zinnia', emoji: '🏵️', rarity: 'Common', growthHours: 24, sellValue: 18, buyPrice: 5, waterNeeds: 0.13, desc: 'Tough, bright, and long-lasting yellow blooms.' },
  { id: 'begonia_red', name: 'Red Begonia', emoji: '🌺', rarity: 'Common', growthHours: 36, sellValue: 32, buyPrice: 9, waterNeeds: 0.17, desc: 'Shade-loving reddish blooms with waxy green leaves.' },
  { id: 'cosmos_pink', name: 'Pink Cosmos', emoji: '🌸', rarity: 'Common', growthHours: 28, sellValue: 25, buyPrice: 6, waterNeeds: 0.11, desc: 'Slender-stemmed pink flowers that sway elegantly in the wind.' },
  { id: 'petunia_purple', name: 'Purple Petunia', emoji: '🌸', rarity: 'Common', growthHours: 32, sellValue: 28, buyPrice: 7, waterNeeds: 0.15, desc: 'Trumpet-shaped purple flowers that cascade beautifully.' },
  { id: 'primrose_yellow', name: 'Yellow Primrose', emoji: '🌼', rarity: 'Common', growthHours: 20, sellValue: 16, buyPrice: 4, waterNeeds: 0.12, desc: 'One of the very first flowers to pop up in early spring.' },
  { id: 'sweet_pea_pink', name: 'Pink Sweet Pea', emoji: '🌸', rarity: 'Common', growthHours: 40, sellValue: 35, buyPrice: 9, waterNeeds: 0.14, desc: 'Climbing vines adorned with highly fragrant pink blossoms.' },
  { id: 'pansy_yellow', name: 'Yellow Pansy', emoji: '🏵️', rarity: 'Common', growthHours: 24, sellValue: 20, buyPrice: 5, waterNeeds: 0.10, desc: 'A happy face-like pattern on bright yellow petals.' },
  { id: 'violet_purple', name: 'Purple Violet', emoji: '🪻', rarity: 'Common', growthHours: 30, sellValue: 26, buyPrice: 6, waterNeeds: 0.09, desc: 'Small, shade-loving violet flowers with a sweet fragrance.' },
  { id: 'daffodil_yellow', name: 'Yellow Daffodil', emoji: '🌼', rarity: 'Common', growthHours: 36, sellValue: 34, buyPrice: 9, waterNeeds: 0.14, desc: 'A trumpet of bright sunshine welcoming the spring season.' },

  // --- UNCOMMON FLOWERS ---
  { id: 'rose_white', name: 'White Rose', emoji: '🌹', rarity: 'Uncommon', growthHours: 72, sellValue: 75, buyPrice: 25, waterNeeds: 0.20, desc: 'A pristine white rose representing loyalty and silence.' },
  { id: 'rose_yellow', name: 'Yellow Rose', emoji: '🌹', rarity: 'Uncommon', growthHours: 72, sellValue: 75, buyPrice: 25, waterNeeds: 0.20, desc: 'Warm yellow petals representing friendship and joy.' },
  { id: 'tulip_yellow', name: 'Yellow Tulip', emoji: '🌷', rarity: 'Uncommon', growthHours: 36, sellValue: 40, buyPrice: 15, waterNeeds: 0.18, desc: 'Bright yellow cup-shaped flower filled with cheer.' },
  { id: 'tulip_white', name: 'White Tulip', emoji: '🌷', rarity: 'Uncommon', growthHours: 36, sellValue: 40, buyPrice: 15, waterNeeds: 0.18, desc: 'Pure white petals representing forgiveness.' },
  { id: 'lily_red', name: 'Red Lily', emoji: '💮', rarity: 'Uncommon', growthHours: 48, sellValue: 55, buyPrice: 20, waterNeeds: 0.15, desc: 'Deep red trumpet flower representing passion.' },
  { id: 'lily_yellow', name: 'Yellow Lily', emoji: '💮', rarity: 'Uncommon', growthHours: 48, sellValue: 55, buyPrice: 20, waterNeeds: 0.15, desc: 'Bright yellow lilies expressing gratitude.' },
  { id: 'daisy_pink', name: 'Pink Daisy', emoji: '🌼', rarity: 'Uncommon', growthHours: 24, sellValue: 30, buyPrice: 10, waterNeeds: 0.10, desc: 'A sweet pink variant of the classic daisy.' },
  { id: 'lotus_pink', name: 'Pink Lotus', emoji: '🪷', rarity: 'Uncommon', growthHours: 96, sellValue: 120, buyPrice: 40, waterNeeds: 0.25, desc: 'A sacred flower that floats gracefully atop clean water ponds.' },
  { id: 'orchid_purple', name: 'Purple Orchid', emoji: '🌸', rarity: 'Uncommon', growthHours: 120, sellValue: 150, buyPrice: 50, waterNeeds: 0.10, desc: 'An exotic, delicate purple bloom requiring specialized care.' },
  { id: 'iris_blue', name: 'Blue Iris', emoji: '🪻', rarity: 'Uncommon', growthHours: 54, sellValue: 60, buyPrice: 20, waterNeeds: 0.15, desc: 'Deep royal blue petals resembling the wings of a butterfly.' },
  { id: 'magnolia_pink', name: 'Pink Magnolia', emoji: '🌸', rarity: 'Uncommon', growthHours: 72, sellValue: 80, buyPrice: 28, waterNeeds: 0.13, desc: 'Large, thick petals carrying a sweet, lemony scent.' },
  { id: 'gardenia_white', name: 'White Gardenia', emoji: '💮', rarity: 'Uncommon', growthHours: 84, sellValue: 95, buyPrice: 32, waterNeeds: 0.16, desc: 'Intensely fragrant creamy-white blossoms.' },
  { id: 'peony_pink', name: 'Pink Peony', emoji: '🌸', rarity: 'Uncommon', growthHours: 72, sellValue: 85, buyPrice: 30, waterNeeds: 0.18, desc: 'Ruffled, fluffy pink blooms representing good fortune.' },
  { id: 'camellia_pink', name: 'Pink Camellia', emoji: '🌺', rarity: 'Uncommon', growthHours: 64, sellValue: 70, buyPrice: 24, waterNeeds: 0.14, desc: 'Perfectly arranged pink petals, highly prized in winter.' },
  { id: 'chrysanthemum_white', name: 'White Chrysanthemum', emoji: '🌼', rarity: 'Uncommon', growthHours: 48, sellValue: 50, buyPrice: 18, waterNeeds: 0.12, desc: 'Dense petals representing truth and longevity.' },
  { id: 'snapdragon_pink', name: 'Pink Snapdragon', emoji: '🪻', rarity: 'Uncommon', growthHours: 42, sellValue: 45, buyPrice: 16, waterNeeds: 0.14, desc: 'Tall spikes with blossoms that pinch open like dragon jaws.' },
  { id: 'bluebell_blue', name: 'Bluebell', emoji: '🔔', rarity: 'Uncommon', growthHours: 30, sellValue: 35, buyPrice: 12, waterNeeds: 0.11, desc: 'Dainty bell-shaped blue flowers that form magical forest carpets.' },
  { id: 'hydrangea_blue', name: 'Blue Hydrangea', emoji: '🪻', rarity: 'Uncommon', growthHours: 72, sellValue: 80, buyPrice: 28, waterNeeds: 0.22, desc: 'Large cloud-like pom-poms of soft sky blue.' },
  { id: 'morning_glory_blue', name: 'Blue Morning Glory', emoji: '🪻', rarity: 'Uncommon', growthHours: 32, sellValue: 35, buyPrice: 12, waterNeeds: 0.14, desc: 'Unfolds its beautiful blue trumpets to greet the morning sun.' },
  { id: 'cherry_blossom_sakura', name: 'Sakura Branch', emoji: '🌸', rarity: 'Uncommon', growthHours: 96, sellValue: 110, buyPrice: 38, waterNeeds: 0.13, desc: 'Delicate pink spring blossoms that evoke a sense of fleeting beauty.' },
  { id: 'water_lily_white', name: 'White Water Lily', emoji: '🪷', rarity: 'Uncommon', growthHours: 96, sellValue: 120, buyPrice: 40, waterNeeds: 0.25, desc: 'Rests serenely on the surface of calm water.' },
  { id: 'pansy_blue', name: 'Blue Pansy', emoji: '🏵️', rarity: 'Uncommon', growthHours: 24, sellValue: 32, buyPrice: 12, waterNeeds: 0.10, desc: 'Cool blue petals with a dark, velvety center.' },
  { id: 'violet_white', name: 'White Violet', emoji: '💮', rarity: 'Uncommon', growthHours: 30, sellValue: 35, buyPrice: 12, waterNeeds: 0.09, desc: 'A modest white variant of the sweet violet.' },
  { id: 'plumeria_yellow', name: 'Yellow Plumeria', emoji: '🌸', rarity: 'Uncommon', growthHours: 80, sellValue: 90, buyPrice: 30, waterNeeds: 0.15, desc: 'Fragrant Hawaiian flower used to make beautiful leis.' },
  { id: 'carnation_pink', name: 'Pink Carnation', emoji: '💮', rarity: 'Uncommon', growthHours: 48, sellValue: 50, buyPrice: 18, waterNeeds: 0.14, desc: 'Fringed pink petals signifying a mother\'s eternal love.' },

  // --- RARE FLOWERS ---
  { id: 'rose_black', name: 'Black Baccara Rose', emoji: '🌹', rarity: 'Rare', growthHours: 120, sellValue: 250, buyPrice: 80, waterNeeds: 0.20, desc: 'A deep, mysterious, almost black rose. A gardener\'s pride.' },
  { id: 'orchid_blue', name: 'Blue Vanda Orchid', emoji: '🌸', rarity: 'Rare', growthHours: 168, sellValue: 350, buyPrice: 120, waterNeeds: 0.08, desc: 'A striking blue orchid that is incredibly difficult to find in the wild.' },
  { id: 'hyacinth_blue', name: 'Blue Hyacinth', emoji: '🪻', rarity: 'Rare', growthHours: 72, sellValue: 120, buyPrice: 45, waterNeeds: 0.15, desc: 'Highly fragrant, tightly clustered violet-blue flowers.' },
  { id: 'anemone_blue', name: 'Blue Anemone', emoji: '🌺', rarity: 'Rare', growthHours: 48, sellValue: 80, buyPrice: 30, waterNeeds: 0.13, desc: 'Also known as the windflower, showing rich blue petals.' },
  { id: 'aster_purple', name: 'Purple Aster', emoji: '🌼', rarity: 'Rare', growthHours: 48, sellValue: 75, buyPrice: 28, waterNeeds: 0.12, desc: 'Star-like purple blooms that highlight late-season gardens.' },
  { id: 'freesia_yellow', name: 'Yellow Freesia', emoji: '🪻', rarity: 'Rare', growthHours: 60, sellValue: 100, buyPrice: 35, waterNeeds: 0.14, desc: 'Stunning bell flowers with an intense, zesty citrus scent.' },
  { id: 'gladiolus_red', name: 'Red Gladiolus', emoji: '🪻', rarity: 'Rare', growthHours: 90, sellValue: 150, buyPrice: 55, waterNeeds: 0.16, desc: 'Tall sword-like spikes displaying magnificent red blooms.' },
  { id: 'lilac_purple', name: 'Purple Lilac', emoji: '🪻', rarity: 'Rare', growthHours: 120, sellValue: 220, buyPrice: 75, waterNeeds: 0.10, desc: 'Rich clusters of lavender-purple carrying the scent of pure spring.' },
  { id: 'protea_pink', name: 'King Protea', emoji: '🏵️', rarity: 'Rare', growthHours: 144, sellValue: 300, buyPrice: 100, waterNeeds: 0.07, desc: 'A prehistoric-looking pink bloom resembling a royal crown.' },
  { id: 'ranunculus_orange', name: 'Orange Ranunculus', emoji: '🏵️', rarity: 'Rare', growthHours: 72, sellValue: 130, buyPrice: 45, waterNeeds: 0.16, desc: 'Tissue-paper thin layers of fiery orange petals.' },
  { id: 'clematis_purple', name: 'Purple Clematis', emoji: '🌸', rarity: 'Rare', growthHours: 96, sellValue: 180, buyPrice: 60, waterNeeds: 0.15, desc: 'A gorgeous climbing vine with large, starry purple flowers.' },
  { id: 'columbine_blue', name: 'Blue Columbine', emoji: '🌸', rarity: 'Rare', growthHours: 60, sellValue: 110, buyPrice: 40, waterNeeds: 0.12, desc: 'Spurred blue-and-white petals that resemble dancing birds.' },
  { id: 'crocus_purple', name: 'Purple Crocus', emoji: '🌷', rarity: 'Rare', growthHours: 36, sellValue: 70, buyPrice: 25, waterNeeds: 0.10, desc: 'Peeks through winter snow to signal the start of spring.' },
  { id: 'delphinium_blue', name: 'Sky Delphinium', emoji: '🪻', rarity: 'Rare', growthHours: 96, sellValue: 190, buyPrice: 65, waterNeeds: 0.18, desc: 'Towering spikes of intense dolphin-blue flowers.' },
  { id: 'foxglove_pink', name: 'Pink Foxglove', emoji: '🪻', rarity: 'Rare', growthHours: 108, sellValue: 200, buyPrice: 70, waterNeeds: 0.17, desc: 'Tall bells with spotted interiors. Beautiful but mysterious.' },
  { id: 'fuchsia_pink', name: 'Fuchsia Lantern', emoji: '🌺', rarity: 'Rare', growthHours: 80, sellValue: 160, buyPrice: 55, waterNeeds: 0.20, desc: 'Hanging teardrop blossoms that look like colorful earrings.' },
  { id: 'hellebore_burgundy', name: 'Burgundy Hellebore', emoji: '💮', rarity: 'Rare', growthHours: 120, sellValue: 240, buyPrice: 85, waterNeeds: 0.09, desc: 'Known as the Lenten Rose, blooming in late winter frost.' },
  { id: 'honeysuckle_orange', name: 'Orange Honeysuckle', emoji: '🌸', rarity: 'Rare', growthHours: 72, sellValue: 140, buyPrice: 48, waterNeeds: 0.14, desc: 'Sweet nectar-filled tubes that hummingbirds adore.' },
  { id: 'lupine_purple', name: 'Purple Lupine', emoji: '🪻', rarity: 'Rare', growthHours: 84, sellValue: 170, buyPrice: 58, waterNeeds: 0.15, desc: 'Spire-like wild blooms of stunning violet and blue.' },
  { id: 'wisteria_purple', name: 'Wisteria Vine', emoji: '🪻', rarity: 'Rare', growthHours: 168, sellValue: 400, buyPrice: 140, waterNeeds: 0.12, desc: 'Cascading waterfalls of fragrant, romantic purple blooms.' },

  // --- EPIC FLOWERS ---
  { id: 'bird_of_paradise', name: 'Bird of Paradise', emoji: '🪶', rarity: 'Epic', growthHours: 192, sellValue: 500, buyPrice: 200, waterNeeds: 0.14, desc: 'Resembles a brightly colored bird in mid-flight. Exotic and stunning.' },
  { id: 'calla_lily_black', name: 'Black Calla Lily', emoji: '💮', rarity: 'Epic', growthHours: 144, sellValue: 420, buyPrice: 160, waterNeeds: 0.16, desc: 'Sleek, velvety, dark purple-black trumpet. Elegance personified.' },
  { id: 'allium_giant', name: 'Giant Allium', emoji: '🟣', rarity: 'Epic', growthHours: 120, sellValue: 350, buyPrice: 130, waterNeeds: 0.10, desc: 'Large, perfectly spherical pom-poms of purple starlets.' },
  { id: 'echinacea_pink', name: 'Pink Coneflower', emoji: '🌼', rarity: 'Epic', growthHours: 96, sellValue: 280, buyPrice: 100, waterNeeds: 0.08, desc: 'Hardy pink petals with a raised, spiky golden-brown cone.' },
  { id: 'forget_me_not', name: 'Forget-Me-Not', emoji: '💠', rarity: 'Epic', growthHours: 72, sellValue: 220, buyPrice: 80, waterNeeds: 0.12, desc: 'Tiny, sky-blue blossoms with a bright yellow eye. Never forget their charm.' },
  { id: 'hollyhock_dark', name: 'Dark Hollyhock', emoji: '🪻', rarity: 'Epic', growthHours: 168, sellValue: 480, buyPrice: 180, waterNeeds: 0.16, desc: 'Tall, dramatic garden giants with dark, maroon-black blossoms.' },
  { id: 'shasta_daisy_double', name: 'Double Shasta Daisy', emoji: '🌼', rarity: 'Epic', growthHours: 72, sellValue: 240, buyPrice: 85, waterNeeds: 0.11, desc: 'A rich, multi-layered daisy with fluffy white petal counts.' },
  { id: 'passion_flower', name: 'Passion Flower', emoji: '🌀', rarity: 'Epic', growthHours: 180, sellValue: 520, buyPrice: 200, waterNeeds: 0.15, desc: 'An intricate, complex structure resembling a starry blue clockwork.' },
  { id: 'flame_lily', name: 'Flame Lily', emoji: '🔥', rarity: 'Epic', growthHours: 216, sellValue: 600, buyPrice: 240, waterNeeds: 0.18, desc: 'Bright red and yellow reflexed petals resembling licking flames.' },
  { id: 'ghost_orchid', name: 'Ghost Orchid', emoji: '👻', rarity: 'Epic', growthHours: 240, sellValue: 700, buyPrice: 280, waterNeeds: 0.06, desc: 'A rare, leafless orchid that looks like a small white frog floating in mid-air.' },

  // --- LEGENDARY FLOWERS ---
  { id: 'blue_rose', name: 'Midnight Blue Rose', emoji: '💙', rarity: 'Legendary', growthHours: 720, sellValue: 2500, buyPrice: 1000, waterNeeds: 0.20, desc: 'A mythical rose representing the completely impossible and mysterious.' },
  { id: 'rainbow_rose', name: 'Rainbow Rose', emoji: '🌈', rarity: 'Legendary', growthHours: 840, sellValue: 3000, buyPrice: 1200, waterNeeds: 0.22, desc: 'Each petal shows a different color of the rainbow. Pure magic.' },
  { id: 'queen_of_night', name: 'Queen of the Night', emoji: '🌙', rarity: 'Legendary', growthHours: 1000, sellValue: 5000, buyPrice: 2000, waterNeeds: 0.15, desc: 'Blooms for only a single night each year, filling the garden with moonlight glow.' },
  { id: 'golden_sunflower', name: 'Golden Sunburst', emoji: '⚜️', rarity: 'Legendary', growthHours: 720, sellValue: 4000, buyPrice: 1500, waterNeeds: 0.15, desc: 'A sunflower spun from pure gold, sparkling constantly in daylight.', isSunflower: true },
  { id: 'jade_vine', name: 'Jade Vine', emoji: '🟢', rarity: 'Legendary', growthHours: 960, sellValue: 4800, buyPrice: 1800, waterNeeds: 0.14, desc: 'Claw-shaped flowers of a luminous, neon blue-green color.' },

  // --- EXTRA REGULAR VARIETIES FOR 100+ LIST ---
  { id: 'alyssum_white', name: 'Sweet Alyssum', emoji: '💮', rarity: 'Common', growthHours: 20, sellValue: 15, buyPrice: 4, waterNeeds: 0.10, desc: 'Tiny white ground cover smelling strongly of honey.' },
  { id: 'calendula_yellow', name: 'Yellow Calendula', emoji: '🌼', rarity: 'Common', growthHours: 24, sellValue: 20, buyPrice: 5, waterNeeds: 0.12, desc: 'Also known as pot marigold, used in soothing herbal balms.' },
  { id: 'lantana_pink', name: 'Pink Lantana', emoji: '🏵️', rarity: 'Common', growthHours: 36, sellValue: 30, buyPrice: 8, waterNeeds: 0.11, desc: 'Clusters of small flowers that transition from yellow to pink.' },
  { id: 'verbena_purple', name: 'Purple Verbena', emoji: '🪻', rarity: 'Common', growthHours: 28, sellValue: 24, buyPrice: 6, waterNeeds: 0.10, desc: 'Clusters of violet flowers that love hot, sunny corners.' },
  { id: 'gaillardia_blanket', name: 'Blanket Flower', emoji: '🏵️', rarity: 'Common', growthHours: 32, sellValue: 26, buyPrice: 7, waterNeeds: 0.08, desc: 'Bright red petals tipped in rich golden yellow.' },
  { id: 'geranium_pink', name: 'Pink Geranium', emoji: '🌺', rarity: 'Common', growthHours: 40, sellValue: 34, buyPrice: 9, waterNeeds: 0.14, desc: 'Clustered pink flowers with strongly scented circular leaves.' },
  { id: 'impatiens_pink', name: 'Pink Impatiens', emoji: '🌸', rarity: 'Common', growthHours: 24, sellValue: 18, buyPrice: 5, waterNeeds: 0.18, desc: 'Also called Busy Lizzie, splashes color in shaded spots.' },
  { id: 'lobelia_blue', name: 'Blue Lobelia', emoji: '🪻', rarity: 'Common', growthHours: 30, sellValue: 25, buyPrice: 6, waterNeeds: 0.16, desc: 'Cascades of intense electric blue petals.' },
  { id: 'phlox_white', name: 'White Phlox', emoji: '💮', rarity: 'Common', growthHours: 36, sellValue: 28, buyPrice: 7, waterNeeds: 0.13, desc: 'Dense clouds of sweet-smelling white star-like flowers.' },
  { id: 'salvia_red', name: 'Red Salvia', emoji: '🪻', rarity: 'Common', growthHours: 48, sellValue: 38, buyPrice: 10, waterNeeds: 0.14, desc: 'Bright spikes of scarlet red that attract hummingbirds.' },
  { id: 'sweet_william', name: 'Sweet William', emoji: '🏵️', rarity: 'Common', growthHours: 44, sellValue: 36, buyPrice: 9, waterNeeds: 0.12, desc: 'Fringed petals in concentric rings of red, pink, and white.' },
  { id: 'yarrow_yellow', name: 'Yellow Yarrow', emoji: '🌼', rarity: 'Common', growthHours: 32, sellValue: 28, buyPrice: 8, waterNeeds: 0.07, desc: 'Flat-topped yellow flower clusters with feathery fern-like foliage.' },
  { id: 'heather_pink', name: 'Pink Heather', emoji: '🪻', rarity: 'Common', growthHours: 50, sellValue: 40, buyPrice: 11, waterNeeds: 0.08, desc: 'Evergreen ground-hugger covered in tiny pink bells.' },
  { id: 'nigella_mist', name: 'Love-in-a-Mist', emoji: '💠', rarity: 'Uncommon', growthHours: 48, sellValue: 55, buyPrice: 18, waterNeeds: 0.12, desc: 'Delicate blue blossoms nestled within fine, lace-like leaves.' },
  { id: 'scabiosa_pincushion', name: 'Pincushion Flower', emoji: '🏵️', rarity: 'Uncommon', growthHours: 40, sellValue: 45, buyPrice: 15, waterNeeds: 0.11, desc: 'Lavender ruffled flower head with protruding white pin-like stamens.' },
  { id: 'strawflower_yellow', name: 'Yellow Strawflower', emoji: '🏵️', rarity: 'Uncommon', growthHours: 54, sellValue: 60, buyPrice: 20, waterNeeds: 0.09, desc: 'Petals feel like dry straw and keep their color forever.' },
  { id: 'osteospermum_purple', name: 'African Daisy', emoji: '🏵️', rarity: 'Uncommon', growthHours: 36, sellValue: 42, buyPrice: 14, waterNeeds: 0.10, desc: 'Shining purple petals surrounding a deep metallic blue center eye.' },
  { id: 'cyclamen_red', name: 'Red Cyclamen', emoji: '🌸', rarity: 'Uncommon', growthHours: 60, sellValue: 68, buyPrice: 22, waterNeeds: 0.14, desc: 'Upswept petals resembling butterfly wings, over marbled leaves.' },
  { id: 'larkspur_blue', name: 'Blue Larkspur', emoji: '🪻', rarity: 'Uncommon', growthHours: 54, sellValue: 58, buyPrice: 19, waterNeeds: 0.15, desc: 'Tall columns of rich, deep violet-blue cup blossoms.' },
  { id: 'allium_purple', name: 'Purple Allium', emoji: '🟣', rarity: 'Uncommon', growthHours: 60, sellValue: 65, buyPrice: 21, waterNeeds: 0.10, desc: 'Spherical purple head made of dozens of small stars.' },
  { id: 'anemone_white', name: 'White Anemone', emoji: '💮', rarity: 'Uncommon', growthHours: 48, sellValue: 52, buyPrice: 17, waterNeeds: 0.12, desc: 'Delicate white petals contrasting with a dark navy center.' },
  { id: 'aster_pink', name: 'Pink Aster', emoji: '🌼', rarity: 'Uncommon', growthHours: 48, sellValue: 50, buyPrice: 16, waterNeeds: 0.12, desc: 'Daisy-like pink star bloom that flowers in late autumn.' },
  { id: 'fuchsia_red', name: 'Red Fuchsia', emoji: '🌺', rarity: 'Uncommon', growthHours: 64, sellValue: 70, buyPrice: 24, waterNeeds: 0.18, desc: 'Dangling red lanterns of deep color.' },
  { id: 'ranunculus_pink', name: 'Pink Ranunculus', emoji: '🏵️', rarity: 'Uncommon', growthHours: 72, sellValue: 80, buyPrice: 26, waterNeeds: 0.15, desc: 'Dozens of paper-thin pink petals layered tightly.' }
];

// Ensure database reaches 100+ items by generating custom varieties if needed.
// Currently we have 20 common, 25 uncommon, 20 rare, 10 epic, 5 legendary = 80 flowers defined.
// Let's add 25 more to be absolutely sure we exceed 100.
const additionalFlowersList = [
  ['pink_rose_hybrid', 'Pink Rose', '🌹', 'Uncommon', 72, 80, 0, 0.20, 'A beautiful pink rose bred by blending red and white rose parents.'],
  ['orange_rose_hybrid', 'Orange Rose', '🌹', 'Uncommon', 72, 85, 0, 0.20, 'A warm orange rose born from a red and yellow pairing.'],
  ['crimson_rose_hybrid', 'Crimson Rose', '🌹', 'Rare', 96, 180, 0, 0.20, 'A deep velvet crimson rose bred from red and black parents.'],
  ['purple_rose_hybrid', 'Purple Rose', '🌹', 'Rare', 120, 240, 0, 0.20, 'A majestic purple rose born from pink and blue hybrid roses.'],
  ['peach_rose_hybrid', 'Peach Rose', '🌹', 'Uncommon', 72, 85, 0, 0.20, 'Soft pastel orange rose with a sweet fruity scent.'],
  ['orange_tulip_hybrid', 'Orange Tulip', '🌷', 'Uncommon', 36, 45, 0, 0.18, 'A bright orange cup flower bred from red and yellow tulip parents.'],
  ['pink_lily_hybrid', 'Pink Lily', '💮', 'Uncommon', 48, 60, 0, 0.15, 'A delicate hybrid lily born from white and red lilies.'],
  ['orange_cosmos_hybrid', 'Orange Cosmos', '🌸', 'Uncommon', 28, 35, 0, 0.11, 'Bright orange petals bred from pink and yellow daisy pairings.'],
  ['purple_pansy_hybrid', 'Purple Pansy', '🏵️', 'Uncommon', 24, 38, 0, 0.10, 'A velvety royal purple pansy born from white and blue parents.'],
  ['blue_violet_hybrid', 'Blue Violet', '🪻', 'Uncommon', 30, 40, 0, 0.09, 'A deep sky blue violet created from purple and white violet parents.'],
  ['golden_daisy_hybrid', 'Golden Daisy', '🌼', 'Rare', 60, 150, 0, 0.12, 'A shimmering hybrid daisy born from a sunflower and a white daisy.'],
  ['moon_orchid_hybrid', 'Moon Lily', '🪷', 'Rare', 120, 300, 0, 0.10, 'A glowing silver lily created by crossing a blue orchid and a white lily.'],
  ['pastel_jasmine_hybrid', 'Pastel Jasmine', '🌼', 'Uncommon', 96, 110, 0, 0.11, 'Light purple-tinted jasmine with a lavender scent.'],
  ['star_orchid_hybrid', 'Star Orchid', '🌸', 'Rare', 144, 380, 0, 0.10, 'A spectacular starry hybrid born from crossing orchid and jasmine.'],
  ['twilight_rose_hybrid', 'Twilight Rose', '🌹', 'Epic', 168, 500, 0, 0.18, 'A dark violet rose bred from lavender and red rose parents.'],
  ['crystal_lotus_hybrid', 'Crystal Lotus', '🪷', 'Epic', 144, 550, 0, 0.22, 'A crystal-clear floating lotus born from lotus and water lily.'],
  ['tropical_sunset_hybrid', 'Tropical Sunset', '🌺', 'Rare', 80, 200, 0, 0.20, 'Bright orange-red hibiscus hybrid crossed with yellow plumeria.'],
  ['firewheel_marigold_hybrid', 'Firewheel Marigold', '🌼', 'Uncommon', 30, 45, 0, 0.13, 'Red and orange concentric petals born from marigold and zinnia.'],
  ['crimson_poppy_hybrid', 'Crimson Poppy', '🌺', 'Uncommon', 36, 42, 0, 0.12, 'Highly detailed dark poppy hybrid from poppy and tulip.'],
  ['royal_dahlia_hybrid', 'Royal Dahlia', '🏵️', 'Rare', 72, 180, 0, 0.15, 'Large multi-layered hybrid from dahlia and pink peony.'],
  ['jewel_begonia_hybrid', 'Jewel Begonia', '🌺', 'Uncommon', 40, 50, 0, 0.16, 'Highly reflective red petals bred from begonia and petunia.'],
  ['fairy_hydrangea_hybrid', 'Fairy Hydrangea', '🪻', 'Rare', 96, 220, 0, 0.20, 'Glows softly in the evening, born from hydrangea and bluebell.'],
  ['dusk_glory_hybrid', 'Dusk Glory', '🪻', 'Uncommon', 36, 50, 0, 0.13, 'Dark purple climbing flowers from morning glory and sweet pea.'],
  ['ivory_camellia_hybrid', 'Ivory Camellia', '🌺', 'Rare', 84, 190, 0, 0.14, 'Perfect creamy white winter bloom from camellia and gardenia.'],
  ['dragon_mum_hybrid', 'Dragon Snapdragon', '🪻', 'Rare', 60, 160, 0, 0.14, 'A bizarre hybrid showing dragon heads, from mum and snapdragon.'],
  ['velvet_iris_hybrid', 'Velvet Iris', '🪻', 'Rare', 72, 170, 0, 0.14, 'Deep purple velvet leaves crossed from iris and magnolia.'],
  ['sakura_bloom_hybrid', 'Sakura Bloom', '🌸', 'Rare', 120, 280, 0, 0.13, 'A double-petal pink cherry blossom crossed with peach bloom.'],
  ['golden_bell_hybrid', 'Golden Bell', '🔔', 'Uncommon', 36, 45, 0, 0.11, 'Bright yellow bells bred from bluebell and yellow primrose.'],
  ['pink_hibiscus_hybrid', 'Pink Hibiscus', '🌺', 'Uncommon', 60, 65, 0, 0.22, 'Mouth-watering pink tropical petals bred from red and white hibiscus.']
];

additionalFlowersList.forEach(([id, name, emoji, rarity, growthHours, sellValue, buyPrice, waterNeeds, desc]) => {
  FLOWERS.push({
    id, name, emoji, rarity, growthHours, sellValue, buyPrice, waterNeeds, desc, isHybrid: true
  });
});

// Build active index mapping
const FLOWER_DB = {};
FLOWERS.forEach(f => {
  FLOWER_DB[f.id] = f;
});

// --- HYBRID BREEDING FORMULAS ---
// Key format: "parentA_id+parentB_id" (sorted alphabetically to prevent ordering issues)
// Returns the child flower ID
const HYBRID_FORMULAS = {
  // Rose formulas
  'rose_red+rose_white': 'pink_rose_hybrid',
  'rose_red+rose_yellow': 'orange_rose_hybrid',
  'rose_black+rose_red': 'crimson_rose_hybrid',
  'blue_rose+rose_black': 'rainbow_rose',
  'pink_rose_hybrid+orchid_blue': 'purple_rose_hybrid',
  'rose_yellow+rose_white': 'peach_rose_hybrid',

  // Tulip formulas
  'tulip_red+tulip_yellow': 'orange_tulip_hybrid',
  'tulip_red+tulip_white': 'rose_red', // reverting or breeding other species
  
  // Lily formulas
  'lily_red+lily_white': 'pink_lily_hybrid',

  // Daisy formulas
  'daisy_white+sunflower_common': 'golden_daisy_hybrid',
  'daisy_pink+daisy_white': 'daisy_pink',

  // Orchid formulas
  'lily_white+orchid_blue': 'moon_orchid_hybrid',
  
  // Jasmine & Lavender
  'jasmine_white+lavender_purple': 'pastel_jasmine_hybrid',
  'jasmine_white+orchid_purple': 'star_orchid_hybrid',

  // Complex hybrids
  'lavender_purple+rose_red': 'twilight_rose_hybrid',
  'lotus_pink+water_lily_white': 'crystal_lotus_hybrid',
  'hibiscus_red+plumeria_yellow': 'tropical_sunset_hybrid',
  'marigold_orange+zinnia_yellow': 'firewheel_marigold_hybrid',
  'poppy_red+tulip_red': 'crimson_poppy_hybrid',
  'dahlia_pink+peony_pink': 'royal_dahlia_hybrid',
  'begonia_red+petunia_purple': 'jewel_begonia_hybrid',
  'bluebell_blue+hydrangea_blue': 'fairy_hydrangea_hybrid',
  'morning_glory_blue+sweet_pea_pink': 'dusk_glory_hybrid',
  'camellia_pink+gardenia_white': 'ivory_camellia_hybrid',
  'chrysanthemum_white+snapdragon_pink': 'dragon_mum_hybrid',
  'iris_blue+magnolia_pink': 'velvet_iris_hybrid',
  'cherry_blossom_sakura+magnolia_pink': 'sakura_bloom_hybrid',
  'bluebell_blue+primrose_yellow': 'golden_bell_hybrid',

  // Cross breeding categories
  'violet_purple+violet_white': 'blue_violet_hybrid',
  'pansy_blue+pansy_yellow': 'purple_pansy_hybrid',
  
  // Legendary breeding triggers (high tier parents)
  'rose_black+orchid_blue': 'blue_rose',
  'blue_rose+golden_sunflower': 'queen_of_night',
  'sunflower_common+marigold_orange': 'golden_sunflower',
  'water_lily_white+orchid_purple': 'jade_vine'
};

// Fill in remaining matches to support symmetric keys
const BREEDING_RECIPES = {};
Object.entries(HYBRID_FORMULAS).forEach(([key, childId]) => {
  const [p1, p2] = key.split('+');
  BREEDING_RECIPES[`${p1}+${p2}`] = childId;
  BREEDING_RECIPES[`${p2}+${p1}`] = childId;
});

// Helper functions for external use
function getFlowerById(id) {
  return FLOWER_DB[id] || null;
}

function getHybridChild(parentAId, parentBId) {
  return BREEDING_RECIPES[`${parentAId}+${parentBId}`] || null;
}

function getBuyableFlowers() {
  return FLOWERS.filter(f => f.buyPrice > 0);
}

// Exports
if (typeof module !== 'undefined') {
  module.exports = {
    FLOWERS,
    FLOWER_DB,
    BREEDING_RECIPES,
    getFlowerById,
    getHybridChild,
    getBuyableFlowers
  };
}
