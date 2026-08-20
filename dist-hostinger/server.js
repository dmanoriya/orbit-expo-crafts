const path = require('path');
const fs = require('fs');

// Configure Node.js module search paths to find next and all dependencies seamlessly
module.paths.unshift(path.join(__dirname, 'node_modules'));
module.paths.unshift(path.join(__dirname, 'apps', 'storefront', 'node_modules'));

const { createServer } = require('http');
const { parse } = require('url');

process.env.NODE_ENV = 'production';

const appDir = path.join(__dirname, 'apps', 'storefront');

if (fs.existsSync(appDir)) {
  process.chdir(appDir);
}

const next = require('next');
const app = next({ dev: false, dir: '.' });
const handle = app.getRequestHandler();

const port = parseInt(process.env.PORT, 10) || 3000;
const hostname = '0.0.0.0';

const server = createServer((req, res) => {
  const parsedUrl = parse(req.url, true);
  handle(req, res, parsedUrl);
});

app.prepare().then(() => {
  console.log('> Next.js app prepared successfully.');
}).catch((err) => {
  console.error('> Next.js prepare error:', err);
});

server.listen(port, hostname, (err) => {
  if (err) throw err;
  console.log(`> Orbit Expo Crafts Hostinger Server running on http://${hostname}:${port}`);
});
