# Handoff Report — Explorer 2 Investigation & Refining

## 1. Observation

1. **Video Tag Creation**:
   In `js/carousel.js`, lines 150-158:
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
   This code creates a video element and loads the video immediately using `video.load();` on line 182:
   ```javascript
   video.load();
   ```

2. **Video Playback Control**:
   In `js/carousel.js`, the update loop checks for screen visibility (line 465):
   ```javascript
   const screenVisible = isScreenActuallyVisible(screenRect);
   ```
   If it is not visible, it calls `pauseVideos(crt)` (line 470):
   ```javascript
   if (!screenVisible) {
     // Scrolled away or fully outside the camera view: park playback.
     pauseVideos(crt);
     crt.state.wasVisible = false;
     ...
     continue;
   }
   ```
   If visible, it calls `syncActiveVideo(crt)` (line 527):
   ```javascript
   syncActiveVideo(crt);
   ```

3. **Projects Layout Ordering**:
   In `js/layout.js`, lines 219-221:
   ```javascript
   for (const category of categoryOrder) {
     const categoryStart = cursorY;
     const catProjects = projects.filter(p => p.category === category);
   ```
   This loops through categories in `categoryOrder` from `js/projects.js` (`['Games', 'Websites', 'Programs', 'Videos', 'Board Games']`), placing projects from each category in the order they appear in the `projects` list.

4. **Plaque Rendering**:
   In `js/plaque.js`, lines 278-292:
   ```javascript
   export function buildProjectPlaques(scene, cavityData) {
     const plaqueObjects = [];
     for (let i = 0; i < cavityData.length; i++) {
       const cd = cavityData[i];
       const { texture, linkZones } = renderProjectTexture(cd.project);
       ...
   ```
   `renderProjectTexture` draws text and links on a 2D canvas that is updated on a `CanvasTexture` mapped onto a 3D box.

5. **Project Years**:
   Using `git log`, the earliest commit years for project additions in the portfolio repository were extracted. For instance, the script `get_years.js` (line 34) searched commits:
   `git log -S "Project Name" --pretty=format:"%ad" --date=format:"%Y"`
   Returning:
   - 2024 for: `Coot's Bug Squasher`, `Adventure of Sir Robin`, `Intern`, `Productivity App`, `Corruption`, `Curling The Herd`, `The Arcane Observer`, `[ new tab ] - Doodle`, `Emoji Game`, `ExNoto`, `clamtap`, `VOD Highlighter`, `David The Duck`, `Sano Fails to Sell Spotify™ Tattoos`, `Merlin Economics`, `Kanta`.
   - 2026 for: `We Mice`, `Fish out of Water`, `Handjob: The Blower Gallery`, `Art Allergy`, `Index of Babel`, `TrainEngine`.

6. **Handjob Project Link**:
   In `js/projects.js`, lines 171-174:
   ```javascript
   links: [
     { label: 'GitHub', url: 'https://github.com/Sanokei/Handjob-The-Blower-Gallery', icon: 'gh' },
     { label: 'Media', url: 'https://github.com/Sanokei/Handjob-The-Blower-Gallery/tree/main/Assets/Art/Intro', icon: 'web' },
   ],
   ```

---

## 2. Logic Chain

1. **Video Optimization (R1)**:
   - Observation 1 shows that videos are created and loaded instantly when the page initializes. This wastes network bandwidth and memory for off-screen projects.
   - We can defer setting `video.src` and calling `video.load()` by stashing the source in a custom property `videoSrc` and setting `video.src = item.videoSrc` inside the `update` loop only when the vertical distance `Math.abs(cameraY - crt.cd.worldY)` is `<= 8` units.
   - Observation 2 shows that the current code already calls `pauseVideos` when the CRT scrolls out of view and plays the video only when it becomes visible.
   - Thus, integrating the deferred load check into the existing visibility structure will successfully play videos only when visible and pause them when out of view.

2. **Project Ordering & Plaques (R2)**:
   - Observation 3 shows that layout order is strictly driven by the `categoryOrder` array and the sequential positions of items in the `projects` list.
   - Observation 4 shows that plaque details are rendered onto a 2D Canvas which maps to a `CanvasTexture`.

3. **Project History & Years**:
   - Observation 5 matches each project to the exact year of its introduction into the Portfolio git history. 16 projects are from 2024 (2D portfolio era) and 6 are from 2026 (the 3D gallery rebuild).

4. **Handjob Link Removal**:
   - Observation 6 details the structure of the Handjob project's links.
   - Removing the second link element `{ label: 'Media', ... }` will successfully remove the "Media" link from the rendered plaque, and the interaction zones will automatically adjust.

---

## 3. Caveats

- **Network Speed vs Deferral distance**: A distance of 8 units vertically is roughly equal to two project cavities on the wall. At fast scroll speeds, the video might still be loading when it comes into view, showing the static noise fallback texture briefly.
- **Git Commit Dates**: Git commit dates in this repository represent the date when the projects were imported or added to this index. They may differ from the actual initial release date of the games themselves if those games were developed in separate, older repositories first.

---

## 4. Conclusion

1. **Video optimization is feasible**: Defer setting `video.src` until `Math.abs(cameraY - crt.cd.worldY) <= 8`. Playback is already tied to visibility in the `update()` loop via `pauseVideos` and `syncActiveVideo`.
2. **Project Layout**: Driven by `categoryOrder` and the projects array order, rendered as a CanvasTexture.
3. **Project Years**: 16 projects were introduced in 2024, and 6 in 2026.
4. **Handjob Project**: The "Media" link can be safely removed by editing the `links` array of the project in `js/projects.js`.

---

## 5. Verification Method

- To verify the video loader deferral:
  - Add console logs when `video.src` is set inside `update()`. Run the page and verify that logs only trigger when scrolling close to a video CRT.
- To verify the Handjob plaque change:
  - Run the application, scroll to the "Handjob" project, and verify that the "Media" button is no longer visible on the plaque, and clicking the area does not launch a new tab.
