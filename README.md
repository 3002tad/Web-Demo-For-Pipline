# MarketHub Demo

MarketHub is a demo e-commerce web app used to generate browser behavior events for a tracking pipeline. The project now uses an Express API, MongoDB, and a modular service/repository backend while keeping the existing static frontend.

## Architecture

- `index.html`, `assets/css`, `assets/js`: MarketHub frontend.
- `assets/js/behavior-sdk.js`: existing tracking SDK. Its payload shape and public `window.tracking` API are preserved.
- `backend/src/app.js`: Express app, static frontend serving, API mounting.
- `backend/src/modules/*`: modular controllers, services, repositories, models.
- `backend/src/seeds`: seed scripts that read the existing `data/*.json` files.
- `data/*.json`: original demo data retained as seed source.

## Setup

```bash
npm install
copy .env.example .env
```

Default `.env` values:

```env
PORT=3000
MONGO_URI=mongodb://localhost:27017/markethub_demo
TRACKING_FORWARD_URL=http://lap1:31000/track
TRACKING_DEBUG_STORE=true
JWT_ACCESS_SECRET=change-me-access-secret
JWT_REFRESH_SECRET=change-me-refresh-secret
JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_EXPIRES=7d
AUTH_COOKIE_NAME=markethub_refresh_token
AUTH_COOKIE_SECURE=false
AUTH_COOKIE_SAMESITE=lax
```

## Run MongoDB

With Docker:

```bash
docker compose up -d mongo
```

Or run a local MongoDB instance on `mongodb://localhost:27017`.

## Seed Data

```bash
npm run seed
```

The seed script clears demo collections for products, categories, suppliers, carts, demo orders, and tracking debug events, then reloads data from `data/products.json`, `data/categories.json`, and `data/suppliers.json`.

The backend seed expands the catalog to **500 products** with a balanced mix:
- 70% long-tail
- 20% mid-tier
- 10% best-seller

Generated products are diversified by category, supplier/brand prefix, material, variant, color, price band, and use-case text to avoid duplicate-looking cards and improve analytics realism.

## Run

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

`node server.js` also starts the new Express backend.

## API Endpoints

- `GET /api/products`
- `GET /api/products/:id`
- `GET /api/categories`
- `GET /api/suppliers`
- `GET /api/cart?sessionId=...`
- `POST /api/cart/items`
- `PATCH /api/cart/items/:productId`
- `DELETE /api/cart/items/:productId?sessionId=...`
- `DELETE /api/cart?sessionId=...`
- `POST /api/orders`
- `GET /api/orders/:orderCode`
- `POST /track`
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `POST /api/auth/logout`
- `GET /api/auth/me`

API responses use:

```json
{
  "success": true,
  "data": {}
}
```

`POST /track` intentionally keeps the old local tracking response behavior: it accepts the SDK payload as-is and returns `204 No Content`.

## Tracking Contract

The tracking SDK output is not reformatted. Existing event fields remain the same, including `event_source`, `event_category`, `event_type`, `anonymous_id`, `session_id`, `user_id`, `page_url`, `timestamp`, `metadata`, and `product_id` for product events.

Existing public functions remain available through `window.tracking`, including `trackPageView`, `trackProductView`, `trackProductClick`, `trackSearch`, `trackFilterApply`, `trackScrollDepth`, `trackCustom`, and `initAutoPageView`.

Existing event names are preserved: `page_view`, `scroll_depth`, `search`, `filter_apply`, `product_click`, `product_view`, `add_to_cart`, `checkout_start`, `purchase_succeeded`, `banner_impression`, and `banner_click`.
