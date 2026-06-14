const { execFileSync } = require('child_process');

const projects = [
  "Coot's Bug Squasher",
  "Adventure of Sir Robin",
  "Intern",
  "Productivity App",
  "Corruption",
  "Curling The Herd",
  "We Mice",
  "Fish out of Water",
  "Handjob: The Blower Gallery",
  "The Arcane Observer",
  "[ new tab ] - Doodle",
  "Emoji Game",
  "ExNoto",
  "clamtap",
  "Art Allergy",
  "Index of Babel",
  "VOD Highlighter",
  "David The Duck",
  "TrainEngine",
  "Sano Fails to Sell Spotify™ Tattoos",
  "Merlin Economics",
  "Kanta"
];

for (const p of projects) {
  let year = '';
  try {
    // Using execFileSync to avoid any shell interpolation/quoting issues on Windows
    const args = ['log', '-S', p, '--pretty=format:%ad', '--date=format:%Y'];
    const out = execFileSync('git', args, { encoding: 'utf8' }).trim();
    if (out) {
      const lines = out.split('\n').map(l => l.trim()).filter(Boolean);
      year = lines[lines.length - 1]; // earliest commit year
    } else {
      // Fallback: search commit message instead of content change
      const argsMsg = ['log', '--grep=' + p, '--pretty=format:%ad', '--date=format:%Y'];
      const outMsg = execFileSync('git', argsMsg, { encoding: 'utf8' }).trim();
      if (outMsg) {
        const lines = outMsg.split('\n').map(l => l.trim()).filter(Boolean);
        year = lines[lines.length - 1];
      }
    }
  } catch (err) {
    year = `Error: ${err.message}`;
  }
  console.log(`${p}: ${year || 'Not Found'}`);
}
