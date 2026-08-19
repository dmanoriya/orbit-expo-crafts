const path = require('path');
process.chdir(path.join(__dirname, 'apps', 'storefront'));
require('./apps/storefront/server.js');
