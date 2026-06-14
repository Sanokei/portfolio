# Portfolio Analysis Report

This report summarizes the findings from the exploration of the Portfolio codebase regarding video management, layout rendering, historical project data, and project-specific links.

---

## 1. Video Tag and Loader Creation, Playback Management

### Video Tag/Loader Creation
- **File**: `js/carousel.js` (Lines 150-187)
- **Function**: `createTextureForAsset(asset, project)`
- **Mechanism**:
  When an asset has type `video`, a HTML5 `<video>` element is created procedurally:
  ```javascript
  const video = document.createElement('video');
  video.src = asset.src;
  video.loop = true;
  video.muted = true;
  video.playsInline = true;
  video.crossOrigin = 'anonymous';
  video.preload = 'auto';
  ```
  It initializes a fallback static texture and creates a `THREE.VideoTexture(video)` to map the video stream onto the 3D CRT screen geometry. The asset loading listeners are set up, and `video.load()` is immediately called:
  ```javascript
  video.addEventListener('loadeddata', markReady, { once: true });
  video.addEventListener('canplay', markReady, { once: true });
  video.addEventListener('error', () => { item.loaded = true; }, { once: true });
  video.load();
  ```

### Playing and Pausing Logic
- **File**: `js/carousel.js`
- **Pausing Videos**:
  Managed via `pauseVideos(crt)` (Lines 371-376) which loops through all media associated with the CRT, resets play pendings, and pauses any active video:
  ```javascript
  function pauseVideos(crt) {
    for (const item of crt.media) {
      item.playPending = false;
      if (item.video && !item.video.paused) item.video.pause();
    }
  }
  ```
- **Playing Videos**:
  Managed via `syncActiveVideo(crt)` (Lines 378-400). It iterates through the CRT's media. If the item index matches `crt.state.active` (the currently visible slide), it initiates play:
  ```javascript
  if (i === crt.state.active) {
    if (video.paused && !item.playPending) {
      item.playPending = true;
      try {
        Promise.resolve(video.play())
          .catch(() => {})
          .finally(() => { item.playPending = false; });
      } catch {
        item.playPending = false;
      }
    }
  } else if (!video.paused) {
    item.playPending = false;
    video.pause(); // Pauses all non-active video channels
  }
  ```

---

## 2. Proposal to Defer Video Loading and Playback Optimization

### Deferring `video.src` and `video.load()`
Currently, the codebase loads all video assets during scene setup, which causes heavy initial network and memory usage. We propose storing the source URL on the media object and setting `video.src` only when the camera Y-coordinate is near the project.

#### A. Modify `createTextureForAsset` (`js/carousel.js`):
Do not set `video.src` or call `video.load()` initially. Stash the URL on the item and return it:
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
    loaded: false,
    playPending: false,
    videoSrc: asset.src, // Stash the video source URL
    srcLoaded: false,    // Track if loading has initiated
  };
}
```

#### B. Update signature and update loop in `buildCarousels` (`js/carousel.js`):
Receive `cameraY` in `update(dt, cameraY)` (already passed from `js/main.js` as `camera.position.y`). Inside the `for (const crt of crts)` loop:
```javascript
const distY = Math.abs(cameraY - crt.cd.worldY);
if (distY <= 8) {
  // Trigger deferred load for all video items in this CRT
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
  // Optional Memory Reclamation: Unload video if camera wanders far away (> 8 units)
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

### Playing Only When Visible and Pausing Out of View
The current update loop structure in `js/carousel.js` already guarantees this behavior:
1. **Pausing**: If `screenVisible` (calculated by projection to viewport boundary box) is `false`, the update loop immediately calls `pauseVideos(crt)` and executes `continue` to skip the active playback code block.
2. **Playing**: `syncActiveVideo(crt)` is only reached and called if `screenVisible` is `true`. By combining our deferred load check with this visibility guard, the video will safely remain paused and unloaded until it is both close enough (`distY <= 8`) and visible on-screen.

---

## 3. Project Ordering and Plaque Rendering

### Project Ordering
Projects are positioned vertically along the 3D museum wall using coordinates defined in `js/layout.js` inside `buildModuleLayout(projects, categoryOrder)`.
1. **Category Order**: Stated in `js/projects.js` as `export const categoryOrder = ['Games', 'Websites', 'Programs', 'Videos', 'Board Games'];`. Categories are aligned top to bottom.
2. **Sorting/Layout**:
   - The loop in `buildModuleLayout` iterates through `categoryOrder`.
   - Within each category, projects are filtered: `projects.filter(p => p.category === category)`.
   - The filtered array is laid out in the exact sequence they appear in `js/projects.js`.
   - X-positions alternate side-to-side (left vs right) on horizontal layouts based on their global index: `globalIndex % 2 === 0 ? -1 : 1`.

### Plaque Rendering
Managed in `js/plaque.js`:
1. **Header Plaque**:
   - `buildHeaderPlaque(scene)` renders the landing title plaque at `y = headerY`.
   - Utilizes `renderHeaderTexture()` to create a 2D canvas with title "THE PORTFOLIO" and subtitle "projects behind the plaster".
   - Maps the canvas onto a 3D box. Uses a `MeshBasicMaterial` for the front face to maintain absolute, unlit brightness.
2. **Project Plaques**:
   - `buildProjectPlaques(scene, cavityData)` places individual descriptive plaques adjacent to each wall cavity.
   - `renderProjectTexture(project)` builds a canvas with the project name, subtitle, wrapped description text, tags (up to 4), and formatted links with icons.
   - It caches and draws icons for links (`GitHub`, `itch.io`, `YouTube`, `Art Allergy`, `Website`, etc.).
   - Computes `linkZones` containing relative canvas bounds (`xMin, xMax, yMin, yMax`) so raycasting in `js/interactions.js` can map cursor clicks to standard URLs.
   - Side and back faces use a realistic clay-like `MeshStandardMaterial` for structural depth.

---

## 4. Compilation of Project Creation Years (22 Projects)

By running `git log` searches (`-S` and grep searches) in the repository history, the year each project was first introduced to the portfolio index has been extracted:

| # | Project Name | Category | Year |
|---|---|---|---|
| 1 | Coot's Bug Squasher | Games | 2024 |
| 2 | Adventure of Sir Robin | Games | 2024 |
| 3 | Intern | Games | 2024 |
| 4 | Productivity App | Games | 2024 |
| 5 | Corruption | Games | 2024 |
| 6 | Curling The Herd | Games | 2024 |
| 7 | We Mice | Games | 2026 |
| 8 | Fish out of Water | Games | 2026 |
| 9 | Handjob: The Blower Gallery | Games | 2026 |
| 10 | The Arcane Observer | Websites | 2024 |
| 11 | [ new tab ] - Doodle | Websites | 2024 |
| 12 | Emoji Game | Websites | 2024 |
| 13 | ExNoto | Websites | 2024 |
| 14 | clamtap | Websites | 2024 |
| 15 | Art Allergy | Websites | 2026 |
| 16 | Index of Babel | Websites | 2026 |
| 17 | VOD Highlighter | Programs | 2024 |
| 18 | David The Duck | Programs | 2024 |
| 19 | TrainEngine | Programs | 2026 |
| 20 | Sano Fails to Sell Spotify™ Tattoos | Videos | 2024 |
| 21 | Merlin Economics | Board Games | 2024 |
| 22 | Kanta | Board Games | 2024 |

*Note: Projects introduced in 2024 were first found in the original portfolio commit (`e1d28c2` / `a3d890c`) during April/May 2024. The 2026 projects were introduced in the recent June 2026 3D wall updates.*

---

## 5. Identification of the 'Handjob' Project and Link Modification

- **Project Definition**: Located in `js/projects.js` at lines 163-180.
- **Modification**:
  To remove the 'Media' link from the plaque renderer, modify the `links` array of the project with ID 19 (`Handjob: The Blower Gallery`).

### Code Difference

#### Before:
```javascript
  {
    id: 19,
    name: 'Handjob: The Blower Gallery',
    category: 'Games',
    subtitle: 'AI FMV Game Proof of Concept',
    description:
      'A proof of concept for an AI FMV game about anthropomorphic hands planning ' +
      'and executing a heist together, then dealing with its aftermath.',
    tags: ['Development', 'AI', 'FMV', 'Design'],
    links: [
      { label: 'GitHub', url: 'https://github.com/Sanokei/Handjob-The-Blower-Gallery', icon: 'gh' },
      { label: 'Media', url: 'https://github.com/Sanokei/Handjob-The-Blower-Gallery/tree/main/Assets/Art/Intro', icon: 'web' },
    ],
    assets: [
      { type: 'video', src: 'https://raw.githubusercontent.com/Sanokei/Handjob-The-Blower-Gallery/main/Assets/Art/Intro/Truck.mov' },
      { type: 'image', src: 'https://raw.githubusercontent.com/Sanokei/Handjob-The-Blower-Gallery/main/Assets/Art/Intro/_Table.png' },
      { type: 'video', src: 'https://raw.githubusercontent.com/Sanokei/Handjob-The-Blower-Gallery/main/Assets/Art/Intro/Heist.mov' },
    ],
  },
```

#### After:
```javascript
  {
    id: 19,
    name: 'Handjob: The Blower Gallery',
    category: 'Games',
    subtitle: 'AI FMV Game Proof of Concept',
    description:
      'A proof of concept for an AI FMV game about anthropomorphic hands planning ' +
      'and executing a heist together, then dealing with its aftermath.',
    tags: ['Development', 'AI', 'FMV', 'Design'],
    links: [
      { label: 'GitHub', url: 'https://github.com/Sanokei/Handjob-The-Blower-Gallery', icon: 'gh' },
    ],
    assets: [
      { type: 'video', src: 'https://raw.githubusercontent.com/Sanokei/Handjob-The-Blower-Gallery/main/Assets/Art/Intro/Truck.mov' },
      { type: 'image', src: 'https://raw.githubusercontent.com/Sanokei/Handjob-The-Blower-Gallery/main/Assets/Art/Intro/_Table.png' },
      { type: 'video', src: 'https://raw.githubusercontent.com/Sanokei/Handjob-The-Blower-Gallery/main/Assets/Art/Intro/Heist.mov' },
    ],
  },
```
Removing the object `{ label: 'Media', ... }` prevents the plaque system from drawing the media button, and dynamically recalculates the bounding interaction box in `js/plaque.js`.
