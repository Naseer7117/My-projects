// Verify: (1) idle uses the video-derived animated webp and visibly blinks,
// (2) the one-shot stretch variant appears during some idle hold and returns
// to base idle afterward. Poll img currentSrc; screenshots with re-measured
// crops at key moments.
const fs = require('fs');
const BASE = 'http://localhost:9333';

async function main() {
  const OUT = process.env.OUT;
  const created = await fetch(`${BASE}/json/new?about:blank`, { method: 'PUT' }).then((r) => r.json());
  const ws = new WebSocket(created.webSocketDebuggerUrl);
  let id = 0;
  const pending = new Map();
  const send = (m, p = {}) => new Promise((res) => { const i = ++id; pending.set(i, res); ws.send(JSON.stringify({ id: i, method: m, params: p })); });
  ws.addEventListener('message', (e) => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m.result); pending.delete(m.id); } });
  await new Promise((r) => ws.addEventListener('open', r, { once: true }));
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const evalJs = async (expr) => (await send('Runtime.evaluate', { expression: expr, returnByValue: true })).result.value;
  const shootMascot = async (name) => {
    const rect = JSON.parse(await evalJs(`(() => { const c = document.querySelector('.companion'); if (!c) return null; return JSON.stringify(c.getBoundingClientRect()); })()`) || 'null');
    if (!rect) return false;
    const pad = 30;
    const clip = { x: Math.max(0, rect.x - pad), y: Math.max(0, rect.y - pad), width: rect.width + pad * 2, height: rect.height + pad * 2, scale: 4 };
    const shot = await send('Page.captureScreenshot', { format: 'png', clip });
    fs.writeFileSync(`${OUT}/${name}.png`, Buffer.from(shot.data, 'base64'));
    return true;
  };

  await send('Page.enable');
  await send('Emulation.setDeviceMetricsOverride', { width: 1920, height: 1000, deviceScaleFactor: 1, mobile: false });
  await send('Page.navigate', { url: 'http://localhost:3000/#home' });
  await wait(5000);

  const src0 = await evalJs(`document.querySelector('.companion img')?.currentSrc || 'none'`);
  console.log('idle img src:', src0.split('/').pop());

  // catch the blink: idle loop is 6.5s with the blink somewhere in it —
  // capture 6 shots ~1.1s apart across one loop
  for (let i = 0; i < 6; i++) {
    await shootMascot(`anim-idle-${i}`);
    await wait(1100);
  }

  // wait for the stretch variant (idleSub='stretch' ~1/8 chance per idle hold)
  console.log('polling for stretch variant (up to 120s)...');
  const start = Date.now();
  let caught = false;
  while (Date.now() - start < 120000) {
    const src = await evalJs(`document.querySelector('.companion img')?.currentSrc || ''`);
    if (src.includes('stretch')) {
      caught = true;
      console.log(`stretch variant appeared at +${((Date.now() - start) / 1000).toFixed(0)}s`);
      await shootMascot('anim-stretch-0');
      await wait(900);
      await shootMascot('anim-stretch-1');
      // confirm return to base idle afterwards
      const t2 = Date.now();
      while (Date.now() - t2 < 15000) {
        const s2 = await evalJs(`document.querySelector('.companion img')?.currentSrc || ''`);
        if (!s2.includes('stretch')) { console.log('returned to:', s2.split('/').pop()); break; }
        await wait(400);
      }
      break;
    }
    await wait(400);
  }
  if (!caught) console.log('stretch did not roll within 120s (1/8 odds per 3.5-7s hold — possible, rerun to retry)');

  await fetch(`${BASE}/json/close/${created.id}`);
  ws.close();
  process.exit(0);
}
main().catch((e) => { console.error(e); process.exit(1); });
