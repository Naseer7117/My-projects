// NOTE: older template — uses fixed sleeps rather than state polling; prefer
// verify-size-bump.js / verify-animated-idle.js as the current pattern.
const fs = require('fs');
const BASE = 'http://localhost:9333'; // isolated debug Chrome ONLY — never 9222 (owner's real browser)

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
  const shoot = async (name) => { const s = await send('Page.captureScreenshot', { format: 'png' }); fs.writeFileSync(`${OUT}/${name}.png`, Buffer.from(s.data, 'base64')); };

  await send('Page.enable');

  // About page at the exact width that showed the original bug (1280).
  await send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });
  await send('Page.navigate', { url: 'http://localhost:3000/#about' });
  await wait(4000);
  for (let i = 0; i < 6; i++) await wait(1500);
  await shoot('safe2-about-1280');

  // Skills page — long list of cards, another good stress test.
  await send('Page.navigate', { url: 'http://localhost:3000/#skills' });
  await wait(3000);
  for (let i = 0; i < 6; i++) await wait(1500);
  await shoot('safe2-skills-1280');

  // Mobile viewport — should hold the fixed corner pocket, never roam.
  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 3, mobile: true });
  await send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 }).catch(() => {});
  await send('Page.navigate', { url: 'http://localhost:3000/#home' });
  await wait(4000);
  const mobilePositions = [];
  for (let i = 0; i < 8; i++) {
    await wait(1500);
    mobilePositions.push(await evalJs(`document.querySelector('.companion')?.style.transform`));
  }
  console.log('mobile positions over 12s (should be constant/near-constant, one corner):', mobilePositions);
  await shoot('safe2-mobile-390');

  await fetch(`${BASE}/json/close/${created.id}`);
  ws.close();
  process.exit(0);
}
main().catch((e) => { console.error(e); process.exit(1); });
