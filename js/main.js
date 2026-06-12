// main.js — Entry point
// Bootstraps the Three.js scene, builds the plaster wall,
// then runs the animation loop.

import { initScene, positionCamera, resizeRenderer } from './scene.js?v=plain-wall-2';
import { buildWall } from './wall.js?v=plain-wall-2';
import { projects, categoryOrder } from './projects.js?v=plain-wall-2';
import { initScroll, setBounds } from './scroll.js?v=plain-wall-2';
import { buildCarousels } from './carousel.js?v=plain-wall-2';
import { buildHeaderPlaque, buildProjectPlaques } from './plaque.js?v=plain-wall-2';
import { buildEnvironment } from './environment.js?v=plain-wall-2';
import { initInteractions } from './interactions.js?v=plain-wall-2';
import { isMobileLayout } from './layout.js?v=plain-wall-2';

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
  let mobileLayout = isMobileLayout();

  // Build the wall with physical openings
  const { wallGroup, cavityData } = await buildWall(scene, projects, categoryOrder);

  // Build carousels inside cavities
  const { update: updateCarousels } = buildCarousels(scene, cavityData);

  buildHeaderPlaque(scene);
  const plaqueObjects = buildProjectPlaques(scene, cavityData);

  buildEnvironment(scene, projects, categoryOrder);

  initInteractions(camera, renderer, plaqueObjects);

  const firstY = cavityData[0].worldY;
  const lastY = cavityData[cavityData.length - 1].worldY;
  setBounds(lastY - 2.5, firstY + 4.2);

  positionCamera(camera, firstY + 3.5);

  const scrollCtrl = initScroll(camera);

  // Animation loop
  let lastTime = performance.now();
  function animate(now) {
    requestAnimationFrame(animate);

    const dt = Math.min((now - lastTime) / 1000, 0.1);
    lastTime = now;

    scrollCtrl.update(dt);
    updateCarousels(dt, camera.position.y);

    renderer.render(scene, camera);
  }

  window.addEventListener('resize', () => {
    resizeRenderer(renderer, camera);
    const nextMobileLayout = isMobileLayout();
    if (nextMobileLayout !== mobileLayout) {
      mobileLayout = nextMobileLayout;
      window.location.reload();
    }
  });

  // Hide loading screen
  const loadingEl = document.getElementById('loading-screen');
  if (loadingEl) loadingEl.classList.add('hidden');

  console.log(`Wall built with ${cavityData.length} cavities`);

  requestAnimationFrame(animate);
}

main();
