const env = require("./config/env");
const logger = require("./utils/logger");
const sleep = require("./utils/sleep");
const { startConsumer } = require("./infrastructure/rabbitmq/consumer");
const { closeRabbitMQ } = require("./infrastructure/rabbitmq/connection");
const { validateRawEvent } = require("./modules/validation/event-validator");
const { normalizeEvent } = require("./modules/normalizer/event-normalizer");
const { deliverEvent } = require("./modules/delivery/delivery.service");
const { ingestUrl } = require("./infrastructure/http/tracking-api.client");

let consumerHandle = null;
let shuttingDown = false;
let inFlight = 0;

function ingestHost() {
  try {
    return new URL(env.trackingIngestUrl).host;
  } catch {
    return env.trackingIngestUrl;
  }
}

function parseMessage(message) {
  try {
    return JSON.parse(message.content.toString("utf8"));
  } catch (error) {
    error.validation = true;
    error.message = `Invalid JSON message: ${error.message}`;
    throw error;
  }
}

async function handleMessage(message, routingKey) {
  inFlight += 1;
  try {
    const rawEvent = parseMessage(message);
    logger.info("Business event received", {
      event_id: rawEvent.event_id || null,
      event_type: rawEvent.event_type || null,
      order_id: rawEvent.order_id || null,
      routing_key: routingKey
    });

    validateRawEvent(rawEvent);
    const normalizedEvent = normalizeEvent(rawEvent);
    logger.debug("Normalized business event", {
      event_id: normalizedEvent.event_id,
      event_type: normalizedEvent.event_type,
      order_id: normalizedEvent.order_id
    });

    await deliverEvent(normalizedEvent);
  } finally {
    inFlight -= 1;
  }
}

async function start() {
  logger.info("Starting RabbitMQ-to-Tracking adapter", {
    exchange: env.rabbitmqExchange,
    queue: env.rabbitmqAdapterQueue,
    bindings: env.rabbitmqAdapterBindingKeys,
    tracking_ingest_host: ingestHost(),
    tracking_ingest_path: env.trackingIngestPath,
    tracking_ingest_url: ingestUrl()
  });

  if (!env.trackingIngestApiKey || env.trackingIngestApiKey === "change_me") {
    logger.warn("TRACKING_INGEST_API_KEY is empty or still uses the placeholder value");
  }

  consumerHandle = await startConsumer(handleMessage);
}

async function shutdown(signal) {
  if (shuttingDown) return;
  shuttingDown = true;
  logger.info("Shutting down adapter", { signal, in_flight: inFlight });

  try {
    if (consumerHandle) {
      await consumerHandle.stop();
      consumerHandle = null;
    }

    const deadline = Date.now() + 10000;
    while (inFlight > 0 && Date.now() < deadline) {
      await sleep(200);
    }

    await closeRabbitMQ();
    logger.info("Adapter stopped");
    process.exit(0);
  } catch (error) {
    logger.error("Adapter shutdown failed", { message: error.message });
    process.exit(1);
  }
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

start().catch(async (error) => {
  logger.error("Adapter failed to start", { message: error.message });
  await closeRabbitMQ().catch(() => {});
  process.exit(1);
});
