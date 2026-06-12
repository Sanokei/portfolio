// environment.js - Vertical white museum wall labels and overhead lamps.

import * as THREE from 'three';
import {
  buildModuleLayout,
  WALL_WIDTH,
  WALL_HEIGHT,
  WALL_Y_CENTER,
} from './layout.js';

const lampMaterial = new THREE.MeshStandardMaterial({
  color: 0x070707,
  roughness: 0.42,
  metalness: 0.35,
});

const lampBarMaterial = new THREE.MeshBasicMaterial({
  color: 0xffd991,
});

function makeSectionTexture(text) {
  const canvas = document.createElement('canvas');
  canvas.width = 900;
  canvas.height = 260;
  const ctx = canvas.getContext('2d');

  const wood = ctx.createLinearGradient(0, 0, 0, canvas.height);
  wood.addColorStop(0, '#5b3924');
  wood.addColorStop(0.25, '#7a4d2f');
  wood.addColorStop(0.52, '#4a2e1f');
  wood.addColorStop(0.74, '#6b4329');
  wood.addColorStop(1, '#2f1d14');
  ctx.fillStyle = wood;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (let y = 14; y < canvas.height; y += 12) {
    const wave = Math.sin(y * 0.08) * 9;
    ctx.strokeStyle = y % 24 === 0 ? 'rgba(255, 220, 150, 0.10)' : 'rgba(15, 8, 4, 0.18)';
    ctx.lineWidth = y % 24 === 0 ? 2 : 1;
    ctx.beginPath();
    ctx.moveTo(0, y + wave);
    for (let x = 0; x <= canvas.width; x += 36) {
      ctx.lineTo(x, y + Math.sin(x * 0.025 + y * 0.06) * 7);
    }
    ctx.stroke();
  }

  ctx.strokeStyle = '#efcf78';
  ctx.lineWidth = 12;
  ctx.strokeRect(18, 18, canvas.width - 36, canvas.height - 36);
  ctx.strokeStyle = '#8f6a24';
  ctx.lineWidth = 4;
  ctx.strokeRect(40, 40, canvas.width - 80, canvas.height - 80);

  ctx.fillStyle = '#f4d77f';
  ctx.font = '900 74px "Playfair Display SC", Georgia, serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = 'rgba(0, 0, 0, 0.65)';
  ctx.shadowBlur = 8;
  ctx.shadowOffsetX = 2;
  ctx.shadowOffsetY = 3;
  ctx.fillText(text.toUpperCase(), canvas.width / 2, canvas.height / 2 + 3);
  ctx.shadowColor = 'transparent';

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function makeSectionPlaque(text) {
  const texture = makeSectionTexture(text);
  const side = new THREE.MeshStandardMaterial({ color: 0x2a2018, roughness: 0.72, metalness: 0.08 });
  const back = new THREE.MeshStandardMaterial({ color: 0x17120d, roughness: 0.8, metalness: 0.04 });
  const front = new THREE.MeshStandardMaterial({
    map: texture,
    roughness: 0.48,
    metalness: 0.12,
  });

  return new THREE.Mesh(
    new THREE.BoxGeometry(2.35, 0.68, 0.12),
    [side, side, side, side, front, back],
  );
}

function addWallBounds(scene) {
  const trimMaterial = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.82,
    metalness: 0,
  });
  const left = new THREE.Mesh(new THREE.BoxGeometry(0.12, WALL_HEIGHT, 0.07), trimMaterial);
  const right = left.clone();
  left.position.set(-WALL_WIDTH / 2 + 0.06, WALL_Y_CENTER, 0.5);
  right.position.set(WALL_WIDTH / 2 - 0.06, WALL_Y_CENTER, 0.5);
  scene.add(left, right);
}

function addLamp(scene, module) {
  const group = new THREE.Group();
  const x = module.worldX;
  const barY = module.worldY + module.holeH * 0.64;
  const mountY = barY + 0.24;
  const wallZ = module.wallZ;

  const backplate = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.045, 28), lampMaterial);
  backplate.rotation.x = Math.PI / 2;
  backplate.position.set(x, mountY, wallZ + 0.055);
  group.add(backplate);

  const armCurve = new THREE.QuadraticBezierCurve3(
    new THREE.Vector3(x, mountY, wallZ + 0.07),
    new THREE.Vector3(x, mountY + 0.02, wallZ + 0.32),
    new THREE.Vector3(x, barY, wallZ + 0.38),
  );
  const arm = new THREE.Mesh(new THREE.TubeGeometry(armCurve, 24, 0.026, 12), lampMaterial);
  group.add(arm);

  const housing = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.09, 0.1), lampMaterial);
  housing.position.set(x, barY, wallZ + 0.42);
  group.add(housing);

  const lightBar = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.035, 0.035), lampBarMaterial);
  lightBar.position.set(x, barY - 0.05, wallZ + 0.45);
  group.add(lightBar);

  scene.add(group);
}

export function buildEnvironment(scene, projects, categoryOrder) {
  const { sections, modules } = buildModuleLayout(projects, categoryOrder);

  addWallBounds(scene);

  for (const section of sections) {
    const label = makeSectionPlaque(section.category);
    label.position.set(section.labelX, section.labelY, 0.6);
    scene.add(label);
  }

  for (const module of modules) {
    addLamp(scene, module);
  }
}
