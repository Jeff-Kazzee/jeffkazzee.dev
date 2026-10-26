// Regenerates public/og-default.png from src/assets/cosmic-cliffs.jpg.
// Run: node scripts/generate-og.mjs
import sharp from 'sharp';

const W = 1200;
const H = 630;

const overlay = Buffer.from(`<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="shade" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0.35" stop-color="#0b0e1a" stop-opacity="0"/>
      <stop offset="1" stop-color="#0b0e1a" stop-opacity="0.92"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#shade)"/>
  <text x="72" y="500" font-family="'Arial Narrow', 'Liberation Sans Narrow', Arial, sans-serif" font-size="84" font-weight="800" letter-spacing="2" fill="#f4f1ea">JEFF KAZZEE</text>
  <text x="72" y="556" font-family="'DejaVu Sans Mono', Consolas, monospace" font-size="26" fill="#f2c879">I build tools for working with AI.</text>
</svg>`);

await sharp('src/assets/cosmic-cliffs.jpg')
  .resize(W, H, { fit: 'cover', position: 'centre' })
  .composite([{ input: overlay }])
  .png({ compressionLevel: 9 })
  .toFile('public/og-default.png');

console.log('wrote public/og-default.png');
