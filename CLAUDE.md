# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Sola Fide: The Luther Run** is a 3D educational game built with React and Three.js that teaches Luther's theology through interactive gameplay. Players navigate theological dilemmas, collect grace points, avoid indulgences, and engage in debates about reformation theology.

### Tech Stack

- **Frontend**: React 19.2.3 + TypeScript 5.8.2 + Vite 6.2.0
- **3D Graphics**: React Three Fiber + React Three Drei + Three.js
- **Backend**: Express 5.2.1 server
- **AI**: Google Gemini API for theological validation and content generation
- **Package Manager**: npm (uses package-lock.json)

## Development Commands

### Running the Application

```bash
# Start frontend dev server (http://localhost:5173)
npm run dev

# Start backend API server (http://localhost:3000)
npm run server

# For full functionality, run both servers simultaneously
```

The Vite dev server proxies `/api/*` requests to the Express backend at `http://localhost:3000`.

### Build & Preview

```bash
npm run build    # Build for production → dist/
npm run preview  # Preview production build
```

### Environment Setup

Create `.env.local` in the project root:

```bash
GEMINI_API_KEY=<your-api-key>
```

## Architecture

### State Management

Global game state managed via **React Context + useReducer** pattern in `context/GameContext.tsx`:

- Centralized state: gameState, score, currentQuestionIndex, resources, inventory
- Actions dispatched: `dispatch({ type: 'ACTION_TYPE', payload: ... })`
- Consumer hook: `useGame()` returns `{ state, dispatch }`

### Game Flow State Machine

```text
MENU → PLAYING → DEBATE → [next level or VICTORY]
     → ART_STUDIO (from MENU)
     → MAP (from MENU)
```

States defined in `types.ts` as `GameState` enum.

### Component Structure

```text
App.tsx (GameProvider wrapper)
└── GameApp.tsx (main orchestrator)
    ├── GameCanvas (3D scene - React Three Fiber)
    │   ├── Player (character mesh)
    │   ├── Floor (ground plane)
    │   ├── Gate (checkpoint)
    │   └── Items (collectibles/obstacles)
    ├── DebateInterface (theological Q&A)
    ├── ArtStudio (AI texture generation)
    └── MapInterface (world map)
```

All major components wrapped in `ErrorBoundary` for fault tolerance.

### Backend API Routes

Express server in `server.ts`:

- `POST /api/check-theology` - Validates theological arguments (Gemini Flash Lite)
- `POST /api/deep-dive` - Deep theological explanations (Gemini Thinking)
- `POST /api/generate-asset` - AI image generation
- `POST /api/edit-asset` - AI image editing

### File Organization

- **`/components`**: React UI components
- **`/context`**: GameContext state management
- **`/hooks`**: Custom React hooks
- **`/services`**: API clients (gemini.ts, audio.ts)
- **`constants.ts`**: All game configuration, colors, questions
- **`types.ts`**: TypeScript interfaces and enums
- **`server.ts`**: Express backend

## Code Conventions

### TypeScript

- Target: ES2022, Module: ESNext
- Path alias: `@/*` → project root
- Strict typing: all components/functions have explicit types
- No `any` without justification
- Type guards for API responses (e.g., `isValidTheologicalResponse`)

### Naming

- **Components**: PascalCase (`GameCanvas.tsx`)
- **Constants**: UPPER_SNAKE_CASE (`GAME_CONFIG`, `COLORS`)
- **Types/Interfaces**: PascalCase (`GameCanvasProps`, `Question`)
- **Functions/Variables**: camelCase (`handleCheckpoint`, `currentScore`)

### React Patterns

- Functional components: `React.FC<PropsType>`
- Props interfaces for all components
- `useCallback` for event handlers to prevent re-renders
- `useRef` for Three.js object references
- `useFrame` (from @react-three/fiber) for animation loops

### Constants Management

All configuration in `constants.ts`:

- **`COLORS`**: Hex color palette (primary, secondary, player, items, etc.)
- **`GAME_CONFIG`**: Numeric parameters (scores, speeds, collision radii, camera settings)
- **`QUESTIONS`**: Theological debate questions with context

### Error Handling

- Server: try-catch with `console.error`, return default error objects
- Client: ErrorBoundary components for React errors
- API fallbacks: default responses (e.g., `DEFAULT_THEOLOGICAL_ERROR`)

## Key Architectural Patterns

### Three.js Integration

- Use `<Canvas>` from @react-three/fiber in `GameCanvas.tsx`
- Sub-components render Three.js primitives: `<mesh>`, `<boxGeometry>`, `<meshStandardMaterial>`
- Animation via `useFrame((state, delta) => { ... })`
- Refs for imperative updates: `playerRef.current.position.x = ...`

### API Communication

- Client: `services/gemini.ts` functions call backend
- Backend: Express routes use `@google/genai` library
- Request/Response: JSON, validated with type guards
- Error handling: always return valid response structure even on error

### State Updates

```typescript
// Correct: dispatch actions
dispatch({ type: 'COLLECT_GRACE' });
dispatch({ type: 'SET_CUSTOM_TEXTURE', payload: imageUrl });

// Incorrect: direct mutation
state.score += 10; // ❌ Never mutate state directly
```

## Common Development Tasks

### Adding a New Game Feature

1. Define types in `types.ts` if needed
2. Add configuration to `constants.ts`
3. Update GameContext state/actions if global state required
4. Create/modify components in `/components`
5. Wire up in `GameApp.tsx`

### Adding a New AI Feature

1. Add route in `server.ts` with try-catch
2. Create client function in `services/gemini.ts`
3. Update component to call service function
4. Handle loading/error states in UI

### Modifying Game State

1. Add action type to `Action` union in `GameContext.tsx`
2. Implement case in `gameReducer`
3. Dispatch from component: `dispatch({ type: 'NEW_ACTION', ... })`

### Adding New Colors/Config

1. Add to `COLORS` or `GAME_CONFIG` in `constants.ts`
2. Import and use: `import { COLORS, GAME_CONFIG } from './constants'`
3. Never hardcode values in components

## Testing & Verification

Before committing:

1. **Build**: `npm run build` must succeed with no TypeScript errors
2. **Run**: Start both dev servers and verify functionality
3. **Console**: Check browser console for errors
4. **Types**: Ensure all new code has proper TypeScript types
5. **State**: Verify state changes use dispatch, not mutation
6. **Constants**: New config values in `constants.ts`, not inline

## AI Model Usage

The project uses multiple Gemini models:

- **gemini-2.5-flash-lite-latest**: Fast theological validation
- **gemini-2.0-flash-thinking-exp-01-21**: Deep theological explanations with reasoning
- **gemini-2.0-flash**: Image generation/editing

Note: Some model names in `server.ts` may be experimental or require specific API access.
