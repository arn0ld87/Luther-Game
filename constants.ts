import { Question, TileType, MapData, ItemType, EnemyType, Enemy, Direction } from './types';
import { createEnemy } from './engine/Enemy';

// Zelda ALTTP-inspired color palette (SNES accurate)
export const COLORS = {
  // UI Colors
  primary: '#e67e22',
  secondary: '#2c3e50',

  // Player
  player: '#c0392b',       // Luther's robe - dark red
  playerSkin: '#f5cba7',   // Skin tone

  // Items
  graceItem: '#f1c40f',    // Gold/yellow for grace
  indulgenceItem: '#c0392b', // Red for indulgence
  scrollItem: '#ecf0f1',   // White/cream for scrolls

  // Tiles - SNES Zelda palette
  grass: '#68b030',        // Light grass
  grassDark: '#407010',    // Dark grass/shadow
  path: '#c8a868',         // Dirt path
  pathDark: '#a08040',     // Path shadow
  water: '#3890c8',        // Water
  waterDark: '#2060a0',    // Deep water
  wall: '#787878',         // Stone wall
  wallDark: '#505050',     // Wall shadow
  tree: '#286028',         // Tree foliage
  treeTrunk: '#805020',    // Tree trunk
  building: '#d8c880',     // Building walls
  buildingRoof: '#a04040', // Roof

  // HUD
  hudBg: '#000000',
  hudBorder: '#ffffff',
  heartFull: '#e74c3c',
  heartEmpty: '#4a4a4a',
  textGold: '#f1c40f',
};

export const UI_CONFIG = {
  MAX_PROMPT_LENGTH: 500,
};

// 2D Game Configuration
export const GAME_CONFIG = {
  // Scoring
  SCORE_COLLECT: 10,
  SCORE_HIT_PENALTY: 20,
  SCORE_DEBATE_WIN: 100,
  SCORE_DEBATE_LOSE_PENALTY: 50,
  SCORE_ENEMY_KILL: 25,
  FLASH_DURATION: 300,

  // Player
  PLAYER_SPEED: 3,          // Pixels per frame
  MAX_HEALTH: 6,            // 6 half-hearts = 3 full hearts

  // Rendering
  TILE_SIZE: 16,            // Base tile size in pixels
  SCALE: 3,                 // Scale factor for retro look
  CANVAS_WIDTH: 256,        // SNES resolution width
  CANVAS_HEIGHT: 224,       // SNES resolution height

  // Animation
  ANIM_SPEED: 8,            // Frames per animation cycle

  // Map
  VIEWPORT_TILES_X: 16,     // Tiles visible horizontally
  VIEWPORT_TILES_Y: 14,     // Tiles visible vertically
};

// Initial test map - Wittenberg town square
export const INITIAL_MAP: MapData = {
  width: 20,
  height: 18,
  tiles: [
    // Row 0 - Top border (trees)
    [4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4],
    // Row 1
    [4, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 4],
    // Row 2
    [4, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 4],
    // Row 3
    [4, 0, 0, 5, 5, 5, 1, 0, 0, 0, 0, 1, 5, 5, 5, 0, 0, 0, 0, 4],
    // Row 4 - Building entrance
    [4, 0, 0, 5, 6, 5, 1, 0, 0, 0, 0, 1, 5, 6, 5, 0, 0, 0, 0, 4],
    // Row 5
    [4, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 4],
    // Row 6 - Main path
    [4, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 4],
    // Row 7
    [4, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 4],
    // Row 8
    [4, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 4],
    // Row 9
    [4, 0, 0, 0, 1, 0, 0, 0, 7, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 4],
    // Row 10
    [4, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 4],
    // Row 11
    [4, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 4],
    // Row 12
    [4, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4],
    // Row 13
    [4, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4],
    // Row 14 - Player start area
    [4, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4],
    // Row 15
    [4, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4],
    // Row 16
    [4, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4],
    // Row 17 - Bottom border
    [4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4],
  ],
  // Collision map (true = blocked)
  collisions: [],
  items: [
    { id: 1, x: 3 * 16, y: 7 * 16, type: ItemType.GRACE, collected: false },
    { id: 2, x: 15 * 16, y: 7 * 16, type: ItemType.GRACE, collected: false },
    { id: 3, x: 9 * 16, y: 11 * 16, type: ItemType.GRACE, collected: false },
    { id: 4, x: 6 * 16, y: 8 * 16, type: ItemType.INDULGENCE, collected: false },
    { id: 5, x: 12 * 16, y: 8 * 16, type: ItemType.INDULGENCE, collected: false },
  ],
  npcs: [],
  enemies: [],  // Will be populated below
  checkpointX: 8 * 16,
  checkpointY: 9 * 16,
  startX: 8 * 16,
  startY: 15 * 16,
};

// Generate collision map from tiles
export function generateCollisionMap(tiles: number[][]): boolean[][] {
  const blockedTiles = [TileType.WALL, TileType.WATER, TileType.TREE, TileType.BUILDING];
  return tiles.map(row =>
    row.map(tile => blockedTiles.includes(tile))
  );
}

// Initialize the collision map
INITIAL_MAP.collisions = generateCollisionMap(INITIAL_MAP.tiles);

export const QUESTIONS: Question[] = [
  {
    id: 1,
    text: "Muss ich gute Werke tun, um von Gott geliebt zu werden?",
    context: "Matthäus 7,21 - Nicht jeder, der zu mir sagt: Herr, Herr! wird in das Himmelreich kommen...",
  },
  {
    id: 2,
    text: "Ist der Papst das Oberhaupt der Kirche?",
    context: "Matthäus 16,18 - Du bist Petrus, und auf diesen Felsen will ich meine Gemeinde bauen...",
  },
  {
    id: 3,
    text: "Haben wir einen freien Willen zum Guten?",
    context: "Römer 3,23 - Sie sind allesamt Sünder und ermangeln des Ruhmes...",
  },
];
