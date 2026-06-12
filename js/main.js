// main.js - Entry point
// Bootstraps the Three.js scene, builds the plaster wall,
// then runs the animation loop.

import * as THREE from 'three';
import { initScene, positionCamera, resizeRenderer } from './scene.js?v=rough-wall-8';
import { buildWall } from './wall.js?v=rough-wall-8';
import { projects, categoryOrder } from './projects.js?v=rough-wall-8';
import { initScroll, setBounds, setTargetY } from './scroll.js?v=rough-wall-8';
import { buildCarousels } from './carousel.js?v=rough-wall-8';
import { buildHeaderPlaque, buildProjectPlaques } from './plaque.js?v=rough-wall-8';
import { buildEnvironment } from './environment.js?v=rough-wall-8';
import { initInteractions } from './interactions.js?v=rough-wall-8';
import { getLayoutMetrics } from './layout.js?v=rough-wall-8';

function disposeObjectGeometries(root) {
  root.traverse((object) => {
    if (object.geometry) object.geometry.dispose();
  });
}

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
  let root = null;
  let interactionCtrl = null;
  let carouselCtrl = { update() {}, dispose() {} };
  let environmentCtrl = { update() {} };
  let scrollCtrl = null;
  let buildToken = 0;

  async function rebuildScene(initial = false) {
    const token = ++buildToken;
    const nextRoot = new THREE.Group();
    nextRoot.name = 'responsive-portfolio-root';
    nextRoot.visible = false;
    scene.add(nextRoot);

    const { cavityData } = await buildWall(nextRoot, projects, categoryOrder);
    if (token !== buildToken) {
      scene.remove(nextRoot);
      disposeObjectGeometries(nextRoot);
      return;
    }

    const nextCarouselCtrl = buildCarousels(nextRoot, cavityData);
    buildHeaderPlaque(nextRoot);
    const plaqueObjects = buildProjectPlaques(nextRoot, cavityData);
    const nextEnvironmentCtrl = buildEnvironment(nextRoot, projects, categoryOrder);
    const metrics = getLayoutMetrics();

    interactionCtrl?.dispose();
    carouselCtrl.dispose();
    if (root) {
      scene.remove(root);
      disposeObjectGeometries(root);
    }

    root = nextRoot;
    carouselCtrl = nextCarouselCtrl;
    environmentCtrl = nextEnvironmentCtrl;
    interactionCtrl = initInteractions(camera, renderer, plaqueObjects, nextCarouselCtrl.buttons);
    root.visible = true;

    const lastY = cavityData[cavityData.length - 1].worldY;
    const minY = lastY - 2.5;
    const maxY = metrics.headerY;
    setBounds(minY, maxY);

    const desiredY = initial ? metrics.headerY : camera.position.y;
    const cameraY = THREE.MathUtils.clamp(desiredY, minY, maxY);
    positionCamera(camera, cameraY);
    setTargetY(cameraY);
    environmentCtrl.update(cameraY);
  }

  await rebuildScene(true);
  scrollCtrl = initScroll(camera);

  let lastTime = performance.now();
  function animate(now) {
    requestAnimationFrame(animate);

    const dt = Math.min((now - lastTime) / 1000, 0.1);
    lastTime = now;

    if (scrollCtrl) scrollCtrl.update(dt);
    environmentCtrl.update(camera.position.y);
    carouselCtrl.update(dt, camera.position.y);

    renderer.render(scene, camera);
  }

  let resizeTimer = null;
  window.addEventListener('resize', () => {
    resizeRenderer(renderer, camera);
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => {
      rebuildScene(false);
    }, 160);
  });

  const loadingEl = document.getElementById('loading-screen');
  if (loadingEl) loadingEl.classList.add('hidden');

  console.log('Responsive wall scene built');

  requestAnimationFrame(animate);
}

main();
