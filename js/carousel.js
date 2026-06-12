// carousel.js — Auto-rotating media carousels inside each cavity.
//
// Exports:
//   buildCarousels(scene, cavityData) → { carousels[], update(dt, cameraX) }

import * as THREE from 'three';

const CYCLE_INTERVAL = 4.5;        // seconds between transitions
const CROSSFADE_DURATION = 0.8;    // seconds for crossfade
const VIEWPORT_CULL_RANGE = 10;     // world units — pause when camera farther than this

const textureLoader = new THREE.TextureLoader();

/**
 * Create a hidden <video> element for VideoTexture use.
 * Returns { video, texture } — the texture is a VideoTexture.
 */
function createVideoElement(src) {
  const video = document.createElement('video');
  video.src = src;
  video.loop = true;
  video.muted = true;
  video.playsInline = true;
  video.crossOrigin = 'anonymous';
  video.preload = 'auto';
  video.play().catch(() => {
    // Autoplay blocked — video will play on first user interaction
  });
  const texture = new THREE.VideoTexture(video);
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.colorSpace = THREE.SRGBColorSpace;
  return { video, texture };
}

/**
 * Create a carousel for one cavity.
 * Returns an object the animation loop uses to update transitions.
 */
function createCarousel(cavityData) {
  const { project, worldX, worldY, wallZ, cavityDepth } = cavityData;
  const assets = project.assets;
  const group = new THREE.Group();
  group.position.set(worldX, worldY, wallZ - cavityDepth * 0.5);

  if (assets.length === 0) {
    // Placeholder for projects without images
    const placeholderGeo = new THREE.PlaneGeometry(1.0, 0.8);
    const placeholderMat = new THREE.MeshBasicMaterial({ color: 0x333333 });
    const placeholder = new THREE.Mesh(placeholderGeo, placeholderMat);
    group.add(placeholder);
    return { group, items: [], state: { timer: 0, active: 0, transitioning: false } };
  }

  // Create a plane for each asset
  const items = [];
  const arcRadius = 0.8;
  const totalAngle = Math.PI / 5; // shallow arc spread

  for (let i = 0; i < assets.length; i++) {
    const asset = assets[i];
    const angle = (i / (assets.length - 1 || 1) - 0.5) * totalAngle;
    const x = Math.sin(angle) * arcRadius;
    const z = Math.cos(angle) * arcRadius - arcRadius;

    let material;

    if (asset.type === 'video') {
      const { video, texture } = createVideoElement(asset.src);
      material = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        opacity: i === 0 ? 1 : 0,
      });
      material.userData = { video };
    } else {
      // Image — loaded async; start transparent, fade in when ready
      material = new THREE.MeshBasicMaterial({
        color: 0x444444,
        transparent: true,
        opacity: i === 0 ? 1 : 0,
      });
      textureLoader.load(
        asset.src,
        (tex) => {
          tex.colorSpace = THREE.SRGBColorSpace;
          material.map = tex;
          material.color.set(0xffffff);
          material.needsUpdate = true;
        },
        undefined,
        () => {
          // On error, leave the gray placeholder
        },
      );
    }

    const width = i === 0 ? 1.2 : 0.9;
    const geo = new THREE.PlaneGeometry(width, width * 0.7);
    const plane = new THREE.Mesh(geo, material);
    plane.position.set(x, 0, z);
    plane.lookAt(x, 0, z + 2);

    group.add(plane);
    items.push({ mesh: plane, material });
  }

  return {
    group,
    items,
    state: {
      timer: Math.random() * CYCLE_INTERVAL, // stagger start times
      active: 0,
      transitioning: false,
      transitionTimer: 0,
      nextActive: 1,
    },
  };
}

/**
 * Build carousels for all cavities and add them to the scene.
 */
export function buildCarousels(scene, cavityData) {
  const carousels = [];

  for (const cd of cavityData) {
    const carousel = createCarousel(cd);
    scene.add(carousel.group);
    carousels.push(carousel);
  }

  return {
    carousels,

    /**
     * Call every frame. Handles auto-rotation and crossfade.
     * @param {number} dt — delta time in seconds
     * @param {number} cameraX — current camera X for viewport culling
     */
    update(dt, cameraX) {
      for (const c of carousels) {
        const dist = Math.abs(c.group.position.x - cameraX);
        if (dist > VIEWPORT_CULL_RANGE) continue; // pause distant carousels
        if (c.items.length < 2) continue;

        const s = c.state;

        if (s.transitioning) {
          s.transitionTimer += dt;
          const t = Math.min(s.transitionTimer / CROSSFADE_DURATION, 1);

          // Crossfade: fade out active, fade in next
          c.items[s.active].material.opacity = 1 - t;
          c.items[s.nextActive].material.opacity = t;

          if (t >= 1) {
            // Transition complete
            c.items[s.active].material.opacity = 0;
            c.items[s.nextActive].material.opacity = 1;
            s.active = s.nextActive;
            s.transitioning = false;
            s.timer = 0;
          }
        } else {
          s.timer += dt;
          if (s.timer >= CYCLE_INTERVAL) {
            // Start transition to next item
            s.nextActive = (s.active + 1) % c.items.length;
            s.transitioning = true;
            s.transitionTimer = 0;
          }
        }
      }
    },
  };
}
