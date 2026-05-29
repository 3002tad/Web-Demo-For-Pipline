const env = require("../../config/env");

const FAILED_ROUTING_KEY = "tracking.adapter.business-events.failed";

async function assertAdapterTopology(channel) {
  await channel.assertExchange(env.rabbitmqExchange, env.rabbitmqExchangeType, { durable: true });
  await channel.assertExchange(env.rabbitmqDlx, env.rabbitmqExchangeType, { durable: true });
  await channel.assertQueue(env.rabbitmqAdapterDlq, { durable: true });
  await channel.bindQueue(env.rabbitmqAdapterDlq, env.rabbitmqDlx, FAILED_ROUTING_KEY);

  await channel.assertQueue(env.rabbitmqAdapterQueue, {
    durable: true,
    arguments: {
      "x-dead-letter-exchange": env.rabbitmqDlx,
      "x-dead-letter-routing-key": FAILED_ROUTING_KEY
    }
  });

  for (const bindingKey of env.rabbitmqAdapterBindingKeys) {
    await channel.bindQueue(env.rabbitmqAdapterQueue, env.rabbitmqExchange, bindingKey);
  }
}

module.exports = { assertAdapterTopology, FAILED_ROUTING_KEY };
