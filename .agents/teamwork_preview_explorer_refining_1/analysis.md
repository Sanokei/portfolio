# Synthesis & Analysis Report: Portfolio Gallery Refining

## Executive Summary
This report summarizes the read-only investigation of the Portfolio codebase, reconciling previous findings with a deep-dive analysis of local project files, AppData directories, and repository logs. The findings cover:
1. Video element and texture creation and playback management.
2. An optimization plan to defer video source assignment and loading until project screens are within 8 units vertically of the camera.
3. Mechanics of project ordering and interactive canvas-to-texture plaques.
4. The exact creation/initial commit years for all 22 projects (reconciling portfolio repo additions vs. actual project creation dates).
5. Instructions for removing the 'Media' link from the *Handjob: The Blower Gallery* project.

---

## 1. Video Tag/Loader Creation and Playback Management
All HTML5 video elements, Three.js textures, and playback synchronization logic are managed in:
- **`js/carousel.js`**

### Video Creation & Loading
When a project's asset is defined with `{ type: 'video' }` in `js/projects.js`, the function `createTextureForAsset(asset, project)` procedurally sets up the media:
1. **Element Instantiation**: An HTML5 `<video>` element is created:
   ```javascript
   const video = document.createElement('video');
   video.src = asset.src;
   video.loop = true;
   video.muted = true;
   video.playsInline = true;
   video.crossOrigin = 'anonymous';
   video.preload = 'auto';
   ```
2. **Texture Mapping**: A `THREE.VideoTexture(video)` wrapper is created to stream the video frames onto the 3D CRT model's screen geometry.
3. **Immediate Load**: Listeners replace a static/noise fallback texture once the video is ready, and `video.load()` is called immediately:
   ```javascript
   const markReady = () => {
     item.texture = videoTexture;
     item.loaded = true;
   };
   video.addEventListener('loadeddata', markReady, { once: true });
   video.addEventListener('canplay', markReady, { once: true });
   video.addEventListener('error', () => { item.loaded = true; }, { once: true });
   video.load();
   ```

### Playback Synchronization Loop
Playback is synchronized during the main animation loop (`carouselCtrl.update()` in `js/main.js` calling `update(dt)` in `js/carousel.js`):
- **On-Screen Auto-Play (`syncActiveVideo(crt)`)**: If a CRT screen is visible, this function checks the active media slide (`crt.state.active`). If it's a video and paused, it initiates `.play()`. Any inactive video assets on the same CRT are paused.
- **Off-Screen Parking (`pauseVideos(crt)`)**: If the screen is projected and found to be outside viewport bounds (or has less than `MIN_VISIBLE_PIXELS = 12` visible), `pauseVideos(crt)` is called immediately to pause all video elements, freeing CPU/GPU decoding cycles.

---

## 2. Proposal: Deferring Video Loading & Playback Optimization

Currently, the browser initializes and loads all video files concurrently at startup, wasting substantial bandwidth and memory. We propose deferring `video.src` assignment and `video.load()` until the project's CRT is close to the camera.

### Implementation Blueprint
1. **Defer in `createTextureForAsset`**: Do not set `video.src` or call `.load()` initially. Stash the URL on a new property and mark it deferred:
   ```javascript
   if (asset.type === 'video') {
     const video = document.createElement('video');
     video.loop = true;
     video.muted = true;
     video.playsInline = true;
     video.crossOrigin = 'anonymous';
     video.preload = 'auto';

     const fallbackTexture = createStaticTexture();
     const videoTexture = new THREE.VideoTexture(video);

     return {
       texture: fallbackTexture,
       fallbackTexture,
       videoTexture,
       video,
       videoSrc: asset.src, // Stash URL
       srcLoaded: false,    // Track state
       loaded: false,
       playPending: false,
     };
   }
   ```
2. **Modify the Update Loop in `buildCarousels`**: Receive the camera's Y position (`cameraY`) in `update(dt, cameraY)` (already passed from `main.js`). Iterate over all CRTs and compute vertical distance:
   ```javascript
   const distY = Math.abs(cameraY - crt.cd.worldY);
   if (distY <= 8) {
     // Trigger lazy load for all deferred videos in this CRT
     for (const item of crt.media) {
       if (item.videoSrc && !item.srcLoaded) {
         item.srcLoaded = true;
         const video = item.video;
         const markReady = () => {
           item.texture = item.videoTexture;
           item.loaded = true;
         };
         video.addEventListener('loadeddata', markReady, { once: true });
         video.addEventListener('canplay', markReady, { once: true });
         video.addEventListener('error', () => { item.loaded = true; }, { once: true });
         video.src = item.videoSrc;
         video.load();
         if (video.readyState >= 2) markReady();
       }
     }
   } else {
     // Memory Reclamation: Unload video when camera moves far away
     for (const item of crt.media) {
       if (item.videoSrc && item.srcLoaded) {
         item.srcLoaded = false;
         item.loaded = false;
         item.texture = item.fallbackTexture;
         item.video.pause();
         item.video.removeAttribute('src');
         item.video.load();
       }
     }
   }
   ```
3. **Visibility Integration**: Since the existing loop already parks off-screen CRTs via `pauseVideos(crt)` and only runs `syncActiveVideo(crt)` on active visible CRTs, combining this distance-based load ensures videos only download and play when nearby and visible.

---

## 3. Project Ordering & Plaque Rendering

### Project Ordering
The vertical stacking of projects along the museum wall is determined by:
1. **Category Order**: The array `categoryOrder` in `js/projects.js` sets the sections top-to-bottom: `['Games', 'Websites', 'Programs', 'Videos', 'Board Games']`.
2. **Sequence in Array**: Within each category, projects are laid out in the exact sequence they appear in the `projects` array of `js/projects.js`.
3. **Coordinates**: `buildModuleLayout` in `js/layout.js` calculates the positions starting at `startY` and decrementing Y coordinates downwards (`cursorY -= spacing`), inserting a larger `categoryGap` between sections. Horizontal alternating left/right layout is driven by `globalIndex % 2`.

### Plaque Rendering (`js/plaque.js`)
1. **Header Plaque**: `buildHeaderPlaque` uses `renderHeaderTexture` to create a 2D canvas of "THE PORTFOLIO" with a subtitle and maps it as a texture onto a 3D box.
2. **Project Plaques**: `buildProjectPlaques` uses `renderProjectTexture(project)` to construct a 760x520 canvas for each project:
   - Draws boundaries, gold inner margins, title, subtitle, wrapped description text, tags, and link buttons.
   - It fetches and caches icons for links (`GitHub`, `itch.io`, etc.).
   - Normalizes coordinates of pill buttons and registers them in the `linkZones` array so the raycaster in `js/interactions.js` can map click coordinates to URL redirections.
   - Maps the canvas onto a physical `BoxGeometry` and uses standard materials to cast realistic museum shadows.

---

## 4. Reconciled Project Creation Years (22 Projects)

By cross-referencing repository logs with local directory creation times and AppData LocalLow Unity directories on Sano's system, we reconciled the **first introduction in the Portfolio repository** (which has 2024 and 2026 commits) against the **actual project creation/release years**:

| # | Project Name | Category | Portfolio Commit Year | Actual Creation Year | Evidence Source & Rationale |
|---|---|---|:---:|:---:|---|
| 1 | Coot's Bug Squasher | Games | 2024 | **2023** | LocalLow save data created on **2023-02-18**. |
| 2 | Adventure of Sir Robin | Games | 2024 | **2024** | LocalLow save data created on **2024-04-10**. |
| 3 | Intern | Games | 2024 | **2024** | Video assets and index.pdf introduced in **2024**. |
| 4 | Productivity App | Games | 2024 | **2023** | LocalLow save data created on **2023-06-10**. |
| 5 | Corruption | Games | 2024 | **2024** | LocalLow save data created on **2024-04-04**. |
| 6 | Curling The Herd | Games | 2024 | **2023** | LocalLow save data created on **2023-04-19**. |
| 7 | We Mice | Games | 2026 | **2025** | Local source directory `ParkourCiv` created on **2025-03-31**. |
| 8 | Fish out of Water | Games | 2026 | **2024** | Compiled executables in local `Fish` folder written on **2024-08-26**. |
| 9 | Handjob: The Blower Gallery | Games | 2026 | **2026** | LocalLow save data created on **2026-02-06**. |
| 10| The Arcane Observer | Websites | 2024 | **2024** | Local project directory created on **2024-03-24**. |
| 11| [ new tab ] - Doodle | Websites | 2024 | **2024** | Assets first added to repository in **2024-04-10**. |
| 12| Emoji Game | Websites | 2024 | **2024** | Local git repository first commit on **2024-03-23**. |
| 13| ExNoto | Websites | 2024 | **2024** | Local `Exnoto Blog` folder created on **2024-02-06**. |
| 14| clamtap | Websites | 2024 | **2024** | Local project directory created on **2024-05-13**. |
| 15| Art Allergy | Websites | 2026 | **2026** | Local git repository first commit on **2026-06-12**. |
| 16| Index of Babel | Websites | 2026 | **2026** | Local git repository first commit on **2026-06-11**. |
| 17| VOD Highlighter | Programs | 2024 | **2024** | Local `Highlander Project` folder created on **2024-01-19**. |
| 18| David The Duck | Programs | 2024 | **2024** | Gif asset first added to repository on **2024-04-10**. |
| 19| TrainEngine | Programs | 2026 | **2026** | Introduced in the 2026 repository rebuild (no local pre-existing folder). |
| 20| Sano Fails to Sell Spotify™ Tattoos | Videos | 2024 | **2023** | Local `Spotify Code` project directory created on **2023-12-02**. |
| 21| Merlin Economics | Board Games | 2024 | **2024** | Rule book documents and spreadsheets created on **2024-03-09**. |
| 22| Kanta | Board Games | 2024 | **2024** | Introduced in the original 2024 index.html fallback. |

---

## 5. Handjob Project: Removing the 'Media' Link
- **Target File**: `js/projects.js`
- **Location**: Project object with ID `19` (*Handjob: The Blower Gallery*).

### Modification Instructions
Remove the `{ label: 'Media', ... }` link object from the project's `links` array.

**Code Difference:**
```diff
     tags: ['Development', 'AI', 'FMV', 'Design'],
     links: [
       { label: 'GitHub', url: 'https://github.com/Sanokei/Handjob-The-Blower-Gallery', icon: 'gh' },
-      { label: 'Media', url: 'https://github.com/Sanokei/Handjob-The-Blower-Gallery/tree/main/Assets/Art/Intro', icon: 'web' },
     ],
     assets: [
```
This changes the rendered plaque layout dynamically, recalculating the bounding interaction zones in `js/plaque.js` to ensure the "Media" button is neither visible nor clickable.
