const ANON_KEY = "pipeline_anonymous_id";
const SESS_KEY = "pipeline_session_id";

function randomId(prefix) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
}

function storageGet(key) {
  try { return localStorage.getItem(key); } catch { return null; }
}

function storageSet(key, value) {
  try { localStorage.setItem(key, value); } catch { /* private mode */ }
}

export function createBehaviorSdk(options = {}) {
  const endpoint = (options.endpoint || "http://100.64.0.3:3100").replace(/\/$/, "");
  const debug = Boolean(options.debug);
  let userId = options.userId ?? null;

  function getAnonymousId() {
    let id = storageGet(ANON_KEY);
    if (!id) { id = randomId("anon"); storageSet(ANON_KEY, id); }
    return id;
  }

  function getSessionId() {
    let id = storageGet(SESS_KEY);
    if (!id) { id = randomId("sess"); storageSet(SESS_KEY, id); }
    return id;
  }

  function basePayload(eventType, extra = {}) {
    return {
      event_source: "browser_sdk",
      event_category: "behavior",
      event_type: eventType,
      anonymous_id: getAnonymousId(),
      session_id: getSessionId(),
      user_id: userId,
      page_url: typeof window !== "undefined" ? window.location.pathname : extra.page_url || "/",
      timestamp: new Date().toISOString(),
      metadata: {
        device: /Mobi/i.test(navigator.userAgent) ? "mobile" : "desktop",
        browser: navigator.userAgent?.split(" ").pop() || "unknown",
        ...(extra.metadata || {}),
      },
      ...extra,
    };
  }

  async function send(event) {
    if (debug) console.debug("[behavior-sdk]", event);
    try {
      const res = await fetch(`${endpoint}/track`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(event),
        keepalive: true,
      });
      if (!res.ok) throw new Error(`track failed ${res.status}`);
      return await res.json();
    } catch(err) {
      console.error(err);
    }
  }

  return {
    setUserId: (id) => { userId = id; },
    newSession: () => { storageSet(SESS_KEY, randomId("sess")); },
    trackPageView: (pageUrl) => send(basePayload("page_view", { page_url: pageUrl })),
    trackProductView: (productId, pageUrl) =>
      send(basePayload("product_view", { product_id: productId, page_url: pageUrl })),
    trackProductClick: (productId, pageUrl) =>
      send(basePayload("product_click", { product_id: productId, page_url: pageUrl })),
    trackSearch: (query) => send(basePayload("search", { metadata: { query } })),
    trackFilterApply: (filters) => send(basePayload("filter_apply", { metadata: { filters } })),
    trackScrollDepth: (percent, pageUrl) =>
      send(basePayload("scroll_depth", { page_url: pageUrl, metadata: { scroll_percent: percent } })),
    trackBannerImpression: (banner) =>
      send(basePayload("banner_impression", { metadata: { ...banner } })),
    trackBannerClick: (banner) =>
      send(basePayload("banner_click", { metadata: { ...banner } })),
    trackCustom: (eventType, fields = {}) => {
      const { metadata, ...rest } = fields;
      return send({ ...basePayload(eventType, rest), metadata: { ...basePayload(eventType).metadata, ...metadata } });
    },
    initAutoPageView() {
      if (typeof window === "undefined") return;
      this.trackPageView(window.location.pathname).catch(() => {});
      let maxScroll = 0;
      window.addEventListener("scroll", () => {
        const doc = document.documentElement;
        const MathMax = Math.max(doc.scrollHeight, 1);
        const pct = Math.round(((window.scrollY + window.innerHeight) / MathMax) * 100);
        if (pct > maxScroll && pct >= 25 && pct % 25 === 0) {
          maxScroll = pct;
          this.trackScrollDepth(pct, window.location.pathname).catch(() => {});
        }
      }, { passive: true });
    },
  };
}