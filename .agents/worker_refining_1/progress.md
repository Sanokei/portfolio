# Progress Tracker

Last visited: 2026-06-14T05:55:00Z

## Active Task
- None (All tasks completed)

## Completed Tasks
- Read and analyzed the existing codebase (`js/carousel.js`, `js/projects.js`, `js/plaque.js`).
- Implemented video deferred loading in `createTextureForAsset` and active video playback checks in `syncActiveVideo(crt)`.
- Added distance check `distY <= 8` in the `update` loop of `js/carousel.js` to load deferred video resources dynamically.
- Sorted and added `year` properties to all 22 project objects in `js/projects.js` to match descending order guidelines.
- Modified project `Handjob: The Blower Gallery` to remove its Media link.
- Modified plaque rendering subtitle block to append project year with em-dash format `" — "`.
- Tested and verified syntax of all files and checked that the local HTTP server serves files correctly.

## Plan
1. Read existing code files: `js/carousel.js`, `js/projects.js`, `js/plaque.js`.
2. Verify existing behavior and structure.
3. Apply R1 (video deferred loading and distance-based play/pause).
4. Apply R2 (project reordering, year field addition, and plaque text rendering).
5. Apply R3 (remove Media link from Handjob).
6. Verify and test the implementations.
