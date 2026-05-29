# MarketHub Tracking SDK

This module owns the browser behavior tracking SDK used by MarketHub. It preserves the existing payload contract and the public `window.tracking` API exposed by `assets/js/tracking.js`.

## Public API

- `trackPageView(pageUrl)`
- `trackProductView(productId, pageUrl, productMeta)`
- `trackProductClick(productId, pageUrl, productMeta)`
- `trackSearch(query)`
- `trackFilterApply(filters)`
- `trackScrollDepth(percent, pageUrl)`
- `trackBannerImpression(banner)`
- `trackBannerClick(banner)`
- `trackCustom(eventType, fields)`
- `initAutoPageView()`
- `setUserId(userId)`
- `clearUserId()`
- `newSession()`

## Contract

Payload fields are intentionally unchanged:

- `event_source`
- `event_category`
- `event_type`
- `anonymous_id`
- `session_id`
- `user_id`
- `page_url`
- `timestamp`
- `metadata`
- `product_id` for product events

The SDK keeps `anonymous_id` and `session_id` in browser storage. Login only calls `setUserId()`, and logout only calls `clearUserId()`; neither action resets anonymous/session identity.

## Browser Usage

The frontend keeps importing the compatibility wrapper:

```js
import { createBehaviorSdk } from "/assets/js/behavior-sdk.js";
```

That wrapper re-exports this module from:

```js
/tracking-sdk/src/index.js
```

The Express app serves this directory through `/tracking-sdk`.
