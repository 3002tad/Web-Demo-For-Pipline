import { queueGet, queuePush, queueSet } from "./queue.js";

export function createTransport({ endpoint, debug }) {
  let flushingQueue = false;

  async function sendNow(event) {
    const res = await fetch(`${endpoint}/track`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(event),
      keepalive: true
    });
    if (!res.ok) throw new Error(`track failed ${res.status}`);
    if (res.status === 204) return null;
    const text = await res.text();
    return text ? JSON.parse(text) : null;
  }

  async function flushQueue() {
    if (flushingQueue) return;
    if (typeof navigator !== "undefined" && !navigator.onLine) return;
    flushingQueue = true;
    try {
      const items = queueGet();
      if (!items.length) return;
      const remain = [];
      for (const event of items) {
        try {
          await sendNow(event);
        } catch {
          remain.push(event);
        }
      }
      queueSet(remain);
    } finally {
      flushingQueue = false;
    }
  }

  async function send(event) {
    if (debug) console.debug("[behavior-sdk]", event);
    try {
      const result = await sendNow(event);
      flushQueue().catch(() => {});
      return result;
    } catch (err) {
      queuePush(event);
      if (debug) {
        console.warn("tracking queued (offline or request failed):", err.message);
      }
      return null;
    }
  }

  return { send, flushQueue };
}
