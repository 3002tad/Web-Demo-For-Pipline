const env = require("../../config/env");

module.exports = {
  EXCHANGE: env.rabbitmqExchange,
  EXCHANGE_TYPE: env.rabbitmqExchangeType,
  ORDER_QUEUE: env.rabbitmqOrderQueue,
  ORDER_BINDING_KEY: env.rabbitmqOrderBindingKey,
  DLX: env.rabbitmqDlx,
  ORDER_DLQ: env.rabbitmqOrderDlq,
  ROUTING_KEYS: {
    ORDER_CREATED: "order.created",
    INVENTORY_RESERVED: "inventory.reserved",
    PAYMENT_SUCCEEDED: "payment.succeeded",
    ORDER_COMPLETED: "order.completed"
  }
};
