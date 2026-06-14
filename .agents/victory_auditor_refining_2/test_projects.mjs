import { projects, categoryOrder } from '../../js/projects.js';

let error = false;

console.log('--- Project Count Check ---');
console.log('Total number of projects:', projects.length);
if (projects.length !== 22) {
  console.error('ERROR: Total projects count is ' + projects.length + ', expected 22');
  error = true;
}

console.log('\n--- Category Sorting Check ---');
for (const cat of categoryOrder) {
  const catProjects = projects.filter(p => p.category === cat);
  console.log(cat + ':');
  let prevYear = Infinity;
  for (const p of catProjects) {
    console.log('  - ' + p.name + ' (' + p.year + ')');
    if (typeof p.year !== 'number') {
      console.error('  ERROR: project ' + p.name + ' does not have a numeric year');
      error = true;
    }
    if (p.year > prevYear) {
      console.error('  ERROR: projects not sorted descending in ' + cat + '. ' + p.name + ' has year ' + p.year + ' which is greater than previous ' + prevYear);
      error = true;
    }
    prevYear = p.year;
  }
}

console.log('\n--- Handjob Project Link Check ---');
const handjob = projects.find(p => p.id === 19);
if (!handjob) {
  console.error('ERROR: Handjob project (ID 19) not found');
  error = true;
} else {
  console.log('Handjob project links:', JSON.stringify(handjob.links));
  if (handjob.links.some(l => l.label === 'Media')) {
    console.error('ERROR: Handjob project still has Media link');
    error = true;
  } else {
    console.log('Handjob project does not have Media link: PASS');
  }
}

if (error) {
  console.error('\nResult: FAIL');
  process.exit(1);
} else {
  console.log('\nResult: PASS');
  process.exit(0);
}
