// main.js — Entry point
// Bootstraps the Three.js scene, builds the CSG wall,
// then runs the animation loop.

import { initScene, resizeRenderer } from './scene.js';
import { buildWall } from './wall.js';
import { projects, categoryOrder } from './projects.js';
import { initScroll, setBounds } from './scroll.js';
import { buildCarousels } from './carousel.js';
import { buildHeaderPlaque, buildProjectPlaques } from './plaque.js';
import { buildEnvironment } from './environment.js';
import { initInteractions } from './interactions.js';

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

  // Build carousels inside cavities
  const { update: updateCarousels } = buildCarousels(scene, cavityData);

  buildHeaderPlaque(scene);
  const plaqueObjects = buildProjectPlaques(scene, cavityData);

  buildEnvironment(scene, projects, categoryOrder);

  initInteractions(camera, renderer, plaqueObjects);

  // Determine scroll bounds from cavity positions
  const firstX = cavityData[0].worldX;
  const lastX = cavityData[cavityData.length - 1].worldX;
  setBounds(firstX - 5, lastX + 5);

  // Start camera at the first cavity
  camera.position.set(firstX, 4, 3.5);
  camera.lookAt(firstX, 4, 0);

  const scrollCtrl = initScroll(camera);

  // Animation loop
  let lastTime = performance.now();
  function animate(now) {
    requestAnimationFrame(animate);

    const dt = Math.min((now - lastTime) / 1000, 0.1);
    lastTime = now;

    scrollCtrl.update(dt);
    updateCarousels(dt, camera.position.x);

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
