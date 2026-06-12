// wall.js - Explicit plaster wall panels with real openings for recessed CRTs.

import * as THREE from 'three';
import {
  buildModuleLayout,
  WALL_HEIGHT,
  WALL_THICKNESS,
  WALL_WIDTH,
  WALL_Y_CENTER,
} from './layout.js';

const plasterMaterial = new THREE.MeshStandardMaterial({
  color: 0xf6f3ed,
  roughness: 0.9,
  metalness: 0,
});

const plasterEdgeMaterial = new THREE.MeshStandardMaterial({
  color: 0xe2ddd4,
  roughness: 0.94,
  metalness: 0,
});

function addBox(group, width, height, depth, x, y, z, material = plasterMaterial) {
  if (width <= 0 || height <= 0) return;

  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(width, height, depth),
    material,
  );
  mesh.position.set(x, y, z);
  group.add(mesh);
}

function createOpeningWall(cd, tileTop, tileBottom) {
  const group = new THREE.Group();
  const wallLeft = -WALL_WIDTH / 2;
  const wallRight = WALL_WIDTH / 2;
  const tileHeight = tileTop - tileBottom;
  const holeW = cd.holeW * 1.06;
  const holeH = cd.holeH * 1.02;
  const holeLeft = cd.worldX - holeW / 2;
  const holeRight = cd.worldX + holeW / 2;
  const holeTop = cd.worldY + holeH / 2;
  const holeBottom = cd.worldY - holeH / 2;

  addBox(
    group,
    holeLeft - wallLeft,
    tileHeight,
    WALL_THICKNESS,
    (wallLeft + holeLeft) / 2,
    cd.worldY,
    0,
  );
  addBox(
    group,
    wallRight - holeRight,
    tileHeight,
    WALL_THICKNESS,
    (wallRight + holeRight) / 2,
    cd.worldY,
    0,
  );
  addBox(
    group,
    holeW,
    tileTop - holeTop,
    WALL_THICKNESS,
    cd.worldX,
    (tileTop + holeTop) / 2,
    0,
  );
  addBox(
    group,
    holeW,
    holeBottom - tileBottom,
    WALL_THICKNESS,
    cd.worldX,
    (holeBottom + tileBottom) / 2,
    0,
  );

  addReveal(group, cd, holeW, holeH);
  return group;
}

function addReveal(group, cd, holeW, holeH) {
  const z = cd.wallZ - WALL_THICKNESS / 2;
  const revealDepth = WALL_THICKNESS;
  const edge = 0.085;
  const halfW = holeW / 2;
  const halfH = holeH / 2;

  addBox(group, edge, holeH, revealDepth, cd.worldX - halfW + edge / 2, cd.worldY, z, plasterEdgeMaterial);
  addBox(group, edge, holeH, revealDepth, cd.worldX + halfW - edge / 2, cd.worldY, z, plasterEdgeMaterial);
  addBox(group, holeW, edge, revealDepth, cd.worldX, cd.worldY + halfH - edge / 2, z, plasterEdgeMaterial);
  addBox(group, holeW, edge, revealDepth, cd.worldX, cd.worldY - halfH + edge / 2, z, plasterEdgeMaterial);
}

function getModuleBounds(cavityData, index) {
  const current = cavityData[index];
  const previous = cavityData[index - 1];
  const next = cavityData[index + 1];

  return {
    top: previous
      ? (previous.worldY + current.worldY) / 2
      : current.worldY + current.spacing / 2,
    bottom: next
      ? (current.worldY + next.worldY) / 2
      : current.worldY - current.spacing / 2,
  };
}

function addEndCaps(wallGroup, cavityData) {
  const wallTop = WALL_Y_CENTER + WALL_HEIGHT / 2;
  const wallBottom = WALL_Y_CENTER - WALL_HEIGHT / 2;
  const topBottom = getModuleBounds(cavityData, 0).top;
  const bottomTop = getModuleBounds(cavityData, cavityData.length - 1).bottom;

  addBox(
    wallGroup,
    WALL_WIDTH,
    wallTop - topBottom,
    WALL_THICKNESS,
    0,
    (wallTop + topBottom) / 2,
    0,
  );
  addBox(
    wallGroup,
    WALL_WIDTH,
    bottomTop - wallBottom,
    WALL_THICKNESS,
    0,
    (bottomTop + wallBottom) / 2,
    0,
  );
}

export async function buildWall(scene, projects, categoryOrder) {
  const loadingBar = document.getElementById('loading-bar');
  const loadingText = document.getElementById('loading-text');
  const setProgress = (pct, msg) => {
    if (loadingBar) loadingBar.style.width = `${Math.min(pct, 100)}%`;
    if (loadingText) loadingText.textContent = msg;
  };

  setProgress(8, 'Building the plaster wall...');
  const { modules: cavityData } = buildModuleLayout(projects, categoryOrder);
  const wallGroup = new THREE.Group();
  scene.add(wallGroup);

  addEndCaps(wallGroup, cavityData);

  for (let i = 0; i < cavityData.length; i++) {
    const cd = cavityData[i];
    const bounds = getModuleBounds(cavityData, i);
    setProgress(12 + Math.round((i / cavityData.length) * 84), `Placing opening: ${cd.project.name}...`);
    wallGroup.add(createOpeningWall(cd, bounds.top, bounds.bottom));
    if (i % 4 === 3) await new Promise(resolve => setTimeout(resolve, 0));
  }

  setProgress(100, 'Wall loaded top to bottom.');
  return { wallGroup, cavityData };
}
