// environment.js - Vertical white museum wall labels and overhead lamps.

import * as THREE from 'three';
import {
  buildModuleLayout,
  getLayoutMetrics,
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

const plaqueGlowMaterial = new THREE.MeshBasicMaterial({
  color: 0xffdfad,
  transparent: true,
  opacity: 0.72,
  depthWrite: false,
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

function makeSectionPlaque(text, scale = 1) {
  const texture = makeSectionTexture(text);
  const side = new THREE.MeshStandardMaterial({ color: 0x2a2018, roughness: 0.72, metalness: 0.08 });
  const back = new THREE.MeshStandardMaterial({ color: 0x17120d, roughness: 0.8, metalness: 0.04 });
  const front = new THREE.MeshStandardMaterial({
    map: texture,
    roughness: 0.48,
    metalness: 0.12,
  });

  return new THREE.Mesh(
    new THREE.BoxGeometry(2.35 * scale, 0.68 * scale, 0.12),
    [side, side, side, side, front, back],
  );
}

function addWallBounds(scene) {
  const { wallZ } = getLayoutMetrics();
  const trimMaterial = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.82,
    metalness: 0,
  });
  const left = new THREE.Mesh(new THREE.BoxGeometry(0.12, WALL_HEIGHT, 0.07), trimMaterial);
  const right = left.clone();
  left.position.set(-WALL_WIDTH / 2 + 0.06, WALL_Y_CENTER, wallZ + 0.04);
  right.position.set(WALL_WIDTH / 2 - 0.06, WALL_Y_CENTER, wallZ + 0.04);
  scene.add(left, right);
}

function addLongLamp(scene, {
  name,
  x,
  targetY,
  topY,
  width,
  scale,
  wallZ,
  intensity = 0.72,
  range = 3.2,
}) {
  const group = new THREE.Group();
  group.name = name;
  const barY = topY + 0.06 * scale;
  const mountY = barY + 0.27 * scale;
  const lampWidth = width * scale;

  const backplate = new THREE.Mesh(new THREE.CylinderGeometry(0.12 * scale, 0.12 * scale, 0.045, 28), lampMaterial);
  backplate.rotation.x = Math.PI / 2;
  backplate.position.set(x, mountY, wallZ + 0.055);
  group.add(backplate);

  const armCurve = new THREE.QuadraticBezierCurve3(
    new THREE.Vector3(x, mountY, wallZ + 0.07),
    new THREE.Vector3(x, mountY + 0.02 * scale, wallZ + 0.32 * scale),
    new THREE.Vector3(x, barY, wallZ + 0.38 * scale),
  );
  const arm = new THREE.Mesh(new THREE.TubeGeometry(armCurve, 24, 0.026 * scale, 12), lampMaterial);
  group.add(arm);

  const housing = new THREE.Mesh(new THREE.BoxGeometry(lampWidth, 0.09 * scale, 0.1 * scale), lampMaterial);
  housing.position.set(x, barY, wallZ + 0.42 * scale);
  group.add(housing);

  const lightBar = new THREE.Mesh(new THREE.BoxGeometry(lampWidth * 0.86, 0.035 * scale, 0.035 * scale), lampBarMaterial);
  lightBar.position.set(x, barY - 0.05 * scale, wallZ + 0.45 * scale);
  group.add(lightBar);

  const light = new THREE.PointLight(0xffd69a, intensity * scale, range * scale, 1.7);
  light.position.copy(lightBar.position);
  light.visible = false;
  group.add(light);

  scene.add(group);
  return { light, y: targetY, range: 6.2 * scale };
}

function addLamp(scene, module) {
  return addLongLamp(scene, {
    name: `cutout-lamp-${module.project.id}`,
    x: module.worldX,
    targetY: module.worldY,
    topY: module.worldY + module.holeH * 0.58,
    width: 0.74,
    scale: module.objectScale,
    wallZ: module.wallZ,
    intensity: 0.82,
    range: 2.8,
  });
}

function addSectionLamp(scene, section, metrics) {
  return addLongLamp(scene, {
    name: `section-lamp-${section.category.toLowerCase().replace(/\s+/g, '-')}`,
    x: section.labelX,
    targetY: section.labelY,
    topY: section.labelY + section.height * 0.5 + 0.16 * section.scale,
    width: Math.min(1.55, section.width * 0.62 / Math.max(section.scale, 0.001)),
    scale: section.scale,
    wallZ: metrics.wallZ,
    intensity: 0.52,
    range: 2.4,
  });
}

function addPlaquePerimeterLight(scene, module) {
  const group = new THREE.Group();
  group.name = `plaque-recessed-perimeter-light-${module.project.id}`;
  const scale = module.objectScale;
  const x = module.plaqueX;
  const y = module.plaqueY;
  const wallZ = module.wallZ;
  const strip = 0.025 * scale;
  const inset = 0.035 * scale;
  const z = wallZ + 0.083;
  const horizontalW = module.plaqueW + inset * 1.5;
  const verticalH = module.plaqueH + inset * 1.5;

  const top = new THREE.Mesh(new THREE.BoxGeometry(horizontalW, strip, 0.008), plaqueGlowMaterial);
  top.position.set(x, y + module.plaqueH / 2 + inset, z);
  group.add(top);

  const bottom = top.clone();
  bottom.position.y = y - module.plaqueH / 2 - inset;
  group.add(bottom);

  const left = new THREE.Mesh(new THREE.BoxGeometry(strip, verticalH, 0.008), plaqueGlowMaterial);
  left.position.set(x - module.plaqueW / 2 - inset, y, z);
  group.add(left);

  const right = left.clone();
  right.position.x = x + module.plaqueW / 2 + inset;
  group.add(right);

  const light = new THREE.PointLight(0xffdfad, 0.28 * scale, 1.55 * scale, 2);
  light.position.set(x, y, wallZ + 0.18 * scale);
  light.visible = false;
  group.add(light);

  scene.add(group);
  return { light, y: module.plaqueY, range: 4.5 * scale };
}

export function buildEnvironment(scene, projects, categoryOrder) {
  const { sections, modules, metrics } = buildModuleLayout(projects, categoryOrder);
  const localLights = [];

  addWallBounds(scene);

  for (const section of sections) {
    const label = makeSectionPlaque(section.category, section.scale);
    label.position.set(section.labelX, section.labelY, metrics.wallZ + 0.1);
    scene.add(label);
    localLights.push(addSectionLamp(scene, section, metrics));
  }

  for (const module of modules) {
    localLights.push(addLamp(scene, module));
    localLights.push(addPlaquePerimeterLight(scene, module));
  }

  return {
    update(cameraY) {
      for (const item of localLights) {
        item.light.visible = Math.abs(item.y - cameraY) < item.range;
      }
    },
  };
}
