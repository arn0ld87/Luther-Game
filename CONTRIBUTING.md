# Mitwirken bei Sola Fide: The Luther Run

Danke für dein Interesse! Dieses Repository enthält zwei Codebasen
nebeneinander:

1. **Web-Spiel** (Root-Verzeichnis): das bestehende 2D-Canvas-Spiel mit
   React 19 + Express 5.
2. **Godot-3D-Desktop-Spiel** (`/game`): neu, additiv, befindet sich im Aufbau
   (siehe [ADR 001](docs/architecture/adr/001-godot-desktop-engine.md)). Das
   Verzeichnis `/game` existiert noch nicht in jedem Branch-Stand — sobald
   Stage C umgesetzt ist, gelten die Schritte unten.

Beide Teile sind unabhängig voneinander nutz- und entwickelbar; du musst nicht
beide Toolchains installieren, wenn du nur an einem Teil arbeitest.

## Setup: Web-Spiel

Voraussetzung: Node.js (aktuelle LTS-Version reicht).

```bash
npm install
```

Erstelle `.env.local` (gitignored) mit deinem eigenen Gemini-API-Key:

```
GEMINI_API_KEY=dein-key-hier
```

Starte Frontend **und** Backend parallel in zwei Terminals — das Frontend
allein kann Theologie-Antworten nicht validieren:

```bash
npm run dev      # Vite-Dev-Server, http://localhost:5173
npm run server   # Express-Backend, http://localhost:3000
```

Vor jedem PR: `npm run build` muss fehlerfrei durchlaufen.

## Setup: Godot-Spiel (`/game`)

Voraussetzung: [Godot-4.x-Editor](https://godotengine.org/download) —
kostenloser Download, kein Account nötig. Projekt im Editor über
"Import" öffnen, sobald `/game/project.godot` im Repository existiert.

Keine npm-Abhängigkeit für diesen Teil; Web- und Godot-Toolchain laufen
komplett getrennt voneinander.

## Details zum Workflow

Branch-Namenskonvention, Commit-Konventionen, PR-Pflicht (kein direkter Commit
auf `main`), Review-Anforderungen inklusive Opus-Review-Pass bei größeren
Eingriffen sowie die genauen Unterschiede zwischen einem Web-PR und einem
Godot-PR stehen ausführlich in
[`docs/contributing/workflow.md`](docs/contributing/workflow.md). Bitte vor
dem ersten PR einmal lesen.

Projektspezifische Hard Rules (z. B. State-Management-Regeln, was wo in
`constants.ts` gehört) stehen in [`CLAUDE.md`](CLAUDE.md).

## Einstieg finden

- Issue-Vorlagen liegen unter [`.github/ISSUE_TEMPLATE`](.github/ISSUE_TEMPLATE).
- Für den Einstieg eignen sich Issues mit dem Label
  [`good first issue`](https://github.com/arn0ld87/Luther-Game/labels/good%20first%20issue).
- Fragen oder unklare Sachverhalte: gerne als Issue mit dem Label `question`
  eröffnen, bevor du mit der Umsetzung beginnst.
