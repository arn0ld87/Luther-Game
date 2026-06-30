# Mitwirkenden-Workflow

Stand: 2026-06-30. Gilt für beide Codebasen in diesem Repository: das bestehende
2D-Web-Spiel im Root-Verzeichnis (React 19 + Express 5) und das geplante/im Aufbau
befindliche Godot-4.x-Desktop-Spiel unter `/game` (additiv, siehe
[ADR 001](../architecture/adr/001-godot-desktop-engine.md)). Dieses Dokument
konkretisiert die Hard Rules aus [`CLAUDE.md`](../../CLAUDE.md) für Menschen und
KI-Agenten gleichermaßen.

## Grundprinzip: PR-Workflow ist Default

`CLAUDE.md` legt fest: **niemals direkt auf `main` committen.** Das gilt ausnahmslos,
auch für kleine Fixes und auch für Dokumentationsänderungen. Jede Änderung läuft über:

1. Branch von `main` abzweigen
2. Commits auf dem Branch
3. Pull Request gegen `main`
4. Review (siehe unten)
5. Merge über GitHub (kein lokales Force-Push auf `main`, kein `--no-verify`)

`main` ist damit immer in einem deploybaren, geprüften Zustand. Direkte Pushes auf
`main` werden nicht akzeptiert, auch nicht "schnell zwischendurch".

## Branch-Namenskonvention

Schema: `<typ>/<kurzbeschreibung-in-kebab-case>`

| Typ | Verwendung | Beispiel |
|---|---|---|
| `feat/` | Neue Funktionalität | `feat/debate-followup-questions` |
| `fix/` | Bugfix | `fix/theology-validation-timeout` |
| `chore/` | Wartung, Tooling, Planung ohne Feature-Code | `chore/game-foundation-planning` |
| `docs/` | Reine Dokumentationsänderung | `docs/update-contributing-guide` |
| `refactor/` | Strukturänderung ohne Verhaltensänderung | `refactor/extract-combat-engine` |
| `test/` | Tests hinzufügen/ändern (sobald eine Testsuite existiert) | `test/player2d-collision` |
| `ci/` | CI/CD-Pipeline-Änderungen | `ci/add-godot-validate-workflow` |

Für Godot-spezifische Arbeit zusätzlich `game-` als Infix verwenden, wenn die
Unterscheidung zum Web-Teil sonst nicht aus der Beschreibung hervorgeht, z. B.
`feat/game-player-controller` statt nur `feat/player-controller`. Kurzbeschreibung:
sprechend, englisch oder deutsch konsistent zum übrigen Branch-Namen, keine
Ticket-IDs erzwingen (es gibt aktuell keine Milestones/Ticket-Nummerierung im Repo).

## Commit-Konventionen

Dieses Repo folgt bereits faktisch [Conventional Commits](https://www.conventionalcommits.org/)
(siehe Commit-Historie, z. B. `feat: Implement initial 2D game engine components...`).
Format:

```
<typ>: <kurze Zusammenfassung im Imperativ, max. ~72 Zeichen>

<optionaler Fließtext: Warum, nicht nur Was>
```

Erlaubte Typen: `feat`, `fix`, `docs`, `chore`, `refactor`, `test`, `ci`, `perf`,
`style`. Ein Commit = eine inhaltlich abgeschlossene Änderung. Keine
Sammel-Commits, die Web- und Godot-Änderungen vermischen — getrennt committen,
auch wenn sie im selben PR landen.

**Nie committen:**
- `.env.local` oder andere Dateien mit `GEMINI_API_KEY`
- Godot-Editor-Artefakte (`.godot/`, lokale Import-Caches) — sobald `/game`
  existiert, gehören diese in `.gitignore`
- `godot_assets/` (bleibt bewusst git-ignoriert, siehe
  [Repository-Audit](../00-discovery/repository-audit.md) Abschnitt 4) — nur
  geprüfte, lizenzkonforme Teilmengen werden gezielt nach `/game/assets/`
  übernommen, nie das gesamte Verzeichnis

## Review-Anforderungen

Jeder PR braucht mindestens **ein Review** vor dem Merge, unabhängig von Umfang
oder Autor (Mensch oder KI-Agent). Reviewer prüfen gegen die Hard Rules aus
`CLAUDE.md` (z. B. keine direkte `GameContext`-Mutation, keine hartcodierten
Werte außerhalb `constants.ts`, try/catch + Fallback in jeder neuen
`server.ts`-Route).

### Zusätzlicher Opus-Review-Pass bei größeren Eingriffen

Für **größere Eingriffe** — neue Subsysteme, größere Refactors,
Multi-File-Architekturänderungen, oder analog im Godot-Teil: neue Szenen-/Systemgruppen,
größere GDScript-Refactors — gilt zusätzlich zum normalen Review:

- Vor Eröffnung des PR läuft ein **zusätzlicher Review-Pass mit dem Opus-Modell**
  über den vollständigen Diff (nicht nur über einzelne Dateien isoliert).
- Dieser Pass ersetzt nicht das menschliche/normale Review, sondern ergänzt es —
  er findet vor dem PR statt, das normale Review danach.
- Befunde aus dem Opus-Pass werden vor dem Öffnen des PR behoben oder im
  PR-Beschreibungstext bewusst als bekanntes, akzeptiertes Risiko dokumentiert.
- Faustregel für "größer": mehr als ~3 Dateien mit Verhaltensänderung, jede
  Änderung an `GameContext`/State-Machine-Logik, jede neue Gemini-Route in
  `server.ts`, jede neue Godot-Systemgruppe (Spielercontroller, Save/Load,
  Dialogsystem). Reine Doku-, Config- oder Ein-Datei-Fixes brauchen keinen
  Opus-Pass.

### Verifikationspflicht vor "fertig"

Vor jeder Aussage "das funktioniert"/"PR ist bereit": Build/Validierung tatsächlich
ausführen, nicht nur plausibel machen (siehe Abschnitte unten je Codebasis).

## Unterschied Web-PR vs. Godot-PR

Beide Codebasen leben additiv nebeneinander im selben Repository (kein
Code-Sharing auf Engine-Ebene, siehe ADR 001). Die Anforderungen an einen PR
unterscheiden sich entsprechend:

### Web-PR (Root-Verzeichnis: `App.tsx`, `components/`, `engine/`, `server.ts`, `constants.ts`, …)

- Toolchain: Node.js + npm
- Pflicht vor PR-Eröffnung:
  - `npm run build` muss erfolgreich durchlaufen (Exit 0)
  - Zusätzlich `npx tsc --noEmit` separat laufen lassen — `npm run build`
    (Vite/esbuild) erkennt nicht alle TypeScript-Fehler, siehe
    [Repository-Audit](../00-discovery/repository-audit.md) Abschnitt 3.
    Neue Fehler aus `tsc --noEmit`, die durch die eigene Änderung entstehen,
    müssen behoben werden; bereits bestehende, nicht selbst verursachte Fehler
    sind als bekanntes Backlog-Item dokumentiert, kein Blocker für unabhängige PRs.
  - Beide Dev-Server lokal starten (`npm run dev` und `npm run server`) und die
    Browser-Konsole auf Fehler prüfen — Theologie-Validierung funktioniert nur
    mit laufendem Backend.
- Es gibt aktuell **keine GitHub-Actions-CI** für den Web-Teil (Stand
  2026-06-30) — Verifikation ist manuell, siehe oben.
- Hard Rules: niemals `GameContext`-State direkt mutieren (immer `dispatch`),
  keine hartcodierten Farben/Scores/Speeds/Fragen in Komponenten (gehören nach
  `constants.ts`), jede neue `server.ts`-Route mit try/catch + Fallback-Objekt,
  neue Top-Level-UI in einer `ErrorBoundary`.

### Godot-PR (`/game/`, additiv, ab Stage C/M0)

- Toolchain: Godot-4.x-Editor (Download, kein Account, kein npm-Zusammenhang)
- Pflicht vor PR-Eröffnung:
  - Projekt öffnet fehlerfrei im Godot-4.x-Editor (keine Parse-/Import-Fehler)
  - Sobald vorhanden: CI-Pipeline `godot-validate.yml` (lädt Godot 4.x headless,
    importiert das Projekt, prüft auf Fehler) muss grün sein — geplant für M0,
    siehe [Roadmap](../planning/roadmap.md)
  - Neue Assets aus `godot_assets/` nur nach Lizenzprüfung (`License.txt` der
    jeweiligen Quelle wörtlich lesen, nicht annehmen) und nur als gezielter
    Import, nicht als Verzeichniskopie
- Web-Teil und Godot-Teil sind durch Verzeichnistrennung entkoppelt: ein
  Godot-PR ändert nie Dateien im Root-Web-Verzeichnis und umgekehrt, außer es
  handelt sich explizit um eine repo-weite Doku-/CI-Änderung
- Definition of Done je Meilenstein: [`docs/planning/definition-of-done.md`](../planning/definition-of-done.md)

### Gemeinsame Doku-Änderungen (z. B. dieses Dokument, ADRs, Roadmap)

- Eigener `docs/`-PR, keine Vermischung mit Code-Änderungen, kein Build/CI nötig,
  aber Faktentreue prüfen (keine erfundenen Stände, Ist-Zustand klar von
  Zielzustand/Backlog trennen — siehe Ton im
  [Repository-Audit](../00-discovery/repository-audit.md)).

## Zusammenfassung als Checkliste

- [ ] Branch von `main`, korrektes Präfix (`feat/`, `fix/`, `chore/`, `docs/`, `refactor/`, `test/`, `ci/`)
- [ ] Commits im Conventional-Commits-Format, Web/Godot nicht vermischt
- [ ] Keine Secrets, keine `godot_assets/`-Vollkopie, keine Godot-Editor-Caches committet
- [ ] Codebasis-spezifische Verifikation tatsächlich ausgeführt (siehe oben)
- [ ] Bei größerem Eingriff: Opus-Review-Pass über den Diff vor PR-Eröffnung
- [ ] PR gegen `main`, mindestens ein Review vor Merge
