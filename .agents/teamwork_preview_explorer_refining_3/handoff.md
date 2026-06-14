# Handoff Report

## 1. Observation
- **Video Tags & Playback Logic**:
  - Located in `js/carousel.js`.
  - Video tags are created using:
    ```javascript
    const video = document.createElement('video');
    ``` (Line 151)
  - Video sources are assigned immediately via:
    ```javascript
    video.src = asset.src;
    ``` (Line 152) and triggered via `video.load();` (Line 182).
  - Playback is synchronized using `syncActiveVideo(crt)` (Line 378) and paused using `pauseVideos(crt)` (Line 371).
  - Visibility status checks in `update(dt)` pause video playback using `pauseVideos(crt)` (Line 470) if `screenVisible` is false.
- **Plaque Rendering & Project Ordering**:
  - Located in `js/plaque.js` and `js/layout.js`.
  - Projects are ordered in `js/layout.js` inside `buildModuleLayout(projects, categoryOrder)`:
    ```javascript
    for (const category of categoryOrder) {
      const catProjects = projects.filter(p => p.category === category);
      ...
      for (let projectIndex = 0; projectIndex < catProjects.length; projectIndex++) {
    ``` (Lines 219–225).
  - Canvas texture rendering is done in `js/plaque.js` using `renderProjectTexture(project)` (Line 148). The canvas is of dimensions `760x520` (Lines 149–150).
  - A 3D box mesh is created in `buildProjectPlaques(scene, cavityData)` with geometry `BoxGeometry(cd.plaqueW, cd.plaqueH, 0.055)` (Line 285).
- **Project Dates/Git History**:
  - Checked repository git logs for each project name using `execFileSync` in Node.js (via script `get_years_exact.js` executed under task-123).
  - Log results retrieved:
    - 2024: 16 projects (Coot's Bug Squasher, Adventure of Sir Robin, Intern, Productivity App, Corruption, Curling The Herd, The Arcane Observer, [ new tab ] - Doodle, Emoji Game, ExNoto, clamtap, VOD Highlighter, David The Duck, Sano Fails to Sell Spotify™ Tattoos, Merlin Economics, Kanta).
    - 2026: 6 projects (We Mice, Fish out of Water, Handjob: The Blower Gallery, Art Allergy, Index of Babel, TrainEngine).
- **Handjob Project configuration**:
  - Located in `js/projects.js` at index 8 of the `projects` export:
    ```javascript
    name: 'Handjob: The Blower Gallery',
    ...
    links: [
      { label: 'GitHub', url: 'https://github.com/Sanokei/Handjob-The-Blower-Gallery', icon: 'gh' },
      { label: 'Media', url: 'https://github.com/Sanokei/Handjob-The-Blower-Gallery/tree/main/Assets/Art/Intro', icon: 'web' },
    ],
    ``` (Lines 164–174).

## 2. Logic Chain
- **Video Deferral Proposal**:
  - Since `createTextureForAsset` sets `video.src` and calls `video.load()` immediately upon page load, deferring loading can be achieved by not doing so, setting an `isDeferred: true` flag, and instead triggering `video.src = item.src` and `video.load()` inside the `update(dt)` function in `buildCarousels()` where `camera` is available.
  - The vertical distance can be computed as `Math.abs(crt.group.position.y - camera.position.y)` during the update loop. Proximity is defined as being within 8 units, so checking `distY <= 8` is the appropriate loading trigger.
  - Because `syncActiveVideo(crt)` checks for paused state and attempts to call `.play()`, it should avoid playing deferred videos that do not yet have a source assigned. Adding `!item.isDeferred` into the play condition prevents premature playback errors.
- **Plaque Rendering & Ordering**:
  - Because `buildModuleLayout` loops over `categoryOrder` first, and then sequentially filters and iterates through the `projects` list, the 3D museum walls display projects grouped by their category order (`Games` -> `Websites` -> `Programs` -> `Videos` -> `Board Games`), and top-to-bottom within each category in the exact order they appear in `js/projects.js`.
  - The canvas-to-texture approach means any change to the project data (titles, descriptions, links) automatically propagates to the plaque texture when `renderProjectTexture()` is executed.
- **Project Dates**:
  - By using `git log -S "<Project Name>"` via `execFileSync` to bypass shell issues, we successfully retrieved the earliest commit year for each project. For "Coot's Bug Squasher", which had quoting issues under a regular shell, querying with `execFileSync` bypassed shell quotation parsing, matching the initial entry date in 2024.
- **Removing 'Media' Link**:
  - To remove the 'Media' link button from the plaque rendering, we only need to remove the corresponding object entry from the project's `links` array in `js/projects.js` because `renderProjectTexture` loops over `project.links` and calculates button placement dynamically.

## 3. Caveats
- Checked git history of the local repository. If a project was created externally prior to being checked into this repository, the year shown corresponds to its introduction/import into this repository (e.g., in 2024 or 2026).
- The vertical distance unit checks assume the default camera positioning and scroll range.

## 4. Conclusion
- Video tag creation/playback optimization can be achieved using a deferred loading proposal by checking vertical camera distance <= 8 units, which is fully supported by the architecture in `js/carousel.js`.
- Project order is category-first, then definition-sequence top-to-bottom. Plaque canvas rendering automatically updates with changes to the project definition.
- Compilation of all 22 project years was successfully completed (16 in 2024, 6 in 2026).
- The 'Media' link in the Handjob project can be removed cleanly by editing the `links` array of project ID 19 in `js/projects.js`.

## 5. Verification Method
- **Project Year Verification**: Run the node script in this folder:
  `node c:\Users\wkeif\Documents\GitHub\Portfolio\.agents\teamwork_preview_explorer_refining_3\get_years_exact.js`
  Verify that it correctly outputs the years for all 22 projects matching the table in `analysis.md`.
- **Manual Verification**: Since this is a vanilla JS application with no test framework, changes must be verified visually:
  - Serve the repository using the node quick command from `CLAUDE.md`:
    `node -e "const http=require('http'),fs=require('fs'),path=require('path'),url=require('url');const mime={'.html':'text/html','.css':'text/css','.js':'application/javascript','.mp4':'video/mp4','.webm':'video/webm','.png':'image/png','.jpg':'image/jpeg','.gif':'image/gif','.ttf':'font/ttf'};http.createServer((req,res)=>{let p=url.parse(req.url).pathname.replace(/\.\.\//g,'');p=p==='/'?'/index.html':p;let f=path.join('.',p);fs.readFile(f,(e,d)=>{if(e){res.writeHead(404);res.end('404')}else{res.writeHead(200,{'Content-Type':mime[path.extname(f)]||'application/octet-stream','Cache-Control':'no-cache'});res.end(d)}})}).listen(3000,()=>console.log('http://localhost:3000'))"`
  - Open `http://localhost:3000` in the browser, scroll to verify plaques render without a "Media" link on Handjob, and inspect network tab to confirm video loading behaves lazily when distance to CRT screen is within 8 units vertically.
