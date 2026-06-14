# Analysis Report — Museum Gallery Exploration

This report documents findings from a read-only investigation of the portfolio codebase. It covers:
1. Video Tag/Loader Creation and Playback Management
2. Proposal for Deferring Video Loading and Playback Optimization
3. Project Ordering and Plaque Rendering Mechanics
4. Project Creation/Initial Commit Years for All 22 Projects
5. Removal of the 'Media' Link in the Handjob Project

---

## 1. Video Tag/Loader Creation and Playback Management

### Location
All HTML5 video elements, Three.js textures, and playback synchronization logic are managed in:
- **`js/carousel.js`**

### Creation & Loading
In `js/carousel.js`, the function `createTextureForAsset(asset, project)` handles the instantiation of textures. If the asset type is `'video'`, the following occurs:
1. A video element is dynamically created using the standard DOM API:
   ```javascript
   const video = document.createElement('video');
   ```
2. The video element is configured for inline, looped, and silent background autoplay:
   ```javascript
   video.src = asset.src;
   video.loop = true;
   video.muted = true;
   video.playsInline = true;
   video.crossOrigin = 'anonymous';
   video.preload = 'auto';
   ```
3. A `THREE.VideoTexture(video)` wrapper is instantiated to feed the video frames as a GPU texture.
4. Listeners are attached to the video element to replace the initial static/noise texture with the video texture once it starts loading:
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

### Playback State Logic
Video playing and pausing are driven by two main mechanisms in `js/carousel.js`:
- **Active Video Syncing (`syncActiveVideo(crt)`)**: Called during updates to check if the currently active asset in the CRT's media array is a video. If it is active and currently paused, it triggers `.play()`. For all other inactive media elements on the same CRT, it triggers `.pause()`.
- **Visibility-based Parking (`pauseVideos(crt)`)**: When a CRT screen is projected to screen space via `projectCrtToScreen(crt)` and checked against visibility limits in `isScreenActuallyVisible(rect)` (requiring at least `MIN_VISIBLE_PIXELS = 12`), if it is deemed off-screen, `pauseVideos(crt)` is immediately invoked. This calls `.pause()` on all video elements for that CRT to free up CPU/GPU cycles.

---

## 2. Proposal: Deferring Video Loading & Playback

Currently, all videos in the gallery are initialized, their `src` attribute assigned, and `video.load()` called immediately when the gallery page is loaded, regardless of how far they are from the camera. This results in high initial network bandwidth and browser decoding overhead.

### Optimization Strategy
1. **Defer Initialization**: Store the video source URL on the asset object but do not assign `video.src` or call `video.load()` initially. Mark the item with an `isDeferred: true` flag.
2. **Camera Distance Check**: During the gallery's standard render loop (`update(dt)` in `buildCarousels`), compute the vertical Y-distance between the camera and the CRT group.
3. **Lazy Load on Proximity**: If the CRT screen's vertical Y-coordinate is within 8 units of the camera's Y-coordinate, load the video by setting `src`, attaching listeners, and calling `.load()`.

### Code Implementation Sketch
Proposed changes in **`js/carousel.js`**:

#### A. Deferring in `createTextureForAsset`
```javascript
// Modify video block in createTextureForAsset (Lines 150-187):
if (asset.type === 'video') {
  const video = document.createElement('video');
  video.loop = true;
  video.muted = true;
  video.playsInline = true;
  video.crossOrigin = 'anonymous';
  video.preload = 'auto'; // Will not load until src is set

  const fallbackTexture = createStaticTexture();
  const videoTexture = new THREE.VideoTexture(video);
  videoTexture.minFilter = THREE.LinearFilter;
  videoTexture.magFilter = THREE.LinearFilter;
  videoTexture.colorSpace = THREE.SRGBColorSpace;

  const item = {
    texture: fallbackTexture,
    fallbackTexture,
    videoTexture,
    video,
    src: asset.src,      // Store the source path
    loaded: false,
    isDeferred: true,    // Custom flag indicating deferred load
    playPending: false,
  };

  return item; // Do not attach listeners or call load() yet
}
```

#### B. Enhancing `syncActiveVideo`
Avoid attempting to call `.play()` on deferred videos:
```javascript
function syncActiveVideo(crt) {
  for (let i = 0; i < crt.media.length; i++) {
    const item = crt.media[i];
    const video = crt.media[i].video;
    if (!video) continue;

    if (i === crt.state.active) {
      if (video.paused && !item.playPending && !item.isDeferred) {
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
      video.pause();
    }
  }
}
```

#### C. Lazy-loading Trigger in `update(dt)`
Add the distance check and a loader helper inside `buildCarousels`:
```javascript
function loadDeferredVideos(crt) {
  for (const item of crt.media) {
    if (item.video && item.isDeferred) {
      delete item.isDeferred; // Mark as loaded triggered
      const video = item.video;
      video.src = item.src;

      const markReady = () => {
        item.texture = item.videoTexture;
        item.loaded = true;
      };

      video.addEventListener('loadeddata', markReady, { once: true });
      video.addEventListener('canplay', markReady, { once: true });
      video.addEventListener('error', () => { item.loaded = true; }, { once: true });
      video.load();

      if (video.readyState >= 2) markReady();
    }
  }
}

// Inside update(dt):
function update(dt) {
  for (const crt of crts) {
    // Check vertical distance from camera
    const distY = Math.abs(crt.group.position.y - camera.position.y);
    if (distY <= 8) {
      loadDeferredVideos(crt);
    }

    const screenRect = projectCrtToScreen(crt);
    const screenVisible = isScreenActuallyVisible(screenRect);
    crt.group.visible = screenVisible;
    // ... rest of the existing update loop ...
```

---

## 3. Project Ordering & Plaque Rendering

### Project Ordering
The vertical sequence of projects displayed in the museum gallery follows two rules:
1. **Category Ordering**: Sections are stacked vertically from top to bottom according to the export `categoryOrder` in `js/projects.js`:
   `['Games', 'Websites', 'Programs', 'Videos', 'Board Games']`
2. **Sequential Ordering**: Within each category, projects are positioned top-to-bottom in the exact sequence they are defined in the `projects` array of `js/projects.js`.

The coordinate calculations in `buildModuleLayout()` (`js/layout.js`) assign coordinates dynamically:
- Starts at `startY` and moves downward (`cursorY -= spacing`) for each project.
- A category gap (`categoryGap`) is added between sections to avoid collisions.

### Plaque Rendering
Managed in **`js/plaque.js`**:
1. **2D Canvas Rendering**: The function `renderProjectTexture(project)` builds the plaque surface dynamically by writing text and graphics onto a canvas of size `760x520` pixels.
2. **Visual Components**:
   - Background: `#fbfaf7` (light beige) with faint horizontal scanlines.
   - Borders: 5px dark grey `#202020` border, 2px gold `#b89d62` inner margin border.
   - Text Formatting: Title (`EB Garamond`, 40px bold), Subtitle (`EB Garamond`, 23px italic), and Description (`Inter`, 20px). Text is drawn using a custom word-wrap helper `wrap()`.
   - Tags: Outlined rectangles containing the project tags, uppercase, up to 4 tags.
   - Interaction Zones: Links (GitHub, Website, YouTube, etc.) are rendered as dark pill buttons (`#151515`) with icons (fetched asynchronously and cached in `getIcon()`). During rendering, their normalized coordinates are pushed to the `linkZones` array:
     ```javascript
     linkZones.push({
       label: link.label,
       url: link.url,
       xMin: linkX / width,
       xMax: (linkX + labelW) / width,
       yMin: 1 - (linkY + 6) / height,
       yMax: 1 - (linkY - 26) / height,
     });
     ```
3. **3D Mesh Integration**: `buildProjectPlaques` maps this canvas texture onto the front face of a 3D box geometry `BoxGeometry(cd.plaqueW, cd.plaqueH, 0.055)`. It applies standard three.js lighting to the physical model (`makePlaqueMaterials`), ensuring realistic depth shadows in the museum environment.

---

## 4. Project Creation / Initial Commit Years

The following list shows the initial commit/creation year for all 22 projects defined in `js/projects.js`, compiled by tracing the repository's git log history using exact string match queries (`execFileSync('git', ['log', '-S', ...])`):

| # | Project Name | Category | Year |
|---|---|---|---|
| 1 | Coot's Bug Squasher | Games | **2024** |
| 2 | Adventure of Sir Robin | Games | **2024** |
| 3 | Intern | Games | **2024** |
| 4 | Productivity App | Games | **2024** |
| 5 | Corruption | Games | **2024** |
| 6 | Curling The Herd | Games | **2024** |
| 7 | We Mice | Games | **2026** |
| 8 | Fish out of Water | Games | **2026** |
| 9 | Handjob: The Blower Gallery | Games | **2026** |
| 10 | The Arcane Observer | Websites | **2024** |
| 11 | [ new tab ] - Doodle | Websites | **2024** |
| 12 | Emoji Game | Websites | **2024** |
| 13 | ExNoto | Websites | **2024** |
| 14 | clamtap | Websites | **2024** |
| 15 | Art Allergy | Websites | **2026** |
| 16 | Index of Babel | Websites | **2026** |
| 17 | VOD Highlighter | Programs | **2024** |
| 18 | David The Duck | Programs | **2024** |
| 19 | TrainEngine | Programs | **2026** |
| 20 | Sano Fails to Sell Spotify™ Tattoos | Videos | **2024** |
| 21 | Merlin Economics | Board Games | **2024** |
| 22 | Kanta | Board Games | **2024** |

---

## 5. Handjob Project: Removing the 'Media' Link

In `js/projects.js`, the project *Handjob: The Blower Gallery* (ID 19) is defined with two links in its `links` array: one pointing to GitHub and one labeled 'Media'.

### Proposed Modification
To remove the 'Media' link, update the `links` configuration for that project in **`js/projects.js`**:

**Before:**
```javascript
    links: [
      { label: 'GitHub', url: 'https://github.com/Sanokei/Handjob-The-Blower-Gallery', icon: 'gh' },
      { label: 'Media', url: 'https://github.com/Sanokei/Handjob-The-Blower-Gallery/tree/main/Assets/Art/Intro', icon: 'web' },
    ],
```

**After:**
```javascript
    links: [
      { label: 'GitHub', url: 'https://github.com/Sanokei/Handjob-The-Blower-Gallery', icon: 'gh' },
    ],
```
This change will prevent the 'Media' link button from rendering on the project's interactive plaque.
