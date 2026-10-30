(function () {
'use strict';

const HALLOWEEN_CUTOFF_ISO = '2026-11-01T00:00:00-06:00';
const HALLOWEEN_CUTOFF_MS = 1793512800000;
const SESSION_KEY = 'lac_halloween_override';

function storageCall(storage, method, value) {
  try {
    return storage ? storage[method](SESSION_KEY, value) : null;
  } catch (e) {
    return null;
  }
}

function shouldActivateHalloween({ search = '', nowMs, storage } = {}) {
  const query = new URLSearchParams(search).get('halloween');
  if (query === '1' || query === '0') {
    storageCall(storage, 'setItem', query);
    return query === '1';
  }
  if (query === 'auto') storageCall(storage, 'removeItem');
  const stored = storageCall(storage, 'getItem');
  if (stored === '1' || stored === '0') return stored === '1';
  return nowMs < HALLOWEEN_CUTOFF_MS;
}

function isQuietRoute(pathname = '') {
  return /^\/(game|dev)(\/|$)/i.test(pathname);
}

const TRIGGER = /(boo|spoopy)$/;
const KEY_WINDOW_MS = 2500;
const IGNORED_TAGS = ['INPUT', 'TEXTAREA', 'SELECT', 'CANVAS'];
const IGNORED_ROLES = ['listbox', 'option', 'menu', 'menuitem', 'combobox', 'textbox', 'grid', 'slider', 'spinbutton'];

function msUntilCutoff(nowMs) {
  return Math.max(0, HALLOWEEN_CUTOFF_MS - nowMs);
}

function isIgnoredKeyTarget({
  tagName = '',
  role = '',
  isContentEditable,
  pathname = '',
  ctrlKey,
  metaKey,
  altKey,
  repeat,
  isComposing,
} = {}) {
  if (ctrlKey || metaKey || altKey || repeat || isComposing || isContentEditable) return true;
  if (IGNORED_TAGS.includes(tagName.toUpperCase())) return true;
  if (IGNORED_ROLES.includes(role)) return true;
  return isQuietRoute(pathname);
}

function appendKey({ buffer, lastMs }, key, nowMs) {
  if (!/^[a-z]$/i.test(key)) return { buffer, lastMs, matched: false };
  const start = nowMs - lastMs > KEY_WINDOW_MS ? '' : buffer;
  const next = (start + key.toLowerCase()).slice(-6);
  const matched = TRIGGER.test(next);
  return { buffer: matched ? '' : next, lastMs: nowMs, matched };
}

const MAX_DELAY_MS = 2147483647;

function createLifecycle({ now, isActive, setTimer, clearTimer, onActivate, onDeactivate }) {
  let live = false;
  let timer = null;

  function arm() {
    if (timer !== null) clearTimer(timer);
    timer = setTimer(recheck, Math.min(msUntilCutoff(now()), MAX_DELAY_MS));
  }

  function deactivate() {
    if (!live) return;
    live = false;
    if (timer !== null) clearTimer(timer);
    timer = null;
    onDeactivate();
  }

  function recheck() {
    if (!live) return;
    if (isActive(now())) {
      if (msUntilCutoff(now()) > 0) arm();
    } else {
      deactivate();
    }
  }

  function start() {
    if (live || !isActive(now())) return;
    live = true;
    onActivate();
    arm();
  }

  return { start, recheck, deactivate, isLive: () => live };
}

const BASE = new URL('./', document.currentScript ? document.currentScript.src : location.href).href;
const root = document.documentElement;

const CAST = [
  ['ghost', 'Boo!', 'Did I scare you?'],
  ['goblin', 'Yum', 'I ate all the candy corn.'],
  ['ghoul', 'Psst', 'I only bite bugs.'],
  ['zombie', 'Braaains', 'Mine are gone, but I can still play.'],
  ['vampire', 'Bleh', 'I vant your attention. Type boo anywhere.'],
];

const WEB =
  '<svg viewBox="0 0 120 120" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round">' +
  '<path d="M0 0L120 120M0 0L120 52M0 0L52 120M0 0L120 0M0 0L0 120"/>' +
  '<path d="M30 0Q26 13 30 30Q13 26 0 30"/><path d="M62 0Q54 27 62 62Q27 54 0 62"/><path d="M96 0Q84 42 96 96Q42 84 0 96"/></svg>';

const controller = new AbortController();
const timers = new Set();
const nodes = [];
let interval = null;
let modal = null;
let hideBubble = null;
let keys = { buffer: '', lastMs: 0 };
let cast = Math.floor(Math.random() * CAST.length);

function on(target, type, fn, options) {
  target.addEventListener(type, fn, Object.assign({ signal: controller.signal }, options));
}

function later(fn, ms) {
  const id = setTimeout(() => {
    timers.delete(id);
    fn();
  }, ms);
  timers.add(id);
}

function session() {
  try {
    return window.sessionStorage;
  } catch (e) {
    return null;
  }
}

function isActive(nowMs) {
  return shouldActivateHalloween({ search: location.search, nowMs, storage: session() });
}

function el(tag, props, children) {
  const node = Object.assign(document.createElement(tag), props);
  for (const child of children || []) node.append(child);
  return node;
}

function img(path, size) {
  return el('img', { src: BASE + path, alt: '', width: size, height: size, decoding: 'async' });
}

function web(side) {
  const holder = el('div', { className: 'lac-web lac-web--' + side });
  holder.innerHTML = WEB;
  if (side === 'l') holder.append(img('icons/spider.webp', 32));
  return holder;
}

function mountCritter() {
  const title = el('span', { className: 'lac-bubble-title' });
  const line = el('span');
  const cta = el('button', { type: 'button', className: 'lac-bubble-cta', textContent: 'Trick or Type' });
  const bubble = el('div', { className: 'lac-bubble', hidden: true }, [title, line, el('br'), cta]);
  bubble.setAttribute('aria-live', 'polite');
  const face = img('critters/' + CAST[cast][0] + '.webp', 96);
  const button = el('button', { type: 'button', className: 'lac-critter-btn' }, [face]);
  button.setAttribute('aria-label', 'Say hi to the Halloween critter');

  on(button, 'click', () => {
    if (!bubble.hidden) {
      cast = (cast + 1) % CAST.length;
      face.src = BASE + 'critters/' + CAST[cast][0] + '.webp';
    }
    title.textContent = CAST[cast][1];
    line.textContent = ' ' + CAST[cast][2];
    bubble.hidden = false;
    clearTimeout(hideBubble);
    hideBubble = setTimeout(() => (bubble.hidden = true), 10000);
    timers.add(hideBubble);
  });
  on(cta, 'click', () => openModal(cta));
  return el('div', { className: 'lac-critter' }, [bubble, button]);
}

function mountBanner() {
  if (location.pathname !== '/' || document.querySelector('.lac-banner')) return;
  const anchor = document.getElementById('hero-title') || document.querySelector('h1 .text-terra');
  const section = anchor && anchor.closest('section');
  if (!section) return;
  const banner = el('img', {
    className: 'lac-banner',
    alt: '',
    width: 1200,
    height: 400,
    decoding: 'async',
    srcset: BASE + 'banner-800.webp 800w, ' + BASE + 'banner-1200.webp 1200w',
    sizes: '(max-width: 800px) 100vw, 1200px',
  });
  section.after(banner);
}

function toast() {
  const node = el('div', { className: 'lac-toast', textContent: 'Boo!' }, []);
  node.prepend(img('critters/ghost.webp', 72));
  node.setAttribute('aria-hidden', 'true');
  document.body.append(node);
  later(() => node.remove(), 4100);
}

async function openModal(trigger) {
  if (!lifecycle.isLive() || !isActive(Date.now()) || isQuietRoute(location.pathname)) return;
  if (modal && modal.isOpen()) return;
  const mod = await import(BASE + 'halloween-modal.js');
  if (!lifecycle.isLive()) return;
  modal = mod.openHalloweenModal({
    trigger,
    assetBase: BASE,
    isLive: () => lifecycle.isLive() && isActive(Date.now()),
  });
}

function tick() {
  lifecycle.recheck();
  if (!lifecycle.isLive()) return;
  const quiet = isQuietRoute(location.pathname);
  if (quiet !== !root.hasAttribute('data-halloween')) {
    if (quiet) root.removeAttribute('data-halloween');
    else root.setAttribute('data-halloween', 'true');
  }
  for (const node of nodes) node.hidden = quiet;
  if (quiet && modal) modal.close();
  if (!quiet) mountBanner();
}

function onKey(event) {
  const target = event.target || {};
  const widget = target.closest ? target.closest('[role]') : null;
  const ignored = isIgnoredKeyTarget({
    tagName: target.tagName,
    role: widget ? widget.getAttribute('role') : '',
    isContentEditable: target.isContentEditable,
    pathname: location.pathname,
    ctrlKey: event.ctrlKey,
    metaKey: event.metaKey,
    altKey: event.altKey,
    repeat: event.repeat,
    isComposing: event.isComposing,
  });
  if (ignored) return;
  keys = appendKey(keys, event.key, Date.now());
  if (keys.matched) {
    const from = document.activeElement;
    toast();
    later(() => openModal(from && from !== document.body ? from : null), 1200);
  }
}

function ready() {
  if (!lifecycle.isLive()) return;
  nodes.push(web('l'), web('r'), mountCritter());
  for (const node of nodes) document.body.append(node);
  interval = setInterval(tick, 1000);
  tick();
}

function activate() {
  on(document, 'keydown', onKey);
  on(document, 'visibilitychange', () => document.visibilityState === 'visible' && lifecycle.recheck());
  on(window, 'pageshow', () => lifecycle.recheck());
  on(window, 'focus', () => lifecycle.recheck());
  on(window, 'popstate', tick);
  if (document.readyState === 'loading') on(document, 'DOMContentLoaded', ready, { once: true });
  else ready();
}

function deactivate() {
  controller.abort();
  clearInterval(interval);
  for (const id of timers) clearTimeout(id);
  timers.clear();
  if (modal) modal.close();
  for (const node of nodes) node.remove();
  for (const node of document.querySelectorAll('.lac-banner, .lac-toast, .lac-dialog')) node.remove();
  root.removeAttribute('data-halloween');
  root.removeAttribute('data-lac-host');
}

const lifecycle = createLifecycle({
  now: Date.now,
  isActive,
  setTimer: (fn, ms) => setTimeout(fn, ms),
  clearTimer: (id) => clearTimeout(id),
  onActivate: activate,
  onDeactivate: deactivate,
});

lifecycle.start();

})();
