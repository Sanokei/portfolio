## 2026-06-13T23:14:17Z
Fix rendering, alignment, and spacing issues in the portfolio's 3D museum gallery.

Working directory: c:/Users/wkeif/Documents/GitHub/Portfolio
Integrity mode: development

## Requirements

### R1. Fix Project and Plaque Cutoffs at Section Transitions
- **Description**: Resolve cases where projects (e.g. "Index of Babel") or their plaques get cut off by the next section's wall tile or screen-wide light bar at category transitions.
- **Details**:
  - In stacked/mobile layouts, the project plaque drops down below the project hole, extending the space occupied by the section.
  - The vertical transition code must dynamically ensure the next section's wall top and light bar are positioned safely below the previous section's lowest visual element (the bottom of the project hole or the bottom of its plaque) with proper clearance.

### R2. Add Gallery Floor at Scroll End
- **Description**: Add a floor mesh with a procedurally generated marble tile texture at the bottom of the museum wall.
- **Details**:
  - Style: Light beige/white marble tiles with subtle grey veins, matching the plaster wall aesthetics, with a dark wood baseboard trim matching the light bars.
  - The floor should be a horizontal plane extending forward from the wall.
  - A clean baseboard or trim should sit at the intersection of the floor and the wall.
  - The scroll bounds (`minY` / `maxY`) must be adjusted so that scrolling smoothly stops when the floor comes into view at the bottom of the viewport, with no excess blank empty space below it.

## Acceptance Criteria

### Visual Correctness
- [ ] No project holes or CRTs are cut off on the bottom half by solid wall panels in any layout state.
- [ ] Project plaques at the end of a section do not collide with or get overlapped by the screen-wide wood light bar of the next section in any layout state.
- [ ] Panning/scrolling all the way to the bottom reveals a beautiful, textured marble floor that serves as a clean end marker.
- [ ] No empty black background space is visible below the floor when scrolled to the maximum bottom limit.

## 2026-06-14T05:34:00Z
Refining portfolio site video loading, project ordering based on initial commit year, and removing the media link from the handjob project.

Working directory: `c:/Users/wkeif/Documents/GitHub/Portfolio`
Integrity mode: development

## Requirements

### R1. Deferred Video Loading and Playback Control
- Defer loading of video assets (`video.src` / `video.load()`) until the project's CRT screen is close to the viewport (e.g., within 8 units vertically from the camera's Y position).
- Ensure that videos only play when their CRT screen is visible in the viewport, and pause immediately when scrolled out of view.

### R2. Project Reordering and Plaque Year Addition
- In `js/projects.js`, reorder the projects within each category section by the year they were first worked on (based on GitHub initial commits/creation dates), from newest (most recently worked on) on top to oldest going down.
- Add a `year` field to all 22 project objects in `js/projects.js` with their respective initial commit years.
- Modify `js/plaque.js` to render the year on the project plaques (e.g., appended to the subtitle text as ` — YYYY`).

### R3. Remove Media Link from Handjob Project
- Remove the "Media" link entry from the `links` array of the Handjob project in `js/projects.js`.

## Acceptance Criteria

### Video Behavior
- [ ] Videos do not start fetching/loading network data at page startup.
- [ ] Video elements begin loading only when their CRT screen is close to entering the viewport (within 8 units vertically).
- [ ] Active videos play automatically when visible and pause when scrolled away.

### Plaque and Sorting Correctness
- [ ] The plaques display the correct year of the project (e.g., "Video Game, Narrative, Puzzle, Coding — 2023").
- [ ] In each category section, projects are ordered descending by year (newest on top, oldest at bottom).
- [ ] The "Handjob" project plaque does not display the "Media" link button, only the "GitHub" link button.
