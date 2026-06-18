// environment.js - Vertical white museum wall labels and overhead lamps.

import * as THREE from 'three';
import {
  buildModuleLayout,
  getLayoutMetrics,
  SECTION_LAMP_PLAQUE_TOP_OFFSET,
  WALL_WIDTH,
  WALL_HEIGHT,
  WALL_Y_CENTER,
  WALL_THICKNESS,
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

function generateBrickTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#b25d48';
  ctx.fillRect(0, 0, 512, 512);

  const rows = 8;
  const rowHeight = 512 / rows;

  for (let r = 0; r < rows; r++) {
    const y = r * rowHeight;

    ctx.fillStyle = `rgba(${Math.floor(Math.random() * 30 - 15)}, 0, 0, ${0.05 + Math.random() * 0.15})`;
    ctx.fillRect(0, y, 512, rowHeight);

    for (let n = 0; n < 80; n++) {
      const nx = Math.random() * 512;
      const ny = y + Math.random() * rowHeight;
      const nsize = 1 + Math.random() * 1.5;
      ctx.fillStyle = Math.random() < 0.5 ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.08)';
      ctx.fillRect(nx, ny, nsize, nsize);
    }

    // Top highlight (white bevel)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, y + 1.5);
    ctx.lineTo(512, y + 1.5);
    ctx.stroke();

    // Bottom shadow (black bevel)
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.25)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, y + rowHeight - 1.5);
    ctx.lineTo(512, y + rowHeight - 1.5);
    ctx.stroke();
  }

  // Draw horizontal mortar lines
  ctx.strokeStyle = '#dfdcd5';
  ctx.lineWidth = 4;
  for (let r = 0; r <= rows; r++) {
    ctx.beginPath();
    ctx.moveTo(0, r * rowHeight);
    ctx.lineTo(512, r * rowHeight);
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(0.6, 0.6);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function generateDoorWoodTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#412b1a';
  ctx.fillRect(0, 0, 256, 512);

  for (let x = 0; x < canvas.width; x += 2) {
    const wave = Math.sin(x * 0.05) * 5;
    ctx.strokeStyle = `rgba(20, 10, 5, ${0.1 + Math.random() * 0.2})`;
    ctx.lineWidth = 1 + Math.random();
    ctx.beginPath();
    ctx.moveTo(x + wave, 0);
    ctx.lineTo(x + wave, 512);
    ctx.stroke();
  }

  ctx.strokeStyle = '#1d120a';
  ctx.lineWidth = 3;
  ctx.strokeRect(15, 20, 100, 215);
  ctx.strokeRect(141, 20, 100, 215);
  ctx.strokeRect(15, 265, 100, 225);
  ctx.strokeRect(141, 265, 100, 225);

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.07)';
  ctx.strokeRect(16, 21, 98, 213);
  ctx.strokeRect(142, 21, 98, 213);
  ctx.strokeRect(16, 266, 98, 223);
  ctx.strokeRect(142, 266, 98, 223);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function generateSidewalkTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#b0b0b0';
  ctx.fillRect(0, 0, 512, 128);

  for (let i = 0; i < 2000; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 128;
    const size = 1 + Math.random();
    ctx.fillStyle = Math.random() < 0.5 ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)';
    ctx.fillRect(x, y, size, size);
  }

  ctx.strokeStyle = '#808080';
  ctx.lineWidth = 2;
  for (let x = 0; x <= 512; x += 128) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 128);
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.moveTo(0, 127);
  ctx.lineTo(512, 127);
  ctx.stroke();

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(8, 1);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

const pigeonVertexShader = `
varying vec3 vWorldPos;
varying vec3 vLocalPos;
varying vec3 vLocalCamPos;
varying vec3 vLocalFlickerLightPos;
varying vec3 vLocalLampLightPos;

uniform vec3 uWorldFlickerLightPos;
uniform vec3 uWorldLampLightPos;

void main() {
  vLocalPos = position;
  vWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;
  
  // Transform camera and light positions to local space of the pigeon
  mat4 modelMatrixInv = inverse(modelMatrix);
  vLocalCamPos = (modelMatrixInv * vec4(cameraPosition, 1.0)).xyz;
  vLocalFlickerLightPos = (modelMatrixInv * vec4(uWorldFlickerLightPos, 1.0)).xyz;
  vLocalLampLightPos = (modelMatrixInv * vec4(uWorldLampLightPos, 1.0)).xyz;
  
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const pigeonFragmentShader = `
uniform float uTime;
uniform float uIsFlying;
uniform float uFlightProgress;
uniform float uPeckProgress;
uniform float uCooProgress;
uniform vec3 uFlickerLightColor;
uniform vec3 uLampLightColor;

varying vec3 vWorldPos;
varying vec3 vLocalPos;
varying vec3 vLocalCamPos;
varying vec3 vLocalFlickerLightPos;
varying vec3 vLocalLampLightPos;

// Rotation helper
vec2 Rot2(vec2 p, float a) {
  float s = sin(a), c = cos(a);
  return mat2(c, s, -s, c) * p;
}

// Distance estimators
float sdSphere(vec3 p, float r) {
  return length(p) - r;
}

float sdSegment(vec3 p, vec3 a, vec3 b, float r1, float r2) {
  vec3 pa = p - a, ba = b - a;
  float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
  return length(pa - ba * h) - mix(r1, r2, h);
}

float sMin(float a, float b, float k) {
  float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);
  return mix(b, a, h) - k * h * (1.0 - h);
}

// Distance map
float Map(vec3 p) {
  // 1. Flight posture tilt
  p.xy = Rot2(p.xy, -0.15 * uIsFlying);

  // 2. Peck & Coo animations for the Head & Neck
  vec3 headOffset = vec3(0.08, -0.12, 0.0) * uPeckProgress 
                  + vec3(-0.02, -0.04, 0.0) * uCooProgress;
  
  vec3 headPos = vec3(0.10, 0.44, 0.0) + headOffset;
  vec3 neckBase = vec3(0.02, 0.30, 0.0);
  vec3 neckTop = headPos - vec3(0.02, 0.05, 0.0);
  
  float neckR1 = mix(0.07, 0.12, uCooProgress); // base (crop)
  float neckR2 = 0.05;                          // top

  vec3 beakStart = headPos + vec3(0.06, -0.01, 0.0);
  vec3 beakEnd = headPos + vec3(0.12, mix(-0.02, -0.08, uPeckProgress), 0.0);

  // 3. Body Shape
  float dBody = sdSphere(p - vec3(-0.02, 0.28, 0.0), 0.14);
  float dRear = sdSphere(p - vec3(-0.12, 0.24, 0.0), 0.11);
  float dPigeonBody = sMin(dBody, dRear, 0.08);

  // 4. Head and Neck
  float dNeck = sdSegment(p, neckBase, neckTop, neckR1, neckR2);
  float dHead = sdSphere(p - headPos, 0.068);
  float dBeak = sdSegment(p, beakStart, beakEnd, 0.016, 0.005);
  
  // Eyes
  vec3 eyePosL = headPos + vec3(0.03, 0.02, 0.042);
  vec3 eyePosR = headPos + vec3(0.03, 0.02, -0.042);
  float dEyes = min(sdSphere(p - eyePosL, 0.012), sdSphere(p - eyePosR, 0.012));

  float d = sMin(dPigeonBody, dNeck, 0.06);
  d = sMin(d, dHead, 0.04);
  d = min(d, dEyes);
  d = sMin(d, dBeak, 0.01);

  // 5. Wings
  vec3 pivotL = vec3(-0.04, 0.28, 0.09);
  vec3 pivotR = vec3(-0.04, 0.28, -0.09);

  vec3 pL = p - pivotL;
  float flapAngle = mix(0.0, sin(uFlightProgress) * 0.9, uIsFlying);
  flapAngle += (1.0 - uIsFlying) * (sin(uTime * 3.0) * 0.03 + uCooProgress * 0.08);
  
  pL.yz = Rot2(pL.yz, flapAngle);
  float dWingL = sdSegment(pL, vec3(0.0), vec3(-0.16, -0.08, 0.03), 0.045, 0.02);

  vec3 pR = p - pivotR;
  pR.yz = Rot2(pR.yz, -flapAngle);
  float dWingR = sdSegment(pR, vec3(0.0), vec3(-0.16, -0.08, -0.03), 0.045, 0.02);

  d = sMin(d, min(dWingL, dWingR), 0.03);

  // 6. Tail
  vec3 tailEnd = vec3(-0.28, mix(0.18, 0.12, uCooProgress), 0.0);
  float dTail = sdSegment(p, vec3(-0.12, 0.22, 0.0), tailEnd, 0.035, mix(0.045, 0.065, uIsFlying));
  d = sMin(d, dTail, 0.03);

  // 7. Legs & Feet
  vec3 legStartL = vec3(-0.03, 0.18, 0.04);
  vec3 legEndL = mix(vec3(-0.03, 0.02, 0.04), vec3(-0.12, 0.18, 0.03), uIsFlying);
  float dLegL = sdSegment(p, legStartL, legEndL, 0.012, 0.01);
  float dFootL = sdSegment(p, legEndL, legEndL + mix(vec3(0.05, 0.0, 0.0), vec3(0.0), uIsFlying), 0.008, 0.008);

  vec3 legStartR = vec3(-0.03, 0.18, -0.04);
  vec3 legEndR = mix(vec3(-0.03, 0.02, -0.04), vec3(-0.12, 0.18, -0.03), uIsFlying);
  float dLegR = sdSegment(p, legStartR, legEndR, 0.012, 0.01);
  float dFootR = sdSegment(p, legEndR, legEndR + mix(vec3(0.05, 0.0, 0.0), vec3(0.0), uIsFlying), 0.008, 0.008);

  float dLegs = min(min(dLegL, dFootL), min(dLegR, dFootR));
  d = sMin(d, dLegs, 0.015);

  return d;
}

vec3 GetNormal(vec3 p) {
  vec2 eps = vec2(0.001, 0.0);
  return normalize(vec3(
    Map(p + eps.xyy) - Map(p - eps.xyy),
    Map(p + eps.yxy) - Map(p - eps.yxy),
    Map(p + eps.yyx) - Map(p - eps.yyx)
  ));
}

vec3 Colour(vec3 p, vec3 nor, out float spec) {
  spec = 0.0;

  p.xy = Rot2(p.xy, -0.15 * uIsFlying);

  vec3 headOffset = vec3(0.08, -0.12, 0.0) * uPeckProgress 
                  + vec3(-0.02, -0.04, 0.0) * uCooProgress;
  
  vec3 headPos = vec3(0.10, 0.44, 0.0) + headOffset;
  vec3 neckBase = vec3(0.02, 0.30, 0.0);
  vec3 neckTop = headPos - vec3(0.02, 0.05, 0.0);
  float neckR1 = mix(0.07, 0.12, uCooProgress);
  float neckR2 = 0.05;

  vec3 beakStart = headPos + vec3(0.06, -0.01, 0.0);
  vec3 beakEnd = headPos + vec3(0.12, mix(-0.02, -0.08, uPeckProgress), 0.0);

  vec3 pivotL = vec3(-0.04, 0.28, 0.09);
  vec3 pivotR = vec3(-0.04, 0.28, -0.09);

  float flapAngle = mix(0.0, sin(uFlightProgress) * 0.9, uIsFlying);
  flapAngle += (1.0 - uIsFlying) * (sin(uTime * 3.0) * 0.03 + uCooProgress * 0.08);

  vec3 pL = p - pivotL;
  pL.yz = Rot2(pL.yz, flapAngle);
  vec3 pR = p - pivotR;
  pR.yz = Rot2(pR.yz, -flapAngle);

  // Compute distances to components
  float dBody = sMin(sdSphere(p - vec3(-0.02, 0.28, 0.0), 0.14), sdSphere(p - vec3(-0.12, 0.24, 0.0), 0.11), 0.08);
  float dNeck = sdSegment(p, neckBase, neckTop, neckR1, neckR2);
  float dHead = sdSphere(p - headPos, 0.068);
  float dBeak = sdSegment(p, beakStart, beakEnd, 0.016, 0.005);
  
  vec3 eyePosL = headPos + vec3(0.03, 0.02, 0.042);
  vec3 eyePosR = headPos + vec3(0.03, 0.02, -0.042);
  float dEyes = min(sdSphere(p - eyePosL, 0.012), sdSphere(p - eyePosR, 0.012));

  float dWingL = sdSegment(pL, vec3(0.0), vec3(-0.16, -0.08, 0.03), 0.045, 0.02);
  float dWingR = sdSegment(pR, vec3(0.0), vec3(-0.16, -0.08, -0.03), 0.045, 0.02);
  float dWings = min(dWingL, dWingR);

  vec3 tailEnd = vec3(-0.28, mix(0.18, 0.12, uCooProgress), 0.0);
  float dTail = sdSegment(p, vec3(-0.12, 0.22, 0.0), tailEnd, 0.035, mix(0.045, 0.065, uIsFlying));

  vec3 legStartL = vec3(-0.03, 0.18, 0.04);
  vec3 legEndL = mix(vec3(-0.03, 0.02, 0.04), vec3(-0.12, 0.18, 0.03), uIsFlying);
  float dLegL = sdSegment(p, legStartL, legEndL, 0.012, 0.01);
  float dFootL = sdSegment(p, legEndL, legEndL + mix(vec3(0.05, 0.0, 0.0), vec3(0.0), uIsFlying), 0.008, 0.008);

  vec3 legStartR = vec3(-0.03, 0.18, -0.04);
  vec3 legEndR = mix(vec3(-0.03, 0.02, -0.04), vec3(-0.12, 0.18, -0.03), uIsFlying);
  float dLegR = sdSegment(p, legStartR, legEndR, 0.012, 0.01);
  float dFootR = sdSegment(p, legEndR, legEndR + mix(vec3(0.05, 0.0, 0.0), vec3(0.0), uIsFlying), 0.008, 0.008);
  float dLegs = min(min(dLegL, dFootL), min(dLegR, dFootR));

  // Base colors
  vec3 col_body = vec3(0.48, 0.52, 0.56);
  vec3 col_neck = vec3(0.32, 0.42, 0.38);
  vec3 col_head = vec3(0.42, 0.46, 0.50);
  vec3 col_beak = vec3(0.18, 0.16, 0.15);
  vec3 col_cere = vec3(0.85, 0.85, 0.82);
  vec3 col_eyes = vec3(0.9, 0.25, 0.0);
  vec3 col_wings = vec3(0.44, 0.48, 0.52);
  vec3 col_tail = vec3(0.32, 0.35, 0.38);
  vec3 col_legs = vec3(0.85, 0.25, 0.25);

  vec3 mat = col_body;
  float minDist = dBody;
  spec = 0.05;

  if (dNeck < minDist) {
    minDist = dNeck;
    float fresnel = pow(1.0 - max(dot(nor, -normalize(p - vLocalCamPos)), 0.0), 2.5);
    vec3 greenShimmer = vec3(0.0, 0.72, 0.45);
    vec3 purpleShimmer = vec3(0.55, 0.1, 0.65);
    float shimmerBlend = sin(p.y * 30.0 + nor.y * 3.0 + uTime) * 0.5 + 0.5;
    vec3 shimmerColor = mix(greenShimmer, purpleShimmer, shimmerBlend);
    mat = mix(col_neck, shimmerColor, 0.45 + 0.45 * fresnel);
    spec = 0.2;
  }
  if (dHead < minDist) {
    minDist = dHead;
    mat = col_head;
  }
  if (dWings < minDist) {
    minDist = dWings;
    float wingX = (dWingL < dWingR) ? pL.x : pR.x;
    float stripe1 = smoothstep(0.015, 0.0, abs(wingX + 0.06));
    float stripe2 = smoothstep(0.015, 0.0, abs(wingX + 0.11));
    mat = mix(col_wings, vec3(0.18, 0.18, 0.20), max(stripe1, stripe2) * 0.85);
    spec = 0.05;
  }
  if (dTail < minDist) {
    minDist = dTail;
    mat = col_tail;
  }
  if (dBeak < minDist) {
    minDist = dBeak;
    float beakT = clamp(dot(p - beakStart, beakEnd - beakStart) / dot(beakEnd - beakStart, beakEnd - beakStart), 0.0, 1.0);
    if (beakT < 0.35) {
      mat = col_cere;
    } else {
      mat = col_beak;
    }
    spec = 0.1;
  }
  if (dEyes < minDist) {
    minDist = dEyes;
    if (nor.x > 0.6) {
      mat = vec3(0.0);
      spec = 0.8;
    } else {
      mat = col_eyes;
      spec = 0.5;
    }
  }
  if (dLegs < minDist) {
    minDist = dLegs;
    mat = col_legs;
    spec = 0.1;
  }

  return mat;
}

void main() {
  vec3 ro;
  if (abs(vLocalCamPos.x) < 0.35 && vLocalCamPos.y > 0.0 && vLocalCamPos.y < 0.7 && abs(vLocalCamPos.z) < 0.35) {
    ro = vLocalCamPos;
  } else {
    ro = vLocalPos;
  }
  vec3 rd = normalize(vLocalPos - vLocalCamPos);

  float t = 0.0;
  float d = 999.0;
  vec3 p;
  bool hit = false;
  for (int i = 0; i < 40; i++) {
    p = ro + rd * t;
    if (abs(p.x) > 0.4 || p.y < -0.05 || p.y > 0.75 || abs(p.z) > 0.4) {
      break;
    }
    d = Map(p);
    if (d < 0.001) {
      hit = true;
      break;
    }
    t += d * 0.9;
  }

  if (!hit) {
    discard;
  }

  vec3 pos = ro + rd * t;
  vec3 nor = GetNormal(pos);

  vec3 ambient = vec3(0.08, 0.08, 0.12) * 0.4;
  ambient += vec3(0.12, 0.15, 0.2) * 0.3 * max(nor.y, 0.0);

  vec3 diffuse = vec3(0.0);
  vec3 specularCol = vec3(0.0);
  float specInt = 0.0;
  vec3 alb = Colour(pos, nor, specInt);

  // Flicker light
  vec3 lightDirFlicker = vLocalFlickerLightPos - pos;
  float distFlicker = length(lightDirFlicker);
  lightDirFlicker /= distFlicker;
  float attenFlicker = 1.0 / (1.0 + distFlicker * distFlicker * 0.8);
  float diffFlicker = max(dot(nor, lightDirFlicker), 0.0);
  diffuse += uFlickerLightColor * diffFlicker * attenFlicker;

  vec3 viewDir = -rd;
  vec3 halfDirFlicker = normalize(lightDirFlicker + viewDir);
  float specFlicker = pow(max(dot(nor, halfDirFlicker), 0.0), 32.0);
  specularCol += uFlickerLightColor * specFlicker * specInt * attenFlicker;

  // Lamp light
  vec3 lightDirLamp = vLocalLampLightPos - pos;
  float distLamp = length(lightDirLamp);
  lightDirLamp /= distLamp;
  float attenLamp = 1.0 / (1.0 + distLamp * distLamp * 0.8);
  float diffLamp = max(dot(nor, lightDirLamp), 0.0);
  diffuse += uLampLightColor * diffLamp * attenLamp;

  vec3 halfDirLamp = normalize(lightDirLamp + viewDir);
  float specLamp = pow(max(dot(nor, halfDirLamp), 0.0), 32.0);
  specularCol += uLampLightColor * specLamp * specInt * attenLamp;

  vec3 col = alb * (ambient + diffuse) + specularCol;

  gl_FragColor = vec4(col, 1.0);
}
`;

function createPigeon() {
  const geo = new THREE.BoxGeometry(0.7, 0.7, 0.7);
  geo.translate(0, 0.35, 0);

  const mat = new THREE.ShaderMaterial({
    vertexShader: pigeonVertexShader,
    fragmentShader: pigeonFragmentShader,
    transparent: false,
    uniforms: {
      uTime: { value: 0 },
      uIsFlying: { value: 0 },
      uFlightProgress: { value: 0 },
      uPeckProgress: { value: 0 },
      uCooProgress: { value: 0 },
      uWorldFlickerLightPos: { value: new THREE.Vector3() },
      uFlickerLightColor: { value: new THREE.Vector3() },
      uWorldLampLightPos: { value: new THREE.Vector3() },
      uLampLightColor: { value: new THREE.Vector3() }
    }
  });

  const mesh = new THREE.Mesh(geo, mat);

  mesh.userData = {
    wingAngle: 0,
    isFlying: false,
    speedX: 0,
    speedY: 0,
    speedZ: 0,
    rotSpeed: 0,
    startX: 0,
    startY: 0,
    startZ: 0,
    startRotY: 0,
    // Animation states
    peckProgress: 0,
    peckTimer: 0,
    peckTarget: 0,
    cooProgress: 0,
    cooTimer: 0,
    cooActive: false,
    isFlyingVal: 0
  };

  return mesh;
}

export function buildFloorAndBaseboard(scene, metrics, floorY = -114) {
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

  // Baseboard trim positioned just above the floor (e.g. y = floorY + 0.175) at the wall depth
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

export function buildEnvironment(scene, projects, categoryOrder, camera) {
  var layoutResult = buildModuleLayout(projects, categoryOrder);
  var sections = layoutResult.sections;
  var modules = layoutResult.modules;
  var metrics = layoutResult.metrics;
  var localLights = [];

  var floorY = layoutResult.floorY;

  // Retrieve global lights to drive transition
  const ambientLight = scene.getObjectByName('global-ambient-light');
  const hemiLight = scene.getObjectByName('global-hemi-light');
  const keyLight = scene.getObjectByName('global-key-light');

  // Pre-create color instances to prevent GC collection overhead in animation loop
  const dayBgColor = new THREE.Color(0xf2eee6);
  const nightBgColor = new THREE.Color(0x060713);

  const dayAmbientColor = new THREE.Color(0xfff8ef);
  const nightAmbientColor = new THREE.Color(0x1a2436);

  const dayHemiSkyColor = new THREE.Color(0xffffff);
  const nightHemiSkyColor = new THREE.Color(0x3a4b6e);

  const dayHemiGroundColor = new THREE.Color(0xb8ad9f);
  const nightHemiGroundColor = new THREE.Color(0x0d111a);

  const bulbOnColor = new THREE.Color(0xfff0c0);
  const bulbOffColor = new THREE.Color(0x333333);

  const lanternOnColor = new THREE.Color(0xffe6a3);
  const lanternOffColor = new THREE.Color(0x333333);

  const lastProjY = modules.length > 0 ? modules[modules.length - 1].worldY : 0;
  const transitionStart = lastProjY;
  const transitionEnd = layoutResult.minY;

  // Add baseboard and marble floor at the bottom of the scroll
  buildFloorAndBaseboard(scene, metrics, floorY);

  addWallBounds(scene);

  for (var s = 0; s < sections.length; s++) {
    var section = sections[s];

    var label = makeSectionPlaque(section.category, section.scale);
    label.position.set(section.labelX, section.labelY, metrics.wallZ + 0.1);
    scene.add(label);
    localLights.push(addSectionLamp(scene, section, metrics));
  }

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

  // --- BUILD INTERACTIVE BRICK ENDING SECTION ---
  const endingBrickGroup = new THREE.Group();
  endingBrickGroup.name = 'ending-brick-section';
  scene.add(endingBrickGroup);

  const endingWallHeight = metrics.endingWallHeight || metrics.visibleWallHeight;
  const wallZ = 0;
  const wallFrontZ = metrics.wallZ; // front face of thickness 2.35 is metrics.wallZ = 1.175

  const brickTexture = generateBrickTexture();
  const brickMat = new THREE.MeshStandardMaterial({
    map: brickTexture,
    roughness: 0.82,
    metalness: 0.03,
  });
  brickMat.onBeforeCompile = (shader) => {
    shader.vertexShader = 'varying vec3 vBrickWorldPos;\n' + shader.vertexShader;
    shader.vertexShader = shader.vertexShader.replace(
      '#include <begin_vertex>',
      `
      #include <begin_vertex>
      vBrickWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;
      `
    );
    shader.fragmentShader = 'varying vec3 vBrickWorldPos;\n' + shader.fragmentShader;
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <map_fragment>',
      `
      #ifdef USE_MAP
        vec3 n = abs(normalize(vNormal));
        vec2 uvCoords;
        if (n.z > 0.5) {
          uvCoords = vBrickWorldPos.xy;
        } else if (n.x > 0.5) {
          uvCoords = vec2(vBrickWorldPos.z, vBrickWorldPos.y);
        } else {
          uvCoords = vBrickWorldPos.xz;
        }
        vec4 texelColor = texture2D( map, uvCoords * 0.8 );
        diffuseColor *= texelColor;
      #endif
      `
    );
  };

  const leftWallW = (WALL_WIDTH - 2.2) / 2;
  const leftWall = new THREE.Mesh(
    new THREE.BoxGeometry(leftWallW, endingWallHeight, WALL_THICKNESS),
    brickMat
  );
  leftWall.position.set(-WALL_WIDTH / 2 + leftWallW / 2, floorY + endingWallHeight / 2, wallZ);
  endingBrickGroup.add(leftWall);

  const rightWallW = leftWallW;
  const rightWall = new THREE.Mesh(
    new THREE.BoxGeometry(rightWallW, endingWallHeight, WALL_THICKNESS),
    brickMat
  );
  rightWall.position.set(WALL_WIDTH / 2 - rightWallW / 2, floorY + endingWallHeight / 2, wallZ);
  endingBrickGroup.add(rightWall);

  const doorH = 3.6;
  const headerH = endingWallHeight - doorH;
  if (headerH > 0.05) {
    const topWall = new THREE.Mesh(
      new THREE.BoxGeometry(2.2, headerH, WALL_THICKNESS),
      brickMat
    );
    topWall.position.set(0, floorY + doorH + headerH / 2, wallZ);
    endingBrickGroup.add(topWall);
  }

  const recessBackWall = new THREE.Mesh(
    new THREE.BoxGeometry(2.2, doorH, 0.3),
    brickMat
  );
  recessBackWall.position.set(0, floorY + doorH / 2, wallZ - 0.7 - 0.15);
  endingBrickGroup.add(recessBackWall);

  const leftJamb = new THREE.Mesh(
    new THREE.BoxGeometry(0.1, doorH, 0.7),
    brickMat
  );
  leftJamb.position.set(-1.1 + 0.05, floorY + doorH / 2, wallZ - 0.35);
  const rightJamb = new THREE.Mesh(
    new THREE.BoxGeometry(0.1, doorH, 0.7),
    brickMat
  );
  rightJamb.position.set(1.1 - 0.05, floorY + doorH / 2, wallZ - 0.35);
  endingBrickGroup.add(leftJamb, rightJamb);

  const concreteStepMat = new THREE.MeshStandardMaterial({
    color: 0x8a8a8a,
    roughness: 0.8,
  });
  const stepW = 2.3;
  const stepH = 0.22;
  const stepD = 0.8;
  const step = new THREE.Mesh(
    new THREE.BoxGeometry(stepW, stepH, stepD),
    concreteStepMat
  );
  step.position.set(0, floorY + stepH / 2, wallFrontZ - 0.3);
  endingBrickGroup.add(step);

  const doorW = 2.0;
  const doorHeight = 3.4;
  const doorMat = new THREE.MeshStandardMaterial({
    map: generateDoorWoodTexture(),
    roughness: 0.7,
    metalness: 0.1,
  });
  const door = new THREE.Mesh(
    new THREE.BoxGeometry(doorW, doorHeight, 0.1),
    doorMat
  );
  door.position.set(0, floorY + stepH + doorHeight / 2, wallZ - 0.65);
  endingBrickGroup.add(door);

  const knobMat = new THREE.MeshStandardMaterial({
    color: 0xd4af37,
    roughness: 0.2,
    metalness: 0.8,
  });
  const knob = new THREE.Mesh(
    new THREE.SphereGeometry(0.045, 8, 8),
    knobMat
  );
  knob.position.set(0.75, floorY + stepH + 1.6, wallZ - 0.58);
  endingBrickGroup.add(knob);

  const fixtureGroup = new THREE.Group();
  fixtureGroup.position.set(0, floorY + doorH - 0.05, wallFrontZ);
  const armatureMat = new THREE.MeshStandardMaterial({
    color: 0x111111,
    roughness: 0.5,
    metalness: 0.5,
  });
  const pipe = new THREE.Mesh(
    new THREE.CylinderGeometry(0.02, 0.02, 0.35),
    armatureMat
  );
  pipe.rotation.x = Math.PI / 2;
  pipe.position.set(0, 0, 0.175);
  fixtureGroup.add(pipe);

  const shade = new THREE.Mesh(
    new THREE.CylinderGeometry(0.01, 0.1, 0.12, 12),
    armatureMat
  );
  shade.position.set(0, -0.06, 0.3);
  fixtureGroup.add(shade);

  const bulbMat = new THREE.MeshBasicMaterial({
    color: 0xfff0c0,
  });
  const bulb = new THREE.Mesh(
    new THREE.SphereGeometry(0.04, 8, 8),
    bulbMat
  );
  bulb.position.set(0, -0.12, 0.3);
  fixtureGroup.add(bulb);
  endingBrickGroup.add(fixtureGroup);

  const flickerLight = new THREE.PointLight(0xfff0c0, 2.5, 6.0, 1.4);
  flickerLight.position.set(0, floorY + doorH - 0.17, wallFrontZ + 0.3);
  endingBrickGroup.add(flickerLight);

  const sidewalkW = 32;
  const sidewalkH = 0.15;
  const sidewalkD = 3.5;
  const sidewalkMat = new THREE.MeshStandardMaterial({
    map: generateSidewalkTexture(),
    roughness: 0.85,
  });
  const sidewalk = new THREE.Mesh(
    new THREE.BoxGeometry(sidewalkW, sidewalkH, sidewalkD),
    sidewalkMat
  );
  sidewalk.position.set(0, floorY + sidewalkH / 2, wallFrontZ + sidewalkD / 2);
  endingBrickGroup.add(sidewalk);

  const lampGroup = new THREE.Group();
  lampGroup.position.set(-6.2, floorY + sidewalkH, wallFrontZ + 1.2);
  const lampPostMat = new THREE.MeshStandardMaterial({
    color: 0x2c3e50,
    roughness: 0.5,
    metalness: 0.6,
  });
  const lampBase = new THREE.Mesh(
    new THREE.CylinderGeometry(0.16, 0.16, 0.4, 8),
    lampPostMat
  );
  lampBase.position.y = 0.2;
  lampGroup.add(lampBase);

  const lampPole = new THREE.Mesh(
    new THREE.CylinderGeometry(0.04, 0.04, 3.8, 8),
    lampPostMat
  );
  lampPole.position.y = 0.4 + 1.9;
  lampGroup.add(lampPole);

  const lampArm = new THREE.Mesh(
    new THREE.CylinderGeometry(0.02, 0.02, 0.6, 6),
    lampPostMat
  );
  lampArm.rotation.z = Math.PI / 2;
  lampArm.position.set(0.3, 4.0, 0);
  lampGroup.add(lampArm);

  const lanternHousing = new THREE.Mesh(
    new THREE.CylinderGeometry(0.08, 0.12, 0.25, 6),
    lampPostMat
  );
  lanternHousing.position.set(0.6, 3.9, 0);
  lampGroup.add(lanternHousing);

  const lanternBulbMat = new THREE.MeshBasicMaterial({
    color: 0xffe6a3,
  });
  const lanternBulb = new THREE.Mesh(
    new THREE.SphereGeometry(0.06, 6, 6),
    lanternBulbMat
  );
  lanternBulb.position.set(0.6, 3.75, 0);
  lampGroup.add(lanternBulb);
  endingBrickGroup.add(lampGroup);

  const lampLight = new THREE.PointLight(0xffe6a3, 1.8, 6.0, 1.3);
  lampLight.position.set(-6.2 + 0.6, floorY + sidewalkH + 3.7, wallFrontZ + 1.2);
  endingBrickGroup.add(lampLight);

  const binGroup = new THREE.Group();
  binGroup.position.set(5.8, floorY + sidewalkH, wallFrontZ + 1.5);
  const binMat = new THREE.MeshStandardMaterial({
    color: 0x7f8c8d,
    roughness: 0.4,
    metalness: 0.8,
  });
  const binBody = new THREE.Mesh(
    new THREE.CylinderGeometry(0.25, 0.22, 0.72, 12),
    binMat
  );
  binBody.position.y = 0.36;
  binGroup.add(binBody);

  const binLid = new THREE.Mesh(
    new THREE.CylinderGeometry(0.27, 0.27, 0.05, 12),
    binMat
  );
  binLid.position.y = 0.72 + 0.025;
  binGroup.add(binLid);

  const binHandleGeo = new THREE.BoxGeometry(0.12, 0.02, 0.02);
  const binHandle = new THREE.Mesh(binHandleGeo, binMat);
  binHandle.position.set(0, 0.72 + 0.05 + 0.02, 0);
  binGroup.add(binHandle);
  endingBrickGroup.add(binGroup);

  const pigeons = [];
  const pigeonCount = 5;
  const pigeonsGroup = new THREE.Group();
  pigeonsGroup.name = 'pigeons-group';
  endingBrickGroup.add(pigeonsGroup);

  for (let i = 0; i < pigeonCount; i++) {
    const pigeon = createPigeon();
    const rx = (Math.random() - 0.5) * 5.0;
    const rz = wallFrontZ + 0.7 + Math.random() * 2.1;
    const ry = floorY + sidewalkH;
    const rotY = Math.random() * Math.PI * 2;

    pigeon.position.set(rx, ry, rz);
    pigeon.rotation.y = rotY;

    pigeon.userData.startX = rx;
    pigeon.userData.startY = ry;
    pigeon.userData.startZ = rz;
    pigeon.userData.startRotY = rotY;

    pigeonsGroup.add(pigeon);
    pigeons.push(pigeon);
  }

  let pigeonsFlying = false;
  let pigeonsFlightTimer = 0;
  let flickerTimer = 0;

  function triggerPigeonFlyAway() {
    if (pigeonsFlying) return;
    pigeonsFlying = true;
    pigeonsFlightTimer = 0;

    for (let i = 0; i < pigeons.length; i++) {
      const pigeon = pigeons[i];
      pigeon.userData.isFlying = true;
      pigeon.userData.speedY = 3.5 + Math.random() * 1.5;
      pigeon.userData.speedX = (Math.random() - 0.5) * 2.8;
      pigeon.userData.speedZ = (Math.random() * 2.2 + 1.2);
      pigeon.userData.rotSpeed = (Math.random() - 0.5) * 3;
    }
  }

  function resetPigeons() {
    pigeonsFlying = false;
    for (let i = 0; i < pigeons.length; i++) {
      const pigeon = pigeons[i];
      pigeon.position.set(pigeon.userData.startX, pigeon.userData.startY, pigeon.userData.startZ);
      pigeon.rotation.set(0, pigeon.userData.startRotY, 0);
      pigeon.scale.set(1, 1, 1);
      pigeon.visible = true;
      pigeon.userData.isFlying = false;

      // Reset animation variables in userData
      pigeon.userData.peckProgress = 0;
      pigeon.userData.peckTimer = 0;
      pigeon.userData.peckTarget = 0;
      pigeon.userData.cooProgress = 0;
      pigeon.userData.cooTimer = 0;
      pigeon.userData.cooActive = false;
      pigeon.userData.isFlyingVal = 0;
      pigeon.userData.wingAngle = 0;

      // Reset shader uniforms
      if (pigeon.material && pigeon.material.uniforms) {
        pigeon.material.uniforms.uIsFlying.value = 0.0;
        pigeon.material.uniforms.uFlightProgress.value = 0.0;
        pigeon.material.uniforms.uPeckProgress.value = 0.0;
        pigeon.material.uniforms.uCooProgress.value = 0.0;
      }
    }
  }

  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();

  function onWindowClick(e) {
    if (!camera) return;
    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);

    const intersects = raycaster.intersectObjects([sidewalk, ...pigeons], true);
    if (intersects.length > 0) {
      const hit = intersects[0];
      let clickedPigeon = false;
      for (let i = 0; i < pigeons.length; i++) {
        let node = hit.object;
        while (node) {
          if (node === pigeons[i]) {
            clickedPigeon = true;
            break;
          }
          node = node.parent;
        }
        if (clickedPigeon) break;
      }

      if (clickedPigeon) {
        triggerPigeonFlyAway();
      } else if (hit.object === sidewalk) {
        const hitX = hit.point.x;
        if (Math.abs(hitX) < 4.5) {
          triggerPigeonFlyAway();
        }
      }
    }
  }

  window.addEventListener('click', onWindowClick);

  return {
    update: function(cameraY, dt = 0.016) {
      for (var li = 0; li < localLights.length; li++) {
        var item = localLights[li];
        item.light.visible = Math.abs(item.y - cameraY) < item.range;
      }

      flickerTimer += dt;
      let baseIntensity = 2.5;
      let currentIntensity = baseIntensity;
      if (Math.sin(flickerTimer * 14) > 0.85) {
        currentIntensity = baseIntensity * (0.15 + Math.random() * 0.35);
      } else if (Math.random() < 0.03) {
        currentIntensity = 0;
      } else {
        currentIntensity = baseIntensity * (0.85 + Math.random() * 0.15);
      }

      // Compute transition factor t (1.0 = museum day, 0.0 = street night)
      let t = 1;
      if (cameraY <= transitionEnd) {
        t = 0;
      } else if (cameraY >= transitionStart) {
        t = 1;
      } else {
        t = (cameraY - transitionEnd) / (transitionStart - transitionEnd);
      }

      // Transition background & fog colors
      if (scene.background && scene.background.isColor) {
        scene.background.lerpColors(nightBgColor, dayBgColor, t);
      }
      if (scene.fog && scene.fog.color && scene.fog.color.isColor) {
        scene.fog.color.lerpColors(nightBgColor, dayBgColor, t);
      }

      // Transition global lights
      if (ambientLight) {
        ambientLight.intensity = THREE.MathUtils.lerp(0.04, 0.68, t);
        ambientLight.color.lerpColors(nightAmbientColor, dayAmbientColor, t);
      }
      if (hemiLight) {
        hemiLight.intensity = THREE.MathUtils.lerp(0.02, 0.48, t);
        hemiLight.color.lerpColors(nightHemiSkyColor, dayHemiSkyColor, t);
        hemiLight.groundColor.lerpColors(nightHemiGroundColor, dayHemiGroundColor, t);
      }
      if (keyLight) {
        keyLight.intensity = THREE.MathUtils.lerp(0.0, 0.72, t);
      }

      // Scale street lights to avoid bleeding into the museum
      flickerLight.intensity = currentIntensity * (1 - t);
      if (lampLight) {
        lampLight.intensity = 1.8 * (1 - t);
      }

      // Update bulb material colors (glowing effect)
      if (currentIntensity === 0) {
        bulbMat.color.copy(bulbOffColor);
      } else {
        bulbMat.color.lerpColors(bulbOnColor, bulbOffColor, t);
      }
      if (lanternBulbMat) {
        lanternBulbMat.color.lerpColors(lanternOnColor, lanternOffColor, t);
      }

      // Synchronize flicker light and lamp light properties to all pigeon materials
      pigeons.forEach((pigeon) => {
        if (pigeon.material && pigeon.material.uniforms) {
          pigeon.material.uniforms.uTime.value += dt;
          
          pigeon.material.uniforms.uWorldFlickerLightPos.value.copy(flickerLight.position);
          pigeon.material.uniforms.uFlickerLightColor.value.set(
            flickerLight.color.r * flickerLight.intensity,
            flickerLight.color.g * flickerLight.intensity,
            flickerLight.color.b * flickerLight.intensity
          );

          if (lampLight) {
            pigeon.material.uniforms.uWorldLampLightPos.value.copy(lampLight.position);
            pigeon.material.uniforms.uLampLightColor.value.set(
              lampLight.color.r * lampLight.intensity,
              lampLight.color.g * lampLight.intensity,
              lampLight.color.b * lampLight.intensity
            );
          }
        }
      });

      if (Math.abs(cameraY - layoutResult.minY) < 0.12) {
        triggerPigeonFlyAway();
      }

      if (pigeonsFlying) {
        pigeonsFlightTimer += dt;
        let allGone = true;

        for (let i = 0; i < pigeons.length; i++) {
          const pigeon = pigeons[i];
          if (pigeon.userData.isFlying) {
            allGone = false;
            pigeon.position.y += pigeon.userData.speedY * dt;
            pigeon.position.x += pigeon.userData.speedX * dt;
            pigeon.position.z += pigeon.userData.speedZ * dt;
            pigeon.rotation.y += pigeon.userData.rotSpeed * dt;

            pigeon.userData.wingAngle += 25 * dt;

            if (pigeon.material && pigeon.material.uniforms) {
              pigeon.userData.isFlyingVal = THREE.MathUtils.lerp(pigeon.userData.isFlyingVal, 1.0, 10 * dt);
              pigeon.material.uniforms.uIsFlying.value = pigeon.userData.isFlyingVal;
              pigeon.material.uniforms.uFlightProgress.value = pigeon.userData.wingAngle;
            }

            const currentScale = pigeon.scale.x;
            if (currentScale > 0.01) {
              const nextScale = Math.max(0, currentScale - 0.45 * dt);
              pigeon.scale.set(nextScale, nextScale, nextScale);
            } else {
              pigeon.visible = false;
              pigeon.userData.isFlying = false;
            }
          }
        }

        if (allGone) {
          if (Math.abs(cameraY - layoutResult.minY) > 2.5) {
            resetPigeons();
          }
        }
      } else {
        for (let i = 0; i < pigeons.length; i++) {
          const pigeon = pigeons[i];
          
          if (pigeon.material && pigeon.material.uniforms) {
            pigeon.userData.isFlyingVal = THREE.MathUtils.lerp(pigeon.userData.isFlyingVal, 0.0, 10 * dt);
            pigeon.material.uniforms.uIsFlying.value = pigeon.userData.isFlyingVal;
          }

          // Peck animation state update
          if (pigeon.userData.peckTarget > 0) {
            pigeon.userData.peckTimer += dt * 6.5; // peck speed
            const peckVal = Math.sin(pigeon.userData.peckTimer);
            if (pigeon.userData.peckTimer >= Math.PI) {
              pigeon.userData.peckTarget = 0;
              pigeon.userData.peckTimer = 0;
              pigeon.userData.peckProgress = 0;
            } else {
              pigeon.userData.peckProgress = peckVal;
            }
          } else if (Math.random() < 0.008 && !pigeon.userData.cooActive) {
            pigeon.userData.peckTarget = 1.0;
            pigeon.userData.peckTimer = 0;
          }

          // Coo (chest puffing) animation state update
          if (pigeon.userData.cooActive) {
            pigeon.userData.cooTimer += dt * 2.8; // coo speed
            const cooVal = Math.sin(pigeon.userData.cooTimer);
            if (pigeon.userData.cooTimer >= Math.PI) {
              pigeon.userData.cooActive = false;
              pigeon.userData.cooTimer = 0;
              pigeon.userData.cooProgress = 0;
            } else {
              pigeon.userData.cooProgress = cooVal;
            }
          } else if (Math.random() < 0.003 && pigeon.userData.peckTarget === 0) {
            pigeon.userData.cooActive = true;
            pigeon.userData.cooTimer = 0;
          }

          if (pigeon.material && pigeon.material.uniforms) {
            pigeon.material.uniforms.uPeckProgress.value = pigeon.userData.peckProgress;
            pigeon.material.uniforms.uCooProgress.value = pigeon.userData.cooProgress;
          }
        }
      }
    },
    dispose: function() {
      window.removeEventListener('click', onWindowClick);
    }
  };
}
