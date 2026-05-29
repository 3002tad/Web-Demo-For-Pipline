const env = require("../../config/env");
const logger = require("../../utils/logger");
const { deterministicEventId } = require("../../utils/idempotency");
const { normalizeMetadata } = require("./ecommerce-event.mapper");

const sensitiveKeys = new Set([
  "password",
  "token",
  "jwt",
  "authorization",
  "cookie",
  "set-cookie",
  "api_key",
  "apikey",
  "access_token",
  "refresh_token"
]);

function sanitize(value) {
  if (Array.isArray(value)) return value.map(sanitize);
  if (!value || typeof value !== "object") return value;

  return Object.entries(value).reduce((result, [key, item]) => {
    if (sensitiveKeys.has(String(key).toLowerCase())) {
      result[key] = "[REDACTED]";
    } else {
      result[key] = sanitize(item);
    }
    return result;
  }, {});
}

function isoOrNow(value, eventId) {
  const date = value ? new Date(value) : null;
  if (date && !Number.isNaN(date.getTime())) return date.toISOString();
  logger.warn("Invalid or missing occurred_at; using adapter time", { event_id: eventId });
  return new Date().toISOString();
}

function normalizeEvent(rawEvent) {
  const eventId = rawEvent.event_id || deterministicEventId(rawEvent);
  const metadata = normalizeMetadata(rawEvent);

  return {
    event_id: eventId,
    event_type: rawEvent.event_type,
    event_source: "rabbitmq_adapter",
    original_event_source: rawEvent.event_source || null,
    occurred_at: isoOrNow(rawEvent.occurred_at, eventId),
    anonymous_id: rawEvent.anonymous_id || null,
    session_id: rawEvent.session_id,
    user_id: rawEvent.user_id || null,
    order_id: rawEvent.order_id,
    metadata,
    raw_event: sanitize(rawEvent)
  };
}

module.exports = { normalizeEvent, sanitize };
