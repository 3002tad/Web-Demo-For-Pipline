import { EVENT_CATEGORY, EVENT_SOURCE } from "./constants.js";
import { getAnonymousId, getSessionId } from "./identity.js";

function userAgent() {
  if (typeof navigator === "undefined") return "";
  return navigator.userAgent || "";
}

export function defaultMetadata() {
  const ua = userAgent();
  return {
    device: /Mobi/i.test(ua) ? "mobile" : "desktop",
    browser: ua.split(" ").pop() || "unknown"
  };
}

export function createBasePayload(eventType, extra = {}, userId = null) {
  return {
    event_source: EVENT_SOURCE,
    event_category: EVENT_CATEGORY,
    event_type: eventType,
    anonymous_id: getAnonymousId(),
    session_id: getSessionId(),
    user_id: userId,
    page_url: typeof window !== "undefined" ? window.location.pathname : extra.page_url || "/",
    timestamp: new Date().toISOString(),
    metadata: {
      ...defaultMetadata(),
      ...(extra.metadata || {})
    },
    ...extra
  };
}
