# Repository Audit — Sola Fide: The Luther Run

Stand: 2026-06-30, Branch `chore/game-foundation-planning`, lokal verifiziert (macOS, `gh` v2.93.0, Node v26.0.0).

## 1. Ist-Zustand: 2D statt 3D

Das Repo ist ein reines **2D-Canvas-Spiel**, nicht das in `CLAUDE.md`/`metadata.json` beschriebene 3D-Spiel:

- `package.json` enthält **keine** Three.js- oder `@react-three/fiber`-Dependency. Dependencies: `@google/genai`, `cors`, `dotenv`, `express`, `react`, `react-dom`. DevDependencies: `@types/cors`, `@types/express`, `@types/node`, `@vitejs/plugin-react`, `concurrently`, `tsx`, `typescript`, `vite`.
- Commit `530678f` führte `components/Game2DCanvas.tsx`, `components/HUD2D.tsx`, `engine/Player2D.ts`, `engine/Enemy.ts`, `engine/Combat.ts`, `engine/EnemyRenderer.ts`, `engine/ItemRenderer.ts`, `engine/TileRenderer.ts` ein.
- `App.tsx` rendert nur `<GameProvider><GameApp /></GameProvider>` — kein `<Canvas>` von React Three Fiber.
- `CLAUDE.md` (sowohl der committete Stand als auch der aktuell uncommittete Arbeitsstand) und `metadata.json` (`"Ein 3D-Lernspiel über Luthers Exegese von Matthäus 7,21..."`) sind **nachweislich veraltet** und beschreiben weiterhin "3D educational game (React Three Fiber/Three.js)". Dieser Audit-Befund ist unabhängig vom Godot-Migrationsauftrag und sollte bei Gelegenheit separat korrigiert werden (nicht Teil dieser PR, da reine Doku-Korrektur am bestehenden 2D-Code keine Migrationsentscheidung voraussetzt).

## 2. Theologischer Content-Stand (Grundlage für GDD/Content-Policy)

`constants.ts:143-159` definiert ein `QUESTIONS`-Array (Typ in `types.ts:138-142`: `{ id, text, context }`) mit **3 Einträgen**, nicht mit einer breiten Themenpalette:

1. Werkgerechtigkeit / Matthäus 7,21
2. Päpstlicher Primat / Matthäus 16,18
3. Freier Wille / Römer 3,23

Begriffe wie "Ablässe" oder "95 Thesen" kommen in den aktuellen 3 Einträgen wörtlich **nicht** vor, auch wenn das Gesamtthema (Reformationstheologie, Sola Fide) zutrifft. GDD und Content-Policy müssen von diesem schmalen Ist-Stand ausgehen, nicht von einer angenommenen breiteren Abdeckung — die Erweiterung des Fragenkatalogs ist explizit Folgearbeit (Stage-B-Issue).

## 3. Build- und Typecheck-Ergebnis (real ausgeführt)

Anders als in einer vorherigen, sandboxed Planungssitzung angenommen, sind `npm`, `node` (v26.0.0) und `gh` (v2.93.0) in dieser lokalen macOS-Umgebung real verfügbar — siehe Abschnitt 5.

```
$ npm install
added 241 packages, and audited 242 packages in 19s
12 vulnerabilities (1 low, 3 moderate, 6 high, 2 critical)

$ npm run build
> vite build
vite v6.4.1 building for production...
✓ 49 modules transformed.
(!) services/audio.ts is dynamically imported by components/DebateInterface.tsx
    but also statically imported by GameApp.tsx — dynamic import will not move
    module into another chunk.
dist/index.html                  0.75 kB │ gzip:  0.47 kB
dist/assets/index-CfFzl3CY.js  242.87 kB │ gzip: 75.37 kB
✓ built in 3.76s
Exit code: 0
```

`npm run build` läuft **erfolgreich durch** (Exit 0). Das widerlegt die Annahme einer vorherigen Session, der Build könne nicht beurteilt werden — er funktioniert, sobald `node_modules` installiert ist.

**Aber:** `npm run build` ruft nur `vite build` auf, das mit esbuild transpiliert, **ohne vollständige Typprüfung**. `CLAUDE.md` behauptet "production build, must pass with zero TS errors" — das stimmt für den Vite-Build selbst, verdeckt aber reale Typfehler:

```
$ npx tsc --noEmit
components/ErrorBoundary.tsx(20,10): error TS2339: Property 'state' does not exist on type 'ErrorBoundary'.
components/ErrorBoundary.tsx(33,10): error TS2339: Property 'setState' does not exist on type 'ErrorBoundary'.
... (insgesamt 9 Fehler in ErrorBoundary.tsx, vermutlich fehlende Klassen-Generics bei React.Component)
hooks/useCanvasDrawing.ts(9,14): error TS2503: Cannot find namespace 'React'.
... (3 Fehler in useCanvasDrawing.ts, vermutlich fehlender React-Type-Import)
```

**12 echte TypeScript-Fehler** insgesamt, die `npm run build` nicht erkennt. Dokumentiert als Risiko/Backlog-Item (Stage B), nicht in dieser Doku-PR behoben — Scope-Trennung zwischen Audit/Planung und Codeänderung.

## 4. Bereits vorhandenes Asset-Material für Stage C

Im Arbeitsverzeichnis liegt `godot_assets/` (vom Nutzer bestätigt, bewusst angelegt, **nicht** committet, jetzt in `.gitignore`):

- `godot_assets/buildings/kenney_castle-kit/` — Kenney Castle Kit (Modelle, Previews, Lizenztext)
- `godot_assets/buildings/quaternius_medieval-village-megakit/` — Quaternius Medieval Village MegaKit
- `godot_assets/_downloads/` — Original-ZIPs der beiden Kits
- `godot_assets/{props,items,characters}/` — angelegt, noch leer
- Gesamtgröße: ~331 MB

Beide Kits sind als kostenlose, üblicherweise CC0-/Public-Domain-lizenzierte Asset-Packs bekannt (Kenney: i. d. R. CC0; Quaternius: i. d. R. CC0) — die tatsächliche Lizenzdatei in `kenney_castle-kit/License.txt` ist vorhanden und muss vor Verwendung in Stage C wörtlich geprüft werden, nicht angenommen. Diese Assets sind eine reale, bereits vorbereitete Grundlage für die Godot-Bootstrap-Szene in Stage C (Gebäude/Burg-Thematik passt zu einem Reformations-/Wittenberg-Setting) und sollten in `docs/architecture/game-architecture.md` und der Stage-C-Planung referenziert werden. `godot_assets/` bleibt git-ignoriert; eine spätere Entscheidung (Stage C oder eigenes Issue) muss klären, ob/wie Teilmengen als Godot-`.import`-Ressourcen ins `/game`-Verzeichnis übernommen werden.

## 5. GitHub-Ist-Zustand (real per `gh` CLI verifiziert)

- Remote: `git@github.com:arn0ld87/Luther-Game.git`
- Issues: 0 offen
- Pull Requests: 2, beide `MERGED` (#1 "Review and improve code quality", #2 "Refactor Architecture and Add New Features")
- Labels (9, Standard-Set): `bug`, `documentation`, `duplicate`, `enhancement`, `good first issue`, `help wanted`, `invalid`, `question`, `wontfix`
- Milestones: 0
- Kein `.github/`-Verzeichnis (keine Templates, keine Workflows)

**Wichtige Korrektur gegenüber einer vorherigen Planungssitzung:** Diese lief in einer Sandbox ohne `gh`-CLI und ohne Label-/Milestone-Erstellungs-Tools und kam daher zu dem Schluss, Labels/Milestones könnten in dieser Session nicht angelegt werden. In der **aktuellen, realen lokalen Umgebung ist `gh` v2.93.0 installiert und authentifiziert** — `gh label create` und `gh api .../milestones -X POST` funktionieren hier tatsächlich. Die Tool-Lücke aus der vorherigen Session besteht hier nicht. Ob Stage B die Labels/Milestones-Taxonomie real anlegt oder weiterhin nur dokumentiert, ist eine offene Entscheidung mit dem Auftraggeber (sichtbare Mutation an einem Repo mit echtem Kollaborator `arn0ld87` — siehe `docs/planning/backlog.md`).

## 6. Risiken (Kurzfassung, Details siehe `docs/planning/risk-register.md`)

| Risiko | Schwere | Hinweis |
|---|---|---|
| 12 TS-Fehler von `npm run build` nicht erkannt | Mittel | `vite build` typprüft nicht; CI sollte `tsc --noEmit` ergänzen |
| 12 npm-Audit-Vulnerabilities (2 kritisch, 6 hoch) | Mittel–Hoch | Transitive Deps, vor Produktivbetrieb klären |
| `CLAUDE.md`/`metadata.json` beschreiben falsches Tech-Stack (3D) | Niedrig | Verwirrt neue Mitwirkende, separate Korrektur empfohlen |
| `godot_assets/` 331 MB lokal, nicht versioniert | Niedrig | Bewusst git-ignoriert; Lizenzprüfung vor Stage-C-Nutzung nötig |
| Asset-Lizenzen (Kenney/Quaternius) nicht textuell verifiziert | Niedrig–Mittel | `License.txt` vorhanden, vor Verwendung lesen statt annehmen |

## 7. Annahmen

- Diese Audit-Session läuft lokal (macOS, Darwin), nicht im selben Sandbox-Kontext wie eine vorherige Planungssitzung. Tool-Verfügbarkeit (`gh`, `npm`, `node`) wurde live geprüft, nicht aus der vorherigen Session übernommen.
- Die Godot-Versionsermittlung (aktuelle stabile 4.x-Release) erfolgt erst zur Implementierungszeit von Stage C, nicht hier — siehe `docs/architecture/adr/001-godot-desktop-engine.md`.
