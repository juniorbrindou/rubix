const { chromium } = require('/var/www/cerad/node_modules/playwright');
const fs = require('fs');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/ms-playwright/chromium-1255/chrome-linux64/chrome' });
  const jobs = [['icon-a-full.svg', 'icon.png', 1024], ['icon-a-fg.svg', 'android-icon-foreground.png', 1024], ['icon-a-mono.svg', 'android-icon-monochrome.png', 1024], ['icon-a-full.svg', 'favicon.png', 48]];
  for (const [src, out, size] of jobs) {
    const p = await b.newPage({ viewport: { width: size, height: size } });
    const svg = fs.readFileSync(src, 'utf8').replace('<svg ', `<svg width="${size}" height="${size}" `);
    await p.setContent(`<html><body style="margin:0;background:transparent">${svg}</body></html>`);
    await p.screenshot({ path: out, omitBackground: true });
    await p.close();
  }
  // Aperçu : icône ronde (masque Android), carrée, et monochrome sur fond de thème.
  const p = await b.newPage({ viewport: { width: 640, height: 240 }, deviceScaleFactor: 2 });
  const img = (f) => 'data:image/png;base64,' + fs.readFileSync(f).toString('base64');
  await p.setContent(`<html><body style="margin:0;background:#1d2733;display:flex;gap:28px;padding:28px;font-family:sans-serif;color:#fff;font-size:13px">
   <div style="text-align:center"><div style="width:120px;height:120px;border-radius:60px;background:#FFD500;overflow:hidden"><img src="${img('android-icon-foreground.png')}" style="width:180px;height:180px;margin:-30px"></div><p>Android (rond)</p></div>
   <div style="text-align:center"><img src="${img('icon.png')}" style="width:120px;height:120px;border-radius:26px"><p>iOS / carré</p></div>
   <div style="text-align:center"><div style="width:120px;height:120px;border-radius:60px;background:#C9D7F0;overflow:hidden"><img src="${img('android-icon-monochrome.png')}" style="width:180px;height:180px;margin:-30px;filter:brightness(0) saturate(100%) invert(18%) sepia(30%) saturate(900%) hue-rotate(190deg)"></div><p>Thème (mono)</p></div>
   <div style="text-align:center"><img src="${img('icon.png')}" style="width:48px;height:48px;border-radius:12px;margin-top:36px"><p style="margin-top:44px">Rubix Coach</p></div>
  </body></html>`);
  await p.screenshot({ path: 'apercu-icone.png' });
  await b.close();
})();
