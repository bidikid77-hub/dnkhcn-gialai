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

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    return res.end();
  }

  const parsedUrl = new URL(req.url, `http://localhost:${PORT}`);
  let pathname = parsedUrl.pathname;

  // Route API
  if (pathname.startsWith('/api/')) {
    const apiName = pathname.replace('/api/', '').replace(/\.js$/, '');
    const apiFile = path.join(DIR, 'api', `${apiName}.js`);
    if (fs.existsSync(apiFile)) {
      try {
        const handler = require(apiFile);
        // Polyfill express/vercel helper for standard http response
        res.status = function(code) {
          this.statusCode = code;
          return this;
        };
        res.json = function(data) {
          this.setHeader('Content-Type', 'application/json; charset=utf-8');
          this.end(JSON.stringify(data));
          return this;
        };
        return handler(req, res);
      } catch (e) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: e.message }));
      }
    }
  }

  // Rewrites
  if (pathname === '/' || pathname === '') {
    pathname = '/index.html';
  } else if (pathname === '/dashboard') {
    pathname = '/dashboard.html';
  } else if (pathname === '/mau-khai-bao-dn') {
    pathname = '/index.html';
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
