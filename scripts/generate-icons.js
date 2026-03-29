/**
 * Icon Generator for Oikos PWA
 * Generates placeholder icons (accent color #007AFF with white "O")
 * Sizes: 192px and 512px, both "any" and "maskable" variants
 * Maskable icons include safe zone padding (min 10%)
 *
 * Usage: node scripts/generate-icons.js
 * Dependencies: sharp (devDependency)
 */

import sharp from 'sharp';
import { mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ICONS_DIR = join(__dirname, '..', 'public', 'icons');
const ACCENT = '#007AFF';
const BG_LIGHT = '#F5F5F7';

mkdirSync(ICONS_DIR, { recursive: true });

/**
 * Create an SVG with a centered "O" on accent background.
 * @param {number} size - Icon dimension in px
 * @param {boolean} maskable - If true, add 20% padding for safe zone
 */
function createSvg(size, maskable) {
  const fontSize = maskable ? size * 0.4 : size * 0.55;
  const bgRadius = maskable ? 0 : size * 0.18;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="${bgRadius}" fill="${ACCENT}"/>
  <text x="50%" y="52%" dominant-baseline="central" text-anchor="middle"
        font-family="system-ui, -apple-system, sans-serif" font-weight="700"
        font-size="${fontSize}" fill="white">O</text>
</svg>`;
}

/**
 * Create Apple Touch Icon (180x180) with slight rounding
 */
function createAppleTouchSvg() {
  const size = 180;
  const fontSize = size * 0.55;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="${size * 0.18}" fill="${ACCENT}"/>
  <text x="50%" y="52%" dominant-baseline="central" text-anchor="middle"
        font-family="system-ui, -apple-system, sans-serif" font-weight="700"
        font-size="${fontSize}" fill="white">O</text>
</svg>`;
}

/**
 * Create favicon (32x32)
 */
function createFaviconSvg() {
  const size = 32;
  const fontSize = size * 0.6;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="6" fill="${ACCENT}"/>
  <text x="50%" y="52%" dominant-baseline="central" text-anchor="middle"
        font-family="system-ui, -apple-system, sans-serif" font-weight="700"
        font-size="${fontSize}" fill="white">O</text>
</svg>`;
}

const icons = [
  { name: 'icon-192.png', size: 192, maskable: false },
  { name: 'icon-512.png', size: 512, maskable: false },
  { name: 'icon-maskable-192.png', size: 192, maskable: true },
  { name: 'icon-maskable-512.png', size: 512, maskable: true },
  { name: 'apple-touch-icon.png', size: 180, svg: createAppleTouchSvg() },
  { name: 'favicon-32.png', size: 32, svg: createFaviconSvg() },
];

for (const icon of icons) {
  const svg = icon.svg || createSvg(icon.size, icon.maskable);
  const outputPath = join(ICONS_DIR, icon.name);

  await sharp(Buffer.from(svg))
    .png()
    .toFile(outputPath);

  console.log(`  ✓ ${icon.name} (${icon.size}x${icon.size})`);
}

console.log('\nIcons generated in public/icons/');
