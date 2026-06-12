// scroll.js - Vertical wall scroll camera controller.

import * as THREE from 'three';

const SCROLL_SENSITIVITY = 0.015;
const EASING = 0.08;

let targetY = 0;
let bounds = { min: -25, max: 8 };
let cameraRef = null;

function onWheel(e) {
  e.preventDefault();
  targetY -= e.deltaY * SCROLL_SENSITIVITY;
  targetY = THREE.MathUtils.clamp(targetY, bounds.min, bounds.max);
}

export function setBounds(minY, maxY) {
  bounds.min = minY;
  bounds.max = maxY;
  targetY = THREE.MathUtils.clamp(targetY, bounds.min, bounds.max);
}

export function getTargetY() {
  return targetY;
}

export function setTargetY(y) {
  targetY = THREE.MathUtils.clamp(y, bounds.min, bounds.max);
}

export function initScroll(camera) {
  cameraRef = camera;
  targetY = camera.position.y;

  window.addEventListener('wheel', onWheel, { passive: false });

  let touchStartY = 0;
  let touchStartTarget = 0;

  window.addEventListener('touchstart', (e) => {
    if (e.touches.length === 1) {
      touchStartY = e.touches[0].clientY;
      touchStartTarget = targetY;
    }
  }, { passive: true });

  window.addEventListener('touchmove', (e) => {
    if (e.touches.length === 1) {
      const dy = touchStartY - e.touches[0].clientY;
      targetY = THREE.MathUtils.clamp(
        touchStartTarget - dy * SCROLL_SENSITIVITY,
        bounds.min,
        bounds.max,
      );
    }
  }, { passive: true });

  return {
    update(dt) {
      if (!cameraRef) return;
      const frameEasing = 1 - Math.pow(1 - EASING, dt * 60);
      cameraRef.position.y += (targetY - cameraRef.position.y) * frameEasing;
      cameraRef.lookAt(0, cameraRef.position.y, 0);
    },
  };
}
