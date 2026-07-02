// main.js - Entry point
// Bootstraps the Three.js scene, builds the plaster wall,
// then runs the animation loop.

import * as THREE from 'three';
import { initScene, positionCamera, resizeRenderer } from './scene.js?v=minimal-loader';
import { buildWall, buildHeaderBackdrop } from './wall.js?v=minimal-loader';
import { buildWallDecals } from './decals.js?v=museum-signs';
import { projects, categoryOrder } from './projects.js?v=minimal-loader';
import { initScroll, SCROLL_INPUT_EVENT, setBounds, setSnapPoints, setTargetY } from './scroll.js?v=minimal-loader';
import { buildCarousels } from './carousel.js?v=minimal-loader';
import { buildHeaderPlaque, buildProjectPlaques } from './plaque.js?v=minimal-loader';
import { buildEnvironment } from './environment.js?v=taxi-rehail';
import { initInteractions } from './interactions.js?v=minimal-loader';
import { initPlaqueFocus } from './plaqueFocus.js';
import { getLayoutMetrics, buildModuleLayout } from './layout.js?v=ending-revamp';

const INTRO_TIMING = {
  loadingFadeMs: 750,
  postLoadingDelayMs: 300,
  letterboxMs: 1550,
  promptDelayMs: 120,
};

function disposeObjectGeometries(root) {
  root.traverse((object) => {
    if (object.geometry) object.geometry.dispose();
  });
}

async function main() {
  const { scene, camera, renderer } = initScene();
  let root = null;
  let interactionCtrl = null;
  let carouselCtrl = { update() {}, dispose() {} };
  let environmentCtrl = { update() {} };
  let scrollCtrl = null;
  let focusCtrl = null;
  let buildToken = 0;
  let lastProjectY = 0;
  let minScrollY = 0;

  // Loading progress bar helper.
  const loadingBar = document.getElementById('loading-bar-fill');

  function updateLoadingProgress(done, total) {
    if (loadingBar) {
      const pct = total > 0 ? (done / total) * 100 : 100;
      loadingBar.style.width = `${pct.toFixed(1)}%`;
    }
  }

  async function rebuildScene(initial = false) {
    const token = ++buildToken;
    const nextRoot = new THREE.Group();
    nextRoot.name = 'responsive-portfolio-root';
    nextRoot.visible = false;
    scene.add(nextRoot);

    const { cavityData } = await buildWall(nextRoot, projects, categoryOrder, updateLoadingProgress);
    if (token !== buildToken) {
      scene.remove(nextRoot);
      disposeObjectGeometries(nextRoot);
      return;
    }

    buildWallDecals(nextRoot, cavityData);
    const nextCarouselCtrl = buildCarousels(nextRoot, cavityData, camera, renderer);
    const nextEnvironmentCtrl = buildEnvironment(nextRoot, projects, categoryOrder, camera, renderer);
    const metrics = getLayoutMetrics();

    // Header backdrop — a solid plaster panel that fills the viewport
    // behind the title plaque, sized independently of the project wall.
    buildHeaderBackdrop(nextRoot, metrics);
    buildHeaderPlaque(nextRoot);
    const plaqueObjects = buildProjectPlaques(nextRoot, cavityData);

    interactionCtrl?.dispose();
    carouselCtrl.dispose();
    environmentCtrl.dispose?.();
    focusCtrl?.dispose();
    if (root) {
      scene.remove(root);
      disposeObjectGeometries(root);
    }

    root = nextRoot;
    carouselCtrl = nextCarouselCtrl;
    environmentCtrl = nextEnvironmentCtrl;
    focusCtrl = initPlaqueFocus(scene, camera, plaqueObjects);
    interactionCtrl = initInteractions(camera, renderer, plaqueObjects, nextCarouselCtrl.buttons, nextCarouselCtrl.carousels, focusCtrl);
    
    // Verification hooks
    window.plaqueObjects = plaqueObjects;
    window.carouselCtrl = nextCarouselCtrl;
    window.camera = camera;

    root.visible = true;

    const layoutResult = buildModuleLayout(projects, categoryOrder);
    const floorY = layoutResult.floorY;
    const minY = layoutResult.minY;
    const maxY = layoutResult.maxY;
    setBounds(minY, maxY);

    minScrollY = minY;
    const lastModule = layoutResult.modules[layoutResult.modules.length - 1];
    lastProjectY = lastModule ? lastModule.worldY : 0;
    setSnapPoints(
      cavityData.map(cd => cd.worldY),
      Math.min(maxY - 0.2, cavityData[0].worldY + metrics.visibleWallHeight * 0.5),
      // Snap dies at the last project: anything below it is the ending
      // descent, and idle snap must not drag the camera back up out of it.
      lastProjectY,
    );

    const desiredY = initial ? metrics.headerY : camera.position.y;
    const cameraY = THREE.MathUtils.clamp(desiredY, minY, maxY);
    positionCamera(camera, cameraY);
    setTargetY(cameraY);
    environmentCtrl.update(cameraY);
  }

  await rebuildScene(true);

  const loadingEl = document.getElementById('loading-screen');
  const letterboxBars = document.getElementById('letterbox-bars');
  const scrollPrompt = document.getElementById('scroll-prompt');

  // Hide scroll prompt on first user scroll
  let promptDismissed = false;
  function dismissScrollPrompt() {
    if (promptDismissed || !scrollPrompt) return;
    promptDismissed = true;
    scrollPrompt.classList.remove('scroll-prompt-visible');
    scrollPrompt.classList.add('scroll-prompt-hidden');
    window.removeEventListener('wheel', dismissScrollPrompt);
    window.removeEventListener(SCROLL_INPUT_EVENT, dismissScrollPrompt);
    window.removeEventListener('touchmove', dismissScrollPrompt);
  }

  function enableScrollAndPrompt() {
    if (!scrollCtrl) scrollCtrl = initScroll(camera, renderer.domElement);

    if (scrollPrompt) {
      scrollPrompt.classList.remove('scroll-prompt-hidden');
      scrollPrompt.classList.add('scroll-prompt-visible');
    }

    window.addEventListener('wheel', dismissScrollPrompt, { passive: true });
    window.addEventListener(SCROLL_INPUT_EVENT, dismissScrollPrompt);
    window.addEventListener('touchmove', dismissScrollPrompt, { passive: true });
  }

  function revealMuseum() {
    const loadingFadeMs = loadingEl ? INTRO_TIMING.loadingFadeMs : 0;
    const postLoadingDelayMs = loadingEl ? INTRO_TIMING.postLoadingDelayMs : 0;
    const letterboxStartMs = loadingFadeMs + postLoadingDelayMs;
    let promptQueued = false;

    function queuePrompt() {
      if (promptQueued) return;
      promptQueued = true;
      window.setTimeout(enableScrollAndPrompt, INTRO_TIMING.promptDelayMs);
      letterboxBars?.classList.add('no-transition');
    }

    if (loadingEl) loadingEl.classList.add('hidden');
    if (letterboxBars) {
      const bottomBar = letterboxBars.querySelector('.letterbox-bar-bottom');
      bottomBar?.addEventListener('transitionend', (event) => {
        if (event.propertyName === 'transform') queuePrompt();
      }, { once: true });
      window.setTimeout(() => {
        letterboxBars.classList.add('visible');
      }, letterboxStartMs);
      window.setTimeout(queuePrompt, letterboxStartMs + INTRO_TIMING.letterboxMs + 120);
    } else {
      queuePrompt();
    }
  }

  revealMuseum();

  let lastTime = performance.now();
  function animate(now) {
    requestAnimationFrame(animate);

    const dt = Math.min((now - lastTime) / 1000, 0.1);
    lastTime = now;

    if (scrollCtrl) scrollCtrl.update(dt);
    environmentCtrl.update(camera.position.y, dt);
    carouselCtrl.update(dt, camera.position.y);
    if (focusCtrl) focusCtrl.update(dt);

    // Update letterbox bars transform
    if (letterboxBars) {
      const topBar = letterboxBars.querySelector('.letterbox-bar-top');
      const bottomBar = letterboxBars.querySelector('.letterbox-bar-bottom');
      if (topBar && bottomBar) {
        const cameraY = camera.position.y;
        if (cameraY >= lastProjectY) {
          topBar.style.transform = '';
          bottomBar.style.transform = '';
        } else if (cameraY <= minScrollY) {
          topBar.style.transform = 'translateY(-100%)';
          bottomBar.style.transform = 'translateY(100%)';
        } else {
          const t = (cameraY - minScrollY) / (lastProjectY - minScrollY);
          const percent = (1 - t) * 100;
          topBar.style.transform = `translateY(-${percent}%)`;
          bottomBar.style.transform = `translateY(${percent}%)`;
        }
      }
    }

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

  console.log('Responsive wall scene built');

  requestAnimationFrame(animate);
}

main();
