# Code Style & Conventions

## TypeScript Configuration
- Target: ES2022
- Module: ESNext with bundler resolution
- JSX: react-jsx
- Path alias: `@/*` maps to project root
- `allowImportingTsExtensions: true`, `noEmit: true` for Vite

## Naming Conventions
- **Components**: PascalCase (e.g., `GameCanvas.tsx`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `GAME_CONFIG`, `COLORS`)
- **Interfaces/Types**: PascalCase (e.g., `GameCanvasProps`, `Question`)
- **Functions**: camelCase (e.g., `handleCheckpoint`, `playSound`)
- **Hooks**: camelCase with `use` prefix (e.g., `useGame`, `useCanvasDrawing`)

## React Patterns
- **Functional components**: Use `React.FC<PropsType>`
- **Hooks**: `useCallback` for event handlers, `useEffect` for side effects
- **Context**: `useContext` for consuming GameContext
- **Refs**: `useRef` for Three.js objects and DOM references

## Constants Organization
All in `constants.ts`:
- `COLORS`: Color palette (hex strings)
- `GAME_CONFIG`: Numeric game parameters (scores, speeds, bounds)
- `UI_CONFIG`: UI-specific settings
- `QUESTIONS`: Game content (theological questions)

## Error Handling
- **Server**: Try-catch with console.error, return default error objects
- **Client**: ErrorBoundary components for React error handling
- **Type safety**: Type guards (e.g., `isValidTheologicalResponse`)
- **Fallbacks**: Default error messages/objects for API failures

## File Organization
- Component logic stays in component files
- Shared types in `types.ts`
- Shared constants in `constants.ts`
- Service functions abstracted to `/services`
- Context providers in `/context`
