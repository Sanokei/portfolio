// main.js — Entry point
// Bootstraps the Three.js scene and kicks off the animation loop.
// CSG computation and full scene assembly happen here so we can
// drive the loading bar from one place.

import { initScene, resizeRenderer } from './scene.js';

async function main() {
  // Check WebGL support
  const hasWebGL = (() => {
    try {
      const c = document.createElement('canvas');
      return !!(window.WebGLRenderingContext &&
        (c.getContext('webgl') || c.getContext('experimental-webgl')));
    } catch { return false; }
  })();

  if (!hasWebGL) {
    // Redirect to static fallback
    window.location.href = './modern/index.html';
    return;
  }

  const { scene, camera, renderer } = initScene();

  // Placeholder — scene assembly comes in later tasks
  // For now just render an empty frame to prove WebGL works

  function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
  }

  window.addEventListener('resize', () => resizeRenderer(renderer, camera));

  // Hide loading screen after a short delay (placeholder behavior)
  setTimeout(() => {
    document.getElementById('loading-screen').classList.add('hidden');
  }, 500);

  animate();
  console.log('Three.js scene initialized');
}

main();
