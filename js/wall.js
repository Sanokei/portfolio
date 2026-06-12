// wall.js — Plaster gallery wall with pickaxe-chunked CSG cavities.
//
// Exports:
//   buildWall(scene, projects, categoryOrder) → { wallGroup, cavityData[] }
//
// cavityData per project:
//   { project, worldX, worldY, wallZ, cavityDepth, seed }

import * as THREE from 'three';
import { ConvexGeometry } from 'three/addons/geometries/ConvexGeometry.js';
import { computeBoundsTree, disposeBoundsTree } from 'three-mesh-bvh';
import { SUBTRACTION, Brush, Evaluator } from 'three-bvh-csg';
import { createSpotlight, createCavityLight } from './scene.js';

// Patch BufferGeometry with BVH methods (required by three-bvh-csg)
THREE.BufferGeometry.prototype.computeBoundsTree = computeBoundsTree;
THREE.BufferGeometry.prototype.disposeBoundsTree = disposeBoundsTree;

// ── Constants ──────────────────────────────────────────
const WALL_WIDTH = 50;
const WALL_HEIGHT = 8;
const WALL_THICKNESS = 0.6;
const WALL_Y_CENTER = 4;
const CAVITY_SPACING = 2.8;   // horizontal spacing between cavity centers
const CAVITY_W = 1.6;         // approx cavity width
const CAVITY_H = 2.0;         // approx cavity height
const CAVITY_D = 1.2;         // depth into wall
const START_X = -22;          // leftmost cavity center X

// ── Materials ──────────────────────────────────────────
const plasterMaterial = new THREE.MeshStandardMaterial({
  color: 0xf5efe6,
  roughness: 0.85,
  metalness: 0.05,
});

const interiorMaterial = new THREE.MeshStandardMaterial({
  color: 0xc0b8a8,
  roughness: 0.95,
  metalness: 0.0,
});

// ── PRNG ───────────────────────────────────────────────
/** Mulberry32 — deterministic pseudo-random from a numeric seed. */
function mulberry32(a) {
  return function () {
    a |= 0;
    a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

// ── Jagged Volume Generator ────────────────────────────
/**
 * Create an irregular, faceted 3D volume via ConvexGeometry.
 * Random points biased toward the bounding-box edges produce
 * a crystal-like shape that simulates pickaxe strikes.
 */
function createJaggedVolume(w, h, d, seed) {
  const rand = mulberry32(seed);
  const hw = w / 2;
  const hh = h / 2;
  const hd = d / 2;
  const points = [];

  // 40-60 random points, ~30% pinned to edges for crisp facets
  const count = 40 + Math.floor(rand() * 20);
  for (let i = 0; i < count; i++) {
    const edgeBiased = rand() < 0.35;
    const x = edgeBiased
      ? (rand() < 0.5 ? -hw : hw) * (0.7 + rand() * 0.3)
      : (rand() - 0.5) * w;
    const y = edgeBiased
      ? (rand() < 0.5 ? -hh : hh) * (0.7 + rand() * 0.3)
      : (rand() - 0.5) * h;
    const z = edgeBiased
      ? (rand() < 0.5 ? -hd : hd) * (0.7 + rand() * 0.3)
      : (rand() - 0.5) * d;
    points.push(new THREE.Vector3(x, y, z));
  }

  // Always include the 8 corners so the shape spans the full volume
  const corners = [
    [-hw, -hh, -hd], [hw, -hh, -hd], [-hw, hh, -hd], [hw, hh, -hd],
    [-hw, -hh,  hd], [hw, -hh,  hd], [-hw, hh,  hd], [hw, hh,  hd],
  ];
  for (const [cx, cy, cz] of corners) {
    points.push(new THREE.Vector3(cx, cy, cz));
  }

  // Extra chips near the front face (z > 0 side) for pickaxe-front look
  for (let i = 0; i < 12; i++) {
    const x = (rand() - 0.5) * w * 1.2;
    const y = (rand() - 0.5) * h * 1.2;
    const z = hd * (0.5 + rand() * 0.7); // biased toward front
    points.push(new THREE.Vector3(x, y, z));
  }

  const geo = new ConvexGeometry(points);

  // ConvexGeometry lacks UVs, but three-bvh-csg requires the uv attribute
  // on all geometries. Generate a placeholder UV set (values don't matter
  // for the subtraction shape — only the wall's UVs survive the CSG).
  const posCount = geo.attributes.position.count;
  const uvArr = new Float32Array(posCount * 2);
  // Fill with a simple planar projection so the attribute isn't zeroed
  for (let i = 0; i < posCount; i++) {
    const ix = i * 3;
    uvArr[i * 2] = (geo.attributes.position.array[ix] / w) + 0.5;
    uvArr[i * 2 + 1] = (geo.attributes.position.array[ix + 1] / h) + 0.5;
  }
  geo.setAttribute('uv', new THREE.BufferAttribute(uvArr, 2));

  return geo;
}

// ── Main Builder ───────────────────────────────────────
/**
 * Build the wall and subtract all 16 cavities via CSG.
 * Returns the wall mesh and per-cavity positioning data.
 */
export async function buildWall(scene, projects, categoryOrder) {
  // Progress reporting
  const loadingBar = document.getElementById('loading-bar');
  const loadingText = document.getElementById('loading-text');
  const setProgress = (pct, msg) => {
    if (loadingBar) loadingBar.style.width = Math.min(pct, 100) + '%';
    if (loadingText) loadingText.textContent = msg;
  };

  setProgress(5, 'Building gallery wall...');

  // ── Create wall Brush for CSG operations ──────────────
  const wallGeo = new THREE.BoxGeometry(WALL_WIDTH, WALL_HEIGHT, WALL_THICKNESS, 100, 16, 1);
  const wallBrush = new Brush(wallGeo, plasterMaterial);
  wallBrush.position.set(0, WALL_Y_CENTER, 0);
  wallBrush.updateMatrixWorld();
  wallBrush.geometry.computeBoundsTree();

  setProgress(10, 'Preparing cavity chambers...');

  // ── Compute cavity positions ─────────────────────────
  // Lay out cavities linearly, grouped by category with small gaps
  const cavityData = [];
  let cursorX = START_X;

  for (const category of categoryOrder) {
    const catProjects = projects.filter(p => p.category === category);

    for (let i = 0; i < catProjects.length; i++) {
      const project = catProjects[i];
      const worldX = cursorX;
      const worldY = WALL_Y_CENTER;
      // Wall front face is at z = WALL_THICKNESS / 2 = 0.3
      const wallZ = WALL_THICKNESS / 2;
      const seed = project.id * 137 + 42; // deterministic per project

      cavityData.push({ project, worldX, worldY, wallZ, cavityDepth: CAVITY_D, seed });

      cursorX += CAVITY_SPACING;
    }

    // Add extra gap between categories
    cursorX += 0.6;
  }

  // ── Sequential CSG subtraction ───────────────────────
  const evaluator = new Evaluator();
  let currentBrush = wallBrush;

  for (let i = 0; i < cavityData.length; i++) {
    const cd = cavityData[i];
    const pct = 10 + Math.round((i / cavityData.length) * 70);
    setProgress(pct, `Chiseling cavity: ${cd.project.name}...`);

    // Create jagged subtraction volume
    const jaggedGeo = createJaggedVolume(CAVITY_W, CAVITY_H, CAVITY_D, cd.seed);
    const jaggedBrush = new Brush(jaggedGeo);
    // Position the shape so it protrudes from the wall front into the wall depth
    jaggedBrush.position.set(cd.worldX, cd.worldY, cd.wallZ - CAVITY_D / 2);
    jaggedBrush.updateMatrixWorld();
    jaggedBrush.geometry.computeBoundsTree();

    // Subtract from wall using three-bvh-csg API
    const result = evaluator.evaluate(currentBrush, jaggedBrush, SUBTRACTION);

    // Dispose old geometry (wallGeo is no longer needed after first iteration)
    if (i === 0) {
      wallGeo.dispose();
    }
    currentBrush = result;

    // Yield to the main thread every 4 cavities to keep the UI responsive
    if (i % 4 === 3) {
      await new Promise(r => setTimeout(r, 0));
    }
  }

  // ── Ensure final result has correct material & shadows ─
  currentBrush.material = plasterMaterial;
  currentBrush.castShadow = true;
  currentBrush.receiveShadow = true;

  // ── Add wall to scene ────────────────────────────────
  const wallGroup = new THREE.Group();
  wallGroup.add(currentBrush);

  // ── Cavity interior backing planes ───────────────────
  // Dark planes placed slightly behind the wall to create the
  // visual of darker material inside each broken cavity.
  for (const cd of cavityData) {
    const backPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(CAVITY_W * 0.85, CAVITY_H * 0.85),
      interiorMaterial,
    );
    // Position just behind the cavity opening (inside the wall)
    backPlane.position.set(cd.worldX, cd.worldY, cd.wallZ - CAVITY_D * 0.85);
    wallGroup.add(backPlane);

    // Subtle point light inside cavity for glow
    const cavityLight = createCavityLight(cd.worldX, cd.worldY, cd.wallZ - CAVITY_D * 0.4);
    wallGroup.add(cavityLight);

    // Spotlight above cavity
    const spotY = WALL_Y_CENTER + WALL_HEIGHT / 2 - 0.3;
    const spotZ = cd.wallZ + 0.2;
    const spot = createSpotlight(cd.worldX, spotY, spotZ);
    spot.target.position.set(cd.worldX, cd.worldY, cd.wallZ - CAVITY_D / 2);
    wallGroup.add(spot);
    wallGroup.add(spot.target);
  }

  scene.add(wallGroup);

  setProgress(85, 'Polishing the marble...');

  return { wallGroup, cavityData };
}
