// plaqueFocus.js — Tap-to-focus for stacked (mobile) project plaques.
//
// On narrow screens plaques sit directly below the cavity and are too
// small to read.  Tapping a plaque lifts it toward the camera, centered
// and scaled up, with a dimmed backdrop.  Scrolling or clicking outside
// dismisses the focus — the dismiss transition applies a brief CSS blur
// to the canvas ("scrolling blurs it") as the plaque returns home.
//
// Exports:
//   initPlaqueFocus(scene, camera, renderer, plaqueObjects)
//     → { update(dt), focus(plaqueObj), dismiss(reason), isFocused(), dispose() }

import * as THREE from 'three';
import { SCROLL_INPUT_EVENT, setTargetY } from './scroll.js';

const EASING = 0.16;
const FOV = 50;                   // matches CAMERA_FOV in layout.js
const FOCUS_DISTANCE = 2.0;       // plaque sits this far in front of the camera
const BACKDROP_DISTANCE = 2.6;    // backdrop behind the plaque, in front of the wall
const FOCUS_OCCUPANCY = 0.88;     // plaque fills this fraction of the viewport
const BACKDROP_OPACITY = 0.62;
const BLUR_PX = 5;
const EPS = 0.001;
const STACKED_X_MAX = 0.15;       // |plaque.x| below this ⇒ stacked/mobile layout

let sceneRef = null;
let cameraRef = null;
let rendererRef = null;
let plaques = [];
let backdrop = null;
let focused = null;       // { plaque, origPos, origScale, targetPos, targetScale, dismissing }
let scrollCancelArmed = false;

function isStacked(plaqueObj) {
  return plaqueObj && Math.abs(plaqueObj.mesh.position.x) < STACKED_X_MAX;
}

// Scale a plaque so it fills FOCUS_OCCUPANCY of the viewport at the focus
// plane.  Computed per-focus because plaque geometry height varies with
// objectScale and camera distance varies with aspect ratio — a fixed
// scalar would overflow on some phones and look tiny on others.
function computeFocusScale(mesh, origScale) {
  const params = mesh.geometry?.parameters;
  const plaqueW = (params?.width ?? 1) * origScale.x;
  const plaqueH = (params?.height ?? 1) * origScale.y;

  // Visible world span at the focus plane (FOV is vertical in three.js).
  const halfFov = (FOV * Math.PI / 180) / 2;
  const visibleH = 2 * Math.tan(halfFov) * FOCUS_DISTANCE;
  const aspect = Math.max(window.innerWidth / Math.max(window.innerHeight, 1), 0.1);
  const visibleW = visibleH * aspect;

  // Fit into FOCUS_OCCUPANCY of whichever axis is tighter.  On portrait
  // phones the plaque texture (1.46:1 landscape) is width-bound, so the
  // min() is what keeps it on-screen.
  const scaleByH = (visibleH * FOCUS_OCCUPANCY) / Math.max(plaqueH, EPS);
  const scaleByW = (visibleW * FOCUS_OCCUPANCY) / Math.max(plaqueW, EPS);
  return Math.min(scaleByH, scaleByW);
}

function ensureBackdrop() {
  if (backdrop) return backdrop;
  const geo = new THREE.PlaneGeometry(40, 40);
  const mat = new THREE.MeshBasicMaterial({
    color: 0x000000,
    transparent: true,
    opacity: 0,
    depthWrite: false,
  });
  backdrop = new THREE.Mesh(geo, mat);
  backdrop.renderOrder = 1;
  sceneRef.add(backdrop);
  return backdrop;
}

function clearBlur() {
  if (rendererRef?.domElement) rendererRef.domElement.style.filter = '';
}

function applyBlur() {
  if (rendererRef?.domElement) rendererRef.domElement.style.filter = `blur(${BLUR_PX}px)`;
}

function resetFocusedPlaque() {
  if (!focused) return;
  const { plaque, origPos, origScale } = focused;
  plaque.mesh.position.copy(origPos);
  plaque.mesh.scale.copy(origScale);
  focused = null;
}

export function initPlaqueFocus(scene, camera, renderer, plaqueObjects) {
  sceneRef = scene;
  cameraRef = camera;
  rendererRef = renderer;
  plaques = plaqueObjects || [];

  function onScrollInput() {
    if (!focused) return;
    // Cancel the camera scroll so the wall doesn't jump while the
    // plaque blurs out.  Only arm once per focus session.
    if (!scrollCancelArmed) {
      scrollCancelArmed = true;
      setTargetY(cameraRef.position.y);
    }
    dismiss('scroll');
  }

  window.addEventListener(SCROLL_INPUT_EVENT, onScrollInput);

  return {
    update(dt) {
      if (!focused) return;
      const { plaque, targetPos, targetScale, dismissing } = focused;
      const k = 1 - Math.pow(1 - EASING, dt * 60);

      plaque.mesh.position.lerp(targetPos, k);
      plaque.mesh.scale.lerp(targetScale, k);

      const bp = backdrop;
      if (bp) {
        // Keep the backdrop centered on the camera so it always fills
        // the view while the camera is held still during focus.
        bp.position.set(0, cameraRef.position.y, cameraRef.position.z - BACKDROP_DISTANCE);
        const targetOpacity = dismissing ? 0 : BACKDROP_OPACITY;
        bp.material.opacity += (targetOpacity - bp.material.opacity) * k;
        bp.visible = bp.material.opacity > 0.005;
      }

      const settled =
        plaque.mesh.position.distanceTo(targetPos) < EPS &&
        Math.abs(plaque.mesh.scale.x - targetScale.x) < EPS;

      if (dismissing) {
        applyBlur();
        if (settled && (!bp || bp.material.opacity < 0.01)) {
          clearBlur();
          resetFocusedPlaque();
          if (bp) bp.visible = false;
          scrollCancelArmed = false;
        }
      }
    },

    focus(plaqueObj) {
      if (!plaqueObj || !isStacked(plaqueObj)) return null;
      if (focused && focused.plaque === plaqueObj) return focused;

      // Switching focus: snap the previous one home instantly.
      if (focused) {
        clearBlur();
        resetFocusedPlaque();
      }

      const mesh = plaqueObj.mesh;
      const focusZ = cameraRef.position.z - FOCUS_DISTANCE;
      const origPos = mesh.position.clone();
      const origScale = mesh.scale.clone();
      const targetPos = new THREE.Vector3(0, cameraRef.position.y, focusZ);
      const targetScale = origScale.clone().multiplyScalar(computeFocusScale(mesh, origScale));

      ensureBackdrop();
      backdrop.position.set(0, cameraRef.position.y, cameraRef.position.z - BACKDROP_DISTANCE);
      backdrop.visible = true;

      focused = {
        plaque: plaqueObj,
        origPos,
        origScale,
        targetPos,
        targetScale,
        dismissing: false,
      };
      scrollCancelArmed = false;
      return focused;
    },

    dismiss() {
      if (!focused || focused.dismissing) return;
      focused.dismissing = true;
      focused.targetPos = focused.origPos.clone();
      focused.targetScale = focused.origScale.clone();
    },

    isFocused() {
      return !!focused;
    },

    getFocusedPlaque() {
      return focused ? focused.plaque : null;
    },

    dispose() {
      window.removeEventListener(SCROLL_INPUT_EVENT, onScrollInput);
      clearBlur();
      resetFocusedPlaque();
      if (backdrop) {
        sceneRef?.remove(backdrop);
        backdrop.geometry.dispose();
        backdrop.material.dispose();
        backdrop = null;
      }
      focused = null;
      scrollCancelArmed = false;
      sceneRef = null;
      cameraRef = null;
      rendererRef = null;
      plaques = [];
    },
  };
}
