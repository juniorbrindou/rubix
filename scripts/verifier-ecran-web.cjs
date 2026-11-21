// Vérifie un écran sans téléphone : ouvre la version web dans Chromium headless à 375 px de large,
// fait une capture, et signale le défilement horizontal et les erreurs de la console.
//
//   npx expo export --platform web --output-dir /tmp/rubix-web
//   (cd /tmp/rubix-web && python3 -m http.server 8765 --bind 127.0.0.1 &)
//   node scripts/verifier-ecran-web.cjs http://127.0.0.1:8765/ /tmp/captures
//
// Chromium et Playwright sont déjà sur le serveur (chemins ci-dessous). Le rendu WebGL passe par SwiftShader :
// fidèle pour la géométrie et les couleurs, pas pour les performances.
const { chromium } = require('/var/www/cerad/node_modules/playwright');

const url = process.argv[2] ?? 'http://127.0.0.1:8765/';
const out = process.argv[3] ?? '.';

(async () => {
  const browser = await chromium.launch({
    executablePath: '/opt/ms-playwright/chromium-1255/chrome-linux64/chrome',
    args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
  });
  const page = await browser.newPage({ viewport: { width: 375, height: 812 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true });
  const logs = [];
  page.on('console', (m) => ['error', 'warning'].includes(m.type()) && logs.push(`${m.type()}: ${m.text()}`.slice(0, 200)));
  page.on('pageerror', (e) => logs.push(`pageerror: ${e.message}`));
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.waitForSelector('canvas', { timeout: 20000 });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `${out}/ecran.png` });
  const width = await page.evaluate(() => ({ page: document.documentElement.scrollWidth, viewport: document.documentElement.clientWidth }));
  console.log(JSON.stringify({ capture: `${out}/ecran.png`, defilementHorizontal: width.page > width.viewport, logs }, null, 1));
  await browser.close();
})();
