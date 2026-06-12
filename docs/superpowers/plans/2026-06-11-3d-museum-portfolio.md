# 3D Museum Portfolio — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the retro-80s static portfolio with an immersive Three.js 3D museum gallery — a continuous plaster wall with pickaxe-chunked CSG cavities, auto-rotating carousels, and brass museum plaques.

**Architecture:** Vanilla JS + ES modules loaded via import map from CDN. A single HTML page hosts the Three.js scene. Code is organized into focused modules: scene setup, wall mesh with CSG, carousel content, plaque rendering (canvas-to-texture), scroll-to-walk controller, and raycaster-based link interaction.

**Tech Stack:** Three.js 0.170 (CDN), three-bvh-csg (CDN), three-mesh-bvh (CDN), ConvexGeometry addon, vanilla ES modules, Google Fonts.

---

## File Structure

```
portfolio/
├── index.html              # Entry point (REPLACE existing)
├── main.css                # Loading screen + base styles (REPLACE existing)
├── js/
│   ├── main.js             # Bootstrap: init scene, kick off CSG, start animation loop (NEW)
│   ├── projects.js         # Project data array — 16 projects (NEW)
│   ├── scene.js            # Scene, camera, renderer, lighting factory (NEW)
│   ├── wall.js             # Wall mesh + sequential CSG cavity subtraction (NEW)
│   ├── carousel.js         # Media planes inside cavities, auto-rotation (NEW)
│   ├── plaque.js           # Header plaque + project plaques via canvas-to-texture (NEW)
│   ├── scroll.js           # Scroll-to-walk: wheel→camera, lerp easing, bounds clamp (NEW)
│   └── interactions.js     # Raycaster for plaque hover/click, cursor changes (NEW)
├── img/                    # (unchanged — existing project screenshots)
├── video/                  # (unchanged — existing project videos)
└── fonts/                  # (unchanged — existing font files)
```

File purge on old files: `index.html` and `main.css` get completely rewritten. The `modern/` directory is kept as-is (WebGL fallback target). No changes to `img/`, `video/`, or `fonts/`.

---

### Task 1: HTML scaffolding — import map, canvas, loading screen

**Files:**
- Replace: `index.html`
- Replace: `main.css`
- Create: `js/main.js`

This task sets up the empty shell: an HTML page with a Three.js import map, a fullscreen `<canvas>`, a loading overlay, and a minimal CSS reset. The `main.js` bootstrap does nothing yet except import the scene module and log "ready."

- [ ] **Step 1: Write the new `index.html`**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Sano's Portfolio</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=EB+Garamond:ital@0;1&family=Playfair+Display+SC:wght@900&family=Inter:wght@400;700;800&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="./main.css">
</head>
<body>
  <!-- Loading overlay -->
  <div id="loading-screen">
    <div id="loading-text">Entering the museum...</div>
    <div id="loading-bar-container">
      <div id="loading-bar"></div>
    </div>
  </div>

  <!-- Three.js canvas fills viewport -->
  <canvas id="canvas"></canvas>

  <!-- Import map: Three.js + CSG deps from CDN -->
  <script type="importmap">
  {
    "imports": {
      "three": "https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js",
      "three/addons/": "https://cdn.jsdelivr.net/npm/three@0.170.0/examples/jsm/",
      "three-mesh-bvh": "https://cdn.jsdelivr.net/npm/three-mesh-bvh@0.7.6/build/index.module.js",
      "three-bvh-csg": "https://cdn.jsdelivr.net/npm/three-bvh-csg@0.0.9/build/index.module.js"
    }
  }
  </script>

  <script type="module" src="./js/main.js"></script>
</body>
</html>
```

- [ ] **Step 2: Write the new `main.css`**

```css
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

html, body {
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: #1a1a1a;
  font-family: 'Inter', sans-serif;
}

#canvas {
  display: block;
  position: fixed;
  top: 0; left: 0;
  width: 100%; height: 100%;
}

#loading-screen {
  position: fixed;
  top: 0; left: 0;
  width: 100%; height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: #1a1a1a;
  z-index: 1000;
  transition: opacity 0.6s ease-out;
}

#loading-screen.hidden {
  opacity: 0;
  pointer-events: none;
}

#loading-text {
  color: #d4cbb8;
  font-family: 'EB Garamond', serif;
  font-size: 1.8rem;
  font-style: italic;
  margin-bottom: 1.5rem;
}

#loading-bar-container {
  width: 240px;
  height: 4px;
  background: #333;
  border-radius: 2px;
  overflow: hidden;
}

#loading-bar {
  width: 0%;
  height: 100%;
  background: #DAA520;
  border-radius: 2px;
  transition: width 0.3s ease;
}
```

- [ ] **Step 3: Write the initial `js/main.js`**

```js
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
```

- [ ] **Step 4: Commit**

```bash
git add index.html main.css js/main.js
git commit -m "feat: add HTML scaffolding with Three.js import map and loading screen
Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 2: Project data module

**Files:**
- Create: `js/projects.js`

This module exports a single array of 16 project objects. Each object contains every piece of metadata a cavity and plaque need: name, category, description, tags, links, and asset paths. This is pure data — no rendering logic.

- [ ] **Step 1: Write `js/projects.js`**

```js
// projects.js — Complete project data for all 16 portfolio entries.
// Each project maps to one cavity in the museum wall.
// Fields:
//   id          — unique numeric ID
//   name        — display title
//   category    — section grouping (Games, Websites, Programs, Videos, Board Games)
//   subtitle    — genre/type line shown on plaque
//   description — 1-2 sentence blurb for plaque
//   tags        — short labels (Development, Design, UI/UX, etc.)
//   links       — [{ label: 'itch.io'|'GitHub'|'Website', url: '...', icon: 'itchio'|'gh'|'web' }]
//   assets      — [{ type: 'video'|'image', src: 'path' }] — 2-4 items for carousel

export const projects = [
  // ── GAMES ──────────────────────────────────────────────
  {
    id: 1,
    name: "Coot's Bug Squasher",
    category: 'Games',
    subtitle: 'Video Game, Narrative, Puzzle, Coding',
    description:
      'A hacking game about a cat who puts themselves into computers ' +
      'to get through security measures. Features a custom toylang called AlphaJargon.',
    tags: ['Development', 'Design', 'UI/UX', 'Pixel Art'],
    links: [
      { label: 'itch.io', url: 'https://sanokei.itch.io/coots-bug-squasher', icon: 'itchio' },
      { label: 'GitHub', url: 'https://github.com/Sanokei/Coots-Bug-Squasher', icon: 'gh' },
    ],
    assets: [
      { type: 'video', src: 'video/coots.mp4' },
      { type: 'image', src: 'https://img.itch.zone/aW1hZ2UvMTk0NDA5NS8xNTMxMjI5OS5wbmc=/original/yoWHzX.png' },
      { type: 'image', src: 'https://img.itch.zone/aW1hZ2UvMTk0NDA5NS8xNTMxMjI5OC5wbmc=/original/zTHk4q.png' },
    ],
  },
  {
    id: 2,
    name: 'Adventure of Sir Robin',
    category: 'Games',
    subtitle: 'Video Game, Adventure, Narrative',
    description:
      'An adventure game about a magically intelligent bag. ' +
      'The twist? The bag\'s intelligence was the player all along.',
    tags: ['Development', 'Design', 'UI/UX'],
    links: [
      { label: 'itch.io', url: 'https://sanokei.itch.io/adventure-of-sir-robin', icon: 'itchio' },
      { label: 'GitHub', url: 'https://github.com/Sanokei/AdventureOfSirRobin', icon: 'gh' },
    ],
    assets: [
      { type: 'video', src: 'video/sirrobin.mp4' },
      { type: 'image', src: 'https://img.itch.zone/aW1hZ2UvMjE2MDc5Ny8xMjczMjcxMS5wbmc=/original/dPcIrV.png' },
      { type: 'image', src: 'https://img.itch.zone/aW1hZ2UvMjE2MDc5Ny8xMjczMjcyMy5wbmc=/original/uNqqen.png' },
    ],
  },
  {
    id: 3,
    name: 'Intern',
    category: 'Games',
    subtitle: 'Video Game, Mini-games',
    description:
      'A god game where the player fixes the mistakes of a bumbling intern, ' +
      'before the stress fractures the world around them.',
    tags: ['Development', 'Design', 'UI/UX'],
    links: [
      { label: 'itch.io', url: 'https://sanokei.itch.io/intern', icon: 'itchio' },
      { label: 'GitHub', url: 'https://github.com/Sanokei/Intern', icon: 'gh' },
    ],
    assets: [
      { type: 'video', src: 'video/intern.mp4' },
      { type: 'image', src: 'https://img.itch.zone/aW1nLzEyODQ4NzgyLnBuZw==/315x250%23c/%2F7KLj3.png' },
    ],
  },
  {
    id: 4,
    name: 'Productivity App',
    category: 'Games',
    subtitle: 'Video Game, Narrative (WIP)',
    description:
      'A meta-narrative walking simulator about productivity, artistic expression, ' +
      'and the toxic battle within ourselves. Inspired by ludonarrative dissonance.',
    tags: ['Development', 'Design', 'UI/UX'],
    links: [
      { label: 'itch.io', url: 'https://sanokei.itch.io/productivity-app', icon: 'itchio' },
      { label: 'GitHub', url: 'https://github.com/Sanokei/Productivity-App', icon: 'gh' },
    ],
    assets: [
      { type: 'video', src: 'video/productivity.mp4' },
      { type: 'image', src: 'https://img.itch.zone/aW1nLzE1NTcwNzUyLnBuZw==/315x250%23c/EgGZ9u.png' },
      { type: 'image', src: 'img/piano.png' },
    ],
  },
  {
    id: 5,
    name: 'Corruption',
    category: 'Games',
    subtitle: 'Video Game, Management',
    description:
      'A swiping management game where the player is a dictator deciding whether ' +
      'to sell off a newly declared country to capitalists.',
    tags: ['Development', 'Design', 'UI/UX'],
    links: [
      { label: 'itch.io', url: 'https://sanokei.itch.io/corruption', icon: 'itchio' },
      { label: 'GitHub', url: 'https://github.com/Sanokei/corruption', icon: 'gh' },
    ],
    assets: [
      { type: 'video', src: 'video/corruption.mp4' },
      { type: 'image', src: 'https://img.itch.zone/aW1nLzEyODkzNDAzLnBuZw==/original/9m0xOZ.png' },
      { type: 'image', src: 'https://img.itch.zone/aW1hZ2UvMjE4MzU0MC8xNTY0ODI5MS5wbmc=/original/2t8Kat.png' },
    ],
  },
  {
    id: 6,
    name: 'Curling The Herd',
    category: 'Games',
    subtitle: 'Video Game, Top-down',
    description:
      'My first game jam submission. A curling pro slime destroys ' +
      'murderous sentient hockey goals by scoring in them.',
    tags: ['Development', 'Design', 'UI/UX'],
    links: [
      { label: 'itch.io', url: 'https://sanokei.itch.io/curling-the-herd', icon: 'itchio' },
      { label: 'GitHub', url: 'https://github.com/Sanokei/CurlingTheHerd', icon: 'gh' },
    ],
    assets: [
      { type: 'video', src: 'video/curling.mp4' },
      { type: 'image', src: 'https://img.itch.zone/aW1hZ2UvMTI3MzMwMS8xNTY0ODMzNi5wbmc=/original/W%2BKzn9.png' },
    ],
  },

  // ── WEBSITES ───────────────────────────────────────────
  {
    id: 7,
    name: 'The Arcane Observer',
    category: 'Websites',
    subtitle: 'Newspaper, Fantasy Narrative',
    description:
      'A self-updating magic newspaper that takes the top oddities of the day ' +
      'from AP and explains them away with wizard activities.',
    tags: ['Development', 'Design', 'UI/UX'],
    links: [
      { label: 'Website', url: 'https://arcaneobserver.com/', icon: 'web' },
      { label: 'GitHub', url: 'https://github.com/Sanokei/ArcaneObserver/', icon: 'gh' },
    ],
    assets: [
      { type: 'image', src: 'img/4-1-24_ArcaneObserver.png' },
      { type: 'image', src: 'img/4-5-24_ArcaneObserver.png' },
    ],
  },
  {
    id: 8,
    name: '[ new tab ] - Doodle',
    category: 'Websites',
    subtitle: 'Productivity, Art, Drawing',
    description:
      'A Chrome extension new-tab doodle pad so you always have a place to jot ' +
      'something down without the noise of typing.',
    tags: ['Web Development', 'Design', 'UI/UX'],
    links: [
      { label: 'GitHub', url: 'https://github.com/Sanokei/newtab-doodle/', icon: 'gh' },
    ],
    assets: [
      { type: 'video', src: 'video/doodle.mp4' },
      { type: 'image', src: 'img/doodle.png' },
    ],
  },
  {
    id: 9,
    name: 'Emoji Game',
    category: 'Websites',
    subtitle: 'Web Game (Archived)',
    description:
      'An AI-powered emoji movie name guessing game. ' +
      'Gives the user emojis and they guess what movie the AI is thinking of.',
    tags: ['Development', 'Design', 'UI/UX'],
    links: [
      { label: 'GitHub', url: 'https://github.com/Sanokei/Emoji-Game', icon: 'gh' },
    ],
    assets: [
      { type: 'image', src: 'img/emoji-game.gif' },
    ],
  },
  {
    id: 10,
    name: 'ExNoto',
    category: 'Websites',
    subtitle: 'Website Template',
    description:
      'A landing page mock-up for a potential AI translator app or other SaaS project.',
    tags: ['Development', 'Design', 'UI/UX'],
    links: [
      { label: 'Website', url: 'https://sanokei.github.io/ExNoto/', icon: 'web' },
      { label: 'GitHub', url: 'https://github.com/Sanokei/ExNoto', icon: 'gh' },
    ],
    assets: [
      { type: 'image', src: 'https://camo.githubusercontent.com/9115e5041cf4d477c7d803f0e3395b59223456601939dbba0cd193e45524ade4/68747470733a2f2f66696c65732e636174626f782e6d6f652f6675747430612e676966' },
      { type: 'image', src: 'https://camo.githubusercontent.com/6ee54c835789b7dca22a5ed9ce787ef351b9cffe37272b9c5df3b0504f62bd67/68747470733a2f2f66696c65732e636174626f782e6d6f652f7272353536652e676966' },
    ],
  },
  {
    id: 11,
    name: 'clamtap',
    category: 'Websites',
    subtitle: 'Website Template',
    description:
      'A landing page mock-up for an NFC-based tap-to-pay SaaS consisting of just a phone.',
    tags: ['Development', 'Design', 'UI/UX'],
    links: [
      { label: 'Website', url: 'https://sanokei.github.io/clamtap/', icon: 'web' },
      { label: 'GitHub', url: 'https://github.com/Sanokei/clamtap', icon: 'gh' },
    ],
    assets: [
      { type: 'image', src: 'img/clamtap1.png' },
      { type: 'image', src: 'img/clamtap2.png' },
    ],
  },

  // ── PROGRAMS ───────────────────────────────────────────
  {
    id: 12,
    name: 'VOD Highlighter',
    category: 'Programs',
    subtitle: 'Machine Learning, BERT',
    description:
      'Originally an AI program trained on BERT to cut down boring university lectures, ' +
      'turned into a tool to create highlights of long streams.',
    tags: ['Development'],
    links: [
      { label: 'GitHub', url: 'https://github.com/Sanokei/VOD-Highlighter', icon: 'gh' },
    ],
    assets: [], // no images — placeholder
  },
  {
    id: 13,
    name: 'David The Duck',
    category: 'Programs',
    subtitle: 'Desktop Pet',
    description:
      'A desktop pet that waddles around your screen and gets into mischief. ' +
      'Inspired by Desktop Goose. A birthday present for my best friend.',
    tags: ['Development', 'Design', 'Pixel Art'],
    links: [
      { label: 'GitHub', url: 'https://github.com/Sanokei/David-The-Duck', icon: 'gh' },
    ],
    assets: [
      { type: 'image', src: 'https://github.com/Sanokei/David-The-Duck/raw/main/resources/images/david_the_duck_logo.jpg' },
      { type: 'image', src: 'img/GifODavid.gif' },
    ],
  },

  // ── VIDEOS ─────────────────────────────────────────────
  {
    id: 14,
    name: 'Sano Fails to Sell Spotify™ Tattoos',
    category: 'Videos',
    subtitle: 'AI Art, Satire',
    description:
      'A satirical video about using AI art for personal benefit, ' +
      'understanding what\'s underneath instead. Developed a whole website for the video.',
    tags: ['Writing', 'Editing'],
    links: [
      { label: 'YouTube', url: 'https://www.youtube.com/watch?v=WK5pHoAeL6Y', icon: 'web' },
    ],
    assets: [
      { type: 'image', src: 'img/thumbnail.jpg' },
    ],
  },

  // ── BOARD GAMES ────────────────────────────────────────
  {
    id: 15,
    name: 'Merlin Economics',
    category: 'Board Games',
    subtitle: 'Hand Management, Commodity Speculation, Blind Auctioning',
    description:
      'A board game that applies real-world economic principles to a fictional wizard world. ' +
      'Fortune-telling cards forecast economic instability.',
    tags: ['Design'],
    links: [
      { label: 'itch.io', url: 'https://sanokei.itch.io/merlin-economics', icon: 'itchio' },
    ],
    assets: [], // no images — placeholder
  },
  {
    id: 16,
    name: 'Kanta',
    category: 'Board Games',
    subtitle: 'Hand Management, Betting, Statistics',
    description:
      'A two-player gambling card game with fantasy elements. Inspired by blackjack. ' +
      'Made because I wanted a new card game as easy to pick up as blackjack.',
    tags: ['Design'],
    links: [
      { label: 'itch.io', url: 'https://sanokei.itch.io/kanta', icon: 'itchio' },
    ],
    assets: [], // no images — placeholder
  },
];

// Category display order (left to right on the wall)
export const categoryOrder = ['Games', 'Websites', 'Programs', 'Videos', 'Board Games'];

// Group projects by category for easy iteration
export function getProjectsByCategory() {
  const map = {};
  for (const cat of categoryOrder) {
    map[cat] = projects.filter(p => p.category === cat);
  }
  return map;
}
```

- [ ] **Step 2: Commit**

```bash
git add js/projects.js
git commit -m "feat: add project data module with all 16 portfolio entries
Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 3: Scene setup — renderer, camera, lighting

**Files:**
- Create: `js/scene.js`
- Modify: `js/main.js` (import and call initScene)

The scene module creates and returns the Three.js WebGLRenderer, PerspectiveCamera, and Scene with museum lighting pre-configured. Every other module receives these from main.js.

- [ ] **Step 1: Write `js/scene.js`**

```js
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
```

- [ ] **Step 2: Update `js/main.js` to wire up the scene**

Replace the entire content of `js/main.js`:

```js
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
```

- [ ] **Step 3: Commit**

```bash
git add js/scene.js js/main.js
git commit -m "feat: add Three.js scene setup with camera, renderer, and museum lighting
Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 4: Wall mesh with CSG cavity subtraction

**Files:**
- Create: `js/wall.js`
- Modify: `js/main.js` (import wall builder, call it during init)

This is the core visual feature. The wall module:

1. Creates a segmented BoxGeometry for the plaster wall (50m × 8m × 0.6m).
2. Patches `BufferGeometry.prototype.computeBoundsTree` from three-mesh-bvh (required by three-bvh-csg).
3. Generates 16 jagged ConvexGeometry subtraction volumes (one per cavity, each with a unique seed).
4. Sequentially subtracts each volume from the wall via `CSG.subtract()`.
5. Adds the wall mesh, cavity interior backing planes, and spotlight fixtures to the scene.
6. Exports the cavity world-space positions so carousel.js and plaque.js can reference them.

The subtraction shapes use `ConvexGeometry` from random points biased toward edges, producing irregular faceted volumes that look like pickaxe strikes.

- [ ] **Step 1: Write `js/wall.js`**

```js
// wall.js — Plaster gallery wall with pickaxe-chunked CSG cavities.
//
// Exports:
//   buildWall(scene, projects, categoryOrder) → { wallGroup, cavityData[] }
//
// cavityData per project:
//   { project, worldX, worldY, wallZ, cavityDepth, seed }

import * as THREE from 'three';
import { ConvexGeometry } from 'three/addons/geometries/ConvexGeometry.js';
import { computeBoundsTree, disposeBoundsTree } from 'three-mesh-bvh';
import { subtract } from 'three-bvh-csg';
import { createSpotlight, createCavityLight } from './scene.js';

// Patch BufferGeometry with BVH methods (required by three-bvh-csg)
THREE.BufferGeometry.prototype.computeBoundsTree = computeBoundsTree;
THREE.BufferGeometry.prototype.disposeBoundsTree = disposeBoundsTree;

// ── Constants ──────────────────────────────────────────
const WALL_WIDTH = 50;
const WALL_HEIGHT = 8;
const WALL_THICKNESS = 0.6;
const WALL_Y_CENTER = 4;
const CAVITY_SPACING = 2.8;   // horizontal spacing between cavity centers
const CAVITY_W = 1.6;         // approx cavity width
const CAVITY_H = 2.0;         // approx cavity height
const CAVITY_D = 1.2;         // depth into wall
const START_X = -22;          // leftmost cavity center X

// ── Materials ──────────────────────────────────────────
const plasterMaterial = new THREE.MeshStandardMaterial({
  color: 0xf5efe6,
  roughness: 0.85,
  metalness: 0.05,
});

const interiorMaterial = new THREE.MeshStandardMaterial({
  color: 0xc0b8a8,
  roughness: 0.95,
  metalness: 0.0,
});

// ── PRNG ───────────────────────────────────────────────
/** Mulberry32 — deterministic pseudo-random from a numeric seed. */
function mulberry32(a) {
  return function () {
    a |= 0;
    a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

// ── Jagged Volume Generator ────────────────────────────
/**
 * Create an irregular, faceted 3D volume via ConvexGeometry.
 * Random points biased toward the bounding-box edges produce
 * a crystal-like shape that simulates pickaxe strikes.
 */
function createJaggedVolume(w, h, d, seed) {
  const rand = mulberry32(seed);
  const hw = w / 2;
  const hh = h / 2;
  const hd = d / 2;
  const points = [];

  // 40-60 random points, ~30% pinned to edges for crisp facets
  const count = 40 + Math.floor(rand() * 20);
  for (let i = 0; i < count; i++) {
    const edgeBiased = rand() < 0.35;
    const x = edgeBiased
      ? (rand() < 0.5 ? -hw : hw) * (0.7 + rand() * 0.3)
      : (rand() - 0.5) * w;
    const y = edgeBiased
      ? (rand() < 0.5 ? -hh : hh) * (0.7 + rand() * 0.3)
      : (rand() - 0.5) * h;
    const z = edgeBiased
      ? (rand() < 0.5 ? -hd : hd) * (0.7 + rand() * 0.3)
      : (rand() - 0.5) * d;
    points.push(new THREE.Vector3(x, y, z));
  }

  // Always include the 8 corners so the shape spans the full volume
  const corners = [
    [-hw, -hh, -hd], [hw, -hh, -hd], [-hw, hh, -hd], [hw, hh, -hd],
    [-hw, -hh,  hd], [hw, -hh,  hd], [-hw, hh,  hd], [hw, hh,  hd],
  ];
  for (const [cx, cy, cz] of corners) {
    points.push(new THREE.Vector3(cx, cy, cz));
  }

  // Extra chips near the front face (z > 0 side) for pickaxe-front look
  for (let i = 0; i < 12; i++) {
    const x = (rand() - 0.5) * w * 1.2;
    const y = (rand() - 0.5) * h * 1.2;
    const z = hd * (0.5 + rand() * 0.7); // biased toward front
    points.push(new THREE.Vector3(x, y, z));
  }

  return new ConvexGeometry(points);
}

// ── Main Builder ───────────────────────────────────────
/**
 * Build the wall and subtract all 16 cavities via CSG.
 * Returns the wall mesh and per-cavity positioning data.
 */
export async function buildWall(scene, projects, categoryOrder) {
  // Progress reporting
  const loadingBar = document.getElementById('loading-bar');
  const loadingText = document.getElementById('loading-text');
  const setProgress = (pct, msg) => {
    if (loadingBar) loadingBar.style.width = Math.min(pct, 100) + '%';
    if (loadingText) loadingText.textContent = msg;
  };

  setProgress(5, 'Building gallery wall...');

  // ── Create wall mesh ─────────────────────────────────
  const wallGeo = new THREE.BoxGeometry(WALL_WIDTH, WALL_HEIGHT, WALL_THICKNESS, 100, 16, 1);
  const wallMesh = new THREE.Mesh(wallGeo, plasterMaterial);
  wallMesh.position.set(0, WALL_Y_CENTER, 0);
  wallMesh.castShadow = true;
  wallMesh.receiveShadow = true;
  wallMesh.updateMatrixWorld();

  // Compute initial BVH
  wallMesh.geometry.computeBoundsTree();

  setProgress(10, 'Preparing cavity chambers...');

  // ── Compute cavity positions ─────────────────────────
  // Lay out cavities linearly, grouped by category with small gaps
  const cavityData = [];
  let cursorX = START_X;

  for (const category of categoryOrder) {
    const catProjects = projects.filter(p => p.category === category);

    for (let i = 0; i < catProjects.length; i++) {
      const project = catProjects[i];
      // Small gap between categories (after the last project of previous category)
      const worldX = cursorX;
      const worldY = WALL_Y_CENTER;
      // Wall front face is at z = WALL_THICKNESS / 2 = 0.3
      const wallZ = WALL_THICKNESS / 2;
      const seed = project.id * 137 + 42; // deterministic per project

      cavityData.push({ project, worldX, worldY, wallZ, cavityDepth: CAVITY_D, seed });

      cursorX += CAVITY_SPACING;
    }

    // Add extra gap between categories
    cursorX += 0.6;
  }

  // ── Sequential CSG subtraction ───────────────────────
  let currentWall = wallMesh;

  for (let i = 0; i < cavityData.length; i++) {
    const cd = cavityData[i];
    const pct = 10 + Math.round((i / cavityData.length) * 70);
    setProgress(pct, `Chiseling cavity: ${cd.project.name}...`);

    // Create jagged subtraction volume
    const jaggedGeo = createJaggedVolume(CAVITY_W, CAVITY_H, CAVITY_D, cd.seed);
    const jaggedMesh = new THREE.Mesh(jaggedGeo);
    // Position the shape so it protrudes from the wall front into the wall depth
    jaggedMesh.position.set(cd.worldX, cd.worldY, cd.wallZ - CAVITY_D / 2);
    jaggedMesh.updateMatrixWorld();
    jaggedMesh.geometry.computeBoundsTree();

    // Subtract from wall
    const result = subtract(currentWall, jaggedMesh);
    const oldGeo = currentWall.geometry;
    currentWall.geometry = result.geometry;
    oldGeo.dispose();
    jaggedMesh.geometry.dispose();

    // Yield to the main thread every 4 cavities to keep the UI responsive
    if (i % 4 === 3) {
      await new Promise(r => setTimeout(r, 0));
    }
  }

  // ── Add wall to scene ────────────────────────────────
  const wallGroup = new THREE.Group();
  wallGroup.add(currentWall);

  // ── Cavity interior backing planes ───────────────────
  // Dark planes placed slightly behind the wall to create the
  // visual of darker material inside each broken cavity.
  for (const cd of cavityData) {
    const backPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(CAVITY_W * 0.85, CAVITY_H * 0.85),
      interiorMaterial,
    );
    // Position just behind the cavity opening (inside the wall)
    backPlane.position.set(cd.worldX, cd.worldY, cd.wallZ - CAVITY_D * 0.85);
    wallGroup.add(backPlane);

    // Subtle point light inside cavity for glow
    const cavityLight = createCavityLight(cd.worldX, cd.worldY, cd.wallZ - CAVITY_D * 0.4);
    wallGroup.add(cavityLight);

    // Spotlight above cavity
    const spotY = WALL_Y_CENTER + WALL_HEIGHT / 2 - 0.3;
    const spotZ = cd.wallZ + 0.2;
    const spot = createSpotlight(cd.worldX, spotY, spotZ);
    spot.target.position.set(cd.worldX, cd.worldY, cd.wallZ - CAVITY_D / 2);
    wallGroup.add(spot);
    wallGroup.add(spot.target);
  }

  scene.add(wallGroup);

  setProgress(85, 'Polishing the marble...');

  return { wallGroup, cavityData };
}
```

- [ ] **Step 2: Update `js/main.js` to call buildWall**

Replace `js/main.js`:

```js
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
```

- [ ] **Step 3: Commit**

```bash
git add js/wall.js js/main.js
git commit -m "feat: add wall mesh with 16 CSG pickaxe-chunked cavities
Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 5: Scroll-to-walk controller

**Files:**
- Create: `js/scroll.js`
- Modify: `js/main.js` (import and integrate scroll controller)

The scroll module listens for `wheel` events, accumulates scroll delta, maps it to a camera target X position within wall bounds, and applies smooth lerp easing each frame.

- [ ] **Step 1: Write `js/scroll.js`**

```js
// scroll.js — Scroll-to-walk camera controller.
//
// Exports:
//   initScroll(camera) → { update(dt) }
//     Call update(dt) each frame. It lerps camera.position.x toward
//     the accumulated scroll target, clamped to wall bounds.
//
//   getTargetX() → number
//   setBounds(minX, maxX)

import * as THREE from 'three';

const SCROLL_SENSITIVITY = 0.015;  // world units per scroll pixel
const EASING = 0.08;               // lerp factor per frame (60fps baseline)

let targetX = 0;
let bounds = { min: -25, max: 25 };
let cameraRef = null;

function onWheel(e) {
  e.preventDefault();
  const delta = e.deltaY * SCROLL_SENSITIVITY;
  targetX += delta;
  // Clamp
  targetX = THREE.MathUtils.clamp(targetX, bounds.min, bounds.max);
}

export function setBounds(minX, maxX) {
  bounds.min = minX;
  bounds.max = maxX;
  targetX = THREE.MathUtils.clamp(targetX, bounds.min, bounds.max);
}

export function getTargetX() {
  return targetX;
}

export function setTargetX(x) {
  targetX = THREE.MathUtils.clamp(x, bounds.min, bounds.max);
}

export function initScroll(camera) {
  cameraRef = camera;
  targetX = camera.position.x;

  window.addEventListener('wheel', onWheel, { passive: false });

  // Touch support: treat single-finger vertical swipe as scroll
  let touchStartY = 0;
  let touchStartTarget = 0;

  window.addEventListener('touchstart', (e) => {
    if (e.touches.length === 1) {
      touchStartY = e.touches[0].clientY;
      touchStartTarget = targetX;
    }
  }, { passive: true });

  window.addEventListener('touchmove', (e) => {
    if (e.touches.length === 1) {
      const dy = touchStartY - e.touches[0].clientY;
      targetX = THREE.MathUtils.clamp(
        touchStartTarget + dy * SCROLL_SENSITIVITY,
        bounds.min,
        bounds.max,
      );
    }
  }, { passive: true });

  return {
    /**
     * Call every frame. Returns the new camera X after easing.
     */
    update(dt) {
      if (!cameraRef) return;
      const frameEasing = 1 - Math.pow(1 - EASING, dt * 60); // frame-rate independent
      cameraRef.position.x += (targetX - cameraRef.position.x) * frameEasing;
      cameraRef.lookAt(cameraRef.position.x, 4, 0);
    },
  };
}
```

- [ ] **Step 2: Integrate scroll into `js/main.js`**

Edit `js/main.js` — add the import and hook the scroll controller into the animation loop:

```js
// Add to the imports at the top:
import { initScroll, setBounds } from './scroll.js';

// Replace the "TODO: scroll.js camera update" comment inside animate()
// and the surrounding lines with the actual scroll integration.

// After this line:
//   const { wallGroup, cavityData } = await buildWall(scene, projects, categoryOrder);
// Add:

  // Set up scroll bounds based on cavity positions
  const firstX = cavityData[0].worldX;
  const lastX = cavityData[cavityData.length - 1].worldX;
  setBounds(firstX - 5, lastX + 5);

  // Start camera at the first cavity
  camera.position.set(firstX, 4, 6);
  camera.lookAt(firstX, 4, 0);

  const scrollCtrl = initScroll(camera);

// Then inside animate(), the renderer.render call block becomes:
  function animate(now) {
    requestAnimationFrame(animate);

    const dt = Math.min((now - lastTime) / 1000, 0.1);
    lastTime = now;

    scrollCtrl.update(dt);

    renderer.render(scene, camera);
  }
```

- [ ] **Step 3: Replace `js/main.js` completely with the integrated version**

Since the edits are spread across multiple locations, rewrite `js/main.js` in full:

```js
// main.js — Entry point
// Bootstraps the Three.js scene, builds the CSG wall,
// sets up scroll-to-walk, and runs the animation loop.

import { initScene, resizeRenderer } from './scene.js';
import { buildWall } from './wall.js';
import { initScroll, setBounds } from './scroll.js';
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

  // Set up scroll bounds based on cavity positions
  const firstX = cavityData[0].worldX;
  const lastX = cavityData[cavityData.length - 1].worldX;
  setBounds(firstX - 5, lastX + 5);

  // Start camera at the first cavity
  camera.position.set(firstX, 4, 6);
  camera.lookAt(firstX, 4, 0);

  const scrollCtrl = initScroll(camera);

  // Store references for other modules
  window.__cavityData = cavityData;
  window.__wallGroup = wallGroup;

  // Animation loop
  let lastTime = performance.now();
  function animate(now) {
    requestAnimationFrame(animate);

    const dt = Math.min((now - lastTime) / 1000, 0.1);
    lastTime = now;

    scrollCtrl.update(dt);

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
```

- [ ] **Step 4: Commit**

```bash
git add js/scroll.js js/main.js
git commit -m "feat: add scroll-to-walk camera controller with smooth lerp easing
Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 6: Carousel system — 3D media planes inside cavities

**Files:**
- Create: `js/carousel.js`
- Modify: `js/main.js` (import and call buildCarousels)

Each cavity gets a carousel: 2-4 textured planes arranged in a shallow arc. Images use `TextureLoader`; videos use `VideoTexture` from hidden `<video>` elements. The active item crossfades to the next every 4-5 seconds. Carousels pause when their cavity is far from the viewport.

- [ ] **Step 1: Write `js/carousel.js`**

```js
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
      // Store reference so we can clean up later
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
    // Slight rotation so each plane faces toward the viewer slightly
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
```

- [ ] **Step 2: Integrate carousels into `js/main.js`**

Add the import:
```js
import { buildCarousels } from './carousel.js';
```

After the scroll setup, add:
```js
const { carousels, update: updateCarousels } = buildCarousels(scene, cavityData);
```

Inside `animate()`, before `renderer.render()`, add:
```js
updateCarousels(dt, camera.position.x);
```

Full updated `main.js`:

```js
// main.js — Entry point
import { initScene, resizeRenderer } from './scene.js';
import { buildWall } from './wall.js';
import { initScroll, setBounds } from './scroll.js';
import { buildCarousels } from './carousel.js';
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

  // Set up carousels inside cavities
  const { update: updateCarousels } = buildCarousels(scene, cavityData);

  // Set up scroll bounds
  const firstX = cavityData[0].worldX;
  const lastX = cavityData[cavityData.length - 1].worldX;
  setBounds(firstX - 5, lastX + 5);

  camera.position.set(firstX, 4, 6);
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

  const loadingEl = document.getElementById('loading-screen');
  if (loadingEl) loadingEl.classList.add('hidden');

  requestAnimationFrame(animate);
}

main();
```

- [ ] **Step 3: Commit**

```bash
git add js/carousel.js js/main.js
git commit -m "feat: add auto-rotating carousel system with crossfade inside cavities
Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 7: Plaque system — canvas-to-texture for header and project plaques

**Files:**
- Create: `js/plaque.js`
- Modify: `js/main.js` (import and call buildPlaques)

Plaques use offscreen `<canvas>` elements to render styled text, then apply the result as a `CanvasTexture` onto 3D plane/box geometry. The header plaque is gold-on-wood centered above the wall. Project plaques are brushed-metal rectangles beside each cavity.

- [ ] **Step 1: Write `js/plaque.js`**

```js
// plaque.js — Museum plaques rendered via canvas-to-texture.
//
// Exports:
//   buildHeaderPlaque(scene) → mesh
//   buildProjectPlaques(scene, cavityData) → plaqueObjects[]
//
// Each plaqueObject = { mesh, project, linkZones[] }
//   linkZones: [{ label, url, xMin, xMax, yMin, yMax }] — normalized 0-1 coords
//   for raycasting hit-testing in interactions.js

import * as THREE from 'three';

// ── Canvas rendering helpers ───────────────────────────

/**
 * Render "SANO'S PORTFOLIO" onto a canvas and return a CanvasTexture.
 */
function renderHeaderTexture() {
  const width = 1024;
  const height = 256;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  // Wood-grain background
  const woodGrad = ctx.createLinearGradient(0, 0, 0, height);
  woodGrad.addColorStop(0, '#4a3020');
  woodGrad.addColorStop(0.3, '#6B4530');
  woodGrad.addColorStop(0.5, '#5C4033');
  woodGrad.addColorStop(0.7, '#6B4530');
  woodGrad.addColorStop(1, '#3a2010');
  ctx.fillStyle = woodGrad;
  ctx.fillRect(0, 0, width, height);

  // Subtle wood grain lines
  ctx.strokeStyle = 'rgba(0,0,0,0.15)';
  ctx.lineWidth = 1;
  for (let y = 0; y < height; y += 8) {
    ctx.beginPath();
    ctx.moveTo(0, y + Math.sin(y * 0.3) * 2);
    ctx.lineTo(width, y + Math.sin(y * 0.3 + 1) * 2);
    ctx.stroke();
  }

  // Gold border
  ctx.strokeStyle = '#DAA520';
  ctx.lineWidth = 8;
  ctx.strokeRect(6, 6, width - 12, height - 12);
  ctx.strokeStyle = '#B8860B';
  ctx.lineWidth = 2;
  ctx.strokeRect(14, 14, width - 28, height - 28);

  // Gold text
  ctx.fillStyle = '#DAA520';
  ctx.font = 'bold 72px "EB Garamond", Georgia, serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = 'rgba(0,0,0,0.5)';
  ctx.shadowBlur = 4;
  ctx.shadowOffsetX = 1;
  ctx.shadowOffsetY = 1;
  ctx.fillText("SANO'S PORTFOLIO", width / 2, height / 2);
  ctx.shadowColor = 'transparent';

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/**
 * Render a single project plaque canvas.
 * Returns { texture, linkZones } — linkZones for raycasting hit-test.
 */
function renderProjectTexture(project) {
  const width = 512;
  const height = 350;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  // Brushed metal background
  const metalGrad = ctx.createLinearGradient(0, 0, 0, height);
  metalGrad.addColorStop(0, '#9a9a8a');
  metalGrad.addColorStop(0.5, '#b0b0a0');
  metalGrad.addColorStop(1, '#7a7a6a');
  ctx.fillStyle = metalGrad;
  ctx.fillRect(0, 0, width, height);

  // Subtle horizontal brush lines
  ctx.strokeStyle = 'rgba(255,255,255,0.08)';
  ctx.lineWidth = 1;
  for (let y = 0; y < height; y += 4) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  // Beveled border
  ctx.strokeStyle = '#666';
  ctx.lineWidth = 3;
  ctx.strokeRect(4, 4, width - 8, height - 8);

  // Title
  ctx.fillStyle = '#1a1a1a';
  ctx.font = 'bold 32px "Inter", sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(project.name, 24, 50);

  // Subtitle
  ctx.fillStyle = '#444';
  ctx.font = 'italic 16px "Inter", sans-serif';
  ctx.fillText(project.subtitle, 24, 80);

  // Divider line
  ctx.strokeStyle = '#888';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(24, 95);
  ctx.lineTo(width - 24, 95);
  ctx.stroke();

  // Description (wrap to fit)
  ctx.fillStyle = '#333';
  ctx.font = '15px "Inter", sans-serif';
  const words = project.description.split(' ');
  let line = '';
  let y = 120;
  const maxWidth = width - 48;
  for (const word of words) {
    const test = line + word + ' ';
    if (ctx.measureText(test).width > maxWidth && line.length > 0) {
      ctx.fillText(line, 24, y);
      line = word + ' ';
      y += 22;
    } else {
      line = test;
    }
  }
  if (line) ctx.fillText(line, 24, y);
  y += 30;

  // Tags
  ctx.fillStyle = '#1f75a3';
  ctx.font = 'bold 14px "Inter", sans-serif';
  let tagX = 24;
  for (const tag of project.tags) {
    const tagW = ctx.measureText(tag).width + 16;
    // Draw tag pill
    ctx.strokeStyle = '#1f75a3';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(tagX, y, tagW, 24, 4);
    ctx.stroke();
    ctx.fillText(tag, tagX + 8, y + 16);
    tagX += tagW + 8;
  }
  y += 40;

  // Links section — rendered subtly, with link zone coordinates recorded
  const linkZones = [];
  if (project.links.length > 0) {
    ctx.fillStyle = '#777';
    ctx.font = '13px "Inter", sans-serif';
    let linkX = 24;
    for (const link of project.links) {
      const iconMap = { itch: '🎮', gh: '⌥', web: '↗' };
      const icon = iconMap[link.icon] || '→';
      const label = icon + ' ' + link.label;
      const labelW = ctx.measureText(label).width;
      ctx.fillText(label, linkX, y);

      // Record normalized link zone for raycasting
      linkZones.push({
        label: link.label,
        url: link.url,
        xMin: linkX / width,
        xMax: (linkX + labelW) / width,
        yMin: (y - 14) / height,
        yMax: (y + 4) / height,
      });

      linkX += labelW + 20;
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.colorSpace = THREE.SRGBColorSpace;
  return { texture, linkZones };
}

// ── 3D Plaque Builders ─────────────────────────────────

/** Gold-and-wood header plaque centered above the wall. */
export function buildHeaderPlaque(scene) {
  const texture = renderHeaderTexture();
  const material = new THREE.MeshStandardMaterial({
    map: texture,
    roughness: 0.5,
    metalness: 0.3,
  });

  const geo = new THREE.BoxGeometry(6, 1.5, 0.15, 1, 1, 1);
  const mesh = new THREE.Mesh(geo, material);
  mesh.position.set(0, 8.3, 0.6); // above wall
  mesh.castShadow = true;
  scene.add(mesh);
  return mesh;
}

/** Brushed-metal project plaques beside each cavity. */
export function buildProjectPlaques(scene, cavityData) {
  const plaqueObjects = [];

  for (let i = 0; i < cavityData.length; i++) {
    const cd = cavityData[i];
    const { texture, linkZones } = renderProjectTexture(cd.project);

    const material = new THREE.MeshStandardMaterial({
      map: texture,
      roughness: 0.55,
      metalness: 0.75,
    });

    const geo = new THREE.BoxGeometry(1.6, 1.1, 0.06, 1, 1, 1);
    const mesh = new THREE.Mesh(geo, material);

    // Alternate plaque position left/right of cavity
    const side = i % 2 === 0 ? 1 : -1;
    const offsetX = side * 1.6;
    mesh.position.set(cd.worldX + offsetX, cd.worldY + 0.1, cd.wallZ + 0.04);
    mesh.castShadow = true;

    scene.add(mesh);

    plaqueObjects.push({ mesh, project: cd.project, linkZones });
  }

  return plaqueObjects;
}
```

- [ ] **Step 2: Update `js/main.js` to add plaques**

Add import:
```js
import { buildHeaderPlaque, buildProjectPlaques } from './plaque.js';
```

After carousel setup, add:
```js
buildHeaderPlaque(scene);
const plaqueObjects = buildProjectPlaques(scene, cavityData);
window.__plaqueObjects = plaqueObjects;
```

Full updated `main.js`:

```js
// main.js — Entry point
import { initScene, resizeRenderer } from './scene.js';
import { buildWall } from './wall.js';
import { initScroll, setBounds } from './scroll.js';
import { buildCarousels } from './carousel.js';
import { buildHeaderPlaque, buildProjectPlaques } from './plaque.js';
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

  // Carousels inside cavities
  const { update: updateCarousels } = buildCarousels(scene, cavityData);

  // Plaques
  buildHeaderPlaque(scene);
  const plaqueObjects = buildProjectPlaques(scene, cavityData);

  // Scroll bounds
  const firstX = cavityData[0].worldX;
  const lastX = cavityData[cavityData.length - 1].worldX;
  setBounds(firstX - 5, lastX + 5);

  camera.position.set(firstX, 4, 6);
  camera.lookAt(firstX, 4, 0);

  const scrollCtrl = initScroll(camera);

  // Store references
  window.__plaqueObjects = plaqueObjects;

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

  const loadingEl = document.getElementById('loading-screen');
  if (loadingEl) loadingEl.classList.add('hidden');

  requestAnimationFrame(animate);
}

main();
```

- [ ] **Step 3: Commit**

```bash
git add js/plaque.js js/main.js
git commit -m "feat: add header and project plaques via canvas-to-texture rendering
Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 8: Environment — floor, pilasters, and category labels

**Files:**
- Create: `js/environment.js`
- Modify: `js/main.js` (import and call buildEnvironment)

Adds the dark wood floor plane, category-dividing pilasters (columns) between wall sections, and small category label text planes above each section. These elements reinforce the museum metaphor.

- [ ] **Step 1: Write `js/environment.js`**

```js
// environment.js — Floor, category pilasters, and section labels.
//
// Exports:
//   buildEnvironment(scene, projects, categoryOrder) → void

import * as THREE from 'three';

const WALL_WIDTH = 50;
const WALL_HEIGHT = 8;
const WALL_Y_CENTER = 4;
const WALL_THICKNESS = 0.6;
const CAVITY_SPACING = 2.8;
const START_X = -22;

// ── Materials ──────────────────────────────────────────
const floorMaterial = new THREE.MeshStandardMaterial({
  color: 0x3a2a1a,
  roughness: 0.7,
  metalness: 0.05,
});

const columnMaterial = new THREE.MeshStandardMaterial({
  color: 0xe8e0d4,
  roughness: 0.8,
  metalness: 0.02,
});

function makeLabelTexture(text) {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#c0b0a0';
  ctx.font = 'italic 28px "EB Garamond", Georgia, serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 128, 32);

  const tex = new THREE.CanvasTexture(canvas);
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function buildEnvironment(scene, projects, categoryOrder) {
  // ── Floor ────────────────────────────────────────────
  const floorGeo = new THREE.PlaneGeometry(WALL_WIDTH + 4, 8);
  const floor = new THREE.Mesh(floorGeo, floorMaterial);
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(0, 0.05, -2);
  floor.receiveShadow = true;
  scene.add(floor);

  // ── Category pilasters & labels ──────────────────────
  // Calculate where each category's first cavity starts and
  // place a column just before it.
  let cursorX = START_X;

  for (let ci = 0; ci < categoryOrder.length; ci++) {
    const category = categoryOrder[ci];
    const catProjects = projects.filter(p => p.category === category);

    if (ci > 0) {
      // Place pilaster at the gap before this category
      const colX = cursorX - 0.3;
      const colGeo = new THREE.BoxGeometry(0.2, WALL_HEIGHT, 0.15);
      const col = new THREE.Mesh(colGeo, columnMaterial);
      col.position.set(colX, WALL_Y_CENTER, 0.35);
      col.castShadow = true;
      col.receiveShadow = true;
      scene.add(col);

      // Category label above the column
      const labelTex = makeLabelTexture(category);
      const labelMat = new THREE.MeshBasicMaterial({
        map: labelTex,
        transparent: true,
        depthWrite: false,
      });
      const labelGeo = new THREE.PlaneGeometry(2, 0.5);
      const label = new THREE.Mesh(labelGeo, labelMat);
      label.position.set(colX, WALL_Y_CENTER + WALL_HEIGHT / 2 + 0.4, 0.5);
      scene.add(label);
    }

    // Advance cursor past this category's cavities
    cursorX += catProjects.length * CAVITY_SPACING + 0.6;
  }

  // ── Baseboard ────────────────────────────────────────
  const baseGeo = new THREE.BoxGeometry(WALL_WIDTH, 0.3, 0.08);
  const baseMat = new THREE.MeshStandardMaterial({
    color: 0x2a1a0a,
    roughness: 0.6,
    metalness: 0.1,
  });
  const baseboard = new THREE.Mesh(baseGeo, baseMat);
  baseboard.position.set(0, 0.2, 0.35);
  baseboard.receiveShadow = true;
  scene.add(baseboard);
}
```

- [ ] **Step 2: Update `js/main.js`**

Add import:
```js
import { buildEnvironment } from './environment.js';
```

After plaque setup, add:
```js
buildEnvironment(scene, projects, categoryOrder);
```

Full updated `main.js`:

```js
// main.js — Entry point
import { initScene, resizeRenderer } from './scene.js';
import { buildWall } from './wall.js';
import { initScroll, setBounds } from './scroll.js';
import { buildCarousels } from './carousel.js';
import { buildHeaderPlaque, buildProjectPlaques } from './plaque.js';
import { buildEnvironment } from './environment.js';
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

  // Wall with CSG cavities
  const { wallGroup, cavityData } = await buildWall(scene, projects, categoryOrder);

  // Carousels
  const { update: updateCarousels } = buildCarousels(scene, cavityData);

  // Plaques
  buildHeaderPlaque(scene);
  const plaqueObjects = buildProjectPlaques(scene, cavityData);

  // Environment (floor, columns, baseboard)
  buildEnvironment(scene, projects, categoryOrder);

  // Scroll bounds
  const firstX = cavityData[0].worldX;
  const lastX = cavityData[cavityData.length - 1].worldX;
  setBounds(firstX - 5, lastX + 5);

  camera.position.set(firstX, 4, 6);
  camera.lookAt(firstX, 4, 0);

  const scrollCtrl = initScroll(camera);

  window.__plaqueObjects = plaqueObjects;

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

  const loadingEl = document.getElementById('loading-screen');
  if (loadingEl) loadingEl.classList.add('hidden');

  requestAnimationFrame(animate);
}

main();
```

- [ ] **Step 3: Commit**

```bash
git add js/environment.js js/main.js
git commit -m "feat: add floor, pilasters, baseboard, and category labels
Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 9: Link interactions — raycaster hover & click on plaques

**Files:**
- Create: `js/interactions.js`
- Modify: `js/main.js` (import and call initInteractions)

Uses a Three.js Raycaster to detect when the mouse hovers over link zones on project plaques. On hover: cursor changes to pointer, the link text subtly brightens. On click: opens the external URL in a new tab.

- [ ] **Step 1: Write `js/interactions.js`**

```js
// interactions.js — Raycaster-based hover/click on plaque links.
//
// Exports:
//   initInteractions(camera, renderer, plaqueObjects) → { update() }

import * as THREE from 'three';

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

let cameraRef = null;
let rendererRef = null;
let plaques = [];
let hoveredLink = null;   // { plaqueObject, linkZone }
let cursorStyle = '';

export function initInteractions(camera, renderer, plaqueObjects) {
  cameraRef = camera;
  rendererRef = renderer;
  plaques = plaqueObjects;

  window.addEventListener('mousemove', onMouseMove);
  window.addEventListener('click', onClick);

  // Push a "continuing in terminal" style div to body for cursor management
  const styleEl = document.createElement('style');
  styleEl.textContent = `
    canvas { cursor: default; }
    canvas.interactive-hover { cursor: pointer; }
  `;
  document.head.appendChild(styleEl);

  return {
    /**
     * Call each frame (after renderer.render).
     * Handles cursor state.
     */
    update() {
      // Cursor state is already set in mousemove handler
    },

    /** Remove event listeners. */
    dispose() {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('click', onClick);
      document.body.style.cursor = '';
    },
  };
}

function onMouseMove(e) {
  if (!cameraRef || !rendererRef) return;

  // Normalized device coords
  mouse.x = (e.clientX / rendererRef.domElement.clientWidth) * 2 - 1;
  mouse.y = -(e.clientY / rendererRef.domElement.clientHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, cameraRef);

  // Check intersection with plaque meshes
  const intersectMeshes = plaques.map(p => p.mesh);
  const hits = raycaster.intersectObjects(intersectMeshes);

  const canvas = rendererRef.domElement;

  if (hits.length > 0) {
    const hit = hits[0];
    const plaqueObj = plaques.find(p => p.mesh === hit.object);
    if (!plaqueObj) {
      clearHover(canvas);
      return;
    }

    // Get UV coordinates at intersection point
    const uv = hit.uv;
    if (!uv) {
      clearHover(canvas);
      return;
    }

    // Check if UV falls within any link zone
    let found = null;
    for (const zone of plaqueObj.linkZones) {
      if (
        uv.x >= zone.xMin && uv.x <= zone.xMax &&
        uv.y >= zone.yMin && uv.y <= zone.yMax
      ) {
        found = { plaqueObj, zone };
        break;
      }
    }

    if (found) {
      if (hoveredLink !== found) {
        hoveredLink = found;
        canvas.classList.add('interactive-hover');
      }
    } else {
      clearHover(canvas);
    }
  } else {
    clearHover(canvas);
  }
}

function clearHover(canvas) {
  hoveredLink = null;
  if (canvas) canvas.classList.remove('interactive-hover');
}

function onClick(e) {
  if (hoveredLink) {
    window.open(hoveredLink.zone.url, '_blank', 'noopener');
    hoveredLink = null;
  }
}
```

- [ ] **Step 2: Update `js/main.js`**

Add import:
```js
import { initInteractions } from './interactions.js';
```

After environment setup, add:
```js
initInteractions(camera, renderer, plaqueObjects);
```

Full final `main.js`:

```js
// main.js — Entry point
import { initScene, resizeRenderer } from './scene.js';
import { buildWall } from './wall.js';
import { initScroll, setBounds } from './scroll.js';
import { buildCarousels } from './carousel.js';
import { buildHeaderPlaque, buildProjectPlaques } from './plaque.js';
import { buildEnvironment } from './environment.js';
import { initInteractions } from './interactions.js';
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

  // Wall with CSG cavities
  const { wallGroup, cavityData } = await buildWall(scene, projects, categoryOrder);

  // Carousels inside cavities
  const { update: updateCarousels } = buildCarousels(scene, cavityData);

  // Plaques
  buildHeaderPlaque(scene);
  const plaqueObjects = buildProjectPlaques(scene, cavityData);

  // Environment
  buildEnvironment(scene, projects, categoryOrder);

  // Link interactions on plaques
  initInteractions(camera, renderer, plaqueObjects);

  // Scroll bounds
  const firstX = cavityData[0].worldX;
  const lastX = cavityData[cavityData.length - 1].worldX;
  setBounds(firstX - 5, lastX + 5);

  camera.position.set(firstX, 4, 6);
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

  const loadingEl = document.getElementById('loading-screen');
  if (loadingEl) loadingEl.classList.add('hidden');

  requestAnimationFrame(animate);
}

main();
```

- [ ] **Step 3: Commit**

```bash
git add js/interactions.js js/main.js
git commit -m "feat: add raycaster-based link hover and click interaction on plaques
Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 10: Polish — loading bar progress, preserve modern/ fallback, final integration

**Files:**
- Modify: `js/wall.js` (loading bar is already wired — verify it works)
- Verify: `modern/` directory exists as WebGL fallback target
- Modify: `.gitignore` (add `.superpowers/`)

- [ ] **Step 1: Ensure `modern/` directory exists as fallback**

```bash
ls modern/
```

If the `modern/` directory exists and contains a static version of the portfolio (it was in the file listing earlier), it's already the fallback target. If `modern/index.html` doesn't exist, copy the old `index.html` and `main.css` there before the rewrite.

- [ ] **Step 2: Add `.superpowers/` to `.gitignore`**

```bash
echo ".superpowers/" >> .gitignore
```

Or add the line if `.gitignore` doesn't exist:

```bash
echo ".superpowers/" > .gitignore
```

- [ ] **Step 3: Verify the loading progress bar wiring in `js/wall.js`**

The `setProgress` function in `buildWall()` already updates `#loading-bar` width and `#loading-text` content at key milestones (5%, 10%, per-cavity during CSG, 85%). Confirm the IDs match what's in `index.html`: `loading-screen`, `loading-bar`, `loading-text`. They do — check passed.

- [ ] **Step 4: Final verification checklist**

Manual verification tasks for the implementer:
1. Open `index.html` in a browser — loading bar should animate from 0% to 85%, then the loading screen fades out
2. A red test cube should appear (holdover from scene test — remove if desired)
3. The 50m plaster wall should be visible with irregular cavities
4. Scrolling should walk the camera along the wall
5. Carousels should auto-rotate inside cavities
6. Header plaque "SANO'S PORTFOLIO" visible above wall
7. Project plaques beside cavities with correct project text
8. Hovering over a link icon on a plaque should change cursor to pointer
9. Clicking a link should open the project URL in a new tab
10. If WebGL is disabled, should redirect to `modern/index.html`

- [ ] **Step 5: Commit**

```bash
git add .gitignore js/wall.js
git commit -m "chore: add .gitignore for .superpowers/, verify loading bar and fallback
Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Implementation Order

Tasks must run sequentially in numbered order — each builds on the previous:

```
Task 1 (HTML scaffold) → Task 2 (data) → Task 3 (scene) → Task 4 (wall + CSG)
  → Task 5 (scroll) → Task 6 (carousels) → Task 7 (plaques)
  → Task 8 (environment) → Task 9 (interactions) → Task 10 (polish)
```

## Notes for the Implementer

1. **CDN versions:** The import map uses Three.js 0.170.0, three-mesh-bvh 0.7.6, and three-bvh-csg 0.0.9. If these exact versions are unavailable on jsdelivr, adjust to the nearest available versions. Run `npx jsdelivr resolve three@0.170.0` to verify.

2. **CSG performance:** The 16 sequential CSG operations will take 2–5 seconds total on a modern desktop. The loading bar provides visual feedback during this time. On slower devices it may take longer — the `setTimeout(0)` yield every 4 cavities keeps the UI from freezing.

3. **Cross-origin images:** Some project images are loaded from `img.itch.zone` and `github.com` — these should load fine as textures since Three.js texture loading uses `<img>` tags which support CORS by default for display purposes. If issues arise, add `crossOrigin: 'anonymous'` to the TextureLoader.

4. **Video autoplay:** Modern browsers block unmuted autoplay. The carousel module calls `video.play()` which may return a rejected promise. The catch handler silently ignores this — videos will start playing on first user interaction (scroll/click) due to browser autoplay policy.

5. **Touch devices:** The scroll module handles single-finger vertical swipe as scroll input. For best mobile experience, test on actual devices and tune `SCROLL_SENSITIVITY` if needed.
