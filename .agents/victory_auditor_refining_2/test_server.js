const http = require('http');

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ statusCode: res.statusCode, headers: res.headers, body: data }));
    }).on('error', reject);
  });
}

async function run() {
  try {
    console.log('Testing connection to http://localhost:3000/ ...');
    const indexRes = await fetchUrl('http://localhost:3000/');
    console.log('Index.html Status Code:', indexRes.statusCode);
    if (indexRes.statusCode === 200 && indexRes.body.includes('<title>')) {
      console.log('Index page served successfully! Title matches.');
    } else {
      console.error('ERROR: Failed to fetch index page correctly');
      process.exit(1);
    }

    console.log('\nTesting connection to http://localhost:3000/js/projects.js ...');
    const projectsRes = await fetchUrl('http://localhost:3000/js/projects.js');
    console.log('Projects.js Status Code:', projectsRes.statusCode);
    if (projectsRes.statusCode === 200) {
      if (projectsRes.body.includes('We Mice') && !projectsRes.body.includes('label: \'Media\'')) {
        console.log('Projects.js served successfully with modifications!');
      } else {
        console.error('ERROR: projects.js is served but does not contain modified content.');
        process.exit(1);
      }
    } else {
      console.error('ERROR: Failed to fetch projects.js');
      process.exit(1);
    }

    console.log('\nAll server checks passed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Server is not running or returned an error:', err.message);
    process.exit(1);
  }
}

run();
