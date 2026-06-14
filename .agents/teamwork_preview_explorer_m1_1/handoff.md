# Handoff Report — Milestone 1: Discovery & Exploration

This report analyzes the layout, transitions, and scroll boundary constraints of the responsive 3D museum gallery, detailing actionable specifications for Milestone 2 (R1: Transition Spacing) and Milestone 3 (R2: Gallery Floor & Scroll Bounds).

---

## 1. Observation

### R1: Transition Clearance & Plaque Cutoff
1. **Plaque Layout Calculation**:
   In `js/layout.js`, inside `buildModuleLayout` (lines 234-235), the plaque vertical position `plaqueY` is calculated as:
   ```javascript
   const stackedPlaqueDrop = holeH * 0.74 + plaqueH * 0.54;
   const plaqueY = cursorY - stackedPlaqueDrop * (1 - moduleHorizontalProgress);
   ```
   *In mobile/stacked layouts, `moduleHorizontalProgress = 0`, placing the plaque directly below the cavity on the centerline.*
   
2. **Category Transition Spacing**:
   At the end of each category iteration in `js/layout.js` (lines 279-288), the next category start coordinate `cursorY` is computed:
   ```javascript
   const last_worldY = cursorY + spacing;
   const last_stackedPlaqueDrop = holeH * 0.74 + plaqueH * 0.54;
   const last_plaqueY = last_worldY - last_stackedPlaqueDrop * (1 - moduleHorizontalProgress);
   const lastBottom = Math.min(last_worldY - holeH / 2, last_plaqueY - plaqueH / 2);

   const distToWallTop = sectionLabelOffset + sectionPlaqueH / 2 + sectionHeadingTopPadding;
   const constrainedNextStart = lastBottom - 0.085 * objectScale - distToWallTop;
   const normalNextStart = cursorY - categoryGap;

   cursorY = Math.min(normalNextStart, constrainedNextStart);
   ```
   *The clearance buffer is hardcoded as `0.085 * objectScale`.*

3. **Light Bar Position**:
   In `js/environment.js` (lines 680-692), screen-wide light bars are placed at `section.wallTopY + SCREEN_LIGHT_BAR_Y_OFFSET * section.scale` where `SCREEN_LIGHT_BAR_Y_OFFSET = -0.16`.
   - The light bar has a physical height of `0.18 * scale` and depth `0.22 * scale` (`js/environment.js`, lines 543-544).
   - Its front position is at `wallZ + 0.18 * scale` (Z-axis).
   - The plaques are located at `wallZ + 0.075` (Z-axis) (`js/plaque.js`, line 237).
   - *Since `wallZ + 0.18 * scale > wallZ + 0.075` for typical scales, the screen-wide light bar stands further forward (closer to the camera) than the plaques, creating Z-fighting/occlusion risks if they overlap vertically.*

---

### R2: Gallery Floor & Scroll Bounds
1. **Scroll Bounds Settings**:
   - In `js/layout.js` (lines 295-296):
     ```javascript
     maxY: metrics.headerY,
     minY: Math.max(WALL_Y_CENTER - WALL_HEIGHT / 2 + 3, cursorY + spacing - 1.5)
     ```
   - In `js/main.js` (lines 100-103), this `minY` is overridden:
     ```javascript
     const lastY = cavityData[cavityData.length - 1].worldY;
     const minY = lastY - 2.5;
     const maxY = metrics.headerY;
     setBounds(minY, maxY);
     ```
     *The current bounds calculations do not account for the position of the floor or the camera's viewport height at the wall depth.*
     
2. **Static Museum Wall Parameters**:
   - `WALL_HEIGHT = 128` (lines 4 in `js/layout.js`).
   - `WALL_Y_CENTER = -50` (lines 6 in `js/layout.js`).
   - The floor plane corresponds to the wall's lowest Y-boundary:
     `floorY = WALL_Y_CENTER - WALL_HEIGHT / 2 = -114` units.
     
3. **Camera Viewport Math**:
   - In `js/layout.js` (line 127):
     ```javascript
     const visibleWallHeight = 2 * Math.tan((CAMERA_FOV * Math.PI / 180) / 2) * (cameraZ - wallZ);
     ```
     This height determines how much vertical space the camera sees at the wall depth (`wallZ`).

---

## 2. Logic Chain

### R1: Spacing and Cutoff Logic
- In horizontal layouts (`moduleHorizontalProgress = 1`), the plaque is shifted horizontally to the side (`plaqueX = -side * HORIZONTAL_PLAQUE_X * objectScale`). It does not overlap with the centered section label. The vertical bottom is near the cavity center, so `lastBottom` defaults to the cavity bottom.
- In mobile/stacked layouts (`moduleHorizontalProgress = 0`), the plaque drops down below the cavity on the centerline. The lowest visual element is now the plaque bottom: `lastBottom = last_plaqueY - plaqueH / 2`.
- Since the plaque and the next section's label are both centered on the Y-axis (`x = 0`), and the screen-wide light bar extends across the whole wall, the plaque bottom must clear the top of the next section.
- The next section's wall top boundary is `next_sectionWallTopY`. The top edge of the light bar is roughly at `next_sectionWallTopY - 0.028 * scale`.
- Using a tiny fixed buffer of `0.085 * objectScale` between `lastBottom` and `next_sectionWallTopY` results in the plaque bottom being almost flush with the light bar and section plaque. At small resolutions (where `objectScale` is ~0.72), the clearance is less than `0.06` units, leading to severe visual crowding and overlap on the centerline.
- **Solution**: The clearance buffer must be dynamic. When layout is stacked (`moduleHorizontalProgress = 0`), we need a larger clearance buffer (e.g., `0.35 * objectScale`) to keep the plaque safely separated from the light bar and section heading. When horizontal (`moduleHorizontalProgress = 1`), the buffer can remain small (e.g., `0.085 * objectScale`) to optimize space.

---

### R2: Floor & Scroll Bounds Logic
- To hide the empty space below the museum wall, we should place a floor mesh at `floorY = -114`.
- The camera looks horizontally along the Z-axis, meaning the vertical center of its view is at `camera.position.y`.
- The distance from `camera.position.y` to the bottom of the visible frame at the wall depth is `visibleWallHeight / 2`.
- To prevent the camera from revealing empty space below the wall (Y < -114), the bottom of the camera's view must not drop below the floor line:
  `camera.position.y - visibleWallHeight / 2 >= floorY`
- Therefore, the minimum camera vertical limit is:
  `minY = floorY + visibleWallHeight / 2 = -114 + visibleWallHeight / 2`.
- Since `visibleWallHeight` is computed in `getLayoutMetrics()`, this limit dynamically adapts to different screen aspect ratios (which adjust `cameraZ`).
- The baseboard trim should be added at `floorY` to cover the intersection between the vertical wall tiles and the floor mesh, adding architectural detail.
- `js/environment.js` is the most suitable injection point because it already hosts `addWallBounds(scene)` (which creates the wall's vertical trim) and all static lighting rigs.

---

## 3. Caveats

- **No Canvas Render Blockers**: Creating procedural canvas textures in Three.js requires setting `texture.needsUpdate = true`. If canvas drawing is slow or blocks the main thread, it could cause micro-stuttering on resize. The texture generation must use fast, non-blocking 2D context drawing calls.
- **Lighting Limits**: The point lights for the environment should not overlap excessively. Adding floor point lights must stay within standard WebGL point light count limits to prevent rendering issues on mobile browsers.
- **Aspect Ratio Assumptions**: The formula `minY = floorY + visibleWallHeight / 2` assumes that the camera optical center is aligned horizontally. If any vertical tilt or camera offset is introduced later, this bound will need a correction term.

---

## 4. Conclusion & Actionable Design

### R1 Design Specification
Modify the transition spacing math in `js/layout.js`:
1. Calculate a dynamic clearance buffer using linear interpolation:
   ```javascript
   const clearanceBuffer = lerp(0.35, 0.085, moduleHorizontalProgress) * objectScale;
   ```
2. Update the `constrainedNextStart` formula to use this dynamic buffer:
   ```javascript
   const constrainedNextStart = lastBottom - clearanceBuffer - distToWallTop;
   ```

### R2 Design Specification
1. **Floor Mesh Injection**:
   Create `buildFloorAndBaseboard(scene, metrics)` in `js/environment.js` and call it inside `buildEnvironment`.
   - **Floor Geometry**: `THREE.PlaneGeometry(32, 16)` rotated by `-Math.PI / 2` on the X-axis, positioned at `y = -114` and centered at `z = wallZ - 2` (to ensure it spans from the wall to behind the camera).
   - **Floor Material**: `THREE.MeshStandardMaterial` with roughness `0.22`, metalness `0.02`, and a procedurally generated marble texture.
   - **Baseboard Trim**: `THREE.Mesh(new THREE.BoxGeometry(16, 0.35, 0.08), trimMaterial)` positioned at `y = -114 + 0.175`, `z = wallZ + 0.04`, utilizing the same white satin paint `trimMaterial` as `addWallBounds`.

2. **Procedural Marble Texture Generation**:
   Implement a helper function to create a Canvas-based marble texture:
   ```javascript
   function generateMarbleTexture() {
     const canvas = document.createElement('canvas');
     canvas.width = 512;
     canvas.height = 512;
     const ctx = canvas.getContext('2d');

     // Base off-white color
     ctx.fillStyle = '#f5f3ee';
     ctx.fillRect(0, 0, 512, 512);

     // Subtly blended clouds
     for (let i = 0; i < 12; i++) {
       const x = Math.random() * 512;
       const y = Math.random() * 512;
       const r = 80 + Math.random() * 120;
       const g = ctx.createRadialGradient(x, y, 0, x, y, r);
       g.addColorStop(0, 'rgba(218, 212, 202, 0.18)');
       g.addColorStop(1, 'rgba(218, 212, 202, 0)');
       ctx.fillStyle = g;
       ctx.beginPath();
       ctx.arc(x, y, r, 0, Math.PI * 2);
       ctx.fill();
     }

     // Organic grey vein strokes
     function drawVein(x, y, len, angle, alpha) {
       ctx.strokeStyle = `rgba(110, 105, 98, ${alpha})`;
       ctx.lineWidth = 0.6 + Math.random() * 1.2;
       ctx.beginPath();
       ctx.moveTo(x, y);
       let cx = x, cy = y;
       const steps = 30;
       const stepL = len / steps;
       for (let s = 0; s < steps; s++) {
         angle += (Math.random() - 0.5) * 0.45;
         cx += Math.cos(angle) * stepL;
         cy += Math.sin(angle) * stepL;
         ctx.lineTo(cx, cy);
       }
       ctx.stroke();
     }

     for (let i = 0; i < 6; i++) {
       drawVein(Math.random() * 512, Math.random() * 512, 120 + Math.random() * 180, Math.random() * Math.PI * 2, 0.12 + Math.random() * 0.12);
     }

     // Grout lines for 2x2 grid
     ctx.strokeStyle = '#d5d1c4';
     ctx.lineWidth = 2.5;
     ctx.strokeRect(0, 0, 512, 512);
     ctx.beginPath();
     ctx.moveTo(256, 0); ctx.lineTo(256, 512);
     ctx.moveTo(0, 256); ctx.lineTo(512, 256);
     ctx.stroke();

     const texture = new THREE.CanvasTexture(canvas);
     texture.wrapS = THREE.RepeatWrapping;
     texture.wrapT = THREE.RepeatWrapping;
     texture.repeat.set(6, 6);
     return texture;
   }
   ```

3. **Scroll Boundary Calculation**:
   Update `minY` calculation inside `rebuildScene` in `js/main.js` (replacing the hardcoded override) and inside `buildModuleLayout` in `js/layout.js`:
   ```javascript
   const floorY = -114;
   const minY = floorY + metrics.visibleWallHeight / 2;
   ```

---

## 5. Verification Method

To verify the proposed implementation:
1. **Mobile Layout Spacing Verification**:
   - Open browser developer tools and toggle device emulation (e.g. iPhone SE / width ~375px).
   - Scroll down to category transitions (e.g. between first and second categories).
   - Ensure the project plaque bottom has at least `0.35` units of visual space before the next section's wood light bar body begins, avoiding crowding.
2. **Scroll Bounds & Floor Alignment Verification**:
   - Scroll to the bottom of the page.
   - The scroll behavior should halt smoothly. No empty black space (or canvas background color) should be visible below the white baseboard trim and the tiled floor.
   - Resizing the window horizontally and vertically should recalculate bounds dynamically, keeping the floor flush at the bottom of the screen when scrolled to the limit.
