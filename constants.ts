import { Question } from './types';

// =====================================
// GAME CONFIGURATION
// =====================================

export const GAME_CONFIG = {
  // Player movement
  PLAYER_SPEED: 8,
  PLAYER_LATERAL_SPEED: 8,
  PLAYER_BOUNDS: { MIN: -4, MAX: 4 },
  PLAYER_BOBBING_SPEED: 10,
  PLAYER_BOBBING_AMPLITUDE: 0.1,
  PLAYER_TILT_FACTOR: 0.5,
  PLAYER_LERP_FACTOR: 0.1,

  // Items
  ITEM_START_Z: -10,
  ITEM_END_Z: -100,
  ITEM_SPACING: 5,
  ITEM_SPREAD: 8, // Total width (-4 to 4)
  ITEM_GOOD_CHANCE: 0.6, // 60% chance for good items
  ITEM_ROTATION_SPEED: 0.02,
  ITEM_FLOAT_SPEED: 3,
  ITEM_FLOAT_AMPLITUDE: 0.2,

  // Collision
  COLLISION_RADIUS_Z: 1,
  COLLISION_RADIUS_X: 1,

  // Checkpoint/Gate
  CHECKPOINT_Z: -100,
  GATE_Z: -105,

  // Camera
  CAMERA_FOLLOW_OFFSET_Z: 6,
  CAMERA_SWAY_FACTOR: 0.3,
  CAMERA_LOOK_AHEAD: 10,

  // Scoring
  SCORE_COLLECT: 5,
  SCORE_HIT_PENALTY: 5,
  SCORE_DEBATE_WIN: 50,
  SCORE_DEBATE_LOSE_PENALTY: 10,

  // Timing (milliseconds)
  FEEDBACK_DELAY_CORRECT: 2000,
  FEEDBACK_DELAY_CUSTOM: 3000,
  FLASH_DURATION: 200,

  // World
  FLOOR_WIDTH: 20,
  FLOOR_LENGTH: 200,
  FOG_NEAR: 5,
  FOG_FAR: 40,
  STARS_COUNT: 5000,
} as const;

// =====================================
// UI CONFIGURATION
// =====================================

export const UI_CONFIG = {
  MAX_ARGUMENT_LENGTH: 2000,
  MAX_QUESTION_LENGTH: 1000,
  MAX_PROMPT_LENGTH: 500,
  DEBOUNCE_DELAY: 300,
} as const;

// =====================================
// COLORS
// =====================================

export const COLORS = {
  // Environment
  sky: "#87CEEB",
  ground: "#2d3436",
  path: "#636e72",
  fog: "#1a1a1a",

  // Game elements
  lutherPath: "#fdcb6e", // Gold/Grace
  erasmusPath: "#d63031", // Red/Effort/Blood
  player: "#0984e3",
  playerHead: "#f1c40f",
  obstacle: "#2d3436",

  // Items
  graceItem: "gold",
  graceEmissive: "#f1c40f",
  indulgenceItem: "#c0392b",

  // Gate
  gatePillar: "#bdc3c7",
  gateTop: "#ecf0f1",
  gatePlane: "#2c3e50",

  // UI
  primary: "#f1c40f",
  secondary: "#2c3e50",
  success: "#27ae60",
  error: "#e74c3c",
  warning: "#f39c12",
} as const;

// =====================================
// QUESTIONS
// =====================================

export const QUESTIONS: Question[] = [
  {
    id: 1,
    text: "Matthäus 7,21: 'Nicht alle, die Herr, Herr sagen, kommen ins Himmelreich...'",
    erasmusArgument: "Erasmus sagt: 'Du musst dich anstrengen! Der freie Wille entscheidet sich für das Gute. Gute Werke sind die Bedingung!'",
    correctAnswer: "Der Glaube an Jesus Christus ist das einzige Werk, das Gott fordert.",
    options: [
      { text: "Ich muss mehr gute Taten vollbringen, um Gott zu beeindrucken.", isLuther: false },
      { text: "Ich vertraue allein auf Christus. Gute Werke folgen daraus wie Früchte am Baum.", isLuther: true },
      { text: "Glaube und Werke sind beide gleich wichtig für die Rettung.", isLuther: false }
    ]
  },
  {
    id: 2,
    text: "Wie verhält es sich mit dem 'guten Baum' (Mt 7,17)?",
    erasmusArgument: "Erasmus meint: 'Durch das Tun des Guten wirst du ein guter Baum.'",
    correctAnswer: "Der Mensch muss erst durch Gnade gut gemacht werden, bevor er Gutes tun kann.",
    options: [
      { text: "Der Baum muss erst gut sein, bevor er gute Früchte bringen kann. Gnade kommt zuerst.", isLuther: true },
      { text: "Wenn ich genug gute Früchte produziere, werde ich irgendwann ein guter Baum.", isLuther: false },
      { text: "Es ist ein Synergismus: Ich helfe Gott dabei, mich gut zu machen.", isLuther: false }
    ]
  },
  {
    id: 3,
    text: "Was bedeutet 'Den Willen des Vaters tun'?",
    erasmusArgument: "Es bedeutet, die Gebote moralisch perfekt zu halten.",
    correctAnswer: "Es ist ein soteriologischer Indikativ, kein ethischer Imperativ.",
    options: [
      { text: "Es ist eine moralische Checkliste, die ich abarbeiten muss.", isLuther: false },
      { text: "Es bedeutet primär: Ja zu Jesus sagen (Johannes 6,40).", isLuther: true },
      { text: "Es ist der Versuch, durch Disziplin heilig zu werden.", isLuther: false }
    ]
  }
];

// =====================================
// ERROR MESSAGES
// =====================================

export const ERROR_MESSAGES = {
  NETWORK_ERROR: "Netzwerkfehler. Bitte überprüfe deine Internetverbindung.",
  API_ERROR: "Der Server antwortet nicht. Bitte versuche es später erneut.",
  EMPTY_INPUT: "Bitte gib einen Text ein.",
  INPUT_TOO_LONG: "Der Text ist zu lang.",
  GENERIC_ERROR: "Ein unerwarteter Fehler ist aufgetreten.",
} as const;
