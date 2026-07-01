# Sola Fide: The Luther Run — Godot-Migration, Phase 0–2 (Stage A + B), Godot-Fundament als Folge-Schritt

## Context

Der Auftrag verlangt den Aufbau eines echten, spielbaren 3D-Desktop-Spiels in Godot 4.x unter `/game`, gestützt auf Audit, ADR, vollständige Produkt-/Architekturdoku und einen GitHub-Backlog. Das Repo wurde zur Verifikation direkt geprüft (nicht nur das Draft übernommen):

- **2D-statt-3D bestätigt:** `package.json` enthält **keine** Three.js/R3F-Dependency (nur React 19, Express 5, `@google/genai`). Der letzte Commit (`530678f`) hat `components/Game2DCanvas.tsx`, `components/HUD2D.tsx`, `engine/Player2D.ts`, `engine/Enemy.ts`, `engine/Combat.ts` u.a. eingeführt — ein reines 2D-Canvas-Spiel. `App.tsx` rendert nur `GameApp` (kein `<Canvas>` von R3F). `CLAUDE.md` und `metadata.json` ("3D-Lernspiel") sind nachweislich veraltet.
- **`npm run build` schlägt fehl**, nicht weil der Code fehlerhaft ist, sondern weil `node_modules/` in dieser Session nicht installiert ist (`sh: 1: vite: not found`). Das ist wörtlich so zu dokumentieren — nicht als Build-Fehler im Code.
- **GitHub-Zustand bestätigt:** 0 offene Issues, 2 PRs (beide gemerged/geschlossen), Label `good first issue` existiert. Kein `.github/`-Verzeichnis (keine Templates, keine Workflows).
- **Kein `gh`-CLI verfügbar in dieser Session** (laut Systemvorgabe) — alle GitHub-Mutationen laufen über die `mcp__github__*`-Tools, nicht über `gh`. Das Draft verweist durchgehend auf `gh` — das ist in dieser Umgebung falsch und wird korrigiert.
- **Kritische Tool-Lücke gefunden:** Das verfügbare GitHub-MCP-Toolset hat **kein** Tool zum Anlegen/Ändern von Labels oder Milestones (nur `get_label`, kein `create_label`, keine Milestone-Tools, kein generischer REST-Passthrough). Issues lassen sich per `issue_write` anlegen, aber neue Labels/Milestones lassen sich aus dieser Session heraus **nicht** programmatisch erzeugen. Das Draft (Stage B.1/B.2: "Labels anlegen", "Milestones M0–M4") ist damit so nicht ausführbar — siehe Scope-Anpassung unten.
- **Godot-Installation geprüft:** `brew install --cask godot` aus dem Draft ist falsch für diese Umgebung (Linux-Container, kein macOS/Homebrew). `apt` bietet nur Godot **3.5.2** (nicht 4.x). Verifiziert per echtem Download: Godot **4.3-stable** Linux-x86_64-Editor lässt sich direkt von `github.com/godotengine/godot/releases` laden (HTTP 200, 50 MB Zip, gültiges Zip-Archiv) — `godotengine.org` selbst ist über die Egress-Policy blockiert (403), GitHub-Releases sind es nicht. Das ist der reale, funktionierende Installationsweg für Stage C.

**Scope-Entscheidung:** Das Draft selbst erkennt an, dass der volle Vertical Slice (Phase 3) zu groß für einen ehrlichen Ein-Schritt-Abschluss ist. Diese Refinement geht einen Schritt weiter: Auch die im Draft als "in dieser Sitzung machbar" deklarierten Stage A + B + C sind in der Summe zu viel für einen verifizierbaren Durchlauf, vor allem weil Stage C echte Binärdownloads, Godot-Ausführung und CI-Verifikation braucht. Diese Session liefert **Stage A (Audit/ADR/Planungsdoku) und Stage B (GitHub-Issue-Backlog, ohne Labels/Milestones-Mutation)** vollständig und verifiziert. **Stage C (Godot-Fundament)** wird als klar abgegrenzter, eigener Branch/PR direkt im Anschluss in derselben Sitzung begonnen, sofern nach Stage A/B noch Budget ist — aber nicht als unbegrenzte "Issue für Issue"-Fortsetzung (Controller, Kamera, Quest/Dialog/Debatte, Save, Audio, Accessibility, Playtest, Release) zugesagt. Diese Folgearbeiten werden als Issues in Stage B angelegt und in **separaten, künftigen Sitzungen** abgearbeitet — nicht in dieser.

## Stage A — Audit, ADR, Planungsdoku (ein Branch, ein Draft-PR)

Branch: `chore/game-foundation-planning` von `main` (per `mcp__github__create_branch`, dann lokal `git fetch`/`checkout`, da Dateien lokal geschrieben und committet werden).

1. `docs/00-discovery/repository-audit.md` — selbst verfasst aus den oben verifizierten Fakten (kein Agent nötig): Ist-Zustand, 2D-statt-3D-Befund mit Dateibelegen, `npm run build`-Ergebnis wörtlich (inkl. dass `node_modules` fehlt, nicht dass der Code kaputt ist — vorher `npm install` lokal ausführen und das tatsächliche Build-Ergebnis dokumentieren), GitHub-Ist-Zustand (0 Issues, 2 gemergte PRs, Label-Inventar), Tool-Lücke (keine Label/Milestone-API), Godot-Installationsweg, Risiken, Annahmen, Migrationsstrategie.
2. `docs/architecture/adr/001-godot-desktop-engine.md` — Kontext (inkl. 2D/3D-Befund), Entscheidung (Godot 4.x unter `/game`), Alternativen (Bevy, Unity, Unreal, bei 2D-Web bleiben), Konsequenzen, Migrationsplan, Rollback.
3. Restliche Planungsdoku per `Workflow`-Tool parallel von Subagenten entwerfen — jeder Agent bekommt die oben verifizierten Audit-Fakten + die GDD-Anforderungsliste aus dem ursprünglichen Auftrag als Kontext (damit nichts erfunden wird, insbesondere die existierenden theologischen Inhalte aus `constants.ts`/`types.ts`/`DebateInterface.tsx` als Grundlage für GDD und Content-Policy):
   - `docs/product/lastenheft.md`
   - `docs/product/game-design-document.md`
   - `docs/product/historical-and-theological-content-policy.md`
   - `docs/architecture/game-architecture.md`
   - `docs/planning/roadmap.md`
   - `docs/planning/risk-register.md`
   - `docs/planning/definition-of-done.md`
   - `docs/planning/backlog.md` (inkl. der vorgeschlagenen Label-Taxonomie `type:*`/`area:*`/`priority:*`/`status:*` und Milestones M0–M4 als **Dokumentation**, da nicht automatisiert anlegbar — siehe Stage B)
   - `docs/qa/test-plan.md`
   - `docs/contributing/workflow.md`
   - `CONTRIBUTING.md`
   - `.github/PULL_REQUEST_TEMPLATE.md`
   - `.github/ISSUE_TEMPLATE/feature.yml`, `bug.yml`, `content.yml`, `config.yml`

   Ich redigiere/vereinheitliche die Agenten-Outputs danach (Terminologie, Querverweise, keine Widersprüche zum Audit).
4. `npm install && npm run build` lokal ausführen, das tatsächliche Ergebnis (Exit-Code, Output) wörtlich in `repository-audit.md` übernehmen.
5. Alle Dateien committen, pushen (`git push -u origin chore/game-foundation-planning`), Draft-PR via `mcp__github__create_pull_request` (`draft: true`) erstellen — nur Doku/Planung, **kein** Code. PR-Beschreibung mit Was/Warum/Test/Risiko.

## Stage B — GitHub-Issue-Backlog (kein neuer Branch, direkte API-Mutationen)

1. **Labels/Milestones werden NICHT automatisiert angelegt** (Tool-Lücke, siehe oben). Die vorgeschlagene Taxonomie steht stattdessen vollständig in `docs/planning/backlog.md` (Stage A) sowie in `docs/planning/github-import-backlog.md`, inkl. eines fertigen `gh`-Shell-Skripts, das der Nutzer lokal mit seinem eigenen `gh`-Login ausführen kann, um Labels und Milestones M0–M4 tatsächlich anzulegen.
2. 16 Issue-Inhalte (Problem/Scope/Non-Goals/Akzeptanzkriterien/technische Hinweise/Abhängigkeiten/Risiko) per `Workflow`-Subagenten strukturiert vorformulieren lassen (mit Audit-Fakten als Kontext).
3. Issues sequenziell über `mcp__github__issue_write` (`method: "create"`) anlegen. Da neue Labels nicht existieren, nur die bereits vorhandenen 9 Standard-Labels verwenden, sofern thematisch passend (z.B. `enhancement`, `documentation`, `good first issue`); keine Labels erfinden, die es nicht gibt. Assignee `arn0ld87` setzen. Kein `milestone`-Parameter, da keine Milestones existieren.
4. Ergebnis (welche Issues mit welcher Nummer angelegt wurden, welche Labels tatsächlich gesetzt sind, was an Labels/Milestones offen bleibt) in `docs/planning/github-import-backlog.md` dokumentieren — nichts als erfolgreich behaupten, was nicht per Tool-Resultat verifiziert ist.

## Stage C — Godot-Fundament (zweiter Branch/PR, Issue 1+2 aus Stage B)

Neuer Branch: `feature/godot-project-foundation` von `main`.

1. Aktuelle stabile Godot-4.x-Release-Version zur Ausführungszeit über die GitHub-Releases-API/-Seite von `godotengine/godot` ermitteln (nicht hartkodieren auf 4.3 — zum Planungszeitpunkt verifiziert, zur Implementierungszeit kann eine neuere 4.x-Stable existieren). Den Linux-x86_64-Editor-Build per `curl` von `github.com/.../releases/download/...` laden (verifizierter Weg, `godotengine.org` ist blockiert), entpacken, ausführbar machen — **nicht ins Repo committen**, nur als lokales Build-/CI-Tool nutzen. Version in `game/README.md` dokumentieren.
2. `/game`-Projektstruktur anlegen (`assets/`, `scenes/`, `scripts/`, `resources/`, `tests/`, `project.godot`, `export_presets.cfg`).
3. Minimal-3D-Bootstrap-Szene (Boden, Licht, Kamera, leerer `CharacterBody3D`), reproduzierbar mit `godot --headless --import` (bzw. `--headless --quit` für einen vollen Import-/Validierungslauf) verifiziert — echte Konsolenausgabe in `game/README.md` und PR-Beschreibung übernehmen.
4. Export-Presets für macOS/Windows/Linux als Konfiguration anlegen (`export_presets.cfg`), klar als unsigniert/dev-tauglich dokumentiert. Echte Export-Builds (inkl. Download der ~500MB+ Export-Templates) sind **nicht** Teil dieser Stage — das wird als eigenes Folge-Issue dokumentiert, um den Umfang dieser Stage realistisch zu halten.
5. `game/README.md` (Install/Start/Test/Export/Steuerung, inkl. des verifizierten Godot-Downloadwegs).
6. `.github/workflows/godot-validate.yml` — GitHub-Actions-Workflow, der Godot 4.x von GitHub-Releases lädt und `--headless --import` auf `/game` ausführt.
7. Vor PR-Erstellung: Diff selbst gegenlesen (Konsistenz mit ADR/Architekturdoku aus Stage A).
8. Branch pushen, PR via `mcp__github__create_pull_request` (`draft: true`) erstellen, referenziert die Issues 1+2 aus Stage B.

**Nicht Teil dieser Sitzung:** Controller-Feinschliff, Kamera-Rig, Basislevel-Ausbau, Quest-/Dialog-/Debattensystem, HUD, Save/Load, Audio, Accessibility, Playtest, Release-Doku. Diese sind als einzelne Issues in Stage B angelegt und werden in eigenen, späteren Sitzungen mit jeweils echter `godot --headless`-Verifikation umgesetzt — kein Big-Bang-Versprechen für diese Sitzung.

## Ablaufdiagramm

```mermaid
flowchart TD
    A0[Audit verifizieren: 2D-Befund, npm build, GitHub-Zustand, Tool-Luecken] --> A1[Stage A: Branch chore/game-foundation-planning]
    A1 --> A2[repository-audit.md + ADR 001 selbst verfasst]
    A1 --> A3[Workflow: 13 Planungsdokumente parallel per Subagenten]
    A2 --> A4[npm install && npm run build, Ergebnis wörtlich uebernehmen]
    A3 --> A4
    A4 --> A5[Commit, Push, Draft-PR #1: nur Doku]

    A5 --> B1[Stage B: 16 Issues per Workflow-Subagenten formulieren]
    B1 --> B2[issue_write: Issues anlegen, nur bestehende Labels]
    B2 --> B3[github-import-backlog.md: was ging, was nicht]

    B3 --> C1[Stage C: Branch feature/godot-project-foundation]
    C1 --> C2[Godot 4.x von GitHub Releases laden, verifiziert]
    C2 --> C3[/game Struktur + Bootstrap-Szene]
    C3 --> C4[godot --headless --import, Output dokumentiert]
    C4 --> C5[CI-Workflow godot-validate.yml]
    C5 --> C6[Draft-PR #2: Godot-Fundament, referenziert Issue 1+2]

    style A0 fill:#f9f,stroke:#333
```

## Verifikation

- `npm install && npm run build`: tatsächlicher Output wörtlich in `repository-audit.md`.
- `mcp__github__list_pull_requests` / `list_issues` nach Stage A/B zur Bestätigung der angelegten Objekte (statt `gh pr list`/`gh issue list`, da kein `gh`-CLI verfügbar).
- `godot --headless --import` (heruntergeladene Godot-4.x-Binary) nach jeder Godot-Szenen-Änderung in Stage C, Konsolenoutput auf Fehler geprüft, im PR zitiert.
- Kein Schritt wird als erfolgreich gemeldet ohne den dazugehörigen Befehls-/Tool-Output.
