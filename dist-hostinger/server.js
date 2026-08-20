const path = require('path');
const fs = require('fs');

process.env.NODE_ENV = 'production';

const appDir = path.join(__dirname, 'apps', 'storefront');
if (fs.existsSync(appDir)) {
  process.chdir(appDir);
}

require('./server.js');
