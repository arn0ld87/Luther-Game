export enum GameState {
  MENU = 'MENU',
  PLAYING = 'PLAYING',
  DEBATE = 'DEBATE',
  GAME_OVER = 'GAME_OVER',
  VICTORY = 'VICTORY',
  ART_STUDIO = 'ART_STUDIO'
}

export interface Question {
  id: number;
  text: string;
  erasmusArgument: string;
  correctAnswer: string; // The Lutheran perspective
  options: { text: string; isLuther: boolean }[];
}

export interface ChatMessage {
  sender: 'user' | 'luther' | 'erasmus' | 'system';
  text: string;
}

export enum ImageSize {
  S_1K = '1K',
  S_2K = '2K',
  S_4K = '4K'
}