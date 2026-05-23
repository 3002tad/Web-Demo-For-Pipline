import { createBehaviorSdk } from "./behavior-sdk.js";

// Tailscale MagicDNS hostname của Lap1 — không cần nhớ IP
// Đổi thành hostname thực tế nếu khác (xem: tailscale status)
const TRACKING_HOST = "lap1";

export const tracking = createBehaviorSdk({
  endpoint: `http://${TRACKING_HOST}:3100`,
  debug: true,
});

// Tự track page_view + scroll depth
tracking.initAutoPageView();

// Expose globally for app.js to use
window.tracking = tracking;