// scroll.js - Vertical wall scroll camera controller.

import * as THREE from 'three';

const SCROLL_SENSITIVITY = 0.015;
const EASING = 0.08;
const DRAG_THRESHOLD_PX = 4;
const SNAP_IDLE_MS = 1750;
const SNAP_DIRECTION_TIE_RATIO = 0.15;
const SCROLL_DIRECTION_UP = 1;
const SCROLL_DIRECTION_DOWN = -1;
export const SCROLL_INPUT_EVENT = 'portfolio-scroll-input';

let targetY = 0;
let bounds = { min: -25, max: 8 };
let snapPoints = [];
let snapActivationMaxY = Number.NEGATIVE_INFINITY;
let snapActivationMinY = Number.NEGATIVE_INFINITY;
let snapIdleTimer = null;
let cameraRef = null;
let dragSurface = null;
let activePointerId = null;
let dragStartY = 0;
let dragStartTarget = 0;
let isPointerDown = false;
let hasDragged = false;
let isTouching = false;
let hasTouchScrolled = false;
let suppressNextClick = false;
let clickSuppressTimer = null;
let styleEl = null;
let lastScrollDirection = 0;

function onWheel(e) {
  e.preventDefault();
  setTargetYFromScroll(targetY - e.deltaY * SCROLL_SENSITIVITY);
  handleScrollInput();
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

export function setSnapPoints(points, activationMaxY, activationMinY) {
  snapPoints = [...points]
    .filter(Number.isFinite)
    .sort((a, b) => b - a);
  snapActivationMaxY = Number.isFinite(activationMaxY)
    ? activationMaxY
    : Number.NEGATIVE_INFINITY;
  snapActivationMinY = Number.isFinite(activationMinY)
    ? activationMinY
    : Number.NEGATIVE_INFINITY;
  clearSnapTimer();
}

export function initScroll(camera, surface = document.getElementById('canvas')) {
  cameraRef = camera;
  dragSurface = surface;
  targetY = camera.position.y;

  window.addEventListener('wheel', onWheel, { passive: false });
  window.addEventListener('pointermove', onPointerMove, { passive: false });
  window.addEventListener('pointerup', onPointerEnd);
  window.addEventListener('pointercancel', onPointerEnd);
  window.addEventListener('click', onClickCapture, true);

  if (dragSurface) {
    dragSurface.classList.add('drag-scroll-enabled');
    dragSurface.addEventListener('pointerdown', onPointerDown);
    ensureDragStyles();
  }

  let touchStartY = 0;
  let touchStartTarget = 0;

  window.addEventListener('touchstart', (e) => {
    if (e.touches.length === 1) {
      touchStartY = e.touches[0].clientY;
      touchStartTarget = targetY;
      isTouching = true;
      hasTouchScrolled = false;
    }
  }, { passive: true });

  window.addEventListener('touchmove', (e) => {
    if (e.touches.length === 1) {
      const dy = touchStartY - e.touches[0].clientY;
      setTargetYFromScroll(touchStartTarget - dy * SCROLL_SENSITIVITY);
      hasTouchScrolled = true;
      handleScrollInput();
    }
  }, { passive: true });

  const onTouchEnd = () => {
    if (hasTouchScrolled) queueSnapToProject();
    isTouching = false;
    hasTouchScrolled = false;
  };
  window.addEventListener('touchend', onTouchEnd);
  window.addEventListener('touchcancel', onTouchEnd);

  return {
    update(dt) {
      if (!cameraRef) return;
      const frameEasing = 1 - Math.pow(1 - EASING, dt * 60);
      cameraRef.position.y += (targetY - cameraRef.position.y) * frameEasing;
      cameraRef.lookAt(0, cameraRef.position.y, 0);
    },
  };
}

function onPointerDown(e) {
  if (e.pointerType && e.pointerType !== 'mouse') return;
  if (e.button !== 0) return;

  activePointerId = e.pointerId;
  dragStartY = e.clientY;
  dragStartTarget = targetY;
  isPointerDown = true;
  hasDragged = false;

  if (dragSurface?.setPointerCapture) {
    try {
      dragSurface.setPointerCapture(e.pointerId);
    } catch {}
  }
}

function onPointerMove(e) {
  if (!isPointerDown || e.pointerId !== activePointerId) return;

  const dy = dragStartY - e.clientY;
  if (!hasDragged && Math.abs(dy) < DRAG_THRESHOLD_PX) return;

  hasDragged = true;
  dragSurface?.classList.add('drag-scroll-active');
  e.preventDefault();

  setTargetYFromScroll(dragStartTarget - dy * SCROLL_SENSITIVITY);
  handleScrollInput();
}

function onPointerEnd(e) {
  if (!isPointerDown || e.pointerId !== activePointerId) return;

  if (hasDragged) {
    e.preventDefault();
    queueClickSuppression();
    queueSnapToProject();
  }

  if (dragSurface?.releasePointerCapture) {
    try {
      dragSurface.releasePointerCapture(activePointerId);
    } catch {}
  }

  activePointerId = null;
  isPointerDown = false;
  hasDragged = false;
  dragSurface?.classList.remove('drag-scroll-active');
}

function onClickCapture(e) {
  if (!suppressNextClick) return;

  window.clearTimeout(clickSuppressTimer);
  clickSuppressTimer = null;
  suppressNextClick = false;
  e.preventDefault();
  e.stopImmediatePropagation();
}

function queueClickSuppression() {
  suppressNextClick = true;
  window.clearTimeout(clickSuppressTimer);
  clickSuppressTimer = window.setTimeout(() => {
    suppressNextClick = false;
    clickSuppressTimer = null;
  }, 350);
}

function handleScrollInput() {
  emitScrollInput();
  queueSnapToProject();
}

function emitScrollInput() {
  window.dispatchEvent(new Event(SCROLL_INPUT_EVENT));
}

function setTargetYFromScroll(nextTargetY) {
  const previousTargetY = targetY;
  targetY = THREE.MathUtils.clamp(nextTargetY, bounds.min, bounds.max);

  const deltaY = targetY - previousTargetY;
  if (Math.abs(deltaY) < Number.EPSILON) return;

  lastScrollDirection = deltaY < 0
    ? SCROLL_DIRECTION_DOWN
    : SCROLL_DIRECTION_UP;
}

function queueSnapToProject() {
  clearSnapTimer();
  snapIdleTimer = window.setTimeout(() => {
    snapIdleTimer = null;
    snapToNearestProject();
  }, SNAP_IDLE_MS);
}

function clearSnapTimer() {
  window.clearTimeout(snapIdleTimer);
  snapIdleTimer = null;
}

function snapToNearestProject() {
  if (isPointerDown || isTouching) return;
  if (!snapPoints.length || targetY > snapActivationMaxY || targetY < snapActivationMinY) return;

  const nearest = getDirectionalNearestSnapPoint(targetY);

  targetY = THREE.MathUtils.clamp(nearest, bounds.min, bounds.max);
}

function getDirectionalNearestSnapPoint(centerY) {
  if (snapPoints.length === 1) return snapPoints[0];

  let nearest = snapPoints[0];
  let nearestDistance = Math.abs(nearest - centerY);
  let secondNearest = null;
  let secondNearestDistance = Number.POSITIVE_INFINITY;

  for (let i = 1; i < snapPoints.length; i++) {
    const point = snapPoints[i];
    const distance = Math.abs(point - centerY);

    if (distance < nearestDistance) {
      secondNearest = nearest;
      secondNearestDistance = nearestDistance;
      nearest = point;
      nearestDistance = distance;
    } else if (distance < secondNearestDistance) {
      secondNearest = point;
      secondNearestDistance = distance;
    }
  }

  if (secondNearest === null || lastScrollDirection === 0) return nearest;

  const pairGap = Math.abs(nearest - secondNearest);
  const distanceDifference = Math.abs(nearestDistance - secondNearestDistance);
  const isDirectionalTie = pairGap > 0 &&
    distanceDifference / pairGap < SNAP_DIRECTION_TIE_RATIO;

  if (!isDirectionalTie) return nearest;

  return lastScrollDirection === SCROLL_DIRECTION_DOWN
    ? Math.min(nearest, secondNearest)
    : Math.max(nearest, secondNearest);
}

function ensureDragStyles() {
  if (styleEl) return;

  styleEl = document.createElement('style');
  styleEl.textContent = `
    canvas.drag-scroll-enabled { cursor: grab; }
    canvas.drag-scroll-enabled.interactive-hover { cursor: pointer; }
    canvas.drag-scroll-active,
    canvas.drag-scroll-active.interactive-hover { cursor: grabbing; }
  `;
  document.head.appendChild(styleEl);
}
