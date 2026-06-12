// wall.js — Plaster gallery wall with rock-chunked CSG cavities.
// Cavity shape inspired by TDM's "Wet stone" shader: a base sphere
// with smaller spheres subtracted, then vertex noise for organic edges.

import * as THREE from 'three';
import { computeBoundsTree, disposeBoundsTree } from 'three-mesh-bvh';
import { SUBTRACTION, Brush, Evaluator } from 'three-bvh-csg';
import { createSpotlight, createCavityLight } from './scene.js';

THREE.BufferGeometry.prototype.computeBoundsTree = computeBoundsTree;
THREE.BufferGeometry.prototype.disposeBoundsTree = disposeBoundsTree;

const WALL_WIDTH = 50;
const WALL_HEIGHT = 8;
const WALL_THICKNESS = 1.0;
const WALL_Y_CENTER = 3;
const CAVITY_SPACING = 2.8;
const CAVITY_W = 1.8;
const CAVITY_H = 2.2;
const CAVITY_D = 1.8;
const START_X = -22;

const plasterMaterial = new THREE.MeshStandardMaterial({
  color: 0xf5efe6, roughness: 0.85, metalness: 0.05,
});

const interiorMaterial = new THREE.MeshStandardMaterial({
  color: 0xc0b8a8, roughness: 0.95, metalness: 0.0, side: THREE.DoubleSide,
});

// ── Simple hash noise ──────────────────────────────────
function hash31(p) {
  const h = [127.231, 491.7, 718.423].map(v => Math.sin(v * p) * 435.543);
  return h.map(v => v - Math.floor(v));
}

// ── Rock geometry generator ────────────────────────────
// Creates a lumpy, organic shape like a chipped-away stone.
// Base: displaced ellipsoid with random dents.
function createRockGeometry(w, h, d, seed) {
  // Start with an ellipsoid (sphere scaled to cavity dims)
  const baseR = Math.max(w, h, d) / 2;
  const geo = new THREE.SphereGeometry(baseR, 24, 18);
  const pos = geo.attributes.position;

  // Scale to approximate cavity width/height/depth
  const sx = w / (baseR * 2);
  const sy = h / (baseR * 2);
  const sz = d / (baseR * 2);

  // Use the seed to perturb each vertex outward/inward
  for (let i = 0; i < pos.count; i++) {
    let x = pos.getX(i);
    let y = pos.getY(i);
    let z = pos.getZ(i);

    // Simple 3D noise from hashed sin
    const nx = x * 0.7 + seed * 0.13;
    const ny = y * 0.7 + seed * 0.37;
    const nz = z * 0.7 + seed * 0.61;
    const noise =
      Math.sin(nx * 3.7) * Math.cos(ny * 5.1) * Math.sin(nz * 4.3) * 0.3 +
      Math.sin(nx * 7.1 + 2.3) * Math.cos(nz * 6.7 + 1.1) * 0.2;

    // Displace: mostly outward (positive), some inward
    const displacement = 1.0 + noise;
    pos.setXYZ(i, x * displacement * sx, y * displacement * sy, z * displacement * sz);
  }

  geo.computeVertexNormals();

  // Add UVs (required by three-bvh-csg)
  const uvArr = new Float32Array(pos.count * 2);
  for (let i = 0; i < pos.count; i++) {
    uvArr[i * 2] = pos.getX(i) / w + 0.5;
    uvArr[i * 2 + 1] = pos.getY(i) / h + 0.5;
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

  // Wall
  const wallGeo = new THREE.BoxGeometry(WALL_WIDTH, WALL_HEIGHT, WALL_THICKNESS, 80, 16, 2);
  let wallBrush = new Brush(wallGeo, plasterMaterial);
  wallBrush.position.set(0, WALL_Y_CENTER, 0);
  wallBrush.updateMatrixWorld();

  // Cavity positions
  const cavityData = [];
  let cursorX = START_X;
  for (const category of categoryOrder) {
    const catProjects = projects.filter(p => p.category === category);
    for (const project of catProjects) {
      const worldX = cursorX;
      const worldY = WALL_Y_CENTER;
      const wallZ = WALL_THICKNESS / 2;
      const seed = project.id * 137 + 42;
      cavityData.push({ project, worldX, worldY, wallZ, cavityDepth: CAVITY_D, seed });
      cursorX += CAVITY_SPACING;
    }
    cursorX += 0.6;
  }

  // CSG: subtract rock shapes from wall
  const evaluator = new Evaluator();

  for (let i = 0; i < cavityData.length; i++) {
    const cd = cavityData[i];
    const pct = 10 + Math.round((i / cavityData.length) * 70);
    setProgress(pct, `Chiseling cavity: ${cd.project.name}...`);

    const rockGeo = createRockGeometry(CAVITY_W, CAVITY_H, CAVITY_D, cd.seed);
    const rockBrush = new Brush(rockGeo);
    // Position at cavity center, mid-wall in Z so shape cuts clean through
    rockBrush.position.set(cd.worldX, cd.worldY, 0);
    rockBrush.updateMatrixWorld();

    const result = evaluator.evaluate(wallBrush, rockBrush, SUBTRACTION);

    rockGeo.dispose();
    if (i === 0) wallGeo.dispose();
    wallBrush = result;

    if (i % 3 === 2) await new Promise(r => setTimeout(r, 0));
  }

  wallBrush.material = plasterMaterial;
  wallBrush.position.set(0, WALL_Y_CENTER, 0);
  wallBrush.updateMatrixWorld();

  const wallGroup = new THREE.Group();
  wallGroup.add(wallBrush);

  // Cavity interiors
  for (const cd of cavityData) {
    const backPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(CAVITY_W * 0.9, CAVITY_H * 0.9),
      interiorMaterial,
    );
    backPlane.position.set(cd.worldX, cd.worldY, cd.wallZ - CAVITY_D * 0.5);
    wallGroup.add(backPlane);

    const cavityLight = createCavityLight(cd.worldX, cd.worldY, cd.wallZ - CAVITY_D * 0.3);
    wallGroup.add(cavityLight);

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
