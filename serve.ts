// Tiny static file server for local preview of app/ on port 8080. Dev tool only.
import { readFileSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize } from 'node:path';

const appRoot = join(import.meta.dirname, 'app');
const port = 8080;

const mimeTypes: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

const server = createServer((req, res) => {
  const urlPath = decodeURIComponent((req.url ?? '/').split('?')[0] ?? '/');
  const rel = urlPath === '/' ? 'index.html' : normalize(urlPath).replace(/^[/\\]+/, '');
  const filePath = join(appRoot, rel);
  if (!filePath.startsWith(appRoot)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('Forbidden');
    return;
  }
  try {
    const info = statSync(filePath);
    const target = info.isDirectory() ? join(filePath, 'index.html') : filePath;
    const body = readFileSync(target);
    res.writeHead(200, { 'Content-Type': mimeTypes[extname(target).toLowerCase()] ?? 'application/octet-stream' });
    res.end(body);
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not found');
  }
});

server.listen(port, () => {
  console.log(`Vice Cover Maker preview: http://localhost:${port}`);
});
