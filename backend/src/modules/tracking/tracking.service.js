const env = require("../../config/env");
const trackingRepository = require("./tracking.repository");

async function forwardEvent(rawEvent) {
  if (!env.trackingForwardUrl || typeof fetch !== "function") return;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  try {
    const response = await fetch(env.trackingForwardUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(rawEvent),
      keepalive: true,
      signal: controller.signal
    });
    if (!response.ok) {
      console.warn(`Tracking forward failed: ${response.status} ${response.statusText}`);
    }
  } catch (error) {
    console.warn(`Tracking forward failed: ${error.message}`);
  } finally {
    clearTimeout(timeout);
  }
}

async function receiveEvent(rawEvent) {
  const tasks = [forwardEvent(rawEvent)];

  if (env.trackingDebugStore) {
    tasks.push(trackingRepository.createDebugEvent(rawEvent));
  }

  Promise.allSettled(tasks).catch((error) => {
    console.warn(`Tracking background task failed: ${error.message}`);
  });
}

module.exports = { receiveEvent };
