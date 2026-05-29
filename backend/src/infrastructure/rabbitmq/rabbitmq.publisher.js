const { connectRabbitMQ } = require("./rabbitmq.connection");
const constants = require("./rabbitmq.constants");

let publisherChannel = null;

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
  await channel.waitForConfirms();
  console.log(`RabbitMQ published ${routingKey}: ${event.event_id}`);
}

module.exports = { publishEvent };
