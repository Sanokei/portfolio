# plan.md — Portfolio Refining Plan

## Architecture & Scope
Refining portfolio video loading, project ordering by initial commit year, and removing the media link from the handjob project.

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 1 | Exploration & Discovery | Locate video loading / playback code, plaque rendering, and find years of all 22 projects | None | DONE |
| 2 | Implementation | Implement deferred video loading (R1), project reordering & plaque year display (R2), Handjob media link removal (R3) | M1 | DONE |
| 3 | Verification & Auditing | Run unit/E2E tests, manual/visual checks, and integrity forensics audit | M2 | DONE |

## Detailed Plan
1. **Milestone 1: Exploration & Discovery**
   - Dispatch `teamwork_preview_explorer` to identify the implementation details:
     - Find the video tags / loader in the codebase (e.g., in `js/scene.js`, `js/projects.js`, `js/main.js`).
     - Find how the camera viewport position / distance is computed relative to the project plaques / CRT screens.
     - Find how the project plaques render subtitles and where `js/plaque.js` is.
     - Find the initial commit years for all 22 projects (either by searching local files, running a command, reading a date mapping file if it exists, or querying git history).
   
2. **Milestone 2: Implementation**
   - Dispatch `teamwork_preview_worker` to:
     - Defer setting video `src` and calling `load()` until the project CRT screen is within 8 vertical units of camera Y.
     - Play video when CRT screen is visible, pause when not.
     - Modify `js/projects.js` to add the `year` field to all 22 projects and reorder them within each category descending by year.
     - Modify `js/plaque.js` to append ` — YYYY` to the plaque subtitle.
     - Remove the "Media" link from "Handjob: The Blower Gallery".
   
3. **Milestone 3: Verification & Auditing**
   - Dispatch `teamwork_preview_reviewer` to review changes.
   - Dispatch `teamwork_preview_auditor` to audit codebase for integrity and correctness.
