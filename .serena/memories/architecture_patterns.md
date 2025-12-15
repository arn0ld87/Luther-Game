# Architecture & Patterns

## State Management
Uses React Context API with useReducer pattern:
- **GameContext** (`context/GameContext.tsx`): Centralized game state
- **Actions**: Dispatched via `dispatch({ type: 'ACTION_TYPE', payload: ... })`
- State includes: gameState, currentQuestionIndex, score, resources, inventory, etc.

## Game States (enum in types.ts)
- MENU: Main menu
- PLAYING: Active 3D runner gameplay
- DEBATE: Theological debate interface
- ART_STUDIO: AI-powered texture generation
- VICTORY: End screen
- GAME_OVER: Failure state
- MAP: World map view

## Component Architecture
- **ErrorBoundary**: Wraps all major components for fault tolerance
- **GameApp**: Main orchestrator, manages game flow and transitions
- **GameCanvas**: 3D scene with React Three Fiber
  - Contains Player, Floor, Gate, Item sub-components
  - Uses refs and useFrame for animation
- **DebateInterface**: Theological debate UI
- **ArtStudio**: AI image generation interface
- **MapInterface**: World map display

## Service Layer Pattern
Services in `/services`:
- **gemini.ts**: Client-side API calls to backend
- **audio.ts**: Sound effects management
- Backend in `server.ts`: Express routes for AI operations

## API Routes (Express Backend)
- `POST /api/check-theology`: Validates theological arguments (Gemini Flash Lite)
- `POST /api/deep-dive`: Deep theological explanations (Gemini Thinking)
- `POST /api/generate-asset`: AI image generation
- `POST /api/edit-asset`: AI image editing

## TypeScript Conventions
- Strict typing with interfaces in `types.ts`
- Props interfaces for all components (e.g., GameCanvasProps)
- Enum for GameState
- Type guards for API responses (e.g., `isValidTheologicalResponse`)
