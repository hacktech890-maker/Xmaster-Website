const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, 'public');

const createSVG = (size) => {
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#dc2626"/>
      <stop offset="100%" stop-color="#991b1b"/>
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" rx="${Math.round(size * 0.15)}" fill="url(#g)"/>
  <text x="50%" y="53%" font-family="Arial, Helvetica, sans-serif" font-weight="bold" 
        font-size="${Math.round(size * 0.5)}" fill="white" text-anchor="middle" dominant-baseline="middle">X</text>
</svg>`;
};

fs.writeFileSync(path.join(publicDir, 'logo.svg'), createSVG(512));
fs.writeFileSync(path.join(publicDir, 'logo192.svg'), createSVG(192));
fs.writeFileSync(path.join(publicDir, 'logo512.svg'), createSVG(512));

const manifest = {
  "short_name": "Xmaster",
  "name": "Xmaster - Watch Videos Online",
  "icons": [
    { "src": "logo.svg", "sizes": "any", "type": "image/svg+xml" },
    { "src": "logo192.svg", "sizes": "192x192", "type": "image/svg+xml" },
    { "src": "logo512.svg", "sizes": "512x512", "type": "image/svg+xml" }
  ],
  "start_url": ".",
  "display": "standalone",
  "theme_color": "#0f0f0f",
  "background_color": "#0f0f0f"
};

fs.writeFileSync(path.join(publicDir, 'manifest.json'), JSON.stringify(manifest, null, 2));

console.log('Done! Logo files and manifest created.');