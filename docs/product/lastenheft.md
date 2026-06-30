# Lastenheft: Godot-Migration "Sola Fide: The Luther Run"

- Stand: 2026-06-30, Branch `chore/game-foundation-planning`
- Auftraggeber-Sicht: dieses Dokument beschreibt das **Was**, nicht das **Wie** — technische Umsetzungsdetails gehören in `docs/architecture/adr/001-godot-desktop-engine.md` und die Stage-C-Architekturdoku.
- Quellen: [`docs/00-discovery/repository-audit.md`](../00-discovery/repository-audit.md), [`docs/architecture/adr/001-godot-desktop-engine.md`](../architecture/adr/001-godot-desktop-engine.md)

## 1. Zielsetzung

"Sola Fide: The Luther Run" soll als echtes, spielbares **3D-Desktop-Spiel** umgesetzt werden, das Reformationstheologie (Sola Fide, Schriftauslegung Luthers) spielerisch vermittelt. Der bisherige Auftrag forderte ein 3D-Spiel; das real existierende Repository liefert dies nicht (siehe Abschnitt 2). Ziel dieser Migration ist ein **neues, additives Godot-4.x-Projekt unter `/game`**, das diesen Anspruch erfüllt, ohne das bestehende Web-Spiel zu gefährden oder zu ersetzen.

## 2. Ist-Zustand (Kurzfassung)

Vollständige, verifizierte Details: [`docs/00-discovery/repository-audit.md`](../00-discovery/repository-audit.md).

- Das bestehende Repo ist ein **2D-Canvas-Web-Spiel** (React 19 + Express 5), **kein** Three.js/React-Three-Fiber-3D-Spiel, wie `CLAUDE.md`/`metadata.json` derzeit fälschlich behaupten.
- Theologischer Content (`constants.ts` `QUESTIONS`) umfasst aktuell **3 Fragen** (Werkgerechtigkeit/Mt 7,21, Päpstlicher Primat/Mt 16,18, Freier Wille/Röm 3,23) — eine schmale, aber fachlich korrekte Grundlage. Keine Annahme einer breiteren Abdeckung (z. B. Ablässe, 95 Thesen).
- `npm run build` läuft fehlerfrei durch, `tsc --noEmit` deckt jedoch 12 reale TypeScript-Fehler auf, die der Vite-Build nicht erkennt (Risiko, Stage-B-Backlog).
- Lokal liegt bereits `godot_assets/` vor (331 MB, git-ignoriert): Kenney Castle Kit + Quaternius Medieval Village MegaKit, passend zu einem Wittenberg-/Reformations-Setting — reale Asset-Grundlage für Stage C, Lizenzprüfung vor Verwendung noch ausstehend.

## 3. Funktionale Anforderungen

### 3.1 3D-Desktop-Spiel (Engine-Grundgerüst)
- Eigenständiges Godot-4.x-Projekt unter `/game`, lauffähig als natives Desktop-Programm (kein Browser).
- Spielbare 3D-Szene mit Spielercharakter, Bewegung im 3D-Raum, Kamera (First- oder Third-Person, Festlegung in Stage-C-Architekturdoku).
- Nutzung der vorhandenen Lowpoly-Asset-Kits (`godot_assets/`) für Umgebung/Gebäude im Reformations-/Wittenberg-Setting, nach Lizenzprüfung.

### 3.2 Reformationstheologie-Lerninhalt
- Übernahme der bestehenden theologischen Inhalte aus `constants.ts` `QUESTIONS` (3 Einträge) in ein Godot-lesbares Format (z. B. `.tres`/JSON); Format-Entscheidung ist Folgearbeit, nicht Teil dieses Lastenhefts.
- Inhaltliche Korrektheit (Bibelstellen, theologische Einordnung) bleibt durchgängig erhalten — keine Verkürzung oder Verfälschung beim Format-Wechsel.
- Erweiterung des Fragenkatalogs (z. B. Ablässe, 95 Thesen) ist explizit **nicht** Teil dieser Migration, sondern eigenständiges Stage-B-Backlog-Item.

### 3.3 Debattensystem
- Ein Dialog-/Debattensystem, das die theologischen Fragen aus 3.2 spielerisch präsentiert (Auswahl von Antwortoptionen, Feedback zu Richtig/Falsch analog zum bestehenden Web-Konzept `DebateInterface`).
- Ob die bestehende Gemini-basierte Theologie-Validierung (`/api/check-theology`) aus dem Express-Backend wiederverwendet wird (z. B. per HTTP-Request aus Godot) oder das Godot-Spiel offline mit vordefinierten Antworten arbeitet, ist in der ADR bewusst offengelassen und in einer Folge-Session zu entscheiden.

### 3.4 Speicherstand
- Persistenter Spielfortschritt (mindestens: Spielstand pro Level/Fortschritt im Debattensystem) muss lokal gespeichert und beim Neustart geladen werden können.
- Konkretes Speicherformat/-mechanismus ist Godot-spezifische Umsetzungsdetail, nicht Teil dieses Lastenhefts.

### 3.5 Steuerung
- Standard-Desktop-Eingabe: Tastatur + Maus für Bewegung, Kamera, Interaktion und Debatten-Auswahl.
- Eingabe muss über Godots Input-Map-System konfigurierbar/remappbar sein (Grundlage für spätere Zugänglichkeits-Anforderungen, siehe 4.3).

## 4. Nicht-funktionale Anforderungen

### 4.1 Cross-Plattform
- Lauffähig als natives Desktop-Programm auf **macOS, Windows und Linux**, exportiert über Godots eingebaute Exportvorlagen.

### 4.2 Performance
- Flüssige Bildwiederholrate auf Standard-Consumer-Hardware (kein dediziertes High-End-GPU-Erfordernis), angemessen für ein Lowpoly-/Voxel-artiges Reformations-Lernspiel.
- Ladezeiten und Speicherverbrauch dürfen den Bildungskontext (z. B. Schul-/Bildungseinrichtungs-Hardware) nicht ausschließen — konkrete Zielwerte sind Stage-C-Architekturdetail.

### 4.3 Zugänglichkeit
- Konfigurierbare Steuerung (siehe 3.5) als Mindestanforderung.
- Lesbare, ausreichend kontrastreiche UI-Texte für die Debatten- und Frageninhalte.
- Weitergehende Zugänglichkeits-Features (Untertitel, Farbblindheits-Modi, Skalierung) sind Backlog-Kandidaten, nicht Pflicht für Stage C.

## 5. Abgrenzung (Out of Scope)

- Das **bestehende Web-Spiel** (React 19 + Express 5, `/` Root) bleibt **vollständig unverändert** bestehen und wird durch diese Migration weder ersetzt noch in seiner Funktion eingeschränkt. Es bleibt als eigenständiges Web-Begleitprodukt erhalten.
- **Kein Code-Sharing auf Engine-Ebene** zwischen Web-Spiel und Godot-Spiel; beide Codebasen sind durch Verzeichnistrennung (Root vs. `/game`) entkoppelt.
- Die Korrektur der fehlerhaften "3D React Three Fiber"-Beschreibung in `CLAUDE.md`/`metadata.json` des Web-Spiels ist eine separate Doku-Korrektur, **nicht** Teil dieses Lastenhefts (siehe Audit Abschnitt 1).
- Die Behebung der 12 TypeScript-Fehler im Web-Spiel (Audit Abschnitt 3) ist **nicht** Teil dieser Migration.
- Die Erweiterung des theologischen Fragenkatalogs über die bestehenden 3 Einträge hinaus ist **nicht** Teil dieses Lastenhefts (eigenes Stage-B-Backlog-Item).
- Die endgültige Lizenzprüfung und Übernahme von `godot_assets/`-Inhalten ins versionierte `/game`-Verzeichnis ist **nicht** Teil dieses Lastenhefts, sondern Voraussetzung/Folgearbeit für Stage C.
- Konkrete Engine-/Implementierungsentscheidungen (Kamera-Perspektive, Speicherformat, Wiederverwendung des Gemini-Backends) sind **nicht** Gegenstand dieses Lastenhefts, sondern der Architekturdokumentation und Folge-Sessions.

## 6. Liefergegenstände je Stage

### Stage A (diese PR — reine Dokumentation, keine Codeänderung)
- Audit (`docs/00-discovery/repository-audit.md`)
- ADR 001 (`docs/architecture/adr/001-godot-desktop-engine.md`)
- Dieses Lastenheft (`docs/product/lastenheft.md`)
- Game Design Document (`docs/product/game-design-document.md`)
- Historische und theologische Content-Policy (`docs/product/historical-and-theological-content-policy.md`)
- Spiel-Architektur (`docs/architecture/game-architecture.md`)
- Risikoregister (`docs/planning/risk-register.md`)
- Definition of Done (`docs/planning/definition-of-done.md`)
- Backlog/Roadmap-Dokumentation (`docs/planning/roadmap.md`, `docs/planning/backlog.md`)
- Testplan (`docs/qa/test-plan.md`)
- Mitwirkenden-Workflow (`docs/contributing/workflow.md`, `CONTRIBUTING.md`, `.github/PULL_REQUEST_TEMPLATE.md`, `.github/ISSUE_TEMPLATE/*`)

### Stage B (GitHub-Issue-Backlog)
- Vollständiger Issue-Katalog für alle Folgearbeiten (Controller, Kamera, Debattensystem, Save/Load, Audio, Zugänglichkeit, Asset-Import, Export-Builds, TS-Fehler-Behebung, Fragenkatalog-Erweiterung).
- Entscheidung, ob Labels/Milestones im realen GitHub-Repo (`arn0ld87/Luther-Game`) angelegt werden oder zunächst nur dokumentiert bleiben.

### Stage C (eigener Branch/PR — erste Codeänderung)
- `/game`-Projektgrundgerüst (Godot-4.x-Projekt, Versionsfestlegung zum Implementierungszeitpunkt).
- Minimale 3D-Bootstrap-Szene (Spielercharakter, Bewegung, Kamera) unter Nutzung geprüfter `godot_assets/`-Inhalte.
- CI-Validierungspipeline (`godot-validate.yml`).
- Kein Vertical Slice (kein vollständiges Debattensystem, kein Speicherstand) — das ist Folgearbeit aus Stage-B-Issues.

### Folge-Sessions (je eigene Branches/PRs, aus Stage-B-Issues)
- Controller- und Kamera-Feinschliff
- Quest-/Dialog-/Debattensystem inkl. Übernahme der theologischen Inhalte
- Save/Load-System
- Audio
- Zugänglichkeits-Features
- Vollständiger Asset-Import aus `godot_assets/`
- Export-Builds für macOS/Windows/Linux

## 7. Abnahmekriterien

### Stage A
- Alle in Abschnitt 6 genannten Stage-A-Dokumente liegen unter `docs/` vor und referenzieren sich gegenseitig korrekt.
- Keine Codeänderung am bestehenden Web-Spiel.
- Alle Aussagen sind durch reale Verifikation gedeckt (Audit), keine unbelegten Annahmen über Tooling, Content-Umfang oder Asset-Stand.

### Stage B
- Für jedes in Abschnitt 6 genannte Folgearbeits-Thema existiert mindestens ein GitHub-Issue im Repo `arn0ld87/Luther-Game`.
- Issues sind eindeutig einer Stage (B-Vorbereitung vs. Folge-Session) zugeordnet.

### Stage C
- `/game`-Verzeichnis enthält ein lauffähiges Godot-4.x-Projekt, das sich lokal öffnen und starten lässt.
- Bootstrap-Szene zeigt einen steuerbaren 3D-Charakter in einer Umgebung mit mindestens einem `godot_assets/`-Modell (nach bestätigter Lizenzprüfung).
- CI-Pipeline `godot-validate.yml` läuft grün.
- Bestehendes Web-Spiel (Root-Verzeichnis) bleibt unverändert lauffähig (`npm run build`, `npm run dev`, `npm run server` weiterhin funktionsfähig).

### Projektweit (über alle Stages)
- Theologische Korrektheit aller übernommenen Inhalte bleibt nachweisbar erhalten (Bibelstellen-Referenzen stimmen mit der Quelle in `constants.ts` überein).
- Keine Vermischung von Web- und Godot-Codebasen, die das Rollback gemäß ADR 001 (`/game` isoliert entfernbar) verhindern würde.
