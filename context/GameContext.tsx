import React, { createContext, useContext, useReducer, ReactNode, Dispatch } from 'react';
import { GameState, Question } from '../types';
import { GAME_CONFIG, QUESTIONS } from '../constants';

// State Definition
interface State {
  gameState: GameState;
  currentQuestionIndex: number;
  score: number;
  health: number;         // New: heart-based health
  maxHealth: number;      // New: max hearts
  customTexture: string | null;
  flash: 'red' | 'green' | null;
  // Additional features
  resources: {
    scholarlyQuotes: number;
    ink: number;
  };
  impactScore: number;
  inventory: string[];
}

const initialState: State = {
  gameState: GameState.MENU,
  currentQuestionIndex: 0,
  score: 0,
  health: GAME_CONFIG.MAX_HEALTH,
  maxHealth: GAME_CONFIG.MAX_HEALTH,
  customTexture: null,
  flash: null,
  resources: {
    scholarlyQuotes: 0,
    ink: 100,
  },
  impactScore: 0,
  inventory: [],
};

// Actions
type Action =
  | { type: 'START_GAME' }
  | { type: 'SET_GAME_STATE'; payload: GameState }
  | { type: 'COLLECT_GRACE' }
  | { type: 'TAKE_DAMAGE' }
  | { type: 'DEBATE_WIN' }
  | { type: 'DEBATE_LOSE' }
  | { type: 'NEXT_LEVEL' }
  | { type: 'SET_CUSTOM_TEXTURE'; payload: string }
  | { type: 'CLEAR_FLASH' }
  | { type: 'ADD_RESOURCE'; payload: { type: 'scholarlyQuotes' | 'ink'; amount: number } }
  | { type: 'SPEND_RESOURCE'; payload: { type: 'scholarlyQuotes' | 'ink'; amount: number } }
  | { type: 'ADD_IMPACT'; payload: number }
  | { type: 'HEAL'; payload: number }
  | { type: 'RESET_GAME' };

// Reducer
const gameReducer = (state: State, action: Action): State => {
  switch (action.type) {
    case 'START_GAME':
      return {
        ...initialState,
        gameState: GameState.PLAYING,
      };
    case 'SET_GAME_STATE':
      return { ...state, gameState: action.payload };
    case 'COLLECT_GRACE':
      return {
        ...state,
        score: state.score + GAME_CONFIG.SCORE_COLLECT,
        flash: 'green',
      };
    case 'TAKE_DAMAGE':
      const newHealth = Math.max(0, state.health - 1);
      return {
        ...state,
        health: newHealth,
        flash: 'red',
        // Game over if health reaches 0
        gameState: newHealth === 0 ? GameState.GAME_OVER : state.gameState,
      };
    case 'HEAL':
      return {
        ...state,
        health: Math.min(state.maxHealth, state.health + action.payload),
      };
    case 'DEBATE_WIN':
      return {
        ...state,
        score: state.score + GAME_CONFIG.SCORE_DEBATE_WIN,
        // Restore 2 health on debate win
        health: Math.min(state.maxHealth, state.health + 2),
      };
    case 'DEBATE_LOSE':
      return {
        ...state,
        health: Math.max(0, state.health - 2),
      };
    case 'NEXT_LEVEL':
      if (state.currentQuestionIndex < QUESTIONS.length - 1) {
        return {
          ...state,
          currentQuestionIndex: state.currentQuestionIndex + 1,
          gameState: GameState.PLAYING,
        };
      } else {
        return {
          ...state,
          gameState: GameState.VICTORY,
        };
      }
    case 'SET_CUSTOM_TEXTURE':
      return { ...state, customTexture: action.payload };
    case 'CLEAR_FLASH':
      return { ...state, flash: null };
    case 'ADD_RESOURCE':
      return {
        ...state,
        resources: {
          ...state.resources,
          [action.payload.type]: state.resources[action.payload.type] + action.payload.amount,
        },
      };
    case 'SPEND_RESOURCE':
      return {
        ...state,
        resources: {
          ...state.resources,
          [action.payload.type]: Math.max(0, state.resources[action.payload.type] - action.payload.amount),
        },
      };
    case 'ADD_IMPACT':
      return {
        ...state,
        impactScore: state.impactScore + action.payload,
      };
    case 'RESET_GAME':
      return initialState;
    default:
      return state;
  }
};

// Context
const GameContext = createContext<{ state: State; dispatch: Dispatch<Action> } | undefined>(undefined);

export const GameProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(gameReducer, initialState);

  return (
    <GameContext.Provider value={{ state, dispatch }}>
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
};
