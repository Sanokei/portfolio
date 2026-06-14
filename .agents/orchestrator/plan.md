# Plan - Museum Gallery Layout & Rendering Fixes

## Verification Plan
1. **R1: Transition Spacing & Cutoffs**
   - Check mobile/stacked layout dimensions and plaque Y-drop calculation.
   - Verify previous category's lowest visual element (bottom of hole or bottom of plaque) is calculated correctly.
   - Verify next category's `sectionWallTopY` is pushed down dynamically to maintain proper clearance.
   - Verify that there is no cutoff/overlap between light bars and project cavities/plaques in stacked or mobile layouts.

2. **R2: Floor & Scroll Bounds**
   - Verify floor mesh geometry (horizontal plane at bottom of the wall, extending forward).
   - Verify procedural marble texture (light beige/white plaster with grey veins) and wood baseboard trim.
   - Verify floor intersection with wall has baseboard trim.
   - Verify scroll bounds `minY` matches the exact visual bottom of the floor so scrolling stops perfectly, without showing black empty space below.

## Subtasks
- **Subtask 1: Explorer Codebase Discovery** (Spawns Explorer)
  - Tasks: Read code, detail mathematical relationship of layout calculations, plan changes.
- **Subtask 2: Worker Implementation** (Spawns Worker)
  - Tasks: Implement dynamic transition clearance (R1) and procedural floor/baseboard + scroll clamping (R2).
- **Subtask 3: Reviewer & Challenger Verification** (Spawns Reviewer & Challenger)
  - Tasks: Verify layout logic, responsive rendering, boundaries, and performance.
- **Subtask 4: Forensic Audit** (Spawns Auditor)
  - Tasks: Audit implementation authenticity (non-hardcoded, non-facade).
