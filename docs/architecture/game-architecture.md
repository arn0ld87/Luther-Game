# Spiel-Architektur: Web-2D-Spiel und Godot-3D-Spiel

Stand: 2026-06-30, Branch `chore/game-foundation-planning`.

Dieses Dokument beschreibt zwei Architekturen nebeneinander:

1. Die **Ist-Architektur** des bestehenden Web-2D-Spiels (Repo-Root), verifiziert per Code-Lesen und über den Code-Review-Graph (CRG).
2. Die **Ziel-Architektur** des neuen Godot-4.x-3D-Desktop-Spiels unter `/game`, das gemäß [ADR 001](adr/001-godot-desktop-engine.md) additiv entsteht. `/game` existiert zum Zeitpunkt dieses Dokuments **noch nicht** auf der Festplatte (Stage A: Planung, keine Codeänderung) — Abschnitt 2 ist Zielbild, kein Ist-Zustand.

Grundlage für Abschnitt 1: [`docs/00-discovery/repository-audit.md`](../00-discovery/repository-audit.md) sowie direkte Prüfung von `App.tsx`, `GameApp.tsx`, `context/GameContext.tsx`, `server.ts`, `types.ts`, `vite.config.ts` und ein CRG-Architektur-Scan. Realer Tool-Output (`build_or_update_graph_tool`, `full_rebuild`, Stand 2026-06-30):

```
{"status":"ok","build_type":"full","summary":"Full build complete: parsed 25 files, created 134 nodes and 855 edges.",
 "files_parsed":25,"total_nodes":134,"total_edges":855}
```

`get_architecture_overview_tool`/`list_communities_tool` (dieselbe Sitzung) gruppieren davon 98 Nodes in 7 Communities (Rest sind File-/Top-Level-Nodes außerhalb der Community-Cluster) — siehe Tabelle unten, Werte direkt aus dem Tool-Output übernommen.

## 1. Ist-Architektur: Web-2D-Spiel (Repo-Root)

### 1.1 Überblick

Trotz der (veralteten) Beschreibung in `CLAUDE.md`/`metadata.json` als "3D-Spiel (React Three Fiber/Three.js)" ist der reale Stand ein **2D-Canvas-Spiel**: React 19 + Vite-Frontend, Express-5-Backend als Gemini-Proxy. Keine Three.js-/`@react-three/fiber`-Dependency in `package.json`.

Der CRG-Architektur-Scan bestätigt die funktionale Aufteilung über sieben Communities:

| Community | Größe (Nodes) | Sprache | Entspricht |
|---|---|---|---|
| `engine-draw` | 51 | TypeScript | `engine/*` — 2D-Render-/Spiellogik (Player, Enemy, Combat, Renderer) |
| `components-handle` | 27 | TSX | `components/*` — React-UI-Komponenten |
| `services-audio` | 9 | TypeScript | `services/audio.ts` |
| `context-game` | 3 | TSX | `context/GameContext.tsx` |
| `luther-game-generate` | 3 | TypeScript | `server.ts`-Routen rund um Asset-Generierung |
| `luther-game-response` | 3 | TypeScript | `server.ts`-Response-Handling |
| `verification-verify` | 2 | Python | `verification/*.py` (manuelle visuelle Checks, kein Testframework) |

Der Scan meldet eine **hohe Kopplung** (17 Kanten) zwischen `components-handle` und `engine-draw` — UI-Komponenten rufen Engine-Funktionen direkt auf (z. B. `Game2DCanvas.tsx` orchestriert `engine/Player2D.ts`, `engine/Enemy.ts`, `engine/Combat.ts`, `engine/*Renderer.ts` für den Canvas-Draw-Loop). Das ist als Graph-Hinweis zu werten, nicht als isoliert vermessenes Laufzeitverhalten — die Kopplung selbst ist für ein 2D-Canvas-Spiel architektonisch erwartbar (Render-Loop braucht direkten Zugriff auf Spielobjekte).

### 1.2 State-Management: React Context + `useReducer`

Zentral in [`context/GameContext.tsx`](../../context/GameContext.tsx):

- `State`-Interface hält `gameState`, `currentQuestionIndex`, `score`, `health`/`maxHealth`, `customTexture`, `flash`, `resources` (`scholarlyQuotes`, `ink`), `impactScore`, `inventory`.
- `Action`-Union (`START_GAME`, `SET_GAME_STATE`, `COLLECT_GRACE`, `TAKE_DAMAGE`, `DEBATE_WIN`, `DEBATE_LOSE`, `NEXT_LEVEL`, `SET_CUSTOM_TEXTURE`, `CLEAR_FLASH`, `ADD_RESOURCE`, `SPEND_RESOURCE`, `ADD_IMPACT`, `HEAL`, `RESET_GAME`) plus reiner `gameReducer`.
- `GameProvider` (in `App.tsx` um `GameApp` gelegt) hält den `useReducer`-State; `useGame()` liefert `{ state, dispatch }` und wirft, wenn außerhalb des Providers verwendet.
- Konsumenten (`GameApp.tsx` und Kindkomponenten wie `DebateInterface`, `MapInterface`, `ArtStudio`) lesen `state` und mutieren ausschließlich über `dispatch({ type, payload })` — deckungsgleich mit der Hard Rule in `CLAUDE.md` ("never mutate `GameContext` state directly").

### 1.3 Game-State-Maschine

`GameState`-Enum (`types.ts`): `MENU`, `PLAYING`, `DEBATE`, `ART_STUDIO`, `VICTORY`, `GAME_OVER`, `MAP`, `PAUSED`, `DIALOG`. `PAUSED` und `DIALOG` sind deklariert, aber im aktuell gelesenen `GameApp.tsx`/`gameReducer` nicht verdrahtet (kein Dispatch-Pfad dorthin) — vermutlich für künftige Erweiterungen vorgesehen, hier als offener Punkt vermerkt statt als genutzter Zustand behauptet.

Tatsächlich verdrahtete Übergänge (`GameApp.tsx` + `gameReducer`):

- `MENU` → `PLAYING` (`START_GAME`-Button)
- `MENU` → `ART_STUDIO` / `MAP` (Buttons), zurück → `MENU` (`SET_GAME_STATE`/`RESET_GAME`)
- `PLAYING` → `DEBATE` (`onReachCheckpoint`-Callback aus `Game2DCanvas` → `SET_GAME_STATE`)
- `DEBATE` → Erfolg: `DEBATE_WIN` + `NEXT_LEVEL` → nächste Frage als `PLAYING`, oder `VICTORY` wenn `currentQuestionIndex` bereits letzter `QUESTIONS`-Index war
- `DEBATE` → Misserfolg: `DEBATE_LOSE` (Health-Abzug, `gameState` bleibt unverändert lt. Reducer)
- `PLAYING`: `TAKE_DAMAGE` setzt bei `health === 0` `GAME_OVER`
- `GAME_OVER`/`VICTORY` → `MENU` über `RESET_GAME`

### 1.4 Datei-Organisation

```
/                       Repo-Root (Web-Spiel, unverändert lt. ADR 001)
├── App.tsx             Einstieg: <GameProvider><GameApp /></GameProvider>
├── GameApp.tsx          Haupt-UI-Orchestrierung, alle GameState-Verzweigungen
├── context/
│   └── GameContext.tsx  State + Reducer + Provider/Hook
├── components/          React-UI (Game2DCanvas, HUD2D, DebateInterface,
│                         ArtStudio, MapInterface, ErrorBoundary)
├── engine/               2D-Spiellogik (Player2D, Enemy, Combat,
│                         EnemyRenderer, ItemRenderer, TileRenderer)
├── hooks/                useCanvasDrawing.ts
├── services/             audio.ts, gemini.ts (Frontend-seitiger API-Client)
├── verification/         Python-Skripte für manuelle visuelle Prüfungen (kein Testframework)
├── constants.ts          COLORS, GAME_CONFIG, QUESTIONS (einzige Quelle für Tunables/Content)
├── types.ts              GameState, Direction, Enemy/Item/Map-Typen, Props-Interfaces
├── server.ts             Express-Backend (Gemini-Proxy, siehe 1.5)
└── vite.config.ts         Dev-Server-Proxy /api → localhost:3000, Alias @ → Root
```

### 1.5 Express-Backend-Routen (`server.ts`)

| Route | Zweck | Gemini-Modell | Fallback bei Fehler |
|---|---|---|---|
| `POST /api/check-theology` | Validiert Schüler-Antwort gegen Sola-Gratia-Lehre | `gemini-2.5-flash-lite-latest` | `DEFAULT_THEOLOGICAL_ERROR` |
| `POST /api/deep-dive` | Vertiefende theologische Erklärung | `gemini-2.0-flash-thinking-exp-01-21` | `{ text: DEFAULT_DEEPDIVE_ERROR }` |
| `POST /api/generate-asset` | Bild-Asset-Generierung fürs Atelier (`ArtStudio`) | `gemini-2.0-flash` | `{ imageUrl: null }` |
| `POST /api/edit-asset` | Bild-Asset-Bearbeitung (multimodal) | `gemini-2.0-flash` | `{ imageUrl: null }` |

Jede Route ist in `try/catch` gekapselt und liefert im Fehlerfall ein valides Fallback-Objekt statt eines rohen Wurfs an den Client — deckungsgleich mit der Hard Rule in `CLAUDE.md`. Modellwahl ist pro Route bewusst gepinnt (Validierung vs. Deep-Reasoning vs. Bildgenerierung); im Code finden sich mehrere Kommentare, die frühere Modell-Umstellungen dokumentieren (`server.ts` Zeilen 128–172) — ein Hinweis auf vorangegangene Iteration, kein aktueller Funktionsfehler.

## 2. Ziel-Architektur: Godot-3D-Spiel (`/game`)

**Status: geplant, noch nicht implementiert.** Diese Struktur ist das in Stage C (siehe ADR 001, Migrationsplan) umzusetzende Zielbild, abgeleitet aus gängiger Godot-4.x-Projektkonvention und den projektspezifischen Anforderungen (Wittenberg-/Reformations-Setting, Kenney/Quaternius-Lowpoly-Assets, theologischer Debattenmodus analog zum Web-Spiel).

### 2.1 Geplante Verzeichnisstruktur

```
/game
├── project.godot           Godot-4.x-Projektdatei
├── export_presets.cfg       Desktop-Export-Targets (macOS/Windows/Linux)
├── assets/                  Importierte 3D-Modelle/Texturen/Audio
│   ├── buildings/           Übernahme aus godot_assets/buildings/ (Kenney Castle Kit,
│   │                         Quaternius Medieval Village MegaKit) — erst nach
│   │                         Lizenzprüfung (License.txt) und .import-Konvertierung
│   ├── characters/
│   ├── props/
│   └── audio/
├── scenes/                  .tscn-Szenen, eine pro Bildschirm/Level
│   ├── Main.tscn             Root-Szene, lädt Sub-Szenen je nach Game-State
│   ├── menu/MainMenu.tscn
│   ├── world/WittenbergLevel.tscn   3D-Lauf-/Erkundungs-Level (Analog zu Game2DCanvas)
│   ├── debate/DebateScene.tscn      Theologische Debatte (Analog zu DebateInterface)
│   └── ui/HUD.tscn
├── scripts/                  GDScript, gespiegelt zur Szenenstruktur
│   ├── autoload/              Singletons (siehe 2.2)
│   ├── entities/               Player.gd, Enemy.gd, NPC.gd
│   └── ui/
├── resources/                Custom Godot-Resources (.tres)
│   └── questions/             Theologie-Fragenkatalog als .tres oder JSON
│                               (Ziel-Pendant zu constants.ts QUESTIONS, siehe Abschnitt 3)
└── tests/                    Test-Suite (Framework-Wahl offen — GUT/GdUnit4 — Folgearbeit)
```

### 2.2 Autoload-Singletons für Game-State

Godot kennt keinen React-Context; das funktionale Äquivalent zu `GameContext.tsx` sind **Autoload-Singletons** (global über `project.godot` registriert, projektweit als `GameStateManager.foo()` ansprechbar):

| Autoload (geplant) | Web-Pendant | Verantwortung |
|---|---|---|
| `GameStateManager.gd` | `context/GameContext.tsx` (State + Reducer) | Hält `current_state` (Godot-Enum analog `GameState`), Score, Health, Inventory; exponiert Methoden statt `dispatch()` (z. B. `collect_grace()`, `take_damage()`) oder ein eigenes Signal-basiertes Event-System |
| `QuestionBank.gd` | `constants.ts` `QUESTIONS` | Lädt den Fragenkatalog aus `resources/questions/` |
| `AudioManager.gd` | `services/audio.ts` | Zentrale SFX-/Musik-Wiedergabe |
| `SceneRouter.gd` | `GameApp.tsx`-Verzweigung über `gameState` | Szenenwechsel (`change_scene_to_file`) anhand `GameStateManager.current_state`, ersetzt die JSX-Conditional-Renders aus `GameApp.tsx` |

Diese Aufteilung ist eine Empfehlung, keine bereits getroffene Implementierungsentscheidung — die genaue Granularität (ein großer Singleton vs. mehrere) ist Teil der Stage-C-Umsetzung.

## 3. Schnittstellen und Trennung

- **Keine geteilte Codebasis.** Web-Teil (Node/npm/TypeScript) und Godot-Teil (GDScript/Godot-Editor) sind vollständig getrennte Toolchains; es gibt keinen gemeinsamen Build- oder Importmechanismus zwischen `/` und `/game`.
- **Inhaltliche Duplizierung statt Code-Sharing:** Der theologische Content (`constants.ts` `QUESTIONS`, aktuell 3 Einträge: Werkgerechtigkeit/Mt 7,21, Papst-Primat/Mt 16,18, freier Wille/Röm 3,23) muss für Godot in einem dort lesbaren Format (`.tres` oder JSON) vorgehalten werden. Laut ADR 001 ist offen, ob das **manuell dupliziert** oder **per Build-Schritt aus `constants.ts` generiert** wird — explizit als Folgearbeit benannt, keine Festlegung in diesem Dokument.
- **Offene Frage — HTTP-Brücke zum bestehenden Theologie-Backend:** `server.ts` validiert Antworten aktuell nur für das Web-Frontend (`/api/check-theology`, `/api/deep-dive`). Ob das Godot-Spiel denselben Express-Server per `HTTPRequest`-Node konsumiert (Wiederverwendung der Gemini-Validierungslogik) oder eine eigene, GDScript-seitige Anbindung an Gemini erhält, ist **nicht entschieden**. ADR 001 hält diese Möglichkeit offen, ohne sie festzulegen. Folgefragen, falls eine HTTP-Brücke gewählt wird: CORS-Konfiguration für einen Desktop-Client (kein Browser-Origin), Erreichbarkeit von `localhost:3000` aus einer exportierten Desktop-Anwendung (kein Dev-Proxy wie in `vite.config.ts`), und ob `API_KEY`/`GEMINI_API_KEY` weiterhin ausschließlich serverseitig verbleiben (siehe Hard Rule: niemals `GEMINI_API_KEY` im Client/Godot-Build loggen oder einbetten).
- **Getrennte CI:** Bestehende Checks (`npm run build`, künftig `tsc --noEmit`, siehe Risk-Register) bleiben unverändert für `/`. Für `/game` ist laut ADR 001 eine eigene Pipeline (`godot-validate.yml`) vorgesehen, die Godot 4.x von GitHub Releases lädt und headless validiert — unabhängig vom Node-Workflow.
- **Getrennte Asset-Pipelines:** Web-Assets (2D-Sprites/Sounds) bleiben im bestehenden `public`/Komponenten-Workflow; 3D-Assets kommen aus `godot_assets/` (lokal, git-ignoriert) und werden erst nach Lizenzprüfung gezielt nach `/game/assets/` übernommen. Die Lizenzprüfung ist erfolgt (Issue #10, 2026-07-01): [`docs/assets/asset-license-audit.md`](../assets/asset-license-audit.md) — **nur `APPROVED`/`APPROVED_WITH_ATTRIBUTION`-Assets** dürfen importiert werden.

## 4. Datenfluss-Diagramm

```mermaid
flowchart TB
    subgraph WEB["Web-2D-Spiel ( / , unverändert)"]
        direction TB
        Input1[Tastatur-Input] --> Canvas[Game2DCanvas.tsx]
        Canvas --> Engine["engine/* (Player2D, Enemy, Combat, Renderer)"]
        Engine --> Canvas
        Canvas -- "onReachCheckpoint / onCollect / onHit" --> GameApp[GameApp.tsx]
        GameApp -- dispatch --> Ctx[(GameContext.tsx<br/>useReducer State)]
        Ctx -- state --> GameApp
        GameApp --> Debate[DebateInterface.tsx]
        Debate -- "fetch /api/check-theology" --> Vite[Vite Dev-Proxy<br/>vite.config.ts]
        Vite --> Server[server.ts<br/>Express]
        Server -- "Gemini API" --> Gemini[(Google Gemini)]
        Gemini --> Server
        Server -- "TheologicalResponse / Fallback" --> Debate
        Debate -- dispatch DEBATE_WIN/LOSE --> Ctx
        Art[ArtStudio.tsx] -- "fetch /api/generate-asset, /api/edit-asset" --> Vite
    end

    subgraph GODOT["Godot-3D-Spiel ( /game , geplant, Stage C)"]
        direction TB
        Input2[Controller-/Tastatur-Input] --> PlayerNode[Player.gd Node]
        PlayerNode --> World[WittenbergLevel.tscn]
        World -- Signal --> GSM[(GameStateManager.gd<br/>Autoload)]
        GSM -- Signal --> Router[SceneRouter.gd]
        Router --> DebateScene[DebateScene.tscn]
        DebateScene --> QB[(QuestionBank.gd<br/>resources/questions/*.tres)]
    end

    DebateScene -. "offene Frage:<br/>HTTPRequest-Node →<br/>bestehendes /api/check-theology?" .-> Server

    classDef open stroke-dasharray: 5 5;
    class DebateScene,Server open;
```

Die gestrichelte Verbindung markiert die in Abschnitt 3 beschriebene **ungeklärte** HTTP-Brücke — sie ist kein implementierter Datenfluss, sondern eine architektonische Option, die in einer separaten Entscheidung (eigenes Issue/ADR) zu klären ist.

## 5. Begründung der Verzeichnistrennung (Verweis auf ADR 001)

Die Trennung in `/` (Web-2D-Spiel) und `/game` (Godot-3D-Spiel) als zwei parallele, additive Codebasen im selben Repository ist in [ADR 001](adr/001-godot-desktop-engine.md) begründet und hier nicht erneut zur Disposition gestellt. Kernpunkte aus der ADR, die diese Architektur direkt prägen:

- Der Auftrag (echtes 3D-**Desktop**-Spiel) lässt sich im bestehenden Web-Stack nicht erfüllen (React Three Fiber wäre 3D-**Web**, keine Desktop-Distribution) — daher eine dedizierte Engine statt Erweiterung des bestehenden Stacks.
- **Kein Code-Sharing auf Engine-Ebene** ist eine bewusste Konsequenz, keine Lücke: TypeScript/React und GDScript/Godot-Szenengraph sind strukturell zu verschieden, um sinnvoll Code zu teilen; geteilt wird ausschließlich Content (theologische Inhalte, ggf. Backend-API).
- **Isolation ermöglicht Rollback:** Da `/game` rein additiv ist, kann es laut ADR 001 jederzeit folgenlos entfernt werden, falls sich Godot/GDScript als ungeeignet erweist — der bestehende Web-Teil bleibt unberührt. Diese Rückbaubarkeit wäre bei einer Vermischung der Codebasen (z. B. gemeinsamer Build-Pipeline) nicht gegeben.
- Die Verzeichnistrennung spiegelt auch die **Toolchain-Trennung**: Mitwirkende am Web-Teil brauchen nur Node/npm, Mitwirkende am Godot-Teil nur den Godot-Editor — niemand muss zwingend beide Stacks beherrschen, um an einem der beiden Teile zu arbeiten.
- Die bereits vorhandenen `godot_assets/` (Kenney/Quaternius, lowpoly, passend zum Wittenberg-Setting) wurden als reales Signal für die Engine-Wahl gewertet, nicht nur als offene Asset-Frage — sie fließen ausschließlich in `/game/assets/` ein, nie in den Web-Teil.

## 6. Format-Entscheidung: Quest-/Dialog-Datenmodell (M2, Issue #14)

Für das Quest-/Dialog-Datenmodell des Godot-Spiels standen zwei native Godot-4.x-Optionen zur Wahl (siehe Issue #14 und Roadmap M2). Die Entscheidung ist hier verbindlich getroffen:

**Entscheidung: JSON auf Platte als Serialisierungsformat, plus eine typisierte GDScript-Modellklasse (`class_name QuestStation extends Resource`) als Zugriffsschicht.**

| Kriterium | `.tres` (Godot-`Resource`-Instanzen) | **JSON + typisiertes Modell (gewählt)** |
|---|---|---|
| Editor-Inspector-Integration | ja, nativ | nein (JSON wird über Loader geparst); Typsicherheit kommt aus der `QuestStation`-Klasse |
| Typsicherheit für Konsumenten (#15/#16) | ja | ja — `QuestStation` mit `@export`-Feldern + `from_dict()` |
| Generierbarkeit `constants.ts` → Godot (Risk 6) | schlecht — `.tres` ist ein Godot-spezifisches Serialisierungsformat, das ein Generator nur umständlich erzeugt | **gut — JSON ist trivial aus einem TS-Modul zu emittieren** |
| Diff-/Review-Tauglichkeit | mäßig (Ressourcen-Metadaten im Diff) | **gut — reiner Text-Diff** |
| Konsistenz mit Bestand | — | **hoch — spiegelt das in M1 etablierte `theology_questions.json` + `TheologyData`-Autoload-Muster** |

**Begründung (Risk Register Risiko 6 — Doppelpflege theologischer Inhalte):** Eine reine `.tres`-Lösung würde einen späteren automatisierten Single-Source-of-Truth-Generator (`constants.ts` → Godot) strukturell erschweren, da `.tres` nicht ohne Godot-Werkzeuge sinnvoll erzeugbar ist. JSON hält diese Generator-Pipeline offen. Gleichzeitig liefert die typisierte `QuestStation`-Klasse die Vorteile einer `Resource` (typsichere Felder, stabile API, optional später als `.tres` authorbar), ohne pro Eintrag eine Datei zu erzwingen. Die Single-Source-of-Truth-Entscheidung selbst (manuelle Duplikation vs. Generator) bleibt bewusst Folgearbeit (Issue #15 / eigenes Risk-6-Issue) — die hier getroffene Formatwahl verbaut keine der beiden Varianten.

**Realisierung im Code (`/game`):**

| Baustein | Datei | Rolle |
|---|---|---|
| Typisiertes Modell | `game/scripts/data/quest_station.gd` | `QuestStation extends Resource` — Felder `id`, `title`, `question_text`, `scripture_reference` (Pendant zu Web-`Question`) plus 3D-/Quest-Felder `theology_question_id`, `world_position`, `order`, `prerequisites`, `next_on_success`; `static from_dict()` für defensives Parsen |
| Lade-/Parse-Logik | `game/scripts/autoload/quest_data.gd` (Autoload `QuestData`) | Liest `res://resources/quests/quest_stations.json`, baut `Array[QuestStation]`, bietet `get_station_by_id()` / `get_stations_in_order()` |
| Referenz-/Platzhalterdaten | `game/resources/quests/quest_stations.json` | Zwei Platzhalterstationen zur Schema-Validierung — **nicht** die echten 3 theologischen Fragen (das ist Issue #15) |
| Headless-Test | `game/tests/quest_data_test.gd` | Lädt die Daten zur Laufzeit, prüft Felder + Theologie-Verknüpfung, gibt Output aus; in `godot-validate.yml` verdrahtet |

Dies konkretisiert die in Abschnitt 2.2 skizzierte `QuestionBank.gd`-Idee: Der Autoload heißt `QuestData` und liegt unter `resources/quests/` (statt `resources/questions/`), da er generische Quest-/Dialogstationen modelliert, nicht nur den Fragenkatalog. Das schmale Web-`Question`-Interface (`id`, `text`, `context`) ist als Teilmenge vollständig abgedeckt; die 3D-/Quest-Felder sind additiv und brechen kein Schema für Issue #15 (Content-Migration) oder Issue #16 (Debatten-UI).

## 7. Single Source of Truth für theologische Fragen (M2, Issue #15, Risk #6)

Risk Register Risiko 6 warnte vor **Doppelpflege** der theologischen Inhalte in zwei Formaten (TypeScript fürs Web, Godot-Format fürs Spiel). Issue #15 hatte diese Single-Source-of-Truth-Entscheidung zu treffen. Sie ist hier verbindlich getroffen — und stellt sich als bereits in M1 strukturell angelegt heraus:

**Entscheidung: Eine gemeinsame JSON-Datei als einzige Datenquelle, von beiden Spielen gelesen — weder manuelle Duplikation noch Generator-Skript.**

Die 3 Fragen leben ausschließlich in [`game/resources/theology/theology_questions.json`](../../game/resources/theology/theology_questions.json) (Schema: `version` + `questions[]` mit `id`, `text`, `context`). Beide Spiele konsumieren **dieselbe physische Datei**:

| Konsument | Zugriffsweg |
|---|---|
| Web-Spiel (`/`) | `constants.ts` importiert die JSON (`import theologyQuestions from './game/resources/theology/theology_questions.json'`) und re-exportiert `export const QUESTIONS: Question[] = theologyQuestions.questions` — alle React-Konsumenten (`GameApp`, `GameContext`, `DebateInterface`) nutzen nur diese Konstante |
| Godot-Spiel (`/game`) | Autoload `TheologyData` (`game/scripts/autoload/theology_data.gd`) lädt `res://resources/theology/theology_questions.json` zur Laufzeit |
| Quest-Datenmodell (#14) | `QuestStation.theology_question_id` verweist per ID auf einen Fragen-Eintrag, ohne dessen Text zu duplizieren |

**Warum diese Lösung — Trade-offs gegen die beiden im Issue genannten Alternativen:**

- **vs. manuelle Duplikation:** Es gibt schlicht keine zweite Kopie, die auseinanderlaufen könnte. Das Drift-Risiko (Risk 6) wird nicht *gemildert*, sondern *strukturell beseitigt* — beide Spiele lesen byteweise dieselbe Datei.
- **vs. Generator-Skript (`constants.ts` → Godot):** Ein Generator würde TypeScript als Autoren-Quelle und Godot-JSON als generiertes Derivat etablieren — mit zusätzlichem Build-Schritt und einer Cross-Toolchain-Abhängigkeit (Node-Skript erzeugt Godot-Asset). Die geteilte JSON erreicht dieselbe Ein-Quellen-Garantie ohne Build-Schritt: Die JSON ist direkt editierbar und wird von beiden Seiten gelesen. Der Generator-Vorteil (TS als Autoren-Quelle) entfällt, weil die JSON selbst die Autoren-Quelle ist.
- **Kosten dieser Lösung:** Der Web-TS-Build importiert eine JSON, die physisch unter `/game/` liegt (`resolveJsonModule: true` in `tsconfig.json`) — eine leichte Kopplung des Web-Builds an den `game/`-Pfad. Das ist bewusst akzeptiert und funktioniert bereits.

**Wo die „Wahrheit" liegt und wie Änderungen propagieren:** `theology_questions.json` ist die alleinige Wahrheit. Eine Content-Änderung dort erscheint automatisch in beiden Spielen (Web beim nächsten Build, Godot beim nächsten Lauf). Es gibt keinen Sync-Schritt.

**Absicherung (maschinenprüfbar):** Das CI-Gate [`game/tools/check_theology_ssot.mjs`](../../game/tools/check_theology_ssot.mjs) (eingebunden in [`typecheck.yml`](../../.github/workflows/typecheck.yml), läuft bei jedem PR) prüft deterministisch: Struktur/Vollständigkeit der JSON, kanonische Bibelstellen-Anker (Mt 7,21 / Mt 16,18 / Röm 3,23) gegen stille Content-Änderungen, und dass `constants.ts` weiterhin aus der JSON liest statt auf eine inline hartcodierte Frageliste zurückzufallen. Damit ist eine künftige Divergenz zwischen Web und Godot nicht nur unwahrscheinlich, sondern CI-blockiert.

Content-*Erweiterung* über die 3 bestehenden Fragen hinaus ist laut Roadmap explizit **kein** Teil von M2 und bleibt eigenes Backlog-Thema.

## 8. Bewertungslogik der Debatten-UI (M2, Issue #16)

Für die Godot-Debatten-UI (3D-Pendant zum Web-`DebateInterface`) war laut Issue #16 die Bewertungslogik-Architektur zu entscheiden: **(a)** Wiederverwendung des bestehenden Express-Backends (`/api/check-theology`) per `HTTPRequest` vs. **(b)** eigenständige lokale GDScript-Validierung. Die Entscheidung ist hier verbindlich getroffen:

**Entscheidung: (b) Lokale, self-contained GDScript-Bewertung.**

| Kriterium | (a) HTTP zum Express/Gemini-Backend | **(b) Lokal in GDScript (gewählt)** |
|---|---|---|
| Headless-CI-Test (DoD-Pflicht) | nicht deterministisch testbar — bräuchte laufenden Server + `GEMINI_API_KEY` + Netzwerk in CI; Gemini-Antworten sind nicht-deterministisch | **deterministisch, ohne Netzwerk/Secret headless testbar** (`tests/debate_ui_test.gd`) |
| Spielbarkeit im Export-Build (DoD-Pflicht) | gebrochen — ein ausgeliefertes Desktop-Spiel, das `localhost:3000` ruft, funktioniert nur mit parallel laufendem `npm run server` | **sofort spielbar, keine Laufzeit-Abhängigkeit** |
| Hard Rule „kein `GEMINI_API_KEY` im Client" | erfordert Sorgfalt (Key bleibt serverseitig, aber neue Kopplung) | **trivial erfüllt — kein Key, kein Backend** |
| Freitext-/LLM-Feinheit (Begründungstiefe) | ja (Gemini bewertet Freitext) | nein — bewusst binäre Ja/Nein-Haltung (laut Roadmap für M2 zulässig: „richtig/falsch … ohne zwingend den Gemini-Pfad") |
| Reversibilität | — | Bewertung ist hinter `TheologyEvaluator` gekapselt → ein späterer Wechsel zu (a) betrifft nur diese eine Datei |

**Begründung:** Die harten Definition-of-Done-Anforderungen (headless-CI-Test, im Export lauffähig) kann (a) prinzipiell nicht erfüllen, ohne eine dauerhafte Laufzeit-Kopplung des Desktop-Spiels an einen Node/Express/Gemini-Stack einzuführen. (b) ist die kleinste reversible M2-Lösung: self-contained, deterministisch, ohne Secret.

**Umgang mit der Datenlage (Risk 6 / Rule 9):** `theology_questions.json` enthält nur `id`/`text`/`context` (keine Antwortoptionen). Statt das #14-Datenmodell zu ändern (dessen Non-Goal) oder neue theologische Prosa zu verfassen (Rule 9), führt #16 eine **eigene, schmale Bewertungsdatei** `game/resources/theology/debate_stances.json` ein: je Frage die reformatorische Ja/Nein-Haltung (`correct_answer: "nein"` für alle drei — die historische Kern-These der Reformation, die das Spiel ohnehin lehrt) plus generisches Feedback, das nur auf die bereits vorhandene Bibelstelle verweist. Kein neuer Doktrin-Text, keine Änderung an der Theologie-SSOT, keine Änderung am Web-Spiel.

**Realisierung im Code (`/game`):**

| Baustein | Datei | Rolle |
|---|---|---|
| Bewertung (gekapselt) | `game/scripts/data/theology_evaluator.gd` (`class_name TheologyEvaluator`) | `evaluate(question_id, answer) -> {valid, correct, feedback}`, liest `debate_stances.json`; einziger Ort, den ein späterer HTTP-Wechsel berührt |
| Bewertungsdaten | `game/resources/theology/debate_stances.json` | reformatorische Ja/Nein-Haltung + Feedback je Frage |
| UI | `game/scenes/ui/DebateUI.tscn` + `game/scripts/ui/debate_ui.gd` | CanvasLayer-Overlay (erste UI-Szene im Projekt); zeigt Frage+Kontext aus `TheologyData`, Ja/Nein-Antwort, sichtbares Sieg/Niederlage-Ergebnis, Signal `debate_finished` |
| Trigger | `game/scenes/world/QuestStationTrigger.tscn` + `game/scripts/world/quest_station_trigger.gd` | begehbarer `Area3D`; öffnet die Debatte beim Betreten (Frage-ID aus `QuestStation` #14 oder direktem Override); wertet den Ausgang über `debate_finished` aus: Sieg → `DebateProgress`, Niederlage → Station wieder betretbar |
| Fortschritt (AK3) | `game/scripts/autoload/debate_progress.gd` (Autoload `DebateProgress`) | zählt gewonnene Stationen idempotent je Frage-ID über die kurzlebigen (`queue_free()`) UI-Instanzen hinweg; `progress_changed`-Signal speist die „X/N"-Anzeige der `DebateUI` — macht den Spielfortschritt über die 3 Stationen sichtbar |
| Integration | `game/scripts/world/wittenberg_intro.gd` | 3 begehbare Stationen mit sichtbaren Gesprächspartnern (katalogisierte Assets Cleric/Wizard/Warrior) auf dem Kirchenvorplatz — die 3 bestehenden Fragen sind durchspielbar |
| Test | `game/tests/debate_ui_test.gd` | headless: Evaluator (3 Fragen), UI-Sieg/Niederlage + Signal, Schließen-Button über echten Signal-Pfad, Trigger öffnet Debatte, Fortschritt (Sieg zählt + Station verbraucht, Niederlage wiederholbar, „X/N"-Anzeige) |

## Save/Load (M3, Issue #17)

Persistenz eines einzelnen Spielstands unter `user://save.json`, gekapselt im
`SaveManager`-Autoload. Gespeichert werden Spielerposition (`Vector3` + `rotation_y`),
der Debattenfortschritt (`DebateProgress.to_dict()` → `won_ids: Array[int]`) und ein
ISO-Zeitstempel; ein `save_version`-Feld schützt vor stiller Schema-Drift bei künftigen
Migrationsbedarfen (Akzeptanzkriterium 7).

| Baustein | Datei | Rolle |
|---|---|---|
| Persistenz (Autoload) | `game/scripts/autoload/save_manager.gd` (Autoload `SaveManager`) | `save_game`/`load_game`/`has_save`/`get_save_timestamp`/`delete_save`; JSON via `FileAccess`; definierter Fallback bei fehlender/korrupter Datei (leeres Dictionary + `push_warning`, kein Crash) |
| Fortschritt-Schnitt | `game/scripts/autoload/debate_progress.gd` | `to_dict()`/`from_dict()` für die Serialisierung der `won_ids` — keine zweite Repräsentation des Fortschritts (Single-Source) |
| UI-Anbindung | `game/scripts/ui/pause_menu.gd` (`class_name PauseMenu`) | Code-generiertes Pause-Menü (CanvasLayer, `process_mode=ALWAYS`); entkoppelt über Signale `save_requested`/`load_requested`/`resume_requested`/`quit_requested` |
| Integration | `game/scripts/world/wittenberg_intro.gd` | verdrahtet Pause-Menü + Quick-Save/Load (F5/F9); `_on_save`/`_on_load` übersetzen zwischen UI-Signalen, Player-Position und den Autoloads |
| Test | `game/tests/save_load_test.gd` | headless: Save→Load Roundtrip (Position/Fortschritt/Version/Zeitstempel), `DebateProgress`-Roundtrip + idempotent `mark_won`, korrupte + fehlende Datei → Fallback ohne Crash |

### Format-Entscheidung: JSON via FileAccess statt binärer Godot-Resource

Zwei gängige Wege standen zur Wahl (Issue #17): eine eigene `Resource`-Subklasse mit
`ResourceSaver`/`ResourceLoader` (binär, kompakt) oder `FileAccess` + `JSON.stringify`/
`JSON.parse_string` (menschenlesbar). **Entschieden für JSON via FileAccess**:

- **Debugging & Support**: ein Spielstand, den man in einem Texteditor öffnen und lesen
  kann, macht Support-Fälle („mein Spielstand ist weg") trivial diagnostizierbar. Eine
  binäre Resource erfordert den Editor oder ein Skript zum Inspectieren.
- **Schema-Drift-Beherrschung**: das `save_version`-Feld ist im JSON direkt sichtbar;
  künftige Migrationen können gezielt auf Versionen verzweigen, ohne eine binäre Form
  parsen zu müssen.
- **Robustheit bei korrupten Dateien**: fehlerhaftes JSON liefert ein sauberes
  Parse-Ergebnis (leer/null), das als „kein Spielstand" interpretiert wird — eine
  halb geschriebene binäre Resource kann hingegen inkonsistente Teilzustände ergeben.
- **Performance/Größe vernachlässigbar**: ein Lernspiel-Spielstand ist wenige KB
  (Position + ≤ 3 gewonnene IDs + Zeitstempel). Der Größen-/Geschwindigkeitsnachteil
  gegenüber Binär-Serialisierung ist bei dieser Datenmenge nicht messbar.

**Trade-off bewusst akzeptiert**: JSON ist manipulierbar (User kann den Spielstand
editieren) — für ein Lernspiel ohne Wettkampfaspekt ohne Bedeutung (Issue-Non-Goal:
keine Verschlüsselung / kein Anti-Cheat). JSON speichert ints als ints, der Roundtrip
über `JSON.parse_string` liefert jedoch numbers als float zurück; der konsumierende
Code castet daher konsequent über `int()`/`float()` (siehe `DebateProgress.from_dict`,
`wittenberg_intro._on_load`) — keine impliziten Typ-Annahmen auf den geladenen Werten.

**Pfadkonvention**: `user://save.json` — Godot löst `user://` plattformabhängig auf
(macOS: `~/Library/Application Support/Godot/app_userdata/<project>/`), kein
manuelles Pfad-Handling. Single-Save (Non-Goal: keine Multi-Slots), persistiert ist
höchstens ein Spielstand; `delete_save` räumt auf.

**Autoload-Zugriff in headless Tests**: die globalen Autoload-Identifier
(`SaveManager`, `DebateProgress`) sind in `--script`-Läufen nicht garantiert verfügbar
(siehe etablierte Pattern in `debate_ui.gd`); produktive Skripte und Tests greifen per
Node-Pfad-Lookup `get_tree().root.get_node_or_null("/root/SaveManager")` bzw. in
`extends SceneTree`-Tests relativ `root.get_node_or_null("SaveManager")` zu — robust
gegen beide Laufkontexte.
