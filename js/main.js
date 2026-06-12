// main.js — Entry point
// Bootstraps the Three.js scene, builds the CSG wall,
// then runs the animation loop.

import { initScene, resizeRenderer } from './scene.js';
import { buildWall } from './wall.js';
import { projects, categoryOrder } from './projects.js';

async function main() {
  const hasWebGL = (() => {
    try {
      const c = document.createElement('canvas');
      return !!(window.WebGLRenderingContext &&
        (c.getContext('webgl') || c.getContext('experimental-webgl')));
    } catch { return false; }
  })();

  if (!hasWebGL) {
    window.location.href = './modern/index.html';
    return;
  }

  const { scene, camera, renderer } = initScene();

  // Build the wall with CSG cavities
  const { wallGroup, cavityData } = await buildWall(scene, projects, categoryOrder);

  // Store cavity data globally so scroll.js and other modules can use it
  window.__cavityData = cavityData;
  window.__wallGroup = wallGroup;

  // Determine scroll bounds from cavity positions
  const firstX = cavityData[0].worldX;
  const lastX = cavityData[cavityData.length - 1].worldX;
  const scrollMinX = firstX - 5;
  const scrollMaxX = lastX + 5;
  window.__scrollBounds = { min: scrollMinX, max: scrollMaxX };

  // Start camera at the first cavity
  camera.position.set(firstX, 4, 6);
  camera.lookAt(firstX, 4, 0);

  // Animation loop
  let lastTime = performance.now();
  function animate(now) {
    requestAnimationFrame(animate);

    const dt = Math.min((now - lastTime) / 1000, 0.1);
    lastTime = now;

    // TODO: scroll.js camera update will hook in here

    renderer.render(scene, camera);
  }

  window.addEventListener('resize', () => resizeRenderer(renderer, camera));

  // Hide loading screen
  const loadingEl = document.getElementById('loading-screen');
  if (loadingEl) loadingEl.classList.add('hidden');

  console.log(`Wall built with ${cavityData.length} cavities`);

  requestAnimationFrame(animate);
}

main();
