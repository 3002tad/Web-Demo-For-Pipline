const TrackingDebugEvent = require("./tracking-debug.model");

async function createDebugEvent(rawEvent) {
  return TrackingDebugEvent.create({
    rawEvent,
    eventType: rawEvent.event_type,
    anonymousId: rawEvent.anonymous_id,
    sessionId: rawEvent.session_id,
    userId: rawEvent.user_id,
    productId: rawEvent.product_id,
    pageUrl: rawEvent.page_url,
    metadata: rawEvent.metadata,
    receivedAt: new Date()
  });
}

module.exports = { createDebugEvent };
