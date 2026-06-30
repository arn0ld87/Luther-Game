# CLAUDE.md

Guidance for Claude Code when working in this repo.

## Project Overview

**Sola Fide: The Luther Run** — educational game teaching Reformation theology through gameplay. Currently a **2D-Canvas web prototype** (React 19 + Vite, `components/Game2DCanvas.tsx` + `engine/`), **not** 3D/R3F — older docs referencing Three.js are outdated. An Express backend proxies the Gemini API for theological validation and AI asset generation.

Active migration: the web prototype is being replaced by a Godot 4.7 desktop engine under `game/` (Bootstrap-Stage, milestone M0). See [`game/README.md`](./game/README.md) and [`.github/workflows/godot-validate.yml`](./.github/workflows/godot-validate.yml).

## Commands

- `npm run dev` — Vite dev server (localhost:5173), proxies `/api/*` to the backend
- `npm run server` — Express backend (localhost:3000); run both together, frontend alone can't validate theology answers
- `npm run build` — production build, **must pass with zero TS errors**
- `npm run preview` — preview production build
- No test suite configured — verification is build + manual run, see Workflow below
- Godot editor (not committed): `./Godot.app/Contents/MacOS/Godot --path game` (GUI) or `--headless --path game --quit` (CI/scripts). See `game/README.md` for download + SHA512 verification.

## Environment

- `.env.local` (gitignored) needs `GEMINI_API_KEY`
- Godot editor binary lives outside the repo (`.godot-editor/` is gitignored); each contributor downloads and verifies it themselves

## Architecture

- State: React Context + `useReducer` in `context/GameContext.tsx`, consumed via `useGame()`. All updates go through `dispatch({ type, payload })`
- Game flow state machine (`types.ts` `GameState` enum): MENU → PLAYING → DEBATE → next level/VICTORY; MENU → ART_STUDIO / MAP
- 2D rendering via `components/Game2DCanvas.tsx` (SNES-style 256×224, scale 3) backed by `engine/` (`Player2D`, `Enemy`, `Combat`, `EnemyRenderer`, `ItemRenderer`, `TileRenderer`)
- `constants.ts` holds all tunables: `COLORS`, `GAME_CONFIG` (scores/speeds/collision radii/canvas/camera), `QUESTIONS` (theological debate content)
- `server.ts` exposes `/api/check-theology`, `/api/deep-dive`, `/api/generate-asset`, `/api/edit-asset` — each Gemini model is pinned per-route (validation vs. deep reasoning vs. image gen); don't swap models without checking the route's purpose
- Godot side (`game/`): `project.godot` (Forward+ renderer, main scene `res://scenes/bootstrap.tscn`), `scenes/`, `scripts/`, `tests/` — separate from the web prototype

## Hard Rules

- **IMPORTANT:** never mutate `GameContext` state directly — always dispatch an action
- **NEVER** hardcode colors, scores, speeds, or theological questions inline in components — they belong in `constants.ts`
- **NEVER** commit `.env.local` or log `GEMINI_API_KEY`
- Every `server.ts` route must try/catch and return a valid fallback object (e.g. `DEFAULT_THEOLOGICAL_ERROR`) — never let a Gemini call throw raw to the client
- Path alias `@/*` resolves to project root

## Workflow

- Before claiming a change works: `npm run build` must succeed, then run both dev servers and check the browser console
- Minimal diffs for small fixes — no drive-by refactors of unrelated components
- New top-level UI goes inside an `ErrorBoundary`
- For larger interventions (new subsystems, larger refactors, multi-file architecture changes): run an additional review pass with the Opus model over the diff before opening the PR

## Token Efficiency
- Never re-read files you just wrote or edited. You know the contents.
- Never re-run commands to "verify" unless the outcome was uncertain.
- Don't echo back large blocks of code or file contents unless asked.
- Batch related edits into single operations. Don't make 5 edits when 1 handles it.
- Skip confirmations like "I'll continue..." Just do it.
- If a task needs 1 tool call, don't use 3. Plan before acting.
- Do not summarize what you just did unless the result is ambiguous or you need additional input.
