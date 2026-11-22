// Rend les icônes d'onglet en PNG (assets/icones), affichées à 20 dp : 72 px suffisent jusqu'à une densité de 3,5.
const { chromium } = require('/var/www/cerad/node_modules/playwright');
const fs = require('fs');
const path = require('path');
const SIZE = 72;
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/ms-playwright/chromium-1255/chrome-linux64/chrome' });
  const p = await b.newPage({ viewport: { width: SIZE, height: SIZE } });
  for (const name of ['cube-couleurs', 'cube-gris']) {
    const svg = fs.readFileSync(path.join(__dirname, 'svg', `${name}.svg`), 'utf8').replace('<svg ', `<svg width="${SIZE}" height="${SIZE}" `);
    await p.setContent(`<html><body style="margin:0;background:transparent">${svg}</body></html>`);
    await p.screenshot({ path: path.join(__dirname, '../../assets/icones', `${name}.png`), omitBackground: true });
  }
  await b.close();
})();
