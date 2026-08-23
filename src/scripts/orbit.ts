function initOrbit() {
  const stage = document.querySelector<HTMLElement>('[data-orbit-stage]');
  if (!stage || stage.dataset.orbitBound === 'true') return;

  stage.dataset.orbitBound = 'true';

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const update = (event: PointerEvent) => {
    const rect = stage.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;
    stage.style.setProperty('--orbit-x', `${(x * 9).toFixed(2)}px`);
    stage.style.setProperty('--orbit-y', `${(y * 7).toFixed(2)}px`);
  };

  const reset = () => {
    stage.style.setProperty('--orbit-x', '0px');
    stage.style.setProperty('--orbit-y', '0px');
  };

  stage.addEventListener('pointermove', update, { passive: true });
  stage.addEventListener('pointerleave', reset);
}

initOrbit();
document.addEventListener('astro:page-load', initOrbit);
