# Original User Request

## Initial Request — 2026-06-13T23:14:17Z

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
