# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Quick Reference

- **Production:** `main` (deployed via GitHub Pages). Feature branches (e.g. `threejs`, `ending-section`) merge into `main`.
- **Serve locally:** `node -e "const http=require('http'),fs=require('fs'),path=require('path'),url=require('url');const mime={'.html':'text/html','.css':'text/css','.js':'application/javascript','.mp4':'video/mp4','.webm':'video/webm','.png':'image/png','.jpg':'image/jpeg','.gif':'image/gif','.ttf':'font/ttf'};http.createServer((req,res)=>{let p=url.parse(req.url).pathname.replace(/\.\.\//g,'');p=p==='/'?'/index.html':p;let f=path.join('.',p);fs.readFile(f,(e,d)=>{if(e){res.writeHead(404);res.end('404')}else{res.writeHead(200,{'Content-Type':mime[path.extname(f)]||'application/octet-stream','Cache-Control':'no-cache'});res.end(d)}})}).listen(3000,()=>console.log('http://localhost:3000'))"`
- **Deploy:** merge the feature branch into `main`, push to origin (GitHub Pages serves `main`).

## No Build Step

This is vanilla JS with no bundler, no npm, no build pipeline. Everything loads via an `<script type="importmap">` in `index.html` that maps Three.js, three-mesh-bvh, and three-bvh-csg to their jsDelivr CDN URLs. **Never `npm install` or add package.json** unless the user explicitly asks to migrate away from CDN imports.

ES modules **cannot** load via `file://` — always serve with an HTTP server.

## Architecture

`js/main.js` is the entry point. It boots in this order:
1. WebGL check → fallback to `modern/index.html` (old retro-80s static site) if unsupported.
2. `scene.js` — renderer + `PerspectiveCamera` (FOV 50). Camera is always at `x=0`, `y` = scroll position, `z` = `cameraZ`, `lookAt(0, y, 0)`. ACES tone mapping (exposure 1.28), shadows disabled, `0xf2eee6` background + fog.
3. `wall.js` — plaster wall (`WALL_WIDTH`×`WALL_HEIGHT` = 16×128, `WALL_THICKNESS` 2.35, centered at `y = WALL_Y_CENTER = -50`). CSG subtracts rock-like displaced `SphereGeometry` (three-bvh-csg `Brush`/`Evaluator`/`SUBTRACTION`) to carve one cavity per project. Drives the loading progress bar.
4. `layout.js` — shared responsive metrics; the spine every other module reads (see below).
5. `carousel.js` — video/image planes inside each cavity, auto-rotate with crossfade, viewport culling.
6. `plaque.js` — canvas-to-texture header (gold on wood) and project plaques (brushed metal) with raycastable link zones stored in UV space.
7. `decals.js` — wall decals.
8. `environment.js` — floor, category pilasters, baseboard, section labels, lamps/light bars, **and** the ending brick alleyway section (door, step, lamps, pigeons, sidewalk, dumpster). Receives `renderer` to bake the brick texture.
9. `interactions.js` — raycaster hover/click on plaque link zones, CRT buttons, carousel taps; routes plaque body taps to the focus controller on mobile.
10. `scroll.js` — wheel/touch/drag → camera `targetY` with lerp easing, clamped to wall bounds; idle snap-to-nearest-project after ~1.75s.
11. `plaqueFocus.js` — mobile tap-to-focus for plaques (see below).

`projects.js` is pure data — 22 project objects with `id`, `name`, `category`, `year`, `subtitle`, `description`, `tags`, `links[]`, `assets[]`. `categoryOrder` (`['Games','Websites','Programs','Videos','Board Games']`) controls left-to-right wall order.

### Responsive layout system (`layout.js`)

Every dimension is derived from viewport size via `getLayoutMetrics()`, and `main.js` calls `rebuildScene()` on resize (debounced 160ms) to rebuild the entire scene against fresh metrics. Three regimes keyed off `window.innerWidth`:
- **Stacked / mobile** (≤ `MOBILE_BREAKPOINT` 760): cavity and plaque both on the wall centerline (x≈0), plaque dropped below the hole. `objectScale` shrinks with width; `cameraZ` is 7.2 (portrait) / 6.25.
- **Horizontal** (~700→980): cavity moves to one side, plaque to the other (`plaqueX` lerps away from 0). `cameraZ` 6.25→4.65.
- **Module / laptop** (≥840→1024, plus a plaque scale boost ≥1120): full side-by-side. `cameraZ` 4.65.

`getLayoutMetrics()` returns `cameraZ`, `viewportWorldHeight`, `visibleWallHeight/Width`, `holeW/H`, `plaqueW/H`, `spacing`, `headerY`, `startY`, `wallZ`, etc. `buildModuleLayout(projects, categoryOrder)` walks categories→projects producing per-module `worldX/worldY/plaqueX/plaqueY` plus the scroll bounds (`minY`/`maxY`/`floorY`). `isMobileLayout()` (≤760) is the predicate other modules use.

### Plaque focus (mobile) — `plaqueFocus.js`

On stacked/mobile layouts plaques are too small to read. `interactions.js` calls `focusCtrl.focus(plaqueObj)` on a plaque body tap; `isStacked()` (`|plaque.x| < 0.15`) auto-disables focus on wide screens. Focus lifts the plaque mesh toward the camera (`camera.z - FOCUS_DISTANCE`), centered at x=0, scaled by `computeFocusScale()` to fill ~88% of the tighter viewport axis (computed **per-focus** from FOV + focus distance + aspect + the plaque's real world size — a fixed scalar won't work across phone sizes/camera distances). A dimmed backdrop sits behind it. While focused, `update()` re-anchors the plaque's target Y to `camera.position.y` each frame so it follows the camera's auto-snap. Scroll input or click-out closes it (`dismissFocus()`); the plaque lerps back to its home `origPos`. `scroll.js` emits `SCROLL_INPUT_EVENT`, which the focus controller listens for. **Scope gotcha:** the dismiss logic is a nested `function dismissFocus()` declaration inside `initPlaqueFocus`, not a method — `onScrollInput` is also a nested function and can only reach in-scope declarations, not properties on the returned object.

### Ending / alleyway section + brick shader bake — `environment.js`

`buildEnvironment` builds a brick-walled alleyway. The brick `map` is a **one-time bake** of Inigo Quilez's raymarched brick shader: a `ShaderMaterial` (Shadertoy `iTime`/`iResolution` supplied as uniforms; `mainImage(...)` called from a `main()` wrapper) is rendered once to a `WebGLRenderTarget`, read back via `readRenderTargetPixels`, Y-flipped (GL bottom-up → canvas top-down), wrapped in an `SRGBColorSpace` `CanvasTexture`, and cached at module scope (`getBrickTexture(renderer)`) so resize-driven rebuilds never re-bake. The brick `MeshStandardMaterial` uses `onBeforeCompile` to do **triplanar world-position UV projection** (picks UVs by face normal) so the texture wraps the box geometry. Signature: `buildEnvironment(scene, projects, categoryOrder, camera, renderer)` — `renderer` is required for the bake.

### Custom GLSL

`environment.js` has two `THREE.ShaderMaterial` instances (pigeon shader + brick-bake shader). Three r170 (pinned in `index.html` importmap) is WebGL2-only, so GLSL ES 3.00 applies — `round()`, dynamic loop bounds, etc. are fine. `ShaderMaterial` (not `RawShaderMaterial`) auto-prepends `#version 300 es`, precision, and `#define gl_FragColor`; for Shadertoy ports, declare `uniform float iTime; uniform vec2 iResolution;` yourself and add a `main()` that calls `mainImage(...)`. A `ShaderMaterial` without the `tonemapping_fragment`/`colorspace_fragment` chunks outputs raw `gl_FragColor` — relevant when baking to a render target.

## Import cache-busting

`main.js` imports several modules with `?v=<tag>` query strings (e.g. `'./scroll.js?v=minimal-loader'`, `'./wall.js?v=museum-signs'`, `'./decals.js?v=museum-signs'`). Because there's no build step producing hashed filenames, these tags bust the browser/CDN cache on deploys — **don't strip them**. When you change a module's public behavior, bump its tag so clients reload. `plaqueFocus.js` is currently imported without a tag.

## CSG Pipeline Notes

three-bvh-csg is loaded from CDN as `Brush`, `Evaluator`, and `SUBTRACTION`. The API is **not** a standalone `subtract()` function. Pattern:
```js
const wallBrush = new Brush(geometry, material);
wallBrush.updateMatrixWorld();
const cutBrush = new Brush(cutGeo);
cutBrush.updateMatrixWorld();
const evaluator = new Evaluator();
const result = evaluator.evaluate(wallBrush, cutBrush, SUBTRACTION);
```

Both geometries must have a `uv` attribute — `SphereGeometry` and `BoxGeometry` have them built-in, but `ConvexGeometry` does not and needs one added manually. `computeBoundsTree`/`disposeBoundsTree` from three-mesh-bvh are monkey-patched onto `BufferGeometry.prototype` in wall.js before any CSG operations.

## GPU constraint

Integrated GPUs often have `MAX_TEXTURE_IMAGE_UNITS = 16`. Shadow maps are disabled project-wide to stay under this limit. Each shadow-casting light would consume one unit per MeshStandardMaterial shader; with 16+ spotlights the shader fails to link. If adding shadow maps back, keep total shadow-casting lights ≤ 2. (The brick shader bake is a one-time cost cached at module scope, not a per-frame texture-unit consumer.)

## Common Issues

- **"Module source URI is not allowed"** — page opened via `file://`. Must use HTTP server.
- **"CSG Operations: Attribute uv no available"** — subtraction geometry missing UV attribute.
- **"MAX_TEXTURE_IMAGE_UNITS exceeded"** — too many shadow maps or unique textures. Reduce shadow-casting lights.
- **Remote images blocked by CORS** — img.itch.zone and camo.githubusercontent.com don't serve CORS headers. Without `crossOrigin='anonymous'` on the `TextureLoader`, images load as "dirty" and WebGL rejects them. With it, the browser blocks the request entirely. Solution: serve images from same origin, use a proxy, or download them to `img/`.
