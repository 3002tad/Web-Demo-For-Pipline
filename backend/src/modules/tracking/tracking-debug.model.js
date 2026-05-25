const mongoose = require("mongoose");

const trackingDebugSchema = new mongoose.Schema({
  rawEvent: { type: mongoose.Schema.Types.Mixed, required: true },
  eventType: { type: String, index: true },
  anonymousId: { type: String, index: true },
  sessionId: { type: String, index: true },
  userId: { type: String, default: null },
  productId: { type: String, default: null, index: true },
  pageUrl: { type: String, default: "" },
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  receivedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("TrackingDebugEvent", trackingDebugSchema);
