const { connectRabbitMQ } = require("./rabbitmq.connection");
const constants = require("./rabbitmq.constants");
const env = require("../../config/env");

let publisherChannel = null;

function withTimeout(promise, timeoutMs, label) {
  return Promise.race([
    promise,
    new Promise((resolve, reject) => {
      setTimeout(() => reject(new Error(`${label} timed out after ${timeoutMs}ms`)), timeoutMs);
    })
  ]);
}

async function getPublisherChannel() {
  if (publisherChannel) return publisherChannel;

  const connection = await connectRabbitMQ();
  publisherChannel = await connection.createConfirmChannel();
  publisherChannel.on("error", (error) => {
    console.error(`RabbitMQ publisher channel error: ${error.message}`);
  });
  publisherChannel.on("close", () => {
    publisherChannel = null;
  });
  await publisherChannel.assertExchange(constants.EXCHANGE, constants.EXCHANGE_TYPE, { durable: true });
  return publisherChannel;
}

async function publishEvent(routingKey, event) {
  const channel = await getPublisherChannel();
  const payload = Buffer.from(JSON.stringify(event));

  channel.publish(constants.EXCHANGE, routingKey, payload, {
    persistent: true,
    contentType: "application/json",
    messageId: event.event_id,
    timestamp: Date.now()
  });
  await withTimeout(
    channel.waitForConfirms(),
    env.rabbitmqPublishConfirmTimeoutMs,
    "RabbitMQ publish confirm"
  );
  console.log(`RabbitMQ published ${routingKey}: ${event.event_id}`);
}

async function initializePublisher() {
  await getPublisherChannel();
  console.log("RabbitMQ publisher is ready");
}

module.exports = { publishEvent, initializePublisher };
