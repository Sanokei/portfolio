// projects.js — Complete project data for all 16 portfolio entries.
// Each project maps to one cavity in the museum wall.
// Fields:
//   id          — unique numeric ID
//   name        — display title
//   category    — section grouping (Games, Websites, Programs, Videos, Board Games)
//   subtitle    — genre/type line shown on plaque
//   description — 1-2 sentence blurb for plaque
//   tags        — short labels (Development, Design, UI/UX, etc.)
//   links       — [{ label: 'itch.io'|'GitHub'|'Website', url: '...', icon: 'itchio'|'gh'|'web' }]
//   assets      — [{ type: 'video'|'image', src: 'path' }] — 2-4 items for carousel

export const projects = [
  // ── GAMES ──────────────────────────────────────────────
  {
    id: 1,
    name: "Coot's Bug Squasher",
    category: 'Games',
    subtitle: 'Video Game, Narrative, Puzzle, Coding',
    description:
      'A hacking game about a cat who puts themselves into computers ' +
      'to get through security measures. Features a custom toylang called AlphaJargon.',
    tags: ['Development', 'Design', 'UI/UX', 'Pixel Art'],
    links: [
      { label: 'itch.io', url: 'https://sanokei.itch.io/coots-bug-squasher', icon: 'itchio' },
      { label: 'GitHub', url: 'https://github.com/Sanokei/Coots-Bug-Squasher', icon: 'gh' },
    ],
    assets: [
      { type: 'video', src: 'video/coots.mp4' },
      { type: 'image', src: 'https://img.itch.zone/aW1hZ2UvMTk0NDA5NS8xNTMxMjI5OS5wbmc=/original/yoWHzX.png' },
      { type: 'image', src: 'https://img.itch.zone/aW1hZ2UvMTk0NDA5NS8xNTMxMjI5OC5wbmc=/original/zTHk4q.png' },
    ],
  },
  {
    id: 2,
    name: 'Adventure of Sir Robin',
    category: 'Games',
    subtitle: 'Video Game, Adventure, Narrative',
    description:
      'An adventure game about a magically intelligent bag. ' +
      'The twist? The bag\'s intelligence was the player all along.',
    tags: ['Development', 'Design', 'UI/UX'],
    links: [
      { label: 'itch.io', url: 'https://sanokei.itch.io/adventure-of-sir-robin', icon: 'itchio' },
      { label: 'GitHub', url: 'https://github.com/Sanokei/AdventureOfSirRobin', icon: 'gh' },
    ],
    assets: [
      { type: 'video', src: 'video/sirrobin.mp4' },
      { type: 'image', src: 'https://img.itch.zone/aW1hZ2UvMjE2MDc5Ny8xMjczMjcxMS5wbmc=/original/dPcIrV.png' },
      { type: 'image', src: 'https://img.itch.zone/aW1hZ2UvMjE2MDc5Ny8xMjczMjcyMy5wbmc=/original/uNqqen.png' },
    ],
  },
  {
    id: 3,
    name: 'Intern',
    category: 'Games',
    subtitle: 'Video Game, Mini-games',
    description:
      'A god game where the player fixes the mistakes of a bumbling intern, ' +
      'before the stress fractures the world around them.',
    tags: ['Development', 'Design', 'UI/UX'],
    links: [
      { label: 'itch.io', url: 'https://sanokei.itch.io/intern', icon: 'itchio' },
      { label: 'GitHub', url: 'https://github.com/Sanokei/Intern', icon: 'gh' },
    ],
    assets: [
      { type: 'video', src: 'video/intern.mp4' },
      { type: 'image', src: 'https://img.itch.zone/aW1nLzEyODQ4NzgyLnBuZw==/315x250%23c/%2F7KLj3.png' },
    ],
  },
  {
    id: 4,
    name: 'Productivity App',
    category: 'Games',
    subtitle: 'Video Game, Narrative (WIP)',
    description:
      'A meta-narrative walking simulator about productivity, artistic expression, ' +
      'and the toxic battle within ourselves. Inspired by ludonarrative dissonance.',
    tags: ['Development', 'Design', 'UI/UX'],
    links: [
      { label: 'itch.io', url: 'https://sanokei.itch.io/productivity-app', icon: 'itchio' },
      { label: 'GitHub', url: 'https://github.com/Sanokei/Productivity-App', icon: 'gh' },
    ],
    assets: [
      { type: 'video', src: 'video/productivity.mp4' },
      { type: 'image', src: 'https://img.itch.zone/aW1nLzE1NTcwNzUyLnBuZw==/315x250%23c/EgGZ9u.png' },
      { type: 'image', src: 'img/piano.png' },
    ],
  },
  {
    id: 5,
    name: 'Corruption',
    category: 'Games',
    subtitle: 'Video Game, Management',
    description:
      'A swiping management game where the player is a dictator deciding whether ' +
      'to sell off a newly declared country to capitalists.',
    tags: ['Development', 'Design', 'UI/UX'],
    links: [
      { label: 'itch.io', url: 'https://sanokei.itch.io/corruption', icon: 'itchio' },
      { label: 'GitHub', url: 'https://github.com/Sanokei/corruption', icon: 'gh' },
    ],
    assets: [
      { type: 'video', src: 'video/corruption.mp4' },
      { type: 'image', src: 'https://img.itch.zone/aW1nLzEyODkzNDAzLnBuZw==/original/9m0xOZ.png' },
      { type: 'image', src: 'https://img.itch.zone/aW1hZ2UvMjE4MzU0MC8xNTY0ODI5MS5wbmc=/original/2t8Kat.png' },
    ],
  },
  {
    id: 6,
    name: 'Curling The Herd',
    category: 'Games',
    subtitle: 'Video Game, Top-down',
    description:
      'My first game jam submission. A curling pro slime destroys ' +
      'murderous sentient hockey goals by scoring in them.',
    tags: ['Development', 'Design', 'UI/UX'],
    links: [
      { label: 'itch.io', url: 'https://sanokei.itch.io/curling-the-herd', icon: 'itchio' },
      { label: 'GitHub', url: 'https://github.com/Sanokei/CurlingTheHerd', icon: 'gh' },
    ],
    assets: [
      { type: 'video', src: 'video/curling.mp4' },
      { type: 'image', src: 'https://img.itch.zone/aW1hZ2UvMTI3MzMwMS8xNTY0ODMzNi5wbmc=/original/W%2BKzn9.png' },
    ],
  },

  // ── WEBSITES ───────────────────────────────────────────
  {
    id: 7,
    name: 'The Arcane Observer',
    category: 'Websites',
    subtitle: 'Newspaper, Fantasy Narrative',
    description:
      'A self-updating magic newspaper that takes the top oddities of the day ' +
      'from AP and explains them away with wizard activities.',
    tags: ['Development', 'Design', 'UI/UX'],
    links: [
      { label: 'Website', url: 'https://arcaneobserver.com/', icon: 'web' },
      { label: 'GitHub', url: 'https://github.com/Sanokei/ArcaneObserver/', icon: 'gh' },
    ],
    assets: [
      { type: 'image', src: 'img/4-1-24_ArcaneObserver.png' },
      { type: 'image', src: 'img/4-5-24_ArcaneObserver.png' },
    ],
  },
  {
    id: 8,
    name: '[ new tab ] - Doodle',
    category: 'Websites',
    subtitle: 'Productivity, Art, Drawing',
    description:
      'A Chrome extension new-tab doodle pad so you always have a place to jot ' +
      'something down without the noise of typing.',
    tags: ['Web Development', 'Design', 'UI/UX'],
    links: [
      { label: 'GitHub', url: 'https://github.com/Sanokei/newtab-doodle/', icon: 'gh' },
    ],
    assets: [
      { type: 'video', src: 'video/doodle.mp4' },
      { type: 'image', src: 'img/doodle.png' },
    ],
  },
  {
    id: 9,
    name: 'Emoji Game',
    category: 'Websites',
    subtitle: 'Web Game (Archived)',
    description:
      'An AI-powered emoji movie name guessing game. ' +
      'Gives the user emojis and they guess what movie the AI is thinking of.',
    tags: ['Development', 'Design', 'UI/UX'],
    links: [
      { label: 'GitHub', url: 'https://github.com/Sanokei/Emoji-Game', icon: 'gh' },
    ],
    assets: [
      { type: 'image', src: 'img/emoji-game.gif' },
    ],
  },
  {
    id: 10,
    name: 'ExNoto',
    category: 'Websites',
    subtitle: 'Website Template',
    description:
      'A landing page mock-up for a potential AI translator app or other SaaS project.',
    tags: ['Development', 'Design', 'UI/UX'],
    links: [
      { label: 'Website', url: 'https://sanokei.github.io/ExNoto/', icon: 'web' },
      { label: 'GitHub', url: 'https://github.com/Sanokei/ExNoto', icon: 'gh' },
    ],
    assets: [
      { type: 'image', src: 'https://camo.githubusercontent.com/9115e5041cf4d477c7d803f0e3395b59223456601939dbba0cd193e45524ade4/68747470733a2f2f66696c65732e636174626f782e6d6f652f6675747430612e676966' },
      { type: 'image', src: 'https://camo.githubusercontent.com/6ee54c835789b7dca22a5ed9ce787ef351b9cffe37272b9c5df3b0504f62bd67/68747470733a2f2f66696c65732e636174626f782e6d6f652f7272353536652e676966' },
    ],
  },
  {
    id: 11,
    name: 'clamtap',
    category: 'Websites',
    subtitle: 'Website Template',
    description:
      'A landing page mock-up for an NFC-based tap-to-pay SaaS consisting of just a phone.',
    tags: ['Development', 'Design', 'UI/UX'],
    links: [
      { label: 'Website', url: 'https://sanokei.github.io/clamtap/', icon: 'web' },
      { label: 'GitHub', url: 'https://github.com/Sanokei/clamtap', icon: 'gh' },
    ],
    assets: [
      { type: 'image', src: 'img/clamtap1.png' },
      { type: 'image', src: 'img/clamtap2.png' },
    ],
  },

  // ── PROGRAMS ───────────────────────────────────────────
  {
    id: 12,
    name: 'VOD Highlighter',
    category: 'Programs',
    subtitle: 'Machine Learning, BERT',
    description:
      'Originally an AI program trained on BERT to cut down boring university lectures, ' +
      'turned into a tool to create highlights of long streams.',
    tags: ['Development'],
    links: [
      { label: 'GitHub', url: 'https://github.com/Sanokei/VOD-Highlighter', icon: 'gh' },
    ],
    assets: [], // no images — placeholder
  },
  {
    id: 13,
    name: 'David The Duck',
    category: 'Programs',
    subtitle: 'Desktop Pet',
    description:
      'A desktop pet that waddles around your screen and gets into mischief. ' +
      'Inspired by Desktop Goose. A birthday present for my best friend.',
    tags: ['Development', 'Design', 'Pixel Art'],
    links: [
      { label: 'GitHub', url: 'https://github.com/Sanokei/David-The-Duck', icon: 'gh' },
    ],
    assets: [
      { type: 'image', src: 'https://github.com/Sanokei/David-The-Duck/raw/main/resources/images/david_the_duck_logo.jpg' },
      { type: 'image', src: 'img/GifODavid.gif' },
    ],
  },

  // ── VIDEOS ─────────────────────────────────────────────
  {
    id: 14,
    name: 'Sano Fails to Sell Spotify™ Tattoos',
    category: 'Videos',
    subtitle: 'AI Art, Satire',
    description:
      'A satirical video about using AI art for personal benefit, ' +
      'understanding what\'s underneath instead. Developed a whole website for the video.',
    tags: ['Writing', 'Editing'],
    links: [
      { label: 'YouTube', url: 'https://www.youtube.com/watch?v=WK5pHoAeL6Y', icon: 'web' },
    ],
    assets: [
      { type: 'image', src: 'img/thumbnail.jpg' },
    ],
  },

  // ── BOARD GAMES ────────────────────────────────────────
  {
    id: 15,
    name: 'Merlin Economics',
    category: 'Board Games',
    subtitle: 'Hand Management, Commodity Speculation, Blind Auctioning',
    description:
      'A board game that applies real-world economic principles to a fictional wizard world. ' +
      'Fortune-telling cards forecast economic instability.',
    tags: ['Design'],
    links: [
      { label: 'itch.io', url: 'https://sanokei.itch.io/merlin-economics', icon: 'itchio' },
    ],
    assets: [], // no images — placeholder
  },
  {
    id: 16,
    name: 'Kanta',
    category: 'Board Games',
    subtitle: 'Hand Management, Betting, Statistics',
    description:
      'A two-player gambling card game with fantasy elements. Inspired by blackjack. ' +
      'Made because I wanted a new card game as easy to pick up as blackjack.',
    tags: ['Design'],
    links: [
      { label: 'itch.io', url: 'https://sanokei.itch.io/kanta', icon: 'itchio' },
    ],
    assets: [], // no images — placeholder
  },
];

// Category display order (left to right on the wall)
export const categoryOrder = ['Games', 'Websites', 'Programs', 'Videos', 'Board Games'];

// Group projects by category for easy iteration
export function getProjectsByCategory() {
  const map = {};
  for (const cat of categoryOrder) {
    map[cat] = projects.filter(p => p.category === cat);
  }
  return map;
}
