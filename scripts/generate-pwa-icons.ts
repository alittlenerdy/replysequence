/**
 * PWA Icon Generator
 *
 * Generates PNG icons from SVG source for PWA manifest.
 * Run with: npx tsx scripts/generate-pwa-icons.ts
 *
 * Requires: sharp (npm install -D sharp)
 */

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

// SVG icon source - matches app/icon.svg
const iconSVG = `<svg width="512" height="512" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="512" y2="512" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#3B82F6"/>
      <stop offset="100%" stop-color="#1D4ED8"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="112" fill="url(#bg)"/>
  <!-- Reply arrow icon scaled 16x -->
  <path d="M160 208L96 272L160 336" stroke="white" stroke-width="40" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M96 272H288C341.024 272 384 314.976 384 368V384" stroke="white" stroke-width="40" stroke-linecap="round" stroke-linejoin="round"/>
  <circle cx="384" cy="160" r="48" fill="white"/>
</svg>`;

// Maskable version with safe zone padding (40% safe area)
const maskableSVG = `<svg width="512" height="512" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="512" y2="512" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#3B82F6"/>
      <stop offset="100%" stop-color="#1D4ED8"/>
    </linearGradient>
  </defs>
  <!-- Full background for maskable -->
  <rect width="512" height="512" fill="url(#bg)"/>
  <!-- Centered and smaller for safe zone -->
  <g transform="translate(102, 102) scale(0.6)">
    <path d="M160 208L96 272L160 336" stroke="white" stroke-width="40" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M96 272H288C341.024 272 384 314.976 384 368V384" stroke="white" stroke-width="40" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="384" cy="160" r="48" fill="white"/>
  </g>
</svg>`;

// Apple touch icon (needs solid background, no rounded corners)
const appleTouchSVG = `<svg width="180" height="180" viewBox="0 0 180 180" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="180" y2="180" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#3B82F6"/>
      <stop offset="100%" stop-color="#1D4ED8"/>
    </linearGradient>
  </defs>
  <rect width="180" height="180" fill="url(#bg)"/>
  <!-- Scaled icon -->
  <g transform="translate(28, 28) scale(0.24)">
    <path d="M160 208L96 272L160 336" stroke="white" stroke-width="40" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M96 272H288C341.024 272 384 314.976 384 368V384" stroke="white" stroke-width="40" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="384" cy="160" r="48" fill="white"/>
  </g>
</svg>`;

const ICONS_DIR = join(process.cwd(), 'public', 'icons');

async function generateIcons() {
  try {
    // Try to use sharp for PNG conversion
    const sharp = await import('sharp').catch(() => null);

    if (sharp) {
      // Generate 192x192 icons
      await sharp.default(Buffer.from(iconSVG))
        .resize(192, 192)
        .png()
        .toFile(join(ICONS_DIR, 'icon-192.png'));

      await sharp.default(Buffer.from(maskableSVG))
        .resize(192, 192)
        .png()
        .toFile(join(ICONS_DIR, 'icon-192-maskable.png'));

      // Generate 512x512 icons
      await sharp.default(Buffer.from(iconSVG))
        .resize(512, 512)
        .png()
        .toFile(join(ICONS_DIR, 'icon-512.png'));

      await sharp.default(Buffer.from(maskableSVG))
        .resize(512, 512)
        .png()
        .toFile(join(ICONS_DIR, 'icon-512-maskable.png'));

      // Generate Apple touch icon
      await sharp.default(Buffer.from(appleTouchSVG))
        .resize(180, 180)
        .png()
        .toFile(join(ICONS_DIR, 'apple-touch-icon.png'));

      console.log('✅ PWA icons generated successfully!');
    } else {
      // Fallback: save SVG versions
      console.log('⚠️ sharp not installed. Saving SVG versions...');
      console.log('   Run: npm install -D sharp && npx tsx scripts/generate-pwa-icons.ts');

      writeFileSync(join(ICONS_DIR, 'icon-192.svg'), iconSVG.replace(/512/g, '192').replace(/112/g, '42'));
      writeFileSync(join(ICONS_DIR, 'icon-512.svg'), iconSVG);
      writeFileSync(join(ICONS_DIR, 'icon-192-maskable.svg'), maskableSVG.replace(/512/g, '192'));
      writeFileSync(join(ICONS_DIR, 'icon-512-maskable.svg'), maskableSVG);
      writeFileSync(join(ICONS_DIR, 'apple-touch-icon.svg'), appleTouchSVG);

      console.log('📁 SVG icons saved to public/icons/');
    }
  } catch (error) {
    console.error('❌ Error generating icons:', error);
  }
}

generateIcons();
