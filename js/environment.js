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
    const gy = h * 0.42;
    const R = 58;
    ctx.fillStyle = '#ffffff';
    // ears
    ctx.beginPath();
    ctx.moveTo(cx - R * 0.78, gy - R * 0.55);
    ctx.lineTo(cx - R * 0.18, gy - R * 0.95);
    ctx.lineTo(cx - R * 0.20, gy - R * 0.20);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(cx + R * 0.78, gy - R * 0.55);
    ctx.lineTo(cx + R * 0.18, gy - R * 0.95);
    ctx.lineTo(cx + R * 0.20, gy - R * 0.20);
    ctx.closePath();
    ctx.fill();
    // head
    ctx.beginPath();
    ctx.arc(cx, gy, R, 0, Math.PI * 2);
    ctx.fill();
    // eyes
    ctx.fillStyle = '#1d2127';
    ctx.beginPath();
    ctx.arc(cx - 22, gy + 2, 9, 0, Math.PI * 2);
    ctx.arc(cx + 22, gy + 2, 9, 0, Math.PI * 2);
    ctx.fill();
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
  const glassMat = new THREE.MeshStandardMaterial({ color: 0x16212e, roughness: 0.12, metalness: 0.22, transparent: true, opacity: 0.84 });
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

  // Sloped windshield + rear glass seated on the cabin faces
  const windshield = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.03, 0.86), glassMat);
  windshield.position.set(-0.44, 0.90, 0);
  windshield.rotation.z = Math.atan2(1.10 - 0.70, -0.26 - (-0.62));
  group.add(windshield);

  const rearGlass = new THREE.Mesh(new THREE.BoxGeometry(0.50, 0.03, 0.84), glassMat);
  rearGlass.position.set(0.74, 0.90, 0);
  rearGlass.rotation.z = Math.atan2(0.70 - 1.10, 0.90 - 0.58);
  group.add(rearGlass);

  // Side glass on both flanks, split by a B-pillar
  const glassZ = cabinWidth / 2 + 0.005;
  for (const zs of [1, -1]) {
    const frontWin = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.30, 0.02), glassMat);
    frontWin.position.set(-0.20, 0.90, zs * glassZ);
    group.add(frontWin);
    const rearWin = new THREE.Mesh(new THREE.BoxGeometry(0.40, 0.30, 0.02), glassMat);
    rearWin.position.set(0.42, 0.90, zs * glassZ);
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

  // Side mirrors at the A-pillar
  for (const zs of [1, -1]) {
    const stalk = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.03, 0.08), chromeMat);
    stalk.position.set(-0.6, 0.84, zs * (halfW + 0.03));
    group.add(stalk);
    const mirror = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.09, 0.05), taxiYellow);
    mirror.position.set(-0.62, 0.86, zs * (halfW + 0.09));
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
  TAXI_SOCIAL_LINKS.forEach((link, index) => {
    const panel = new THREE.Mesh(
      new THREE.PlaneGeometry(panelW, panelHeight * 0.88),
      new THREE.MeshBasicMaterial({
        map: makeBrandLogoTexture(link),
        side: THREE.DoubleSide,
      }),
    );
    panel.position.set(
      signCenterX - signLength / 2 + panelW / 2 + index * (panelW + panelGap),
      signBaseY + signHeight * 0.5,
      signDepth * 0.25 + 0.012,
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
  rearPanel.position.set(signCenterX, signBaseY + signHeight * 0.5, -signDepth * 0.25 - 0.012);
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

export function buildEnvironment(scene, projects, categoryOrder, camera, renderer) {
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

  const lampGroup = new THREE.Group();
  const streetSideX = Math.max(-metrics.visibleWallWidth * 0.46, -4.8);
  lampGroup.position.set(streetSideX, floorY + sidewalkH, wallFrontZ + sidewalkD * 0.6);
  const lampPostMat = new THREE.MeshStandardMaterial({
    color: 0x2c3e50,
    roughness: 0.5,
    metalness: 0.6,
  });
  const lampPoleHeight = Math.min(3.25 * streetScale, endingWallHeight - 0.55 * streetScale);
  const lampBase = new THREE.Mesh(
    new THREE.CylinderGeometry(0.14 * streetScale, 0.14 * streetScale, 0.32 * streetScale, 8),
    lampPostMat
  );
  lampBase.position.y = 0.16 * streetScale;
  lampGroup.add(lampBase);

  const lampPole = new THREE.Mesh(
    new THREE.CylinderGeometry(0.034 * streetScale, 0.034 * streetScale, lampPoleHeight, 8),
    lampPostMat
  );
  lampPole.position.y = 0.32 * streetScale + lampPoleHeight / 2;
  lampGroup.add(lampPole);

  const lampArm = new THREE.Mesh(
    new THREE.CylinderGeometry(0.018 * streetScale, 0.018 * streetScale, 0.56 * streetScale, 6),
    lampPostMat
  );
  lampArm.rotation.z = Math.PI / 2;
  lampArm.position.set(0.28 * streetScale, 0.32 * streetScale + lampPoleHeight - 0.12 * streetScale, 0);
  lampGroup.add(lampArm);

  const lanternHousing = new THREE.Mesh(
    new THREE.CylinderGeometry(0.07 * streetScale, 0.11 * streetScale, 0.22 * streetScale, 6),
    lampPostMat
  );
  lanternHousing.position.set(0.56 * streetScale, 0.32 * streetScale + lampPoleHeight - 0.18 * streetScale, 0);
  lampGroup.add(lanternHousing);

  const lanternBulbMat = new THREE.MeshBasicMaterial({
    color: 0xffe6a3,
  });
  const lanternBulb = new THREE.Mesh(
    new THREE.SphereGeometry(0.052 * streetScale, 6, 6),
    lanternBulbMat
  );
  lanternBulb.position.set(0.56 * streetScale, 0.32 * streetScale + lampPoleHeight - 0.32 * streetScale, 0);
  lampGroup.add(lanternBulb);
  endingBrickGroup.add(lampGroup);

  const lampLight = new THREE.PointLight(0xffe6a3, 1.8, 6.0, 1.3);
  lampLight.position.set(
    streetSideX + 0.56 * streetScale,
    floorY + sidewalkH + 0.32 * streetScale + lampPoleHeight - 0.32 * streetScale,
    wallFrontZ + sidewalkD * 0.6,
  );
  endingBrickGroup.add(lampLight);

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
  taxiGroup.position.set(taxiStartX, taxiBaseY - 0.12 * taxiScale, taxiTargetZ);
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
  // Taxi choreography state. The cab drives in and PARKS in front of the door
  // at the bottom; scrolling back up releases a latched, time-based speed-off
  // to the left that always completes. Everything rearms once the camera climbs
  // back into the museum so the sequence replays.
  let taxiExiting = false;
  let taxiHasParked = false;
  let taxiDriveOut = 0;   // 0..1 exit progress once latched
  let taxiWheelSpin = 0;  // accumulated wheel roll angle (radians)
  const TAXI_EXIT_TIME = 1.05;   // seconds to clear the left edge (speed-off)
  const TAXI_PARK_RELEASE = 0.6; // scroll-up margin (world units) that releases the cab

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

      // --- Taxi choreography -----------------------------------------
      // Drive IN from the right as the camera descends, PARK in front of the
      // door at the bottom, then SPEED OFF to the left when the user scrolls
      // back up. Climbing into the museum rearms the whole sequence.
      if (cameraY > transitionStart) {
        taxiExiting = false;
        taxiDriveOut = 0;
        taxiHasParked = false;
      }

      // Drive-in is motivated by scroll proximity to the bottom; dividing by
      // 0.85 lets the cab settle at center just before the very bottom so the
      // park reads clearly.
      const driveSpan = Math.max(transitionStart - transitionEnd, 0.001);
      const driveInRaw = THREE.MathUtils.clamp((transitionStart - cameraY) / driveSpan, 0, 1);
      const driveIn = THREE.MathUtils.clamp(driveInRaw / 0.85, 0, 1);

      // Reaching the bottom parks the cab in front of the door and scatters the
      // pigeons (once per arrival).
      if (Math.abs(cameraY - layoutResult.minY) < 0.18 && !taxiHasParked) {
        taxiHasParked = true;
        triggerPigeonFlyAway();
      }

      // Having parked, scrolling back up past a small margin releases the cab to
      // speed off left. The exit latches + is time-based so it always clears and
      // never reverses on a downward nudge.
      if (taxiHasParked && !taxiExiting && cameraY > layoutResult.minY + TAXI_PARK_RELEASE) {
        taxiExiting = true;
      }
      if (taxiExiting) {
        taxiDriveOut = Math.min(1, taxiDriveOut + dt / TAXI_EXIT_TIME);
      }

      // Smoothstep eases for each phase.
      const easeIn = driveIn * driveIn * (3 - 2 * driveIn);
      const easeOut = taxiDriveOut * taxiDriveOut * (3 - 2 * taxiDriveOut);

      // X is continuous across the handoff: at the release moment easeIn is ~1
      // (cab at taxiTargetX) and the exit lerp also starts from taxiTargetX.
      const prevTaxiX = taxiGroup.position.x;
      taxiGroup.position.x = taxiExiting
        ? THREE.MathUtils.lerp(taxiTargetX, taxiExitX, easeOut)
        : THREE.MathUtils.lerp(taxiStartX, taxiTargetX, easeIn);

      // Settle down onto the road as it arrives; keep a faint driving bob.
      const settle = taxiExiting ? 1 : easeIn;
      const drivingBob = Math.sin(flickerTimer * 6.2) * 0.012 * taxiScale;
      taxiGroup.position.y = taxiBaseY - (1 - settle) * 0.12 * taxiScale + Math.sin(settle * Math.PI) * 0.03 * taxiScale + drivingBob;
      taxiGroup.rotation.y = Math.sin(settle * Math.PI) * 0.03;

      // Spin the wheel groups (axle along local Z) from the actual frame-to-
      // frame travel so the speed reads honestly — fast on the way in/out,
      // still at the pause. Tire radius is 0.25 in local space.
      const taxiTravel = prevTaxiX - taxiGroup.position.x;
      taxiWheelSpin += taxiTravel / (0.25 * taxiScale);
      if (taxi.wheels) {
        for (let wi = 0; wi < taxi.wheels.length; wi++) {
          taxi.wheels[wi].rotation.z = taxiWheelSpin;
        }
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
      window.removeEventListener('mousemove', onWindowPointerMove);
      window.removeEventListener('click', onWindowClick);
    }
  };
}
