/**
 * 将根目录静态资源复制到 docs/，供 GitHub Pages（Settings → Pages → Branch main /folder docs）发布。
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname);
const OUT = path.join(ROOT, 'docs');

const SKIP_JS = new Set(['build.mjs', 'preview.mjs']);

function rmrf(p) {
  if (fs.existsSync(p)) fs.rmSync(p, { recursive: true, force: true });
}

function copyFile(src, dest) {
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
}

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const ent of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, ent.name);
    const d = path.join(dest, ent.name);
    if (ent.isDirectory()) copyDir(s, d);
    else fs.copyFileSync(s, d);
  }
}

rmrf(OUT);
fs.mkdirSync(OUT, { recursive: true });

for (const name of fs.readdirSync(ROOT)) {
  if (name === 'docs' || name === 'node_modules' || name === '.git') continue;
  const p = path.join(ROOT, name);
  const st = fs.statSync(p);
  if (st.isFile()) {
    if (name.endsWith('.html')) copyFile(p, path.join(OUT, name));
    else if (name.endsWith('.css')) copyFile(p, path.join(OUT, name));
    else if (name.endsWith('.js') && !SKIP_JS.has(name)) copyFile(p, path.join(OUT, name));
  }
}

const assetsDir = path.join(ROOT, 'assets');
if (fs.existsSync(assetsDir)) copyDir(assetsDir, path.join(OUT, 'assets'));

fs.writeFileSync(path.join(OUT, '.nojekyll'), '');
console.log('OK: static site → docs/ (add .nojekyll, ready for GitHub Pages)');
