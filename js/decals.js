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

function roundedRectPath(ctx, x, y, width, height, r) {
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

function drawProhibitionSign(ctx, x, y, size, drawIcon) {
  ctx.save();
  
  // 1. Draw the inner icon in dark charcoal
  ctx.strokeStyle = 'rgba(24, 27, 24, 0.9)';
  ctx.fillStyle = 'rgba(24, 27, 24, 0.9)';
  ctx.lineWidth = size * 0.055;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  drawIcon(ctx, x, y, size * 0.7);
  
  // 2. Draw the red prohibition ring and slash
  ctx.strokeStyle = '#e53935'; // professional warning red
  ctx.lineWidth = size * 0.09;
  ctx.lineCap = 'square';
  
  // Circle
  ctx.beginPath();
  ctx.arc(x, y, size * 0.44, 0, Math.PI * 2);
  ctx.stroke();
  
  // Diagonal slash (ISO 7010 style: top-left to bottom-right)
  const angle = 45 * Math.PI / 180;
  const dx = Math.cos(angle) * size * 0.44;
  const dy = Math.sin(angle) * size * 0.44;
  ctx.beginPath();
  ctx.moveTo(x - dx, y - dy);
  ctx.lineTo(x + dx, y + dy);
  ctx.stroke();
  
  ctx.restore();
}

function drawCameraIcon(ctx, x, y, size) {
  ctx.beginPath();
  const w = size * 0.54;
  const h = size * 0.34;
  
  // Top prism/flash mount
  ctx.fillStyle = 'rgba(24, 27, 24, 0.9)';
  ctx.fillRect(x - size * 0.1, y - h / 2 - size * 0.07, size * 0.2, size * 0.08);
  
  // Main camera body
  roundedRectPath(ctx, x - w / 2, y - h / 2, w, h, size * 0.06);
  ctx.fill();
  
  // Lens ring
  ctx.strokeStyle = '#f5f5f5';
  ctx.lineWidth = size * 0.055;
  ctx.beginPath();
  ctx.arc(x, y + size * 0.01, size * 0.095, 0, Math.PI * 2);
  ctx.stroke();
  
  // Flash bulb indicator
  ctx.fillStyle = '#f5f5f5';
  ctx.beginPath();
  ctx.arc(x + w * 0.3, y - h * 0.22, size * 0.035, 0, Math.PI * 2);
  ctx.fill();
}

function drawFoodDrinkIcon(ctx, x, y, size) {
  ctx.fillStyle = 'rgba(24, 27, 24, 0.9)';
  
  // Soda Cup
  ctx.save();
  ctx.translate(x + size * 0.13, y + size * 0.04);
  // Cup body
  ctx.beginPath();
  ctx.moveTo(-size * 0.11, -size * 0.15);
  ctx.lineTo(size * 0.11, -size * 0.15);
  ctx.lineTo(size * 0.07, size * 0.22);
  ctx.lineTo(-size * 0.07, size * 0.22);
  ctx.closePath();
  ctx.fill();
  // Lid
  ctx.fillRect(-size * 0.13, -size * 0.18, size * 0.26, size * 0.04);
  // Straw
  ctx.strokeStyle = 'rgba(24, 27, 24, 0.9)';
  ctx.lineWidth = size * 0.04;
  ctx.beginPath();
  ctx.moveTo(0, -size * 0.18);
  ctx.lineTo(0, -size * 0.25);
  ctx.lineTo(size * 0.07, -size * 0.31);
  ctx.stroke();
  ctx.restore();
  
  // Hamburger
  ctx.save();
  ctx.translate(x - size * 0.15, y + size * 0.08);
  // Top bun
  ctx.beginPath();
  ctx.arc(0, -size * 0.02, size * 0.14, Math.PI, 0);
  ctx.fill();
  // Patty
  ctx.fillRect(-size * 0.14, 0, size * 0.28, size * 0.04);
  // Bottom bun
  roundedRectPath(ctx, -size * 0.14, size * 0.06, size * 0.28, size * 0.05, size * 0.025);
  ctx.fill();
  ctx.restore();
}

function drawNoSittingIcon(ctx, x, y, size) {
  ctx.strokeStyle = 'rgba(24, 27, 24, 0.9)';
  ctx.fillStyle = 'rgba(24, 27, 24, 0.9)';
  ctx.lineWidth = size * 0.06;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  
  // Draw Chair
  ctx.beginPath();
  // Backrest
  ctx.moveTo(x - size * 0.11, y - size * 0.24);
  ctx.lineTo(x - size * 0.11, y + size * 0.08);
  // Seat
  ctx.lineTo(x + size * 0.17, y + size * 0.08);
  ctx.stroke();
  // Legs
  ctx.beginPath();
  ctx.moveTo(x - size * 0.09, y + size * 0.08);
  ctx.lineTo(x - size * 0.09, y + size * 0.28);
  ctx.moveTo(x + size * 0.13, y + size * 0.08);
  ctx.lineTo(x + size * 0.13, y + size * 0.28);
  ctx.stroke();
  
  // Draw Person Sitting
  // Head
  ctx.beginPath();
  ctx.arc(x + size * 0.03, y - size * 0.27, size * 0.07, 0, Math.PI * 2);
  ctx.fill();
  
  // Torso, thigh, calves
  ctx.beginPath();
  ctx.moveTo(x + size * 0.02, y - size * 0.19);
  ctx.lineTo(x + size * 0.0, y + size * 0.05);
  ctx.lineTo(x + size * 0.21, y + size * 0.05);
  ctx.lineTo(x + size * 0.21, y + size * 0.24);
  ctx.stroke();
  
  // Arm
  ctx.beginPath();
  ctx.moveTo(x + size * 0.01, y - size * 0.11);
  ctx.lineTo(x + size * 0.11, y - size * 0.04);
  ctx.lineTo(x + size * 0.15, y + size * 0.05);
  ctx.stroke();
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

function drawRulesTexture() {
  return makeTransparentTexture(780, 520, (ctx, width) => {
    setInk(ctx);
    drawProhibitionSign(ctx, 125, 86, 90, drawCameraIcon);
    drawProhibitionSign(ctx, 260, 86, 90, drawFoodDrinkIcon);
    drawProhibitionSign(ctx, 395, 86, 90, drawNoSittingIcon);

    ctx.font = '39px "Univers", "Helvetica Neue", Helvetica, Arial, sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText('No flash photography', 70, 162);
    ctx.fillText('No eating or drinking', 70, 213);
    ctx.fillText('No sitting or sleeping', 70, 264);

    ctx.font = '39px "Univers", "Helvetica Neue", Helvetica, Arial, sans-serif';
    ctx.fillText('Please do not touch', 88, 386);
    ctx.fillText('the artworks', 88, 434);
  });
}

function drawRestroomNormalMap() {
  const width = 728;
  const height = 970;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  const imgData = ctx.createImageData(width, height);
  const data = imgData.data;

  const R = 48; // corner radius
  const B = 24; // bevel width
  const maxTilt = 0.75; // max tilt of normal

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let dx = 0;
      let dy = 0;
      let isCorner = false;

      // Determine region
      if (x < R && y < R) {
        dx = x - R;
        dy = y - R;
        isCorner = true;
      } else if (x > width - R && y < R) {
        dx = x - (width - R);
        dy = y - R;
        isCorner = true;
      } else if (x < R && y > height - R) {
        dx = x - R;
        dy = y - (height - R);
        isCorner = true;
      } else if (x > width - R && y > height - R) {
        dx = x - (width - R);
        dy = y - (height - R);
        isCorner = true;
      } else {
        // Straight edges
        if (x < B) {
          dx = x - B;
        } else if (x > width - B) {
          dx = x - (width - B);
        }
        if (y < B) {
          dy = y - B;
        } else if (y > height - B) {
          dy = y - (height - B);
        }
      }

      let nx = 0;
      let ny = 0;
      let nz = 1;

      if (isCorner) {
        const dist = Math.sqrt(dx * dx + dy * dy);
        const innerR = R - B;
        if (dist > innerR) {
          const t = Math.min(1.0, (dist - innerR) / B);
          const angle = Math.atan2(dy, dx);
          nx = Math.cos(angle) * maxTilt * t;
          ny = -Math.sin(angle) * maxTilt * t; // Flip Y for WebGL Y-up normals
          nz = Math.sqrt(Math.max(0, 1 - nx * nx - ny * ny));
        }
      } else {
        if (dx !== 0 || dy !== 0) {
          const len = Math.sqrt(dx * dx + dy * dy);
          if (len > 0) {
            const t = Math.min(1.0, len / B);
            nx = (dx / len) * maxTilt * t;
            ny = -(dy / len) * maxTilt * t; // Flip Y
            nz = Math.sqrt(Math.max(0, 1 - nx * nx - ny * ny));
          }
        }
      }

      const r = Math.round((nx + 1) * 127.5);
      const g = Math.round((ny + 1) * 127.5);
      const b = Math.round((nz + 1) * 127.5);

      const idx = (y * width + x) * 4;
      data[idx] = r;
      data[idx + 1] = g;
      data[idx + 2] = b;
      data[idx + 3] = 255;
    }
  }

  ctx.putImageData(imgData, 0, 0);

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  return texture;
}

const textureLoader = new THREE.TextureLoader();
let restroomTexture = null;
let restroomMaterial = null;

function getRestroomMaterial() {
  if (!restroomMaterial) {
    restroomTexture = textureLoader.load('img/restroom_sign.png');
    restroomTexture.colorSpace = THREE.SRGBColorSpace;

    const normalTexture = drawRestroomNormalMap();

    restroomMaterial = new THREE.MeshStandardMaterial({
      map: restroomTexture,
      normalMap: normalTexture,
      normalScale: new THREE.Vector2(1.5, 1.5),
      roughness: 0.15,
      metalness: 0.05,
      transparent: true,
    });
  }
  return restroomMaterial;
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
  if (kind === 'restrooms') {
    return getRestroomMaterial();
  }
  const factories = {
    rules: drawRulesTexture,
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
    restrooms: { width: 0.75, height: 1.0 },
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
