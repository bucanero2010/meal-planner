const fs = require('fs');
const { execSync } = require('child_process');

function createSVG(size) {
  const cx = size / 2;
  // Make the pot much bigger — fill ~80% of the canvas for maskable icons
  const potW = size * 0.62;
  const potH = size * 0.38;
  const potTop = size * 0.42;
  const potLeft = cx - potW / 2;
  const lidY = potTop - size * 0.015;

  const dots = [0,1,2,3,4,5,6].map(i => {
    const dotX = potLeft + size*0.07 + i * (potW - size*0.14) / 6;
    const dotY = potTop + potH * 0.6;
    return `<circle cx="${dotX}" cy="${dotY}" r="${size*0.022}" fill="#16a34a"/>`;
  }).join('\n    ');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <!-- Full bleed green background (no rounded corners — Android masks it) -->
  <rect width="${size}" height="${size}" fill="#16a34a"/>
  
  <!-- Steam -->
  <path d="M${cx - size*0.12} ${potTop - size*0.08} c0 ${-size*0.05} ${size*0.04} ${-size*0.07} 0 ${-size*0.11}" stroke="white" stroke-width="${size*0.026}" fill="none" stroke-linecap="round" opacity="0.65"/>
  <path d="M${cx} ${potTop - size*0.1} c0 ${-size*0.05} ${-size*0.04} ${-size*0.07} 0 ${-size*0.11}" stroke="white" stroke-width="${size*0.026}" fill="none" stroke-linecap="round" opacity="0.65"/>
  <path d="M${cx + size*0.12} ${potTop - size*0.08} c0 ${-size*0.05} ${size*0.04} ${-size*0.07} 0 ${-size*0.11}" stroke="white" stroke-width="${size*0.026}" fill="none" stroke-linecap="round" opacity="0.65"/>
  
  <!-- Lid -->
  <ellipse cx="${cx}" cy="${lidY}" rx="${potW*0.5}" ry="${size*0.038}" fill="white"/>
  <rect x="${cx - size*0.022}" y="${lidY - size*0.065}" width="${size*0.044}" height="${size*0.05}" rx="${size*0.018}" fill="white"/>
  
  <!-- Pot body -->
  <path d="M${potLeft} ${potTop} L${potLeft + potW*0.04} ${potTop + potH} L${potLeft + potW*0.96} ${potTop + potH} L${potLeft + potW} ${potTop} Z" fill="white"/>
  
  <!-- Handles -->
  <rect x="${potLeft - size*0.06}" y="${potTop + potH*0.15}" width="${size*0.055}" height="${size*0.07}" rx="${size*0.022}" fill="white"/>
  <rect x="${potLeft + potW + size*0.005}" y="${potTop + potH*0.15}" width="${size*0.055}" height="${size*0.07}" rx="${size*0.022}" fill="white"/>
  
  <!-- Week dots -->
  <g opacity="0.5">
    ${dots}
  </g>
</svg>`;
}

// Write SVG
fs.writeFileSync('public/icon.svg', createSVG(512));
console.log('Created public/icon.svg');

// Convert to PNG
for (const size of [192, 512]) {
  const svg = createSVG(size);
  const tmpFile = `/tmp/icon-${size}.svg`;
  fs.writeFileSync(tmpFile, svg);
}

try {
  for (const size of [192, 512]) {
    execSync(`qlmanage -t -s ${size} -o /tmp /tmp/icon-${size}.svg 2>/dev/null`);
    const generatedFile = `/tmp/icon-${size}.svg.png`;
    if (fs.existsSync(generatedFile)) {
      fs.copyFileSync(generatedFile, `public/icon-${size}.png`);
      console.log(`Created public/icon-${size}.png`);
    }
  }
} catch (e) {
  console.log('PNG conversion failed:', e.message);
}
