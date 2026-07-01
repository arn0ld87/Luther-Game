# Sola Fide: The Luther Run

<p align="center">
  <img src=".github/assets/logo.png" alt="Sola Fide: The Luther Run — Logo" width="280">
</p>

**Lernspiel über die Reformationstheologie — 2D-Web-Prototyp (React + Canvas) mit laufender Migration auf Godot 4.7 als Desktop-Engine.**

Spieler navigiert theologische Dilemmata, sammelt Gnadenpunkte, meidet Ablasshandel und bestreitet Debatten über die Reformation. Ein Express-Backend proxyt die Gemini API für theologische Validierung und KI-Asset-Generierung.

[![Repository](https://img.shields.io/badge/GitHub-arn0ld87%2FLuther--Game-111?style=flat-square&logo=github)](https://github.com/arn0ld87/Luther-Game)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-6-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Godot](https://img.shields.io/badge/Godot-4.7-478CBF?style=flat-square&logo=godotengine&logoColor=white)](https://godotengine.org/)
[![Gemini](https://img.shields.io/badge/Gemini-API-8E75B2?style=flat-square&logo=googlegemini&logoColor=white)](https://ai.google.dev/)
[![Version](https://img.shields.io/badge/Version-1.0.0-brightgreen?style=flat-square)](./CHANGELOG.md)

[Quick Start](#quick-start) · [Architektur](#architektur) · [Game Flow](#game-flow) · [Godot-Migration](#godot-migration) · [Konfiguration](#konfiguration) · [Sicherheit](#sicherheit) · [Status](#entwicklungsstatus) · [Doku](./docs/)

---

## Quick Start

```bash
git clone https://github.com/arn0ld87/Luther-Game.git
cd Luther-Game
npm install
```

`.env.local` im Projektroot anlegen (gitignored) und den Gemini-API-Key setzen:

```bash
GEMINI_API_KEY=<dein-key>
```

Anschließend **beide** Server starten (Frontend allein kann Theologie-Antworten nicht validieren):

```bash
npm run dev      # Vite-Frontend  → http://localhost:5173
npm run server   # Express-Backend → http://localhost:3000
```

| Dienst    | URL                     |
|-----------|-------------------------|
| Frontend  | <http://localhost:5173> |
| Backend   | <http://localhost:3000> |

> Der Vite-Dev-Server proxyt `/api/*` an das Express-Backend unter `http://localhost:3000`. Ohne `GEMINI_API_KEY` laufen die KI-Routen in ihren Fallback-Pfaden.

Details: siehe [Detaillierte Installation](#detaillierte-installation)

---

> **Status:** Version 1.0.0. Der Web-Prototyp ist ein 2D-Canvas-Spiel (kein 3D/R3F) und wird derzeit auf Godot 4.7 als Desktop-Engine migriert — siehe [Godot-Migration](#godot-migration) und [Entwicklungsstatus](#entwicklungsstatus).

---

## Was ist Sola Fide?

Ein bildungsjournalistisches Spiel, das reformatorische Theologie (Luthers *Sola Fide*, Ablasskritik, Schriftprinzip) interaktiv vermittelt. Statt Lesetexten: Gameplay-Schleifen aus Sammeln, Ausweichen und Debattieren, ergänzt durch eine KI-geprüfte theologische Validierung der Spielantworten.

## Wofür das Spiel gedacht ist

- **Schule & Konfirmandenarbeit:** anschaulicher Einstieg in Reformationstheologie
- **Gemeinde & Erwachsenenbildung:** niedrigschwellige Auseinandersetzung mit Kernsätzen
- **Selbststudium:** spielerisches Wiederholen und Vertiefen historisch-theologischer Zusammenhänge

## Was das Spiel erzeugt

- Eine spielbare 2D-Level-Struktur mit Score- und Lebenspunkten
- Theologische Debatten mit KI-validierten Antworten und Begründungen
- KI-generierte Texturen/Assets über das Art-Studio
- Tiefergehende Erklärungen (*Deep Dive*) zu einzelnen theologischen Fragen

## Architektur

```text
Luther-Game/
├── Web-Prototyp (React 19 + Vite 6)
│   ├── App.tsx / GameApp.tsx       # GameProvider-Wrapper + Hauptorchestrator
│   ├── components/                 # Game2DCanvas, HUD2D, DebateInterface,
│   │                               # ArtStudio, MapInterface, ErrorBoundary
│   ├── engine/                     # Player2D, Enemy, Combat, EnemyRenderer,
│   │                               # ItemRenderer, TileRenderer
│   ├── context/GameContext.tsx     # React Context + useReducer
│   ├── hooks/ services/            # Custom Hooks + API-Clients (gemini, audio)
│   ├── constants.ts  types.ts      # Tunables, Farben, Fragen, Enums
│   └── server.ts                   # Express-Backend, Gemini-Proxy
│
└── game/  (Godot 4.7 — Migrierungsziel)
    ├── project.godot               # Forward+ Renderer, Hauptszene bootstrap.tscn
    ├── scenes/                     # bootstrap.tscn, Player.tscn (CharacterBody3D)
    ├── scripts/entities/           # Player.gd (Bewegung, Gravitation, Kollision)
    ├── tests/                      # player_movement_test.gd (headless Behavior-Test)
    └── README.md                   # Godot-Setup & Verifikation
```

State: React Context + `useReducer` in `context/GameContext.tsx`, konsumiert via `useGame()`. Alle Updates laufen über `dispatch({ type, payload })` — niemals direkte Mutation. Konfiguration (`COLORS`, `GAME_CONFIG`, `QUESTIONS`) lebt zentral in `constants.ts`.

## Game Flow

```text
MENU → PLAYING → DEBATE → [nächstes Level | VICTORY]
     → ART_STUDIO  (vom MENU aus)
     → MAP         (vom MENU aus)
```

Die Zustände sind als `GameState`-Enum in `types.ts` definiert. Das 2D-Rendering läuft über `Game2DCanvas` in einer SNES-artigen Auflösung (256×224, Scale 3).

## Godot-Migration

Der Web-Prototyp bleibt als Referenz erhalten; das eigentliche Ziel ist ein Desktop-Spiel unter `game/` mit Godot 4.7-stable (Forward+ Renderer). Meilensteine **M0** (Bootstrap-Stage), **M1** (Spielercharakter, Kamera-Rig, konfigurierbares Input-Mapping) und **M2** (Quest-/Dialog-/Debattensystem mit Theologie-SSOT) sind abgeschlossen (PRs #36, #37, #38, #39). Mit `world/wittenberg_intro.tscn` existiert das erste echte Level (Kirchenvorplatz, Schlosskirche, Stadtmauer, drei begehbare Quest-Stationen mit Debatten-UI) — es ist die Hauptszene (`run/main_scene`, PR #40); `bootstrap.tscn` bleibt als Dev-Blockout/Testszene erhalten. Aktueller Fokus: M3 (Save/Load, Issue #17; Audio/Accessibility, Issue #18).

Assets: 63 kuratierte Einträge aus dem `godot_assets/`-Staging sind lizenzgeprüft nach `game/assets/` integriert (Gebäude, Props, Charaktere, Audio) und im Asset-Katalog (`game/resources/asset_catalog/asset_catalog.json`) erfasst — Details in [`docs/assets/`](./docs/assets/).

**Godot-Editor nicht im Repo** — jede Person lädt ihn selbst herunter und verifiziert den SHA512-Hash gegen die Release-SUMS (siehe [`game/README.md`](./game/README.md)). GitHub-Validierung läuft über [`.github/workflows/godot-validate.yml`](./.github/workflows/godot-validate.yml).

```bash
# Editor headless für CI/Skripte
./Godot.app/Contents/MacOS/Godot --headless --path game --quit
```

Details und Installationsanleitung: [`game/README.md`](./game/README.md).

## Detaillierte Installation

**Voraussetzungen:** Node.js, ein Gemini-API-Key, optional Godot 4.7-stable für den `game/`-Teil.

### Pfad A — Web-Prototyp

```bash
git clone https://github.com/arn0ld87/Luther-Game.git
cd Luther-Game
npm install
npm run dev      # Terminal 1: Frontend
npm run server   # Terminal 2: Backend
```

`.env.local` mit `GEMINI_API_KEY` anlegen. Production-Build: `npm run build` (muss ohne TS-Fehler durchlaufen), Preview: `npm run preview`.

### Pfad B — Godot-Desktop-Teil

Godot 4.7-stable herunterladen (z. B. via `gh release download`), SHA512 verifizieren, dann:

```bash
./Godot.app/Contents/MacOS/Godot --path game
```

Vollständige Anleitung inkl. Hash-Check und Praxis-Beispielen in [`game/README.md`](./game/README.md).

## Konfiguration

Minimal-Konfiguration (Web-Prototyp) in `.env.local`:

```bash
# Pflicht: Gemini-API-Key für theologische Validierung & Asset-Generierung
GEMINI_API_KEY=<dein-key>
```

Tunables liegen zentral in `constants.ts`:

- `COLORS` — Hex-Farbpalette
- `GAME_CONFIG` — Scores, Geschwindigkeiten, Kollisionsradii, Canvas-Auflösung, Kamera
- `QUESTIONS` — theologische Debatten-Inhalte

> **Wichtig:** Farben, Scores, Geschwindigkeiten und theologische Fragen gehören **immer** nach `constants.ts` — nie inline in Komponenten.

## Backend-Routen & Modell-Pinning

Express-Server in `server.ts`, jede Route try/catch mit gültigem Fallback-Objekt:

| Route                      | Zweck                          | Gemini-Modell                     |
|----------------------------|--------------------------------|-----------------------------------|
| `POST /api/check-theology` | Theologische Validierung       | `gemini-2.5-flash-lite-latest`    |
| `POST /api/deep-dive`      | Tiefergehende Erklärungen      | `gemini-2.0-flash-thinking-exp-01-21` |
| `POST /api/generate-asset` | KI-Bildgenerierung             | `gemini-3-pro-image-preview`      |
| `POST /api/edit-asset`     | KI-Bildbearbeitung             | `gemini-2.0-flash`                |

> Modelle sind pro Route gepinnt und erfüllen unterschiedliche Zwecke (Validierung vs. Deep Reasoning vs. Image Gen) — nicht ohne Prüfung des Routen-Zwecks tauschen.

## Sicherheit

- **Scope:** lokales Lernspiel, keine Verarbeitung personenbezogener Spielerdaten.
- **`GEMINI_API_KEY`** liegt nur in `.env.local` (gitignored) — nie committen, nie loggen.
- Jede `server.ts`-Route hat try/catch und gibt ein gültiges Fallback-Objekt zurück (z. B. `DEFAULT_THEOLOGICAL_ERROR`) — ein Gemini-Fehler geht nie roh an den Client.
- Server-Routen validieren Antworten mit Type-Guards (`isValidTheologicalResponse`).

## Grenzen

- Keine formelle Test-Suite — Verifikation erfolgt via `npm run build` und manuellem Spieltest (Browser-Konsole prüfen).
- Der Web-Prototyp ist 2D, kein 3D/R3F — ältere Doku, die von Three.js spricht, ist veraltet.
- Die Godot-Migration: M0–M2 sind abgeschlossen (Bootstrap, Spielercharakter/Kamera/Steuerung, Quest-/Debattensystem); M3 (Save/Load, Audio/Accessibility) steht noch aus — noch kein vollständiger Vertical Slice bis Release (M4).
- Theologische Inhalte sind pädagogisch kuratiert, ersetzen aber keine akademische oder seelsorgerliche Expertise.

## Entwicklungsstatus

**v1.0.0** — Web-Prototyp spielbar (2D), Godot-Migration: M0–M2 abgeschlossen (Bootstrap, Spielercharakter + Kamera + Input-Mapping, Quest-/Debattensystem mit Theologie-SSOT und begehbaren Quest-Stationen im Wittenberg-Level).

**Aktueller Fokus (M3):**

- Issue #17: Save/Load-System für den Spielstand
- Issue #18: Audio- und Accessibility-Grundausstattung
- Mönch-Visual-Feinschliff (Ausrichtung/Scale) und selektiver Nachzug weiterer Assets aus dem `godot_assets/`-Staging bei Levelausbau

## Mitarbeiten

- Workflow: Feature-Branches, kein direkter Push auf `main`, PR-Review vor Merge.
- Vor "funktioniert"-Behauptung: `npm run build` muss durchlaufen, dann beide Dev-Server starten und Browser-Konsole prüfen.
- Neue Top-Level-UI kommt in einen `ErrorBoundary`.
- Größere Eingriffe (neue Subsysteme, Refactors, Multi-File-Architektur): zusätzlicher Review-Pass vor dem PR.

Siehe auch [`CLAUDE.md`](./CLAUDE.md) und [`AGENTS.md`](./AGENTS.md).

## Herkunft und Lizenz

Entstanden als AI-Studio-Prototyp (ursprünglich 3D/R3F angelegt, faktisch als 2D-Canvas-Spiel weitergeführt), aktuell in Migration auf Godot 4.7 als Desktop-Engine.

Lizenz: noch nicht festgelegt — siehe Repository-Settings.