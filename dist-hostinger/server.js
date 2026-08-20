const path = require('path');
const fs = require('fs');
const { createServer } = require('http');
const { parse } = require('url');

// Configure Node.js module search paths
module.paths.unshift(path.join(__dirname, 'node_modules'));
module.paths.unshift(path.join(__dirname, 'apps', 'storefront', 'node_modules'));

process.env.NODE_ENV = 'production';

const appDir = path.join(__dirname, 'apps', 'storefront');
if (fs.existsSync(appDir)) {
  process.chdir(appDir);
}

const next = require('next');
const app = next({ dev: false, dir: '.' });

// Initiate Next.js preparation immediately
const prepPromise = app.prepare().then(() => {
  console.log('> Next.js app prepared successfully.');
}).catch((err) => {
  console.error('> Next.js prepare error:', err);
});

// Support both numeric TCP ports and Hostinger Phusion Passenger Unix sockets
const rawPort = process.env.PORT;
const port = rawPort ? (isNaN(Number(rawPort)) ? rawPort : parseInt(rawPort, 10)) : 3000;

// Create HTTP server SYNCHRONOUSLY at top-level script load context
const server = createServer(async (req, res) => {
  try {
    await prepPromise;
    const handle = app.getRequestHandler();
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  } catch (err) {
    console.error('Server request handler error:', err);
    if (!res.headersSent) {
      res.statusCode = 500;
      res.end('Internal Server Error');
    }
  }
});

// Invoke server.listen SYNCHRONOUSLY so Hostinger watchdog timer detects socket binding instantly!
server.listen(port, (err) => {
  if (err) throw err;
  console.log(`> Orbit Expo Crafts Hostinger Server running on ${port}`);
});
