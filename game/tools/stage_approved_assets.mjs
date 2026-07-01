#!/usr/bin/env node
// stage_approved_assets.mjs
// ---------------------------------------------------------------------------
// Reproduzierbares Staging-Skript: kopiert die im Lizenz-Audit (Issue #10)
// als APPROVED / APPROVED_WITH_ATTRIBUTION freigegebenen Assets aus dem
// lokal git-ignorierten `godot_assets/` in das versionierte `game/assets/`.
//
// - Übernimmt NUR die unten kuratierte, CI-sicher importierbare Runtime-Auswahl
//   (GLB bevorzugt; glTF inkl. .bin + Texturen; OBJ inkl. .mtl + Texturen).
// - QUARANTINED/EXCLUDED-Assets werden NIE angefasst.
// - Löst Modell-Abhängigkeiten automatisch auf (glTF buffers/images, OBJ mtllib/map_*).
// - Idempotent: überschreibt Zieldateien, legt fehlende Verzeichnisse an.
//
// Voraussetzung: lokal vorhandenes `godot_assets/` (nicht im Repo). Ohne das
// Verzeichnis bleiben die bereits committeten Runtime-Assets unverändert nutzbar;
// das Skript wird nur zum (Re-)Staging benötigt.
//
// Aufruf (Repo-Root oder beliebig): node game/tools/stage_approved_assets.mjs
// ---------------------------------------------------------------------------

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..', '..'); // repo root
const SRC = path.join(ROOT, 'godot_assets');
const DEST = path.join(ROOT, 'game', 'assets');

if (!fs.existsSync(SRC)) {
  console.error(`[stage] godot_assets/ nicht gefunden unter ${SRC}.`);
  console.error(`[stage] Das ist ok, falls die Runtime-Assets bereits committet sind — Staging wird nur zum Neu-Kopieren gebraucht.`);
  process.exit(2);
}

let copied = 0, missing = 0, deps = 0;
const log = [];

function ensureDir(d) { fs.mkdirSync(d, { recursive: true }); }
function copyFile(from, to) {
  if (!fs.existsSync(from)) { console.warn(`[stage] FEHLT: ${path.relative(ROOT, from)}`); missing++; return false; }
  ensureDir(path.dirname(to));
  fs.copyFileSync(from, to);
  copied++;
  log.push(path.relative(ROOT, to));
  return true;
}

// Kopiert eine .gltf inkl. referenzierter .bin-Buffer und Bild-Texturen (flach ins Zielverzeichnis).
function copyGltfWithDeps(srcGltf, destDir) {
  if (!fs.existsSync(srcGltf)) { console.warn(`[stage] FEHLT gltf: ${path.relative(ROOT, srcGltf)}`); missing++; return; }
  const srcDir = path.dirname(srcGltf);
  const j = JSON.parse(fs.readFileSync(srcGltf, 'utf8'));
  copyFile(srcGltf, path.join(destDir, path.basename(srcGltf)));
  const uris = new Set([
    ...(j.buffers || []).map(b => b.uri),
    ...(j.images || []).map(i => i.uri),
  ].filter(Boolean).map(u => decodeURIComponent(u)));
  for (const uri of uris) {
    if (uri.startsWith('data:')) continue; // eingebettet, keine Datei
    copyFile(path.join(srcDir, uri), path.join(destDir, path.basename(uri)));
    deps++;
  }
}

// Kopiert eine .obj inkl. referenzierter .mtl (mtllib) und deren Texturen (map_*).
function copyObjWithDeps(srcObj, destDir) {
  if (!fs.existsSync(srcObj)) { console.warn(`[stage] FEHLT obj: ${path.relative(ROOT, srcObj)}`); missing++; return; }
  const srcDir = path.dirname(srcObj);
  copyFile(srcObj, path.join(destDir, path.basename(srcObj)));
  const obj = fs.readFileSync(srcObj, 'utf8');
  const mtls = [...obj.matchAll(/^\s*mtllib\s+(.+)\s*$/gim)].map(m => m[1].trim());
  for (const mtl of mtls) {
    const srcMtl = path.join(srcDir, mtl);
    if (!copyFile(srcMtl, path.join(destDir, path.basename(mtl)))) continue;
    deps++;
    const mtlTxt = fs.readFileSync(srcMtl, 'utf8');
    const maps = [...mtlTxt.matchAll(/^\s*map_\w+\s+(.+)\s*$/gim)].map(m => m[1].trim().split(/\s+/).pop());
    for (const tex of maps) { copyFile(path.join(srcDir, tex), path.join(destDir, path.basename(tex))); deps++; }
  }
}

function findGltfByBasenames(packDir, names) {
  const want = new Set(names.map(n => n.toLowerCase()));
  const out = [];
  if (!fs.existsSync(packDir)) return out;
  (function walk(d){ for (const e of fs.readdirSync(d, {withFileTypes:true})) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p);
    else if (/\.gltf$/i.test(e.name) && want.has(e.name.toLowerCase())) out.push(p);
  }})(packDir);
  return out;
}

console.log('[stage] Kopiere freigegebene Runtime-Assets …\n');

// --- buildings: Kenney Castle Kit (CC0) — self-contained GLB ---------------
{
  const from = path.join(SRC, 'buildings/kenney_castle-kit/Models/GLB format');
  const to = path.join(DEST, 'third_party/kenney/castle-kit');
  const pick = ['wall.glb','wall-corner.glb','wall-doorway.glb','gate.glb','metal-gate.glb',
    'tower-square.glb','tower-square-top-roof.glb','tower-hexagon-base.glb','stairs-stone.glb',
    'bridge-straight.glb','siege-catapult.glb','siege-trebuchet.glb','flag.glb','tree-large.glb','ground.glb'];
  for (const f of pick) copyFile(path.join(from, f), path.join(to, f));
  // Kenney-GLBs (UnityGLTF-Export) referenzieren extern die geteilte Textur Textures/colormap.png
  copyFile(path.join(from, 'Textures/colormap.png'), path.join(to, 'Textures/colormap.png'));
}

// --- buildings: poly.pizza (CC-BY 3.0 + 1 CC0) — self-contained GLB --------
{
  copyFile(path.join(SRC, 'buildings/polypizza_church_poly-by-google.glb'),
           path.join(DEST, 'third_party/polypizza/church.glb'));                 // CC-BY
  copyFile(path.join(SRC, 'buildings/polypizza_temple_quaternius_cc0.glb'),
           path.join(DEST, 'third_party/polypizza/temple.glb'));                 // CC0
  const gothic = path.join(SRC, 'buildings/polypizza_gothic-set');
  const gto = path.join(DEST, 'third_party/polypizza/gothic');
  for (const f of ['Cathedral.glb','Castle.glb','Cemetary.glb','Gate.glb','Archway.glb']) // CC-BY (Church* QUARANTINED → NICHT)
    copyFile(path.join(gothic, f), path.join(gto, f));
}

// --- buildings: Quaternius Medieval Village MegaKit (CC0) — glTF+deps -------
{
  const pack = path.join(SRC, 'buildings/quaternius_medieval-village-megakit');
  const to = path.join(DEST, 'third_party/quaternius/medieval-village');
  // Bewusst nur Modelle aus der gemeinsamen "WoodTrim"-Texturgruppe (3 Texturen, ~7 MB,
  // von 64 Modellen geteilt) + winzige Vine-Props — hält das 2K-PBR-Set klein statt 42 MB.
  const pick = ['DoorFrame_Round_WoodDark.gltf','Stair_Interior_Simple.gltf','WindowShutters_Wide_Flat_Closed.gltf',
    'Window_Thin_Round1.gltf','Prop_Vine2.gltf','Prop_Vine4.gltf'];
  for (const g of findGltfByBasenames(pack, pick)) copyGltfWithDeps(g, to);
}

// --- buildings: KayKit Medieval Hexagon Pack (CC0) — glTF+deps -------------
{
  const pack = path.join(SRC, 'buildings/kaykit_medieval-hexagon-pack');
  const to = path.join(DEST, 'third_party/kaykit/medieval-hexagon');
  const pick = ['crate_long_A.gltf','flag_red.gltf','resource_stone.gltf','bucket_arrows.gltf','ladder.gltf','crate_open.gltf'];
  for (const g of findGltfByBasenames(pack, pick)) copyGltfWithDeps(g, to);
  // Zusätzlich bis zu 4 Gebäude-/Tile-Modelle für Variety (deterministisch sortiert)
  const extra = [];
  if (fs.existsSync(pack)) {
    (function walk(d){ for (const e of fs.readdirSync(d, {withFileTypes:true})) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) walk(p);
      else if (/\.gltf$/i.test(e.name) && /(building|tile|hex)/i.test(p)) extra.push(p);
    }})(pack);
  }
  for (const g of extra.sort().slice(0, 4)) copyGltfWithDeps(g, to);
}

// --- characters: Knight (Quaternius, CC0) — OBJ+MTL ------------------------
{
  const objdir = path.join(SRC, 'characters/knight-character_quaternius_cc0/Knight Character by @Quaternius/OBJ');
  const to = path.join(DEST, 'third_party/opengameart/knight');
  for (const f of ['KnightCharacter.obj','Sword.obj']) copyObjWithDeps(path.join(objdir, f), to);
}

// --- characters: LowPoly RPG Characters (Quaternius, CC0) — OBJ+MTL+PNG ----
{
  const pack = path.join(SRC, 'characters/lowpoly-rpg-characters_cc0');
  let objdir = null;
  if (fs.existsSync(pack)) {
    (function walk(d){ for (const e of fs.readdirSync(d, {withFileTypes:true})) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) walk(p);
      else if (/^Warrior\.obj$/i.test(e.name)) objdir = d;
    }})(pack);
  }
  const to = path.join(DEST, 'third_party/opengameart/rpg-characters');
  if (objdir) for (const f of ['Warrior.obj','Cleric.obj','Wizard.obj','Monk.obj']) copyObjWithDeps(path.join(objdir, f), to);
  else { console.warn('[stage] RPG-Characters OBJ-Verzeichnis nicht gefunden'); missing++; }
}

// --- audio: Kenney SFX (CC0) + OGA Sword (CC0) + CC0-Musik -----------------
function copyFirstOgg(srcDir, destDir, n) {
  const files = [];
  (function walk(d){ for (const e of fs.readdirSync(d, {withFileTypes:true})) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p);
    else if (/\.ogg$/i.test(e.name) && !/^preview/i.test(e.name)) files.push(p);
  }})(srcDir);
  for (const f of files.sort().slice(0, n)) copyFile(f, path.join(destDir, path.basename(f)));
}
copyFirstOgg(path.join(SRC, 'audio/kenney_impact-sounds'), path.join(DEST, 'audio/sfx/kenney-impact'), 4);
copyFirstOgg(path.join(SRC, 'audio/kenney_rpg-audio'),     path.join(DEST, 'audio/sfx/kenney-rpg'),    4);
copyFirstOgg(path.join(SRC, 'audio/kenney_ui-audio'),      path.join(DEST, 'audio/sfx/kenney-ui'),     4);
{
  const swordDir = path.join(SRC, 'audio/oga_sword-sounds_cc0');
  const to = path.join(DEST, 'audio/sfx/oga-sword');
  for (const f of ['sword - StarNinjas/sword.1.ogg','sword - StarNinjas/sword.2.ogg','sword_clash.1.ogg','sword_clash.2.ogg'])
    copyFile(path.join(swordDir, f), path.join(to, path.basename(f)));
}
copyFile(path.join(SRC, 'audio/oga_music/TownTheme_cc0.mp3'),   path.join(DEST, 'audio/music/TownTheme.mp3'));   // CC0
copyFile(path.join(SRC, 'audio/oga_music/BattleTheme_cc0.mp3'), path.join(DEST, 'audio/music/BattleTheme.mp3')); // CC0
// Hinweis: BossBattle_JuhaniJunkala_cc0.wav (20 MB, CC0) bewusst NICHT committet — bei Bedarf hier ergänzen.
// Hinweis: oga_monk_cc0.blend (CC0) NICHT committet — .blend braucht Blender (CI-untauglich). Für Nutzung nach GLB exportieren.

console.log(`\n[stage] Fertig. Kopiert: ${copied} Dateien (davon ${deps} Abhängigkeiten). Fehlend: ${missing}.`);
if (missing > 0) process.exitCode = 1;
