// decals.js - Flat museum wall decals placed between project exhibits.

import * as THREE from 'three';
import { getLayoutMetrics } from './layout.js';

const DECAL_Z_OFFSET = 0.105;

const DECAL_PLACEMENTS = [
  { afterId: 2, kind: 'rules', side: -1, rotate: 0 },
  { afterId: 4, kind: 'restrooms', side: 1, rotate: 0 },
];

const decalMaterials = new Map();

function makeTransparentTexture(width, height, draw) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, width, height);
  draw(ctx, width, height);

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function makeDecalMaterial(kind, textureFactory) {
  if (!decalMaterials.has(kind)) {
    const texture = textureFactory();
    decalMaterials.set(kind, new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      alphaTest: 0.02,
      depthWrite: false,
      toneMapped: false,
    }));
  }
  return decalMaterials.get(kind);
}

function setInk(ctx) {
  ctx.strokeStyle = 'rgba(24, 27, 24, 0.82)';
  ctx.fillStyle = 'rgba(24, 27, 24, 0.82)';
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
}

function drawSlash(ctx, x, y, size) {
  ctx.save();
  ctx.strokeStyle = 'rgba(24, 27, 24, 0.9)';
  ctx.lineWidth = Math.max(5, size * 0.12);
  ctx.beginPath();
  ctx.moveTo(x - size * 0.42, y + size * 0.42);
  ctx.lineTo(x + size * 0.42, y - size * 0.42);
  ctx.stroke();
  ctx.restore();
}

function drawCameraIcon(ctx, x, y, size) {
  ctx.save();
  setInk(ctx);
  ctx.lineWidth = size * 0.08;
  ctx.strokeRect(x - size * 0.32, y - size * 0.12, size * 0.56, size * 0.32);
  ctx.strokeRect(x - size * 0.18, y - size * 0.25, size * 0.2, size * 0.13);
  ctx.beginPath();
  ctx.arc(x - size * 0.05, y + size * 0.04, size * 0.1, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x + size * 0.24, y - size * 0.25);
  ctx.lineTo(x + size * 0.42, y - size * 0.38);
  ctx.lineTo(x + size * 0.36, y - size * 0.18);
  ctx.stroke();
  drawSlash(ctx, x, y, size);
  ctx.restore();
}

function drawCupIcon(ctx, x, y, size) {
  ctx.save();
  setInk(ctx);
  ctx.lineWidth = size * 0.08;
  ctx.beginPath();
  ctx.moveTo(x - size * 0.2, y - size * 0.3);
  ctx.lineTo(x + size * 0.16, y - size * 0.3);
  ctx.lineTo(x + size * 0.08, y + size * 0.32);
  ctx.lineTo(x - size * 0.12, y + size * 0.32);
  ctx.closePath();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x + size * 0.18, y - size * 0.08);
  ctx.quadraticCurveTo(x + size * 0.43, y - size * 0.02, x + size * 0.18, y + size * 0.16);
  ctx.stroke();
  drawSlash(ctx, x, y, size);
  ctx.restore();
}

function drawSleepIcon(ctx, x, y, size) {
  ctx.save();
  setInk(ctx);
  ctx.lineWidth = size * 0.08;
  ctx.beginPath();
  ctx.moveTo(x - size * 0.36, y + size * 0.18);
  ctx.lineTo(x + size * 0.2, y + size * 0.18);
  ctx.moveTo(x - size * 0.33, y - size * 0.08);
  ctx.lineTo(x - size * 0.05, y - size * 0.08);
  ctx.lineTo(x - size * 0.33, y + size * 0.12);
  ctx.lineTo(x - size * 0.05, y + size * 0.12);
  ctx.moveTo(x + size * 0.06, y - size * 0.29);
  ctx.lineTo(x + size * 0.36, y - size * 0.29);
  ctx.lineTo(x + size * 0.06, y - size * 0.05);
  ctx.lineTo(x + size * 0.36, y - size * 0.05);
  ctx.stroke();
  drawSlash(ctx, x, y, size);
  ctx.restore();
}

function drawPerson(ctx, x, y, size, dress) {
  ctx.save();
  setInk(ctx);
  ctx.beginPath();
  ctx.arc(x, y - size * 0.36, size * 0.09, 0, Math.PI * 2);
  ctx.fill();

  ctx.lineWidth = size * 0.08;
  if (dress) {
    ctx.beginPath();
    ctx.moveTo(x, y - size * 0.22);
    ctx.lineTo(x - size * 0.18, y + size * 0.18);
    ctx.lineTo(x + size * 0.18, y + size * 0.18);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(x - size * 0.08, y + size * 0.18);
    ctx.lineTo(x - size * 0.08, y + size * 0.42);
    ctx.moveTo(x + size * 0.08, y + size * 0.18);
    ctx.lineTo(x + size * 0.08, y + size * 0.42);
    ctx.stroke();
  } else {
    ctx.beginPath();
    ctx.moveTo(x, y - size * 0.22);
    ctx.lineTo(x, y + size * 0.2);
    ctx.moveTo(x - size * 0.17, y - size * 0.06);
    ctx.lineTo(x + size * 0.17, y - size * 0.06);
    ctx.moveTo(x, y + size * 0.2);
    ctx.lineTo(x - size * 0.14, y + size * 0.42);
    ctx.moveTo(x, y + size * 0.2);
    ctx.lineTo(x + size * 0.14, y + size * 0.42);
    ctx.stroke();
  }
  ctx.restore();
}

function drawArrow(ctx, x, y, width, right) {
  const dir = right ? 1 : -1;
  ctx.save();
  setInk(ctx);
  ctx.lineWidth = 16;
  ctx.beginPath();
  ctx.moveTo(x - dir * width * 0.5, y);
  ctx.lineTo(x + dir * width * 0.32, y);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x + dir * width * 0.5, y);
  ctx.lineTo(x + dir * width * 0.25, y - 28);
  ctx.lineTo(x + dir * width * 0.25, y + 28);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function roundedRect(ctx, x, y, width, height, radius) {
  const r = Math.min(radius, width * 0.5, height * 0.5);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + width - r, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + r);
  ctx.lineTo(x + width, y + height - r);
  ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  ctx.lineTo(x + r, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function drawRulesTexture() {
  return makeTransparentTexture(780, 520, (ctx, width) => {
    setInk(ctx);
    drawCameraIcon(ctx, 125, 86, 90);
    drawCupIcon(ctx, 260, 86, 90);
    drawSleepIcon(ctx, 395, 86, 90);

    ctx.font = '39px "Comic Sans MS", "Trebuchet MS", sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText('No flash photography', 70, 162);
    ctx.fillText('No eating or drinking', 70, 213);
    ctx.fillText('No sitting or sleeping', 70, 264);

    ctx.font = '39px "Comic Sans MS", "Trebuchet MS", sans-serif';
    ctx.fillText('Please do not touch', 88, 386);
    ctx.fillText('the artworks', 88, 434);
  });
}

function drawRestroomTexture() {
  return makeTransparentTexture(720, 960, (ctx, width, height) => {
    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.32)';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetX = 8;
    ctx.shadowOffsetY = 8;
    ctx.fillStyle = '#0c5b8f';
    roundedRect(ctx, 28, 26, width - 64, height - 66, 48);
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.lineWidth = 2;
    roundedRect(ctx, 28, 26, width - 64, height - 66, 48);
    ctx.stroke();
    ctx.restore();

    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';

    ctx.beginPath();
    ctx.arc(257, 190, 44, 0, Math.PI * 2);
    ctx.arc(455, 190, 44, 0, Math.PI * 2);
    ctx.fill();

    roundedRect(ctx, 172, 250, 170, 244, 46);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(172, 342);
    ctx.lineTo(124, 506);
    ctx.quadraticCurveTo(116, 536, 143, 546);
    ctx.quadraticCurveTo(171, 555, 181, 523);
    ctx.lineTo(220, 385);
    ctx.lineTo(293, 385);
    ctx.lineTo(333, 523);
    ctx.quadraticCurveTo(343, 555, 371, 546);
    ctx.quadraticCurveTo(398, 536, 390, 506);
    ctx.lineTo(342, 342);
    ctx.closePath();
    ctx.fill();
    ctx.fillRect(219, 492, 42, 150);
    ctx.fillRect(274, 492, 42, 150);

    roundedRect(ctx, 375, 250, 168, 380, 42);
    ctx.fill();
    ctx.fillRect(415, 468, 47, 174);
    ctx.fillRect(484, 468, 47, 174);
    roundedRect(ctx, 338, 314, 48, 156, 22);
    roundedRect(ctx, 532, 314, 48, 156, 22);
    ctx.fill();

    ctx.font = '74px Arial, Helvetica, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('RESTROOM', width * 0.5, 755);

    ctx.beginPath();
    ctx.moveTo(218, 820);
    ctx.lineTo(431, 820);
    ctx.lineTo(431, 782);
    ctx.lineTo(520, 848);
    ctx.lineTo(431, 914);
    ctx.lineTo(431, 876);
    ctx.lineTo(218, 876);
    ctx.closePath();
    ctx.fill();
  });
}

function drawGiftShopTexture() {
  return makeTransparentTexture(700, 255, (ctx) => {
    setInk(ctx);
    drawArrow(ctx, 156, 104, 220, false);
    ctx.lineWidth = 9;
    ctx.strokeRect(386, 76, 112, 84);
    ctx.beginPath();
    ctx.moveTo(410, 76);
    ctx.quadraticCurveTo(442, 26, 474, 76);
    ctx.stroke();
    ctx.font = '800 41px Inter, Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('GIFT SHOP', 340, 218);
    ctx.font = '700 24px Inter, Arial, sans-serif';
    ctx.fillText('no refunds from the void', 340, 247);
  });
}

function drawDoNotTapTexture() {
  return makeTransparentTexture(690, 270, (ctx) => {
    setInk(ctx);
    ctx.lineWidth = 11;
    ctx.strokeRect(70, 45, 170, 115);
    ctx.beginPath();
    ctx.moveTo(272, 102);
    ctx.lineTo(350, 78);
    ctx.lineTo(350, 126);
    ctx.closePath();
    ctx.fill();
    ctx.font = '800 39px Inter, Arial, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('DO NOT TAP', 272, 174);
    ctx.font = '700 31px Inter, Arial, sans-serif';
    ctx.fillText('the glass taps back', 272, 214);
  });
}

function drawYouAreHereTexture() {
  return makeTransparentTexture(610, 280, (ctx) => {
    setInk(ctx);
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(84, 70);
    ctx.lineTo(248, 48);
    ctx.lineTo(406, 80);
    ctx.lineTo(542, 54);
    ctx.lineTo(542, 200);
    ctx.lineTo(406, 226);
    ctx.lineTo(248, 194);
    ctx.lineTo(84, 216);
    ctx.closePath();
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(318, 139, 18, 0, Math.PI * 2);
    ctx.fill();
    ctx.font = '800 30px Inter, Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('YOU ARE', 310, 248);
    ctx.fillText('STILL HERE', 310, 276);
  });
}

function drawExitEventuallyTexture() {
  return makeTransparentTexture(720, 245, (ctx) => {
    setInk(ctx);
    ctx.font = '900 62px Inter, Arial, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('EXIT', 70, 88);
    drawArrow(ctx, 444, 72, 260, true);
    ctx.font = '700 34px Inter, Arial, sans-serif';
    ctx.fillText('eventually', 75, 162);
    ctx.font = '700 24px Inter, Arial, sans-serif';
    ctx.fillText('please finish the portfolio first', 75, 207);
  });
}

function getMaterial(kind) {
  const factories = {
    rules: drawRulesTexture,
    restrooms: drawRestroomTexture,
    giftShop: drawGiftShopTexture,
    doNotTap: drawDoNotTapTexture,
    youAreHere: drawYouAreHereTexture,
    exitEventually: drawExitEventuallyTexture,
  };
  return makeDecalMaterial(kind, factories[kind]);
}

function getTemplateSize(kind) {
  const sizes = {
    rules: { width: 1.82, height: 1.22 },
    restrooms: { width: 0.92, height: 1.22 },
    giftShop: { width: 1.48, height: 0.54 },
    doNotTap: { width: 1.36, height: 0.54 },
    youAreHere: { width: 1.18, height: 0.54 },
    exitEventually: { width: 1.44, height: 0.49 },
  };
  return sizes[kind] || sizes.rules;
}

function findGap(cavityData, afterId) {
  const index = cavityData.findIndex(cd => cd.project.id === afterId);
  if (index < 0 || index >= cavityData.length - 1) return null;

  const current = cavityData[index];
  const next = cavityData[index + 1];
  if (current.category !== next.category) return null;

  const currentBottom = Math.min(
    current.worldY - current.holeH * 0.5,
    current.plaqueY - current.plaqueH * 0.5,
  );
  const nextTop = Math.max(
    next.worldY + next.holeH * 0.5,
    next.plaqueY + next.plaqueH * 0.5,
  );

  return {
    current,
    next,
    centerY: (currentBottom + nextTop) * 0.5,
    height: Math.max(0, currentBottom - nextTop),
  };
}

function getDecalX(side, width, metrics) {
  const visibleHalf = metrics.visibleWallWidth * 0.5;
  const edgeInset = Math.max(0.08, 0.16 * metrics.objectScale);
  const edgeX = Math.max(0, visibleHalf - width * 0.5 - edgeInset);
  const preferredX = Math.min(2.35 * metrics.objectScale, edgeX);
  return side * Math.max(0.72 * metrics.objectScale, preferredX);
}

export function buildWallDecals(scene, cavityData) {
  const metrics = getLayoutMetrics();
  const group = new THREE.Group();
  group.name = 'wall-decal-gags';

  for (const placement of DECAL_PLACEMENTS) {
    const gap = findGap(cavityData, placement.afterId);
    if (!gap || gap.height <= 0.35) continue;

    const template = getTemplateSize(placement.kind);
    const maxHeight = gap.height * 0.82;
    const scale = Math.min(metrics.objectScale, maxHeight / template.height);
    const width = template.width * scale;
    const height = template.height * scale;

    const mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(width, height),
      getMaterial(placement.kind),
    );
    mesh.position.set(
      getDecalX(placement.side, width, metrics),
      gap.centerY,
      gap.current.wallZ + DECAL_Z_OFFSET,
    );
    mesh.rotation.z = placement.rotate;
    mesh.renderOrder = 4;
    group.add(mesh);
  }

  scene.add(group);
  return group;
}
