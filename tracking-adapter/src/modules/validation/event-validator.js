const mapping = require("../../config/mapping.config");

function createValidationError(message, details = {}) {
  const error = new Error(message);
  error.validation = true;
  error.details = details;
  return error;
}

function isObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function validateRawEvent(rawEvent) {
  if (!isObject(rawEvent)) {
    throw createValidationError("Raw event must be an object");
  }
  if (!rawEvent.event_type || typeof rawEvent.event_type !== "string") {
    throw createValidationError("event_type is required");
  }
  if (!mapping.supportedEventTypes.has(rawEvent.event_type)) {
    throw createValidationError("Unsupported event_type", { event_type: rawEvent.event_type });
  }
  if (!rawEvent.session_id || typeof rawEvent.session_id !== "string") {
    throw createValidationError("session_id is required", { event_type: rawEvent.event_type });
  }
  if (!rawEvent.order_id || typeof rawEvent.order_id !== "string") {
    throw createValidationError("order_id is required", { event_type: rawEvent.event_type });
  }
  if (rawEvent.metadata !== undefined && !isObject(rawEvent.metadata)) {
    throw createValidationError("metadata must be an object");
  }
}

module.exports = { validateRawEvent };
