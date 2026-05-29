# MarketHub RabbitMQ-to-Tracking Adapter

Adapter này chạy local cùng Web Demo/RabbitMQ, consume business events từ RabbitMQ rồi gửi về Tracking Backend qua HTTP API. Browser không kết nối RabbitMQ, và adapter không thay đổi `behavior-sdk.js` hay output tracking JS hiện tại.

## Kiến trúc

```text
Web Demo API / Worker
  -> RabbitMQ exchange ecommerce.events
  -> queue tracking.adapter.business-events
  -> RabbitMQ-to-Tracking Adapter
  -> POST Tracking Backend /api/ingest/business-events
```

Adapter dùng queue riêng `tracking.adapter.business-events`, không consume queue xử lý đơn `webdemo.order-processing`. Tracking backend Kubernetes cũng không cần connect trực tiếp RabbitMQ local.

## Cấu hình

Tạo file `tracking-adapter/.env` từ `.env.example` và chỉnh:

```env
RABBITMQ_URL=amqp://markethub:markethub123@localhost:5672
RABBITMQ_EXCHANGE=ecommerce.events
RABBITMQ_ADAPTER_QUEUE=tracking.adapter.business-events
RABBITMQ_ADAPTER_BINDING_KEYS=order.*,payment.*,inventory.*

TRACKING_INGEST_URL=http://tracking-backend.tailnet-name.ts.net
TRACKING_INGEST_PATH=/api/ingest/business-events
TRACKING_INGEST_API_KEY=change_me
TENANT_ID=demo_store
```

`TRACKING_INGEST_URL` có thể là Tailscale DNS/IP private của Tracking Backend. API key chỉ để trong `.env`, không đưa vào frontend.

## Chạy

Từ root repo:

```powershell
npm install
npm run adapter
```

Hoặc chạy trong thư mục adapter:

```powershell
cd tracking-adapter
npm install
npm run start
```

RabbitMQ UI local: `http://localhost:15672`

## Topology

Adapter assert các thành phần sau:

- Exchange `ecommerce.events`, type `topic`, durable.
- Queue `tracking.adapter.business-events`, durable.
- Binding keys: `order.*`, `payment.*`, `inventory.*`.
- DLX `ecommerce.events.dlx`.
- DLQ `tracking.adapter.business-events.dlq`.

Message chỉ được `ack` sau khi Tracking Backend nhận thành công hoặc báo duplicate. Lỗi validate/unauthorized/forbidden sẽ `nack` để đi DLQ. Bản hiện tại gửi single event để đảm bảo ack đúng từng RabbitMQ message; `BATCH_SIZE` và `BATCH_FLUSH_INTERVAL_MS` được giữ trong env cho bước nâng cấp batch sau.

## Event Hỗ Trợ

- `order.created`
- `inventory.reserved`
- `payment.succeeded`
- `payment.failed`
- `order.completed`
- `order.cancelled`

Payload gửi lên Tracking Backend:

```json
{
  "source": "web_demo_rabbitmq_adapter",
  "tenant_id": "demo_store",
  "events": [
    {
      "event_id": "evt_order_completed_ORDER-001",
      "event_type": "order.completed",
      "event_source": "rabbitmq_adapter",
      "original_event_source": "web_demo_worker",
      "occurred_at": "2026-05-29T10:00:00.000Z",
      "anonymous_id": "anon_xxx",
      "session_id": "sess_xxx",
      "user_id": "665f...",
      "order_id": "ORDER-001",
      "metadata": {
        "status": "completed",
        "total_amount": 450000,
        "currency": "VND",
        "payment_method": "cod",
        "item_count": 2,
        "items": [
          {
            "product_id": "P001",
            "name": "Tai nghe Bluetooth",
            "price": 350000,
            "quantity": 1,
            "amount": 350000
          }
        ]
      },
      "raw_event": {}
    }
  ]
}
```

## Test Nhanh

1. Start RabbitMQ local.
2. Start Web Demo API và worker.
3. Start adapter bằng `npm run adapter`.
4. Checkout trên frontend để Web Demo publish `order.created`.
5. Mở RabbitMQ UI, kiểm tra queue `tracking.adapter.business-events`.
6. Xem log adapter: mỗi event có `event_id`, `event_type`, `order_id`, routing key và kết quả delivery.

Adapter có retry cơ bản cho timeout, network error, `429`, `500`, `502`, `503`, `504`. Nếu Tracking Backend chưa sẵn sàng hoặc API key sai, message sẽ được retry rồi chuyển DLQ.
