#!/usr/bin/env node
/**
 * Generate PWA icons from the SVG source.
 * Run: node public/icons/generate-icons.js
 * Requires: npm install sharp (or it may already be available via Next.js)
 */
const fs = require('fs');
const path = require('path');

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const svgPath = path.join(__dirname, 'icon.svg');
const svgBuffer = fs.readFileSync(svgPath);

async function generate() {
  let sharp;
  try {
    sharp = require('sharp');
  } catch {
    console.error('sharp is not installed. Run: npm install sharp');
    process.exit(1);
  }

  for (const size of sizes) {
    const outPath = path.join(__dirname, `icon-${size}x${size}.png`);
    await sharp(svgBuffer)
      .resize(size, size)
      .png()
      .toFile(outPath);
    console.log(`Generated: icon-${size}x${size}.png`);
  }
  console.log('All icons generated!');
}

generate().catch(console.error);
