# Handoff Report — Explorer 1 Investigation & Synthesis

## 1. Observation
1. **Video Tags & Preloading**:
   - In `js/carousel.js`, lines 150-158:
     ```javascript
     if (asset.type === 'video') {
       const video = document.createElement('video');
       video.src = asset.src;
       video.loop = true;
       video.muted = true;
       video.playsInline = true;
       video.crossOrigin = 'anonymous';
       video.preload = 'auto';
     ```
   - On line 182, loading is immediate:
     ```javascript
     video.load();
     ```
2. **Video Playback controls**:
   - In `js/carousel.js`, lines 465-474:
     ```javascript
     const screenVisible = isScreenActuallyVisible(screenRect);
     if (!screenVisible) {
       // Scrolled away or fully outside the camera view: park playback.
       pauseVideos(crt);
       crt.state.wasVisible = false;
       ...
       continue;
     }
     ```
   - Active playback syncing on line 527:
     ```javascript
     syncActiveVideo(crt);
     ```
3. **Project Ordering**:
   - In `js/layout.js`, lines 219-221:
     ```javascript
     for (const category of categoryOrder) {
       const categoryStart = cursorY;
       const catProjects = projects.filter(p => p.category === category);
     ```
4. **Plaque Rendering**:
   - In `js/plaque.js`, lines 278-292, plaques mesh are generated via `renderProjectTexture(cd.project)` which writes to a 2D Canvas and uses it as a `CanvasTexture`.
5. **Local Directories Metadata**:
   - Folder `c:\Users\wkeif\Desktop\Stuff\Projects\Spotify Code` was created on **2023-12-02**.
   - Folder `c:\Users\wkeif\Desktop\Stuff\Projects\Fish` was created on **2024-08-26**.
   - Folder `c:\Users\wkeif\Desktop\Stuff\Projects\ParkourCiv` was created on **2025-03-31**.
   - Folder `c:\Users\wkeif\Desktop\Stuff\Projects\Merlin Economics` was created on **2024-03-09**.
6. **AppData LocalLow Folders**:
   - Directory `c:\Users\wkeif\AppData\LocalLow\DefaultCompany\Coots Bug Squasher` was created on **2023-02-18**.
   - Directory `c:\Users\wkeif\AppData\LocalLow\DefaultCompany\CurlingTheHerd` was created on **2023-04-19**.
   - Directory `c:\Users\wkeif\AppData\LocalLow\DefaultCompany\Productivity app` was created on **2023-06-10**.
7. **Handjob project links**:
   - In `js/projects.js`, lines 171-174:
     ```javascript
     links: [
       { label: 'GitHub', url: 'https://github.com/Sanokei/Handjob-The-Blower-Gallery', icon: 'gh' },
       { label: 'Media', url: 'https://github.com/Sanokei/Handjob-The-Blower-Gallery/tree/main/Assets/Art/Intro', icon: 'web' },
     ],
     ```

## 2. Logic Chain
1. **Video Loader Deferral**:
   - Deferring loading of videos requires modifying `createTextureForAsset` to not assign `.src` or call `.load()` initially. Storing `videoSrc` and setting it in the update loop inside `buildCarousels` when `Math.abs(cameraY - crt.cd.worldY) <= 8` will achieve loading only on camera proximity.
   - The playback logic already maps `screenVisible` to `pauseVideos` and `syncActiveVideo`, confirming that playing only when visible and pausing when out of view is already handled.
2. **Project Ordering & Plaques**:
   - Projects are ordered vertically top-to-bottom by category (`categoryOrder`) and their sequence in `js/projects.js`. Plaques are dynamically rendered by writing onto 2D canvases, converting them to `CanvasTexture`, and wrapping them in standard 3D Box geometries.
3. **Creation Years Reconciliation**:
   - While the Portfolio repository commits place original projects in 2024 and updates in 2026, the local folders and save data prove earlier actual creation years: e.g. Coots Bug Squasher, Curling The Herd, Productivity App, and Spotify Code are from **2023**; We Mice is from **2025**; Fish out of Water is from **2024**.
4. **Handjob Link Removal**:
   - Deleting the `Media` link object in `js/projects.js` directly alters the rendered plaque and removes the button.

## 3. Caveats
- **Proximity Deferral Window**: A vertical distance of 8 units is appropriate, but at very fast scrolls, the static noise texture might briefly render before the video loads.
- **Project Dates**: Some projects do not have local folders (like `Kanta` or `TrainEngine`). For those, repository commit years are used as fallbacks.

## 4. Conclusion
- Video loader deferral is fully planned and feasible.
- Reconciled years for all 22 projects have been compiled in the final `analysis.md` report, highlighting actual project creation dates vs. portfolio import commits.
- Handjob media link removal is located at ID 19 in `js/projects.js`.

## 5. Verification Method
- Inspect the compiled table of years in `analysis.md`.
- Inspect the proposal changes for video loader deferral in `analysis.md` (e.g. stashing `videoSrc` and using a `distY <= 8` condition).
