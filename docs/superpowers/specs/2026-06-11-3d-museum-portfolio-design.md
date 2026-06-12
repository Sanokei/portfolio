# 3D Museum Portfolio — Design Spec

**Date:** 2026-06-11
**Branch:** `threejs`
**Status:** Approved

## Overview

Replace the current retro-80s portfolio with an immersive 3D museum experience. A continuous plaster gallery wall stretches horizontally with 16 irregularly-shaped cavities — broken out as if struck by a pickaxe — each containing an auto-rotating carousel of project images/GIFs. Beside each cavity sits an industry-standard museum plaque with project information and subtle links. A gold-and-wood header plaque reads "Sano's Portfolio" above the wall. Visitors scroll to walk along the wall like strolling through a gallery.

## Design Decisions

| Decision | Choice |
|----------|--------|
| Navigation | Scroll-to-walk (camera slides horizontally) |
| Wall layout | One continuous wall, ~12 cavities |
| Category separation | Subtle architectural columns between sections |
| Wall material | Aged plaster / gallery white; broken edges reveal darker inner material |
| Cavity creation | Runtime CSG subtraction via three-bvh-csg (Approach A) |
| Carousel behavior | Auto-rotating on timer (passive browsing) |
| Lighting | Warm museum spotlights above each cavity, soft ambient fill |
| Header plaque | Gold leaf text on dark walnut wood |
| Project plaques | Brushed metal museum style, subtle icon-only links |

## Scene Architecture

### Wall
- Single continuous plane mesh (~50m wide × 8m tall, accommodating 16 cavities + spacing)
- Aged plaster material: warm off-white (`#f5efe6` base), subtle noise/discoloration
- Category dividers: subtle pilasters/columns between sections (Games | Websites | Programs | Videos | Board Games), each with a small category label
- Dark wood floor plane below the wall

### Cavities (per project)
- Created by CSG subtracting an irregular faceted volume from the wall mesh
- Subtractive shape: randomized, jagged polyhedron simulating pickaxe strikes — some faces flat, some angled, with chips and protrusions
- Each cavity uses a different randomization seed so no two look identical
- Depth: ~1.5m into the wall
- Interior walls: darker material (#c0b8a8 range) suggesting exposed lathe/brick behind plaster
- Carousel planes arranged in a slight arc inside the cavity
- Subtle point light within each cavity for glow effect

### Camera
- Perspective camera with moderate FOV (~50-60°)
- Y-axis locked at eye level (~4m height)
- X-axis slides with scroll input, smooth lerp easing (factor ~0.08)
- Z-axis offset: positioned ~6m from wall face
- Clamp: can't scroll beyond wall bounds

### Lighting
- Warm spotlight above each cavity: `color: #ffd4a0`, intensity: 2, penumbra: 0.3
- Soft ambient light: `color: #ffe8d0`, intensity: 0.4
- Subtle point light inside each cavity: `color: #fff5e8`, intensity: 0.6
- Optional: subtle hemisphere light for outdoor gallery feel (sky/groud colors)

## Plaque System

### Header Plaque
- Position: centered above wall, fixed in world space, always visible
- Material: dark walnut wood base (`#5C4033`) with gold leaf text (`#DAA520`)
- Text: "SANO'S PORTFOLIO" in serif (Georgia), uppercase, letter-spaced
- Geometry: rectangular with beveled edges, ~3m wide × 0.8m tall
- Subtle metallic reflection on gold text (MeshStandardMaterial with metalness/roughness)

### Project Plaques
- Position: on intact wall beside each cavity, alternating left/right
- Material: brushed metal (`MeshStandardMaterial`, roughness: 0.6, metalness: 0.8)
- Content fields:
  - Project name (title, bold)
  - Category & subtitle (italic, smaller)
  - Brief description (1-2 lines)
  - Tags
  - Links: small icons (GitHub, itch.io, web) — muted by default, highlight on hover
- Text rendering: canvas-to-texture approach — render HTML content to offscreen canvas, apply as texture to plaque geometry
- Link interaction: raycasting on plaque surface to detect hover on link regions

### Category Labels
- Small text labels on the pilasters/columns dividing wall sections
- Each label names the category: "Games", "Websites", "Programs", "Videos", "Board Games"

## Carousel System

### Behavior
- Images/GIFs auto-cycle every 4-5 seconds
- Transition: crossfade (opacity blend) — simpler to implement with texture swapping
- Pauses when cavity is not in viewport (optimization)

### Content
- Reuses existing project assets from `img/` and `video/` directories
- Image assets rendered as textured planes in 3D
- Video assets: HTML5 `<video>` elements as Three.js VideoTexture
- 2-4 media items per cavity depending on available assets
- GIFs: rendered as animated textures (or video fallback)

### Layout
- Media planes arranged in a slight arc inside each cavity
- Central item larger (~1.2m wide), adjacent items slightly smaller (~0.9m)
- Active item moves to center with scale transition

## Interaction Model

### Scroll Input
- `wheel` event listener → accumulate scroll delta
- Map scroll delta to camera target X position along wall
- Smooth easing: `camera.position.x += (targetX - camera.position.x) * easingFactor`
- Easing factor: ~0.08 (adjustable for feel)
- Clamp target to wall bounds

### Link Interaction
- Raycaster from camera through mouse position
- Detect intersections with plaque link zones
- Cursor change + subtle highlight on hover
- Click opens external link in new tab

### Performance Optimizations
- Carousels only animate when cavity within 2x viewport width
- CSG computation runs once at init, results cached
- Wall is single merged geometry after CSG — one draw call
- LOD not required for ~12 cavities

## Tech Stack

| Component | Technology |
|-----------|-----------|
| 3D Engine | Three.js (ES module import from CDN or npm) |
| CSG Boolean Ops | three-bvh-csg (github.com/gkjohnson/three-bvh-csg) |
| Build | Vanilla JS, single HTML entry point |
| Fonts | Google Fonts (serif for plaques) |
| Text in 3D | Canvas-to-texture for plaque content |
| Assets | Existing project images/videos/GIFs |

### Dependencies
```json
{
  "three": "^0.170.0",
  "three-bvh-csg": "github:gkjohnson/three-bvh-csg"
}
```

## File Structure

```
portfolio/
├── index.html              # Entry point, Three.js scene setup
├── main.css                # Minimal CSS (loading screen, fonts)
├── js/
│   ├── scene.js            # Scene, camera, renderer, lights setup
│   ├── wall.js             # Wall mesh creation + CSG cavity subtraction
│   ├── cavity.js           # Individual cavity: carousel, lighting, content
│   ├── plaque.js           # Plaque geometry + canvas-to-texture rendering
│   ├── scroll.js           # Scroll-to-walk controller
│   └── projects.js         # Project data: names, descriptions, tags, asset paths
├── img/                    # Existing project images (unchanged)
├── video/                  # Existing project videos (unchanged)
├── fonts/                  # Existing fonts (unchanged)
└── docs/
    └── superpowers/
        └── specs/
            └── 2026-06-11-3d-museum-portfolio-design.md
```

## Edge Cases & Error Handling

- **No WebGL:** Fallback to current retro-80s static portfolio (keep `modern/` directory)
- **Slow CSG computation:** Show loading screen with progress indicator
- **Missing assets:** Graceful placeholder (gray plane with project name text)
- **Mobile:** Touch scroll maps to camera movement; responsive aspect ratio
- **Video autoplay blocked:** Fallback to static image thumbnail from video
- **Deep links / sharing:** Optional URL hash for navigating to specific project (stretch goal)

## Out of Scope (Stretch Goals)

- URL hash routing to specific projects
- Audio (ambient museum sounds)
- Mobile-specific touch gestures beyond scroll
- FPS counter / debug overlay (dev only)
- Particle effects (dust motes in light beams)

## Content Mapping

Each existing project maps to one cavity, preserving all current metadata:

| # | Project | Category | Assets |
|---|---------|----------|--------|
| 1 | Coot's Bug Squasher | Games | video/coots.mp4, 2 itch images |
| 2 | Adventure of Sir Robin | Games | video/sirrobin.mp4, 2 itch images |
| 3 | Intern | Games | video/intern.mp4, 1 itch image |
| 4 | Productivity App | Games | video/productivity.mp4, 2 images |
| 5 | Corruption | Games | video/corruption.mp4, 2 itch images |
| 6 | Curling The Herd | Games | video/curling.mp4, 1 itch image |
| 7 | The Arcane Observer | Websites | 2 screenshots |
| 8 | [new tab] - Doodle | Websites | video/doodle.mp4, 1 screenshot |
| 9 | Emoji Game | Websites | img/emoji-game.gif |
| 10 | ExNoto | Websites | 2 gif images |
| 11 | clamtap | Websites | 2 screenshots |
| 12 | VOD Highlighter | Programs | (no images — placeholder) |
| 13 | David The Duck | Programs | 2 images |
| 14 | Sano Fails to Sell... | Videos | img/thumbnail.jpg |
| 15 | Merlin Economics | Board Games | (no images — placeholder) |
| 16 | Kanta | Board Games | (no images — placeholder) |

16 total projects across 5 categories.

## Success Criteria

- [ ] Wall renders with CSG-subtracted cavities showing irregular pickaxe-like edges
- [ ] Cavity interiors are darker material than wall face
- [ ] Scroll-to-walk navigation feels smooth and intuitive
- [ ] Each cavity contains auto-rotating carousel of project media
- [ ] Header plaque displays "Sano's Portfolio" in gold on wood
- [ ] Project plaques show name, description, tags, and subtle links
- [ ] Links on plaques highlight on hover and open in new tab
- [ ] All 16 projects from current site are represented
- [ ] Category columns separate the 5 sections
- [ ] Page loads with loading indicator while CSG computes
- [ ] Fallback to current site if WebGL unavailable
- [ ] 60fps on desktop, acceptable performance on mobile
