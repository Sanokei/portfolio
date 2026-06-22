// layout.js - Shared responsive measurements for the vertical museum wall.

export const WALL_WIDTH = 16;
export const WALL_HEIGHT = 128;
export const WALL_THICKNESS = 2.35;
export const WALL_Y_CENTER = -50;

// headerY is now computed in getLayoutMetrics() so it stays
// anchored to the wall top regardless of wall dimension changes.
export const PROJECT_SPACING = 4.3;
export const CATEGORY_GAP = 1.15;
export const SECTION_LABEL_OFFSET = 2.15;
export const SECTION_HEADING_TOP_PADDING = 1.2;
export const SECTION_LAMP_PLAQUE_TOP_OFFSET = 0.16;
export const SECTION_LAMP_HIGH_POINT_OFFSET = 0.45;
export const SECTION_LIGHT_BAR_LOW_EDGE_OFFSET = 0.145;
export const SECTION_HEADING_BAR_CLEARANCE = 0.58;

export const HOLE_LEFT_X = -1.55;
export const HOLE_RIGHT_X = 1.55;
export const MOBILE_HOLE_LEFT_X = -0.72;
export const MOBILE_HOLE_RIGHT_X = 0.72;
export const HOLE_W = 2.28;
export const HOLE_H = 2.38;

export const CRT_W = 1.58;
export const CRT_H = 1.12;
export const MEDIA_Z = -0.68;

export const PLAQUE_W = 1.38;
export const PLAQUE_H = 1.0;
export const PLAQUE_LEFT_X = -2.9;
export const PLAQUE_RIGHT_X = 2.9;
export const MOBILE_BREAKPOINT = 760;
export const MOBILE_PROJECT_SPACING = 5.15;

const STACKED_WIDTH = 700;
const HORIZONTAL_WIDTH = 980;
const MODULE_HORIZONTAL_START = 840;
const MODULE_HORIZONTAL_FULL = 1024;
const CAMERA_FOV = 50;
const HORIZONTAL_PLAQUE_X = 1.12;
const LAPTOP_PLAQUE_SCALE = 1.3;
const LAPTOP_PLAQUE_START = 1120;
const LAPTOP_PLAQUE_FULL = 1360;

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function getSectionHeadingTopPadding(scale) {
  return Math.max(
    SECTION_HEADING_TOP_PADDING,
    (
      SECTION_LAMP_PLAQUE_TOP_OFFSET +
      SECTION_LAMP_HIGH_POINT_OFFSET +
      SECTION_LIGHT_BAR_LOW_EDGE_OFFSET +
      SECTION_HEADING_BAR_CLEARANCE
    ) * scale,
  );
}

function getViewportSize() {
  return {
    width: Math.max(window.innerWidth || 1280, 1),
    height: Math.max(window.innerHeight || 720, 1),
  };
}

function getCameraZForViewport(width, height) {
  const aspect = width / Math.max(height, 1);
  if (aspect < 0.68) return 7.2;
  if (aspect < 1.0) return 6.25;
  return 4.65;
}

export function isMobileLayout() {
  return window.innerWidth <= MOBILE_BREAKPOINT;
}

export function getLayoutMetrics() {
  const { width, height } = getViewportSize();
  const horizontalProgress = clamp(
    (width - STACKED_WIDTH) / (HORIZONTAL_WIDTH - STACKED_WIDTH),
    0,
    1,
  );
  const moduleHorizontalProgress = clamp(
    (width - MODULE_HORIZONTAL_START) / (MODULE_HORIZONTAL_FULL - MODULE_HORIZONTAL_START),
    0,
    1,
  );
  const stackedScale = clamp(width / 430, 0.72, 0.95);
  const horizontalScale = clamp(
    Math.min(width / 1160, (height / 680) * 1.05),
    0.84,
    1.08,
  );
  const objectScale = lerp(stackedScale, horizontalScale, horizontalProgress);
  const spacing = lerp(MOBILE_PROJECT_SPACING, PROJECT_SPACING, horizontalProgress) *
    clamp(objectScale, 0.9, 1.04);
  const categoryGap = CATEGORY_GAP * lerp(1.18, 1, horizontalProgress);
  const plaqueScaleBoost = lerp(
    1,
    LAPTOP_PLAQUE_SCALE,
    clamp((width - LAPTOP_PLAQUE_START) / (LAPTOP_PLAQUE_FULL - LAPTOP_PLAQUE_START), 0, 1),
  );
  const holeW = HOLE_W * objectScale;
  const holeH = HOLE_H * objectScale * 0.92;
  const plaqueW = PLAQUE_W * objectScale * plaqueScaleBoost;
  const plaqueH = PLAQUE_H * objectScale * plaqueScaleBoost;
  const cameraZ = getCameraZForViewport(width, height);
  const viewportWorldHeight = 2 * Math.tan((CAMERA_FOV * Math.PI / 180) / 2) * cameraZ;
  const sectionPlaqueW = 2.35 * objectScale;
  const sectionPlaqueH = 0.68 * objectScale;
  const sectionLabelOffset = holeH * 1.15 + sectionPlaqueH * 1.0;
  const sectionHeadingTopPadding = getSectionHeadingTopPadding(objectScale);

  // How much of the wall is visible at the wall's depth.
  // At the camera plane we see viewportWorldHeight; at the wall
  // the visible slice is narrower because wallZ > 0.
  const wallZ = WALL_THICKNESS / 2;
  const visibleWallHeight = 2 * Math.tan((CAMERA_FOV * Math.PI / 180) / 2) * (cameraZ - wallZ);
  const visibleWallWidth = visibleWallHeight * (width / Math.max(height, 1));

  // Cap the header plaque so "THE PORTFOLIO" never overflows the
  // viewport — the raw lerp can return 7.8 wu while the visible
  // slice at the wall is only ~5.8 wu on 16:9.
  const rawHeaderW = lerp(3.15, 7.8, horizontalProgress) * clamp(objectScale, 0.86, 1);
  const headerW = Math.min(rawHeaderW, visibleWallWidth * 0.82);

  // Derive height from width using the texture's native aspect ratio
  // (the canvas is 1400×320).  Independent lerp of width and height
  // causes the text to stretch at some viewport sizes; pinning the
  // ratio keeps "THE PORTFOLIO" crisp at every breakpoint.
  const HEADER_TEXTURE_ASPECT = 1400 / 320;
  const headerH = headerW / HEADER_TEXTURE_ASPECT;

  // Anchor the header plaque to the wall top so it always
  // accounts for wall dimensions (not a hardcoded constant).
  const wallTop = WALL_Y_CENTER + WALL_HEIGHT / 2;
  const headerTopGap = 1.4 * objectScale;
  const headerY = wallTop - headerH / 2 - headerTopGap;

  // Backdrop panel should fill the viewport at the wall plane.
  const backdropHeight = visibleWallHeight * 1.2;

  const titleWallLowerOverhang = Math.max(0, (backdropHeight - headerH) / 2);
  const sectionHeadingHeightAboveLabel = sectionPlaqueH / 2 + sectionHeadingTopPadding;
  const titleBottomPadding = Math.max(
    1.1 * objectScale,
    viewportWorldHeight * 0.34,
    titleWallLowerOverhang + sectionHeadingHeightAboveLabel,
  );
  const startY = headerY - headerH / 2 - titleBottomPadding - sectionLabelOffset;

  return {
    objectScale,
    plaqueScaleBoost,
    horizontalProgress,
    moduleHorizontalProgress,
    spacing,
    categoryGap: categoryGap + 0.65 * objectScale,
    headerY,
    startY,
    titleBottomPadding,
    sectionLabelOffset,
    sectionHeadingTopPadding,
    sectionPlaqueW,
    sectionPlaqueH,
    cameraZ,
    viewportWorldHeight,
    visibleWallHeight,
    visibleWallWidth,
    backdropHeight,
    wallZ,
    mediaZ: WALL_THICKNESS * 0.19,
    holeW,
    holeH,
    crtW: CRT_W * objectScale,
    crtH: CRT_H * objectScale,
    plaqueW,
    plaqueH,
    headerW,
    headerH,
    endingWallHeight: visibleWallHeight * 0.92,
  };
}

export function buildModuleLayout(projects, categoryOrder) {
  const modules = [];
  const sections = [];
  const metrics = getLayoutMetrics();
  const {
    objectScale,
    horizontalProgress,
    moduleHorizontalProgress,
    spacing,
    categoryGap,
    wallZ,
    mediaZ,
    holeW,
    holeH,
    crtW,
    crtH,
    plaqueW,
    plaqueH,
    startY,
    sectionLabelOffset,
    sectionHeadingTopPadding,
    sectionPlaqueW,
    sectionPlaqueH,
  } = metrics;
  let cursorY = startY;

  for (const category of categoryOrder) {
    const categoryStart = cursorY;
    const catProjects = projects.filter(p => p.category === category);
    const sectionLabelY = categoryStart + sectionLabelOffset;
    const sectionWallTopY = sectionLabelY + sectionPlaqueH / 2 + sectionHeadingTopPadding;

    for (let projectIndex = 0; projectIndex < catProjects.length; projectIndex++) {
      const project = catProjects[projectIndex];
      const globalIndex = modules.length;
      const side = globalIndex % 2 === 0 ? -1 : 1;
      const stackedHoleX = 0;
      const horizontalHoleX = side * Math.abs(HOLE_LEFT_X) * objectScale;
      const holeX = lerp(stackedHoleX, horizontalHoleX, moduleHorizontalProgress);
      const horizontalPlaqueX = -side * HORIZONTAL_PLAQUE_X * objectScale;
      const plaqueX = lerp(0, horizontalPlaqueX, moduleHorizontalProgress);
      const stackedPlaqueDrop = holeH * 0.74 + plaqueH * 0.54;
      const plaqueY = cursorY - stackedPlaqueDrop * (1 - moduleHorizontalProgress);

      modules.push({
        project,
        category,
        worldX: holeX,
        worldY: cursorY,
        plaqueX,
        plaqueY,
        wallZ,
        mediaZ,
        spacing,
        cavityDepth: WALL_THICKNESS,
        holeW,
        holeH,
        crtW,
        crtH,
        plaqueW,
        plaqueH,
        objectScale,
        horizontalProgress,
        moduleHorizontalProgress,
        isSectionFirst: projectIndex === 0,
        sectionWallTopY: projectIndex === 0 ? sectionWallTopY : null,
        seed: project.id * 173 + 29,
      });
      cursorY -= spacing;
    }

    const categoryEnd = cursorY + spacing;
    sections.push({
      category,
      startY: categoryStart,
      endY: categoryEnd,
      labelX: 0,
      labelY: sectionLabelY,
      wallTopY: sectionWallTopY,
      scale: objectScale,
      width: sectionPlaqueW,
      height: sectionPlaqueH,
    });

    // Ensure the next section's wall top and light bar are safely below
    // the previous section's lowest visual element (hole bottom or plaque bottom).
    const last_worldY = cursorY + spacing;
    const last_stackedPlaqueDrop = holeH * 0.74 + plaqueH * 0.54;
    const last_plaqueY = last_worldY - last_stackedPlaqueDrop * (1 - moduleHorizontalProgress);
    const lastBottom = Math.min(last_worldY - holeH / 2, last_plaqueY - plaqueH / 2);

    const distToWallTop = sectionLabelOffset + sectionPlaqueH / 2 + sectionHeadingTopPadding;
    const clearanceBuffer = lerp(0.35, 0.085, moduleHorizontalProgress) * objectScale;
    const constrainedNextStart = lastBottom - clearanceBuffer - distToWallTop;
    const normalNextStart = cursorY - categoryGap;

    cursorY = Math.min(normalNextStart, constrainedNextStart);
  }

  const lastModule = modules[modules.length - 1];
  const lastBottom = lastModule ? Math.min(lastModule.worldY - lastModule.holeH / 2, lastModule.plaqueY - lastModule.plaqueH / 2) : startY;
  const museumPadding = 2.0 * metrics.objectScale;
  const bottomTop = lastBottom - museumPadding;
  const floorY = bottomTop - metrics.endingWallHeight;
  const minY = floorY + metrics.visibleWallHeight / 2;

  return {
    modules,
    sections,
    metrics,
    maxY: metrics.headerY,
    minY: minY,
    floorY: floorY,
    bottomTop: bottomTop,
  };
}
