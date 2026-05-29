import { createBehaviorSdk } from "./behavior-sdk.js";

const tracking = createBehaviorSdk({
  // Send to local backend /track (sdk appends "/track" internally).
  endpoint: window.__TRACKING_ENDPOINT__ || window.location.origin,
  debug: true,
});

function readableTarget(element) {
  const target = element.closest("[data-track-banner], [data-track-name]") || element;

  return {
    tag: target.tagName ? target.tagName.toLowerCase() : null,
    id: target.id || null,
    bannerName: target.getAttribute("data-track-banner") || null,
    trackName: target.getAttribute("data-track-name") || null,
    text: (target.innerText || target.getAttribute("aria-label") || "").trim().slice(0, 120),
  };
}

function bannerPayload(element) {
  const bannerName = element.getAttribute("data-track-banner") || element.id || null;
  return {
    banner_id: element.getAttribute("data-banner-id") || bannerName,
    name: bannerName,
  };
}

function initClickTracking() {
  document.addEventListener("click", (event) => {
    const banner = event.target.closest("[data-track-banner]");
    if (!banner) return;

    const tracked = event.target.closest("[data-track-name]") || banner;
    const trackName = tracked.getAttribute("data-track-name") || "";
    const hasSemanticTracking = tracked.matches("[data-add-id], [data-buy-now-id], [data-detail-id], [data-remove-id]")
      || trackName === "checkout_start"
      || trackName === "complete_order"
      || trackName === "open_cart"
      || trackName.startsWith("add_")
      || trackName.startsWith("buy_now_")
      || trackName.startsWith("detail_add_")
      || trackName.startsWith("detail_buy_now_")
      || trackName.startsWith("view_detail_")
      || trackName.startsWith("remove_");

    if (hasSemanticTracking) return;

    tracking.trackBannerClick({
      ...bannerPayload(banner),
      target: readableTarget(event.target),
      voucherCode: banner.getAttribute("data-voucher-code") || event.target.closest("[data-voucher-code]")?.getAttribute("data-voucher-code"),
      x: event.clientX,
      y: event.clientY,
    }).catch(() => {});
  }, true);
}

function initViewTracking() {
  if (!("IntersectionObserver" in window)) return;

  const seen = new Set();
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting || entry.intersectionRatio < 0.5) return;

      const name = entry.target.getAttribute("data-track-banner") || entry.target.id;
      if (!name || seen.has(name)) return;

      seen.add(name);
      tracking.trackBannerImpression({
        ...bannerPayload(entry.target),
        id: entry.target.id || null,
        visibleRatio: Number(entry.intersectionRatio.toFixed(2)),
      }).catch(() => {});
    });
  }, { threshold: [0.5, 0.75] });

  const observe = (root = document) => {
    root.querySelectorAll("[data-track-banner]").forEach((element) => {
      const name = element.getAttribute("data-track-banner") || element.id;
      if (!seen.has(name)) observer.observe(element);
    });
  };

  observe();

  const mutationObserver = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType !== Node.ELEMENT_NODE) return;
        if (node.matches?.("[data-track-banner]")) observer.observe(node);
        observe(node);
      });
    });
  });

  mutationObserver.observe(document.body, { childList: true, subtree: true });
}

tracking.initAutoPageView();
initClickTracking();
initViewTracking();

window.tracking = tracking;
export { tracking };
