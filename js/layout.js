// layout.js - Shared measurements for the vertical museum wall.

export const WALL_WIDTH = 12;
export const WALL_HEIGHT = 92;
export const WALL_THICKNESS = 0.85;
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

export function isMobileLayout() {
  return window.innerWidth <= MOBILE_BREAKPOINT;
}

export function buildModuleLayout(projects, categoryOrder) {
  const modules = [];
  const sections = [];
  const mobile = isMobileLayout();
  const spacing = mobile ? MOBILE_PROJECT_SPACING : PROJECT_SPACING;
  let cursorY = START_Y;

  for (const category of categoryOrder) {
    const categoryStart = cursorY;
    const catProjects = projects.filter(p => p.category === category);

    for (const project of catProjects) {
      const globalIndex = modules.length;
      const holeX = globalIndex % 2 === 0
        ? (mobile ? MOBILE_HOLE_LEFT_X : HOLE_LEFT_X)
        : (mobile ? MOBILE_HOLE_RIGHT_X : HOLE_RIGHT_X);
      const plaqueX = mobile
        ? holeX
        : (globalIndex % 2 === 0 ? PLAQUE_RIGHT_X : PLAQUE_LEFT_X);
      const plaqueY = mobile ? cursorY - HOLE_H * 0.84 : cursorY;
      modules.push({
        project,
        category,
        worldX: holeX,
        worldY: cursorY,
        plaqueX,
        plaqueY,
        wallZ: WALL_THICKNESS / 2,
        mediaZ: MEDIA_Z,
        spacing,
        cavityDepth: WALL_THICKNESS,
        holeW: HOLE_W,
        holeH: HOLE_H,
        crtW: CRT_W,
        crtH: CRT_H,
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
      labelY: categoryStart + SECTION_LABEL_OFFSET,
    });

    cursorY -= CATEGORY_GAP;
  }

  return {
    modules,
    sections,
    maxY: HEADER_Y,
    minY: Math.max(WALL_Y_CENTER - WALL_HEIGHT / 2 + 3, cursorY + spacing - 1.5),
  };
}
