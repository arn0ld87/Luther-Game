# Sola Fide: The Luther Run — Godot-Projekt

Godot-4-Projekt der "Sola Fide"-Migration (siehe `docs/architecture/adr/001-godot-desktop-engine.md` und `docs/planning/roadmap.md`, Meilenstein **M0**).

## 1. Voraussetzungen

- **Godot 4.7-stable** (Standard-Build, kein Mono/.NET nötig)
- Der Editor wird **nicht** im Repo committet — jede Person lädt sich Godot selbst herunter und installiert ihn lokal (siehe `.godot-editor/`-Eintrag in `.gitignore`)
- macOS, Linux oder Windows; nachfolgende Befehle sind für macOS (zsh) formuliert, unter Linux/Windows entsprechend anpassen

## 2. Installation

Download über die GitHub CLI (`gh`), **kein** `curl`/`wget` nötig — `gh release download` nutzt einen eigenen HTTP-Client:

```bash
gh release download 4.7-stable --repo godotengine/godot \
  --pattern "Godot_v4.7-stable_macos.universal.zip"
gh release download 4.7-stable --repo godotengine/godot \
  --pattern "SHA512-SUMS.txt"
```

Anschließend **immer** den SHA512-Hash der heruntergeladenen ZIP gegen `SHA512-SUMS.txt` aus demselben Release prüfen, bevor das Archiv entpackt wird:

```bash
shasum -a 512 -c <(grep "Godot_v4.7-stable_macos.universal.zip" SHA512-SUMS.txt)
```

Erst bei `OK` entpacken und den Editor ausführbar machen:

```bash
unzip Godot_v4.7-stable_macos.universal.zip
chmod +x Godot.app/Contents/MacOS/Godot
```

**Wichtige Lektion aus der Praxis:** Der erste Download kann mit einem HTTP/2-Stream-Fehler mittendrin abbrechen, ohne dass das beim bloßen Hinsehen auffällt — das Ergebnis ist eine verkürzte, aber augenscheinlich plausible ZIP-Datei (in einem konkreten Fall 135 MB statt der korrekten 158 MB), die einen falschen SHA512-Hash gegen `SHA512-SUMS.txt` liefert. Allein die Dateigröße zu prüfen reicht nicht aus, um das zu bemerken. Bei einem fehlgeschlagenen Hash-Check: Download wiederholen und erneut gegen `SHA512-SUMS.txt` verifizieren, **nicht** einfach die vorhandene Datei weiterverwenden.

Die Versionsprüfung bestätigt eine funktionierende Installation:

```bash
./Godot.app/Contents/MacOS/Godot --version
# Erwartete Ausgabe (Beispiel): 4.7.stable.official.5b4e0cb0f
```

## 3. Projekt öffnen / starten

**Editor-GUI:**

```bash
./Godot.app/Contents/MacOS/Godot --path game
```

Öffnet den Godot-Editor mit diesem Projekt (`project.godot`, Hauptszene `res://scenes/bootstrap.tscn`).

**Headless (ohne GUI, z. B. für CI/Skripte):**

```bash
./Godot.app/Contents/MacOS/Godot --headless --path game --quit
```

## 4. Verifikation / Test

Es gibt aktuell keine automatisierte Test-Suite (siehe `tests/`-Verzeichnis als Platzhalter für künftige GUT/GDUnit-Tests). Die Verifikation erfolgt über zwei reale, headless ausführbare Godot-Aufrufe, die beide mit Exit-Code `0` durchlaufen müssen:

**a) Import-Check** — prüft, ob Godot alle Assets/Ressourcen des Projekts fehlerfrei importieren kann (legt/aktualisiert `.godot/`-Importcache, deckt kaputte Ressourcenreferenzen auf):

```bash
./Godot.app/Contents/MacOS/Godot --headless --path game --import --quit-after 1000
echo $?   # erwartet: 0
```

**b) Projekt-Boot-Check** — lädt das Projekt inklusive der konfigurierten Hauptszene (`bootstrap.tscn`) und beendet sich sauber. Prüft, dass `project.godot` valide ist und die Hauptszene ohne Laufzeitfehler instanziiert werden kann:

```bash
./Godot.app/Contents/MacOS/Godot --headless --path game --quit
echo $?   # erwartet: 0
```

Beide Befehle dürfen keine Fehlermeldungen in der Konsolenausgabe erzeugen.

## 5. Steuerung

**Aktuell keine.** Die Bootstrap-Szene (`scenes/bootstrap.tscn`) enthält bewusst keinen Spielercode: Das `CharacterBody3D`-Node ist leer (nur eine `CollisionShape3D` als Platzhalter, keine Bewegungs-, Input- oder Kamerasteuerungslogik). Es existiert in dieser Stage schlicht nichts zu steuern — Spielersteuerung ist Folgearbeit eines späteren Meilensteins.

## 6. Export

`export_presets.cfg` liegt als **Konfigurationsskelett** im Projekt, ist aber **nicht** durch einen echten Godot-Export validiert worden — die dafür nötigen Export-Templates (mehrere hundert MB) wurden in dieser Stage bewusst nicht heruntergeladen. Das ist eine explizite Grenze von Stage C (siehe `docs/architecture/adr/001-godot-desktop-engine.md` und `docs/planning/roadmap.md`, Meilenstein „M0"). Ein funktionierender Export-Build ist erst Teil eines späteren Meilensteins.

## 7. Assets

Lokale Asset-Quellen (Kenney Castle Kit, Quaternius Medieval Village MegaKit u. a., Verzeichnis `godot_assets/`) liegen bereits auf der Maschine, sind aber **git-ignoriert** und **noch nicht** in dieses Godot-Projekt importiert. Der Import ist als eigenständige Folgearbeit vorgesehen, siehe `docs/planning/github-import-backlog.md` (betrifft kommende M1–M4-Issues).
