require("../../../load-env");

function numberFromEnv(name, fallback) {
  const value = process.env[name];
  if (value === undefined || value === "") return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function listFromEnv(name, fallback) {
  return String(process.env[name] || fallback)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  debug: process.env.DEBUG === "true",
  rabbitmqUrl: process.env.RABBITMQ_URL || "amqp://markethub:markethub123@localhost:5672",
  rabbitmqExchange: process.env.RABBITMQ_EXCHANGE || "ecommerce.events",
  rabbitmqExchangeType: process.env.RABBITMQ_EXCHANGE_TYPE || "topic",
  rabbitmqAdapterQueue: process.env.RABBITMQ_ADAPTER_QUEUE || "tracking.adapter.business-events",
  rabbitmqAdapterBindingKeys: listFromEnv("RABBITMQ_ADAPTER_BINDING_KEYS", "order.*,payment.*,inventory.*"),
  rabbitmqAdapterPrefetch: numberFromEnv("RABBITMQ_ADAPTER_PREFETCH", 10),
  rabbitmqDlx: process.env.RABBITMQ_DLX || "ecommerce.events.dlx",
  rabbitmqAdapterDlq: process.env.RABBITMQ_ADAPTER_DLQ || "tracking.adapter.business-events.dlq",
  trackingIngestUrl: process.env.TRACKING_INGEST_URL || "http://tracking-backend.tailnet-name.ts.net",
  trackingIngestPath: process.env.TRACKING_INGEST_PATH || "/api/ingest/business-events",
  trackingIngestApiKey: process.env.TRACKING_INGEST_API_KEY || "",
  trackingIngestTimeoutMs: numberFromEnv("TRACKING_INGEST_TIMEOUT_MS", 10000),
  adapterSource: process.env.ADAPTER_SOURCE || "web_demo_rabbitmq_adapter",
  tenantId: process.env.TENANT_ID || "demo_store",
  batchSize: numberFromEnv("BATCH_SIZE", 10),
  batchFlushIntervalMs: numberFromEnv("BATCH_FLUSH_INTERVAL_MS", 3000),
  maxDeliveryRetries: numberFromEnv("MAX_DELIVERY_RETRIES", 3)
};

module.exports = env;
