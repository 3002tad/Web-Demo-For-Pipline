import { createBehaviorSdk } from "./behavior-sdk.js";

export const tracking = createBehaviorSdk({
  endpoint: "http://100.64.0.3:3100", // Hardcoded per guide for vanilla JS
  debug: true,
});

// Tự track page_view + scroll depth
tracking.initAutoPageView();

// Expose globally for app.js to use
window.tracking = tracking;