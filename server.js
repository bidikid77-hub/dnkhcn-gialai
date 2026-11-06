const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 5050;
const DIR = __dirname;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml'
};

const ALLOWED_STATIC = new Set([
  'index.html',
  'dashboard.html',
  'mau-khai-bao-dn.html',
  'manifest.json',
  'sw.js',
  'xlsx.full.min.js'
]);

const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    return res.end();
  }

  let parsedUrl;
  try {
    parsedUrl = new URL(req.url, `http://localhost:${PORT}`);
  } catch (err) {
    res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
    return res.end('400 Bad Request');
  }

  let pathname = parsedUrl.pathname;

  // Route API
  if (pathname.startsWith('/api/')) {
    const apiName = pathname.replace('/api/', '').replace(/\.js$/, '');
    const apiFile = path.join(DIR, 'api', `${apiName}.js`);
    if (fs.existsSync(apiFile)) {
      try {
        delete require.cache[require.resolve(apiFile)];
        const handler = require(apiFile);
        res.status = function(code) {
          this.statusCode = code;
          return this;
        };
        res.json = function(data) {
          if (!this.headersSent) {
            this.setHeader('Content-Type', 'application/json; charset=utf-8');
            this.end(JSON.stringify(data));
          }
          return this;
        };
        return await handler(req, res);
      } catch (e) {
        if (!res.headersSent) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ error: e.message }));
        }
        if (!res.writableEnded) {
          res.destroy();
        }
        return;
      }
    }
  }

  // Rewrites
  if (pathname === '/' || pathname === '') {
    pathname = 'index.html';
  } else if (pathname === '/dashboard') {
    pathname = 'dashboard.html';
  } else if (pathname === '/mau-khai-bao-dn') {
    pathname = 'index.html';
  } else {
    pathname = pathname.replace(/^\/+/, '');
  }

  // Whitelist static check
  if (!ALLOWED_STATIC.has(pathname)) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    return res.end('404 Not Found');
  }

  const filePath = path.join(DIR, pathname);
  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'application/octet-stream' });
    fs.createReadStream(filePath).pipe(res);
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('404 Not Found');
  }
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`DN KHCN Server running at http://localhost:${PORT}/`);
});
