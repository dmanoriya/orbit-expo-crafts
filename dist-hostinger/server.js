const path = require('path');
const fs = require('fs');

process.env.PORT = process.env.PORT || process.env.PORT_APP || 3000;
process.env.HOSTNAME = process.env.HOSTNAME || '0.0.0.0';

const possiblePaths = [
  path.join(__dirname, 'apps/storefront/server.js'),
  path.join(__dirname, 'nodejs/apps/storefront/server.js'),
  path.join(__dirname, '../apps/storefront/server.js'),
];

let targetServer = null;
for (const p of possiblePaths) {
  if (p !== __filename && fs.existsSync(p)) {
    targetServer = p;
    break;
  }
}

if (targetServer) {
  require(targetServer);
} else {
  console.error('Next.js standalone server not found at', possiblePaths);
}
