# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Quick Reference

- **Dev branch:** `threejs`
- **Production:** `main` (deployed via GitHub Pages)
- **Serve locally:** `node -e "const http=require('http'),fs=require('fs'),path=require('path'),url=require('url');const mime={'.html':'text/html','.css':'text/css','.js':'application/javascript','.mp4':'video/mp4','.webm':'video/webm','.png':'image/png','.jpg':'image/jpeg','.gif':'image/gif','.ttf':'font/ttf'};http.createServer((req,res)=>{let p=url.parse(req.url).pathname.replace(/\.\.\//g,'');p=p==='/'?'/index.html':p;let f=path.join('.',p);fs.readFile(f,(e,d)=>{if(e){res.writeHead(404);res.end('404')}else{res.writeHead(200,{'Content-Type':mime[path.extname(f)]||'application/octet-stream','Cache-Control':'no-cache'});res.end(d)}})}).listen(3000,()=>console.log('http://localhost:3000'))"`
- **Deploy:** merge `threejs` into `main`, push to origin (GitHub Pages serves `main`).

## No Build Step

This is vanilla JS with no bundler, no npm, no build pipeline. Everything loads via an `<script type="importmap">` in `index.html` that maps Three.js, three-mesh-bvh, and three-bvh-csg to their jsDelivr CDN URLs. **Never `npm install` or add package.json** unless the user explicitly asks to migrate away from CDN imports.

ES modules **cannot** load via `file://` — always serve with an HTTP server.

## Architecture

`js/main.js` is the entry point. It boots in this order:
1. WebGL check → fallback to `modern/index.html` (old retro-80s static site) if unsupported
2. `scene.js` — renderer, camera at (x, 4, 3.5) looking at (x, 3, 0), museum lighting
3. `wall.js` — 50m×8m plaster wall, ~1m thick, positioned at y=3 center. CSG subtracts rock-like shapes (displaced SphereGeometry) using three-bvh-csg's `Brush`/`Evaluator`/`SUBTRACTION`. Drives the loading progress bar.
4. `carousel.js` — video/image planes inside each cavity, auto-rotate with crossfade, viewport culling
5. `plaque.js` — canvas-to-texture header (gold on wood) and project plaques (brushed metal)
6. `environment.js` — floor, category pilasters, baseboard, section labels
7. `interactions.js` — raycaster hit-testing on plaque link zones via UV coordinates
8. `scroll.js` — wheel/touch → camera X target with lerp easing, clamped to wall bounds

`projects.js` is pure data — 16 project objects with `id`, `name`, `category`, `subtitle`, `description`, `tags`, `links[]`, `assets[]`.

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

**GPU constraint:** Integrated GPUs often have `MAX_TEXTURE_IMAGE_UNITS = 16`. Shadow maps are disabled project-wide to stay under this limit. Each shadow-casting light would consume one unit per MeshStandardMaterial shader; with 16+ spotlights the shader fails to link. If adding shadow maps back, keep total shadow-casting lights ≤ 2.

## Common Issues

- **"Module source URI is not allowed"** — page opened via `file://`. Must use HTTP server.
- **"CSG Operations: Attribute uv no available"** — subtraction geometry missing UV attribute.
- **"MAX_TEXTURE_IMAGE_UNITS exceeded"** — too many shadow maps or unique textures. Reduce shadow-casting lights.
- **Remote images blocked by CORS** — img.itch.zone and camo.githubusercontent.com don't serve CORS headers. Without `crossOrigin='anonymous'` on the TextureLoader, images load as "dirty" and WebGL rejects them. With it, the browser blocks the request entirely. Solution: serve images from same origin, use a proxy, or download them to `img/`.
