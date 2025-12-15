# Task Completion Checklist

When completing any code changes, ensure:

## 1. Build Verification
- Run `npm run build` to verify no TypeScript errors
- Check for type errors and fix them

## 2. Development Testing
- Run `npm run dev` and verify the app starts without errors
- If backend changes: Run `npm run server` and test API endpoints
- Check browser console for runtime errors

## 3. Type Safety
- All new functions/components must have proper TypeScript types
- No `any` types without justification
- Props interfaces defined for all components

## 4. State Management
- Use GameContext for global state changes
- Dispatch actions with proper types
- Don't mutate state directly

## 5. Error Handling
- Add ErrorBoundary wrapping for new UI sections
- Server endpoints must have try-catch blocks
- Provide user-friendly fallback messages

## 6. Constants
- New configuration values go in `constants.ts`
- Colors in `COLORS` object
- Game parameters in `GAME_CONFIG`

## 7. Dependencies
- After adding packages: Commit `package.json` and `package-lock.json`
- Document any new environment variables needed
