/**
 * Icon Generator Script for AutoPrint Extension
 * Generates PNG icons from SVG using sharp
 * 
 * Run: node scripts/generate-icons.js
 */

const fs = require('fs');
const path = require('path');

// Try to use sharp if available, otherwise just create SVGs
let sharp;
try {
  sharp = require('sharp');
} catch (e) {
  console.log('Sharp not available, generating SVG files only');
}

// SVG template for the printer icon
const generateSVG = (size) => `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#7c5cff;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#a78bff;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" rx="${Math.round(size * 0.25)}" fill="url(#grad)"/>
  <g transform="scale(${size / 24})">
    <path d="M7 10V5H17V10" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M7 16H5.5C5.1 16 4.7 15.85 4.4 15.56C4.15 15.3 4 14.9 4 14.5V11.5C4 11.1 4.15 10.7 4.4 10.4C4.7 10.15 5.1 10 5.5 10H18.5C18.9 10 19.3 10.15 19.6 10.4C19.85 10.7 20 11.1 20 11.5V14.5C20 14.9 19.85 15.3 19.6 15.56C19.3 15.85 18.9 16 18.5 16H17" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M17 13H7V19H17V13Z" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
  </g>
</svg>`;

const sizes = [16, 32, 48, 128];
const iconsDir = path.join(__dirname, '..', 'assets', 'icons');

// Create icons directory if it doesn't exist
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

async function generateIcons() {
  console.log('Generating icons...\n');
  
  for (const size of sizes) {
    const svg = generateSVG(size);
    const svgPath = path.join(iconsDir, `icon-${size}.svg`);
    const pngPath = path.join(iconsDir, `icon-${size}.png`);
    
    // Write SVG
    fs.writeFileSync(svgPath, svg);
    console.log(`✓ Generated icon-${size}.svg`);
    
    // Convert to PNG if sharp is available
    if (sharp) {
      try {
        await sharp(Buffer.from(svg))
          .resize(size, size)
          .png()
          .toFile(pngPath);
        console.log(`✓ Generated icon-${size}.png`);
      } catch (err) {
        console.log(`✗ Failed to generate icon-${size}.png: ${err.message}`);
      }
    }
  }
  
  console.log('\nIcon generation complete!');
  
  if (!sharp) {
    console.log(`
To convert SVG to PNG for Chrome extension, you can:
1. Use an online converter like https://cloudconvert.com/svg-to-png
2. Use ImageMagick: convert icon-SIZE.svg icon-SIZE.png
3. Use a design tool like Figma or Sketch
`);
  }
}

generateIcons().catch(console.error);
