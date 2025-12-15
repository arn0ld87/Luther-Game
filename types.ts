
export enum GameState {
  MENU,
  PLAYING,
  DEBATE,
  ART_STUDIO,
  VICTORY,
  GAME_OVER,
  MAP // Added MAP state
}

export type ImageSize = "256x256" | "512x512" | "1024x1024";

export interface Question {
  id: number;
  text: string;
  context: string;
}

// Strictly typed props for components (examples)
export interface GameCanvasProps {
  gameState: GameState;
  onReachCheckpoint: () => void;
  customTexture: string | null;
  onCollect: () => void;
  onHit: () => void;
}

export interface DebateInterfaceProps {
  question: Question;
  onComplete: (success: boolean) => void;
}

export interface ArtStudioProps {
  onClose: () => void;
  onApplyTexture: (url: string) => void;
}
