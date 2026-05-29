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
NODE_ENV=development
CLIENT_ORIGIN=http://localhost:3000
MONGO_URI=mongodb://localhost:27017/markethub_demo
TRACKING_FORWARD_URL=http://lap1.bigdata.ts.net:31000/track
TRACKING_DEBUG_STORE=true
JWT_SECRET=change-me-demo-secret
JWT_EXPIRES_IN=7d
AUTH_COOKIE_NAME=markethub_token
COOKIE_SECURE=false
COOKIE_SAME_SITE=lax
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
It also upserts demo users in the MongoDB `users` collection, so running it again does not duplicate emails.

To seed only auth users:

```bash
npm run seed:users
```

Demo accounts:

- `demo1@example.com` / `123456`
- `demo2@example.com` / `123456`
- `admin@example.com` / `123456`

## Clean MongoDB

The clean script requires an explicit confirmation environment variable before deleting data.

```powershell
$env:CLEAN_MONGODB_CONFIRM="yes"; .\scripts\clean-mongodb.bat
```

Default scope is `runtime`, which deletes carts, demo orders, and tracking debug events.

Other scopes:

```powershell
$env:CLEAN_MONGODB_CONFIRM="yes"; $env:CLEAN_MONGODB_SCOPE="demo"; .\scripts\clean-mongodb.bat
$env:CLEAN_MONGODB_CONFIRM="yes"; $env:CLEAN_MONGODB_SCOPE="all"; .\scripts\clean-mongodb.bat
```

`demo` deletes product/category/supplier/user data plus runtime data. `all` drops the whole database from `MONGO_URI`.

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
- `GET /api/me/purchased-products`
- `POST /track`
- `POST /api/auth/register`
- `POST /api/auth/login`
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

Anonymous visitors are tracked only in the browser through `anonymous_id` and `session_id`; no anonymous user document is created in MongoDB. After login, `/api/auth/login` verifies the MongoDB user and sets JWT cookies with `HttpOnly`. The frontend stores only the public user object, calls `window.tracking.setUserId(user.id)`, and events emitted after login include `user_id`.

Logout calls `/api/auth/logout`, clears only the auth cookie/frontend user state, and calls `window.tracking.clearUserId()`. It does not reset the tracking `anonymous_id`, `session_id`, or local tracking storage. The SDK public API and payload output remain unchanged; only the optional helper `clearUserId()` was added next to the existing `setUserId()`.

## Auth Model

Auth uses a single JWT stored in an HttpOnly cookie named by `AUTH_COOKIE_NAME`. The frontend uses `credentials: "include"` for auth requests and never stores the JWT in `localStorage`.

Guest users can browse, search, filter, view products, and add to cart using the tracking/browser session id. Checkout keeps the guest cart behavior, and when a valid auth cookie is present the backend attaches `userId` to the created demo order. The purchased-products API requires login and queries orders by JWT user id, not by tracking `session_id`.

## RabbitMQ Integration

RabbitMQ is used only by the backend and worker for server-side business events. The browser never connects to RabbitMQ, and the tracking SDK output is unchanged.

Topology:

- Exchange: `ecommerce.events`
- Type: `topic`
- Durable: `true`
- Web demo queue: `webdemo.order-processing`
- Web demo binding: `order.created`
- Tracking backend should create its own queue, for example `tracking.business-events`, and bind `order.*`, `payment.*`, and `inventory.*`. It must not consume `webdemo.order-processing`.

Run RabbitMQ locally on Windows:

1. Install Erlang/OTP and RabbitMQ Server for Windows.
2. Add RabbitMQ `sbin` to `PATH`, for example:

```text
C:\Program Files\RabbitMQ Server\rabbitmq_server-<version>\sbin
```

3. Setup the local user and management plugin:

```powershell
.\scripts\setup-rabbitmq-local.bat
```

Check local RabbitMQ status:

```powershell
.\scripts\check-rabbitmq-local.bat
```

RabbitMQ UI:

```text
http://localhost:15672
```

Local credentials:

```text
markethub / markethub123
```

If RabbitMQ was installed as a Windows service and `rabbitmqctl` cannot authenticate because of an Erlang cookie mismatch, the local default account can still be used from localhost:

```env
RABBITMQ_URL=amqp://guest:guest@localhost:5672
```

This is suitable for local development only.

Run API and worker in separate terminals:

```bash
npm run dev
npm run worker
```

Checkout flow:

1. Frontend calls `POST /api/orders` with `sessionId` and `anonymousId`.
2. API validates cart/product data, creates a `pending` order, and publishes `order.created`.
3. Worker consumes `order.created` from `webdemo.order-processing`.
4. Worker updates order status and publishes `inventory.reserved`, `payment.succeeded`, and `order.completed`.
5. Frontend polls `GET /api/orders/:orderCode` to show processing status.

Business event schema:

```json
{
  "event_id": "evt_...",
  "event_type": "order.created",
  "event_source": "web_demo_api",
  "occurred_at": "2026-05-29T00:00:00.000Z",
  "anonymous_id": "anon_xxx",
  "session_id": "sess_xxx",
  "user_id": null,
  "order_id": "ORDER-...",
  "metadata": {}
}
```

Events published by the web demo:

- `order.created`
- `inventory.reserved`
- `payment.succeeded`
- `order.completed`

RabbitMQ messages include `anonymous_id`, `session_id`, `user_id` when logged in, `order_id`, and `metadata.items[].product_id` where relevant. Messages do not include passwords, JWTs, cookies, or real payment details.
