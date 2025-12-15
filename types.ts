// 2D Zelda-Style Game Engine Types

export enum GameState {
  MENU,
  PLAYING,
  DEBATE,
  ART_STUDIO,
  VICTORY,
  GAME_OVER,
  MAP,
  PAUSED,
  DIALOG
}

export type ImageSize = "256x256" | "512x512" | "1024x1024";

// Direction for player movement and sprite animation
export enum Direction {
  DOWN = 0,
  LEFT = 1,
  RIGHT = 2,
  UP = 3
}

// Player action states
export enum PlayerAction {
  IDLE = 'idle',
  WALKING = 'walking',
  ATTACKING = 'attacking',
  HURT = 'hurt'
}

// 2D coordinate point
export interface Point2D {
  x: number;
  y: number;
}

// Tile types for the map
export enum TileType {
  GRASS = 0,
  PATH = 1,
  WALL = 2,
  WATER = 3,
  TREE = 4,
  BUILDING = 5,
  DOOR = 6,
  CHECKPOINT = 7
}

// Game item types
export enum ItemType {
  GRACE = 'grace',
  INDULGENCE = 'indulgence',
  SCROLL = 'scroll',
  HEART = 'heart'
}

// A collectible item on the map
export interface GameItem {
  id: number;
  x: number;
  y: number;
  type: ItemType;
  collected: boolean;
}

// Enemy types
export enum EnemyType {
  INDULGENCE_SELLER = 'indulgence_seller',  // Ablasshändler
  GUARD = 'guard',                           // Wächter
  TETZEL = 'tetzel'                          // Boss
}

// Enemy state
export interface Enemy {
  id: number;
  x: number;
  y: number;
  type: EnemyType;
  health: number;
  maxHealth: number;
  direction: Direction;
  isMoving: boolean;
  animFrame: number;
  state: 'patrol' | 'chase' | 'attack' | 'hurt' | 'dead';
  patrolPoints?: Point2D[];
  patrolIndex?: number;
  lastAttackTime: number;
  invulnerableUntil: number;
}

// NPC for dialogues
export interface NPC {
  id: number;
  x: number;
  y: number;
  name: string;
  spriteIndex: number;
  dialogLines: DialogLine[];
}

// Dialog line for NPCs
export interface DialogLine {
  speaker: string;
  text: string;
  portrait?: string;
}

// Map data structure
export interface MapData {
  width: number;
  height: number;
  tiles: number[][];
  collisions: boolean[][];
  items: GameItem[];
  npcs: NPC[];
  enemies: Enemy[];
  checkpointX: number;
  checkpointY: number;
  startX: number;
  startY: number;
}

// Player state
export interface PlayerState {
  x: number;
  y: number;
  direction: Direction;
  isMoving: boolean;
  animFrame: number;
  action: PlayerAction;
  attackFrame: number;
  attackCooldown: number;
  invulnerableUntil: number;
}

export interface Question {
  id: number;
  text: string;
  context: string;
}

// Component Props
export interface Game2DCanvasProps {
  gameState: GameState;
  onReachCheckpoint: () => void;
  onCollect: () => void;
  onHit: () => void;
  onEnemyKill?: () => void;
}

export interface DebateInterfaceProps {
  question: Question;
  onComplete: (success: boolean) => void;
}

export interface ArtStudioProps {
  onClose: () => void;
  onApplyTexture: (url: string) => void;
}

export interface HUD2DProps {
  score: number;
  health: number;
  maxHealth: number;
  currentStage: number;
  totalStages: number;
}

export interface DialogBoxProps {
  lines: DialogLine[];
  currentIndex: number;
  onNext: () => void;
  onClose: () => void;
}
