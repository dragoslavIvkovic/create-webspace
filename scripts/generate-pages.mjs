/**
 * Jednokratno generiše src/pages/*.astro iz korenskih *.html (bez index/404).
 * Ponovo pokreni samo ako treba da se resinhronizuje sa starim HTML snapshotom.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const outDir = path.join(root, 'src', 'pages');

function pick(re, s, group = 1) {
  const m = s.match(re);
  return m ? m[group].trim() : '';
}

function activeFromDataPage(dp) {
  if (dp === 'kontakt') return 'contact';
  if (dp === 'projekti') return 'projects';
  if (dp === 'o-nama') return 'about';
  if (dp === 'usluge') return 'services';
  if (dp === 'index' || dp === '404') return null;
  return 'services';
}

function headerClassFrom(html) {
  const line = pick(/<header[^>]*id="header"[^>]*>/i, html, 0);
  const cm = line.match(/\bclass="([^"]*)"/i);
  return cm ? cm[1].trim() : '';
}

function parseMain(html) {
  const open = html.match(/<main\b[^>]*>/i);
  if (!open || open.index === undefined) return { mainOpen: '<main>', inner: '' };
  const fullOpen = open[0];
  const m = fullOpen.match(/^<main(\s[^>]*)?>/i);
  const attrStr = m && m[1] ? m[1].trim() : '';
  const mainOpen = attrStr ? `<main ${attrStr}>` : '<main>';
  const start = open.index + fullOpen.length;
  const closeIdx = html.lastIndexOf('</main>');
  if (closeIdx <= start) return { mainOpen, inner: '' };
  return { mainOpen, inner: html.slice(start, closeIdx).trim() };
}

function parseBodyAttrs(html) {
  const b = html.match(/<body\b([^>]*)>/i);
  if (!b) return { bodyClass: '', bodyId: '', dataPage: '' };
  const raw = b[1];
  const id = pick(/\bid="([^"]*)"/i, raw);
  const cls = pick(/\bclass="([^"]*)"/i, raw);
  const dp = pick(/\bdata-page="([^"]*)"/i, raw);
  return { bodyId: id, bodyClass: cls, dataPage: dp };
}

/** U Astro fajlu, `{` u sadržaju mora biti `{` — čist HTML retko sadrži `{`; ipak escapujemo `</script>` */
function escapeRawForAstroFragment(s) {
  return s.replaceAll('</script>', '<\\/script>');
}

function buildPage(slug, html) {
  const title = pick(/<title>([^<]*)<\/title>/i, html);
  const description = pick(/<meta\s+name="description"\s+content="([^"]*)"/i, html);
  const keywords = pick(/<meta\s+name="keywords"\s+content="([^"]*)"/i, html);
  const canonical = pick(/<link\s+rel="canonical"\s+href="([^"]*)"/i, html);
  const { bodyId, bodyClass, dataPage } = parseBodyAttrs(html);
  const hClass = headerClassFrom(html);
  const active = activeFromDataPage(dataPage);
  const isHome = dataPage === 'index';
  const { mainOpen, inner } = parseMain(html);

  const activeJs = active === null ? 'null' : `'${active}'`;

  const props = [
    `title={${JSON.stringify(title)}}`,
    description ? `description={${JSON.stringify(description)}}` : null,
    keywords ? `keywords={${JSON.stringify(keywords)}}` : null,
    canonical ? `canonical={${JSON.stringify(canonical)}}` : null,
    `dataPage={${JSON.stringify(dataPage)}}`,
    bodyClass ? `bodyClass={${JSON.stringify(bodyClass)}}` : null,
    bodyId ? `bodyId={${JSON.stringify(bodyId)}}` : null,
    hClass ? `headerClass={${JSON.stringify(hClass)}}` : null,
    `activeSection={${activeJs}}`,
    `isHome={${JSON.stringify(isHome)}}`,
  ]
    .filter(Boolean)
    .join('\n  ');

  const innerEsc = escapeRawForAstroFragment(inner);

  return `---
import BaseLayout from '../layouts/BaseLayout.astro';
---

<BaseLayout
  ${props}
>
${mainOpen}
${innerEsc}
</main>
</BaseLayout>
`;
}

function main() {
  const files = fs.readdirSync(root).filter((f) => f.endsWith('.html'));
  fs.mkdirSync(outDir, { recursive: true });

  for (const f of files) {
    const slug = f.replace(/\.html$/i, '');
    if (slug === '404') continue;

    if (slug === '404') continue;

    const html = fs.readFileSync(path.join(root, f), 'utf8');
    const outName = slug === 'index' ? 'index.astro' : `${slug}.astro`;
    const body = buildPage(slug, html);
    fs.writeFileSync(path.join(outDir, outName), body, 'utf8');
    console.log('wrote', outName);
  }
}

main();
