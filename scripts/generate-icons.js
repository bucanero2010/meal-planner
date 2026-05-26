const fs = require('fs');
const { execSync } = require('child_process');

function createSVG(size) {
  const cx = size / 2;
  const potW = size * 0.5;
  const potH = size * 0.32;
  const potTop = size * 0.44;
  const potLeft = cx - potW / 2;
  const lidY = potTop - size * 0.02;
  const r = size * 0.2;

  const dots = [0,1,2,3,4,5,6].map(i => {
    const dotX = potLeft + size*0.06 + i * (potW - size*0.12) / 6;
    const dotY = potTop + potH * 0.6;
    return `<circle cx="${dotX}" cy="${dotY}" r="${size*0.02}" fill="#16a34a"/>`;
  }).join('\n    ');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="${r}" fill="#16a34a"/>
  
  <!-- Steam -->
  <path d="M${cx - size*0.1} ${potTop - size*0.08} c0 ${-size*0.04} ${size*0.03} ${-size*0.06} 0 ${-size*0.1}" stroke="white" stroke-width="${size*0.022}" fill="none" stroke-linecap="round" opacity="0.6"/>
  <path d="M${cx} ${potTop - size*0.1} c0 ${-size*0.04} ${-size*0.03} ${-size*0.06} 0 ${-size*0.1}" stroke="white" stroke-width="${size*0.022}" fill="none" stroke-linecap="round" opacity="0.6"/>
  <path d="M${cx + size*0.1} ${potTop - size*0.08} c0 ${-size*0.04} ${size*0.03} ${-size*0.06} 0 ${-size*0.1}" stroke="white" stroke-width="${size*0.022}" fill="none" stroke-linecap="round" opacity="0.6"/>
  
  <!-- Lid -->
  <ellipse cx="${cx}" cy="${lidY}" rx="${potW*0.52}" ry="${size*0.035}" fill="white"/>
  <rect x="${cx - size*0.02}" y="${lidY - size*0.06}" width="${size*0.04}" height="${size*0.045}" rx="${size*0.015}" fill="white"/>
  
  <!-- Pot -->
  <path d="M${potLeft} ${potTop} L${potLeft + potW*0.05} ${potTop + potH} L${potLeft + potW*0.95} ${potTop + potH} L${potLeft + potW} ${potTop} Z" fill="white"/>
  
  <!-- Handles -->
  <rect x="${potLeft - size*0.055}" y="${potTop + potH*0.2}" width="${size*0.05}" height="${size*0.06}" rx="${size*0.02}" fill="white"/>
  <rect x="${potLeft + potW + size*0.005}" y="${potTop + potH*0.2}" width="${size*0.05}" height="${size*0.06}" rx="${size*0.02}" fill="white"/>
  
  <!-- Week dots -->
  <g opacity="0.5">
    ${dots}
  </g>
</svg>`;
}

// Write SVG
fs.writeFileSync('public/icon.svg', createSVG(512));
console.log('Created public/icon.svg');

// Convert SVG to PNG using sips (macOS)
// First write temp SVGs at target sizes
for (const size of [192, 512]) {
  const svg = createSVG(size);
  const tmpFile = `/tmp/icon-${size}.svg`;
  fs.writeFileSync(tmpFile, svg);
}

console.log('SVG files created. Converting to PNG...');

// Use rsvg-convert or sips
try {
  for (const size of [192, 512]) {
    // Try using qlmanage (macOS built-in) to convert SVG to PNG
    execSync(`qlmanage -t -s ${size} -o /tmp /tmp/icon-${size}.svg 2>/dev/null`);
    const generatedFile = `/tmp/icon-${size}.svg.png`;
    if (fs.existsSync(generatedFile)) {
      fs.copyFileSync(generatedFile, `public/icon-${size}.png`);
      console.log(`Created public/icon-${size}.png`);
    }
  }
} catch (e) {
  console.log('qlmanage failed, trying alternative...');
  // Fallback: create a simple colored PNG with node (already exists from before)
  console.log('Keep existing PNG icons or install rsvg-convert for better quality.');
}
