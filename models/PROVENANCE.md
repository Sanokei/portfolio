# Provenance — models/

The door, picture-light, and pigeon below were **modeled from scratch in
Blender 4.2.3 LTS (headless)** on 2026-10-15. No third-party mesh, scan, or
texture was used for those — every vertex is original work. Reference photos
used for visual QA were AI-generated and are kept at `ref/` for comparison
only (not embedded).
**License for the from-scratch models: CC0 / public domain.** Sano owns
those outright.

**EXCEPTION: nyc-taxi.glb (v4, 2026-10-16)** is the third-party Sketchfab
model "New York Police and Taxi" by Mateusz Woliński, **CC-BY-NC-4.0**
(non-commercial use with attribution). See its section below. Do not treat
the taxi as CC0 or as Sano's original work.

---

## picture-light.glb

## What this is
A realistic 3D model of a classic gallery picture light (wall-mounted lamp
for illuminating framed artwork), built for the gallery wall on sanokei.com.

## Authorship
- **Modeled from scratch** in Blender 4.2.3 LTS (headless) on 2026-10-15.
- No third-party mesh, scan, or texture was used — every vertex is original work.
- Reference: an AI-generated product photo of a dark-bronze gallery picture
  light (kept at `ref/` for visual-QA comparison only; not embedded in the model).
- **License: CC0 / public domain.** Sano owns this outright; use it anywhere.

## Design
- Slim cylindrical dark-bronze tube housing (0.74 long, 0.056 diameter)
- Domed end caps, slightly wider than the tube
- Two curved mounting arms arcing up and back to round wall backplates
- 4 screw heads per backplate
- Warm emissive frosted diffuser strip along the underside (tilted slightly
  toward the viewer)
- Materials: `BronzeDark` (metallic PBR), `DiffuserGlow` (warm emissive),
  `ScrewDark`. All embedded in the GLB.
- 7,576 triangles — well within budget.

## Orientation (Three.js / Y-up)
- Bar runs along **X**, origin at bar center.
- Wall side is **-Z** (backplates at z ≈ -0.16).
- Diffuser sits just below the bar (y ≈ -0.03), tilted slightly toward +Z.
- Drop-in: no rotation fixes needed; scale 1 unit = 1 world unit.

## QA
5 headless Cycles render iterations against the reference photo
(`v1`–`v2` staging fixes, `v3` full assembly, `v4` diffuser glow,
`v5` final warm-amber diffuser). Renders kept in /tmp/qa (ephemeral).

---

## door.glb

A realistic commercial hollow-metal STEEL exterior door for the street-level
brick entryway on sanokei.com (replaces the procedural BoxGeometry door +
canvas texture; the earlier wooden paneled version was rejected by Sano).

- **Slab:** 1.5 × 3.0 × 0.05 flush charcoal-painted steel (#0f1013 family,
  metallic PBR with subtle procedural paint variation), beveled sheet edges.
- **Vision lite:** square 0.34 window in the upper third (boolean cut),
  steel glazing beads, dark recessed glass.
- **Frame:** welded-look steel jambs + head (narrowed so the hinge knuckles
  show in a real 15mm door/frame clearance gap), stainless threshold.
- **Hardware:** stainless lever + backplate + rose + keyhole (left stile,
  lever center at z=1.00 — ~36" handle height), 3 stainless butt hinges with
  visible knuckles/pins/caps (right stile), stainless kick plate with screws.
- **Materials:** `PaintedSteel`, `FrameSteel`, `GlassDark`, `Stainless`,
  `DarkGap`. All procedural, embedded in the GLB.
- **Size:** 1,604 triangles (32 nodes).
- **Orientation:** front faces **+Z**, slab bottom at Y=0, centered on X.
  Nominal 1.5w × 3.0h — the wiring agent should scale X/Y to the dynamic
  `doorW`/`doorHeight` (uniform scale preferred; mild non-uniform is fine).
- **QA:** 4 compliant iterations (front34/front/side/handle at 1280px,
  Cycles 48spp) + side-by-side reference comparisons; Sano approved
  ("looks good") with a final handle-height tweak. Log + renders in
  `.qa/models/door/`.

## pigeon.glb (v2 — full remodel, 2026-10-15)

A realistic rigged urban rock pigeon for the gallery street scene
(replaces the SDF-shader pigeons with code-driven wings). 7 per scene.
Previous version rejected as "the worst offender" — rebuilt from scratch.

- **Look:** blue-grey body with scalloped feather texture (procedural voronoi),
  iridescent green/purple neck with view-dependent Fresnel sheen fading to
  head-grey top and bottom (no hard collar edge), dark primaries + dark covert
  wing bar, dark beak with white cere, orange iris + black pupil eyes set flush
  in the head, orange-red feet with 3+1 toes and claws.
- **Build:** lofted teardrop body (10 stations), tube neck emerging from inside
  the body, ellipsoid head; ~200 individual SOLID feathers (10 primaries +
  9 secondaries + 4 shingled covert rows + 5 scapulars per wing, 12 tail
  rectrices) — no solid wing slabs. 15,476 triangles.
- **Size:** beak-to-tail ~0.72, wingspan ~1.0 spread. Suggested scale ~0.85 to
  match the original 0.82-unit pigeons.
- **Faces +X** (beak toward +X, tail toward −X), up is +Y, origin at ground
  center under the body. 1 unit = 1 world unit.
- **Armature** (`PigeonArmature`, 8 bones):
  `root` (body) → `neck` → `head_b`;
  `root` → `wing_L` → `wing_L_tip`, `root` → `wing_R` → `wing_R_tip`;
  `root` → `tail_b`.
  Left = +Z side (matches original `createPigeonWing(1)` convention).
- **Animation `Flap`** (frames 1–30): f1 folded (perched — the rest pose, feathers
  modeled folded), f1–6 unfold, f6–30 two flap cycles (±38°/−42° about world X,
  tip bones 1.4×, body bob, tail pitch); f30 == f6 so f6–30 loops cleanly.
  The file's default pose is folded wings (perched look). Solved with verified
  quaternion math (R_L = R_B⁻¹·R_Pf⁻¹·R_change·R_PrestW·R_B, 0.0° residual).
- **Materials (11, all procedural, embedded):** `PigeonGrey`, `HeadGrey`,
  `IridescentNeck` (gradient-blended), `DarkTips`, `TailGrey`, `BeakDark`,
  `CereWhite`, `EyeIris`, `EyeBlack`, `FeetOrange`, `ClawDark`.
- **Wiring notes:** everything rigid-skinned per part/feather (full-weight vertex
  groups, no bone-parented objects). Head/beak/cere/eyes → `head_b`; body/feet →
  `root`; tail → `tail_b`; inner wing feathers → `wing_L/R`, primaries →
  `wing_L/R_tip`. Play the `Flap` clip or drive the wing bones directly.
- **QA:** 5 build iterations, 7 angles each (side/front/spread/head + 3 seeded
  randoms, 1024px), side-by-side reference comparisons, plus programmatic
  poke-through and L/R symmetry checks. Renders in `models/pigeon/`,
  script in `workspace/pigeon-build/build.py` (rebuilt there after a /tmp wipe —
  keep build scripts in workspace, not /tmp).

---

## nyc-taxi.glb (v4 — Sketchfab "New York Police and Taxi", 2026-10-16) — CURRENT

**SUPERSEDES all v2/v3/v3.1 entries below.** Sano chose to use the real
third-party model instead of the from-scratch remakes (BY-NC license covers
his non-commercial portfolio with credit; a 1:1 Blender recreation would have
taken weeks and come out worse).

- **Source:** "New York Police and Taxi" on Sketchfab, by Mateusz Woliński.
- **License: CC-BY-NC-4.0 — NOT CC0.** Third-party mesh and textures;
  non-commercial use with attribution. Do not claim as original work.
  **Attribution is dual:** in-scene graffiti credit on the left brick wall
  ("Taxi model: Mateusz Woliński" in off-white handstyle with pink underline,
  "CC-BY-NC-4.0" in taxi-yellow) AND this file.
- **Processing:** taxi isolated from the police car in the same scene;
  decimated from 531k → 45k triangles for web; oriented for the gallery;
  built-in roof sign removed so Sano's own social-link roof sign goes on clean.
- **Known defects (from v4 QA):** faint outline on the roof where the sign
  was flattened (covered by his roof sign anyway); source wheels sit very
  slightly diagonal — barely noticeable.
- **QA:** multi-angle screenshot loop per the standing visual-QA protocol;
  renders in `models/taxi/v4/`; final graffiti fix shot at
  `.qa/graffiti-credit-fixed.png`.

---

## nyc-taxi.glb (v3.1 — defect fix pass, 2026-10-15) — SUPERSEDED by v4

Fix pass on the v3 photo-projection model (parent-agent inspection of
`v3_iter4_*` found five disqualifying defects; the photo-projection approach
itself was kept). All fixes in `build_taxi_v3.py`:

1. **Wheel-arch ribbons removed** — the full-torus "arch trim" pieces that
   dangled below the body are deleted; broken wheel-well liner replaced with
   proper dark half-cylinder shells tucked behind the boolean-cut arches.
   Alloy wheels + tires untouched.
2. **Rear now photo-projected** — generated a 5th AI reference (straight-on
   rear view, since the 3/4 rear photo couldn't planar-project cleanly) and
   composited it into the atlas; rear cap faces now sample the rear photo
   (Camry taillights, trunk seams, TLC plate, checker stripe, dark valance).
   Brick taillight cubes removed; small red reflector strips added per the
   reference; rear bumper valance shrunk and tucked under the body.
3. **Roof fin fixed** — the dark wedge was the side photo's roof pixels
   bleeding onto rear-roof faces (now forced to plain yellow); replaced with
   a proper small dark shark-fin antenna at the rear of the roof.
4. **Mirrors rebuilt** — dark arm + body-colored housing + dark glass on the
   rear face, instead of yellow cubes.
5. Front face, side stripe/door seams/handles, tinted glass, flat roof (no
   sign) all preserved from v3.

- **Size:** 3.3 long × 1.3 wide × 1.12 tall. **8,078 triangles**, 70 nodes,
  7 embedded materials. Front faces −X, up +Y, origin at ground center.
  `Wheel_FL/FR/RL/RR` empties at axle centers (∓1.10, ∓0.46, 0.24).
- **License: CC0 / public domain** (all geometry original; all 5 reference
  photos AI-generated via the media pipeline).
- **QA:** `v3fix_iter1` (arch/mirror/fin fixes verified) → `v3fix_iter2`
  (rear projection v1, 3/4 photo — misaligned) → `v3fix_iter3`
  (straight-on rear photo, corrected UV calibration, reflectors) →
  `v3fix_iter4` (rear UV inset fix). Each: front 3/4, side, rear 3/4, front
  + rear close-ups, 2 random orbit angles (1024px Cycles). Renders at
  `/home/hatch/workspace/portfolio/.qa/models/taxi/v3fix_*`.

---

## nyc-taxi.glb (v3 — Ian Hubert photo-projection remodel, 2026-10-15)

A modern NYC yellow cab (Toyota Camry design language) for the gallery
street scene on sanokei.com. **Complete remodel** replacing v2 (Sano
rejected v1 and v2 as toy-like/cartoonish: bulbous Beetle-like cabin,
stubby rear, disc wheels). This version applies **Ian Hubert's
"lazy tutorial" photo-projection technique**: simple base geometry with
correct proportions/silhouette, with real photographs projected onto the
surface as textures — the photo carries panel gaps, door handles, grille,
headlights, and reflections instead of procedurally faking them.

- **Modeled from scratch** in Blender 4.2.3 LTS (headless). No third-party
  mesh, scan, or texture — every vertex is original work.
- **Texture source:** 4 AI-generated photorealistic Camry taxi reference
  photos (front 3/4, side profile, rear 3/4, front close-up), generated
  2026-10-15 via the media pipeline. AI-generated = clean licensing, 100%
  original. Composited into a 2048×2048 atlas; planar-projected per-vertex
  onto body panels (side photo→flanks incl. windows/checker stripe/door
  seams, front close-up→grille/headlights/plate). Windshield/rear glass use
  dark tinted PBR (not white/frosted). Roof/hood/trunk tops use plain taxi
  yellow.
- **License: CC0 / public domain.** Sano owns this outright.
- **Body:** lofted cross-sections (27 stations, 17-pt rings, subsurf baked)
  with boolean-cut wheel arches; separate lofted greenhouse (14 stations,
  17-pt rings, crisp edges, no subsurf) with flat roof at z≈1.12 over
  x∈[0.05, 0.35] for the sign mount. Long sloped hood, distinct trunk deck,
  sleek roofline — correct modern sedan silhouette.
- **NO roof sign in this file** — the existing social-links roof sign is
  reused; roof kept clean/flat where it mounts.
- **Wheels:** real geometry — torus tires + silver 10-spoke alloys + hubs
  (not discs). `Wheel_FL/FR/RL/RR` empties at axle centers
  (Blender: (∓1.10, ∓0.46, 0.24); front=−X, left=−Y Blender = +Z glTF);
  wheel meshes parented with correct parent-inverse — spin the empties.
- **Size:** 3.3 long × 1.3 wide × 1.12 tall. **9,284 triangles.**
- **Orientation:** front (headlights/grille) faces **−X**, up is +Y (glTF),
  origin at ground center. 1 unit = 1 world unit.
- **Materials (8, all embedded):** `PhotoPaint` (atlas image texture),
  `PaintYellow`, `GlassDark`, `TireDark`, `RimSilver`, `TrimDark`,
  `TailRed` (emissive), `HeadLens`.
- **QA:** 4 build iterations (v3_iter1 broken-coords → v3_iter2 dome cabin +
  disc wheels → v3_iter3 per-vertex UVs + proper cabin → v3_iter4 final with
  silver spoke wheels), each with front 3/4, side, rear 3/4, front close-up
  + 3 random orbit angles (1024px Cycles), plus `v3_compare_*.png`
  side-by-sides vs the AI reference photos. Renders at
  `/home/hatch/workspace/portfolio/.qa/models/taxi/v3_*`. Build scripts at
  `/home/hatch/workspace/taxibuild_v3/` (build_taxi_v3.py, make_atlas.py).


---

## nyc-taxi.glb (v2 — full remodel, 2026-10-15) — SUPERSEDED by v3

A modern NYC yellow cab (2018+ Toyota Camry XV70 design language) for the
gallery street scene on sanokei.com. **Complete remodel** replacing the v1
model (the user rejected v1 as looking awful/toy-like: too chunky and
angular with a slab-sided body and a giant plain-box roof sign).

- **Modeled from scratch** in Blender 4.2.3 LTS (headless). No third-party
  mesh, scan, or texture — every vertex is original work.
- Reference photos (real Camry taxi front 3/4, rear 3/4, 2018 Camry side
  profile) used for visual QA only; kept at
  `/home/hatch/workspace/taxibuild/refs/`, not embedded.
- **License: CC0 / public domain.** Sano owns this outright.
- **Body:** lofted cross-sections (23 stations, 16-pt rings) with
  wheel-arch cutouts, subsurf level 2 baked — smooth sedan surfacing, no
  slab sides. Sloped hood, curved tinted glasshouse, distinct trunk deck.
- **NO roof sign in this file** — the original GLB's roof sign (long prism
  with the social-link surfaces) is reused as-is by the wiring. The roof is
  kept clean and flat at z≈1.12–1.13 over x∈[−0.55, 0.87], matching the old
  sign mount exactly (old RoofSign: x −0.54…0.86, base z=1.15, top z=1.45).
- **Details:** yellow A/B/C pillars framing dark glass, black/yellow checker
  stripes both flanks (procedural canvas texture, embedded), geometric
  T-logo door decals, door handles, rounded side-mirror pods, silver
  5-spoke alloy wheels (tire torus + tread + spokes + lip — not discs),
  slatted upper grille + chrome, big lower intake, smoked swept headlights
  with emissive DRL strips, deep-red taillights + chrome strip, front/rear
  plates, exhaust tip, shark-fin antenna, subtle trunk lip.
- **Size:** 3.40 long × 1.59 wide (incl. mirrors; body 1.40) × 1.13 tall
  (sign excluded). 19,126 triangles.
- **Orientation:** front (headlights/grille) faces **−X**, up is +Y (glTF),
  origin at ground center. 1 unit = 1 world unit.
- **Materials (13, all embedded):** `TaxiYellow`, `TaxiGlass`, `TaxiBlack`,
  `TaxiTrim`, `Tire`, `Rim`, `Chrome`, `HeadlightLens`, `DRL` (emissive),
  `Taillight` (red emissive), `Plate`, `Underbody`, `CheckerStripe` (image
  texture).
- **Wiring notes:** `Wheel_FL/FR/RL/RR` are empties at axle centers
  ((∓0.97, ∓0.58, 0.26); front = −X, left = −Y) with wheel meshes parented —
  spin the empties. Named meshes: `Headlight_L/R`, `Taillight_L/R`.
  No `RoofSign` node — the wiring reuses the original sign.
- **QA:** 5 build iterations × 7 angles (front 3/4, side, rear 3/4,
  front close-up + 3 fresh randoms each iteration), 1024px Cycles renders at
  `/home/hatch/workspace/portfolio/.qa/models/taxi/iter{1..5}_*.png`, plus
  `compare_{front34,side,rear34}.png` side-by-sides vs reference photos.
  (iter3 lost 2 random frames to a /tmp wipe + render-process death;
  iter4/iter5 are complete 7-angle sets.) Per-iteration improvements were:
  v2 footprint/scope change to sign-compatible roof, v3 vivid-yellow
  relight + rounded mirrors + flush pillars + slatted grille, v4 smoked
  headlights w/ DRLs + tamed clearcoat blowout, v5 subtler trunk lip +
  thinner C-pillars. Notable trap: `transform_apply` defaults
  `location=True/rotation=True` — must pass all three explicitly or parts
  end up at the origin.
