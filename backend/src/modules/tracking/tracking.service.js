const env = require("../../config/env");
const trackingRepository = require("./tracking.repository");

async function forwardEvent(rawEvent) {
  if (!env.trackingForwardUrl || typeof fetch !== "function") return;

  try {
    await fetch(env.trackingForwardUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(rawEvent),
      keepalive: true
    });
  } catch (error) {
    console.warn(`Tracking forward failed: ${error.message}`);
  }
}

async function receiveEvent(rawEvent) {
  const tasks = [forwardEvent(rawEvent)];

  if (env.trackingDebugStore) {
    tasks.push(trackingRepository.createDebugEvent(rawEvent));
  }

  await Promise.allSettled(tasks);
}

module.exports = { receiveEvent };
