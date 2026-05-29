const { connectRabbitMQ } = require("./rabbitmq.connection");
const constants = require("./rabbitmq.constants");

async function assertOrderProcessingTopology(channel) {
  await channel.assertExchange(constants.EXCHANGE, constants.EXCHANGE_TYPE, { durable: true });
  await channel.assertExchange(constants.DLX, constants.EXCHANGE_TYPE, { durable: true });
  await channel.assertQueue(constants.ORDER_DLQ, { durable: true });
  await channel.bindQueue(constants.ORDER_DLQ, constants.DLX, "webdemo.order-processing.failed");
  await channel.assertQueue(constants.ORDER_QUEUE, {
    durable: true,
    arguments: {
      "x-dead-letter-exchange": constants.DLX,
      "x-dead-letter-routing-key": "webdemo.order-processing.failed"
    }
  });
  await channel.bindQueue(constants.ORDER_QUEUE, constants.EXCHANGE, constants.ORDER_BINDING_KEY);
}

async function consumeOrderCreated(handler) {
  const connection = await connectRabbitMQ();
  const channel = await connection.createChannel();
  channel.on("error", (error) => {
    console.error(`RabbitMQ consumer channel error: ${error.message}`);
  });

  await assertOrderProcessingTopology(channel);
  await channel.prefetch(5);

  await channel.consume(constants.ORDER_QUEUE, async (message) => {
    if (!message) return;

    try {
      const event = JSON.parse(message.content.toString("utf8"));
      await handler(event, message);
      channel.ack(message);
    } catch (error) {
      console.error(`Order processing message failed: ${error.message}`);
      channel.nack(message, false, false);
    }
  }, { noAck: false });

  console.log(`RabbitMQ consuming queue ${constants.ORDER_QUEUE} with binding ${constants.ORDER_BINDING_KEY}`);
  return channel;
}

module.exports = { consumeOrderCreated, assertOrderProcessingTopology };
