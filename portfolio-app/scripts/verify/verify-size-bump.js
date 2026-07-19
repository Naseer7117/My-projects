// Verify the mascot size bump (desktop 80->96, mobile 56->64):
// 1. Desktop 1920x1000: .companion rect must be 96x96; screenshot for a visual read.
// 2. Mobile 390x844 on #home and #skills at settled-bottom scroll: companion rect
//    must be 64x64 AND must not overlap any visible text-bearing element
//    (the footer reservation guarantee, re-proven at the new size).
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
  const evalJs = async (expr, awaitPromise = false) => (await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise })).result.value;

  await send('Page.enable');

  // ---------- Desktop ----------
  await send('Emulation.setDeviceMetricsOverride', { width: 1920, height: 1000, deviceScaleFactor: 1, mobile: false });
  await send('Page.navigate', { url: 'http://localhost:3000/#home' });
  await wait(6000); // intro + settle

  const deskRect = JSON.parse(await evalJs(`(() => { const c = document.querySelector('.companion'); return c ? JSON.stringify(c.getBoundingClientRect()) : 'null'; })()`));
  console.log('desktop companion rect:', deskRect ? `${deskRect.width}x${deskRect.height} @ (${Math.round(deskRect.x)},${Math.round(deskRect.y)})` : 'MISSING');
  console.log('desktop size check:', deskRect && deskRect.width === 96 && deskRect.height === 96 ? 'PASS (96x96)' : 'FAIL');
  const cssVar = await evalJs(`getComputedStyle(document.documentElement).getPropertyValue('--companion-size').trim()`);
  console.log('desktop --companion-size:', cssVar);

  if (deskRect) {
    const pad = 40;
    const clip = { x: Math.max(0, deskRect.x - pad), y: Math.max(0, deskRect.y - pad), width: deskRect.width + pad * 2, height: deskRect.height + pad * 2, scale: 3 };
    const shot = await send('Page.captureScreenshot', { format: 'png', clip });
    fs.writeFileSync(`${OUT}/size-desktop-mascot.png`, Buffer.from(shot.data, 'base64'));
  }
  // full-page context shot
  const full = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(`${OUT}/size-desktop-full.png`, Buffer.from(full.data, 'base64'));

  // ---------- Mobile safe-zone overlap test ----------
  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
  for (const route of ['home', 'skills']) {
    await send('Page.navigate', { url: `http://localhost:3000/#${route}` });
    await wait(4500);
    // settle at absolute bottom, then poll until scroll position stops moving
    await evalJs(`window.scrollTo(0, document.documentElement.scrollHeight)`);
    let last = -1;
    for (let i = 0; i < 20; i++) {
      await wait(300);
      const y = await evalJs(`window.scrollY`);
      if (y === last) break;
      last = y;
      await evalJs(`window.scrollTo(0, document.documentElement.scrollHeight)`);
    }
    await wait(1200); // let the companion's own spring settle too

    const report = JSON.parse(await evalJs(`(() => {
      const c = document.querySelector('.companion');
      if (!c) return JSON.stringify({ missing: true });
      const cr = c.getBoundingClientRect();
      const overlaps = [];
      const els = document.querySelectorAll('p, span, a, h1, h2, h3, h4, h5, h6, li, button, small, footer *');
      const seen = new Set();
      els.forEach((el) => {
        if (c.contains(el) || el.contains(c) || seen.has(el)) return;
        seen.add(el);
        const t = (el.textContent || '').trim();
        if (!t) return;
        const r = el.getBoundingClientRect();
        if (r.width === 0 || r.height === 0) return;
        const s = getComputedStyle(el);
        if (s.visibility === 'hidden' || s.display === 'none' || parseFloat(s.opacity) === 0) return;
        const ox = Math.max(0, Math.min(cr.right, r.right) - Math.max(cr.left, r.left));
        const oy = Math.max(0, Math.min(cr.bottom, r.bottom) - Math.max(cr.top, r.top));
        if (ox > 0 && oy > 0) overlaps.push({ tag: el.tagName, text: t.slice(0, 60), overlap: ox * oy });
      });
      return JSON.stringify({ rect: { x: cr.x, y: cr.y, w: cr.width, h: cr.height }, overlapCount: overlaps.length, overlaps: overlaps.slice(0, 5) });
    })()`));

    if (report.missing) { console.log(`[${route}] companion MISSING on mobile`); continue; }
    console.log(`[${route}] mobile companion rect: ${report.rect.w}x${report.rect.h} @ (${Math.round(report.rect.x)},${Math.round(report.rect.y)})`);
    console.log(`[${route}] mobile size check:`, report.rect.w === 64 && report.rect.h === 64 ? 'PASS (64x64)' : 'FAIL');
    console.log(`[${route}] text overlaps:`, report.overlapCount === 0 ? 'NONE — PASS' : `${report.overlapCount} FOUND — FAIL`);
    if (report.overlaps.length) console.log(JSON.stringify(report.overlaps, null, 2));

    const shot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(`${OUT}/size-mobile-${route}-bottom.png`, Buffer.from(shot.data, 'base64'));
  }

  await fetch(`${BASE}/json/close/${created.id}`);
  ws.close();
  process.exit(0);
}
main().catch((e) => { console.error(e); process.exit(1); });
