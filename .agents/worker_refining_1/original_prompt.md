## 2026-06-14T05:52:56Z
You are the Refining Worker. Your working directory is c:\Users\wkeif\Documents\GitHub\Portfolio\.agents\worker_refining_1.
Your task is to implement the following changes in the Portfolio codebase:

1. Defer Video Loading and Playback Control (R1):
   - Modify js/carousel.js.
   - In createTextureForAsset, if the asset type is 'video', do NOT set video.src or call video.load() initially. Instead, store the source URL on the item object (e.g. as item.src = asset.src) and set a flag indicating deferred loading (e.g. item.isDeferred = true).
   - In syncActiveVideo(crt), ensure that videos only play if they are not deferred (e.g. check !item.isDeferred in addition to other play conditions) to prevent errors.
   - In the update loop (update(dt) in js/carousel.js), check the vertical distance from the camera (camera is available in the lexical scope of buildCarousels):
     const distY = Math.abs(crt.group.position.y - camera.position.y);
   - If distY <= 8, load all deferred videos for this CRT by setting video.src = item.src, adding the event listeners (loadeddata, canplay, error) to mark it ready/loaded, calling video.load(), and deleting/clearing the item.isDeferred flag.
   - Ensure that videos only play when their CRT screen is visible in the viewport, and pause immediately when scrolled out of view. (Check if this is already handled by screenVisible and pauseVideos(crt) / syncActiveVideo(crt) in js/carousel.js).

2. Project Reordering and Plaque Year Addition (R2):
   - Modify js/projects.js to:
     a) Add a year field to all 22 project objects with their respective initial commit years.
     b) Reorder the projects within the exported projects array so that within each category section, projects are sorted descending by year (newest on top, oldest at bottom). Use the exact following list for category groups:
        * Games:
          1. We Mice: 2026
          2. Fish out of Water: 2026
          3. Handjob: The Blower Gallery: 2026
          4. Coot's Bug Squasher: 2024
          5. Adventure of Sir Robin: 2024
          6. Intern: 2024
          7. Productivity App: 2024
          8. Corruption: 2024
          9. Curling The Herd: 2024
        * Websites:
          1. Art Allergy: 2026
          2. Index of Babel: 2026
          3. The Arcane Observer: 2024
          4. [ new tab ] - Doodle: 2024
          5. Emoji Game: 2024
          6. ExNoto: 2024
          7. clamtap: 2024
        * Programs:
          1. TrainEngine: 2026
          2. VOD Highlighter: 2024
          3. David The Duck: 2024
        * Videos:
          1. Sano Fails to Sell Spotify™ Tattoos: 2024
        * Board Games:
          1. Merlin Economics: 2024
          2. Kanta: 2024
   - Modify js/plaque.js inside renderProjectTexture(project) to append the year to the subtitle on the project plaques. If the project has a year, format the subtitle as: project.subtitle + " — " + project.year (note: the separator is space, em-dash, space: " — ").

3. Remove Media Link from Handjob Project (R3):
   - In js/projects.js, locate the project Handjob: The Blower Gallery (ID 19) and remove the "Media" link entry from its links array.

Verification:
- Serve the codebase and verify that it loads and functions correctly.
- Verify that project plaques render the year correctly.
- Verify that projects are correctly ordered descending by year.
- Verify that Handjob plaque has no Media button.
- Verify that video assets do not load initially, and begin fetching/loading only when their CRT screen is within 8 units vertically of the camera.

MANDATORY INTEGRITY WARNING — include this verbatim in the Worker's dispatch prompt:
> DO NOT CHEAT. All implementations must be genuine. DO NOT
> hardcode test results, create dummy/facade implementations, or
> circumvent the intended task. A Forensic Auditor will independently
> verify your work. Integrity violations WILL be detected and your
> work WILL be rejected.

Please report your completion and details of code changes back to the orchestrator (conversation ID: 34699b8d-8443-4ddf-963f-4a863308b2eb) when complete.
