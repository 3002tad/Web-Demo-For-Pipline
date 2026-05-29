const connectMongoDB = require("./config/mongodb");
const { closeRabbitMQ } = require("./infrastructure/rabbitmq/rabbitmq.connection");
const { startOrderProcessingWorker } = require("./modules/order-processing/order-processing.worker");

let consumerChannel = null;

async function shutdown(signal) {
  console.log(`Received ${signal}; shutting down worker`);
  try {
    if (consumerChannel) await consumerChannel.close();
    await closeRabbitMQ();
  } catch (error) {
    console.error(`Worker shutdown error: ${error.message}`);
  } finally {
    process.exit(0);
  }
}

async function startWorker() {
  await connectMongoDB();
  consumerChannel = await startOrderProcessingWorker();
  console.log("MarketHub order processing worker is running");
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

startWorker().catch((error) => {
  console.error("Cannot start MarketHub worker", error);
  process.exit(1);
});
