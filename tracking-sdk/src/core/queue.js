import { TRACKING_QUEUE_KEY } from "./constants.js";

export function queueGet() {
  try {
    const raw = localStorage.getItem(TRACKING_QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function queueSet(items) {
  try {
    localStorage.setItem(TRACKING_QUEUE_KEY, JSON.stringify(items.slice(0, 500)));
  } catch {
    // Best effort offline queue.
  }
}

export function queuePush(event) {
  const items = queueGet();
  items.push(event);
  queueSet(items);
}
