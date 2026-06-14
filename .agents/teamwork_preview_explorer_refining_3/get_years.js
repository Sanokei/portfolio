const { execSync } = require('child_process');

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
    // Escape single quotes for git log command
    const escaped = p.replace(/'/g, "'\\''");
    // Run git log with -S to find when the text was added
    const out = execSync(`git log -S "${escaped}" --pretty=format:"%ad" --date=format:"%Y"`, { encoding: 'utf8' }).trim();
    if (out) {
      const lines = out.split('\n').filter(Boolean);
      year = lines[lines.length - 1]; // earliest commit year
    } else {
      // Fallback: search commit message
      const outMsg = execSync(`git log --grep="${escaped}" --pretty=format:"%ad" --date=format:"%Y"`, { encoding: 'utf8' }).trim();
      if (outMsg) {
        const lines = outMsg.split('\n').filter(Boolean);
        year = lines[lines.length - 1];
      }
    }
  } catch (err) {
    year = `Error: ${err.message}`;
  }
  console.log(`${p}: ${year || 'Not Found'}`);
}
