# Hướng dẫn tích hợp Tracking SDK — Laptop 2

> Tài liệu này dành cho web React trên **Laptop 2** để gửi behavior event về backend trên **Laptop 1** qua tailnet.

## Thông tin kết nối

| | Giá trị |
|--|--|
| Tracking API | `http://100.64.0.3:3100` |
| Dashboard | `http://100.64.0.3:8090` |
| Mạng | Tailscale (Headscale: `https://vpn.simplething.id.vn`) |

---

## Bước 1 — Cài Tailscale trên Windows (nếu chưa)

1. Tải: https://tailscale.com/download/windows → cài đặt
2. Mở PowerShell với quyền Admin:

```powershell
tailscale up --login-server=https://vpn.simplething.id.vn --auth-key=<AUTH_KEY> --hostname=Lap2
```

3. Verify kết nối được Laptop 1:

```powershell
tailscale status
# → phải thấy Lap1 (100.64.0.3)

# Test ping
ping 100.64.0.3
```

---

## Bước 2 — Test Tracking API từ Laptop 2

Mở PowerShell, chạy:

```powershell
curl -Method POST http://100.64.0.3:3100/track `
  -ContentType "application/json" `
  -Body '{"event_type":"page_view","anonymous_id":"test_anon","session_id":"test_sess","page_url":"/"}'
```

**Kết quả mong đợi:**
```json
{"accepted": true, "event_id": "evt_..."}
```

Nếu ra `{"accepted": true, ...}` → API kết nối thành công, sang Bước 3.

---

## Bước 3 — Thêm SDK vào project web React

### 3.1. Copy file SDK

Tạo file `src/lib/behavior-sdk.js` trong project web, dán toàn bộ nội dung sau:

```javascript
const ANON_KEY = "pipeline_anonymous_id";
const SESS_KEY = "pipeline_session_id";

function randomId(prefix) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
}

function storageGet(key) {
  try { return localStorage.getItem(key); } catch { return null; }
}

function storageSet(key, value) {
  try { localStorage.setItem(key, value); } catch { /* private mode */ }
}

export function createBehaviorSdk(options = {}) {
  const endpoint = (options.endpoint || "http://100.64.0.3:3100").replace(/\/$/, "");
  const debug = Boolean(options.debug);
  let userId = options.userId ?? null;

  function getAnonymousId() {
    let id = storageGet(ANON_KEY);
    if (!id) { id = randomId("anon"); storageSet(ANON_KEY, id); }
    return id;
  }

  function getSessionId() {
    let id = storageGet(SESS_KEY);
    if (!id) { id = randomId("sess"); storageSet(SESS_KEY, id); }
    return id;
  }

  function basePayload(eventType, extra = {}) {
    return {
      event_source: "browser_sdk",
      event_category: "behavior",
      event_type: eventType,
      anonymous_id: getAnonymousId(),
      session_id: getSessionId(),
      user_id: userId,
      page_url: typeof window !== "undefined" ? window.location.pathname : extra.page_url || "/",
      timestamp: new Date().toISOString(),
      metadata: {
        device: /Mobi/i.test(navigator.userAgent) ? "mobile" : "desktop",
        browser: navigator.userAgent?.split(" ").pop() || "unknown",
        ...extra.metadata,
      },
      ...extra,
    };
  }

  async function send(event) {
    if (debug) console.debug("[behavior-sdk]", event);
    const res = await fetch(`${endpoint}/track`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(event),
      keepalive: true,
    });
    if (!res.ok) throw new Error(`track failed ${res.status}`);
    return res.json();
  }

  return {
    setUserId: (id) => { userId = id; },
    newSession: () => { storageSet(SESS_KEY, randomId("sess")); },
    trackPageView: (pageUrl) => send(basePayload("page_view", { page_url: pageUrl })),
    trackProductView: (productId, pageUrl) =>
      send(basePayload("product_view", { product_id: productId, page_url: pageUrl })),
    trackProductClick: (productId, pageUrl) =>
      send(basePayload("product_click", { product_id: productId, page_url: pageUrl })),
    trackSearch: (query) => send(basePayload("search", { metadata: { query } })),
    trackFilterApply: (filters) => send(basePayload("filter_apply", { metadata: { filters } })),
    trackScrollDepth: (percent, pageUrl) =>
      send(basePayload("scroll_depth", { page_url: pageUrl, metadata: { scroll_percent: percent } })),
    trackBannerImpression: (banner) =>
      send(basePayload("banner_impression", { metadata: { ...banner } })),
    trackBannerClick: (banner) =>
      send(basePayload("banner_click", { metadata: { ...banner } })),
    trackCustom: (eventType, fields = {}) =>
      send({ ...basePayload(eventType), ...fields }),
    initAutoPageView() {
      if (typeof window === "undefined") return;
      this.trackPageView(window.location.pathname).catch(() => {});
      let maxScroll = 0;
      window.addEventListener("scroll", () => {
        const doc = document.documentElement;
        const pct = Math.round(((window.scrollY + window.innerHeight) / Math.max(doc.scrollHeight, 1)) * 100);
        if (pct > maxScroll && pct >= 25 && pct % 25 === 0) {
          maxScroll = pct;
          this.trackScrollDepth(pct, window.location.pathname).catch(() => {});
        }
      }, { passive: true });
    },
  };
}
```

### 3.2. Tạo file `src/lib/tracking.js`

```javascript
import { createBehaviorSdk } from "./behavior-sdk.js";

export const tracking = createBehaviorSdk({
  endpoint: import.meta.env.VITE_TRACKING_API_URL || "http://100.64.0.3:3100",
  debug: import.meta.env.DEV,
});

// Tự track page_view + scroll depth
tracking.initAutoPageView();
```

### 3.3. Thêm vào `.env` của web

```env
VITE_TRACKING_API_URL=http://100.64.0.3:3100
```

---

## Bước 4 — Gắn tracking vào các trang

### Import ở đầu mỗi file cần track

```javascript
import { tracking } from "../lib/tracking";
```

### Các sự kiện phổ biến

**Xem sản phẩm** (trong `useEffect`):
```javascript
useEffect(() => {
  tracking.trackProductView(productId, location.pathname).catch(() => {});
}, [productId]);
```

**Click vào sản phẩm:**
```javascript
<div onClick={() => tracking.trackProductClick(product.id, `/products/${product.id}`).catch(() => {})}>
```

**Tìm kiếm:**
```javascript
tracking.trackSearch(searchQuery).catch(() => {});
```

**Thêm vào giỏ:**
```javascript
tracking.trackCustom("add_to_cart", {
  event_category: "behavior",
  product_id: product.id,
  metadata: { price: product.price, qty: 1 },
}).catch(() => {});
```

**Bắt đầu checkout:**
```javascript
tracking.trackCustom("checkout_start", {
  event_category: "behavior",
  metadata: { item_count: cart.length, total: cartTotal },
}).catch(() => {});
```

**Mua hàng thành công:**
```javascript
tracking.setUserId(userEmail); // nếu đã login
tracking.trackCustom("purchase_succeeded", {
  event_category: "behavior",
  metadata: { order_id: orderId, amount: total },
}).catch(() => {});
```

**Banner impression** (khi banner hiện trong màn hình):
```javascript
useEffect(() => {
  tracking.trackBannerImpression({
    banner_id: "B001",
    banner_name: "Summer Sale",
    position: "homepage_top",
    campaign_id: "CMP_SUMMER",
  }).catch(() => {});
}, []);
```

---

## Bước 5 — Verify data lên dashboard

Mở browser trên Laptop 2: **http://100.64.0.3:8090**

Sau khi thao tác trên web:
- Trang **Events** → thấy event mới nhất (refresh 5s)
- Trang **Overview** → KPI tổng hợp
- Trang **Funnel** → funnel page_view → purchase

---

## Troubleshoot

| Lỗi | Nguyên nhân | Cách sửa |
|-----|-------------|----------|
| `CORS error` trong DevTools | Origin web chưa có trong CORS_ORIGIN | Nhắn bạn kia thêm `http://100.64.0.2:<port>` vào `infra/.env` rồi restart |
| `Failed to fetch` / `ERR_CONNECTION_REFUSED` | Tailscale chưa connect hoặc tracking-api chưa chạy | Kiểm tra `tailscale status`, `ping 100.64.0.3` |
| Response `400 validation_failed` | Thiếu `anonymous_id` hoặc `session_id` | SDK tự sinh — không cần truyền tay |
| Event không lên Dashboard | Streaming processor chưa flush | Chờ tối đa 30s sau khi gửi event |

---

> Nếu gặp lỗi, chụp màn hình **DevTools → Network → request `/track`** (tab Headers + Response) gửi lại để debug.
