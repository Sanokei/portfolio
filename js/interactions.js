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
let focusCtrlRef = null;
let hoveredLink = null;
let hoveredButton = null;
let hoveredCrt = null;
let styleEl = null;

export function initInteractions(camera, renderer, plaqueObjects, buttonObjects = [], carouselObjects = [], focusCtrl = null) {
  cameraRef = camera;
  rendererRef = renderer;
  plaques = plaqueObjects;
  crtButtons = buttonObjects;
  carousels = carouselObjects;
  focusCtrlRef = focusCtrl;

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
      focusCtrlRef = null;
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
  const hit = getPlaqueHit();
  if (!hit) return null;

  const { plaqueObj, uv } = hit;
  if (!uv) return null;

  for (const zone of plaqueObj.linkZones) {
    if (
      uv.x >= zone.xMin && uv.x <= zone.xMax &&
      uv.y >= zone.yMin && uv.y <= zone.yMax
    ) {
      return { plaqueObj, zone };
    }
  }

  return null;
}

// Any plaque mesh under the pointer — regardless of link zone.  Used to
// detect body taps that should trigger plaque focus on mobile.
function getPlaqueAtPointer() {
  return getPlaqueHit();
}

function getPlaqueHit() {
  const intersectMeshes = plaques.map(p => p.mesh);
  const hits = raycaster.intersectObjects(intersectMeshes);
  if (hits.length === 0) return null;

  const hit = hits[0];
  const plaqueObj = plaques.find(p => p.mesh === hit.object);
  if (!plaqueObj) return null;
  return { plaqueObj, uv: hit.uv };
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

  // ── Focused plaque mode ──────────────────────────────────────
  // While a plaque is focused, a tap on that plaque's link still
  // opens the URL; a tap on its body keeps focus; anything else
  // (backdrop, another plaque, CRT, empty space) dismisses focus.
  if (focusCtrlRef && focusCtrlRef.isFocused()) {
    const focusedPlaque = focusCtrlRef.getFocusedPlaque();
    const link = getPlaqueLinkAtPointer();
    if (link && link.plaqueObj === focusedPlaque) {
      window.open(link.zone.url, '_blank', 'noopener');
      hoveredLink = null;
      return;
    }
    const plaqueHit = getPlaqueAtPointer();
    if (plaqueHit && plaqueHit.plaqueObj === focusedPlaque) {
      // Body tap on the focused plaque — keep it focused.
      return;
    }
    focusCtrlRef.dismiss('clickout');
    hoveredLink = null;
    hoveredButton = null;
    hoveredCrt = null;
    return;
  }

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

  // Plaque body tap (no link) on a stacked/mobile plaque → focus it.
  const plaqueHit = getPlaqueAtPointer();
  if (plaqueHit && focusCtrlRef) {
    focusCtrlRef.focus(plaqueHit.plaqueObj);
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
