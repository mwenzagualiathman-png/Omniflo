// Builds sitemap.xml automatically after every build.
// Finds every page (folder with an index.html) and lists it.
const fs = require('fs');
const path = require('path');

const SITE = 'https://omniflo.solutions';
const ROOT = path.join(__dirname, '..');
const SKIP = new Set(['admin', 'cms-auth', 'assets', 'css', 'js', 'scripts',
  'content', 'node_modules', '.github', '.git']);

const today = new Date().toISOString().slice(0, 10);
const pages = [];

function walk(dir, urlPath) {
  const indexFile = path.join(dir, 'index.html');
  if (fs.existsSync(indexFile)) {
    const html = fs.readFileSync(indexFile, 'utf8');
    if (!/<meta[^>]+name=["']robots["'][^>]+noindex/i.test(html)) {
      pages.push(urlPath);
    }
  }
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    // Also list single-file pages such as articles/my-page.html
    if (entry.isFile() && entry.name.endsWith('.html') && urlPath !== '/' &&
        !['index.html', '404.html'].includes(entry.name)) {
      const h = fs.readFileSync(path.join(dir, entry.name), 'utf8');
      if (!/<meta[^>]+name=["']robots["'][^>]+noindex/i.test(h)) {
        pages.push(urlPath + entry.name.replace(/\.html$/, ''));
      }
    }
    if (!entry.isDirectory() || SKIP.has(entry.name) || entry.name.startsWith('.')) continue;
    walk(path.join(dir, entry.name), urlPath + entry.name + '/');
  }
}

walk(ROOT, '/');
pages.sort((a, b) => a.split('/').length - b.split('/').length || a.localeCompare(b));

const priority = (p) => (p === '/' ? '1.0' : p.split('/').filter(Boolean).length === 1 ? '0.8' : '0.7');

const xml = '<?xml version="1.0" encoding="UTF-8"?>\n' +
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
  pages.map((p) => `  <url>\n    <loc>${SITE}${p}</loc>\n    <lastmod>${today}</lastmod>\n    <priority>${priority(p)}</priority>\n  </url>`).join('\n') +
  '\n</urlset>\n';

fs.writeFileSync(path.join(ROOT, 'sitemap.xml'), xml);
console.log(`sitemap.xml written with ${pages.length} pages`);
