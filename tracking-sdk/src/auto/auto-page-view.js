export function initAutoPageView(sdk, flushQueue) {
  if (typeof window === "undefined") return;

  flushQueue().catch(() => {});
  window.addEventListener("online", () => {
    flushQueue().catch(() => {});
  });

  sdk.trackPageView(window.location.pathname).catch(() => {});

  let maxScroll = 0;
  window.addEventListener("scroll", () => {
    const doc = document.documentElement;
    const MathMax = Math.max(doc.scrollHeight, 1);
    const pct = Math.round(((window.scrollY + window.innerHeight) / MathMax) * 100);
    if (pct > maxScroll && pct >= 25 && pct % 25 === 0) {
      maxScroll = pct;
      sdk.trackScrollDepth(pct, window.location.pathname).catch(() => {});
    }
  }, { passive: true });
}
