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
const WALL_THICKNESS = 1.0;      // thicker wall so CSG cuts are a solid volume
const WALL_Y_CENTER = 3;          // lower so camera at y=4 looks slightly down
const CAVITY_SPACING = 2.8;
const CAVITY_W = 1.6;
const CAVITY_H = 2.0;
const CAVITY_D = 1.6;            // deep enough to fully penetrate wall thickness
const START_X = -22;

// ── Materials ──────────────────────────────────────────
const plasterMaterial = new THREE.MeshStandardMaterial({
  color: 0xf5efe6,
  roughness: 0.85,
  metalness: 0.05,
  side: THREE.FrontSide,
});

const interiorMaterial = new THREE.MeshStandardMaterial({
  color: 0xc0b8a8,
  roughness: 0.95,
  metalness: 0.0,
  side: THREE.DoubleSide,   // visible from inside cavities
});

// ── PRNG ───────────────────────────────────────────────
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
function createJaggedVolume(w, h, d, seed) {
  const rand = mulberry32(seed);
  const hw = w / 2;
  const hh = h / 2;
  const hd = d / 2;
  const points = [];

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

  const corners = [
    [-hw, -hh, -hd], [hw, -hh, -hd], [-hw, hh, -hd], [hw, hh, -hd],
    [-hw, -hh,  hd], [hw, -hh,  hd], [-hw, hh,  hd], [hw, hh,  hd],
  ];
  for (const [cx, cy, cz] of corners) {
    points.push(new THREE.Vector3(cx, cy, cz));
  }

  for (let i = 0; i < 12; i++) {
    const x = (rand() - 0.5) * w * 1.2;
    const y = (rand() - 0.5) * h * 1.2;
    const z = hd * (0.5 + rand() * 0.7);
    points.push(new THREE.Vector3(x, y, z));
  }

  const geo = new ConvexGeometry(points);

  // Add UV attribute — required by three-bvh-csg
  const posCount = geo.attributes.position.count;
  const uvArr = new Float32Array(posCount * 2);
  for (let i = 0; i < posCount; i++) {
    const ix = i * 3;
    uvArr[i * 2] = (geo.attributes.position.array[ix] / w) + 0.5;
    uvArr[i * 2 + 1] = (geo.attributes.position.array[ix + 1] / h) + 0.5;
  }
  geo.setAttribute('uv', new THREE.BufferAttribute(uvArr, 2));

  return geo;
}

// ── Main Builder ───────────────────────────────────────
export async function buildWall(scene, projects, categoryOrder) {
  const loadingBar = document.getElementById('loading-bar');
  const loadingText = document.getElementById('loading-text');
  const setProgress = (pct, msg) => {
    if (loadingBar) loadingBar.style.width = Math.min(pct, 100) + '%';
    if (loadingText) loadingText.textContent = msg;
  };

  setProgress(5, 'Building gallery wall...');

  // ── Create wall geometry ──────────────────────────────
  // Wall at origin, centered. Camera looks from z+ direction.
  const wallGeo = new THREE.BoxGeometry(WALL_WIDTH, WALL_HEIGHT, WALL_THICKNESS, 120, 20, 2);
  const wallBrush = new Brush(wallGeo, plasterMaterial);
  wallBrush.position.set(0, WALL_Y_CENTER, 0);
  wallBrush.updateMatrixWorld();
  wallBrush.geometry.computeBoundsTree();

  setProgress(10, 'Preparing cavity chambers...');

  // ── Compute cavity positions ─────────────────────────
  const cavityData = [];
  let cursorX = START_X;

  for (const category of categoryOrder) {
    const catProjects = projects.filter(p => p.category === category);
    for (let i = 0; i < catProjects.length; i++) {
      const project = catProjects[i];
      const worldX = cursorX;
      const worldY = WALL_Y_CENTER;
      // Wall front face is at z = +WALL_THICKNESS/2
      const wallZ = WALL_THICKNESS / 2;
      const seed = project.id * 137 + 42;

      cavityData.push({ project, worldX, worldY, wallZ, cavityDepth: CAVITY_D, seed });
      cursorX += CAVITY_SPACING;
    }
    cursorX += 0.6; // gap between categories
  }

  // ── Sequential CSG subtraction ───────────────────────
  const evaluator = new Evaluator();
  let currentBrush = wallBrush;

  for (let i = 0; i < cavityData.length; i++) {
    const cd = cavityData[i];
    const pct = 10 + Math.round((i / cavityData.length) * 70);
    setProgress(pct, `Chiseling cavity: ${cd.project.name}...`);

    // Create jagged subtraction volume.
    // Position it so the shape protrudes THROUGH the wall front face.
    // The shape center goes at (worldX, worldY, 0) — mid-wall in Z —
    // so it cleanly cuts through the entire wall thickness.
    const jaggedGeo = createJaggedVolume(CAVITY_W, CAVITY_H, CAVITY_D, cd.seed);
    const jaggedBrush = new Brush(jaggedGeo);
    jaggedBrush.position.set(cd.worldX, cd.worldY, 0);
    jaggedBrush.updateMatrixWorld();
    jaggedBrush.geometry.computeBoundsTree();

    // CSG subtract: wall minus jagged shape
    const result = evaluator.evaluate(currentBrush, jaggedBrush, SUBTRACTION);

    // Dispose old
    jaggedGeo.dispose();
    if (i === 0) wallGeo.dispose();

    currentBrush = result;

    if (i % 4 === 3) {
      await new Promise(r => setTimeout(r, 0));
    }
  }

  // ── Ensure correct material & position on final wall ─
  currentBrush.material = plasterMaterial;
  currentBrush.position.set(0, WALL_Y_CENTER, 0);
  currentBrush.updateMatrixWorld();

  // ── Add wall to scene ────────────────────────────────
  const wallGroup = new THREE.Group();
  wallGroup.add(currentBrush);

  // ── Cavity interiors: dark backing + lights ──────────
  for (const cd of cavityData) {
    // Dark plane set back inside the cavity
    const backPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(CAVITY_W * 0.9, CAVITY_H * 0.9),
      interiorMaterial,
    );
    backPlane.position.set(cd.worldX, cd.worldY, cd.wallZ - CAVITY_D * 0.7);
    wallGroup.add(backPlane);

    // Point light inside cavity
    const cavityLight = createCavityLight(cd.worldX, cd.worldY, cd.wallZ - CAVITY_D * 0.3);
    wallGroup.add(cavityLight);

    // Spotlight above cavity
    const spotY = WALL_Y_CENTER + WALL_HEIGHT / 2 - 0.5;
    const spotZ = cd.wallZ + 0.3;
    const spot = createSpotlight(cd.worldX, spotY, spotZ);
    spot.target.position.set(cd.worldX, cd.worldY, cd.wallZ - CAVITY_D / 2);
    wallGroup.add(spot);
    wallGroup.add(spot.target);
  }

  scene.add(wallGroup);

  setProgress(85, 'Polishing the marble...');

  return { wallGroup, cavityData };
}
