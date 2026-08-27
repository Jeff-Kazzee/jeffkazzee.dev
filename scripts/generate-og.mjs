// Regenerates public/og-default.png from src/assets/earthrise.avif.
// Run: node scripts/generate-og.mjs
import sharp from 'sharp';

const W = 1200;
const H = 630;

const overlay = Buffer.from(`<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="shade" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0.45" stop-color="#000000" stop-opacity="0"/>
      <stop offset="1" stop-color="#000000" stop-opacity="0.72"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#shade)"/>
  <text x="72" y="500" font-family="Georgia, 'Times New Roman', serif" font-size="64" font-weight="600" fill="#f6f2e7">Jeff Kazzee</text>
  <text x="72" y="556" font-family="Georgia, 'Times New Roman', serif" font-style="italic" font-size="30" fill="#d8d2c2">Free guides, games, and open tools.</text>
</svg>`);

await sharp('src/assets/earthrise.avif')
  .resize(W, H, { fit: 'cover', position: 'attention' })
  .composite([{ input: overlay }])
  .png()
  .toFile('public/og-default.png');

console.log('wrote public/og-default.png');
