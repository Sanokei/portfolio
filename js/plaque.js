// plaque.js - Interactive museum plaques beside each broken opening.

import * as THREE from 'three';
import { getLayoutMetrics } from './layout.js';

const ICON_SOURCES = {
  gh: 'img/gh.png',
  itchio: 'img/itchio.jpg',
  itch: 'img/itchio.jpg',
  web: 'img/web.png',
  blog: 'img/blog.png',
};

function drawYoutubeIcon(ctx, x, y) {
  ctx.save();
  ctx.fillStyle = '#e52d27';
  ctx.beginPath();
  const r = 4;
  const w = 20;
  const h = 14;
  const rx = x;
  const ry = y + 3;
  if (ctx.roundRect) {
    ctx.roundRect(rx, ry, w, h, r);
  } else {
    ctx.rect(rx, ry, w, h);
  }
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.moveTo(rx + 8, ry + 4);
  ctx.lineTo(rx + 8, ry + 10);
  ctx.lineTo(rx + 13, ry + 7);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawArtAllergyIcon(ctx, x, y) {
  ctx.save();
  ctx.fillStyle = '#111111';
  ctx.beginPath();
  ctx.arc(x + 10, y + 10, 10, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 12px serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('A', x + 9, y + 10);

  ctx.fillStyle = '#e03a3e';
  ctx.beginPath();
  ctx.arc(x + 14, y + 6, 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

const iconCache = {};

function getIcon(icon, redraw) {
  const src = ICON_SOURCES[icon] || ICON_SOURCES.web;
  if (iconCache[src]) {
    if (!iconCache[src].loaded) iconCache[src].redraws.push(redraw);
    return iconCache[src];
  }

  const image = new Image();
  iconCache[src] = { image, loaded: false, redraws: [redraw] };
  image.onload = () => {
    iconCache[src].loaded = true;
    for (const update of iconCache[src].redraws) update();
    iconCache[src].redraws.length = 0;
  };
  image.src = src;
  return iconCache[src];
}

function wrap(ctx, text, x, y, maxWidth, lineHeight, maxLines) {
  const words = text.split(' ');
  let line = '';
  let lineCount = 0;

  for (let i = 0; i < words.length; i++) {
    const next = `${line}${words[i]} `;
    if (ctx.measureText(next).width > maxWidth && line) {
      ctx.fillText(line.trim(), x, y);
      y += lineHeight;
      lineCount++;
      line = `${words[i]} `;
      if (lineCount === maxLines - 1) {
        const rest = words.slice(i + 1).length > 0 ? '...' : '';
        ctx.fillText((line.trim() + rest).trim(), x, y);
        return y + lineHeight;
      }
    } else {
      line = next;
    }
  }

  if (line) ctx.fillText(line.trim(), x, y);
  return y + lineHeight;
}

function makeTexture(width, height, draw) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  draw(canvas.getContext('2d'), width, height);
  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function makePlaqueMaterials(texture, sideColor = 0xd8d0c2, backColor = 0x1d1a16) {
  const side = new THREE.MeshStandardMaterial({ color: sideColor, roughness: 0.78, metalness: 0.04 });
  const back = new THREE.MeshStandardMaterial({ color: backColor, roughness: 0.82, metalness: 0.02 });
  const front = new THREE.MeshStandardMaterial({ map: texture, roughness: 0.72, metalness: 0.02 });
  return [side, side, side, side, front, back];
}

function renderHeaderTexture() {
  return makeTexture(1400, 320, (ctx, width, height) => {
    ctx.fillStyle = '#f7f4ee';
    ctx.fillRect(0, 0, width, height);
    ctx.strokeStyle = '#1b1b1b';
    ctx.lineWidth = 6;
    ctx.strokeRect(28, 28, width - 56, height - 56);
    ctx.strokeStyle = '#b89d62';
    ctx.lineWidth = 2;
    ctx.strokeRect(48, 48, width - 96, height - 96);

    ctx.fillStyle = '#121212';
    ctx.font = '82px "Playfair Display SC", Georgia, serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('THE PORTFOLIO', width / 2, height / 2 - 22);

    ctx.fillStyle = '#5b554d';
    ctx.font = 'italic 31px "EB Garamond", Georgia, serif';
    ctx.fillText('projects behind the plaster', width / 2, height / 2 + 54);
  });
}

function renderProjectTexture(project) {
  const width = 760;
  const height = 520;
  const linkZones = [];
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.colorSpace = THREE.SRGBColorSpace;

  const draw = () => {
    linkZones.length = 0;
    ctx.fillStyle = '#fbfaf7';
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = 'rgba(0,0,0,0.035)';
    for (let y = 0; y < height; y += 4) ctx.fillRect(0, y, width, 1);

    ctx.strokeStyle = '#202020';
    ctx.lineWidth = 5;
    ctx.strokeRect(14, 14, width - 28, height - 28);
    ctx.strokeStyle = '#b89d62';
    ctx.lineWidth = 2;
    ctx.strokeRect(30, 30, width - 60, height - 60);

    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = '#111';
    ctx.font = '700 40px "EB Garamond", Georgia, serif';
    let y = wrap(ctx, project.name, 50, 78, width - 100, 42, 2);

    ctx.fillStyle = '#57514a';
    ctx.font = 'italic 23px "EB Garamond", Georgia, serif';
    const subtitleText = project.year ? (project.subtitle + " — " + project.year) : project.subtitle;
    y = wrap(ctx, subtitleText, 50, y, width - 100, 28, 2);

    ctx.strokeStyle = '#b89d62';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(50, y + 8);
    ctx.lineTo(width - 50, y + 8);
    ctx.stroke();

    ctx.fillStyle = '#24211e';
    ctx.font = '20px "Inter", sans-serif';
    y = wrap(ctx, project.description, 50, y + 42, width - 100, 30, 4);

    ctx.fillStyle = '#282521';
    ctx.font = '700 17px "Inter", sans-serif';
    let tagX = 50;
    const tagY = height - 124;
    for (const tag of project.tags.slice(0, 4)) {
      const label = tag.toUpperCase();
      const tagW = ctx.measureText(label).width + 22;
      if (tagX + tagW > width - 50) break;
      ctx.strokeStyle = '#a49b8f';
      ctx.lineWidth = 2;
      ctx.strokeRect(tagX, tagY, tagW, 30);
      ctx.fillText(label, tagX + 11, tagY + 21);
      tagX += tagW + 10;
    }

    let linkX = 50;
    const linkY = height - 54;
    ctx.font = '700 19px "Inter", sans-serif';

    for (const link of project.links) {
      const icon = getIcon(link.icon, draw);
      const label = link.label;
      const labelW = ctx.measureText(label).width + 58;
      if (linkX + labelW > width - 50) break;

      ctx.fillStyle = '#151515';
      ctx.fillRect(linkX, linkY - 26, labelW, 32);
      ctx.fillStyle = '#fffaf1';
      ctx.fillRect(linkX + 7, linkY - 22, 24, 24);
      if (link.icon === 'youtube' || link.icon === 'yt') {
        drawYoutubeIcon(ctx, linkX + 9, linkY - 20);
      } else if (link.icon === 'artallergy') {
        drawArtAllergyIcon(ctx, linkX + 9, linkY - 20);
      } else if (icon.loaded) {
        ctx.drawImage(icon.image, linkX + 9, linkY - 20, 20, 20);
      } else {
        ctx.fillStyle = '#151515';
        ctx.fillText('>', linkX + 15, linkY - 4);
        ctx.fillStyle = '#fffaf1';
      }
      ctx.fillStyle = '#fffaf1';
      ctx.fillText(label, linkX + 40, linkY - 4);

      linkZones.push({
        label: link.label,
        url: link.url,
        xMin: linkX / width,
        xMax: (linkX + labelW) / width,
        yMin: 1 - (linkY + 6) / height,
        yMax: 1 - (linkY - 26) / height,
      });

      linkX += labelW + 12;
    }
    texture.needsUpdate = true;
  };

  draw();

  return { texture, linkZones };
}

export function buildHeaderPlaque(scene) {
  const { headerW, headerH, headerY, wallZ } = getLayoutMetrics();
  const texture = renderHeaderTexture();

  // Front face uses MeshBasicMaterial so the title canvas renders
  // at full brightness — no scene-lighting dimming. Sides/back stay
  // Standard so the plaque still has physical depth cues.
  const front = new THREE.MeshBasicMaterial({ map: texture });
  const side = new THREE.MeshStandardMaterial({ color: 0xd8d0c2, roughness: 0.78, metalness: 0.04 });
  const back = new THREE.MeshStandardMaterial({ color: 0x1d1a16, roughness: 0.82, metalness: 0.02 });

  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(headerW, headerH, 0.08),
    [side, side, side, side, front, back],
  );
  mesh.position.set(0, headerY, wallZ + 0.09);
  scene.add(mesh);
  return mesh;
}

export function buildProjectPlaques(scene, cavityData) {
  const plaqueObjects = [];

  for (let i = 0; i < cavityData.length; i++) {
    const cd = cavityData[i];
    const { texture, linkZones } = renderProjectTexture(cd.project);
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(cd.plaqueW, cd.plaqueH, 0.055),
      makePlaqueMaterials(texture),
    );

    mesh.position.set(cd.plaqueX, cd.plaqueY, cd.wallZ + 0.075);
    scene.add(mesh);
    plaqueObjects.push({ mesh, project: cd.project, linkZones });
  }

  return plaqueObjects;
}
