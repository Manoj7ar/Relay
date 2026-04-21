import { Resvg } from '@resvg/resvg-js';
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const svg = readFileSync(join(root, 'public/favicon.svg'), 'utf8');

const targets = [
  { size: 192, out: 'public/icons/icon-192.png', pad: 0 },
  { size: 512, out: 'public/icons/icon-512.png', pad: 0 },
  { size: 512, out: 'public/icons/icon-maskable-512.png', pad: 60 },
  { size: 180, out: 'public/icons/apple-touch-icon.png', pad: 0 },
];

for (const t of targets) {
  const resvg = new Resvg(svg, {
    fitTo: { mode: 'width', value: t.size - t.pad * 2 },
    background: '#f5f5f4',
  });
  const png = resvg.render().asPng();
  if (t.pad > 0) {
    // For maskable, re-render centred in a larger canvas with padding.
    const outer = `<?xml version="1.0"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${t.size}" height="${t.size}" viewBox="0 0 ${t.size} ${t.size}">
  <rect width="${t.size}" height="${t.size}" fill="#f5f5f4"/>
  <g transform="translate(${t.pad}, ${t.pad})">
    ${svg.replace(/<\?xml[^?]*\?>/, '').replace(/<svg[^>]*>/, '<svg xmlns="http://www.w3.org/2000/svg" width="' + (t.size - t.pad * 2) + '" height="' + (t.size - t.pad * 2) + '" viewBox="0 0 64 64">')}
  </g>
</svg>`;
    const maskable = new Resvg(outer, {
      fitTo: { mode: 'width', value: t.size },
    });
    writeFileSync(join(root, t.out), maskable.render().asPng());
  } else {
    writeFileSync(join(root, t.out), png);
  }
  console.log('wrote', t.out);
}
