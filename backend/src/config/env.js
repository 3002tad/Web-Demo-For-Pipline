const dotenv = require("dotenv");

dotenv.config();

function requireEnv(name) {
  const value = process.env[name];
  if (!value || !String(value).trim()) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return String(value).trim();
}

const env = {
  port: Number(requireEnv("PORT")),
  mongoUri: requireEnv("MONGO_URI"),
  nodeEnv: process.env.NODE_ENV || "development",
  clientOrigin: process.env.CLIENT_ORIGIN || "",
  trackingForwardUrl: process.env.TRACKING_FORWARD_URL || "",
  trackingDebugStore: process.env.TRACKING_DEBUG_STORE !== "false",
  jwtSecret: process.env.JWT_SECRET || process.env.JWT_ACCESS_SECRET || "",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || process.env.JWT_ACCESS_EXPIRES || "7d",
  authCookieName: process.env.AUTH_COOKIE_NAME || "markethub_token",
  cookieSecure: process.env.COOKIE_SECURE === "true" || process.env.AUTH_COOKIE_SECURE === "true",
  cookieSameSite: process.env.COOKIE_SAME_SITE || process.env.AUTH_COOKIE_SAMESITE || "lax",
  rabbitmqUrl: process.env.RABBITMQ_URL || "amqp://markethub:markethub123@localhost:5672",
  rabbitmqExchange: process.env.RABBITMQ_EXCHANGE || "ecommerce.events",
  rabbitmqExchangeType: process.env.RABBITMQ_EXCHANGE_TYPE || "topic",
  rabbitmqOrderQueue: process.env.RABBITMQ_ORDER_QUEUE || "webdemo.order-processing",
  rabbitmqOrderBindingKey: process.env.RABBITMQ_ORDER_BINDING_KEY || "order.created",
  rabbitmqDlx: process.env.RABBITMQ_DLX || "ecommerce.events.dlx",
  rabbitmqOrderDlq: process.env.RABBITMQ_ORDER_DLQ || "webdemo.order-processing.dlq",
  rabbitmqManageLocal: process.env.RABBITMQ_MANAGE_LOCAL === "true",
  rabbitmqEmbedWorker: process.env.RABBITMQ_EMBED_WORKER === "true",
  rabbitmqPublishConfirmTimeoutMs: Number(process.env.RABBITMQ_PUBLISH_CONFIRM_TIMEOUT_MS || 3000),
};

if (!env.jwtSecret) {
  throw new Error("Missing required environment variable: JWT_SECRET");
}

module.exports = env;
