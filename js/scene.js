// scene.js - Three.js renderer, camera, and gallery lighting.

import * as THREE from 'three';

function getCameraZ() {
  const aspect = window.innerWidth / Math.max(window.innerHeight, 1);
  if (aspect < 0.68) return 7.2;
  if (aspect < 1.0) return 6.25;
  return 4.65;
}

export function positionCamera(camera, y) {
  camera.position.set(0, y, getCameraZ());
  camera.lookAt(0, y, 0);
}

export function initScene() {
  const renderer = new THREE.WebGLRenderer({
    canvas: document.getElementById('canvas'),
    antialias: true,
    alpha: false,
    powerPreference: 'high-performance',
  });
  renderer.setPixelRatio(getPixelRatio());
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = false;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.28;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xf2eee6);
  scene.fog = new THREE.Fog(0xf2eee6, 20, 62);

  const camera = new THREE.PerspectiveCamera(
    50,
    window.innerWidth / window.innerHeight,
    0.35,
    80,
  );
  positionCamera(camera, 3.55);

  const ambient = new THREE.AmbientLight(0xfff8ef, 0.68);
  scene.add(ambient);

  const hemi = new THREE.HemisphereLight(0xffffff, 0xb8ad9f, 0.48);
  scene.add(hemi);

  const key = new THREE.DirectionalLight(0xfff0d8, 0.72);
  key.position.set(14, 10, 6);
  key.castShadow = false;
  scene.add(key);

  return { scene, camera, renderer };
}

export function resizeRenderer(renderer, camera) {
  renderer.setPixelRatio(getPixelRatio());
  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  positionCamera(camera, camera.position.y);
}

function getPixelRatio() {
  if (window.innerWidth <= 760) return Math.min(window.devicePixelRatio, 1.15);
  return Math.min(window.devicePixelRatio, 1.35);
}
