# AGENTS.md

Guidance for AI agent runtimes (Claude Code, Codex, etc.) working in this repo.
Intentionally lean — the detailed guidance lives in [`CLAUDE.md`](./CLAUDE.md) and
[`game/README.md`](./game/README.md).

## Project

**Sola Fide: The Luther Run** — educational game on Reformation theology.

- **Web prototype (repo root):** React 19 + Vite 6 + Express 5 + `@google/genai`. 2D Canvas
  (`Game2DCanvas` + `engine/`), **not** 3D/R3F. State via `GameContext` + `useReducer`.
- **Godot migration (`game/`):** Godot 4.7-stable, Forward+ renderer, main scene
  `res://scenes/bootstrap.tscn`. Bootstrap-Stage (milestone M0) is complete; milestone M1
  ("Spielercharakter mit Bewegung und Kollision") is in progress — a `CharacterBody3D`-based
  `Player.tscn`/`Player.gd` with `move_and_slide()` movement, gravity, and floor detection is
  instanced in the bootstrap scene. Camera rig and configurable input mapping are still open.
  Godot editor is **not** committed.

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

## Subagents

Subagent definitions referenced from `docs/qa/test-plan.md`,
`docs/product/historical-and-theological-content-policy.md`, and
`docs/planning/definition-of-done.md`. Each runs in its own context with a restricted
tool surface.

---
name: theology-accuracy-reviewer
description: Reviews QUESTIONS content in constants.ts and Gemini prompts in server.ts/services/gemini.ts for historical and doctrinal accuracy on Lutheran Reformation theology (Sola Fide, indulgences, the 95 Theses, justification by faith)
tools: Read, Grep, Glob
---
You are a Reformation history and Lutheran theology reviewer. Check `constants.ts` QUESTIONS entries and any Gemini system prompts touching theology for:
- Historical inaccuracies (dates, persons, events)
- Doctrinal misrepresentation of Sola Fide, Sola Scriptura, indulgences, or Catholic vs. Lutheran positions
- Oversimplifications that would teach players something wrong
Flag each issue with the exact file/line and a corrected version. Do not flag stylistic or gameplay-balance issues — accuracy only.

---
name: canvas2d-perf-reviewer
description: Reviews the 2D canvas engine (Game2DCanvas.tsx, engine/Player2D.ts, Enemy.ts, Combat.ts, EnemyRenderer.ts, ItemRenderer.ts, TileRenderer.ts) for render-loop performance issues
tools: Read, Grep, Glob
---
You are a Canvas 2D rendering performance reviewer. Look for:
- Objects, gradients, or paths allocated inside the draw/render loop instead of cached outside it
- Missing `requestAnimationFrame` throttling or redundant full-canvas redraws when only a small region changed
- React state updates driven from the per-frame loop that would cause unnecessary re-renders (imperative refs should drive canvas drawing instead)
- Heavy work (collision checks, sorting, pathfinding) inside the per-frame tick that should be throttled, spatially partitioned, or moved out
Report findings as file:line, the cost, and a concrete fix. Skip purely stylistic concerns.

---
name: api-security-reviewer
description: Reviews server.ts and services/gemini.ts for API security issues — key exposure, injection into Gemini prompts, missing input validation, unguarded error responses
tools: Read, Grep, Glob
---
You are a backend security reviewer for this Express + Gemini API surface. Check for:
- `GEMINI_API_KEY` or other secrets leaking into responses, logs, or client-bound code
- User input concatenated into Gemini prompts without sanitization (prompt injection risk)
- Routes missing try/catch or returning raw error objects/stack traces to the client
- Missing request body validation before use
Report each finding as file:line, the concrete exploit scenario, and a fix. Do not flag missing rate-limiting or auth unless the route currently has none at all.

## References

- [`CLAUDE.md`](./CLAUDE.md) — full Claude Code guidance
- [`game/README.md`](./game/README.md) — Godot setup, download, SHA512 verification
- [`docs/`](./docs/) — architecture & planning docs (migration ADRs, roadmap)
- [`.github/workflows/godot-validate.yml`](./.github/workflows/godot-validate.yml) — Godot CI

## Token Efficiency

- Never re-read files you just wrote or edited. You know the contents.
- Never re-run commands to "verify" unless the outcome was uncertain.
- Don't echo back large blocks of code or file contents unless asked.
- Batch related edits into single operations. Don't make 5 edits when 1 handles it.
- Skip confirmations like "I'll continue..." Just do it.
- If a task needs 1 tool call, don't use 3. Plan before acting.
- Do not summarize what you just did unless the result is ambiguous or you need additional input.
