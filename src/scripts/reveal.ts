// Staggered scroll reveal: adds .in when a .reveal element enters the viewport.
// Stagger index comes from the element's --i custom property (set inline).
function init() {
  const els = document.querySelectorAll<HTMLElement>('.reveal:not(.in)');
  if (!els.length) return;

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    els.forEach((el) => el.classList.add('in'));
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
}

init();
document.addEventListener('astro:page-load', init);
