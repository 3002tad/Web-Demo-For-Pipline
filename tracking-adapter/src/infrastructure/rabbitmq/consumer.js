const env = require("../../config/env");
const logger = require("../../utils/logger");
const { connectRabbitMQ } = require("./connection");
const { assertAdapterTopology } = require("./topology");

async function startConsumer(handler) {
  const connection = await connectRabbitMQ();
  const channel = await connection.createChannel();
  channel.on("error", (error) => logger.error("RabbitMQ consumer channel error", { message: error.message }));
  await assertAdapterTopology(channel);
  await channel.prefetch(env.rabbitmqAdapterPrefetch);

  const consumer = await channel.consume(env.rabbitmqAdapterQueue, async (message) => {
    if (!message) return;
    const routingKey = message.fields.routingKey;
    try {
      await handler(message, routingKey);
      channel.ack(message);
    } catch (error) {
      logger.error("Message failed; sending to DLQ", {
        message: error.message,
        routing_key: routingKey
      });
      channel.nack(message, false, false);
    }
  }, { noAck: false });

  logger.info("Adapter consumer started", {
    exchange: env.rabbitmqExchange,
    queue: env.rabbitmqAdapterQueue,
    bindings: env.rabbitmqAdapterBindingKeys,
    prefetch: env.rabbitmqAdapterPrefetch
  });

  return {
    channel,
    consumerTag: consumer.consumerTag,
    async stop() {
      await channel.cancel(consumer.consumerTag);
      await channel.close();
    }
  };
}

module.exports = { startConsumer };
