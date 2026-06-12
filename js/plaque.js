// plaque.js — Museum plaques rendered via canvas-to-texture.
//
// Exports:
//   buildHeaderPlaque(scene) → mesh
//   buildProjectPlaques(scene, cavityData) → plaqueObjects[]
//
// Each plaqueObject = { mesh, project, linkZones[] }
//   linkZones: [{ label, url, xMin, xMax, yMin, yMax }] — normalized 0-1 coords

import * as THREE from 'three';

function renderHeaderTexture() {
  const width = 1024;
  const height = 256;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  // Wood-grain background
  const woodGrad = ctx.createLinearGradient(0, 0, 0, height);
  woodGrad.addColorStop(0, '#4a3020');
  woodGrad.addColorStop(0.3, '#6B4530');
  woodGrad.addColorStop(0.5, '#5C4033');
  woodGrad.addColorStop(0.7, '#6B4530');
  woodGrad.addColorStop(1, '#3a2010');
  ctx.fillStyle = woodGrad;
  ctx.fillRect(0, 0, width, height);

  // Wood grain lines
  ctx.strokeStyle = 'rgba(0,0,0,0.15)';
  ctx.lineWidth = 1;
  for (let y = 0; y < height; y += 8) {
    ctx.beginPath();
    ctx.moveTo(0, y + Math.sin(y * 0.3) * 2);
    ctx.lineTo(width, y + Math.sin(y * 0.3 + 1) * 2);
    ctx.stroke();
  }

  // Gold border
  ctx.strokeStyle = '#DAA520';
  ctx.lineWidth = 8;
  ctx.strokeRect(6, 6, width - 12, height - 12);
  ctx.strokeStyle = '#B8860B';
  ctx.lineWidth = 2;
  ctx.strokeRect(14, 14, width - 28, height - 28);

  // Gold text
  ctx.fillStyle = '#DAA520';
  ctx.font = 'bold 72px "EB Garamond", Georgia, serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = 'rgba(0,0,0,0.5)';
  ctx.shadowBlur = 4;
  ctx.shadowOffsetX = 1;
  ctx.shadowOffsetY = 1;
  ctx.fillText("SANO'S PORTFOLIO", width / 2, height / 2);
  ctx.shadowColor = 'transparent';

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function renderProjectTexture(project) {
  const width = 512;
  const height = 350;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  // Brushed metal background
  const metalGrad = ctx.createLinearGradient(0, 0, 0, height);
  metalGrad.addColorStop(0, '#9a9a8a');
  metalGrad.addColorStop(0.5, '#b0b0a0');
  metalGrad.addColorStop(1, '#7a7a6a');
  ctx.fillStyle = metalGrad;
  ctx.fillRect(0, 0, width, height);

  // Brush lines
  ctx.strokeStyle = 'rgba(255,255,255,0.08)';
  ctx.lineWidth = 1;
  for (let y = 0; y < height; y += 4) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  // Beveled border
  ctx.strokeStyle = '#666';
  ctx.lineWidth = 3;
  ctx.strokeRect(4, 4, width - 8, height - 8);

  // Title
  ctx.fillStyle = '#1a1a1a';
  ctx.font = 'bold 32px "Inter", sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(project.name, 24, 50);

  // Subtitle
  ctx.fillStyle = '#444';
  ctx.font = 'italic 16px "Inter", sans-serif';
  ctx.fillText(project.subtitle, 24, 80);

  // Divider
  ctx.strokeStyle = '#888';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(24, 95);
  ctx.lineTo(width - 24, 95);
  ctx.stroke();

  // Description (word wrap)
  ctx.fillStyle = '#333';
  ctx.font = '15px "Inter", sans-serif';
  const words = project.description.split(' ');
  let line = '';
  let y = 120;
  const maxWidth = width - 48;
  for (const word of words) {
    const test = line + word + ' ';
    if (ctx.measureText(test).width > maxWidth && line.length > 0) {
      ctx.fillText(line, 24, y);
      line = word + ' ';
      y += 22;
    } else {
      line = test;
    }
  }
  if (line) ctx.fillText(line, 24, y);
  y += 30;

  // Tags
  ctx.fillStyle = '#1f75a3';
  ctx.font = 'bold 14px "Inter", sans-serif';
  let tagX = 24;
  for (const tag of project.tags) {
    const tagW = ctx.measureText(tag).width + 16;
    ctx.strokeStyle = '#1f75a3';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(tagX, y, tagW, 24, 4);
    ctx.stroke();
    ctx.fillText(tag, tagX + 8, y + 16);
    tagX += tagW + 8;
  }
  y += 40;

  // Links with zone coordinates for raycasting
  const linkZones = [];
  if (project.links.length > 0) {
    ctx.fillStyle = '#777';
    ctx.font = '13px "Inter", sans-serif';
    let linkX = 24;
    for (const link of project.links) {
      const iconMap = { itch: '[itch]', gh: '[git]', web: '[web]' };
      const icon = iconMap[link.icon] || '[link]';
      const label = icon + ' ' + link.label;
      const labelW = ctx.measureText(label).width;
      ctx.fillText(label, linkX, y);

      linkZones.push({
        label: link.label,
        url: link.url,
        xMin: linkX / width,
        xMax: (linkX + labelW) / width,
        yMin: (y - 14) / height,
        yMax: (y + 4) / height,
      });

      linkX += labelW + 20;
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.colorSpace = THREE.SRGBColorSpace;
  return { texture, linkZones };
}

// ── 3D Plaque Builders ─────────────────────────────────

export function buildHeaderPlaque(scene) {
  const texture = renderHeaderTexture();
  const material = new THREE.MeshStandardMaterial({
    map: texture,
    roughness: 0.5,
    metalness: 0.3,
  });
  const geo = new THREE.BoxGeometry(6, 1.5, 0.15, 1, 1, 1);
  const mesh = new THREE.Mesh(geo, material);
  mesh.position.set(0, 8.3, 0.6);
  mesh.castShadow = true;
  scene.add(mesh);
  return mesh;
}

export function buildProjectPlaques(scene, cavityData) {
  const plaqueObjects = [];
  for (let i = 0; i < cavityData.length; i++) {
    const cd = cavityData[i];
    const { texture, linkZones } = renderProjectTexture(cd.project);
    const material = new THREE.MeshStandardMaterial({
      map: texture,
      roughness: 0.55,
      metalness: 0.75,
    });
    const geo = new THREE.BoxGeometry(1.6, 1.1, 0.06, 1, 1, 1);
    const mesh = new THREE.Mesh(geo, material);
    const side = i % 2 === 0 ? 1 : -1;
    mesh.position.set(cd.worldX + side * 1.6, cd.worldY + 0.1, cd.wallZ + 0.04);
    mesh.castShadow = true;
    scene.add(mesh);
    plaqueObjects.push({ mesh, project: cd.project, linkZones });
  }
  return plaqueObjects;
}
