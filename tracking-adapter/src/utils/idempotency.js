const crypto = require("crypto");

function deterministicEventId(rawEvent) {
  const input = [
    rawEvent.event_type || "unknown",
    rawEvent.order_id || "no_order",
    rawEvent.occurred_at || "no_time"
  ].join("|");
  return `evt_${crypto.createHash("sha256").update(input).digest("hex").slice(0, 24)}`;
}

module.exports = { deterministicEventId };
