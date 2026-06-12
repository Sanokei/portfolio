// layout.js - Shared responsive measurements for the vertical museum wall.

export const WALL_WIDTH = 12;
export const WALL_HEIGHT = 92;
export const WALL_THICKNESS = 2.35;
export const WALL_Y_CENTER = -32;

export const HEADER_Y = 7.15;
export const START_Y = 3.55;
export const PROJECT_SPACING = 4.3;
export const CATEGORY_GAP = 1.15;
export const SECTION_LABEL_OFFSET = 2.15;

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
const CAMERA_FOV = 50;

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function lerp(a, b, t) {
  return a + (b - a) * t;
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
  const holeW = HOLE_W * objectScale;
  const holeH = HOLE_H * objectScale * 0.92;
  const plaqueW = PLAQUE_W * objectScale;
  const plaqueH = PLAQUE_H * objectScale;
  const headerW = lerp(3.15, 7.8, horizontalProgress) * clamp(objectScale, 0.86, 1);
  const headerH = lerp(0.86, 1.78, horizontalProgress) * clamp(objectScale, 0.86, 1);
  const cameraZ = getCameraZForViewport(width, height);
  const viewportWorldHeight = 2 * Math.tan((CAMERA_FOV * Math.PI / 180) / 2) * cameraZ;
  const sectionPlaqueW = 2.35 * objectScale;
  const sectionPlaqueH = 0.68 * objectScale;
  const sectionLabelOffset = holeH * 0.78 + sectionPlaqueH * 0.65;
  const titleBottomPadding = Math.max(1.1 * objectScale, viewportWorldHeight * 0.34);
  const startY = HEADER_Y - headerH / 2 - titleBottomPadding - sectionLabelOffset;

  return {
    objectScale,
    horizontalProgress,
    spacing,
    categoryGap: categoryGap + 0.65 * objectScale,
    headerY: HEADER_Y,
    startY,
    titleBottomPadding,
    sectionLabelOffset,
    sectionPlaqueW,
    sectionPlaqueH,
    viewportWorldHeight,
    wallZ: WALL_THICKNESS / 2,
    mediaZ: WALL_THICKNESS * 0.19,
    holeW,
    holeH,
    crtW: CRT_W * objectScale,
    crtH: CRT_H * objectScale,
    plaqueW,
    plaqueH,
    headerW,
    headerH,
  };
}

export function buildModuleLayout(projects, categoryOrder) {
  const modules = [];
  const sections = [];
  const metrics = getLayoutMetrics();
  const {
    objectScale,
    horizontalProgress,
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
    sectionPlaqueW,
    sectionPlaqueH,
  } = metrics;
  let cursorY = startY;

  for (const category of categoryOrder) {
    const categoryStart = cursorY;
    const catProjects = projects.filter(p => p.category === category);

    for (const project of catProjects) {
      const globalIndex = modules.length;
      const side = globalIndex % 2 === 0 ? -1 : 1;
      const stackedHoleX = side * Math.abs(MOBILE_HOLE_LEFT_X) * objectScale;
      const horizontalHoleX = side * Math.abs(HOLE_LEFT_X) * objectScale;
      const holeX = lerp(stackedHoleX, horizontalHoleX, horizontalProgress);
      const horizontalPlaqueX = -side * 1.62 * objectScale;
      const plaqueX = lerp(stackedHoleX, horizontalPlaqueX, horizontalProgress);
      const stackedPlaqueDrop = holeH * 0.74 + plaqueH * 0.54;
      const plaqueY = cursorY - stackedPlaqueDrop * (1 - horizontalProgress);

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
      labelY: categoryStart + sectionLabelOffset,
      scale: objectScale,
      width: sectionPlaqueW,
      height: sectionPlaqueH,
    });

    cursorY -= categoryGap;
  }

  return {
    modules,
    sections,
    metrics,
    maxY: HEADER_Y,
    minY: Math.max(WALL_Y_CENTER - WALL_HEIGHT / 2 + 3, cursorY + spacing - 1.5),
  };
}
