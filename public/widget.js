// HeyDesk's website chat (backend D82). A business pastes one line on its own site:
//
//   <script src="https://<heydesk>/widget.js" data-agent="<public key>" async></script>
//
// This draws the chat bubble and opens the chat (/embed/<key>) in an iframe beside it.
// Everything sits in a shadow root, so the website's styles and ours never mix.
// The look comes from the chat itself: the iframe loads once the page is idle and
// sends its settings (heydesk:ready), and then the bubble appears. So the website
// isn't slowed down, and the first click opens the chat at once.
// Plain JS, no build step: Vite copies this file as it is.
(() => {
  const script = document.currentScript;
  const key = script && script.dataset.agent;
  if (!key || window.HeyDesk) return; // no key, or pasted twice

  const origin = new URL(script.src).origin;
  const today = new Date().toDateString();
  const NUDGE_AFTER_MS = 5000;

  // Storage can be blocked (a private window): then nothing is remembered.
  function stored(area, name, value) {
    try {
      if (value === undefined) return window[area].getItem(name);
      window[area].setItem(name, value);
    } catch (err) {
      return null;
    }
    return null;
  }

  // Light colours need dark words and icons (the same check as src/lib/colour.js).
  function isLight(hex) {
    const n = parseInt(hex.slice(1), 16);
    return 0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255) > 170;
  }

  const host = document.createElement('div');
  const root = host.attachShadow({ mode: 'open' });
  root.innerHTML = `
<style>
  .w { --c: #0f766e; --on: #fff; font: 14px/1.45 system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; }
  .bubble, .panel, .nudge { position: fixed; right: 20px; z-index: 2147483000; }
  .left .bubble, .left .panel, .left .nudge { right: auto; left: 20px; }

  .bubble {
    bottom: 20px; width: 60px; height: 60px; padding: 0; border: 0; border-radius: 50%;
    display: grid; place-items: center; cursor: pointer; background: var(--c); color: var(--on);
    box-shadow: 0 10px 28px rgb(0 0 0 / 0.2), 0 2px 6px rgb(0 0 0 / 0.12);
    opacity: 0; transform: scale(0.4); pointer-events: none;
    transition: transform 0.4s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.25s, box-shadow 0.2s;
  }
  .ready .bubble { opacity: 1; transform: none; pointer-events: auto; }
  .ready .bubble:hover { transform: scale(1.06); box-shadow: 0 14px 34px rgb(0 0 0 / 0.24), 0 3px 8px rgb(0 0 0 / 0.14); }
  .bubble:focus-visible { outline: 3px solid var(--c); outline-offset: 3px; }
  .bubble > * { grid-area: 1 / 1; transition: transform 0.35s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.2s; }
  .logo { width: 60px; height: 60px; border-radius: 50%; object-fit: cover; background: #fff; display: none; }
  .has-logo .logo { display: block; }
  .has-logo .talk { opacity: 0; }
  .shut { opacity: 0; transform: rotate(-90deg) scale(0.5); }
  .open .shut { opacity: 1; transform: none; }
  .open .talk, .open .logo { opacity: 0; transform: rotate(90deg) scale(0.5); }
  .dot {
    position: absolute; top: 1px; right: 1px; width: 14px; height: 14px; border-radius: 50%;
    background: #e11d48; border: 2px solid #fff; transform: scale(0); transition: transform 0.3s cubic-bezier(0.22, 1, 0.36, 1);
  }
  .unread .dot { transform: none; }

  .panel {
    bottom: 92px; width: 380px; height: min(640px, calc(100vh - 116px)); overflow: hidden;
    border-radius: 16px; background: #fff;
    box-shadow: 0 24px 64px rgb(0 0 0 / 0.2), 0 4px 14px rgb(0 0 0 / 0.08);
    opacity: 0; transform: translateY(16px) scale(0.96); transform-origin: bottom right;
    visibility: hidden; pointer-events: none;
    transition: opacity 0.2s, transform 0.4s cubic-bezier(0.22, 1, 0.36, 1), visibility 0s 0.4s;
  }
  .left .panel { transform-origin: bottom left; }
  .open .panel { opacity: 1; transform: none; visibility: visible; pointer-events: auto; transition-delay: 0s; }
  iframe { display: block; width: 100%; height: 100%; border: 0; }

  .nudge {
    bottom: 94px; max-width: 260px; padding: 12px 36px 12px 14px; cursor: pointer;
    background: #fff; color: #1c1917; border-radius: 14px 14px 4px 14px;
    box-shadow: 0 12px 32px rgb(0 0 0 / 0.16), 0 1px 3px rgb(0 0 0 / 0.08);
    opacity: 0; transform: translateY(8px); pointer-events: none;
    transition: opacity 0.25s, transform 0.4s cubic-bezier(0.22, 1, 0.36, 1);
  }
  .left .nudge { border-radius: 14px 14px 14px 4px; }
  .nudging .nudge { opacity: 1; transform: none; pointer-events: auto; }
  .x {
    position: absolute; top: 6px; right: 6px; width: 24px; height: 24px; padding: 0; border: 0;
    border-radius: 50%; background: transparent; color: #78716c; font-size: 18px; line-height: 1; cursor: pointer;
  }
  .x:hover { background: #f5f5f4; color: #1c1917; }

  /* A phone: the chat takes the whole screen, and its own close button closes it. */
  @media (max-width: 480px) {
    .panel { inset: 0; width: auto; height: 100%; border-radius: 0; }
    .left .panel { left: 0; }
    .open .bubble, .open .nudge { opacity: 0; pointer-events: none; }
  }
  @media (prefers-reduced-motion: reduce) {
    .w * { transition: none !important; }
  }
</style>
<div class="w">
  <div class="panel"><iframe title="Chat" allow="microphone; autoplay"></iframe></div>
  <div class="nudge" role="button" tabindex="0"><span class="say"></span><button class="x" type="button" aria-label="Close">&times;</button></div>
  <button class="bubble" type="button" aria-label="Open chat" aria-expanded="false">
    <svg class="talk" width="28" height="28" viewBox="0 0 256 256" fill="currentColor" aria-hidden="true"><path d="M128 24a104 104 0 0 0-91.82 152.88l-11.35 34.05a16 16 0 0 0 20.24 20.24l34.05-11.35A104 104 0 1 0 128 24Zm-44 116a12 12 0 1 1 12-12 12 12 0 0 1-12 12Zm44 0a12 12 0 1 1 12-12 12 12 0 0 1-12 12Zm44 0a12 12 0 1 1 12-12 12 12 0 0 1-12 12Z"/></svg>
    <img class="logo" alt="">
    <svg class="shut" width="24" height="24" viewBox="0 0 256 256" fill="none" stroke="currentColor" stroke-width="24" stroke-linecap="round" aria-hidden="true"><path d="M200 56 56 200M200 200 56 56"/></svg>
    <i class="dot"></i>
  </button>
</div>`;

  const $ = (selector) => root.querySelector(selector);
  const box = $('.w');
  const frame = $('iframe');
  const bubble = $('.bubble');
  const nudge = $('.nudge');
  let isOpen = false;

  function open() {
    if (!box.classList.contains('ready')) return;
    isOpen = true;
    box.classList.add('open');
    box.classList.remove('unread', 'nudging');
    bubble.setAttribute('aria-expanded', 'true');
    bubble.setAttribute('aria-label', 'Close chat');
    stored('sessionStorage', `heydesk-open:${key}`, '1'); // still open on the website's next page
    frame.contentWindow.postMessage({ type: 'heydesk:open' }, origin);
    frame.focus();
  }

  function close() {
    isOpen = false;
    box.classList.remove('open');
    bubble.setAttribute('aria-expanded', 'false');
    bubble.setAttribute('aria-label', 'Open chat');
    stored('sessionStorage', `heydesk-open:${key}`, '');
    bubble.focus();
  }

  // Once a day, a line pops out of the bubble, unless the visitor already opened the chat.
  function maybeNudge(text) {
    if (!text || stored('localStorage', `heydesk-nudge:${key}`) === today) return;
    setTimeout(() => {
      if (isOpen) return;
      $('.say').textContent = text;
      box.classList.add('nudging');
      stored('localStorage', `heydesk-nudge:${key}`, today);
    }, NUDGE_AFTER_MS);
  }

  // The chat's settings arrived: show the bubble in the business's look.
  function ready(data) {
    const widget = data.widget || {};
    if (widget.colour) {
      box.style.setProperty('--c', widget.colour);
      box.style.setProperty('--on', isLight(widget.colour) ? '#1c1917' : '#fff');
    }
    box.classList.toggle('left', widget.side === 'left');
    if (widget.logo) {
      $('.logo').src = new URL(widget.logo, origin).href;
      box.classList.add('has-logo');
    }
    if (data.name) frame.title = data.name;
    box.classList.add('ready');
    if (stored('sessionStorage', `heydesk-open:${key}`) === '1') open();
    else maybeNudge(widget.nudge);
  }

  window.addEventListener('message', (event) => {
    if (event.source !== frame.contentWindow || event.origin !== origin) return;
    const type = event.data && event.data.type;
    if (type === 'heydesk:ready') ready(event.data);
    if (type === 'heydesk:close') close();
    if (type === 'heydesk:reply' && !isOpen) box.classList.add('unread');
  });

  bubble.addEventListener('click', () => (isOpen ? close() : open()));
  nudge.addEventListener('click', open);
  nudge.addEventListener('keydown', (event) => event.key === 'Enter' && open());
  $('.x').addEventListener('click', (event) => {
    event.stopPropagation();
    box.classList.remove('nudging');
  });
  document.addEventListener('keydown', (event) => event.key === 'Escape' && isOpen && close());

  function load() {
    frame.src = `${origin}/embed/${encodeURIComponent(key)}`;
  }

  function start() {
    document.body.appendChild(host);
    if (window.requestIdleCallback) requestIdleCallback(load, { timeout: 3000 });
    else setTimeout(load, 1000);
  }

  // Wait for the page itself, then load the chat when the browser has a moment.
  if (document.readyState === 'complete') start();
  else window.addEventListener('load', start);

  // For a website's own "Chat with us" button: HeyDesk.open().
  window.HeyDesk = { open, close };
})();
