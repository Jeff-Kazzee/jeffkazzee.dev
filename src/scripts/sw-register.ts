// Registers the service worker (public/sw.js) once the page has finished
// loading and the main thread is idle, so it never competes with the first
// paint. The site works the same without it.

function registerServiceWorker() {
  navigator.serviceWorker.register('/sw.js').catch(() => {
    // A blocked or failed registration costs the reader nothing.
  });
}

if ('serviceWorker' in navigator) {
  const whenIdle = () =>
    'requestIdleCallback' in window ? window.requestIdleCallback(registerServiceWorker, { timeout: 4000 }) : setTimeout(registerServiceWorker, 2000);

  if (document.readyState === 'complete') whenIdle();
  else window.addEventListener('load', whenIdle, { once: true });
}

export {};
