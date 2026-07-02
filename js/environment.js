// environment.js - Vertical white museum wall labels and overhead lamps.

import * as THREE from 'three';
import { gsap } from 'gsap';
import {
  buildModuleLayout,
  getLayoutMetrics,
  SECTION_LAMP_PLAQUE_TOP_OFFSET,
  WALL_WIDTH,
  WALL_HEIGHT,
  WALL_Y_CENTER,
  WALL_THICKNESS,
} from './layout.js?v=ending-revamp';

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

const BRICK_WORLD_TEXTURE_SCALE = 0.275;
let endingBrickTexture = null;

// Survive rebuildScene so a resize mid-scene doesn't corrupt the taxi
// choreography: a cab that already sped off must not resurrect and re-park,
// and a bottomed-out visit must still release the cab on scroll-up even if
// the scene was rebuilt in between. Both are cleared by resetTaxi when the
// camera climbs back into the museum.
let taxiHasDeparted = false;
let hasBottomedOut = false;

function generateBrickTexture(renderer) {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;

  const ctx = canvas.getContext('2d');
  const img = ctx.createImageData(canvas.width, canvas.height);
  const data = img.data;
  const width = canvas.width;
  const height = canvas.height;

  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  function fract(value) {
    return value - Math.floor(value);
  }

  function smoothstep(edge0, edge1, value) {
    const t = clamp((value - edge0) / (edge1 - edge0), 0, 1);
    return t * t * (3 - 2 * t);
  }

  function hash3(x, y, z) {
    return fract(123 * Math.sin((x + 1000) * 21.6) * Math.sin((y + 1000) * 43.4) * Math.sin((z + 1000) * 14.5));
  }

  function sdBox(px, py, bx, by) {
    const qx = Math.abs(px) - bx;
    const qy = Math.abs(py) - by;
    const g = Math.max(qx, qy);
    if (g < 0) return g;
    return Math.hypot(Math.max(qx, 0), Math.max(qy, 0));
  }

  function fields(u, v) {
    const cols = 7;
    const rows = 22;
    const x = u * cols;
    const y = v * rows;
    const rowID = Math.floor(y);
    const shiftedX = x + (Math.abs(rowID) % 2) * 0.5;
    const colID = Math.floor(shiftedX);
    let cx = fract(shiftedX) - 0.5;
    let cy = fract(y) - 0.5;

    const h1 = Math.sin(colID * 123.0 + rowID * 924.0);
    const h2 = Math.sin(colID * 462.0 + rowID * 214.9);
    const h3 = Math.sin(colID * 754.0 + rowID * 534.2);
    const h4 = Math.sin(colID * 445.0 + rowID * 736.6);

    cx += 0.012 * h1 * cy + 0.008 * Math.sin(cy * 8 + h2 * 3);
    cy += 0.008 * h2 * cx;

    const bx = 0.430 + 0.024 * Math.abs(h1);
    const by = 0.382 + 0.017 * h3;
    let d = sdBox(cx, cy, bx, by) - 0.038;
    d += (hash3(Math.floor(u * 360), Math.floor(v * 360), h4 * 6) - 0.5) * 0.014;
    const body = smoothstep(0.014, -0.014, d);
    const cap = smoothstep(0, 0.086, -d);
    const pitting = hash3(Math.floor(u * 280), Math.floor(v * 280), h4 * 9);
    const heightValue = body * (0.22 + 0.78 * cap + 0.038 * (pitting - 0.5));

    return {
      body,
      height: clamp(heightValue, 0, 1),
      id: h4,
      dist: d,
      cx,
      cy,
      rowID,
      colID,
      tone: hash3(colID, rowID, 1.7),
      soot: hash3(colID, rowID, 4.1),
    };
  }

  function shade(u, v) {
    const f = fields(u, v);
    const epsU = 2 / width;
    const epsV = 2 / height;
    const hx = fields(u + epsU, v).height;
    const hy = fields(u, v + epsV).height;

    let nx = (f.height - hx) * 5.7;
    let ny = (f.height - hy) * 5.7;
    let nz = 1.0;
    const invLen = 1 / Math.hypot(nx, ny, nz);
    nx *= invLen;
    ny *= invLen;
    nz *= invLen;

    const id = f.id;
    const warm = f.tone;
    const soot = f.soot;
    // Realistic clay brick base tones (terracotta/red-brown range)
    const brickHue = (hash3(f.colID + 17.3, f.rowID + 9.1, id) - 0.5) * 0.11;
    let br = 0.62 + 0.11 * warm + brickHue * 0.8 - 0.07 * soot;
    let bg = 0.27 + 0.09 * warm - brickHue * 0.55 - 0.035 * soot;
    let bb = 0.19 + 0.04 * warm - brickHue * 0.8 - 0.02 * soot;
    // Subtle per-brick brightness & hue micro-variation
    const brickVar = (hash3(f.colID * 3.1, f.rowID * 5.7, id * 2.3) - 0.5) * 0.18;
    br = Math.max(0.32, br + brickVar * 0.6);
    bg = Math.max(0.14, bg + brickVar * 0.35);
    bb = Math.max(0.09, bb + brickVar * 0.18);
    br *= 1 + 0.09 * Math.sin(Math.PI * id);
    bg *= 1 + 0.07 * Math.sin(Math.PI * id + 2);
    bb *= 1 + 0.05 * Math.sin(Math.PI * id + 4);

    const speckle = hash3(Math.floor(u * 720), Math.floor(v * 720), id * 12);
    const pore = hash3(Math.floor(u * 1260), Math.floor(v * 1260), id * 15);
    const grain = hash3(Math.floor(u * 210), Math.floor(v * 210), id * 8);
    const mottle = hash3(Math.floor(u * 32), Math.floor(v * 48), id * 4);
    const brickMottle = 0.82 + 0.11 * speckle + 0.09 * pore + 0.10 * grain + 0.10 * mottle;
    br *= brickMottle;
    bg *= brickMottle;
    bb *= brickMottle;

    if (f.body > 0.5 && hash3(f.colID, f.rowID, 8.3) > 0.62) {
      const crackAngle = (hash3(f.colID, f.rowID, 9.2) - 0.5) * 1.3;
      const crackOffset = (hash3(f.colID, f.rowID, 10.4) - 0.5) * 0.44;
      const crackAxis = Math.cos(crackAngle) * (f.cx - crackOffset) + Math.sin(crackAngle) * f.cy;
      const crackLength = smoothstep(0.34, 0.08, Math.abs(f.cy));
      const crack = smoothstep(0.010, 0.0, Math.abs(crackAxis)) * crackLength;
      br *= 1 - 0.42 * crack;
      bg *= 1 - 0.48 * crack;
      bb *= 1 - 0.52 * crack;
    }

    const mortarNoise = 0.78 + 0.22 * hash3(Math.floor(u * 170), Math.floor(v * 170), 3.1);
    // Pale sandy/gritty mortar
    const mr = 0.62 * mortarNoise;
    const mg = 0.57 * mortarNoise;
    const mb = 0.51 * mortarNoise;

    let r = mr * (1 - f.body) + br * f.body;
    let g = mg * (1 - f.body) + bg * f.body;
    let b = mb * (1 - f.body) + bb * f.body;

    // Subtle vertical rain-wash / soot streaks for realism
    const wash = smoothstep(0.4, 0.95, Math.abs(Math.sin(u * 9.7 + v * 2.3) * 0.5 + (hash3(Math.floor(u*11), Math.floor(v*27), 2.0)-0.5))) * 0.12;
    r *= (1.0 - wash * (1.0 - f.body) * 0.6);
    g *= (1.0 - wash * (1.0 - f.body) * 0.55);
    b *= (1.0 - wash * (1.0 - f.body) * 0.35);

    const lx = 0.28;
    const ly = 0.52;
    const lz = 0.81;
    const lightInv = 1 / Math.hypot(lx, ly, lz);
    const dif = Math.max(0, nx * lx * lightInv + ny * ly * lightInv + nz * lz * lightInv);
    const edge = smoothstep(0, 0.105, -f.dist);
    const edgeAO = 0.68 * (1 - edge) + edge;
    const mortarAO = 0.91 * (1 - f.body) + f.body;
    const light = (0.42 + 1.08 * dif) * edgeAO * mortarAO;

    const spec = Math.pow(Math.max(0, nz), 7) * f.body * Math.max(0, dif - 0.18) * 0.09;
    r = r * light + spec * 0.28 + r * 0.14 * (0.32 + 0.68 * f.height);
    g = g * light + spec * 0.22 + g * 0.15 * (0.32 + 0.68 * f.height);
    b = b * light + spec * 0.16 + b * 0.17 * (0.32 + 0.68 * f.height);

    r = r * 1.65 / (1.03 + r);
    g = g * 1.65 / (1.03 + g);
    b = b * 1.65 / (1.03 + b);

    return [clamp(r, 0, 1), clamp(g, 0, 1), clamp(b, 0, 1)];
  }

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const u = x / width;
      const v = y / height;
      const color = shade(u, v);
      const idx = (y * width + x) * 4;
      data[idx] = Math.round(color[0] * 255);
      data[idx + 1] = Math.round(color[1] * 255);
      data[idx + 2] = Math.round(color[2] * 255);
      data[idx + 3] = 255;
    }
  }

  ctx.putImageData(img, 0, 0);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.colorSpace = THREE.SRGBColorSpace;
  if (renderer?.capabilities?.getMaxAnisotropy) {
    texture.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  }
  return texture;
}

function makeBrickWallMaterial(renderer) {
  if (!endingBrickTexture) endingBrickTexture = generateBrickTexture(renderer);
  const material = new THREE.MeshStandardMaterial({
    map: endingBrickTexture,
    roughness: 0.9,
    metalness: 0.01,
  });

  material.onBeforeCompile = (shader) => {
    shader.vertexShader = [
      'varying vec3 vBrickWorldPos;',
      'varying vec3 vBrickWorldNormal;',
      shader.vertexShader,
    ].join('\n');
    shader.vertexShader = shader.vertexShader.replace(
      '#include <begin_vertex>',
      `
      #include <begin_vertex>
      vBrickWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;
      vBrickWorldNormal = normalize(mat3(modelMatrix) * normal);
      `
    );
    shader.fragmentShader = `
      varying vec3 vBrickWorldPos;
      varying vec3 vBrickWorldNormal;

      const float BRICK_RELIEF_SCALE = ${BRICK_WORLD_TEXTURE_SCALE.toFixed(3)};

      float brickHash(vec2 p) {
        vec3 p3 = fract(vec3(p.xyx) * 0.1031);
        p3 += dot(p3, p3.yzx + 33.33);
        return fract((p3.x + p3.y) * p3.z);
      }

      float brickBox(vec2 p, vec2 b) {
        vec2 q = abs(p) - b;
        return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0);
      }

      float brickHeightField(vec2 uv, out float body, out float edgeDist) {
        vec2 tile = uv * vec2(7.0, 22.0);
        float row = floor(tile.y);
        tile.x += mod(abs(row), 2.0) * 0.5;
        vec2 cell = floor(tile);
        vec2 p = fract(tile) - 0.5;

        float id = brickHash(cell + 2.17);
        p.x += (id - 0.5) * 0.038 * p.y;
        p.y += (brickHash(cell + 8.71) - 0.5) * 0.016 * p.x;

        vec2 halfSize = vec2(
          0.415 + 0.038 * brickHash(cell + 4.33),
          0.362 + 0.027 * brickHash(cell + 1.91)
        );
        edgeDist = brickBox(p, halfSize) - 0.042;
        edgeDist += (brickHash(floor(uv * 410.0) + cell * 0.09) - 0.5) * 0.016;

        body = smoothstep(0.021, -0.021, edgeDist);
        float crown = smoothstep(0.0, 0.16, -edgeDist);
        float grain = brickHash(floor(uv * 980.0) + cell * 0.11);
        float pit = step(0.86, grain) * body * smoothstep(0.09, 0.0, abs(edgeDist));
        float chips = step(0.72, brickHash(floor(uv * 24.0) + cell * 0.37)) *
          smoothstep(-0.006, -0.082, edgeDist) * 0.11;
        // Extra chips & worn rounding for realism
        float wear = brickHash(cell + 11.3) * smoothstep(0.03, -0.05, edgeDist);
        edgeDist += wear * 0.018;

        return clamp(body * (0.11 + 0.89 * crown) - pit * 0.18 - chips, 0.0, 1.0);
      }

      vec2 brickUvFromWorld(vec3 n, vec3 worldPos) {
        vec3 an = abs(normalize(n));
        if (an.z > an.x && an.z > an.y) return worldPos.xy;
        if (an.x > an.y) return vec2(worldPos.z, worldPos.y);
        return worldPos.xz;
      }

      vec2 brickViewShiftFromWorld(vec3 n, vec3 viewDir) {
        vec3 an = abs(normalize(n));
        if (an.z > an.x && an.z > an.y) return vec2(viewDir.x, viewDir.y) * sign(n.z);
        if (an.x > an.y) return vec2(viewDir.z, viewDir.y) * sign(n.x);
        return vec2(viewDir.x, viewDir.z) * sign(n.y);
      }

      vec3 brickNormalFromLocal(vec3 n, vec3 localNormal) {
        vec3 an = abs(normalize(n));
        if (an.z > an.x && an.z > an.y) {
          return normalize(vec3(localNormal.x, localNormal.y, localNormal.z * sign(n.z)));
        }
        if (an.x > an.y) {
          return normalize(vec3(localNormal.z * sign(n.x), localNormal.y, localNormal.x));
        }
        return normalize(vec3(localNormal.x, localNormal.z * sign(n.y), localNormal.y));
      }
    ` + shader.fragmentShader;
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <map_fragment>',
      `
      #ifdef USE_MAP
      {
        vec3 brickWorldNormal = normalize(vBrickWorldNormal);
        vec3 brickViewDir = normalize(cameraPosition - vBrickWorldPos);
        vec2 brickUv = brickUvFromWorld(brickWorldNormal, vBrickWorldPos) * BRICK_RELIEF_SCALE;
        vec2 brickViewShift = brickViewShiftFromWorld(brickWorldNormal, brickViewDir);
        float brickBody;
        float brickEdge;
        float brickH = brickHeightField(brickUv, brickBody, brickEdge);
        float brickGrazing = pow(1.0 - abs(dot(brickWorldNormal, brickViewDir)), 1.65);
        vec2 brickParallaxUv = brickUv + brickViewShift * (brickH - 0.46) * 0.105 * brickGrazing;
        vec4 texelColor = texture2D(map, brickParallaxUv);
        float brickRecess = 1.0 - smoothstep(-0.021, 0.058, brickEdge);
        texelColor.rgb *= 0.73 + 0.27 * brickBody;
        texelColor.rgb *= 0.76 + 0.24 * brickH;
        texelColor.rgb *= 1.0 - brickRecess * 0.26;
        diffuseColor *= texelColor;
      }
      #endif
      `
    );
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <normal_fragment_maps>',
      `
      #include <normal_fragment_maps>
      {
      vec3 brickWorldNormal = normalize(vBrickWorldNormal);
      vec2 brickUv = brickUvFromWorld(brickWorldNormal, vBrickWorldPos) * BRICK_RELIEF_SCALE;
      vec3 brickViewDir = normalize(cameraPosition - vBrickWorldPos);
      vec2 brickViewShift = brickViewShiftFromWorld(brickWorldNormal, brickViewDir);
      float brickBodyCenter;
      float brickEdgeCenter;
      float brickCenterH = brickHeightField(brickUv, brickBodyCenter, brickEdgeCenter);
      float brickGrazing = pow(1.0 - abs(dot(brickWorldNormal, brickViewDir)), 1.65);
      vec2 brickParallaxUv = brickUv + brickViewShift * (brickCenterH - 0.46) * 0.105 * brickGrazing;

      float brickBodyX1;
      float brickEdgeX1;
      float brickBodyX2;
      float brickEdgeX2;
      float brickBodyY1;
      float brickEdgeY1;
      float brickBodyY2;
      float brickEdgeY2;
      const float brickEps = 0.0024;
      float brickHX1 = brickHeightField(brickParallaxUv + vec2(brickEps, 0.0), brickBodyX1, brickEdgeX1);
      float brickHX2 = brickHeightField(brickParallaxUv - vec2(brickEps, 0.0), brickBodyX2, brickEdgeX2);
      float brickHY1 = brickHeightField(brickParallaxUv + vec2(0.0, brickEps), brickBodyY1, brickEdgeY1);
      float brickHY2 = brickHeightField(brickParallaxUv - vec2(0.0, brickEps), brickBodyY2, brickEdgeY2);
      vec3 brickLocalNormal = normalize(vec3(
        (brickHX2 - brickHX1) * 11.0,
        (brickHY2 - brickHY1) * 11.0,
        1.0
      ));
      vec3 brickPerturbedWorld = brickNormalFromLocal(brickWorldNormal, brickLocalNormal);
      normal = normalize(mix(normal, normalize(mat3(viewMatrix) * brickPerturbedWorld), 0.85));
      }
      `
    );
  };

  return material;
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

float Hash31(vec3 p) {
  p = fract(p * 0.1031);
  p += dot(p, p.yzx + 33.33);
  return fract((p.x + p.y) * p.z);
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
  // 1. Stronger flight posture tilt + slight nose down in level flight
  float bodyTilt = -0.22 * uIsFlying + 0.04 * (1.0 - uIsFlying);
  p.xy = Rot2(p.xy, bodyTilt);

  // 2. Peck & Coo animations for the Head & Neck
  vec3 headOffset = vec3(0.09, -0.13, 0.0) * uPeckProgress 
                  + vec3(-0.01, -0.035, 0.0) * uCooProgress;
  // Pull head forward a bit when flying (alert)
  headOffset.x -= 0.035 * uIsFlying;
  
  vec3 headPos = vec3(0.095, 0.45, 0.0) + headOffset;
  vec3 neckBase = vec3(0.01, 0.29, 0.0);
  vec3 neckTop = headPos - vec3(0.015, 0.045, 0.0);
  
  float neckR1 = mix(0.065, 0.115, uCooProgress);
  float neckR2 = 0.048;

  vec3 beakStart = headPos + vec3(0.055, -0.005, 0.0);
  vec3 beakEnd = headPos + vec3(0.115, mix(-0.015, -0.07, uPeckProgress), 0.0);

  // 3. Body Shape - rounder chest, fuller
  float dBody = sdSphere(p - vec3(-0.005, 0.285, 0.0), 0.155);
  float dRear = sdSphere(p - vec3(-0.125, 0.245, 0.0), 0.115);
  float dPigeonBody = sMin(dBody, dRear, 0.09);

  // 4. Head and Neck - slightly smaller head
  float dNeck = sdSegment(p, neckBase, neckTop, neckR1, neckR2);
  float dHead = sdSphere(p - headPos, 0.062);
  float dBeak = sdSegment(p, beakStart, beakEnd, 0.015, 0.0045);
  
  // Eyes - slightly inset
  vec3 eyePosL = headPos + vec3(0.028, 0.018, 0.038);
  vec3 eyePosR = headPos + vec3(0.028, 0.018, -0.038);
  float dEyes = min(sdSphere(p - eyePosL, 0.011), sdSphere(p - eyePosR, 0.011));

  float d = sMin(dPigeonBody, dNeck, 0.055);
  d = sMin(d, dHead, 0.038);
  d = min(d, dEyes);
  d = sMin(d, dBeak, 0.009);

  // 5. Wings (SDF stubs) - longer & broader when flying
  vec3 pivotL = vec3(-0.045, 0.275, 0.095);
  vec3 pivotR = vec3(-0.045, 0.275, -0.095);

  vec3 pL = p - pivotL;
  float flapAngle = mix(0.0, sin(uFlightProgress) * 1.05, uIsFlying);
  flapAngle += (1.0 - uIsFlying) * (sin(uTime * 2.8) * 0.025 + uCooProgress * 0.06);
  float wingLen = mix(0.155, 0.205, uIsFlying);
  pL.yz = Rot2(pL.yz, flapAngle);
  float dWingL = sdSegment(pL, vec3(0.0), vec3(-wingLen, -0.06, 0.022), 0.048, 0.018);

  vec3 pR = p - pivotR;
  pR.yz = Rot2(pR.yz, -flapAngle);
  float dWingR = sdSegment(pR, vec3(0.0), vec3(-wingLen, -0.06, -0.022), 0.048, 0.018);

  d = sMin(d, min(dWingL, dWingR), 0.028);

  // 6. Tail - fan when flying
  float tailFan = mix(0.0, 0.6, uIsFlying);
  vec3 tailEnd = vec3(-0.29, mix(0.175, 0.095, uCooProgress) - tailFan * 0.03, 0.0);
  float tailR2 = mix(0.038, 0.065, uIsFlying);
  float dTail = sdSegment(p, vec3(-0.115, 0.225, 0.0), tailEnd, 0.032, tailR2);
  d = sMin(d, dTail, 0.028);

  // 7. Legs & Feet - tuck tight when flying
  vec3 legStartL = vec3(-0.025, 0.175, 0.04);
  vec3 legEndL = mix(vec3(-0.025, 0.015, 0.038), vec3(-0.135, 0.165, 0.02), uIsFlying);
  float dLegL = sdSegment(p, legStartL, legEndL, 0.011, 0.009);
  vec3 footDirL = mix(vec3(0.055, -0.01, 0.0), vec3(0.0), uIsFlying);
  float dFootL = sdSegment(p, legEndL, legEndL + footDirL, 0.0075, 0.007);

  vec3 legStartR = vec3(-0.025, 0.175, -0.04);
  vec3 legEndR = mix(vec3(-0.025, 0.015, -0.038), vec3(-0.135, 0.165, -0.02), uIsFlying);
  float dLegR = sdSegment(p, legStartR, legEndR, 0.011, 0.009);
  vec3 footDirR = mix(vec3(0.055, -0.01, 0.0), vec3(0.0), uIsFlying);
  float dFootR = sdSegment(p, legEndR, legEndR + footDirR, 0.0075, 0.007);

  float dLegs = min(min(dLegL, dFootL), min(dLegR, dFootR));
  d = sMin(d, dLegs, 0.013);

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

  p.xy = Rot2(p.xy, -0.22 * uIsFlying + 0.04 * (1.0 - uIsFlying));

  vec3 headOffset = vec3(0.09, -0.13, 0.0) * uPeckProgress 
                  + vec3(-0.01, -0.035, 0.0) * uCooProgress;
  headOffset.x -= 0.035 * uIsFlying;

  vec3 headPos = vec3(0.095, 0.45, 0.0) + headOffset;
  vec3 neckBase = vec3(0.01, 0.29, 0.0);
  vec3 neckTop = headPos - vec3(0.015, 0.045, 0.0);
  float neckR1 = mix(0.065, 0.115, uCooProgress);
  float neckR2 = 0.048;

  vec3 beakStart = headPos + vec3(0.055, -0.005, 0.0);
  vec3 beakEnd = headPos + vec3(0.115, mix(-0.015, -0.07, uPeckProgress), 0.0);

  vec3 pivotL = vec3(-0.045, 0.275, 0.095);
  vec3 pivotR = vec3(-0.045, 0.275, -0.095);

  float flapAngle = mix(0.0, sin(uFlightProgress) * 1.05, uIsFlying);
  flapAngle += (1.0 - uIsFlying) * (sin(uTime * 2.8) * 0.025 + uCooProgress * 0.06);

  vec3 pL = p - pivotL;
  pL.yz = Rot2(pL.yz, flapAngle);
  vec3 pR = p - pivotR;
  pR.yz = Rot2(pR.yz, -flapAngle);

  // Compute distances (must match Map)
  float dBody = sMin(sdSphere(p - vec3(-0.005, 0.285, 0.0), 0.155), sdSphere(p - vec3(-0.125, 0.245, 0.0), 0.115), 0.09);
  float dNeck = sdSegment(p, neckBase, neckTop, neckR1, neckR2);
  float dHead = sdSphere(p - headPos, 0.062);
  float dBeak = sdSegment(p, beakStart, beakEnd, 0.015, 0.0045);
  
  vec3 eyePosL = headPos + vec3(0.028, 0.018, 0.038);
  vec3 eyePosR = headPos + vec3(0.028, 0.018, -0.038);
  float dEyes = min(sdSphere(p - eyePosL, 0.011), sdSphere(p - eyePosR, 0.011));

  float wingLenC = mix(0.155, 0.205, uIsFlying);
  float dWingL = sdSegment(pL, vec3(0.0), vec3(-wingLenC, -0.06, 0.022), 0.048, 0.018);
  float dWingR = sdSegment(pR, vec3(0.0), vec3(-wingLenC, -0.06, -0.022), 0.048, 0.018);
  float dWings = min(dWingL, dWingR);

  float tailFanC = mix(0.0, 0.6, uIsFlying);
  vec3 tailEnd = vec3(-0.29, mix(0.175, 0.095, uCooProgress) - tailFanC * 0.03, 0.0);
  float tailR2C = mix(0.038, 0.065, uIsFlying);
  float dTail = sdSegment(p, vec3(-0.115, 0.225, 0.0), tailEnd, 0.032, tailR2C);

  vec3 legStartL = vec3(-0.025, 0.175, 0.04);
  vec3 legEndL = mix(vec3(-0.025, 0.015, 0.038), vec3(-0.135, 0.165, 0.02), uIsFlying);
  float dLegL = sdSegment(p, legStartL, legEndL, 0.011, 0.009);
  vec3 footDirL = mix(vec3(0.055, -0.01, 0.0), vec3(0.0), uIsFlying);
  float dFootL = sdSegment(p, legEndL, legEndL + footDirL, 0.0075, 0.007);

  vec3 legStartR = vec3(-0.025, 0.175, -0.04);
  vec3 legEndR = mix(vec3(-0.025, 0.015, -0.038), vec3(-0.135, 0.165, -0.02), uIsFlying);
  float dLegR = sdSegment(p, legStartR, legEndR, 0.011, 0.009);
  vec3 footDirR = mix(vec3(0.055, -0.01, 0.0), vec3(0.0), uIsFlying);
  float dFootR = sdSegment(p, legEndR, legEndR + footDirR, 0.0075, 0.007);
  float dLegs = min(min(dLegL, dFootL), min(dLegR, dFootR));

  // More realistic urban pigeon palette
  vec3 col_body = vec3(0.47, 0.49, 0.525);
  vec3 col_neck = vec3(0.22, 0.31, 0.29);
  vec3 col_head = vec3(0.28, 0.305, 0.34);
  vec3 col_beak = vec3(0.20, 0.175, 0.155);
  vec3 col_cere = vec3(0.82, 0.80, 0.76);
  vec3 col_eyes = vec3(0.88, 0.22, 0.05);
  vec3 col_wings = vec3(0.52, 0.545, 0.57);
  vec3 col_tail = vec3(0.195, 0.21, 0.245);
  vec3 col_legs = vec3(0.82, 0.24, 0.19);

  vec3 mat = col_body;
  float minDist = dBody;
  spec = 0.05;

  if (dNeck < minDist) {
    minDist = dNeck;
    float fresnel = pow(1.0 - max(dot(nor, -normalize(p - vLocalCamPos)), 0.0), 2.65);
    vec3 greenShimmer = vec3(0.02, 0.68, 0.48);
    vec3 purpleShimmer = vec3(0.58, 0.12, 0.68);
    float shimmerBlend = sin(p.y * 34.0 + nor.y * 4.0 + uTime * 1.3) * 0.5 + 0.5;
    vec3 shimmerColor = mix(greenShimmer, purpleShimmer, shimmerBlend);
    mat = mix(col_neck, shimmerColor, 0.42 + 0.48 * fresnel);
    spec = 0.22;
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
    float featherBands = smoothstep(0.018, 0.0, abs(sin((wingX + 0.19) * 78.0)) * 0.015);
    mat = mix(col_wings, vec3(0.17, 0.17, 0.19), max(stripe1, stripe2) * 0.9);
    mat = mix(mat, mat * 0.72, featherBands * 0.24);
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

  if (minDist != dEyes && minDist != dBeak && minDist != dLegs) {
    float featherNoise = Hash31(floor((p + vec3(0.31, 0.0, 0.17)) * 64.0));
    float fineBars = smoothstep(0.95, 1.0, sin((p.x + p.y * 0.32) * 61.0) * 0.5 + 0.5);
    mat *= 0.89 + featherNoise * 0.18;
    mat = mix(mat, mat * 0.76, fineBars * 0.11);
    // Subtle darker wing leading edge
    if (dWings < minDist + 0.01) {
      float lead = smoothstep(0.0, -0.09, pL.x);
      mat = mix(mat, mat * 0.88, lead * 0.55);
    }
  }

  return mat;
}

void main() {
  vec3 ro;
  if (abs(vLocalCamPos.x) < 0.42 && vLocalCamPos.y > 0.0 && vLocalCamPos.y < 0.78 && abs(vLocalCamPos.z) < 0.42) {
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
    if (abs(p.x) > 0.48 || p.y < -0.08 || p.y > 0.82 || abs(p.z) > 0.48) {
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

function createPigeonWing(side) {
  const wingGroup = new THREE.Group();
  wingGroup.position.set(-0.055, 0.295, side * 0.16);
  wingGroup.rotation.y = side * 0.09;

  const wingGeo = new THREE.BufferGeometry();
  // Improved realistic pigeon wing planform (root wide, tapering primaries)
  wingGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array([
    0.01, 0.01, 0,
    -0.07, 0.09, 0,
    -0.31, 0.065, 0,
    -0.38, 0.005, 0,
    -0.34, -0.045, 0,
    -0.19, -0.075, 0,
    -0.04, -0.055, 0,
  ]), 3));
  wingGeo.setIndex([0, 1, 2, 0, 2, 3, 0, 3, 4, 0, 4, 5, 0, 5, 6]);
  wingGeo.computeVertexNormals();

  const wingMat = new THREE.MeshStandardMaterial({
    color: 0x4b535e,
    roughness: 0.82,
    metalness: 0.01,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.97,
    depthWrite: false,
    depthTest: true,
  });
  const wing = new THREE.Mesh(wingGeo, wingMat);
  wing.renderOrder = 8;
  wingGroup.add(wing);

  const stripeMat = new THREE.LineBasicMaterial({
    color: 0x25282d,
    transparent: true,
    opacity: 0.72,
    depthWrite: false,
    depthTest: true,
  });
  const stripeGeo = new THREE.BufferGeometry();
  stripeGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array([
    -0.09, 0.055, 0.004, -0.29, 0.01, 0.004,
    -0.14, 0.065, 0.004, -0.34, 0.025, 0.004,
    -0.20, 0.05, 0.004, -0.36, -0.01, 0.004,
    -0.26, 0.03, 0.004, -0.355, -0.025, 0.004,
  ]), 3));
  const stripes = new THREE.LineSegments(stripeGeo, stripeMat);
  stripes.renderOrder = 9;
  wingGroup.add(stripes);

  return wingGroup;
}

function updatePigeonWings(pigeon, flightAmount, beat, time) {
  const leftWing = pigeon.userData.leftWing;
  const rightWing = pigeon.userData.rightWing;
  if (!leftWing || !rightWing) return;

  // More realistic flap: strong downstroke, relaxed upstroke (biased sin)
  const s = Math.sin(beat);
  const c = Math.cos(beat);
  const flapPower = s * 1.05 + 0.18 * Math.max(0, s) + c * 0.09; // emphasis on down
  const idle = Math.sin(time * 3.7 + pigeon.userData.flightPhase) * 0.035;

  const spreadBase = THREE.MathUtils.lerp(0.64, 1.0, flightAmount);
  // Fold wings slightly on upstroke for realism
  const phaseFold = (1.0 - Math.max(0.0, Math.sin(beat + 0.6))) * 0.14;
  const spread = spreadBase * (1.0 - phaseFold * flightAmount);

  const sweepIdle = 0.06;
  const sweep = THREE.MathUtils.lerp(sweepIdle, -0.18, flightAmount) + Math.sin(beat * 0.6) * 0.05 * flightAmount;
  const lift = THREE.MathUtils.lerp(idle, flapPower, flightAmount);

  const dihedral = -0.14 * flightAmount;
  const rollExtra = -0.07 * flightAmount;

  leftWing.visible = flightAmount > 0.015 || Math.abs(idle) > 0.012;
  rightWing.visible = leftWing.visible;
  leftWing.rotation.set(lift * 0.95, sweep, dihedral - rollExtra);
  rightWing.rotation.set(-lift * 0.95, -sweep, -dihedral + rollExtra);
  leftWing.scale.setScalar(spread);
  rightWing.scale.setScalar(spread);
}

function createPigeon() {
  const geo = new THREE.BoxGeometry(0.82, 0.82, 0.82);
  geo.translate(0, 0.38, 0);

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
  const leftWing = createPigeonWing(1);
  const rightWing = createPigeonWing(-1);
  mesh.add(leftWing, rightWing);

  mesh.userData = {
    wingAngle: 0,
    isFlying: false,
    startX: 0,
    startY: 0,
    startZ: 0,
    startRotY: 0,
    flightAge: 0,
    flightDelay: 0,
    flightDuration: 0,
    flightDirX: 0,
    flightDirZ: 1,
    flightDistance: 0,
    flightClimb: 0,
    flightLateral: 0,
    flightBank: 0,
    flightPhase: 0,
    flightYaw: 0,
    // Animation states
    peckProgress: 0,
    peckTimer: 0,
    peckTarget: 0,
    cooProgress: 0,
    cooTimer: 0,
    cooActive: false,
    isFlyingVal: 0,
    leftWing,
    rightWing
  };

  updatePigeonWings(mesh, 0, 0, 0);

  return mesh;
}

const TAXI_SOCIAL_LINKS = [
  { label: 'LINKEDIN', detail: 'william-kei-f', url: 'https://www.linkedin.com/in/william-kei-f', color: '#0a66c2' },
  { label: 'GITHUB', detail: 'Sanokei', url: 'https://github.com/Sanokei', color: '#24292f' },
  { label: 'INSTAGRAM', detail: '@_SanoKei', url: 'https://www.instagram.com/_SanoKei/', color: '#d62976' },
];

function makeTaxiTextTexture(lines, opts = {}) {
  const canvas = document.createElement('canvas');
  canvas.width = opts.width || 512;
  canvas.height = opts.height || 192;
  const ctx = canvas.getContext('2d');
  const bg = opts.bg || '#111111';
  const fg = opts.fg || '#fff7d4';
  const accent = opts.accent || '#f4c400';

  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = accent;
  ctx.lineWidth = 10;
  ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);
  ctx.strokeStyle = 'rgba(255,255,255,0.18)';
  ctx.lineWidth = 2;
  ctx.strokeRect(28, 28, canvas.width - 56, canvas.height - 56);

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = fg;
  ctx.font = '900 54px "Inter", Arial, sans-serif';
  ctx.fillText(lines[0], canvas.width / 2, canvas.height * 0.43);

  if (lines[1]) {
    ctx.fillStyle = '#f4c400';
    ctx.font = '800 30px "Inter", Arial, sans-serif';
    ctx.fillText(lines[1], canvas.width / 2, canvas.height * 0.70);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function makeBrandLogoTexture(link) {
  // Clean, recognizable brand glyph on the company's own color — the lit
  // taxi-top ad reads as logos rather than a wall of text.
  const canvas = document.createElement('canvas');
  canvas.width = 300;
  canvas.height = 240;
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  const cx = w / 2;

  function roundRectPath(x, y, rw, rh, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + rw, y, x + rw, y + rh, r);
    ctx.arcTo(x + rw, y + rh, x, y + rh, r);
    ctx.arcTo(x, y + rh, x, y, r);
    ctx.arcTo(x, y, x + rw, y, r);
    ctx.closePath();
  }

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  if (link.label === 'LINKEDIN') {
    ctx.fillStyle = '#0a66c2';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 150px "Inter", Arial, sans-serif';
    ctx.fillText('in', cx, h * 0.52);
  } else if (link.label === 'GITHUB') {
    ctx.fillStyle = '#1d2127';
    ctx.fillRect(0, 0, w, h);
    // Official octicon mark-github path (16x16 viewBox), scaled up.
    const markPath = new Path2D('M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.012 8.012 0 0016 8c0-4.42-3.58-8-8-8z');
    const markSize = 120;
    ctx.save();
    ctx.translate(cx - markSize / 2, h * 0.42 - markSize / 2);
    ctx.scale(markSize / 16, markSize / 16);
    ctx.fillStyle = '#ffffff';
    ctx.fill(markPath, 'evenodd');
    ctx.restore();
    // wordmark
    ctx.fillStyle = '#ffffff';
    ctx.font = '800 38px "Inter", Arial, sans-serif';
    ctx.fillText('GitHub', cx, h * 0.86);
  } else {
    // Instagram — gradient ground + camera glyph
    const g = ctx.createLinearGradient(0, h, w, 0);
    g.addColorStop(0, '#feda75');
    g.addColorStop(0.3, '#fa7e1e');
    g.addColorStop(0.6, '#d62976');
    g.addColorStop(0.85, '#962fbf');
    g.addColorStop(1, '#4f5bd5');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    const gy = h * 0.5;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 15;
    ctx.lineJoin = 'round';
    roundRectPath(cx - 62, gy - 62, 124, 124, 34);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx, gy, 34, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(cx + 40, gy - 40, 8, 0, Math.PI * 2);
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function createRoofSignGeometry(length, height, depth) {
  const hx = length / 2;
  const hz = depth / 2;
  const vertices = new Float32Array([
    -hx, 0, hz,
     hx, 0, hz,
    -hx, 0, -hz,
     hx, 0, -hz,
    -hx, height, 0,
     hx, height, 0,
  ]);
  const indices = [
    0, 1, 5, 0, 5, 4,
    3, 2, 4, 3, 4, 5,
    2, 3, 1, 2, 1, 0,
    0, 4, 2,
    1, 3, 5,
  ];
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function createTaxi(scale = 1) {
  const group = new THREE.Group();
  group.name = 'nyc-taxi-social-links';

  const clickableMeshes = [];
  const wheels = [];
  // Items that brighten as the scene turns to night (n: 0 day -> 1 night).
  const nightLights = [];     // { light, night }       — PointLight intensity
  const nightEmissives = [];  // { mat, day, night }     — emissiveIntensity
  const nightGlows = [];      // { mat, day, night }     — additive halo opacity

  // Modest shared material set for the whole cab
  const taxiYellow = new THREE.MeshStandardMaterial({ color: 0xf6c000, roughness: 0.4, metalness: 0.12 });
  const taxiDarkYellow = new THREE.MeshStandardMaterial({ color: 0xcf9400, roughness: 0.55, metalness: 0.08 });
  const glassMat = new THREE.MeshStandardMaterial({ color: 0x16212e, roughness: 0.12, metalness: 0.22, transparent: true, opacity: 0.84, side: THREE.DoubleSide });
  const blackMat = new THREE.MeshStandardMaterial({ color: 0x0e0e0e, roughness: 0.55, metalness: 0.16 });
  const chromeMat = new THREE.MeshStandardMaterial({ color: 0xd6d9dc, roughness: 0.22, metalness: 0.92 });
  const tireMat = new THREE.MeshStandardMaterial({ color: 0x080808, roughness: 0.88, metalness: 0.02 });
  const hubMat = new THREE.MeshStandardMaterial({ color: 0xcfd2d6, roughness: 0.3, metalness: 0.72 });
  const lightMat = new THREE.MeshStandardMaterial({ color: 0xfff6c8, emissive: 0xfff0b0, emissiveIntensity: 0.2, roughness: 0.3, metalness: 0.1 });
  const tailLightMat = new THREE.MeshStandardMaterial({ color: 0xc01d15, emissive: 0xff2a18, emissiveIntensity: 0.2, roughness: 0.35, metalness: 0.1 });
  nightEmissives.push({ mat: lightMat, day: 0.2, night: 1.5 });
  nightEmissives.push({ mat: tailLightMat, day: 0.2, night: 1.4 });
  const glowDiscMat = (hex) => new THREE.MeshBasicMaterial({
    color: hex, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false,
  });

  const bodyWidth = 1.06;
  const halfW = bodyWidth / 2;

  // --- Lower body hull: a rounded, beveled side-profile extruded across the width ---
  // -X end is the front (headlights / grille), +X end is the rear (tail lights).
  const hull = new THREE.Shape();
  hull.moveTo(-1.54, 0.34);   // front lower
  hull.lineTo( 1.56, 0.34);   // rocker to the rear
  hull.lineTo( 1.62, 0.46);   // rear bumper height
  hull.lineTo( 1.58, 0.58);
  hull.lineTo( 1.38, 0.66);   // trunk lid
  hull.lineTo( 0.92, 0.70);   // rear deck / beltline
  hull.lineTo(-0.66, 0.70);   // cowl (windshield base)
  hull.lineTo(-1.06, 0.62);   // hood sloping down
  hull.lineTo(-1.50, 0.60);   // front fender top
  hull.lineTo(-1.62, 0.48);   // nose
  hull.closePath();

  const hullDepth = bodyWidth - 0.12;
  const hullGeo = new THREE.ExtrudeGeometry(hull, {
    depth: hullDepth, bevelEnabled: true, bevelThickness: 0.06, bevelSize: 0.06, bevelSegments: 2, steps: 1,
  });
  hullGeo.translate(0, 0, -hullDepth / 2);
  group.add(new THREE.Mesh(hullGeo, taxiYellow));

  // Dark rocker / valance grounding the silhouette
  const valance = new THREE.Mesh(new THREE.BoxGeometry(3.0, 0.12, bodyWidth - 0.02), taxiDarkYellow);
  valance.position.set(0.0, 0.30, 0);
  group.add(valance);

  // --- Greenhouse / cabin: narrower beveled trapezoid (raked A & C pillars, rounded roof) ---
  const cabinWidth = 0.92;
  const cabin = new THREE.Shape();
  cabin.moveTo(-0.62, 0.70);  // windshield base
  cabin.lineTo( 0.90, 0.70);  // rear-window base
  cabin.lineTo( 0.58, 1.10);  // roof rear
  cabin.lineTo(-0.26, 1.10);  // roof front
  cabin.closePath();
  const cabinDepth = cabinWidth - 0.08;
  const cabinGeo = new THREE.ExtrudeGeometry(cabin, {
    depth: cabinDepth, bevelEnabled: true, bevelThickness: 0.05, bevelSize: 0.05, bevelSegments: 2, steps: 1,
  });
  cabinGeo.translate(0, 0, -cabinDepth / 2);
  group.add(new THREE.Mesh(cabinGeo, taxiYellow));
  const roofTop = 1.10 + 0.05; // rounded roof apex incl. bevel

  // Sloped windshield + rear glass. The cabin bevel bulges the extruded
  // profile 0.05 outward, so the glass sits lifted along each face normal
  // rather than centered on the shape outline (which would bury it).
  const windshield = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.03, 0.86), glassMat);
  windshield.position.set(-0.496, 0.95, 0);
  windshield.rotation.z = Math.atan2(1.10 - 0.70, -0.26 - (-0.62));
  group.add(windshield);

  const rearGlass = new THREE.Mesh(new THREE.BoxGeometry(0.50, 0.03, 0.84), glassMat);
  rearGlass.position.set(0.80, 0.95, 0);
  rearGlass.rotation.z = Math.atan2(0.70 - 1.10, 0.90 - 0.58);
  group.add(rearGlass);

  // Side glass on both flanks, split by a B-pillar. Trapezoids that follow
  // the raked A/C pillars so the panes stay inside the cabin silhouette.
  const glassZ = cabinDepth / 2 + 0.05 + 0.002; // just proud of the flank cap
  const frontWinShape = new THREE.Shape();
  frontWinShape.moveTo(-0.505, 0.75);
  frontWinShape.lineTo(0.10, 0.75);
  frontWinShape.lineTo(0.10, 1.05);
  frontWinShape.lineTo(-0.235, 1.05);
  frontWinShape.closePath();
  const rearWinShape = new THREE.Shape();
  rearWinShape.moveTo(0.16, 0.75);
  rearWinShape.lineTo(0.79, 0.75);
  rearWinShape.lineTo(0.55, 1.05);
  rearWinShape.lineTo(0.16, 1.05);
  rearWinShape.closePath();
  const frontWinGeo = new THREE.ShapeGeometry(frontWinShape);
  const rearWinGeo = new THREE.ShapeGeometry(rearWinShape);
  for (const zs of [1, -1]) {
    const frontWin = new THREE.Mesh(frontWinGeo, glassMat);
    frontWin.position.z = zs * glassZ;
    group.add(frontWin);
    const rearWin = new THREE.Mesh(rearWinGeo, glassMat);
    rearWin.position.z = zs * glassZ;
    group.add(rearWin);
    const bPillar = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.34, 0.03), blackMat);
    bPillar.position.set(0.13, 0.90, zs * glassZ);
    group.add(bPillar);
  }

  // Thin chrome beltline trim down each flank
  for (const zs of [1, -1]) {
    const trim = new THREE.Mesh(new THREE.BoxGeometry(2.9, 0.03, 0.02), chromeMat);
    trim.position.set(0.0, 0.665, zs * (halfW + 0.01));
    group.add(trim);
  }

  // Iconic checker band + TAXI door text on the camera-facing (+Z) flank
  const checkerGroup = new THREE.Group();
  checkerGroup.position.set(-0.02, 0.60, halfW + 0.02);
  for (let i = 0; i < 18; i++) {
    const square = new THREE.Mesh(new THREE.BoxGeometry(0.075, 0.075, 0.014), i % 2 === 0 ? blackMat : taxiYellow);
    square.position.set(-0.68 + i * 0.08, 0, 0);
    checkerGroup.add(square);
  }
  group.add(checkerGroup);

  const taxiDoorText = new THREE.Mesh(
    new THREE.PlaneGeometry(0.52, 0.18),
    new THREE.MeshBasicMaterial({
      map: makeTaxiTextTexture(['TAXI'], { width: 256, height: 96, bg: '#f4c400', fg: '#111111', accent: '#111111' }),
      transparent: true,
    }),
  );
  taxiDoorText.position.set(0.18, 0.47, halfW + 0.025);
  group.add(taxiDoorText);

  // --- Wheels: inset, with sidewall + chrome hubcap, plus a dark fender arch ---
  const archGeo = new THREE.TorusGeometry(0.30, 0.05, 8, 18, Math.PI); // top-half arch in the XY plane
  for (const wx of [-1.12, 1.12]) {
    for (const zs of [1, -1]) {
      const wheel = new THREE.Group();
      wheel.position.set(wx, 0.24, zs * 0.46);

      const tire = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 0.14, 26), tireMat);
      tire.rotation.x = Math.PI / 2;
      wheel.add(tire);

      const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.135, 0.135, 0.155, 18), hubMat);
      hub.rotation.x = Math.PI / 2;
      wheel.add(hub);

      const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.16, 10), chromeMat);
      cap.rotation.x = Math.PI / 2;
      wheel.add(cap);

      group.add(wheel);
      wheels.push(wheel);

      const arch = new THREE.Mesh(archGeo, blackMat);
      arch.position.set(wx, 0.24, zs * (halfW - 0.01));
      group.add(arch);
    }
  }

  // --- Front grille + chrome bumpers ---
  const frontBumper = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.16, bodyWidth - 0.04), chromeMat);
  frontBumper.position.set(-1.6, 0.42, 0);
  group.add(frontBumper);

  const rearBumper = frontBumper.clone();
  rearBumper.position.x = 1.6;
  group.add(rearBumper);

  const grille = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.18, 0.66), blackMat);
  grille.position.set(-1.555, 0.56, 0);
  group.add(grille);
  for (let i = 0; i < 3; i++) {
    const bar = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.02, 0.6), chromeMat);
    bar.position.set(-1.55, 0.50 + i * 0.06, 0);
    group.add(bar);
  }

  // Round headlights on the -X (leading, left) end, each with a soft additive halo
  for (const zs of [1, -1]) {
    const head = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.05, 16), lightMat);
    head.rotation.z = Math.PI / 2;
    head.position.set(-1.55, 0.56, zs * 0.34);
    group.add(head);

    const haloMat = glowDiscMat(0xfff3c0);
    const halo = new THREE.Mesh(new THREE.CircleGeometry(0.2, 20), haloMat);
    halo.position.set(-1.62, 0.56, zs * 0.34);
    halo.rotation.y = -Math.PI / 2;
    halo.renderOrder = 6;
    group.add(halo);
    nightGlows.push({ mat: haloMat, day: 0.0, night: 0.75 });
  }
  const headBeam = new THREE.PointLight(0xfff2c8, 0, 2.6, 2);
  headBeam.position.set(-1.95, 0.56, 0);
  group.add(headBeam);
  nightLights.push({ light: headBeam, night: 2.2 });

  // Rectangular tail lights on the +X (trailing, right) end, each with a red halo
  for (const zs of [1, -1]) {
    const tail = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.16, 0.18), tailLightMat);
    tail.position.set(1.58, 0.55, zs * 0.36);
    group.add(tail);

    const haloMat = glowDiscMat(0xff2a18);
    const halo = new THREE.Mesh(new THREE.CircleGeometry(0.13, 18), haloMat);
    halo.position.set(1.625, 0.55, zs * 0.36);
    halo.rotation.y = Math.PI / 2;
    halo.renderOrder = 6;
    group.add(halo);
    nightGlows.push({ mat: haloMat, day: 0.0, night: 0.7 });
  }
  const tailBeam = new THREE.PointLight(0xff2a18, 0, 1.7, 2);
  tailBeam.position.set(1.95, 0.55, 0);
  group.add(tailBeam);
  nightLights.push({ light: tailBeam, night: 0.9 });

  // Side mirrors at the A-pillar base: the stalk's inner end embeds in the
  // cabin flank (cap at z ±0.47) so the mirror hangs off the door, attached.
  for (const zs of [1, -1]) {
    const stalk = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.03, 0.14), chromeMat);
    stalk.position.set(-0.50, 0.76, zs * 0.52);
    group.add(stalk);
    const mirror = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.10, 0.05), taxiYellow);
    mirror.position.set(-0.50, 0.79, zs * 0.60);
    group.add(mirror);
  }

  // --- Roof TAXI sign with clickable social-link panels ---
  const signLength = 1.4;
  const signHeight = 0.3;
  const signDepth = 0.48;
  const signCenterX = 0.16; // roof-flat center, so the sign rests symmetrically
  const signBaseY = roofTop - 0.02; // nestle slightly into the rounded roof
  const signBodyMat = new THREE.MeshStandardMaterial({
    color: 0xf4c400, emissive: 0xffcf3a, emissiveIntensity: 0.15, roughness: 0.42, metalness: 0.08,
  });
  nightEmissives.push({ mat: signBodyMat, day: 0.15, night: 0.95 });
  const sign = new THREE.Mesh(
    createRoofSignGeometry(signLength, signHeight, signDepth),
    signBodyMat,
  );
  sign.position.set(signCenterX, signBaseY, 0);
  group.add(sign);

  // The lit ad box throws a little warm light onto the roof.
  const signBeam = new THREE.PointLight(0xffe6a0, 0, 2.8, 2);
  signBeam.position.set(signCenterX, signBaseY + signHeight + 0.12, 0);
  group.add(signBeam);
  nightLights.push({ light: signBeam, night: 1.5 });

  const panelSlope = -Math.atan((signDepth * 0.5) / signHeight);
  const panelHeight = Math.hypot(signHeight, signDepth * 0.5);
  const panelGap = 0.035;
  const panelW = signLength / TAXI_SOCIAL_LINKS.length - panelGap;
  // The panel row spans signLength - panelGap; center it on the sign face
  // instead of flushing it to the left edge.
  const panelRowW = signLength - panelGap;
  // Lift the panels along the sloped face normal so they float evenly
  // proud of the ad space rather than sinking at the top edge.
  const panelLift = 0.012;
  const liftY = panelLift * (signDepth * 0.5) / panelHeight;
  const liftZ = panelLift * signHeight / panelHeight;
  TAXI_SOCIAL_LINKS.forEach((link, index) => {
    const panel = new THREE.Mesh(
      new THREE.PlaneGeometry(panelW, panelHeight * 0.88),
      new THREE.MeshBasicMaterial({
        map: makeBrandLogoTexture(link),
        side: THREE.DoubleSide,
      }),
    );
    panel.position.set(
      signCenterX - panelRowW / 2 + panelW / 2 + index * (panelW + panelGap),
      signBaseY + signHeight * 0.5 + liftY,
      signDepth * 0.25 + liftZ,
    );
    panel.rotation.x = panelSlope;
    panel.userData.socialLink = link;
    panel.renderOrder = 12;
    group.add(panel);
    clickableMeshes.push(panel);
  });

  const rearPanel = new THREE.Mesh(
    new THREE.PlaneGeometry(signLength * 0.92, panelHeight * 0.72),
    new THREE.MeshBasicMaterial({
      map: makeTaxiTextTexture(['SANO KEI', 'PORTFOLIO'], { width: 512, height: 160, bg: '#151515', fg: '#fffdf2', accent: '#f4c400' }),
      side: THREE.DoubleSide,
    }),
  );
  rearPanel.position.set(signCenterX, signBaseY + signHeight * 0.5 + liftY, -(signDepth * 0.25 + liftZ));
  rearPanel.rotation.x = -panelSlope;
  group.add(rearPanel);

  group.scale.setScalar(scale);

  function setNightLevel(n) {
    const k = THREE.MathUtils.clamp(n, 0, 1);
    for (let i = 0; i < nightEmissives.length; i++) {
      const e = nightEmissives[i];
      e.mat.emissiveIntensity = THREE.MathUtils.lerp(e.day, e.night, k);
    }
    for (let i = 0; i < nightGlows.length; i++) {
      const gl = nightGlows[i];
      gl.mat.opacity = THREE.MathUtils.lerp(gl.day, gl.night, k);
    }
    for (let i = 0; i < nightLights.length; i++) {
      nightLights[i].light.intensity = nightLights[i].night * k;
    }
  }

  return { group, clickableMeshes, wheels, setNightLevel };
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

// --- Volumetric night atmosphere (ending section) -------------------------
// Fake volumetrics: an additive open-ended cone under the door fixture with a
// view-angle silhouette falloff (bright looking through the beam core, soft at
// the edges), plus drifting mist banks.
// Everything is faded in by the existing day->night scroll factor.

function makeVolumetricBeamMaterial(colorHex) {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
    uniforms: {
      uColor: { value: new THREE.Color(colorHex) },
      uIntensity: { value: 0 },
      uTime: { value: 0 },
    },
    vertexShader: `
      varying vec2 vUv;
      varying vec3 vWorldPos;
      varying vec3 vWorldNormal;
      void main() {
        vUv = uv;
        vec4 worldPos = modelMatrix * vec4(position, 1.0);
        vWorldPos = worldPos.xyz;
        vWorldNormal = normalize(mat3(modelMatrix) * normal);
        gl_Position = projectionMatrix * viewMatrix * worldPos;
      }
    `,
    fragmentShader: `
      uniform vec3 uColor;
      uniform float uIntensity;
      uniform float uTime;
      varying vec2 vUv;
      varying vec3 vWorldPos;
      varying vec3 vWorldNormal;

      float beamHash(vec2 p) {
        vec3 p3 = fract(vec3(p.xyx) * 0.1031);
        p3 += dot(p3, p3.yzx + 33.33);
        return fract((p3.x + p3.y) * p3.z);
      }

      // Value noise periodic in x so the cylinder's u=0/1 wrap (which faces
      // the camera on these beams) doesn't show a seam.
      float beamNoise(vec2 p, float periodX) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        vec2 u = f * f * (3.0 - 2.0 * f);
        float x0 = mod(i.x, periodX);
        float x1 = mod(i.x + 1.0, periodX);
        return mix(
          mix(beamHash(vec2(x0, i.y)), beamHash(vec2(x1, i.y)), u.x),
          mix(beamHash(vec2(x0, i.y + 1.0)), beamHash(vec2(x1, i.y + 1.0)), u.x),
          u.y
        );
      }

      void main() {
        vec3 viewDir = normalize(cameraPosition - vWorldPos);
        // Silhouette edges of the cone have normals perpendicular to the view
        // ray; fading by the facing term reads as looking through more haze
        // at the beam core than at its rim.
        float facing = abs(dot(normalize(vWorldNormal), viewDir));
        float core = pow(facing, 2.4);
        float groundFade = smoothstep(0.0, 0.42, vUv.y);
        float apexFade = 0.55 + 0.45 * smoothstep(1.0, 0.72, vUv.y);
        float shimmer = 0.82 + 0.18 * beamNoise(vec2(vUv.x * 6.0, vUv.y * 3.0 - uTime * 0.14), 6.0);
        gl_FragColor = vec4(uColor, uIntensity * core * groundFade * apexFade * shimmer);
      }
    `,
  });
}

function addVolumetricBeam(parent, opts) {
  const geometry = new THREE.CylinderGeometry(
    opts.topRadius,
    opts.bottomRadius,
    opts.height,
    24,
    10,
    true,
  );
  const material = makeVolumetricBeamMaterial(opts.color);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(opts.x, opts.topY - opts.height / 2, opts.z);
  mesh.renderOrder = 5;
  mesh.visible = false;
  parent.add(mesh);
  return { mesh, material };
}

function makeMistTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');

  let seed = 4271;
  function rand() {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  }

  // Overlapping soft blobs make an uneven fog bank instead of a clean ellipse.
  for (let i = 0; i < 9; i++) {
    const x = 40 + rand() * (canvas.width - 80);
    const y = canvas.height * (0.45 + rand() * 0.3);
    const r = 50 + rand() * 90;
    const alpha = 0.16 + rand() * 0.2;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(1, 0.38 + rand() * 0.2);
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, r);
    g.addColorStop(0, 'rgba(255,255,255,' + alpha.toFixed(3) + ')');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  return texture;
}

function createRain(parent, opts) {
  const count = opts.count;
  const positions = new Float32Array(count * 6);
  const drops = new Array(count);
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const material = new THREE.LineBasicMaterial({
    color: 0xaebfd9,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const lines = new THREE.LineSegments(geometry, material);
  // Positions sweep the whole alley volume every second — skip culling
  // rather than recompute bounds.
  lines.frustumCulled = false;
  lines.visible = false;
  lines.renderOrder = 7;
  parent.add(lines);

  function respawn(drop, anywhere) {
    drop.x = opts.minX + Math.random() * (opts.maxX - opts.minX);
    drop.z = opts.minZ + Math.random() * (opts.maxZ - opts.minZ);
    drop.y = anywhere
      ? opts.floorY + Math.random() * opts.height
      : opts.floorY + opts.height * (0.92 + Math.random() * 0.08);
    drop.speed = opts.speed * (0.75 + Math.random() * 0.5);
  }
  for (let i = 0; i < count; i++) {
    drops[i] = {};
    respawn(drops[i], true);
  }

  // Streaks lean into the wind by the same ratio the drops travel.
  const slantPerUnit = opts.wind / opts.speed;
  function update(dt) {
    for (let i = 0; i < count; i++) {
      const drop = drops[i];
      drop.y -= drop.speed * dt;
      drop.x += opts.wind * dt;
      if (drop.y < opts.floorY) respawn(drop, false);
      if (drop.x < opts.minX) drop.x += opts.maxX - opts.minX;
      if (drop.x > opts.maxX) drop.x -= opts.maxX - opts.minX;
      const len = opts.streak * (drop.speed / opts.speed);
      const j = i * 6;
      positions[j] = drop.x;
      positions[j + 1] = drop.y;
      positions[j + 2] = drop.z;
      positions[j + 3] = drop.x - slantPerUnit * len;
      positions[j + 4] = drop.y + len;
      positions[j + 5] = drop.z;
    }
    geometry.attributes.position.needsUpdate = true;
  }
  update(0);
  return { lines, material, update };
}

// Rain puddle: irregular noise-masked patch with fresnel sky reflection and
// specular glints from the two street lights, over ripple-ring-perturbed
// normals so falling rain visibly stipples the surface.
function makePuddleMaterial(seed) {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: {
      uTime: { value: 0 },
      uNight: { value: 0 },
      uSeed: { value: seed },
      uSkyColor: { value: new THREE.Color(0x33415e) },
      uLampPos: { value: new THREE.Vector3() },
      uLampColor: { value: new THREE.Color(0xffe6a3) },
      uLampIntensity: { value: 0 },
      uDoorPos: { value: new THREE.Vector3() },
      uDoorColor: { value: new THREE.Color(0xfff0c0) },
      uDoorIntensity: { value: 0 },
    },
    vertexShader: `
      varying vec2 vUv;
      varying vec3 vWorldPos;
      void main() {
        vUv = uv;
        vec4 worldPos = modelMatrix * vec4(position, 1.0);
        vWorldPos = worldPos.xyz;
        gl_Position = projectionMatrix * viewMatrix * worldPos;
      }
    `,
    fragmentShader: `
      uniform float uTime;
      uniform float uNight;
      uniform float uSeed;
      uniform vec3 uSkyColor;
      uniform vec3 uLampPos;
      uniform vec3 uLampColor;
      uniform float uLampIntensity;
      uniform vec3 uDoorPos;
      uniform vec3 uDoorColor;
      uniform float uDoorIntensity;
      varying vec2 vUv;
      varying vec3 vWorldPos;

      float puddleHash(vec2 p) {
        vec3 p3 = fract(vec3(p.xyx) * 0.1031);
        p3 += dot(p3, p3.yzx + 33.33);
        return fract((p3.x + p3.y) * p3.z);
      }

      float puddleNoise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        vec2 u = f * f * (3.0 - 2.0 * f);
        return mix(
          mix(puddleHash(i), puddleHash(i + vec2(1.0, 0.0)), u.x),
          mix(puddleHash(i + vec2(0.0, 1.0)), puddleHash(i + vec2(1.0, 1.0)), u.x),
          u.y
        );
      }

      void main() {
        // Irregular shoreline: noise warps the blob radius.
        vec2 c = vUv - 0.5;
        float edgeNoise = puddleNoise(vUv * 3.0 + uSeed * 17.0) * 0.65 +
          puddleNoise(vUv * 7.0 + uSeed * 9.0) * 0.35;
        float radius = 0.42 + (edgeNoise - 0.5) * 0.2;
        float mask = smoothstep(radius, radius - 0.09, length(c));
        if (mask < 0.004) discard;

        // Raindrop ripples: expanding rings, each respawning at a new random
        // spot every cycle, fading as they widen.
        vec2 grad = vec2(0.0);
        for (int i = 0; i < 4; i++) {
          float fi = float(i);
          float cycle = uTime * (0.55 + 0.2 * puddleHash(vec2(fi, uSeed))) +
            puddleHash(vec2(fi * 3.1, uSeed * 1.7));
          float ph = fract(cycle);
          float gen = floor(cycle);
          vec2 center = vec2(
            0.2 + 0.6 * puddleHash(vec2(fi + gen * 1.7, uSeed)),
            0.2 + 0.6 * puddleHash(vec2(fi + gen * 2.3, uSeed + 4.2))
          );
          float dd = distance(vUv, center) + 1e-4;
          float ring = ph * 0.4;
          float band = smoothstep(0.09, 0.0, abs(dd - ring)) * (1.0 - ph);
          grad += ((vUv - center) / dd) * cos((dd - ring) * 55.0) * band;
        }
        // Wind shiver across the whole surface.
        float w1 = puddleNoise(vUv * 14.0 + vec2(uTime * 0.35, uSeed));
        float w2 = puddleNoise(vUv * 14.0 + vec2(uSeed, uTime * 0.31));
        grad += (vec2(w1, w2) - 0.5) * 0.5;

        vec3 normal = normalize(vec3(-grad.x * 0.3, 1.0, -grad.y * 0.3));
        vec3 viewDir = normalize(cameraPosition - vWorldPos);
        float ndv = clamp(dot(normal, viewDir), 0.0, 1.0);
        float fres = 0.06 + 0.94 * pow(1.0 - ndv, 2.2);

        // Deep water over dark asphalt, sky sheen at grazing angles.
        vec3 col = mix(vec3(0.012, 0.016, 0.028), uSkyColor * 0.55, fres);

        // Specular streaks from the two street lights off the rippled surface.
        vec3 reflected = reflect(-viewDir, normal);
        vec3 toLamp = uLampPos - vWorldPos;
        float lampDist = length(toLamp);
        float lampSpec = pow(max(dot(reflected, toLamp / lampDist), 0.0), 90.0) *
          uLampIntensity / (1.0 + 0.25 * lampDist * lampDist);
        vec3 toDoor = uDoorPos - vWorldPos;
        float doorDist = length(toDoor);
        float doorSpec = pow(max(dot(reflected, toDoor / doorDist), 0.0), 90.0) *
          uDoorIntensity / (1.0 + 0.25 * doorDist * doorDist);
        col += uLampColor * lampSpec * 2.4 + uDoorColor * doorSpec * 2.4;

        gl_FragColor = vec4(col, mask * uNight * (0.62 + 0.38 * fres));
      }
    `,
  });
}

export function buildEnvironment(scene, projects, categoryOrder, camera, renderer) {
  var layoutResult = buildModuleLayout(projects, categoryOrder);
  var sections = layoutResult.sections;
  var modules = layoutResult.modules;
  var metrics = layoutResult.metrics;
  var localLights = [];

  var floorY = layoutResult.floorY;

  // buildEnvironment receives the responsive root group, not the Scene.
  // The group is already attached when this runs, so walk up to the real
  // scene — background, fog, and the global lights live there, not below us.
  let rootScene = scene;
  while (rootScene.parent) rootScene = rootScene.parent;

  // Retrieve global lights to drive transition
  const ambientLight = rootScene.getObjectByName('global-ambient-light');
  const hemiLight = rootScene.getObjectByName('global-hemi-light');
  const keyLight = rootScene.getObjectByName('global-key-light');

  // Pre-create color instances to prevent GC collection overhead in animation loop
  const dayBgColor = new THREE.Color(0xf2eee6);
  const nightBgColor = new THREE.Color(0x020309);

  const dayAmbientColor = new THREE.Color(0xfff8ef);
  const nightAmbientColor = new THREE.Color(0x1a2436);

  const dayHemiSkyColor = new THREE.Color(0xffffff);
  const nightHemiSkyColor = new THREE.Color(0x3a4b6e);

  const dayHemiGroundColor = new THREE.Color(0xb8ad9f);
  const nightHemiGroundColor = new THREE.Color(0x0d111a);

  const bulbOnColor = new THREE.Color(0xfff0c0);
  const bulbOffColor = new THREE.Color(0x333333);


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

  const brickMat = makeBrickWallMaterial(renderer);

  const streetScale = THREE.MathUtils.clamp(endingWallHeight / 4.8, 0.58, 1.0);
  const openingW = THREE.MathUtils.clamp(
    metrics.visibleWallWidth * 0.30,
    1.2 * streetScale,
    2.1 * streetScale,
  );
  const doorH = endingWallHeight * 0.72;
  const leftWallW = (WALL_WIDTH - openingW) / 2;
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

  const headerH = endingWallHeight - doorH;
  if (headerH > 0.05) {
    const topWall = new THREE.Mesh(
      new THREE.BoxGeometry(openingW, headerH, WALL_THICKNESS),
      brickMat
    );
    topWall.position.set(0, floorY + doorH + headerH / 2, wallZ);
    endingBrickGroup.add(topWall);
  }

  // Recessed-entry back wall: brick facing band over a poured-concrete base.
  const recessConcreteMat = new THREE.MeshStandardMaterial({
    color: 0x7e7e78,
    roughness: 0.92,
    metalness: 0.0,
  });
  const recessZ = wallZ - 0.7 - 0.15;
  const recessBrickBandH = Math.min(doorH * 0.2, 0.55 * streetScale);
  const recessConcreteH = doorH - recessBrickBandH;

  const recessBackBrick = new THREE.Mesh(
    new THREE.BoxGeometry(openingW, recessBrickBandH, 0.3),
    brickMat
  );
  recessBackBrick.position.set(0, floorY + doorH - recessBrickBandH / 2, recessZ);
  endingBrickGroup.add(recessBackBrick);

  const recessBackConcrete = new THREE.Mesh(
    new THREE.BoxGeometry(openingW, recessConcreteH, 0.3),
    recessConcreteMat
  );
  recessBackConcrete.position.set(0, floorY + recessConcreteH / 2, recessZ);
  endingBrickGroup.add(recessBackConcrete);

  // Concrete soffit (poured lintel underside) spanning the FULL reveal depth —
  // from the street-facing wall face all the way back to the recessed entry
  // wall — so the overhang reads as concrete to the front instead of bare brick.
  const soffitH = 0.09 * streetScale;
  const overhangFrontZ = wallFrontZ - 0.005;   // flush with the front wall face
  const overhangBackZ = recessZ + 0.15;        // meets the recessed back wall
  const soffitDepth = overhangFrontZ - overhangBackZ;
  const recessSoffit = new THREE.Mesh(
    new THREE.BoxGeometry(openingW, soffitH, soffitDepth),
    recessConcreteMat
  );
  recessSoffit.position.set(
    0,
    floorY + doorH - soffitH / 2,
    (overhangFrontZ + overhangBackZ) / 2,
  );
  endingBrickGroup.add(recessSoffit);

  const leftJamb = new THREE.Mesh(
    new THREE.BoxGeometry(0.11 * streetScale, doorH, 0.7 * streetScale),
    brickMat
  );
  leftJamb.position.set(-openingW / 2 + 0.055 * streetScale, floorY + doorH / 2, wallZ - 0.35 * streetScale);
  const rightJamb = new THREE.Mesh(
    new THREE.BoxGeometry(0.11 * streetScale, doorH, 0.7 * streetScale),
    brickMat
  );
  rightJamb.position.set(openingW / 2 - 0.055 * streetScale, floorY + doorH / 2, wallZ - 0.35 * streetScale);
  endingBrickGroup.add(leftJamb, rightJamb);

  const concreteStepMat = new THREE.MeshStandardMaterial({
    color: 0x8a8a8a,
    roughness: 0.8,
  });
  const sidewalkW = 32;
  const sidewalkH = 0.12 * streetScale;
  const sidewalkD = 1.16 * streetScale;
  const roadH = 0.075 * streetScale;
  const roadD = 2.7 * streetScale;
  const stepW = Math.min(openingW + 0.24 * streetScale, metrics.visibleWallWidth * 0.42);
  const stepH = 0.19 * streetScale;
  const stepD = Math.min(0.62 * streetScale, sidewalkD * 0.78);
  const step = new THREE.Mesh(
    new THREE.BoxGeometry(stepW, stepH, stepD),
    concreteStepMat
  );
  step.position.set(0, floorY + stepH / 2, wallFrontZ + stepD / 2 + 0.02 * streetScale);
  endingBrickGroup.add(step);

  const doorW = openingW - 0.22 * streetScale;
  // Keep the door top a hair below the concrete soffit underside (which sits at
  // floorY + doorH - soffitH) so the door never pokes through the overhang.
  const doorHeight = doorH - stepH - soffitH - 0.03 * streetScale;
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
    new THREE.SphereGeometry(0.045 * streetScale, 8, 8),
    knobMat
  );
  knob.position.set(doorW * 0.34, floorY + stepH + doorHeight * 0.48, wallZ - 0.58);
  endingBrickGroup.add(knob);

  const fixtureGroup = new THREE.Group();
  const fixtureY = floorY + Math.min(doorH + 0.08 * streetScale, endingWallHeight - 0.34 * streetScale);
  fixtureGroup.position.set(0, fixtureY, wallFrontZ);
  const armatureMat = new THREE.MeshStandardMaterial({
    color: 0x111111,
    roughness: 0.5,
    metalness: 0.5,
  });
  const pipe = new THREE.Mesh(
    new THREE.CylinderGeometry(0.018 * streetScale, 0.018 * streetScale, 0.3 * streetScale),
    armatureMat
  );
  pipe.rotation.x = Math.PI / 2;
  pipe.position.set(0, 0, 0.15 * streetScale);
  fixtureGroup.add(pipe);

  const shade = new THREE.Mesh(
    new THREE.CylinderGeometry(0.01 * streetScale, 0.09 * streetScale, 0.11 * streetScale, 12),
    armatureMat
  );
  shade.position.set(0, -0.055 * streetScale, 0.25 * streetScale);
  fixtureGroup.add(shade);

  const bulbMat = new THREE.MeshBasicMaterial({
    color: 0xfff0c0,
  });
  const bulb = new THREE.Mesh(
    new THREE.SphereGeometry(0.036 * streetScale, 8, 8),
    bulbMat
  );
  bulb.position.set(0, -0.11 * streetScale, 0.25 * streetScale);
  fixtureGroup.add(bulb);
  endingBrickGroup.add(fixtureGroup);

  const flickerLight = new THREE.PointLight(0xfff0c0, 2.5, 6.0, 1.4);
  flickerLight.position.set(0, fixtureY - 0.12 * streetScale, wallFrontZ + 0.26 * streetScale);
  endingBrickGroup.add(flickerLight);

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

  const curbMat = new THREE.MeshStandardMaterial({
    color: 0xb6b4aa,
    roughness: 0.74,
    metalness: 0,
  });
  const curb = new THREE.Mesh(
    new THREE.BoxGeometry(sidewalkW, 0.13 * streetScale, 0.12 * streetScale),
    curbMat,
  );
  curb.position.set(0, floorY + 0.065 * streetScale, wallFrontZ + sidewalkD + 0.06 * streetScale);
  endingBrickGroup.add(curb);

  const roadMat = new THREE.MeshStandardMaterial({
    color: 0x1d2022,
    roughness: 0.92,
    metalness: 0,
  });
  const road = new THREE.Mesh(
    new THREE.BoxGeometry(sidewalkW, roadH, roadD),
    roadMat,
  );
  road.position.set(0, floorY + roadH / 2 - 0.018 * streetScale, wallFrontZ + sidewalkD + roadD / 2);
  endingBrickGroup.add(road);

  const laneStripeMat = new THREE.MeshBasicMaterial({ color: 0xf5d65b });
  const laneStripe = new THREE.Mesh(
    new THREE.BoxGeometry(sidewalkW, 0.012 * streetScale, 0.035 * streetScale),
    laneStripeMat,
  );
  laneStripe.position.set(0, floorY + roadH + 0.004 * streetScale, wallFrontZ + sidewalkD + roadD * 0.76);
  endingBrickGroup.add(laneStripe);

  const streetSideX = Math.max(-metrics.visibleWallWidth * 0.46, -4.8);

  const dumpsterGroup = new THREE.Group();
  dumpsterGroup.position.set(streetSideX + 0.2 * streetScale, floorY + sidewalkH, wallFrontZ + sidewalkD * 0.42);
  dumpsterGroup.scale.setScalar(streetScale);
  dumpsterGroup.rotation.y = 0.07;
  const dumpsterBodyMat = new THREE.MeshStandardMaterial({
    color: 0x2f5d43,
    roughness: 0.62,
    metalness: 0.35,
  });
  const dumpsterLidMat = new THREE.MeshStandardMaterial({
    color: 0x24452f,
    roughness: 0.55,
    metalness: 0.4,
  });

  const dumpsterW = 1.5;
  const dumpsterH = 0.78;
  const dumpsterD = 0.66;
  const dumpsterBody = new THREE.Mesh(
    new THREE.BoxGeometry(dumpsterW, dumpsterH, dumpsterD),
    dumpsterBodyMat
  );
  dumpsterBody.position.y = 0.09 + dumpsterH / 2;
  dumpsterGroup.add(dumpsterBody);

  const dumpsterRim = new THREE.Mesh(
    new THREE.BoxGeometry(dumpsterW + 0.05, 0.055, dumpsterD + 0.05),
    dumpsterLidMat
  );
  dumpsterRim.position.y = 0.09 + dumpsterH;
  dumpsterGroup.add(dumpsterRim);

  // Lid hinged at the back edge, propped slightly ajar.
  const dumpsterLidPivot = new THREE.Group();
  dumpsterLidPivot.position.set(0, 0.09 + dumpsterH + 0.055 / 2, -dumpsterD / 2);
  dumpsterLidPivot.rotation.x = 0.2;
  const dumpsterLid = new THREE.Mesh(
    new THREE.BoxGeometry(dumpsterW + 0.03, 0.04, dumpsterD + 0.04),
    dumpsterLidMat
  );
  dumpsterLid.position.z = (dumpsterD + 0.04) / 2;
  dumpsterLidPivot.add(dumpsterLid);
  dumpsterGroup.add(dumpsterLidPivot);

  const dumpsterRibGeo = new THREE.BoxGeometry(0.07, dumpsterH - 0.12, 0.03);
  const dumpsterRibL = new THREE.Mesh(dumpsterRibGeo, dumpsterLidMat);
  dumpsterRibL.position.set(-dumpsterW * 0.24, 0.09 + dumpsterH / 2, dumpsterD / 2 + 0.012);
  const dumpsterRibR = new THREE.Mesh(dumpsterRibGeo, dumpsterLidMat);
  dumpsterRibR.position.set(dumpsterW * 0.24, 0.09 + dumpsterH / 2, dumpsterD / 2 + 0.012);
  dumpsterGroup.add(dumpsterRibL, dumpsterRibR);

  // Fork pockets on the ends.
  const dumpsterPocketGeo = new THREE.BoxGeometry(0.05, 0.13, 0.34);
  const dumpsterPocketL = new THREE.Mesh(dumpsterPocketGeo, dumpsterLidMat);
  dumpsterPocketL.position.set(-dumpsterW / 2 - 0.025, 0.09 + dumpsterH * 0.42, 0);
  const dumpsterPocketR = new THREE.Mesh(dumpsterPocketGeo, dumpsterLidMat);
  dumpsterPocketR.position.set(dumpsterW / 2 + 0.025, 0.09 + dumpsterH * 0.42, 0);
  dumpsterGroup.add(dumpsterPocketL, dumpsterPocketR);

  const dumpsterWheelMat = new THREE.MeshStandardMaterial({
    color: 0x141414,
    roughness: 0.85,
    metalness: 0.1,
  });
  const dumpsterWheelGeo = new THREE.CylinderGeometry(0.065, 0.065, 0.05, 10);
  for (let wx = -1; wx <= 1; wx += 2) {
    for (let wz = -1; wz <= 1; wz += 2) {
      const wheel = new THREE.Mesh(dumpsterWheelGeo, dumpsterWheelMat);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(wx * dumpsterW * 0.38, 0.045, wz * dumpsterD * 0.32);
      dumpsterGroup.add(wheel);
    }
  }

  // Trash bag slumped against the near end.
  const trashBagMat = new THREE.MeshStandardMaterial({
    color: 0x1a1a1e,
    roughness: 0.35,
    metalness: 0.05,
  });
  const trashBag = new THREE.Mesh(new THREE.SphereGeometry(0.19, 10, 8), trashBagMat);
  trashBag.scale.set(1, 0.78, 0.9);
  trashBag.position.set(dumpsterW / 2 + 0.22, 0.15, dumpsterD * 0.22);
  dumpsterGroup.add(trashBag);
  endingBrickGroup.add(dumpsterGroup);

  // --- Volumetric night atmosphere ---
  const streetGroundY = floorY + sidewalkH;
  const doorBeamTopY = fixtureY - 0.13 * streetScale;
  const doorBeam = addVolumetricBeam(endingBrickGroup, {
    color: 0xfff0c0,
    x: 0,
    z: wallFrontZ + 0.25 * streetScale,
    topY: doorBeamTopY,
    height: doorBeamTopY - (floorY + stepH),
    topRadius: 0.05 * streetScale,
    bottomRadius: 0.62 * streetScale,
  });

  const mistTexture = makeMistTexture();
  const mistWidth = Math.max(metrics.visibleWallWidth * 1.35, 8);
  const mistLayers = [];
  // Size the fog banks against the camera's bottom-out height, not raw
  // streetScale — on desktop the camera rests well above the floor, and
  // banks hugging the ground would sit below the frustum entirely
  // (especially the near layers, which are close to the camera).
  const mistEyeSpan = Math.max(layoutResult.minY - streetGroundY, 1.2);
  const mistSpecs = [
    { z: wallFrontZ + sidewalkD * 0.35, h: 0.55, opacity: 0.16, drift: 0.5, phase: 0 },
    { z: wallFrontZ + sidewalkD + roadD * 0.45, h: 0.75, opacity: 0.13, drift: 0.36, phase: 2.1 },
    { z: wallFrontZ + sidewalkD + roadD * 0.9, h: 0.95, opacity: 0.1, drift: 0.27, phase: 4.2 },
  ];
  for (let mi = 0; mi < mistSpecs.length; mi++) {
    const spec = mistSpecs[mi];
    const mistH = spec.h * mistEyeSpan;
    const mist = new THREE.Mesh(
      new THREE.PlaneGeometry(mistWidth, mistH),
      new THREE.MeshBasicMaterial({
        map: mistTexture,
        color: 0x91a7c9,
        transparent: true,
        opacity: 0,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    );
    mist.position.set(0, streetGroundY + mistH * 0.45, spec.z);
    mist.renderOrder = 4;
    mist.visible = false;
    endingBrickGroup.add(mist);
    mistLayers.push({ mesh: mist, baseOpacity: spec.opacity, drift: spec.drift, phase: spec.phase });
  }

  // Rain puddles on the sidewalk and road, biased toward the light pools so
  // the reflections read.
  const roadTopY = floorY + roadH - 0.018 * streetScale;
  const puddleFarX = Math.min(metrics.visibleWallWidth * 0.34, 3.4);
  const puddleSpecs = [
    { x: streetSideX + 0.55 * streetScale, y: streetGroundY, z: wallFrontZ + sidewalkD * 0.5, w: 1.15, d: 0.8 },
    { x: puddleFarX, y: streetGroundY, z: wallFrontZ + sidewalkD * 0.68, w: 0.72, d: 0.5 },
    { x: openingW * 0.85, y: streetGroundY, z: wallFrontZ + sidewalkD * 0.3, w: 0.6, d: 0.42 },
    { x: -1.15 * streetScale, y: roadTopY, z: wallFrontZ + sidewalkD + roadD * 0.42, w: 1.7, d: 1.0 },
    { x: puddleFarX * 0.75, y: roadTopY, z: wallFrontZ + sidewalkD + roadD * 0.68, w: 1.15, d: 0.75 },
  ];
  const puddles = [];
  for (let pi = 0; pi < puddleSpecs.length; pi++) {
    const spec = puddleSpecs[pi];
    const puddleMat = makePuddleMaterial(pi * 7.31 + 2.17);
    puddleMat.uniforms.uDoorPos.value.copy(flickerLight.position);
    const puddle = new THREE.Mesh(
      new THREE.PlaneGeometry(spec.w * streetScale, spec.d * streetScale),
      puddleMat,
    );
    puddle.rotation.x = -Math.PI / 2;
    puddle.position.set(spec.x, spec.y + 0.006, spec.z);
    puddle.renderOrder = 3;
    puddle.visible = false;
    endingBrickGroup.add(puddle);
    puddles.push(puddle);
  }

  const rain = createRain(endingBrickGroup, {
    count: 420,
    minX: -Math.max(metrics.visibleWallWidth * 0.7, 4.5),
    maxX: Math.max(metrics.visibleWallWidth * 0.7, 4.5),
    minZ: wallFrontZ + 0.05,
    maxZ: wallFrontZ + sidewalkD + roadD * 0.95,
    floorY: streetGroundY,
    height: endingWallHeight * 1.05,
    speed: 7 * streetScale,
    wind: 0.8 * streetScale,
    streak: 0.22 * streetScale,
  });

  // Wet-street treatment: as night falls the ground darkens and turns glossy
  // so the street lights sheen off it.
  const dryRoadColor = new THREE.Color(0x1d2022);
  const wetRoadColor = new THREE.Color(0x111417);
  const drySidewalkColor = new THREE.Color(0xffffff);
  const wetSidewalkColor = new THREE.Color(0x767c86);
  const dryCurbColor = new THREE.Color(0xb6b4aa);
  const wetCurbColor = new THREE.Color(0x686b70);

  const binGroup = new THREE.Group();
  const binX = Math.min(metrics.visibleWallWidth * 0.43, 4.8);
  binGroup.position.set(binX, floorY + sidewalkH, wallFrontZ + sidewalkD * 0.72);
  binGroup.scale.setScalar(streetScale);
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

  const taxiScale = THREE.MathUtils.clamp(
    Math.min(streetScale * 0.92, metrics.visibleWallWidth / 3.7),
    0.52,
    0.92,
  );
  const taxi = createTaxi(taxiScale);
  const taxiGroup = taxi.group;
  const taxiTargetX = 0.18 * taxiScale;
  const taxiStartX = metrics.visibleWallWidth * 0.5 + 2.2 * taxiScale;
  // Off-left exit: fully past the visible wall so the taxi disappears.
  const taxiExitX = -(metrics.visibleWallWidth * 0.5 + 2.6 * taxiScale);
  const narrowTaxiLift = THREE.MathUtils.clamp((3.8 - metrics.visibleWallWidth) / 1.4, 0, 1);
  const taxiBaseY = floorY + roadH + THREE.MathUtils.lerp(0.08, 0.42, narrowTaxiLift) * taxiScale;
  const taxiTargetZ = wallFrontZ + sidewalkD + roadD * 0.05;
  taxiGroup.position.set(taxiStartX, taxiBaseY, taxiTargetZ);
  endingBrickGroup.add(taxiGroup);

  const pigeons = [];
  const pigeonCount = 7;
  const pigeonsGroup = new THREE.Group();
  pigeonsGroup.name = 'pigeons-group';
  endingBrickGroup.add(pigeonsGroup);

  for (let i = 0; i < pigeonCount; i++) {
    const pigeon = createPigeon();
    const rx = (Math.random() - 0.5) * Math.min(metrics.visibleWallWidth * 0.92, 5.4);
    const rz = wallFrontZ + 0.2 * streetScale + Math.random() * Math.max(sidewalkD - 0.32 * streetScale, 0.12);
    const ry = floorY + sidewalkH;
    const rotY = Math.random() * Math.PI * 2;
    const pigeonScale = (0.82 + Math.random() * 0.26) * streetScale;

    pigeon.position.set(rx, ry, rz);
    pigeon.rotation.y = rotY;
    pigeon.scale.setScalar(pigeonScale);

    pigeon.userData.startX = rx;
    pigeon.userData.startY = ry;
    pigeon.userData.startZ = rz;
    pigeon.userData.startRotY = rotY;
    pigeon.userData.startScale = pigeonScale;

    pigeonsGroup.add(pigeon);
    pigeons.push(pigeon);
  }

  let pigeonsFlying = false;
  let pigeonsFlightTimer = 0;
  let flickerTimer = 0;
  // Taxi choreography (GSAP timelines). Descending into the alley cues the cab
  // to drive in on its own clock and brake to a park in front of the door;
  // after the camera has bottomed out, scrolling back up releases a squat-and-
  // launch speed-off to the left. Climbing back into the museum kills any
  // running timeline and rearms the whole sequence.
  let taxiState = 'offscreen'; // offscreen -> arriving -> parked -> exiting -> gone
  let taxiTimeline = null;
  let taxiInitialized = false;
  let taxiWheelSpin = 0;  // accumulated wheel roll angle (radians)
  let lastTaxiX = taxiStartX;
  const TAXI_PARK_RELEASE = 0.6; // scroll-up margin (world units) that releases the cab
  // Cue the drive-in once the camera is 30% of the way down the night transition.
  const taxiArriveTriggerY = transitionStart - Math.max(transitionStart - transitionEnd, 0.001) * 0.3;

  function killTaxiTimeline() {
    if (taxiTimeline) {
      taxiTimeline.kill();
      taxiTimeline = null;
    }
  }

  function resetTaxi() {
    killTaxiTimeline();
    taxiState = 'offscreen';
    hasBottomedOut = false;
    taxiHasDeparted = false;
    taxiGroup.position.x = taxiStartX;
    taxiGroup.rotation.z = 0;
    lastTaxiX = taxiStartX;
  }

  function startTaxiArrive() {
    killTaxiTimeline();
    taxiState = 'arriving';
    taxiTimeline = gsap.timeline({ onComplete: function() { taxiState = 'parked'; } });
    taxiTimeline
      .to(taxiGroup.position, { x: taxiTargetX, duration: 2.6, ease: 'power3.out' }, 0)
      // Brake dip as it pulls up (nose faces -x, so +z roll drops it), then
      // the suspension springs back.
      .to(taxiGroup.rotation, { z: 0.05, duration: 0.45, ease: 'sine.in' }, 1.7)
      .to(taxiGroup.rotation, { z: 0, duration: 1.1, ease: 'elastic.out(1, 0.35)' }, 2.15);
  }

  function startTaxiExit() {
    killTaxiTimeline();
    taxiState = 'exiting';
    taxiHasDeparted = true;
    taxiTimeline = gsap.timeline({ onComplete: function() { taxiState = 'gone'; } });
    taxiTimeline
      // Throttle squat (nose up) as it launches, accelerating off-left from
      // wherever it currently is, leveling out mid-run.
      .to(taxiGroup.rotation, { z: -0.05, duration: 0.3, ease: 'power2.out' }, 0)
      .to(taxiGroup.position, { x: taxiExitX, duration: 1.5, ease: 'power2.in' }, 0.1)
      .to(taxiGroup.rotation, { z: 0, duration: 0.65, ease: 'sine.out' }, 1.0);
  }

  function triggerPigeonFlyAway() {
    if (pigeonsFlying) return;
    pigeonsFlying = true;
    pigeonsFlightTimer = 0;

    for (let i = 0; i < pigeons.length; i++) {
      const pigeon = pigeons[i];
      const sideBias = pigeon.position.x >= 0 ? 1 : -1;
      const dir = new THREE.Vector3(
        sideBias * (0.25 + Math.random() * 0.65),
        0,
        1.0 + Math.random() * 0.55
      ).normalize();

      pigeon.userData.isFlying = true;
      pigeon.userData.flightAge = 0;
      pigeon.userData.flightDelay = i * 0.045 + Math.random() * 0.13;
      pigeon.userData.flightDuration = 2.05 + Math.random() * 0.85;
      pigeon.userData.flightDirX = dir.x;
      pigeon.userData.flightDirZ = dir.z;
      pigeon.userData.flightDistance = 6.4 + Math.random() * 3.6;
      pigeon.userData.flightClimb = 3.35 + Math.random() * 2.35;
      pigeon.userData.flightLateral = (Math.random() - 0.5) * 0.82;
      pigeon.userData.flightBank = -sideBias * (0.26 + Math.random() * 0.24);
      pigeon.userData.flightPhase = Math.random() * Math.PI * 2;
      pigeon.userData.flightYaw = Math.atan2(-dir.z, dir.x);
      pigeon.userData.wingAngle = pigeon.userData.flightPhase;
      pigeon.userData.isFlyingVal = 0;
      pigeon.rotation.set(0, pigeon.userData.flightYaw, 0);
    }
  }

  function resetPigeons() {
    pigeonsFlying = false;
    for (let i = 0; i < pigeons.length; i++) {
      const pigeon = pigeons[i];
      pigeon.position.set(pigeon.userData.startX, pigeon.userData.startY, pigeon.userData.startZ);
      pigeon.rotation.set(0, pigeon.userData.startRotY, 0);
      const resetScale = pigeon.userData.startScale || 1;
      pigeon.scale.set(resetScale, resetScale, resetScale);
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
      pigeon.userData.flightAge = 0;
      pigeon.userData.flightDelay = 0;
      pigeon.userData.flightDuration = 0;
      pigeon.userData.flightDirX = 0;
      pigeon.userData.flightDirZ = 1;
      pigeon.userData.flightDistance = 0;
      pigeon.userData.flightClimb = 0;
      pigeon.userData.flightLateral = 0;
      pigeon.userData.flightBank = 0;
      pigeon.userData.flightPhase = 0;
      pigeon.userData.flightYaw = pigeon.userData.startRotY;

      // Reset shader uniforms
      if (pigeon.material && pigeon.material.uniforms) {
        pigeon.material.uniforms.uIsFlying.value = 0.0;
        pigeon.material.uniforms.uFlightProgress.value = 0.0;
        pigeon.material.uniforms.uPeckProgress.value = 0.0;
        pigeon.material.uniforms.uCooProgress.value = 0.0;
      }
      updatePigeonWings(pigeon, 0, 0, 0);
    }
  }

  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();
  let hoveredTaxiLink = null;

  function setPointerRay(e) {
    const width = renderer?.domElement?.clientWidth || window.innerWidth;
    const height = renderer?.domElement?.clientHeight || window.innerHeight;
    mouse.x = (e.clientX / width) * 2 - 1;
    mouse.y = -(e.clientY / height) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);
  }

  function getTaxiLinkAtPointer() {
    const socialHits = raycaster.intersectObjects(taxi.clickableMeshes, false);
    if (!socialHits.length) return null;
    return socialHits[0].object.userData.socialLink || null;
  }

  function onWindowPointerMove(e) {
    if (!camera) return;
    setPointerRay(e);
    hoveredTaxiLink = getTaxiLinkAtPointer();
    if (renderer?.domElement) {
      renderer.domElement.classList.toggle('interactive-hover', !!hoveredTaxiLink);
    }
  }

  function onWindowClick(e) {
    if (!camera) return;
    setPointerRay(e);

    const taxiLink = getTaxiLinkAtPointer();
    if (taxiLink) {
      window.open(taxiLink.url, '_blank', 'noopener');
      hoveredTaxiLink = null;
      return;
    }

    const intersects = raycaster.intersectObjects([sidewalk, road, ...pigeons], true);
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
      } else if (hit.object === sidewalk || hit.object === road) {
        const hitX = hit.point.x;
        if (Math.abs(hitX) < 4.5) {
          triggerPigeonFlyAway();
        }
      }
    }
  }

  window.addEventListener('mousemove', onWindowPointerMove);
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

      // Light up the cab (headlights, tail lights, lit ad box) as night falls.
      if (taxi.setNightLevel) taxi.setNightLevel(1 - t);

      // --- Taxi choreography (GSAP) -----------------------------------
      // First update after a (re)build: derive the cab's pose from where the
      // camera already is, instead of replaying the arrival on every resize.
      if (!taxiInitialized) {
        taxiInitialized = true;
        if (cameraY <= transitionStart) {
          if (taxiHasDeparted) {
            taxiState = 'gone';
            taxiGroup.position.x = taxiExitX;
          } else if (cameraY < taxiArriveTriggerY) {
            taxiState = 'parked';
            taxiGroup.position.x = taxiTargetX;
          }
          lastTaxiX = taxiGroup.position.x;
          if (Math.abs(cameraY - layoutResult.minY) < 0.18) {
            hasBottomedOut = true;
          }
        }
      }

      // The timelines own position.x and rotation.z; this block only decides
      // WHEN they run and keeps the procedural bob/wheel-spin layered on top.
      if (cameraY > transitionStart) {
        // Climbing back into the museum rearms the whole sequence.
        if (taxiState !== 'offscreen') resetTaxi();
      } else if (taxiState === 'offscreen' && cameraY < taxiArriveTriggerY) {
        // Descending into the alley cues the cab to drive in and park.
        startTaxiArrive();
      }

      // Reaching the bottom scatters the pigeons (once per arrival).
      if (Math.abs(cameraY - layoutResult.minY) < 0.18 && !hasBottomedOut) {
        hasBottomedOut = true;
        triggerPigeonFlyAway();
      }

      // After the camera has bottomed out, scrolling up past a small margin
      // releases the cab to speed off left. Also fires mid-arrival — the exit
      // tween accelerates from wherever the cab currently is.
      if (
        hasBottomedOut &&
        (taxiState === 'parked' || taxiState === 'arriving') &&
        cameraY > layoutResult.minY + TAXI_PARK_RELEASE
      ) {
        startTaxiExit();
      }

      // Suspension bob scales with how fast the cab is actually moving.
      const taxiTravel = lastTaxiX - taxiGroup.position.x;
      lastTaxiX = taxiGroup.position.x;
      const taxiSpeed = Math.abs(taxiTravel) / Math.max(dt, 0.001);
      const taxiMotion = Math.min(1, taxiSpeed / (2.4 * taxiScale));
      taxiGroup.position.y = taxiBaseY +
        Math.sin(flickerTimer * 6.2) * 0.012 * taxiScale * (0.35 + 0.65 * taxiMotion) +
        taxiMotion * 0.02 * taxiScale;

      // Spin the wheel groups (axle along local Z) from the actual frame-to-
      // frame travel so the speed reads honestly — fast on the way in/out,
      // still at the pause. Tire radius is 0.25 in local space.
      taxiWheelSpin += taxiTravel / (0.25 * taxiScale);
      if (taxi.wheels) {
        for (let wi = 0; wi < taxi.wheels.length; wi++) {
          taxi.wheels[wi].rotation.z = taxiWheelSpin;
        }
      }

      // Transition background & fog colors
      if (rootScene.background && rootScene.background.isColor) {
        rootScene.background.lerpColors(nightBgColor, dayBgColor, t);
      }
      if (rootScene.fog && rootScene.fog.color && rootScene.fog.color.isColor) {
        rootScene.fog.color.lerpColors(nightBgColor, dayBgColor, t);
      }

      // Transition global lights
      if (ambientLight) {
        ambientLight.intensity = THREE.MathUtils.lerp(0.015, 0.68, t);
        ambientLight.color.lerpColors(nightAmbientColor, dayAmbientColor, t);
      }
      if (hemiLight) {
        hemiLight.intensity = THREE.MathUtils.lerp(0.008, 0.48, t);
        hemiLight.color.lerpColors(nightHemiSkyColor, dayHemiSkyColor, t);
        hemiLight.groundColor.lerpColors(nightHemiGroundColor, dayHemiGroundColor, t);
      }
      if (keyLight) {
        keyLight.intensity = THREE.MathUtils.lerp(0.0, 0.72, t);
      }

      // Scale street lights to avoid bleeding into the museum
      flickerLight.intensity = currentIntensity * (1 - t);

      // Volumetric atmosphere fades in with the night factor. The door beam
      // follows the fixture's flicker so the shaft dies with the bulb.
      const night = 1 - t;
      const atmosphereOn = night > 0.02;
      doorBeam.mesh.visible = atmosphereOn;
      if (atmosphereOn) {
        doorBeam.material.uniforms.uIntensity.value = 0.32 * night * (currentIntensity / baseIntensity);
        doorBeam.material.uniforms.uTime.value = flickerTimer;
      }
      for (let mi = 0; mi < mistLayers.length; mi++) {
        const layer = mistLayers[mi];
        layer.mesh.visible = atmosphereOn;
        if (atmosphereOn) {
          layer.mesh.material.opacity = layer.baseOpacity * night;
          layer.mesh.position.x = Math.sin(flickerTimer * layer.drift * 0.12 + layer.phase) * 0.6;
        }
      }

      // Rain and puddles live in the same night window.
      rain.lines.visible = atmosphereOn;
      if (atmosphereOn) {
        rain.material.opacity = 0.3 * night;
        rain.update(dt);
      }
      for (let pi = 0; pi < puddles.length; pi++) {
        const puddle = puddles[pi];
        puddle.visible = atmosphereOn;
        if (atmosphereOn) {
          const u = puddle.material.uniforms;
          u.uTime.value = flickerTimer;
          u.uNight.value = night;
          u.uDoorIntensity.value = flickerLight.intensity;
        }
      }

      // Wet-street sheen: darker, glossier ground the deeper into night.
      roadMat.color.lerpColors(wetRoadColor, dryRoadColor, t);
      roadMat.roughness = THREE.MathUtils.lerp(0.32, 0.92, t);
      sidewalkMat.color.lerpColors(wetSidewalkColor, drySidewalkColor, t);
      sidewalkMat.roughness = THREE.MathUtils.lerp(0.42, 0.85, t);
      curbMat.color.lerpColors(wetCurbColor, dryCurbColor, t);
      curbMat.roughness = THREE.MathUtils.lerp(0.45, 0.74, t);

      // Night air is hazier: pull the fog planes in as the museum lights die.
      if (rootScene.fog) {
        rootScene.fog.near = THREE.MathUtils.lerp(7.5, 20, t);
        rootScene.fog.far = THREE.MathUtils.lerp(30, 62, t);
      }

      // Update bulb material colors (glowing effect)
      if (currentIntensity === 0) {
        bulbMat.color.copy(bulbOffColor);
      } else {
        bulbMat.color.lerpColors(bulbOnColor, bulbOffColor, t);
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

        }
      });

      // Pigeon fly-away is now latched together with the taxi exit in the
      // choreography block above (both fire when the camera bottoms out),
      // so they stay synchronized.

      if (pigeonsFlying) {
        pigeonsFlightTimer += dt;
        let allGone = true;

        for (let i = 0; i < pigeons.length; i++) {
          const pigeon = pigeons[i];
          if (pigeon.userData.isFlying) {
            allGone = false;
            pigeon.userData.flightAge += dt;

            const age = Math.max(0, pigeon.userData.flightAge - pigeon.userData.flightDelay);
            const duration = Math.max(pigeon.userData.flightDuration, 0.001);
            const progress = THREE.MathUtils.clamp(age / duration, 0, 1);

            // Realistic flight envelope: fast takeoff flaps then cruise/glide
            const cruiseRate = 15.5 + Math.sin(age * 1.6) * 1.8; // slight varying rate for life
            const flapFreq = THREE.MathUtils.lerp(42.0, cruiseRate, THREE.MathUtils.smoothstep(0.0, 0.65, age));
            const wingBeat = pigeon.userData.flightPhase + age * flapFreq;

            // Vertical motion with flap bob + initial hop + climb curve
            const lift = 1.0 - Math.pow(1.0 - progress, 2.55);
            const surge = Math.pow(progress, 0.96);
            const flapBob = Math.sin(wingBeat) * 0.048 * (0.55 + 0.45 * (1.0 - Math.min(1.0, age * 1.4)));
            const initialHop = Math.sin(Math.min(age * 7.5, 1.8) * Math.PI * 0.7) * 0.19 * Math.max(0.0, 1.0 - age * 0.9);
            const climbY = pigeon.userData.flightClimb * lift + flapBob + initialHop;

            const dirX = pigeon.userData.flightDirX;
            const dirZ = pigeon.userData.flightDirZ;
            const sideX = -dirZ;
            const sideZ = dirX;
            const weave = Math.sin(progress * Math.PI * 1.25 + pigeon.userData.flightPhase) *
              pigeon.userData.flightLateral *
              Math.sin(progress * Math.PI * 0.9);
            const forward = pigeon.userData.flightDistance * surge;

            pigeon.position.set(
              pigeon.userData.startX + dirX * forward + sideX * weave,
              pigeon.userData.startY + climbY,
              pigeon.userData.startZ + dirZ * forward + sideZ * weave
            );

            // Bank + pitch + slight head lead yaw
            const bank = pigeon.userData.flightBank * Math.sin(Math.min(progress * 1.75, 1.0) * Math.PI);
            const pitch = THREE.MathUtils.lerp(0.48, 0.03, progress) + Math.sin(wingBeat) * 0.065 * (1.0 - progress * 0.6);
            const yawWeave = Math.sin(progress * Math.PI * 1.7 + pigeon.userData.flightPhase) * 0.065 * (1.0 - progress * 0.7);
            pigeon.rotation.set(bank, pigeon.userData.flightYaw + yawWeave, pitch);

            pigeon.userData.wingAngle = wingBeat;

            if (pigeon.material && pigeon.material.uniforms) {
              const targetFlightPose = Math.min(1.0, THREE.MathUtils.smoothstep(0.0, 0.22, age) * 1.03);
              pigeon.userData.isFlyingVal = THREE.MathUtils.lerp(pigeon.userData.isFlyingVal, targetFlightPose, 14 * dt);
              pigeon.material.uniforms.uIsFlying.value = pigeon.userData.isFlyingVal;
              pigeon.material.uniforms.uFlightProgress.value = pigeon.userData.wingAngle;
              pigeon.material.uniforms.uPeckProgress.value = 0.0;
              pigeon.material.uniforms.uCooProgress.value = 0.0;
            }
            updatePigeonWings(pigeon, pigeon.userData.isFlyingVal, wingBeat, flickerTimer);

            const baseScale = pigeon.userData.startScale || 1;
            const distanceScale = baseScale * THREE.MathUtils.lerp(1.0, 0.72, THREE.MathUtils.smoothstep(progress, 0.72, 1.0));
            pigeon.scale.set(distanceScale, distanceScale, distanceScale);

            if (progress >= 1) {
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
          updatePigeonWings(pigeon, pigeon.userData.isFlyingVal, pigeon.userData.wingAngle, flickerTimer);

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
      // Kill any running taxi timeline first — rebuildScene creates a new
      // taxi, and a live tween must not keep driving the detached one.
      killTaxiTimeline();
      window.removeEventListener('mousemove', onWindowPointerMove);
      window.removeEventListener('click', onWindowClick);
    }
  };
}
