# Game Design Document — Sola Fide: The Luther Run (Godot-3D-Fassung)

- Stand: 2026-06-30, Branch `chore/game-foundation-planning`
- Status: **Zielkonzept (Stage A)**, keine Codeumsetzung enthalten
- Bezugsdokumente: [`docs/00-discovery/repository-audit.md`](../00-discovery/repository-audit.md), [`docs/architecture/adr/001-godot-desktop-engine.md`](../architecture/adr/001-godot-desktop-engine.md)

> **Hinweis zur Lesart:** Dieses Dokument beschreibt das neue, additive Godot-4.x-3D-Desktop-Spiel unter `/game` (siehe ADR 001). Das bestehende 2D-Web-Spiel (React 19 + Express 5, `Game2DCanvas.tsx`, kein Three.js/R3F) bleibt unverändert bestehen und ist hier nur als Referenz für übernehmbare Konzepte (Game-States, Item-/Enemy-Typen, Theologie-Fragen) relevant. Alle Inhalte, die unten als "Ziel"/"Backlog" markiert sind, existieren **noch nicht** — weder im Web-Spiel noch in Godot.

## 1. Vision / Pitch

Luther flieht durch das Wittenberg der Reformationszeit, sammelt Gnaden-Symbole, weicht Ablasshändlern und Wächtern aus und muss sich an Wendepunkten in einer Debatte gegen theologische Gegenpositionen behaupten — nicht mit Waffengewalt, sondern mit Bibelzitat und Argument. Ziel ist ein kurzes, spielbares 3D-Desktop-Lernspiel, das die zentrale reformatorische Frage "Was rettet — Werk oder Glaube?" über Bewegung, Sammeln und Debatte erfahrbar macht, statt sie nur zu erklären.

Die Godot-Fassung ist kein Remake des 2D-Spiels in 3D, sondern eine eigenständige, aus denselben theologischen Inhalten gespeiste Neuentwicklung mit echtem Desktop-Anspruch (macOS/Windows/Linux-Export, siehe ADR 001).

## 2. Zielgruppe

- Primär: Religions-/Konfirmandenunterricht und kirchliche Bildungsarbeit, Jugendliche ab ca. 12 Jahren.
- Sekundär: Geschichts-/Ethikunterricht (Reformation als Epochenthema), interessierte Erwachsene ohne Vorwissen.
- Spielerfahrung vorausgesetzt: gering. Steuerung muss aus gängigen 3D-Adventure-/Sammelspielen (WASD + Maus, Controller optional) sofort verständlich sein; theologisches Vorwissen wird nicht vorausgesetzt, sondern durch den `context`-Text jeder Debattenfrage mitgeliefert (siehe Abschnitt 6).
- Spielzeit pro Durchlauf: kurzes Format (Zielgröße 15–30 Minuten für den im Ist-Stand vorhandenen Content-Umfang von 3 Fragen, siehe Abschnitt 6), bewusst unterrichtstauglich statt episch.

## 3. Core Loop

1. **Erkunden/Bewegen** — Spieler:in läuft durch eine 3D-Wittenberg-Szene (Marktplatz, Gassen, Kirche).
2. **Sammeln** — Gnaden-Symbole (Ziel-Pendant zu `ItemType.GRACE`) und ggf. weitere Ressourcen aufnehmen, Ablass-Objekten (Ziel-Pendant zu `ItemType.INDULGENCE`) ausweichen oder sie bewusst meiden.
3. **Ausweichen/Begegnen** — Gegnerfiguren (Ziel-Pendant zu `EnemyType.INDULGENCE_SELLER`, `GUARD`) patrouillieren und blockieren Wege; Kontakt kostet Leben statt sofortigem Game-Over.
4. **Checkpoint erreichen** → löst eine **Debatte** aus (3D-Pendant zu `GameState.DEBATE` / `DebateInterface`): eine der hinterlegten theologischen Fragen wird gestellt, Spieler:in antwortet/argumentiert.
5. **Ergebnis** — Sieg schaltet nächsten Bereich/nächste Stage frei (Ziel-Pendant zu `SCORE_DEBATE_WIN`); Niederlage kostet Punkte/Leben, erlaubt aber Wiederholung (kein Hard-Fail), Ziel-Pendant zu `SCORE_DEBATE_LOSE_PENALTY`.
6. Wiederholung mit steigender Dichte an Gegnern/Fragen bis zum finalen Bosskontakt (Ziel-Pendant zu `EnemyType.TETZEL`) und Sieg-/Abspannzustand (Ziel-Pendant zu `GameState.VICTORY`).

Der Loop ist bewusst aus dem bestehenden 2D-State-Modell (`types.ts` `GameState`-Enum: `MENU`, `PLAYING`, `DEBATE`, `ART_STUDIO`, `VICTORY`, `GAME_OVER`, `MAP`, `PAUSED`, `DIALOG`) abgeleitet, nicht neu erfunden — die Godot-Fassung übernimmt dieselbe State-Logik als Godot-State-Machine (z. B. eigener Autoload/`GameStateMachine`-Knoten), nicht den React/`useReducer`-Mechanismus selbst, der Web-spezifisch ist.

## 4. Spielwelt: Wittenberg im Reformationssetting

- Setting: stilisiertes Wittenberg um 1517 — Marktplatz, Kirche (Anspielung auf Thesenanschlag, ohne diesen im Ist-Stand der 3 Fragen bereits inhaltlich zu belegen, siehe Abschnitt 6), Gassen, Stadttor, ländliches Umland.
- Bereits vorhandene reale Asset-Grundlage (lokal, git-ignoriert, `godot_assets/`, ~331 MB, siehe Audit Abschnitt 4):
  - `godot_assets/buildings/kenney_castle-kit/` — Kenney Castle Kit: Burg-/Stadtmauer-Elemente, Türme, Tore. Geeignet für Stadtbefestigung, Kirche/Burg-Silhouette.
  - `godot_assets/buildings/quaternius_medieval-village-megakit/` — Quaternius Medieval Village MegaKit: Fachwerkhäuser, Marktstände, Brunnen, Zäune — Kernmaterial für den Wittenberger Marktplatz und die Wohngassen.
  - `godot_assets/{props,items,characters}/` sind angelegt, aber **noch leer** — Props (Fässer, Karren, Bücherstapel), Items (Gnaden-Symbol-Modell, Ablass-Schein-Modell) und Charaktermodelle (Luther, Ablasshändler, Wächter, Tetzel) müssen noch beschafft/erstellt werden. Kein vorhandenes Asset für diese drei Kategorien — als Backlog markieren, nicht annehmen.
  - Lizenz beider Kits laut Audit vermutlich CC0/Public-Domain-üblich, aber **vor Verwendung textuell zu prüfen** (`License.txt` in `kenney_castle-kit/`) — keine Annahme, sondern Stage-C-Vorbedingung.
- Levelstruktur (Ziel): eine zusammenhängende, kompakte 3D-Open-World-light-Szene statt vieler Einzellevel — angelehnt an die bestehende 2D-`INITIAL_MAP` ("Wittenberg town square", `constants.ts`), aber als begehbarer 3D-Raum statt Tile-Grid. Mehrere Checkpoints lösen Debatten in fortschreitender Reihenfolge aus (entspricht dem 2D-Konzept aus `checkpointX`/`checkpointY` und mehreren Items/Gegnern auf einer Karte).

## 5. Spielmechaniken

### 5.1 Bewegung

- Direkte 3D-Charaktersteuerung (WASD/Stick) mit Third-Person-Kamera (folgt der Spielfigur in festem Abstand/Winkel, kein Free-Cam im MVP).
- Sprint/Ausweichen optional als spätere Erweiterung; im Kern reicht Gehen/Laufen, da das Spiel auf Erkundung und Timing beim Gegnerausweichen setzt, nicht auf Plattform-Präzision.
- Kein Kampfsystem im engeren Sinn (kein `engine/Combat.ts`-Pendant mit Schadenswerten an Gegnern) im MVP — Kontakt mit Gegnern kostet Leben, Vermeidung ist die Kernmechanik, analog zum bestehenden 2D-Modell, das ebenfalls primär auf Ausweichen/Patrouille (`Enemy.state`: `patrol`/`chase`/`attack`) statt komplexem Kampf setzt. Eine spätere Erweiterung um aktive Abwehr (z. B. "Bibelzitat als Schild") ist Backlog, nicht MVP.

### 5.2 Debattensystem (3D-Pendant zu `DebateInterface`)

- Trigger: Betreten eines Checkpoint-Bereichs (3D-Trigger-Volume) pausiert die Spielwelt und öffnet eine Debatten-Oberfläche als 2D-UI-Overlay über der 3D-Szene (kein eigenständiges 3D-Dialogsystem nötig — analog dazu, dass auch das bestehende `DebateInterfaceProps`/`onComplete(success: boolean)`-Modell ein reines UI-Overlay über dem Gameplay ist).
- Ablauf (übernommen aus dem bestehenden `DebateInterfaceProps`-Vertrag: `question: Question`, `onComplete(success: boolean)`):
  1. Frage (`Question.text`) und biblischer Kontext (`Question.context`) werden angezeigt.
  2. Spieler:in formuliert/wählt eine Antwort.
  3. Bewertung der Antwort — im bestehenden Web-Spiel via Express-Backend (`/api/check-theology`, Gemini-Validierung). Für Godot ist die Anbindung **offen**: entweder (a) Wiederverwendung desselben Express-Endpunkts per HTTP-Request aus GDScript (ADR 001 nennt dies als spätere Option, ohne Festlegung), oder (b) ein vereinfachtes lokales Multiple-Choice-/Schlüsselwort-Matching ohne Live-LLM-Aufruf für den Godot-MVP. Diese Entscheidung ist Backlog (Stage-B-Issue), nicht Teil dieses GDD.
  4. Ergebnis triggert `onComplete`-Äquivalent: Erfolg → Punkte/Fortschritt, Misserfolg → Punktabzug, erneuter Versuch möglich (kein permanentes Scheitern an einer einzelnen Frage).
- UI-Stil: ruhiger, lesbarer Vollbild- oder Halbbild-Dialog (Text + ggf. Portrait), kein Echtzeit-Zeitdruck — Debatte ist eine Verständnis-, keine Reflexmechanik.

### 5.3 Sammelmechanik / Ressourcen

Übernahme der bestehenden 2D-Item-Typen (`ItemType`-Enum) als Ziel-Pendant für Godot:

| Typ (2D-Ist-Stand) | Bedeutung | Godot-Ziel-Pendant |
|---|---|---|
| `GRACE` | positives Sammelitem (Gnade) | 3D-Sammelobjekt, erhöht Score (Ziel-Pendant zu `SCORE_COLLECT = 10`) |
| `INDULGENCE` | negatives/warnendes Item (Ablass) | 3D-Objekt zum Meiden oder bewusst aufzunehmen als Lernmoment (z. B. löst Kommentar/Mini-Dialog aus statt reinem Punktabzug) — Designentscheidung offen, Backlog |
| `SCROLL` | im 2D-Ist-Stand als Enum-Wert vorhanden, in `INITIAL_MAP`-Items aktuell **nicht platziert** | Ziel: Schriftrollen als Lore-/Bibelvers-Sammelobjekte, optionaler Content abseits der Pflichtroute |
| `HEART` | im 2D-Ist-Stand als Enum-Wert vorhanden, in `INITIAL_MAP`-Items aktuell **nicht platziert** | Ziel: Lebensauffüllung, falls ein Lebenssystem (siehe 5.1/7) übernommen wird |

Lebenssystem-Ziel: analog zu `GAME_CONFIG.MAX_HEALTH = 6` (3 volle Herzen à 2 Halbherzen) im 2D-Ist-Stand — als Konzept für Godot übernehmbar, exakte Werte sind Tuning-Aufgabe der Implementierung, nicht hier festzulegen.

## 6. Content-Umfang: realistisch, nicht angenommen

**Ist-Stand (verifiziert, `constants.ts:143-159`):** genau **3 theologische Fragen**, alle auf Deutsch, mit `id`, `text`, `context` (Typ `Question`, `types.ts:138-142`):

1. **Werkgerechtigkeit** (Matthäus 7,21) — "Muss ich gute Werke tun, um von Gott geliebt zu werden?"
2. **Päpstlicher Primat** (Matthäus 16,18) — "Ist der Papst das Oberhaupt der Kirche?"
3. **Freier Wille** (Römer 3,23) — "Haben wir einen freien Willen zum Guten?"

Begriffe wie "Ablässe" (als eigenständige Debattenfrage) oder "95 Thesen" kommen in diesen 3 Einträgen **wörtlich nicht vor** — das Gesamtthema (Sola Fide, Reformationstheologie) passt, eine breitere inhaltliche Abdeckung existiert aber nicht und darf nicht als bereits vorhanden angenommen werden.

**Konsequenz für den Godot-MVP:** Der MVP-Loop ist für **3 Checkpoints/Debatten** auszulegen, nicht für ein langes Kapitelspiel. Das ist ausreichend für einen kurzen, in sich geschlossenen Spieldurchlauf (siehe Zielgruppe/Spielzeit, Abschnitt 2), aber explizit kein "fertiges" Vollspiel.

**Content-Backlog (Ziel, nicht Ist-Stand, jeweils eigenes Stage-B-Issue):**

- Ablasshandel/Tetzel als eigenständige Debattenfrage (inhaltlich naheliegend, da `EnemyType.TETZEL` als Bossgegner bereits im 2D-Datenmodell existiert, aber bisher **ohne zugehörige Debattenfrage**).
- 95-Thesen-Bezug als eigene Frage/Questline.
- Rechtfertigungslehre, Schriftprinzip (sola scriptura), Priestertum aller Gläubigen als weitere klassische Reformationsthemen — aktuell **nicht** im Fragenkatalog enthalten.
- Erweiterung von 3 auf z. B. 8–12 Fragen für ein vollständigeres Lernspiel, mit Schwierigkeits-/Themenstufen.
- Format-Entscheidung: ob neue Fragen als Duplikat in `constants.ts` (Web) und einer Godot-`.tres`/JSON-Ressource gepflegt werden, oder ob ein gemeinsamer Generierungsschritt aus einer Quelle beide befüllt — laut ADR 001 ausdrücklich offene Folgearbeit, keine Festlegung in diesem GDD.

## 7. Progression

- **Linear mit Wiederholbarkeit:** 3 Checkpoints in fester Reihenfolge (Schwierigkeit/Themen-Tiefe steigt leicht von Frage 1 zu Frage 3), Misserfolg bei einer Debatte führt zu Wiederholung am selben Checkpoint, nicht zu Levelneustart.
- **Score** als sekundäres Fortschrittssignal (Ziel-Pendant zu den 2D-`GAME_CONFIG`-Werten `SCORE_COLLECT`, `SCORE_HIT_PENALTY`, `SCORE_DEBATE_WIN`, `SCORE_DEBATE_LOSE_PENALTY`, `SCORE_ENEMY_KILL`) — dient der Selbsteinschätzung ("wie sauber war mein Durchlauf"), ist aber kein Fail-Kriterium.
- **Abschluss:** nach der 3. Debatte (aktuell Frage 3, "Freier Wille") folgt ein Sieg-/Abspannzustand (Ziel-Pendant zu `GameState.VICTORY`) mit kurzer thematischer Zusammenfassung ("Sola Fide" als Kernaussage).
- **Spätere Erweiterung (Backlog):** mit wachsendem Fragenkatalog (Abschnitt 6) eine Kapitel-/Stage-Struktur statt reiner linearer 3-Schritt-Folge, optional eine Godot-Pendant zu `GameState.MAP` (Übersichtskarte zur Stage-Auswahl) und `ART_STUDIO` (aktuell ein KI-Asset-Generierungsfeature im Web-Spiel — für Godot **nicht** vorgesehen im MVP, da es eine Live-Gemini-Anbindung voraussetzt, die in Abschnitt 5.2 ohnehin als offene Frage markiert ist).

## 8. UI/HUD-Konzept

Ziel-HUD, abgeleitet aus dem bestehenden `HUD2DProps`-Vertrag (`score`, `health`, `maxHealth`, `currentStage`, `totalStages`), als 3D-tauglicher Screen-Space-Overlay (Godot `CanvasLayer`/`Control`-Knoten über der 3D-Viewport-Szene):

- **Lebensanzeige** oben links, Herz-Icons (analog `COLORS.heartFull`/`heartEmpty` aus dem 2D-Ist-Stand), Anzahl abhängig vom finalen `MAX_HEALTH`-Wert.
- **Score** oben rechts, einfache Zahl mit Iconunterstützung (Gnaden-Symbol-Icon).
- **Stage-/Checkpoint-Fortschritt** ("Frage 1/3" o. ä.) als kleine Kapitelanzeige, dezent platziert, nicht aufdringlich.
- **Debatten-Overlay** (Abschnitt 5.2) als eigener, das HUD temporär verdeckender Vollbild-/Halbbild-Screen, klar optisch vom laufenden Spiel abgesetzt (z. B. Buch-/Pergament-Rahmenmotiv passend zur Art-Direction).
- **Menü/Pause** (Ziel-Pendant zu `GameState.MENU`/`PAUSED`) als einfaches Godot-`Control`-Menü, keine 3D-Diegese nötig.
- Kein Item-Inventar-UI im MVP nötig, da Items direkt beim Einsammeln in Score/Leben umgesetzt werden (kein Tragen/Verwalten von Gegenständen vorgesehen).

## 9. Art-Direction

- **Stilrichtung:** Lowpoly, abgeleitet aus dem Stil der vorhandenen Asset-Kits (Kenney Castle Kit, Quaternius Medieval Village MegaKit) — klare Flächen, reduzierte Polygonzahl, kräftige statt fotorealistische Texturen/Vertex-Colors, passend zu einem zugänglichen Lernspiel ohne hohen Produktionsaufwand.
- **Farbsprache:** Anlehnung an die bestehende 2D-Palette (`COLORS` in `constants.ts`, SNES-Zelda-inspiriert: warme Erdtöne für Wege/Gebäude, sattes Grün für Vegetation, Gold/Gelb für das Gnaden-Item, Rot/Dunkelrot für Ablass-Item und Luthers Robe) als grobe Stimmungsvorgabe — keine 1:1-Pixelfarbübernahme, da 3D-Lowpoly-Shading andere Anforderungen hat als 2D-Pixelart.
- **Charaktere:** Lowpoly-Humanoidmodelle im Stil der Quaternius-Reihe (vereinfachte Proportionen, klare Silhouette) für Luther, Ablasshändler, Wächter, Tetzel — aktuell **kein** passendes Charaktermodell im vorhandenen Assetbestand (`godot_assets/characters/` ist leer), daher eigene Beschaffung/Erstellung als Backlog-Punkt.
- **Beleuchtung:** einfache, freundliche Tageslicht-Stimmung als Standard (kein Horror-/Dark-Fantasy-Ton), passend zum Bildungsanspruch; optional dramatischere Beleuchtung für den Tetzel-Bosskontakt als Stimmungsbruch.
- **Kamera:** feste Third-Person-Distanz, leicht erhöhter Winkel, um Übersicht über Marktplatz-Layout und patrouillierende Gegner zu erhalten.

## 10. Sound/Musik

- **Aktueller Stand: keine Audio-Assets für Godot vorhanden.** Das bestehende 2D-Web-Spiel hat ein eigenes `services/audio.ts`, das ausschließlich für das Web-Spiel gilt und **nicht** automatisch für Godot wiederverwendbar ist (anderes Laufzeit-/Dateiformat-Modell, andere Engine-API).
- **Platzhalterkonzept (Ziel, kein vorhandenes Material):**
  - Ambiente-Musik: ruhiges, mittelalterlich angehauchtes Instrumentalstück (z. B. Laute/Streicher-Loop) für die Erkundungsphase.
  - Eigenständiger, spürbar anderer Musik-Cue für Debatten-Overlays (ruhiger, fokussierter, ohne Zeitdruckcharakter).
  - Kurzer Spannungs-Cue für den Tetzel-Bosskontakt.
  - SFX: Schrittgeräusch, Item-Aufnahme (Gnade positiv, Ablass negativ/warnend unterscheidbar), Treffer-Feedback bei Gegnerkontakt, Erfolgs-/Fehlschlag-Sound am Ende einer Debatte.
- **Lizenzfrage:** analog zu den Lowpoly-Assets muss jede künftig beschaffte Audioquelle (z. B. CC0-Bibliotheken wie Kenney Audio Packs) vor Verwendung lizenzrechtlich geprüft werden — keine Annahme freier Verwendbarkeit ohne Prüfung.
- Diese Sound/Musik-Sektion ist bewusst als Platzhalter/Backlog zu verstehen, nicht als Auftrag an dieses Dokument, bereits Audiodateien zu beschaffen oder zu produzieren.

## 11. Offene Entscheidungen (Zusammenfassung)

- Anbindung der Theologie-Validierung in Godot: HTTP-Reuse des bestehenden Express-Backends vs. lokales Matching ohne Live-LLM (Abschnitt 5.2).
- Format/Pflegeweg für theologische Inhalte zwischen Web (`constants.ts`) und Godot (`.tres`/JSON) (Abschnitt 6, ADR 001).
- Umfang und Reihenfolge der Content-Erweiterung über die bestehenden 3 Fragen hinaus (Abschnitt 6).
- Lizenzprüfung der vorhandenen Kenney-/Quaternius-Kits vor jeder Verwendung in Stage C (Abschnitt 4, Audit Abschnitt 4).

Diese Punkte sind keine Lücken dieses GDD, sondern bewusst an Stage B (Issue-Backlog) bzw. Stage C (Implementierung) delegierte Folgeentscheidungen, wie in ADR 001 vorgesehen.
