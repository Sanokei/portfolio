// interactions.js — Raycaster-based hover/click on plaque links.
//
// Exports:
//   initInteractions(camera, renderer, plaqueObjects) → { update(), dispose() }

import * as THREE from 'three';

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

let cameraRef = null;
let rendererRef = null;
let plaques = [];
let crtButtons = [];
let carousels = [];
let hoveredLink = null;
let hoveredButton = null;
let hoveredCrt = null;
let styleEl = null;

export function initInteractions(camera, renderer, plaqueObjects, buttonObjects = [], carouselObjects = []) {
  cameraRef = camera;
  rendererRef = renderer;
  plaques = plaqueObjects;
  crtButtons = buttonObjects;
  carousels = carouselObjects;

  window.addEventListener('mousemove', onMouseMove);
  window.addEventListener('click', onClick);

  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.textContent = `
      canvas { cursor: default; }
      canvas.interactive-hover { cursor: pointer; }
    `;
    document.head.appendChild(styleEl);
  }

  return {
    update() {},
    dispose() {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('click', onClick);
      clearHover(rendererRef?.domElement);
      plaques = [];
      crtButtons = [];
      carousels = [];
    },
  };
}

function onMouseMove(e) {
  if (!cameraRef || !rendererRef) return;

  const canvas = rendererRef.domElement;
  setRayFromEvent(e);
  const button = getButtonAtPointer();

  if (button) {
    hoveredButton = button;
    hoveredLink = null;
    hoveredCrt = null;
    canvas.classList.add('interactive-hover');
    return;
  }

  hoveredButton = null;
  const link = getPlaqueLinkAtPointer();

  if (link) {
    hoveredLink = link;
    hoveredCrt = null;
    canvas.classList.add('interactive-hover');
    return;
  }

  hoveredLink = null;
  const crt = getCrtAtPointer();

  if (crt) {
    hoveredCrt = crt;
    canvas.classList.add('interactive-hover');
  } else {
    hoveredCrt = null;
    clearHover(canvas);
  }
}

function setRayFromEvent(e) {
  mouse.x = (e.clientX / rendererRef.domElement.clientWidth) * 2 - 1;
  mouse.y = -(e.clientY / rendererRef.domElement.clientHeight) * 2 + 1;
  raycaster.setFromCamera(mouse, cameraRef);
}

function getButtonAtPointer() {
  const buttonHits = raycaster.intersectObjects(crtButtons, false);
  if (buttonHits.length === 0) return null;
  return buttonHits[0].object.userData.crtButton || null;
}

function getPlaqueLinkAtPointer() {
  const intersectMeshes = plaques.map(p => p.mesh);
  const hits = raycaster.intersectObjects(intersectMeshes);
  if (hits.length === 0) return null;

  const hit = hits[0];
  const plaqueObj = plaques.find(p => p.mesh === hit.object);
  if (!plaqueObj || !hit.uv) return null;

  for (const zone of plaqueObj.linkZones) {
    if (
      hit.uv.x >= zone.xMin && hit.uv.x <= zone.xMax &&
      hit.uv.y >= zone.yMin && hit.uv.y <= zone.yMax
    ) {
      return { plaqueObj, zone };
    }
  }

  return null;
}

function clearHover(canvas) {
  hoveredLink = null;
  hoveredButton = null;
  hoveredCrt = null;
  if (canvas) canvas.classList.remove('interactive-hover');
}

function getProjectUrl(project) {
  if (!project || !project.links || project.links.length === 0) return null;

  // 1. Try to find 'Website'
  const websiteLink = project.links.find(l => l.label.toLowerCase() === 'website');
  if (websiteLink) return websiteLink.url;

  // 2. Try to find 'itch.io'
  const itchLink = project.links.find(l => l.label.toLowerCase() === 'itch.io');
  if (itchLink) return itchLink.url;

  // 3. Fallback to any link (e.g. GitHub, YouTube, etc.)
  return project.links[0].url;
}

function getCrtAtPointer() {
  if (carousels.length === 0) return null;
  const groups = carousels.map(c => c.group);
  const hits = raycaster.intersectObjects(groups, true);
  if (hits.length === 0) return null;

  const hit = hits[0];
  // Find which carousel contains this intersected object
  let current = hit.object;
  while (current) {
    const found = carousels.find(c => c.group === current);
    if (found && found.cd && found.cd.project) {
      return found;
    }
    current = current.parent;
  }
  return null;
}

function onClick(e) {
  if (!cameraRef || !rendererRef) return;
  setRayFromEvent(e);

  const clickedButton = getButtonAtPointer();
  if (clickedButton) {
    clickedButton.onClick();
    hoveredButton = null;
    return;
  }

  const clickedLink = getPlaqueLinkAtPointer();
  if (clickedLink) {
    window.open(clickedLink.zone.url, '_blank', 'noopener');
    hoveredLink = null;
    return;
  }

  const clickedCrt = getCrtAtPointer();
  if (clickedCrt) {
    const url = getProjectUrl(clickedCrt.cd.project);
    if (url) {
      window.open(url, '_blank', 'noopener');
    }
    hoveredCrt = null;
    return;
  }

  if (hoveredButton) {
    hoveredButton.onClick();
    hoveredButton = null;
    return;
  }

  if (hoveredLink) {
    window.open(hoveredLink.zone.url, '_blank', 'noopener');
    hoveredLink = null;
    return;
  }

  if (hoveredCrt) {
    const url = getProjectUrl(hoveredCrt.cd.project);
    if (url) {
      window.open(url, '_blank', 'noopener');
    }
    hoveredCrt = null;
  }
}
