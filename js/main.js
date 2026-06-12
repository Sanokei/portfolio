// main.js — Entry point
// Bootstraps the Three.js scene, triggers CSG wall construction,
// and runs the animation loop.

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
    window.location.href = './modern/index.html';
    return;
  }

  const { scene, camera, renderer } = initScene();

  // TODO: Scene assembly will be added in later tasks
  // For now, add a test cube to prove the render pipeline works
  const { BoxGeometry, Mesh, MeshStandardMaterial } = await import('three');
  const testGeo = new BoxGeometry(2, 2, 2);
  const testMat = new MeshStandardMaterial({ color: 0xff4444, roughness: 0.5, metalness: 0.1 });
  const testCube = new Mesh(testGeo, testMat);
  testCube.position.set(0, 3, -1);
  scene.add(testCube);

  // Animation loop
  let lastTime = performance.now();
  function animate(now) {
    requestAnimationFrame(animate);

    const dt = Math.min((now - lastTime) / 1000, 0.1); // cap delta
    lastTime = now;

    // Smooth camera update will be driven by scroll.js later

    renderer.render(scene, camera);
  }

  window.addEventListener('resize', () => resizeRenderer(renderer, camera));

  // Hide loading screen
  const loadingEl = document.getElementById('loading-screen');
  if (loadingEl) loadingEl.classList.add('hidden');

  requestAnimationFrame(animate);
  console.log('Three.js scene initialized');
}

main();
