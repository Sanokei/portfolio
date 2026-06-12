// scroll.js — Scroll-to-walk camera controller.
//
// Exports:
//   initScroll(camera) → { update(dt) }
//     Call update(dt) each frame. It lerps camera.position.x toward
//     the accumulated scroll target, clamped to wall bounds.
//
//   getTargetX() → number
//   setBounds(minX, maxX)

import * as THREE from 'three';

const SCROLL_SENSITIVITY = 0.015;  // world units per scroll pixel
const EASING = 0.08;               // lerp factor per frame (60fps baseline)

let targetX = 0;
let bounds = { min: -25, max: 25 };
let cameraRef = null;

function onWheel(e) {
  e.preventDefault();
  const delta = e.deltaY * SCROLL_SENSITIVITY;
  targetX += delta;
  // Clamp
  targetX = THREE.MathUtils.clamp(targetX, bounds.min, bounds.max);
}

export function setBounds(minX, maxX) {
  bounds.min = minX;
  bounds.max = maxX;
  targetX = THREE.MathUtils.clamp(targetX, bounds.min, bounds.max);
}

export function getTargetX() {
  return targetX;
}

export function setTargetX(x) {
  targetX = THREE.MathUtils.clamp(x, bounds.min, bounds.max);
}

export function initScroll(camera) {
  cameraRef = camera;
  targetX = camera.position.x;

  window.addEventListener('wheel', onWheel, { passive: false });

  // Touch support: treat single-finger vertical swipe as scroll
  let touchStartY = 0;
  let touchStartTarget = 0;

  window.addEventListener('touchstart', (e) => {
    if (e.touches.length === 1) {
      touchStartY = e.touches[0].clientY;
      touchStartTarget = targetX;
    }
  }, { passive: true });

  window.addEventListener('touchmove', (e) => {
    if (e.touches.length === 1) {
      const dy = touchStartY - e.touches[0].clientY;
      targetX = THREE.MathUtils.clamp(
        touchStartTarget + dy * SCROLL_SENSITIVITY,
        bounds.min,
        bounds.max,
      );
    }
  }, { passive: true });

  return {
    /**
     * Call every frame. Returns the new camera X after easing.
     */
    update(dt) {
      if (!cameraRef) return;
      const frameEasing = 1 - Math.pow(1 - EASING, dt * 60); // frame-rate independent
      cameraRef.position.x += (targetX - cameraRef.position.x) * frameEasing;
      cameraRef.lookAt(cameraRef.position.x, 4, 0);
    },
  };
}
