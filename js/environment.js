// environment.js - Vertical white museum wall labels and overhead lamps.

import * as THREE from 'three';
import {
  buildModuleLayout,
  getLayoutMetrics,
  SECTION_LAMP_PLAQUE_TOP_OFFSET,
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

const lightBarGlowMaterial = new THREE.MeshBasicMaterial({
  color: 0xffd391,
  transparent: true,
  opacity: 0.9,
  depthWrite: false,
});

let lightBarWoodMaterial = null;
let lightBarEndMaterial = null;
const SCREEN_LIGHT_BAR_Y_OFFSET = -0.16;

function makeLightBarWoodTexture() {
  var canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 160;
  var ctx = canvas.getContext('2d');

  var base = ctx.createLinearGradient(0, 0, 0, canvas.height);
  base.addColorStop(0, '#8a5730');
  base.addColorStop(0.22, '#b0743f');
  base.addColorStop(0.48, '#6b3d20');
  base.addColorStop(0.74, '#9b6235');
  base.addColorStop(1, '#4a2714');
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  var seed = 89173;
  function rand() {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  }

  for (var y = 8; y < canvas.height; y += 4) {
    var wave = Math.sin(y * 0.045) * 18 + Math.cos(y * 0.13) * 7;
    ctx.strokeStyle = y % 16 === 0 ? 'rgba(255, 218, 150, 0.12)' : 'rgba(24, 10, 3, 0.17)';
    ctx.lineWidth = y % 16 === 0 ? 1.4 : 0.8;
    ctx.beginPath();
    ctx.moveTo(0, y + wave);
    for (var x = 0; x <= canvas.width; x += 24) {
      var jitter = Math.sin(x * 0.027 + y * 0.08) * 7 + Math.cos(x * 0.011 + y) * 4;
      ctx.lineTo(x, y + wave + jitter);
    }
    ctx.stroke();
  }

  for (var i = 0; i < 6; i++) {
    var kx = 80 + rand() * (canvas.width - 160);
    var ky = 28 + rand() * (canvas.height - 56);
    var kr = 9 + rand() * 20;
    var knot = ctx.createRadialGradient(kx, ky, 0, kx, ky, kr * 2.7);
    knot.addColorStop(0, 'rgba(18, 8, 3, 0.62)');
    knot.addColorStop(0.32, 'rgba(55, 25, 8, 0.36)');
    knot.addColorStop(0.68, 'rgba(18, 8, 3, 0.15)');
    knot.addColorStop(1, 'rgba(18, 8, 3, 0)');
    ctx.save();
    ctx.translate(kx, ky);
    ctx.scale(1, 0.48 + rand() * 0.32);
    ctx.fillStyle = knot;
    ctx.beginPath();
    ctx.arc(0, 0, kr * 2.7, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  ctx.fillStyle = 'rgba(255, 236, 190, 0.12)';
  ctx.fillRect(0, 0, canvas.width, 9);
  ctx.fillStyle = 'rgba(18, 8, 3, 0.22)';
  ctx.fillRect(0, canvas.height - 13, canvas.width, 13);

  var texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(7, 1);
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function getLightBarWoodMaterial() {
  if (!lightBarWoodMaterial) {
    lightBarWoodMaterial = new THREE.MeshStandardMaterial({
      color: 0x9b6235,
      map: makeLightBarWoodTexture(),
      roughness: 0.58,
      metalness: 0.03,
    });
  }
  return lightBarWoodMaterial;
}

function getLightBarEndMaterial() {
  if (!lightBarEndMaterial) {
    lightBarEndMaterial = new THREE.MeshStandardMaterial({
      color: 0x342013,
      roughness: 0.7,
      metalness: 0.02,
    });
  }
  return lightBarEndMaterial;
}

function makeSectionTexture(text) {
  var canvas = document.createElement('canvas');
  canvas.width = 900;
  canvas.height = 260;
  var ctx = canvas.getContext('2d');

  // --- Perlin-like noise helpers ---
  function hash(x, y) {
    var h = x * 374761393 + y * 668265263;
    h = (h ^ (h >> 13)) * 1274126177;
    return (h ^ (h >> 16)) & 255;
  }

  function smoothNoise(x, y, scale) {
    var sx = x / scale;
    var sy = y / scale;
    var ix = Math.floor(sx);
    var iy = Math.floor(sy);
    var fx = sx - ix;
    var fy = sy - iy;
    var sx2 = fx * fx * (3 - 2 * fx);
    var sy2 = fy * fy * (3 - 2 * fy);

    var n00 = hash(ix, iy);
    var n10 = hash(ix + 1, iy);
    var n01 = hash(ix, iy + 1);
    var n11 = hash(ix + 1, iy + 1);

    var nx0 = n00 + (n10 - n00) * sx2;
    var nx1 = n01 + (n11 - n01) * sx2;
    return ((nx0 + (nx1 - nx0) * sy2) / 255) * 2 - 1;
  }

  function fbm(x, y, scale, octaves, lacunarity, gain) {
    var value = 0;
    var amplitude = 1;
    var frequency = 1;
    var maxValue = 0;
    for (var i = 0; i < octaves; i++) {
      value += amplitude * smoothNoise(x, y, scale / frequency);
      maxValue += amplitude;
      frequency *= lacunarity;
      amplitude *= gain;
    }
    return value / maxValue;
  }

  // --- Step 1: Base color layers (walnut-toned gradient) ---
  var baseGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  baseGrad.addColorStop(0, '#8b5e3c');
  baseGrad.addColorStop(0.15, '#a06f47');
  baseGrad.addColorStop(0.35, '#7a4b2c');
  baseGrad.addColorStop(0.55, '#915d38');
  baseGrad.addColorStop(0.72, '#6b3f24');
  baseGrad.addColorStop(0.88, '#7d4e30');
  baseGrad.addColorStop(1, '#5c3520');
  ctx.fillStyle = baseGrad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // --- Step 2: Base noise layer for subtle wood tone variation ---
  var imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  var pixels = imageData.data;

  for (var py = 0; py < canvas.height; py++) {
    for (var px = 0; px < canvas.width; px++) {
      var idx = (py * canvas.width + px) * 4;
      var n = (smoothNoise(px, py, 3.5) + smoothNoise(px, py, 12) * 0.4) * 0.12;
      pixels[idx] = Math.min(255, Math.max(0, pixels[idx] + n * 40));
      pixels[idx + 1] = Math.min(255, Math.max(0, pixels[idx + 1] + n * 20));
      pixels[idx + 2] = Math.min(255, Math.max(0, pixels[idx + 2] + n * 10));
    }
  }
  ctx.putImageData(imageData, 0, 0);

  // --- Step 3: Wood grain lines (layered FBM at different scales) ---
  var grainCtx = document.createElement('canvas').getContext('2d');
  grainCtx.canvas.width = canvas.width;
  grainCtx.canvas.height = canvas.height;

  // Primary grain - broad sweeping lines
  for (var y = 0; y < canvas.height; y++) {
    var baseWave = Math.sin(y * 0.03) * 40;
    for (var x = 0; x < canvas.width; x++) {
      var noiseShift = fbm(x * 1.2, y, 60, 4, 2.1, 0.5) * 18;
      var grainVal = Math.sin((x + baseWave + noiseShift) * 0.14) *
                      (1 + fbm(x, y, 35, 3, 2.3, 0.55) * 0.6);
      var alpha = Math.abs(grainVal) * 0.06 + Math.max(0, grainVal * 0.04);
      if (alpha > 0.003) {
        grainCtx.fillStyle = 'rgba(20, 10, 4, ' + alpha.toFixed(3) + ')';
        grainCtx.fillRect(x, y, 1, 1);
      }
    }
  }

  // Secondary grain - finer, tighter lines
  for (var y2 = 0; y2 < canvas.height; y2++) {
    var wave2 = Math.sin(y2 * 0.055) * 25 + Math.cos(y2 * 0.09) * 15;
    for (var x2 = 0; x2 < canvas.width; x2++) {
      var n2 = fbm(x2, y2, 28, 3, 2.0, 0.5) * 10;
      var val = Math.sin((x2 + wave2 + n2) * 0.22);
      var alpha2 = Math.abs(val) * 0.035;
      if (alpha2 > 0.002) {
        grainCtx.fillStyle = 'rgba(40, 20, 8, ' + alpha2.toFixed(3) + ')';
        grainCtx.fillRect(x2, y2, 1, 1);
      }
    }
  }

  // Occasional dark accent grain streaks
  for (var y3 = 0; y3 < canvas.height; y3 += 2) {
    var nstr = fbm(0, y3, 45, 3, 2.4, 0.5);
    if (Math.abs(nstr) > 0.45) {
      var wave3 = Math.sin(y3 * 0.04 + nstr * 6) * 50;
      grainCtx.strokeStyle = 'rgba(8, 4, 2, ' + ((Math.abs(nstr) - 0.45) * 1.6).toFixed(3) + ')';
      grainCtx.lineWidth = 1;
      grainCtx.beginPath();
      grainCtx.moveTo(0, y3 + wave3);
      for (var xs = 0; xs <= canvas.width; xs += 20) {
        grainCtx.lineTo(xs, y3 + wave3 + Math.sin(xs * 0.035) * 4);
      }
      grainCtx.stroke();
    }
  }

  ctx.drawImage(grainCtx.canvas, 0, 0);

  // --- Step 4: Knots ---
  var knots = [];
  // Generate 2-3 knot positions avoiding the center text area
  var textZoneTop = canvas.height / 2 - 55;
  var textZoneBottom = canvas.height / 2 + 55;
  var textZoneLeft = canvas.width / 2 - 220;
  var textZoneRight = canvas.width / 2 + 220;

  var rng = (function(s) {
    var seed = s;
    return function rand() { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
  })(text.length * 137 + 42);

  for (var k = 0; k < 3; k++) {
    var kx, ky;
    for (var attempt = 0; attempt < 20; attempt++) {
      kx = 80 + rng() * (canvas.width - 160);
      ky = 30 + rng() * (canvas.height - 60);
      if (kx < textZoneLeft || kx > textZoneRight || ky < textZoneTop || ky > textZoneBottom) {
        break;
      }
    }
    var rx = 8 + rng() * 22;
    var ry = 5 + rng() * 14;
    knots.push({ x: kx, y: ky, rx: rx, ry: ry, darkness: 0.25 + rng() * 0.45 });
  }

  for (var kn = 0; kn < knots.length; kn++) {
    var knot = knots[kn];
    var kx2 = knot.x;
    var ky2 = knot.y;
    var rx2 = knot.rx;
    var ry2 = knot.ry;
    var darkness = knot.darkness;

    // Knot core - dark elliptical center
    var coreGrad = ctx.createRadialGradient(kx2, ky2, 0, kx2, ky2, Math.max(rx2, ry2) * 1.2);
    coreGrad.addColorStop(0, 'rgba(8, 4, 2, ' + (darkness * 0.9) + ')');
    coreGrad.addColorStop(0.25, 'rgba(15, 8, 3, ' + (darkness * 0.7) + ')');
    coreGrad.addColorStop(0.5, 'rgba(25, 12, 5, ' + (darkness * 0.4) + ')');
    coreGrad.addColorStop(1, 'rgba(25, 12, 5, 0)');
    ctx.save();
    ctx.translate(kx2, ky2);
    ctx.scale(1, ry2 / rx2);
    ctx.fillStyle = coreGrad;
    ctx.beginPath();
    ctx.arc(0, 0, rx2 * 1.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Concentric growth rings around knot
    for (var ring = 1; ring <= 5; ring++) {
      var r = rx2 * (0.7 + ring * 0.55);
      var alphaR = darkness * (0.18 - ring * 0.025);
      if (alphaR <= 0) continue;
      ctx.save();
      ctx.translate(kx2, ky2);
      ctx.scale(1, ry2 / rx2);
      ctx.strokeStyle = 'rgba(10, 5, 2, ' + alphaR + ')';
      ctx.lineWidth = 0.8 + ring * 0.3;
      ctx.beginPath();
      ctx.ellipse(0, 0, r, r * 1.05, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // Grain deflection around knot - grain lines curve around the knot
    var deflectRadius = Math.max(rx2, ry2) * 3;
    ctx.strokeStyle = 'rgba(14, 7, 3, ' + (darkness * 0.15) + ')';
    ctx.lineWidth = 0.6;
    for (var i = -8; i <= 8; i++) {
      var baseY = ky2 + i * 5;
      if (baseY < 0 || baseY > canvas.height) continue;
      ctx.beginPath();
      ctx.moveTo(Math.max(0, kx2 - deflectRadius - 30), baseY);
      for (var dx = Math.max(0, kx2 - deflectRadius - 30); dx <= Math.min(canvas.width, kx2 + deflectRadius + 30); dx += 8) {
        var ddx = dx - kx2;
        var ddy = baseY - ky2;
        var dist = Math.sqrt(ddx * ddx + ddy * ddy);
        var deflect = 0;
        if (dist < deflectRadius && dist > 3) {
          deflect = (1 - dist / deflectRadius) * (i > 0 ? -8 : 8) * (1 / (1 + dist * 0.15));
        }
        ctx.lineTo(dx, baseY + deflect + Math.sin(dx * 0.02) * 2);
      }
      ctx.stroke();
    }
  }

  // --- Step 5: Pore texture (fine dots) ---
  for (var pi = 0; pi < 4000; pi++) {
    var pox = Math.floor(rng() * canvas.width);
    var poy = Math.floor(rng() * canvas.height);
    var poreAlpha = 0.015 + rng() * 0.04;
    var poreSize = 0.3 + rng() * 1.0;
    ctx.fillStyle = 'rgba(10, 5, 2, ' + poreAlpha + ')';
    ctx.fillRect(pox, poy, poreSize, poreSize);
  }

  // --- Step 6: Subtle surface scratches / seasoning checks ---
  for (var ck = 0; ck < knots.length; ck++) {
    var cknot = knots[ck];
    var numCracks = 2 + Math.floor(rng() * 3);
    for (var c = 0; c < numCracks; c++) {
      var angle = rng() * Math.PI * 2;
      var length = cknot.rx * (1.5 + rng() * 3);
      var thickness = 0.15 + rng() * 0.4;
      ctx.strokeStyle = 'rgba(4, 2, 1, 0.55)';
      ctx.lineWidth = thickness;
      ctx.beginPath();
      ctx.moveTo(cknot.x, cknot.y);
      var endX = cknot.x + Math.cos(angle) * length;
      var endY = cknot.y + Math.sin(angle) * length;
      var midX = (cknot.x + endX) / 2 + (rng() - 0.5) * length * 0.3;
      var midY = (cknot.y + endY) / 2 + (rng() - 0.5) * length * 0.3;
      ctx.quadraticCurveTo(midX, midY, endX, endY);
      ctx.stroke();
    }
  }

  // --- Step 7: Gold border (inlaid look) ---
  // Outer gold - cast shadow for inset depth
  ctx.save();
  ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
  ctx.shadowBlur = 6;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;
  ctx.strokeStyle = '#efcf78';
  ctx.lineWidth = 12;
  ctx.strokeRect(18, 18, canvas.width - 36, canvas.height - 36);
  ctx.restore();

  // Inner gold detail - engraved look
  ctx.save();
  ctx.shadowColor = 'rgba(0, 0, 0, 0.35)';
  ctx.shadowBlur = 3;
  ctx.strokeStyle = '#8f6a24';
  ctx.lineWidth = 4;
  ctx.strokeRect(40, 40, canvas.width - 80, canvas.height - 80);
  ctx.restore();

  // Fine highlight line for bevel effect
  ctx.strokeStyle = 'rgba(255, 230, 170, 0.3)';
  ctx.lineWidth = 1;
  ctx.strokeRect(42, 42, canvas.width - 84, canvas.height - 84);

  // --- Step 8: Gold text with engraved shadow ---
  ctx.fillStyle = '#f4d77f';
  ctx.font = '900 74px "Playfair Display SC", Georgia, serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
  ctx.shadowBlur = 10;
  ctx.shadowOffsetX = 2;
  ctx.shadowOffsetY = 3;
  ctx.fillText(text.toUpperCase(), canvas.width / 2, canvas.height / 2 + 3);
  ctx.shadowColor = 'transparent';

  // Subtle text highlight for engraved bevel effect
  ctx.fillStyle = 'rgba(255, 240, 200, 0.12)';
  ctx.fillText(text.toUpperCase(), canvas.width / 2 - 1, canvas.height / 2 + 2);

  var texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function makeSectionPlaque(text, scale) {
  if (scale === void 0) scale = 1;
  var texture = makeSectionTexture(text);
  var side = new THREE.MeshStandardMaterial({ color: 0x2a2018, roughness: 0.72, metalness: 0.08 });
  var back = new THREE.MeshStandardMaterial({ color: 0x17120d, roughness: 0.8, metalness: 0.04 });
  var front = new THREE.MeshStandardMaterial({
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
  var metrics = getLayoutMetrics();
  var wallZ = metrics.wallZ;
  var trimMaterial = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.82,
    metalness: 0,
  });
  var left = new THREE.Mesh(new THREE.BoxGeometry(0.12, WALL_HEIGHT, 0.07), trimMaterial);
  var right = left.clone();
  left.position.set(-WALL_WIDTH / 2 + 0.06, WALL_Y_CENTER, wallZ + 0.04);
  right.position.set(WALL_WIDTH / 2 - 0.06, WALL_Y_CENTER, wallZ + 0.04);
  scene.add(left, right);
}

function addLongLamp(scene, opts) {
  var name = opts.name;
  var x = opts.x;
  var targetY = opts.targetY;
  var topY = opts.topY;
  var width = opts.width;
  var scale = opts.scale;
  var wallZ = opts.wallZ;
  var intensity = opts.intensity !== void 0 ? opts.intensity : 0.72;
  var range = opts.range !== void 0 ? opts.range : 3.2;

  var group = new THREE.Group();
  group.name = name;
  var barY = topY + 0.06 * scale;
  var mountY = barY + 0.27 * scale;
  var lampWidth = width * scale;

  var backplate = new THREE.Mesh(new THREE.CylinderGeometry(0.12 * scale, 0.12 * scale, 0.045, 28), lampMaterial);
  backplate.rotation.x = Math.PI / 2;
  backplate.position.set(x, mountY, wallZ + 0.055);
  group.add(backplate);

  var armCurve = new THREE.QuadraticBezierCurve3(
    new THREE.Vector3(x, mountY, wallZ + 0.07),
    new THREE.Vector3(x, mountY + 0.02 * scale, wallZ + 0.32 * scale),
    new THREE.Vector3(x, barY, wallZ + 0.38 * scale),
  );
  var arm = new THREE.Mesh(new THREE.TubeGeometry(armCurve, 24, 0.026 * scale, 12), lampMaterial);
  group.add(arm);

  var housing = new THREE.Mesh(new THREE.BoxGeometry(lampWidth, 0.09 * scale, 0.1 * scale), lampMaterial);
  housing.position.set(x, barY, wallZ + 0.42 * scale);
  group.add(housing);

  var lightBar = new THREE.Mesh(new THREE.BoxGeometry(lampWidth * 0.86, 0.035 * scale, 0.035 * scale), lampBarMaterial);
  lightBar.position.set(x, barY - 0.05 * scale, wallZ + 0.45 * scale);
  group.add(lightBar);

  var light = new THREE.PointLight(0xffd69a, intensity * scale, range * scale, 1.7);
  light.position.copy(lightBar.position);
  light.visible = false;
  group.add(light);

  scene.add(group);
  // The `range` on the returned object is the *visibility* window
  // (camera-to-light distance) — distinct from the PointLight radius.
  return { light: light, y: targetY, range: 6.2 * scale };
}

function addLamp(scene, module) {
  return addLongLamp(scene, {
    name: 'cutout-lamp-' + module.project.id,
    x: module.worldX,
    targetY: module.worldY,
    topY: module.worldY + module.holeH * 0.58,
    width: 0.74,
    scale: module.objectScale,
    wallZ: module.wallZ,
    intensity: 2.55,
    range: 4.05,
  });
}

function addSectionLamp(scene, section, metrics) {
  // Tight radius around the section plaque — the lamp is part of
  // the heading, not the whole section.  ~2.6 world units keeps it
  // from bleeding into adjacent section content.
  var lightRange = 2.6;

  return addLongLamp(scene, {
    name: 'section-lamp-' + section.category.toLowerCase().replace(/\s+/g, '-'),
    x: section.labelX,
    targetY: section.labelY,
    topY: section.labelY + section.height * 0.5 + SECTION_LAMP_PLAQUE_TOP_OFFSET * section.scale,
    width: Math.min(1.55, section.width * 0.62 / Math.max(section.scale, 0.001)),
    scale: section.scale,
    wallZ: metrics.wallZ,
    intensity: 0.52,
    range: lightRange,
  });
}

function addScreenWideLightBar(scene, barY, scale, metrics, nameSuffix) {
  var barWidth = Math.max(WALL_WIDTH + 0.45, metrics.visibleWallWidth * 1.22);
  var barHeight = 0.18 * scale;
  var barDepth = 0.22 * scale;
  var z = metrics.wallZ + 0.18 * scale;
  var group = new THREE.Group();
  var lightEntries = [];

  group.name = 'screen-wide-wood-light-bar-' + nameSuffix;

  var body = new THREE.Mesh(
    new THREE.BoxGeometry(barWidth, barHeight, barDepth),
    getLightBarWoodMaterial(),
  );
  body.position.set(0, barY, z);
  group.add(body);

  var topTrim = new THREE.Mesh(
    new THREE.BoxGeometry(barWidth, 0.026 * scale, barDepth * 1.04),
    getLightBarEndMaterial(),
  );
  topTrim.position.set(0, barY + barHeight * 0.5 + 0.013 * scale, z - 0.002 * scale);
  group.add(topTrim);

  var bottomTrim = topTrim.clone();
  bottomTrim.position.y = barY - barHeight * 0.5 - 0.013 * scale;
  group.add(bottomTrim);

  var glowWidth = barWidth * 0.985;
  var glowZ = z + barDepth * 0.56;
  var topGlow = new THREE.Mesh(
    new THREE.BoxGeometry(glowWidth, 0.026 * scale, 0.035 * scale),
    lightBarGlowMaterial,
  );
  topGlow.position.set(0, barY + barHeight * 0.5 + 0.042 * scale, glowZ);
  group.add(topGlow);

  var bottomGlow = topGlow.clone();
  bottomGlow.position.y = barY - barHeight * 0.5 - 0.042 * scale;
  group.add(bottomGlow);

  var sampleCount = 3;
  var sampleSpan = Math.min(
    barWidth * 0.42,
    Math.max(metrics.visibleWallWidth * 0.58, 3.15 * scale),
  );
  for (var i = 0; i < sampleCount; i++) {
    var t = sampleCount === 1 ? 0.5 : i / (sampleCount - 1);
    var lightX = -sampleSpan + sampleSpan * 2 * t;

    var topLight = new THREE.PointLight(0xffcf8c, 0.72 * scale, 3.35 * scale, 1.65);
    topLight.position.set(lightX, barY + 0.34 * scale, z + 0.22 * scale);
    topLight.visible = false;
    group.add(topLight);
    lightEntries.push({ light: topLight, y: barY, range: 4.7 * scale });

    var bottomLight = new THREE.PointLight(0xffc47d, 0.72 * scale, 3.35 * scale, 1.65);
    bottomLight.position.set(lightX, barY - 0.34 * scale, z + 0.22 * scale);
    bottomLight.visible = false;
    group.add(bottomLight);
    lightEntries.push({ light: bottomLight, y: barY, range: 4.7 * scale });
  }

  scene.add(group);
  return lightEntries;
}

function addPlaqueCameraLight(scene, module, metrics) {
  var scale = module.objectScale;
  var cameraSideZ = metrics.cameraZ + 0.72;
  var reach = Math.max(5.8, cameraSideZ - module.wallZ + 1.45);
  var light = new THREE.PointLight(0xfff0d2, 2.15 * scale, reach, 1.35);
  light.name = 'camera-side-plaque-light-' + module.project.id;
  light.position.set(module.plaqueX, module.plaqueY + 0.04 * scale, cameraSideZ);
  light.visible = false;
  scene.add(light);

  return { light: light, y: module.plaqueY, range: 3.9 * scale };
}

function addPlaquePerimeterLight(scene, module) {
  var group = new THREE.Group();
  group.name = 'plaque-recessed-perimeter-light-' + module.project.id;
  var scale = module.objectScale;
  var x = module.plaqueX;
  var y = module.plaqueY;
  var wallZ = module.wallZ;
  var strip = 0.025 * scale;
  var inset = 0.035 * scale;
  var z = wallZ + 0.083;
  var horizontalW = module.plaqueW + inset * 1.5;
  var verticalH = module.plaqueH + inset * 1.5;

  var top = new THREE.Mesh(new THREE.BoxGeometry(horizontalW, strip, 0.008), plaqueGlowMaterial);
  top.position.set(x, y + module.plaqueH / 2 + inset, z);
  group.add(top);

  var bottom = top.clone();
  bottom.position.y = y - module.plaqueH / 2 - inset;
  group.add(bottom);

  var left = new THREE.Mesh(new THREE.BoxGeometry(strip, verticalH, 0.008), plaqueGlowMaterial);
  left.position.set(x - module.plaqueW / 2 - inset, y, z);
  group.add(left);

  var right = left.clone();
  right.position.x = x + module.plaqueW / 2 + inset;
  group.add(right);

  var light = new THREE.PointLight(0xffdfad, 0.28 * scale, 1.55 * scale, 2);
  light.position.set(x, y, wallZ + 0.18 * scale);
  light.visible = false;
  group.add(light);

  scene.add(group);
  return { light: light, y: module.plaqueY, range: 4.5 * scale };
}

function generateMarbleTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  // Base off-white color
  ctx.fillStyle = '#f5f3ee';
  ctx.fillRect(0, 0, 512, 512);

  // Subtly blended clouds
  for (let i = 0; i < 12; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    const r = 80 + Math.random() * 120;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, 'rgba(218, 212, 202, 0.18)');
    g.addColorStop(1, 'rgba(218, 212, 202, 0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // Organic grey vein strokes
  function drawVein(x, y, len, angle, alpha) {
    ctx.strokeStyle = `rgba(110, 105, 98, ${alpha})`;
    ctx.lineWidth = 0.6 + Math.random() * 1.2;
    ctx.beginPath();
    ctx.moveTo(x, y);
    let cx = x, cy = y;
    const steps = 30;
    const stepL = len / steps;
    for (let s = 0; s < steps; s++) {
      angle += (Math.random() - 0.5) * 0.45;
      cx += Math.cos(angle) * stepL;
      cy += Math.sin(angle) * stepL;
      ctx.lineTo(cx, cy);
    }
    ctx.stroke();
  }

  for (let i = 0; i < 6; i++) {
    drawVein(Math.random() * 512, Math.random() * 512, 120 + Math.random() * 180, Math.random() * Math.PI * 2, 0.12 + Math.random() * 0.12);
  }

  // Grout lines for 2x2 grid
  ctx.strokeStyle = '#d5d1c4';
  ctx.lineWidth = 2.5;
  ctx.strokeRect(0, 0, 512, 512);
  ctx.beginPath();
  ctx.moveTo(256, 0); ctx.lineTo(256, 512);
  ctx.moveTo(0, 256); ctx.lineTo(512, 256);
  ctx.stroke();

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(6, 6);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function buildFloorAndBaseboard(scene, metrics) {
  const floorY = -114;
  const wallZ = metrics.wallZ;

  // Marble tile floor
  const floorGeo = new THREE.PlaneGeometry(32, 16);
  const floorMat = new THREE.MeshStandardMaterial({
    map: generateMarbleTexture(),
    roughness: 0.22,
    metalness: 0.02,
  });
  const floor = new THREE.Mesh(floorGeo, floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(0, floorY, wallZ - 2);
  scene.add(floor);

  // Baseboard trim positioned just above the floor (e.g. y = -114 + 0.175) at the wall depth
  const trimMaterial = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.82,
    metalness: 0,
  });
  const baseboard = new THREE.Mesh(
    new THREE.BoxGeometry(16, 0.35, 0.08),
    trimMaterial
  );
  baseboard.position.set(0, floorY + 0.175, wallZ + 0.04);
  scene.add(baseboard);
}

export function buildEnvironment(scene, projects, categoryOrder) {
  var layoutResult = buildModuleLayout(projects, categoryOrder);
  var sections = layoutResult.sections;
  var modules = layoutResult.modules;
  var metrics = layoutResult.metrics;
  var localLights = [];

  // Add baseboard and marble floor at the bottom of the scroll
  buildFloorAndBaseboard(scene, metrics);

  addWallBounds(scene);

  for (var s = 0; s < sections.length; s++) {
    var section = sections[s];

    var label = makeSectionPlaque(section.category, section.scale);
    label.position.set(section.labelX, section.labelY, metrics.wallZ + 0.1);
    scene.add(label);
    localLights.push(addSectionLamp(scene, section, metrics));
  }

  // Light bars at section boundaries — placed at each section's
  // wall-top so they sit on the seam between wall tiles, with the
  // section heading (padding → lamp → plaque) unfolding below the bar.
  for (var s = 1; s < sections.length; s++) {
    var section = sections[s];
    var barLights = addScreenWideLightBar(
      scene,
      section.wallTopY + SCREEN_LIGHT_BAR_Y_OFFSET * section.scale,
      section.scale,
      metrics,
      section.category.toLowerCase().replace(/\s+/g, '-'),
    );
    for (var bl = 0; bl < barLights.length; bl++) {
      localLights.push(barLights[bl]);
    }
  }

  for (var m = 0; m < modules.length; m++) {
    var mod = modules[m];
    localLights.push(addLamp(scene, mod));
    localLights.push(addPlaqueCameraLight(scene, mod, metrics));
  }

  return {
    update: function(cameraY) {
      for (var li = 0; li < localLights.length; li++) {
        var item = localLights[li];
        item.light.visible = Math.abs(item.y - cameraY) < item.range;
      }
    },
  };
}
