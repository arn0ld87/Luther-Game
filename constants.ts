
import { Question } from './types';

export const COLORS = {
  primary: '#e67e22',
  secondary: '#2c3e50',
  player: '#e67e22',
  playerHead: '#d35400',
  graceItem: '#f1c40f',
  graceEmissive: '#f39c12',
  indulgenceItem: '#c0392b',
  ground: '#7f8c8d',
  gatePillar: '#95a5a6',
  gateTop: '#7f8c8d',
  gatePlane: '#ecf0f1',
  path: '#bdc3c7',
  fog: '#2c3e50',
};

export const UI_CONFIG = {
  MAX_PROMPT_LENGTH: 500,
};

export const GAME_CONFIG = {
  SCORE_COLLECT: 10,
  SCORE_HIT_PENALTY: 20,
  SCORE_DEBATE_WIN: 100,
  SCORE_DEBATE_LOSE_PENALTY: 50,
  FLASH_DURATION: 300,
  LUTHER_MAX_HEALTH: 100,

  // Canvas Config
  PLAYER_SPEED: 10,
  PLAYER_LATERAL_SPEED: 8,
  PLAYER_BOUNDS: { MIN: -4, MAX: 4 },
  CHECKPOINT_Z: -45, // Gate position

  // Camera
  CAMERA_FOLLOW_OFFSET_Z: 6,
  CAMERA_LOOK_AHEAD: 10,
  CAMERA_SWAY_FACTOR: 0.2,

  // Environment
  FLOOR_WIDTH: 20,
  FLOOR_LENGTH: 100,
  GATE_Z: -48,
  STARS_COUNT: 2000,
  FOG_NEAR: 10,
  FOG_FAR: 50,

  // Items
  ITEM_START_Z: -5,
  ITEM_END_Z: -40,
  ITEM_SPACING: 5,
  ITEM_SPREAD: 8,
  ITEM_GOOD_CHANCE: 0.6,

  // Animation
  PLAYER_BOBBING_SPEED: 10,
  PLAYER_BOBBING_AMPLITUDE: 0.1,
  PLAYER_LERP_FACTOR: 0.1,
  PLAYER_TILT_FACTOR: 0.5,
  ITEM_ROTATION_SPEED: 0.02,
  ITEM_FLOAT_SPEED: 2,
  ITEM_FLOAT_AMPLITUDE: 0.2,

  // Collision
  COLLISION_RADIUS_X: 0.8,
  COLLISION_RADIUS_Z: 0.8,
};

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
