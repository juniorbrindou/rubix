// Rend les SVG des fiches en PNG (assets/fiches/etape-N.png) avec le Chromium du serveur.
const { chromium } = require('/var/www/cerad/node_modules/playwright');
const fs = require('fs');
const path = require('path');
const SIZE = 420; // affiché à 140 dp : net jusqu'à une densité de 3
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/ms-playwright/chromium-1255/chrome-linux64/chrome' });
  const p = await b.newPage({ viewport: { width: SIZE, height: SIZE } });
  for (let n = 1; n <= 7; n++) {
    const svg = fs.readFileSync(path.join(__dirname, 'svg', `etape-${n}.svg`), 'utf8').replace('<svg ', `<svg width="${SIZE}" height="${SIZE}" `);
    await p.setContent(`<html><body style="margin:0;background:transparent">${svg}</body></html>`);
    await p.screenshot({ path: path.join(__dirname, '../../assets/fiches', `etape-${n}.png`), omitBackground: true });
  }
  await b.close();
})();
