// environment.js — Floor, category pilasters, and section labels.
//
// Exports:
//   buildEnvironment(scene, projects, categoryOrder) → void

import * as THREE from 'three';

const WALL_WIDTH = 50;
const WALL_HEIGHT = 8;
const WALL_Y_CENTER = 4;
const CAVITY_SPACING = 2.8;
const START_X = -22;

const floorMaterial = new THREE.MeshStandardMaterial({
  color: 0x3a2a1a,
  roughness: 0.7,
  metalness: 0.05,
});

const columnMaterial = new THREE.MeshStandardMaterial({
  color: 0xe8e0d4,
  roughness: 0.8,
  metalness: 0.02,
});

function makeLabelTexture(text) {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#c0b0a0';
  ctx.font = 'italic 28px "EB Garamond", Georgia, serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 128, 32);

  const tex = new THREE.CanvasTexture(canvas);
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function buildEnvironment(scene, projects, categoryOrder) {
  // Floor
  const floorGeo = new THREE.PlaneGeometry(WALL_WIDTH + 4, 8);
  const floor = new THREE.Mesh(floorGeo, floorMaterial);
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(0, 0.05, -2);
  floor.receiveShadow = true;
  scene.add(floor);

  // Category pilasters & labels
  let cursorX = START_X;
  for (let ci = 0; ci < categoryOrder.length; ci++) {
    const category = categoryOrder[ci];
    const catProjects = projects.filter(p => p.category === category);

    if (ci > 0) {
      // Pilaster before this category
      const colX = cursorX - 0.3;
      const colGeo = new THREE.BoxGeometry(0.2, WALL_HEIGHT, 0.15);
      const col = new THREE.Mesh(colGeo, columnMaterial);
      col.position.set(colX, WALL_Y_CENTER, 0.35);
      col.castShadow = true;
      col.receiveShadow = true;
      scene.add(col);

      // Category label above column
      const labelTex = makeLabelTexture(category);
      const labelMat = new THREE.MeshBasicMaterial({
        map: labelTex,
        transparent: true,
        depthWrite: false,
      });
      const labelGeo = new THREE.PlaneGeometry(2, 0.5);
      const label = new THREE.Mesh(labelGeo, labelMat);
      label.position.set(colX, WALL_Y_CENTER + WALL_HEIGHT / 2 + 0.4, 0.5);
      scene.add(label);
    }

    cursorX += catProjects.length * CAVITY_SPACING + 0.6;
  }

  // Baseboard
  const baseGeo = new THREE.BoxGeometry(WALL_WIDTH, 0.3, 0.08);
  const baseMat = new THREE.MeshStandardMaterial({
    color: 0x2a1a0a,
    roughness: 0.6,
    metalness: 0.1,
  });
  const baseboard = new THREE.Mesh(baseGeo, baseMat);
  baseboard.position.set(0, 0.2, 0.35);
  baseboard.receiveShadow = true;
  scene.add(baseboard);
}
