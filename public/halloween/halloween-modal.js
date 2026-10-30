
const SITE = 'https://little-ai-halloween-fonts.jeffkazzee.chatgpt.site/';

const FONTS = [
  ['01', 'LAC Drive In Horror', 'LACDriveInHorror-Regular.woff2', false],
  ['02', 'LAC Retro Candy', 'LACRetroCandy-Regular.woff2', false],
  ['04', 'LAC Carnival Funhouse', 'LACCarnivalFunhouse-Regular.woff2', false],
  ['06', 'LAC Psychedelic Swirl', 'LACPsychedelicSwirl-Regular.woff2', true],
  ['07', 'LAC Gothic Storybook', 'LACGothicStorybook-Regular.woff2', true],
];

let dialog = null;
let trigger = null;
let fontsRequested = false;

const api = {
  close() {
    if (dialog && dialog.open) dialog.close();
  },
  isOpen() {
    return Boolean(dialog && dialog.open && dialog.isConnected);
  },
};

function el(tag, props, children) {
  const node = Object.assign(document.createElement(tag), props);
  for (const child of children || []) node.append(child);
  return node;
}

function loadFonts(assetBase, isLive) {
  if (fontsRequested || typeof FontFace === 'undefined') return;
  fontsRequested = true;
  for (const [, family, file, viaCss] of FONTS) {
    if (viaCss || !isLive()) continue;
    const face = new FontFace(family, `url("${assetBase}fonts/${file}") format("woff2")`);
    face
      .load()
      .then((loaded) => document.fonts.add(loaded))
      .catch(() => {});
  }
}

function build() {
  const close = el('button', { type: 'button', className: 'lac-dialog-close', textContent: '×' });
  close.setAttribute('aria-label', 'Close the font tester');
  const title = el('h2', { className: 'lac-dialog-title', id: 'lac-dialog-title', textContent: 'Trick or Type' });

  const text = el('input', { type: 'text', id: 'lac-text', maxLength: 80, value: 'Stay strange after dark.' });
  const size = el('input', { type: 'range', id: 'lac-size', min: 24, max: 72, value: 40 });
  const pills = el('div', { className: 'lac-pills' });
  const list = el('ul', { className: 'lac-specimens' });

  for (const [id, family] of FONTS) {
    const sample = el('span', { textContent: text.value });
    const item = el('li', { className: 'lac-specimen' }, [sample, el('small', { textContent: `${id} ${family}` })]);
    item.style.fontFamily = `"${family}", sans-serif`;
    item.style.fontSize = size.value + 'px';
    list.append(item);

    const pill = el('button', { type: 'button', className: 'lac-pill', textContent: `${id} ${family.replace('LAC ', '')}` });
    pill.setAttribute('aria-pressed', 'true');
    pill.addEventListener('click', () => {
      const on = pill.getAttribute('aria-pressed') !== 'true';
      pill.setAttribute('aria-pressed', String(on));
      item.hidden = !on;
    });
    pills.append(pill);
  }

  text.addEventListener('input', () => {
    for (const span of list.querySelectorAll('li > span')) span.textContent = text.value || ' ';
  });
  size.addEventListener('input', () => {
    for (const item of list.children) item.style.fontSize = size.value + 'px';
  });

  const link = el('a', { className: 'lac-dialog-link', href: SITE, target: '_blank', rel: 'noopener', textContent: 'Get all 5 fonts (SIL OFL 1.1)' });

  const node = el('dialog', { className: 'lac-dialog' }, [
    el('div', { className: 'lac-dialog-head' }, [title, close]),
    el('p', { textContent: 'Type something and try all 5 Halloween fonts.' }),
    el('label', { htmlFor: 'lac-text', textContent: 'Your text' }),
    text,
    el('label', { htmlFor: 'lac-size', textContent: 'Size' }),
    size,
    pills,
    list,
    link,
  ]);
  node.setAttribute('aria-label', 'Trick or Type font tester');
  close.addEventListener('click', () => node.close());
  node.addEventListener('close', () => {
    if (trigger && trigger.isConnected) trigger.focus();
  });
  return node;
}

export function openHalloweenModal({ trigger: from, assetBase, isLive }) {
  if (!isLive() || api.isOpen()) return api;
  if (!dialog || !dialog.isConnected) {
    dialog = build();
    document.body.append(dialog);
  }
  trigger = from;
  dialog.showModal();
  loadFonts(assetBase, isLive);
  return api;
}
