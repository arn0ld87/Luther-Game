# Asset-Lizenz-Audit — `godot_assets/`

> **Issue #10** — wörtliche Lizenzprüfung aller extern bezogenen Asset-Packs in `godot_assets/`.
> Maschinenlesbares Register: [`asset-decision-register.csv`](./asset-decision-register.csv).
> Attributionspflichten: [`/ATTRIBUTIONS.md`](../../ATTRIBUTIONS.md).
> Inventur & Security: [`asset-audit-worklog.md`](./asset-audit-worklog.md), [`asset-inventory.md`](./asset-inventory.md).
>
> **Audit-Datum:** 2026-07-01 · **Stand:** `main` @ `58020b5`

## ⚖️ Verbindliche Nutzungsregel

> **Nur Assets mit Entscheidung `APPROVED` oder `APPROVED_WITH_ATTRIBUTION` dürfen nach `/game/assets/` übernommen und im Spiel verwendet werden.**
> Assets mit `QUARANTINED` oder `EXCLUDED` bleiben außerhalb von `/game` und außerhalb des Spiels, bis (bei `QUARANTINED`) die Herkunft/Lizenz eindeutig geklärt ist.
> Der Import nach `/game/assets/` (M1) darf **erst nach** dieser Prüfung erfolgen — er ist Gegenstand eines separaten Integrations-Issues, nicht dieses Audits.

## Ergebnisübersicht

| Entscheidung | Anzahl |
|---|---|
| `APPROVED` (CC0 / Public Domain) | 14 |
| `APPROVED_WITH_ATTRIBUTION` (CC-BY 3.0) | 6 |
| `QUARANTINED` (Herkunft/Lizenz unklar) | 0 |
| `EXCLUDED` (restriktiv bzw. nicht auflösbar / nicht vorhanden) | 4 |
| **Registereinträge gesamt** | **24** |

## Prüfmethode

1. **Sicherheitsscan** von `godot_assets/`: keine Skripte/Executables/Symlinks (`asset-audit-worklog.md`). Damit greift die Ausschlussregel für mitgelieferte ausführbare Dateien nicht — es sind keine vorhanden.
2. **Lokale Lizenzdateien** (7 × `License*.txt`) wörtlich gelesen; entscheidende Passage je unten zitiert.
3. **Fehlende lokale Lizenz** (OGA-Charaktere/Musik/Sounds, alle poly.pizza-Modelle): Lizenz **ausschließlich** über die offizielle Ursprungsseite (OpenGameArt bzw. poly.pizza) verifiziert, mit wörtlichem Zitat und Abrufdatum (2026-07-01). Keine Ableitung aus Dateinamen.
4. **SHA-256** je Ursprungspaket bzw. Einzeldatei berechnet (im CSV-Register).
5. **Konservative Entscheidung**: alles ohne eindeutig belegte, projektkompatible (kommerziell nutzbar, bearbeitbar, weitergebbar) Lizenz → `QUARANTINED`/`EXCLUDED`.

## APPROVED — CC0 / Public Domain (keine Attributionspflicht)

Lokal per `License.txt` belegt:

- **Kenney Castle Kit** — `buildings/kenney_castle-kit/License.txt`:
  > „License: (Creative Commons Zero, CC0) … You can use this content for personal, educational, and commercial purposes. Support by crediting 'Kenney' … (this is not a requirement)"
- **Kenney Impact Sounds / RPG Audio / UI Audio** — je eigene `License.txt`, jeweils „License (Creative Commons Zero, CC0) … personal and commercial projects. Credit … not mandatory."
- **KayKit Medieval Hexagon Pack (FREE)** — `.../License.txt`:
  > „License: (Creative Commons Zero, CC0) … free to use in personal, educational and commercial projects. Support me by crediting Kay Lousberg … (this is not mandatory)"
- **Quaternius Medieval Village MegaKit (Standard FREE)** — `License_Standard.txt`:
  > „License: CC0 1.0 Universal (CC0 1.0) Public Domain Dedication" — ausdrücklich nur die **Standard-FREE-Teilmenge**; PRO/SOURCE nicht im Bestand.
- **Quaternius LowPoly RPG Characters (Nov 2020)** — `License.txt`: „License: CC0 1.0 Universal (CC0 1.0) Public Domain Dedication".

Über offizielle Quelle (OpenGameArt / poly.pizza, Abruf 2026-07-01) als CC0 verifiziert:

- **OGA LowPoly Animated Knight** (quaternius) — „License(s): CC0".
- **OGA Monk** (`.blend`) — „License(s): CC0"; **Autor CDmir** (Collab. TinyWorlds). *Korrektur ggü. `MANIFEST.md`, das Quaternius vermutete.*
- **OGA 20 Sword Sound Effects** (StarNinjas) — „License(s): CC0"; „Credit is appreciated … (Just put a link to my OGA profile)" (optional).
- **OGA Town Theme RPG** (cynicmusic) — „License(s): CC0".
- **OGA Battle Theme** (Wolfgang_) — „License(s): CC0"; „You do not have to credit me."
- **OGA Boss Battle Music** (SubspaceAudio) — „License(s): CC0".
- **poly.pizza Temple** (Quaternius) — „Public Domain (CC0)".

## APPROVED_WITH_ATTRIBUTION — CC-BY 3.0 (Attributionspflicht)

Alle über poly.pizza verifiziert (Abruf 2026-07-01), Lizenzlink jeweils → `creativecommons.org/licenses/by/3.0/`. Exakte Attributionstexte in [`/ATTRIBUTIONS.md`](../../ATTRIBUTIONS.md):

| Asset | Autor | Quelle |
|---|---|---|
| `polypizza_church_poly-by-google.glb` | Poly by Google | https://poly.pizza/m/0Oe72PEPCK6 |
| `polypizza_gothic-set/Cathedral.glb` | Bruno Oliveira | https://poly.pizza/m/fEJKTKNRAsN |
| `polypizza_gothic-set/Castle.glb` | Poly by Google | https://poly.pizza/m/aG0AF5d-zbY |
| `polypizza_gothic-set/Cemetary.glb` | Poly by Google | https://poly.pizza/m/c5L6hAdX3ua |
| `polypizza_gothic-set/Gate.glb` | Poly by Google | https://poly.pizza/m/711AlCsueib |
| `polypizza_gothic-set/Archway.glb` | Poly by Google | https://poly.pizza/m/d6lqRR2TU0i |

## QUARANTINED — Herkunft/Lizenz nicht eindeutig verifizierbar

_Keine Einträge._ Die zuvor quarantänierten poly.pizza-Church-Varianten wurden nach Prüfung der Kandidatenquellen auf `EXCLUDED` gesetzt (siehe unten).

## EXCLUDED — restriktiv, nicht auflösbar oder nicht vorhanden

- **`polypizza_gothic-set/Church.glb`** und **`polypizza_gothic-set/Church (1).glb`** — `MANIFEST.md` nennt drei Church-Suchvarianten **ohne eindeutige Datei-zu-URL-Zuordnung**. Verifikation der Kandidatenquellen (offizielle poly.pizza-Seiten, Abruf 2026-07-01): `https://poly.pizza/m/6vzTphxL9w4` → **CC-BY** (Autor: Poly by Google), `https://poly.pizza/m/8jSIJfw17cz` → **CC-BY** (Autor: Poly by Google), `https://poly.pizza/m/GHzPfvoyzX` → **CC0** (Autor: CreativeTrio). Die Kandidaten stammen damit von **zwei verschiedenen Autoren und Lizenzen**; ohne eindeutige Datei-zu-Quelle-Zuordnung ist die bei CC-BY **zwingende korrekte Attribution nicht garantierbar**. Zudem sind beide Varianten **redundant** zur bereits freigegebenen, verifizierten `polypizza_church_poly-by-google.glb` (eigene, belegte CC-BY-Quelle). Konservativ **ausgeschlossen**.
- **`oga_music/ChurchBell_ccbysa.mp3`** — verifiziert **CC-BY-SA 3.0** (Ulrich Metzner, submitted by qubodup; OGA). Share-Alike verlangt, dass abgeleitete Werke unter denselben Bedingungen stehen — für ein potenziell veröffentlichtes, nicht-SA-Spiel rechtlich unpassend. **Ausgeschlossen.** Ersatz: eine CC0-Glocke suchen, falls ein Glockenklang gebraucht wird.
- **Sketchfab Monk Character (Inuciian, CC-BY 4.0)** — laut `MANIFEST.md` „noch offen, Login erforderlich", **nicht im Bestand**. Außerhalb des Scope; **ausgeschlossen**, bis (falls gewünscht) bewusst geladen und dann als CC-BY mit Attribution geführt.

## Anmerkungen zur Datenqualität

- Das lokale `godot_assets/MANIFEST.md` war ein brauchbarer Ausgangspunkt, aber **nicht** die Freigabegrundlage. Zwei relevante Abweichungen wurden korrigiert: (1) Monk-Autor ist **CDmir**, nicht Quaternius; (2) ChurchBell ist **CC-BY-SA** (nicht CC-BY) und damit ausgeschlossen statt attribuierbar.
- Die Roh-ZIPs unter `_downloads/` (206 MB) sind reine Bearbeitungs-/Ursprungsquellen und werden **nicht** ins Repo übernommen; ihre SHA-256 sind zur Nachvollziehbarkeit im Register erfasst.
