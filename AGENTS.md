# AGENTS.md

Guidance for AI agent runtimes (Claude Code, Codex, etc.) working in this repo.
Intentionally lean — the detailed guidance lives in [`CLAUDE.md`](./CLAUDE.md) and
[`game/README.md`](./game/README.md).

## Project

**Sola Fide: The Luther Run** — educational game on Reformation theology.

- **Web prototype (repo root):** React 19 + Vite 6 + Express 5 + `@google/genai`. 2D Canvas
  (`Game2DCanvas` + `engine/`), **not** 3D/R3F. State via `GameContext` + `useReducer`.
- **Godot migration (`game/`):** Godot 4.7-stable, Forward+ renderer, main scene
  `res://scenes/bootstrap.tscn`. Bootstrap-Stage (milestone M0). Godot editor is **not** committed.

## Stack-Map

```text
/                  Web prototype (React + Vite + Express)
├── App.tsx GameApp.tsx   Provider wrapper + orchestrator
├── components/           Game2DCanvas, HUD2D, DebateInterface, ArtStudio, MapInterface, ErrorBoundary
├── engine/               Player2D, Enemy, Combat, EnemyRenderer, ItemRenderer, TileRenderer
├── context/              GameContext.tsx (React Context + useReducer)
├── hooks/ services/      Hooks + API clients (gemini, audio)
├── constants.ts types.ts Tunables, colors, questions, enums
├── server.ts             Express backend, Gemini proxy (4 routes, model-pinned per route)
└── game/                 Godot 4.7 project (project.godot, scenes/, scripts/, tests/)
```

## Commands

```bash
npm install          # install web deps
npm run dev          # Vite frontend → :5173 (proxies /api/* to :3000)
npm run server       # Express backend → :3000
npm run build        # production build, must pass with zero TS errors
npm run preview      # preview production build

# Godot (editor binary downloaded + SHA512-verified locally, not in repo)
./Godot.app/Contents/MacOS/Godot --path game           # editor GUI
./Godot.app/Contents/MacOS/Godot --headless --path game --quit   # CI/scripts
```

## Environment

- `.env.local` (gitignored) requires `GEMINI_API_KEY`. Never commit or log it.

## Hard Rules

- Never mutate `GameContext` state directly — always `dispatch` an action.
- Never hardcode colors, scores, speeds, or theological questions inline — they belong in
  `constants.ts`.
- Never commit `.env.local` or log `GEMINI_API_KEY`.
- Every `server.ts` route must try/catch and return a valid fallback object
  (e.g. `DEFAULT_THEOLOGICAL_ERROR`) — never let a Gemini call throw raw to the client.
- Don't swap per-route Gemini models without checking the route's purpose.
- Path alias `@/*` resolves to project root.
- Don't reference Three.js/R3F as current — the prototype is 2D Canvas. Older 3D docs are stale.

## Workflow

- No direct pushes to `main` — feature branches + PR review.
- Before claiming a change works: `npm run build` must succeed, then run both dev servers and
  check the browser console. No test suite — verification is build + manual run.
- Minimal diffs for small fixes — no drive-by refactors of unrelated components.
- New top-level UI goes inside an `ErrorBoundary`.
- Larger interventions (new subsystems, larger refactors, multi-file architecture changes):
  run an additional review pass over the diff before opening the PR.
- Godot changes: verify via `--headless --path game --quit` and the
  `godot-validate.yml` workflow.

## References

- [`CLAUDE.md`](./CLAUDE.md) — full Claude Code guidance
- [`game/README.md`](./game/README.md) — Godot setup, download, SHA512 verification
- [`docs/`](./docs/) — architecture & planning docs (migration ADRs, roadmap)
- [`.github/workflows/godot-validate.yml`](./.github/workflows/godot-validate.yml) — Godot CI