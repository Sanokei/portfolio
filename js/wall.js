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

let cutSurfaceMaterial = null;
let rockCavityMaterial = null;

function makeCutTexture(base = '#9f978a') {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (let i = 0; i < 3600; i++) {
    const shade = 86 + Math.floor(Math.random() * 86);
    const alpha = 0.08 + Math.random() * 0.14;
    ctx.fillStyle = `rgba(${shade}, ${Math.floor(shade * 0.98)}, ${Math.floor(shade * 0.93)}, ${alpha})`;
    ctx.fillRect(
      Math.random() * canvas.width,
      Math.random() * canvas.height,
      1 + Math.random() * 3.5,
      1 + Math.random() * 3.5,
    );
  }

  for (let i = 0; i < 90; i++) {
    const x = Math.random() * canvas.width;
    const y = Math.random() * canvas.height;
    const length = 12 + Math.random() * 54;
    const angle = Math.random() * Math.PI * 2;
    ctx.strokeStyle = i % 4 === 0 ? 'rgba(52, 47, 42, 0.34)' : 'rgba(220, 213, 198, 0.12)';
    ctx.lineWidth = 0.6 + Math.random() * 1.4;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + Math.cos(angle) * length, y + Math.sin(angle) * length);
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(1.8, 1.8);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function getCutSurfaceMaterial() {
  if (!cutSurfaceMaterial) {
    cutSurfaceMaterial = new THREE.MeshStandardMaterial({
      color: 0xa59d91,
      map: makeCutTexture(),
      roughness: 0.98,
      metalness: 0,
      flatShading: true,
    });
  }
  return cutSurfaceMaterial;
}

function getRockCavityMaterial() {
  if (!rockCavityMaterial) {
    const texture = makeCutTexture('#a89d8c');
    rockCavityMaterial = new THREE.MeshStandardMaterial({
      color: 0x908a80,
      map: texture,
      bumpMap: texture,
      bumpScale: 0.12,
      roughness: 1,
      metalness: 0,
      side: THREE.DoubleSide,
      flatShading: true,
    });
  }
  return rockCavityMaterial;
}

function seededRandom(seed) {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

function addBox(group, width, height, depth, x, y, z, material = plasterMaterial) {
  if (width <= 0 || height <= 0) return;

  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(width, height, depth),
    material,
  );
  mesh.position.set(x, y, z);
  group.add(mesh);
}

function createRoughCutoutPoints(cd) {
  const rand = seededRandom(cd.seed);
  const points = [];
  const count = 44;
  const rx = cd.holeW * 0.5;
  const ry = cd.holeH * 0.5;
  const wobbleA = rand() * Math.PI * 2;
  const wobbleB = rand() * Math.PI * 2;

  for (let i = 0; i < count; i++) {
    const angle = -(i / count) * Math.PI * 2;
    const chip = (rand() - 0.5) * 0.15;
    const radius = 1 +
      Math.sin(angle * 3 + wobbleA) * 0.075 +
      Math.sin(angle * 7 + wobbleB) * 0.05 +
      chip;
    points.push(new THREE.Vector2(
      cd.worldX + Math.cos(angle) * rx * radius,
      cd.worldY + Math.sin(angle) * ry * radius,
    ));
  }

  return points;
}

function createWallTileWithCutout(cd, tileTop, tileBottom, cutoutPoints) {
  const wallLeft = -WALL_WIDTH / 2;
  const wallRight = WALL_WIDTH / 2;
  const shape = new THREE.Shape();

  shape.moveTo(wallLeft, tileBottom);
  shape.lineTo(wallRight, tileBottom);
  shape.lineTo(wallRight, tileTop);
  shape.lineTo(wallLeft, tileTop);
  shape.lineTo(wallLeft, tileBottom);

  const hole = new THREE.Path();
  cutoutPoints.forEach((point, index) => {
    if (index === 0) {
      hole.moveTo(point.x, point.y);
    } else {
      hole.lineTo(point.x, point.y);
    }
  });
  hole.closePath();
  shape.holes.push(hole);

  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: WALL_THICKNESS,
    bevelEnabled: false,
    curveSegments: 1,
    steps: 1,
  });
  geometry.translate(0, 0, -WALL_THICKNESS / 2);
  geometry.computeVertexNormals();

  return new THREE.Mesh(geometry, [plasterMaterial, getCutSurfaceMaterial()]);
}

function addSphericalRockCavity(group, cd, cutoutPoints) {
  const rand = seededRandom(cd.seed + 911);
  const segments = cutoutPoints.length;
  const rings = 9;
  const vertices = [];
  const uvs = [];
  const indices = [];

  for (let ring = 0; ring < rings; ring++) {
    const t = ring / (rings - 1);
    const sphereCurve = Math.sin(t * Math.PI);
    const taper = 1.02 - t * 0.22;
    const bulge = taper + sphereCurve * 0.34;
    const z = cd.wallZ - t * cd.cavityDepth;

    for (let i = 0; i < segments; i++) {
      const point = cutoutPoints[i];
      const radialNoise = 1 + (rand() - 0.5) * 0.08 + Math.sin((i / segments) * Math.PI * 8 + ring) * 0.025;
      const dx = point.x - cd.worldX;
      const dy = point.y - cd.worldY;
      vertices.push(
        cd.worldX + dx * bulge * radialNoise,
        cd.worldY + dy * bulge * radialNoise,
        z + (rand() - 0.5) * 0.045,
      );
      uvs.push(i / segments, t);
    }
  }

  for (let ring = 0; ring < rings - 1; ring++) {
    for (let i = 0; i < segments; i++) {
      const next = (i + 1) % segments;
      const a = ring * segments + i;
      const b = ring * segments + next;
      const c = (ring + 1) * segments + i;
      const d = (ring + 1) * segments + next;
      indices.push(a, c, b, b, c, d);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  const mesh = new THREE.Mesh(geometry, getRockCavityMaterial());
  mesh.name = `sphere-subtraction-rock-cavity-${cd.project.id}`;
  group.add(mesh);
}

function createOpeningWall(cd, tileTop, tileBottom) {
  const group = new THREE.Group();
  const cutoutPoints = createRoughCutoutPoints(cd);
  group.add(createWallTileWithCutout(cd, tileTop, tileBottom, cutoutPoints));
  addSphericalRockCavity(group, cd, cutoutPoints);
  return group;
}

function getModuleBounds(cavityData, index) {
  const current = cavityData[index];
  const previous = cavityData[index - 1];
  const next = cavityData[index + 1];
  const defaultTop = previous
    ? (previous.worldY + current.worldY) / 2
    : current.worldY + current.spacing / 2;
  const defaultBottom = next
    ? (current.worldY + next.worldY) / 2
    : current.worldY - current.spacing / 2;

  let top = defaultTop;
  let bottom = defaultBottom;

  if ((!previous || previous.category !== current.category) && current.sectionWallTopY) {
    top = current.sectionWallTopY;
  }

  if (next && next.category !== current.category && next.sectionWallTopY) {
    bottom = next.sectionWallTopY;
  }

  return {
    top,
    bottom,
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

export async function buildWall(scene, projects, categoryOrder, onProgress) {
  const { modules: cavityData } = buildModuleLayout(projects, categoryOrder);
  const wallGroup = new THREE.Group();
  scene.add(wallGroup);

  addEndCaps(wallGroup, cavityData);

  for (let i = 0; i < cavityData.length; i++) {
    const cd = cavityData[i];
    const bounds = getModuleBounds(cavityData, i);
    wallGroup.add(createOpeningWall(cd, bounds.top, bounds.bottom));
    if (onProgress) onProgress(i + 1, cavityData.length);
    if (i % 4 === 3) await new Promise(resolve => setTimeout(resolve, 0));
  }

  return { wallGroup, cavityData };
}

// ---------------------------------------------------------------------------
// Header backdrop — a standalone solid panel that fills the viewport behind
// the title plaque.  Separated from the main project wall so it can be sized
// independently (wider + taller than any viewport at the header position).
// ---------------------------------------------------------------------------
export function buildHeaderBackdrop(scene, metrics) {
  const { headerY, wallZ, backdropHeight } = metrics;
  // Wider than the project wall to guarantee horizontal fill on every
  // aspect ratio; height tracks the actual visible slice at the wall plane.
  const panelW = 22;
  const panelH = backdropHeight;

  const panel = new THREE.Mesh(
    new THREE.BoxGeometry(panelW, panelH, 0.18),
    plasterMaterial,
  );
  // Slightly in front of the main wall face (plaque is at wallZ + 0.09).
  // In-front placement avoids z-fighting with the spherical rock cavities
  // while keeping the plaque legible on top.
  panel.position.set(0, headerY, wallZ + 0.025);
  panel.name = 'header-backdrop';
  scene.add(panel);
  return panel;
}
