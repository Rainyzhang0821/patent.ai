/**
 * 静态预览：始终从本文件所在目录提供文件，避免因终端 cwd 不在项目根而导致 / 返回 404。
 */
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname);
const PORT = Number(process.env.PORT) || 5175;
const HOST = process.env.HOST || '127.0.0.1';

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.json': 'application/json',
};

function safeResolve(urlPath) {
  const rel = urlPath.replace(/^\/+/, '') || 'index.html';
  const filePath = path.normalize(path.join(ROOT, rel));
  if (!filePath.startsWith(ROOT)) return null;
  return filePath;
}

const server = http.createServer((req, res) => {
  try {
    const u = new URL(req.url || '/', `http://${HOST}`);
    let pathname = decodeURIComponent(u.pathname);
    if (pathname === '/' || pathname === '') pathname = '/index.html';

    const filePath = safeResolve(pathname);
    if (!filePath) {
      res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Forbidden');
      return;
    }

    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('404 File not found.');
        return;
      }
      const ext = path.extname(filePath).toLowerCase();
      const headers = { 'Content-Type': MIME[ext] || 'application/octet-stream' };
      /* 本地预览避免强缓存，改完 JS/CSS 后右侧 Simple Browser 无需手动改 ?v= */
      if (['.html', '.js', '.css'].includes(ext)) {
        headers['Cache-Control'] = 'no-store, no-cache, must-revalidate';
        headers.Pragma = 'no-cache';
      }
      res.writeHead(200, headers);
      res.end(data);
    });
  } catch {
    res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Bad request');
  }
});

server.listen(PORT, HOST, () => {
  console.log(`Open: http://${HOST}:${PORT}/`);
});
