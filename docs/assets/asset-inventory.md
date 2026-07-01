# Asset-Inventar — `godot_assets/`

> Strukturelle Bestandsaufnahme je Pack (Stand 2026-07-01, `main` @ `58020b5`).
> **Enthält keine Freigaben.** Lizenzentscheidungen: [`asset-license-audit.md`](./asset-license-audit.md),
> [`asset-decision-register.csv`](./asset-decision-register.csv). Attributionspflichten: [`/ATTRIBUTIONS.md`](../../ATTRIBUTIONS.md).
>
> Quelle der Mengen: rekursiver Datei-Walk über `godot_assets/`. SHA-256 je Ursprungs-ZIP / Einzeldatei
> ist im CSV-Register erfasst.

## Übersicht

| Pack / Asset | Kategorie | Lokale Lizenzdatei | Lizenzquelle |
|---|---|---|---|
| `kenney_castle-kit/` | buildings | ✅ `License.txt` | lokal verifiziert |
| `quaternius_medieval-village-megakit/…[Standard]/` | buildings | ✅ `License_Standard.txt` | lokal verifiziert |
| `kaykit_medieval-hexagon-pack/…_FREE/` | buildings | ✅ `License.txt` | lokal verifiziert |
| `polypizza_church_poly-by-google.glb` | buildings | ❌ | offizielle Quelle (poly.pizza) |
| `polypizza_temple_quaternius_cc0.glb` | buildings | ❌ | offizielle Quelle (poly.pizza) |
| `polypizza_gothic-set/` (7 GLB) | buildings | ❌ | offizielle Quelle (poly.pizza) |
| `knight-character_quaternius_cc0/` | characters | ❌ | offizielle Quelle (OpenGameArt) |
| `lowpoly-rpg-characters_cc0/…/` | characters | ✅ `License.txt` | lokal verifiziert |
| `oga_monk_cc0.blend` | characters | ❌ | offizielle Quelle (OpenGameArt) |
| `kenney_impact-sounds/` | audio | ✅ `License.txt` | lokal verifiziert |
| `kenney_rpg-audio/` | audio | ✅ `License.txt` | lokal verifiziert |
| `kenney_ui-audio/` | audio | ✅ `License.txt` | lokal verifiziert |
| `oga_sword-sounds_cc0/` (20 OGG) | audio | ❌ | offizielle Quelle (OpenGameArt) |
| `oga_music/` (4 Dateien) | audio | ❌ | offizielle Quelle (OpenGameArt) |

## Detail je Pack

### buildings/kenney_castle-kit/
- **Inhalt:** Burg-/Befestigungsmodelle (GLB/FBX/OBJ + Texturen), `Overview.html`, `License.txt`, `.url`-Shortcuts.
- **Ursprungs-ZIP:** `_downloads/kenney_castle-kit.zip`
- **Geplante Nutzung:** Wittenberg-Stadtmauer / Befestigungen.

### buildings/quaternius_medieval-village-megakit/ (Standard-FREE)
- **Inhalt:** Modulare Dorf-Elemente (OBJ/FBX/glTF), nur die **Standard-FREE-Teilmenge** (PRO/SOURCE nicht im Bestand).
- **Ursprungs-ZIP:** `_downloads/quaternius_medieval-village-megakit.zip`
- **Geplante Nutzung:** Marktplatz, Häuser, modularer Stadtaufbau.

### buildings/kaykit_medieval-hexagon-pack/ (FREE)
- **Inhalt:** Hex-Tiles/Gebäude/Props (GLB/FBX/OBJ + Texturen), `Medieval_Hexagon_UserGuide_v1.pdf`, `License.txt`.
- **Ursprungs-ZIP:** `_downloads/kaykit_medieval-hexagon-pack.zip`
- **Geplante Nutzung:** Hex-Leveldesign, zusätzliche Gebäudevarianten.

### buildings/polypizza_* (Einzelmodelle + gothic-set)
- **Inhalt:** `polypizza_church_poly-by-google.glb`, `polypizza_temple_quaternius_cc0.glb`, `polypizza_gothic-set/{Archway,Castle,Cathedral,Cemetary,Church,Church (1),Gate}.glb`.
- **Lizenz:** gemischt CC-BY / CC0 — pro Modell über poly.pizza zu verifizieren.
- **Geplante Nutzung:** markante Einzelgebäude (Kirche, Kathedrale, Tor).

### characters/knight-character_quaternius_cc0/
- **Inhalt:** Ritter-Charakter + Helme/Waffen (OBJ/FBX/Blend).
- **Ursprungs-ZIP:** `_downloads/oga_knight-character-quaternius.zip`
- **Geplante Nutzung:** Guard-Enemy.

### characters/lowpoly-rpg-characters_cc0/ (RPG Characters Nov 2020)
- **Inhalt:** Mehrere RPG-Charaktere (OBJ/FBX/Blend/Texturen), `License.txt`.
- **Ursprungs-ZIP:** `_downloads/oga_lowpoly-rpg-characters.zip`
- **Geplante Nutzung:** NPCs, Tetzel (Boss), Indulgence Seller.

### characters/oga_monk_cc0.blend
- **Inhalt:** Einzelne `.blend`-Mönchfigur.
- **Geplante Nutzung:** Player (Luther) oder Mönch-NPC.

### audio/kenney_{impact-sounds,rpg-audio,ui-audio}/
- **Inhalt:** Impact-Sounds (130), RPG/Foley (50), UI-SFX (50) als `.ogg`, je eigene `License.txt`.
- **Ursprungs-ZIPs:** `_downloads/kenney_{impact-sounds,rpg-audio,ui-audio}.zip`
- **Geplante Nutzung:** Combat, Bewegung/Inventar, Menü/HUD.

### audio/oga_sword-sounds_cc0/ (StarNinjas)
- **Inhalt:** 20 `.ogg` (10 Sword-Attacks, 10 Clashes).
- **Ursprungs-ZIPs:** `_downloads/oga_sword-attacks.zip`, `_downloads/oga_sword-clashes.zip`
- **Geplante Nutzung:** Combat / Bossfight.

### audio/oga_music/
- **Inhalt:** `TownTheme_cc0.mp3`, `BattleTheme_cc0.mp3`, `BossBattle_JuhaniJunkala_cc0.wav`, `ChurchBell_ccbysa.mp3`.
- **Lizenz:** drei CC0 (zu verifizieren) + eine **CC-BY-SA** (ChurchBell).
- **Geplante Nutzung:** Ambiente / Kampf / Boss (ChurchBell: Kandidat für Ausschluss wegen Share-Alike).

## Nicht im Bestand (dokumentiert, aber abwesend)
- **Sketchfab-Monk (Inuciian, CC-BY 4.0)** — in `MANIFEST.md` als „noch offen" markiert, nie heruntergeladen. Kein Treffer in der Inventur.
