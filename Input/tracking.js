(function (window, document) {
  const defaultOptions = {
    endpoint: "/track",
    appId: "tracking-demo",
    sessionKey: "tracking_demo_session_id",
    trackPageView: true,
    trackClicks: true,
    trackScroll: true,
    trackViews: true,
    viewSelector: "[data-track-view]",
    viewThreshold: 0.55,
    scrollDelay: 250,
    scrollMilestones: [25, 50, 75, 100]
  };

  let options = Object.assign({}, defaultOptions);
  let sessionId = null;
  let seenViews = new Set();
  let seenScrollMilestones = new Set();
  let maxScrollDepth = 0;
  let scrollTimer = null;
  let observer = null;
  let initialized = false;

  function getSessionId() {
    const current = window.localStorage.getItem(options.sessionKey);

    if (current) {
      return current;
    }

    const next = window.crypto && window.crypto.randomUUID
      ? window.crypto.randomUUID()
      : String(Date.now()) + "-" + Math.random().toString(16).slice(2);

    window.localStorage.setItem(options.sessionKey, next);
    return next;
  }

  function basePayload(type, data) {
    return {
      appId: options.appId,
      type,
      data: data || {},
      sessionId,
      url: window.location.href,
      path: window.location.pathname,
      title: document.title,
      timestamp: new Date().toISOString(),
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      }
    };
  }

  function send(type, data) {
    if (!sessionId) {
      sessionId = getSessionId();
    }

    const body = JSON.stringify(basePayload(type, data));

    if (navigator.sendBeacon) {
      const blob = new Blob([body], { type: "application/json" });
      navigator.sendBeacon(options.endpoint, blob);
      return;
    }

    fetch(options.endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true
    }).catch(function () {
      // Tracking must not break the host page.
    });
  }

  function readableTarget(element) {
    const trackedElement = element.closest("[data-track-name]");
    const target = trackedElement || element;

    return {
      tag: target.tagName ? target.tagName.toLowerCase() : null,
      id: target.id || null,
      text: (target.innerText || target.getAttribute("aria-label") || "").trim().slice(0, 120),
      trackName: target.getAttribute("data-track-name")
    };
  }

  function scrollDepth() {
    const doc = document.documentElement;
    const body = document.body;
    const scrollTop = window.scrollY || doc.scrollTop || body.scrollTop || 0;
    const scrollHeight = Math.max(body.scrollHeight, doc.scrollHeight, body.offsetHeight, doc.offsetHeight);
    const available = Math.max(scrollHeight - window.innerHeight, 1);

    return Math.min(100, Math.round((scrollTop / available) * 100));
  }

  function onClick(event) {
    send("click", {
      target: readableTarget(event.target),
      x: event.clientX,
      y: event.clientY
    });
  }

  function onScroll() {
    window.clearTimeout(scrollTimer);
    scrollTimer = window.setTimeout(function () {
      const depth = scrollDepth();
      const reachedMilestone = options.scrollMilestones.find(function (milestone) {
        return depth >= milestone && !seenScrollMilestones.has(milestone);
      });

      if (depth > maxScrollDepth) {
        maxScrollDepth = depth;
      }

      if (reachedMilestone) {
        seenScrollMilestones.add(reachedMilestone);
        send("scroll", {
          depth,
          milestone: reachedMilestone,
          maxDepth: maxScrollDepth
        });
      }
    }, options.scrollDelay);
  }

  function startViewObserver() {
    observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) {
          return;
        }

        const name = entry.target.getAttribute("data-track-view") || entry.target.id;

        if (seenViews.has(name)) {
          return;
        }

        seenViews.add(name);
        send("view", {
          name,
          id: entry.target.id || null,
          visibleRatio: Number(entry.intersectionRatio.toFixed(2))
        });
      });
    }, {
      threshold: options.viewThreshold
    });

    document.querySelectorAll(options.viewSelector).forEach(function (element) {
      observer.observe(element);
    });
  }

  function init(customOptions) {
    if (initialized) {
      return window.TrackingSDK;
    }

    options = Object.assign({}, defaultOptions, customOptions || {});
    sessionId = getSessionId();
    seenScrollMilestones = new Set();
    maxScrollDepth = 0;
    initialized = true;

    if (options.trackClicks) {
      document.addEventListener("click", onClick, true);
    }

    if (options.trackScroll) {
      window.addEventListener("scroll", onScroll, { passive: true });
    }

    if (options.trackViews) {
      startViewObserver();
    }

    if (options.trackPageView) {
      send("page_view", {
        referrer: document.referrer || null
      });
    }

    return window.TrackingSDK;
  }

  function stop() {
    document.removeEventListener("click", onClick, true);
    window.removeEventListener("scroll", onScroll);

    if (observer) {
      observer.disconnect();
    }

    initialized = false;
  }

  window.TrackingSDK = {
    init,
    stop,
    track: send,
    getSessionId: function () {
      return sessionId || getSessionId();
    }
  };
}(window, document));
