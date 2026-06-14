# Project: Museum Gallery Layout & Rendering Fixes

## Architecture
- Responsive 3D museum gallery using Three.js.
- Vertical layout: sections are stacked vertically. Users scroll to move the camera vertically.
- Wall modules: plaster wall tiles with subtractive CSG cavities for project carousels.
- Decals, lamps, and project plaques are placed in 3D relative to the modules and sections.

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 1 | Discovery & Exploration | Identify cutoff math, floor placement, scroll bounds, texture generation | None | DONE |
| 2 | Transition Fix (R1) | Update `js/layout.js` to dynamically adjust vertical transition spacing | M1 | IN_PROGRESS (698ea682-7c89-4ed2-b1bc-083a7413b7ba) |
| 3 | Floor & Baseboard (R2) | Add floor mesh, procedural marble texture, trim, and correct minY/maxY scroll bounds | M2 | IN_PROGRESS (698ea682-7c89-4ed2-b1bc-083a7413b7ba) |
| 4 | E2E & Adversarial Verification | Perform visual checks, verification of bounds, and code integrity audits | M3 | PLANNED |

## Interface Contracts
- `getLayoutMetrics()`: Returns scaling factor, spacing, categoryGap, and bounding coordinates.
- `buildModuleLayout()`: Compiles layout arrays for modules and sections.
- `buildEnvironment()`: Constructs and updates light sources.
- `setBounds()`: Standard scroll limits in `js/scroll.js`.

## Code Layout
- `js/layout.js`: Spacing/alignment math and responsive metrics.
- `js/wall.js`: Mesh generation and CSG subtraction.
- `js/environment.js`: Section labels, lamps, and light bars.
- `js/scroll.js`: Camera scroll limits.
- `js/main.js`: Main setup and initialization.
