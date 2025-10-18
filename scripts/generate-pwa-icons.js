const fs = require('fs');
const path = require('path');

// Simple SVG icon generator for PWA icons
const generateIcon = (size, isMaskable = false) => {
  const padding = isMaskable ? size * 0.1 : 0;
  const iconSize = size - (padding * 2);
  
  const svg = `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" fill="${isMaskable ? '#10b981' : '#ffffff'}" rx="${isMaskable ? size * 0.2 : 0}"/>
  <g transform="translate(${padding}, ${padding})">
    <circle cx="${iconSize/2}" cy="${iconSize/2}" r="${iconSize/3}" fill="${isMaskable ? '#ffffff' : '#10b981'}" opacity="0.8"/>
    <path d="M${iconSize/2},${iconSize/4} Q${iconSize/2},${iconSize/2} ${iconSize/2},${iconSize*3/4}" stroke="${isMaskable ? '#ffffff' : '#10b981'}" stroke-width="${iconSize/20}" fill="none" stroke-linecap="round"/>
    <circle cx="${iconSize/2}" cy="${iconSize/2}" r="${iconSize/8}" fill="${isMaskable ? '#ffffff' : '#10b981'}"/>
  </g>
</svg>`;
  
  return svg;
};

// Create icons directory if it doesn't exist
const iconsDir = path.join(__dirname, '../public');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Generate icons
const icons = [
  { size: 192, maskable: false },
  { size: 192, maskable: true },
  { size: 512, maskable: false },
  { size: 512, maskable: true }
];

icons.forEach(icon => {
  const filename = `icon-${icon.size}${icon.maskable ? '-maskable' : ''}.svg`;
  const svg = generateIcon(icon.size, icon.maskable);
  fs.writeFileSync(path.join(iconsDir, filename), svg);
  console.log(`Generated ${filename}`);
});

console.log('PWA icons generated! You can convert these SVG files to PNG using an online converter or image editing software.');
