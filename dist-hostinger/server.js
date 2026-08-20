const { createServer } = require('http');
const { parse } = require('url');
const path = require('path');
const fs = require('fs');

process.env.NODE_ENV = 'production';

const appDir = path.join(__dirname, 'apps', 'storefront');

// Change working directory to storefront app dir for relative asset resolution
if (fs.existsSync(appDir)) {
  process.chdir(appDir);
}

const next = require('next');
const app = next({ dev: false, dir: '.' });
const handle = app.getRequestHandler();

const port = parseInt(process.env.PORT, 10) || 3000;

// Hostinger requires server.listen() to be executed immediately on startup
const server = createServer((req, res) => {
  const parsedUrl = parse(req.url, true);
  handle(req, res, parsedUrl);
});

app.prepare().then(() => {
  console.log('> Next.js app prepared successfully.');
}).catch((err) => {
  console.error('> Next.js prepare error:', err);
});

server.listen(port, (err) => {
  if (err) throw err;
  console.log(`> Orbit Expo Crafts Hostinger Server running on port ${port}`);
});
