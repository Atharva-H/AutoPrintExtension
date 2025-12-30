/**
 * Creates simple PNG icons using pure Node.js
 * These are basic gradient icons that work for Chrome extension
 */

const fs = require('fs');
const path = require('path');

// PNG creation using pure JavaScript
// Creates a simple colored square icon

function createPNG(size) {
  // PNG Header
  const signature = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
  
  // IHDR chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(size, 0);  // width
  ihdrData.writeUInt32BE(size, 4);  // height
  ihdrData.writeUInt8(8, 8);        // bit depth
  ihdrData.writeUInt8(2, 9);        // color type (RGB)
  ihdrData.writeUInt8(0, 10);       // compression
  ihdrData.writeUInt8(0, 11);       // filter
  ihdrData.writeUInt8(0, 12);       // interlace
  
  const ihdrChunk = createChunk('IHDR', ihdrData);
  
  // IDAT chunk (image data)
  const rawData = Buffer.alloc((size * 3 + 1) * size);
  
  for (let y = 0; y < size; y++) {
    const rowStart = y * (size * 3 + 1);
    rawData[rowStart] = 0; // Filter type: None
    
    for (let x = 0; x < size; x++) {
      const pixelStart = rowStart + 1 + x * 3;
      
      // Create gradient from purple to lighter purple
      const t = (x + y) / (2 * size);
      const r = Math.round(124 + t * 43);  // 124 to 167
      const g = Math.round(92 + t * 47);   // 92 to 139
      const b = Math.round(255);            // 255
      
      rawData[pixelStart] = r;
      rawData[pixelStart + 1] = g;
      rawData[pixelStart + 2] = b;
    }
  }
  
  // Compress using deflate (zlib)
  const zlib = require('zlib');
  const compressed = zlib.deflateSync(rawData, { level: 9 });
  
  const idatChunk = createChunk('IDAT', compressed);
  
  // IEND chunk
  const iendChunk = createChunk('IEND', Buffer.alloc(0));
  
  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function createChunk(type, data) {
  const typeBuffer = Buffer.from(type);
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  
  const crcData = Buffer.concat([typeBuffer, data]);
  const crc = crc32(crcData);
  const crcBuffer = Buffer.alloc(4);
  crcBuffer.writeUInt32BE(crc, 0);
  
  return Buffer.concat([length, typeBuffer, data, crcBuffer]);
}

// CRC32 implementation
function crc32(data) {
  let crc = 0xFFFFFFFF;
  const table = makeCRCTable();
  
  for (let i = 0; i < data.length; i++) {
    crc = (crc >>> 8) ^ table[(crc ^ data[i]) & 0xFF];
  }
  
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

function makeCRCTable() {
  const table = new Array(256);
  
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[n] = c;
  }
  
  return table;
}

// Generate icons
const sizes = [16, 32, 48, 128];
const iconsDir = path.join(__dirname, '..', 'assets', 'icons');

if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

console.log('Creating PNG icons...\n');

sizes.forEach(size => {
  const png = createPNG(size);
  const filename = `icon-${size}.png`;
  fs.writeFileSync(path.join(iconsDir, filename), png);
  console.log(`✓ Created ${filename} (${png.length} bytes)`);
});

console.log('\nPNG icons created successfully!');

