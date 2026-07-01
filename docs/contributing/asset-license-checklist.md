# Asset-Lizenz-Checkliste (Freigabe neuer Asset-Packs)

Wiederverwendbarer Schritt-für-Schritt-Prozess, der **vor** dem Commit/Import jedes
neuen Drittanbieter-Asset-Packs nach `game/assets/` verpflichtend abzuarbeiten ist.
Adressiert **Risk #7** aus dem [Risk Register](../planning/risk-register.md) und baut auf
dem Erst-Audit (#10) auf: [`docs/assets/asset-license-audit.md`](../assets/asset-license-audit.md).

> **Grundregel:** Nur Assets mit Entscheidung `APPROVED` oder
> `APPROVED_WITH_ATTRIBUTION` dürfen nach `game/assets/`. `QUARANTINED`/`EXCLUDED`
> bleiben außerhalb von `game/` und außerhalb des Spiels.

Der automatisierte **CI-License-Gate** (`node game/tools/check_asset_licenses.mjs`,
Teil von [`godot-validate.yml`](../../.github/workflows/godot-validate.yml)) erzwingt
Schritt 8 maschinell: er schlägt fehl, sobald eine Modell-/Audio-Datei
(`.glb .gltf .obj .ogg .mp3 .wav`) unter `game/assets/**` **nicht** als
`res://`-Eintrag im Katalog geführt ist. Die Checkliste stellt sicher, dass ein
Asset überhaupt katalogisiert werden **darf**.

## Schritt-für-Schritt

### 1. Lizenzdatei lesen (wörtlich, nicht annehmen)
- Mitgelieferte `License*.txt` / `LICENSE` / `README` des Packs **wörtlich** lesen.
- Fehlt eine lokale Lizenzdatei, die Lizenz **ausschließlich** über die offizielle
  Ursprungsseite (z. B. Kenney, OpenGameArt, poly.pizza, itch.io) verifizieren —
  mit wörtlichem Zitat und Abrufdatum. **Keine** Ableitung aus Dateinamen.

### 2. Quelle & Autor/Rechteinhaber festhalten
- Original-URL (Downloadseite), Autor/Rechteinhaber, Pack-Name, Versions-/Variantenname
  (z. B. „FREE"/„Standard" vs. „PRO"/„SOURCE" — nur die tatsächlich enthaltene Variante).

### 3. Nutzungsrechte prüfen (alle vier müssen erfüllt sein)
- [ ] **Kommerzielle Nutzung** erlaubt
- [ ] **Bearbeitung/Modifikation** erlaubt
- [ ] **Redistribution** (Weitergabe im Spiel/Repo) erlaubt
- [ ] **Attribution** — falls Pflicht (CC-BY): erforderlichen Attributionstext notieren

### 4. Restriktive Klauseln ausschließen (harte Blocker)
- [ ] **NC** (NonCommercial) — ausschließen → `EXCLUDED`
- [ ] **ND** (NoDerivatives) — ausschließen → `EXCLUDED`
- [ ] **SA** (ShareAlike) — ausschließen (Copyleft-Ansteckung) → `EXCLUDED`
- Bei unklarer/nicht eindeutig belegter Lizenz → `QUARANTINED` (nicht importieren,
  bis geklärt).

### 5. Security-Scan
- [ ] Keine Skripte/Executables im Pack (`.exe`, `.sh`, `.bat`, `.js`, Makefiles …)
- [ ] Keine Symlinks
- [ ] Nur erwartete Datentypen (Modelle, Texturen, Audio, Lizenz-/Doku-Dateien)

### 6. Integrität: SHA-256
- [ ] SHA-256 je Ursprungspaket bzw. Einzeldatei berechnen und im Register hinterlegen
      (`shasum -a 256 <datei>`).

### 7. Nur freigegebene Teilmenge kopieren
- [ ] Ausschließlich `APPROVED`/`APPROVED_WITH_ATTRIBUTION`-Dateien gezielt nach
      `game/assets/<kategorie>/<quelle>/<pack>/` übernehmen — **nie** das ganze
      git-ignorierte `godot_assets/`-Verzeichnis kopieren.

### 8. Registrieren (Single Source of Truth)
- [ ] Zeile in [`docs/assets/asset-decision-register.csv`](../assets/asset-decision-register.csv)
      ergänzen (alle Spalten: Lizenz, Nutzungsrechte, SHA-256, Security-Status, Entscheidung, Datum).
- [ ] Pack in `game/tools/generate_asset_catalog.mjs` (Array `PACKS`, ggf. `OVERRIDES`)
      eintragen und Katalog regenerieren:
      ```
      node game/tools/generate_asset_catalog.mjs
      ```
- [ ] Bei Attributionspflicht (CC-BY): Eintrag in [`/ATTRIBUTIONS.md`](../../ATTRIBUTIONS.md) ergänzen.
- [ ] Ggf. CC0-Lizenzkopie unter `game/assets/licenses/` ablegen.

### 9. Gate lokal grün stellen
- [ ] `node game/tools/check_asset_licenses.mjs` → **Exit 0** (keine un-katalogisierten Assets).
- [ ] `node --check game/tools/check_asset_licenses.mjs` (falls das Tool angefasst wurde).

## Verweise
- Erst-Audit & Prüfmethode: [`docs/assets/asset-license-audit.md`](../assets/asset-license-audit.md)
- Maschinenlesbares Register: [`docs/assets/asset-decision-register.csv`](../assets/asset-decision-register.csv)
- Attributionen: [`/ATTRIBUTIONS.md`](../../ATTRIBUTIONS.md)
- CI-Gate & Katalog: [`game/tools/check_asset_licenses.mjs`](../../game/tools/check_asset_licenses.mjs),
  [`game/tools/generate_asset_catalog.mjs`](../../game/tools/generate_asset_catalog.mjs)
- Mitwirkenden-Workflow: [`workflow.md`](./workflow.md)
