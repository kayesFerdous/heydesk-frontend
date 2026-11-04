// Takes the landing page's screenshots from the real app, on the example shop
// (backend.sh). node dev/landing-shots/shoot.mjs public/landing <en|bn> [only,these,shots]
// Once per language: late in a long run Home can stay on its skeleton, so it goes first.
/* global process, Buffer */
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync, rmSync } from 'node:fs';

const OUT = process.argv[2];
const LOCALES = [process.argv[3] || 'en'];
const ONLY = process.argv[4]?.split(',');
const BASE = 'http://localhost:8080';

const WIDE = { width: 1440, height: 900, scale: 2, mobile: false };
const PHONE = { width: 390, height: 844, scale: 3, mobile: true };

// click: text of the row to open. hide: CSS to add for the shot.
const SHOTS = [
  { name: 'home', path: '/home', view: WIDE },
  { name: 'home-phone', path: '/home', view: PHONE },
  { name: 'inbox', path: '/inbox', view: WIDE, click: 'Sabbir Hossain' },
  { name: 'chats', path: '/conversations', view: WIDE, click: 'Sabbir Hossain', hide: 'section[aria-live="polite"] { display: none !important; }' },
  { name: 'person', path: '/conversations', view: WIDE, click: 'Tanvir Islam', hide: 'section[aria-live="polite"] { display: none !important; }' },
  { name: 'products', path: '/menu', view: WIDE },
  { name: 'channels', path: '/channels', view: WIDE, hide: '.island > ul > li:first-child { display: none; }' },
  { name: 'inbox-phone', path: '/inbox', view: PHONE },
  { name: 'chats-phone', path: '/conversations', view: PHONE, click: 'Sabbir Hossain', hide: 'section[aria-live="polite"] { display: none !important; }' },
  { name: 'person-phone', path: '/conversations', view: PHONE, click: 'Tanvir Islam', hide: 'section[aria-live="polite"] { display: none !important; }' },
  { name: 'products-phone', path: '/menu', view: PHONE },
];

const port = 9333;
const profile = `${OUT}/.profile`;
const chrome = spawn('google-chrome-stable', [
  '--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`,
  '--no-first-run', '--no-default-browser-check', '--hide-scrollbars', 'about:blank',
], { stdio: 'ignore' });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function target() {
  for (let i = 0; i < 50; i++) {
    try {
      const list = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
      const page = list.find((t) => t.type === 'page');
      if (page) return page;
    } catch { /* not up yet */ }
    await sleep(200);
  }
  throw new Error('chrome did not start');
}

const page = await target();
const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((r) => (ws.onopen = r));
let id = 0;
const waiting = new Map();
ws.onmessage = (event) => {
  const msg = JSON.parse(event.data);
  if (msg.id && waiting.has(msg.id)) {
    const { resolve, reject } = waiting.get(msg.id);
    waiting.delete(msg.id);
    if (msg.error) reject(new Error(JSON.stringify(msg.error)));
    else resolve(msg.result);
  }
};
const send = (method, params = {}) =>
  new Promise((resolve, reject) => {
    id += 1;
    waiting.set(id, { resolve, reject });
    ws.send(JSON.stringify({ id, method, params }));
  });
const js = async (expression) => {
  const r = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
  if (r.exceptionDetails) throw new Error(JSON.stringify(r.exceptionDetails));
  return r.result.value;
};

await send('Page.enable');
await send('Runtime.enable');
await send('Emulation.setTimezoneOverride', { timezoneId: 'Asia/Dhaka' });
await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });

// The clock says 8:05 this morning, in Dhaka: the moment the owner opens HeyDesk.
const now = new Date();
const dhaka = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Dhaka' }));
const shift = new Date(dhaka).setHours(8, 5, 0, 0) - dhaka.getTime();
await send('Page.addScriptToEvaluateOnNewDocument', {
  source: `(() => { const R = Date; const d = ${shift};
    class F extends R { constructor(...a) { a.length ? super(...a) : super(R.now() + d); } static now() { return R.now() + d; } }
    window.Date = F; })();`,
});

await send('Page.navigate', { url: `${BASE}/sign-in` });
await sleep(1500);
const token = await js(`fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'demo@heydesk.test', password: 'demo password' }) }).then(async (r) => { const b = await r.json(); return b.token || b.access_token || JSON.stringify(b); })`);
if (!token || token.startsWith('{')) throw new Error(`login failed: ${token}`);

for (const locale of LOCALES) {
  mkdirSync(`${OUT}/${locale}`, { recursive: true });
  await js(`localStorage.setItem('heydesk_token', ${JSON.stringify(token)}); localStorage.setItem('heydesk_locale', ${JSON.stringify(locale)});`);
  for (const shot of SHOTS) {
    if (ONLY && !ONLY.includes(shot.name)) continue;
    const { width, height, scale, mobile } = shot.view;
    await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: scale, mobile });
    await send('Page.navigate', { url: BASE + shot.path });
    await sleep(1500);
    const settled = () => js(`!document.querySelector('.skeleton, [class*=skeleton]') && document.fonts.status === 'loaded'`);
    for (let i = 0; i < 40 && !(await settled()); i++) await sleep(250);
    if (!(await settled())) console.log('still loading:', shot.name);
    await sleep(shot.path === '/home' ? 2500 : 500);
    if (shot.click) {
      const clicked = await js(`(() => { const all = [...document.querySelectorAll('button, a, tr, li, [role=button]')];
        const hit = all.filter((e) => e.textContent.includes(${JSON.stringify(shot.click)})).sort((a, b) => a.textContent.length - b.textContent.length)[0];
        if (hit) hit.click(); return !!hit; })()`);
      if (!clicked) console.log('no row to click:', shot.name);
      await sleep(1000);
      for (let i = 0; i < 40 && !(await settled()); i++) await sleep(250);
      await sleep(700);
    }
    await js(`[...document.querySelectorAll('section')].filter((e) => e.textContent.includes('fake model') && e.textContent.length < 900).forEach((e) => e.remove())`);
    if (shot.hide) await js(`(() => { const s = document.createElement('style'); s.textContent = ${JSON.stringify(shot.hide)}; document.head.append(s); })()`);
    await sleep(300);
    const { data } = await send('Page.captureScreenshot', { format: 'webp', quality: 86 });
    writeFileSync(`${OUT}/${locale}/${shot.name}.webp`, Buffer.from(data, 'base64'));
    console.log(locale, shot.name);
  }
}

ws.close();
chrome.kill();
await sleep(400);
rmSync(profile, { recursive: true, force: true });
