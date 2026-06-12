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
let hoveredLink = null;

export function initInteractions(camera, renderer, plaqueObjects) {
  cameraRef = camera;
  rendererRef = renderer;
  plaques = plaqueObjects;

  window.addEventListener('mousemove', onMouseMove);
  window.addEventListener('click', onClick);

  const styleEl = document.createElement('style');
  styleEl.textContent = `
    canvas { cursor: default; }
    canvas.interactive-hover { cursor: pointer; }
  `;
  document.head.appendChild(styleEl);

  return {
    update() {},
    dispose() {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('click', onClick);
    },
  };
}

function onMouseMove(e) {
  if (!cameraRef || !rendererRef) return;

  mouse.x = (e.clientX / rendererRef.domElement.clientWidth) * 2 - 1;
  mouse.y = -(e.clientY / rendererRef.domElement.clientHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, cameraRef);

  const intersectMeshes = plaques.map(p => p.mesh);
  const hits = raycaster.intersectObjects(intersectMeshes);
  const canvas = rendererRef.domElement;

  if (hits.length > 0) {
    const hit = hits[0];
    const plaqueObj = plaques.find(p => p.mesh === hit.object);
    if (!plaqueObj) { clearHover(canvas); return; }

    const uv = hit.uv;
    if (!uv) { clearHover(canvas); return; }

    let found = null;
    for (const zone of plaqueObj.linkZones) {
      if (
        uv.x >= zone.xMin && uv.x <= zone.xMax &&
        uv.y >= zone.yMin && uv.y <= zone.yMax
      ) {
        found = { plaqueObj, zone };
        break;
      }
    }

    if (found) {
      if (hoveredLink !== found) {
        hoveredLink = found;
        canvas.classList.add('interactive-hover');
      }
    } else {
      clearHover(canvas);
    }
  } else {
    clearHover(canvas);
  }
}

function clearHover(canvas) {
  hoveredLink = null;
  if (canvas) canvas.classList.remove('interactive-hover');
}

function onClick(e) {
  if (hoveredLink) {
    window.open(hoveredLink.zone.url, '_blank', 'noopener');
    hoveredLink = null;
  }
}
