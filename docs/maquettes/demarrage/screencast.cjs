const { chromium } = require('/var/www/cerad/node_modules/playwright');
const fs = require('fs');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/ms-playwright/chromium-1255/chrome-linux64/chrome' });
  const p = await b.newPage({ viewport: { width: 375, height: 812 }, deviceScaleFactor: 2 });
  const cdp = await p.context().newCDPSession(p);
  const frames = [];
  cdp.on('Page.screencastFrame', async (f) => {
    frames.push({ t: f.metadata.timestamp, data: f.data });
    await cdp.send('Page.screencastFrameAck', { sessionId: f.sessionId }).catch(() => {});
  });
  await p.goto('file://' + process.cwd() + '/index.html', { waitUntil: 'networkidle' });
  await p.evaluate(() => document.fonts.ready);
  await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 90, maxWidth: 750, maxHeight: 1624, everyNthFrame: 1 });
  await p.waitForFunction(() => document.title === 'fini', null, { timeout: 60000 });
  await p.waitForTimeout(400);
  await cdp.send('Page.stopScreencast');
  await b.close();
  // Fichier de concaténation ffmpeg : chaque image dure jusqu'à la suivante.
  let list = '';
  frames.forEach((f, i) => {
    const name = `frames/${String(i).padStart(5, '0')}.jpg`;
    fs.writeFileSync(name, Buffer.from(f.data, 'base64'));
    const d = i + 1 < frames.length ? frames[i + 1].t - f.t : 0.5;
    list += `file '${name}'\nduration ${Math.max(0.001, d).toFixed(3)}\n`;
  });
  list += `file 'frames/${String(frames.length - 1).padStart(5, '0')}.jpg'\n`;
  fs.writeFileSync('frames.txt', list);
  console.log(JSON.stringify({ frames: frames.length, seconds: (frames.at(-1).t - frames[0].t).toFixed(1) }));
})();
