// scene.js — Three.js scene, camera, renderer, and lighting setup.
// Exports initScene() which returns { scene, camera, renderer }.
// Also exports resizeRenderer() for the window resize handler.

import * as THREE from 'three';

export function initScene() {
  // ── Renderer ─────────────────────────────────────────
  const renderer = new THREE.WebGLRenderer({
    canvas: document.getElementById('canvas'),
    antialias: true,
    alpha: false,
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  // ── Scene ────────────────────────────────────────────
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x1a1a1a);
  scene.fog = new THREE.Fog(0x1a1a1a, 15, 60);

  // ── Camera ───────────────────────────────────────────
  const camera = new THREE.PerspectiveCamera(
    55,                                       // FOV
    window.innerWidth / window.innerHeight,    // aspect
    0.5,                                      // near
    80,                                       // far
  );
  camera.position.set(0, 4, 6);  // eye level, 6m from wall
  camera.lookAt(0, 4, 0);

  // ── Lighting ─────────────────────────────────────────
  // Soft ambient fill
  const ambient = new THREE.AmbientLight(0xffe8d0, 0.4);
  scene.add(ambient);

  // Hemisphere for subtle sky/ground color variation
  const hemi = new THREE.HemisphereLight(0xffeedd, 0x3a2a1a, 0.3);
  scene.add(hemi);

  // Warm directional key light (sun-like, from above-right)
  const key = new THREE.DirectionalLight(0xffd4a0, 1.5);
  key.position.set(20, 12, 4);
  key.castShadow = true;
  key.shadow.mapSize.width = 2048;
  key.shadow.mapSize.height = 2048;
  key.shadow.camera.near = 0.5;
  key.shadow.camera.far = 80;
  key.shadow.camera.left = -30;
  key.shadow.camera.right = 30;
  key.shadow.camera.top = 10;
  key.shadow.camera.bottom = -2;
  key.shadow.bias = -0.0001;
  scene.add(key);

  return { scene, camera, renderer };
}

/** Call on window resize to keep renderer and camera in sync. */
export function resizeRenderer(renderer, camera) {
  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
}

/**
 * Create a warm spotlight for positioning above a cavity.
 * Returns a THREE.SpotLight ready to be added to the scene.
 */
export function createSpotlight(x, y, z) {
  const spot = new THREE.SpotLight(0xffd4a0, 2, 8, Math.PI / 5, 0.3, 0.5);
  spot.position.set(x, y, z);
  spot.castShadow = true;
  spot.shadow.mapSize.width = 512;
  spot.shadow.mapSize.height = 512;
  spot.shadow.bias = -0.0005;
  return spot;
}

/**
 * Create a subtle point light for inside a cavity (glow effect).
 */
export function createCavityLight(x, y, z) {
  const light = new THREE.PointLight(0xfff5e8, 0.6, 3);
  light.position.set(x, y, z);
  return light;
}
