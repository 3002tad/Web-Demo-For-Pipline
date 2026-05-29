const { consumeOrderCreated } = require("../../infrastructure/rabbitmq/rabbitmq.consumer");
const orderProcessingService = require("./order-processing.service");

function startOrderProcessingWorker() {
  return consumeOrderCreated(orderProcessingService.processOrderCreated);
}

module.exports = { startOrderProcessingWorker };
