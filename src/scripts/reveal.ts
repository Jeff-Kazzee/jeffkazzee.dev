// Staggered scroll reveal: adds .in when a .reveal element enters the viewport.
// Stagger index comes from the element's --i custom property (set inline).
//
// Content must never depend on this running. The CSS gates the hidden state
// behind html.js so a no-JS reader sees everything, and the safety net below
// covers the case where the observer exists but never delivers a callback,
// which happens in embedded and headless browsers.

const revealAll = (els: NodeListOf<HTMLElement> | HTMLElement[]) =>
  els.forEach((el) => el.classList.add('in'));

function init() {
  const els = document.querySelectorAll<HTMLElement>('.reveal:not(.in)');
  if (!els.length) return;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (reducedMotion || !('IntersectionObserver' in window)) {
    revealAll(els);
    return;
  }

  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          io.unobserve(entry.target);
        }
      }
    },
    { threshold: 0.15 },
  );

  els.forEach((el) => io.observe(el));

  // Safety net: reveal anything on screen that the observer has not reported.
  // Scoped to the viewport so below-the-fold content keeps its stagger.
  window.setTimeout(() => {
    const onScreen = Array.from(els).filter((el) => {
      if (el.classList.contains('in')) return false;
      const rect = el.getBoundingClientRect();
      return rect.top < window.innerHeight && rect.bottom > 0;
    });

    revealAll(onScreen);
  }, 700);
}

init();
document.addEventListener('astro:page-load', init);
