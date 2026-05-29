const app = require("./app");
const env = require("./config/env");
const connectMongoDB = require("./config/mongodb");
const { closeRabbitMQ } = require("./infrastructure/rabbitmq/rabbitmq.connection");
const { startLocalRabbitMQ, stopLocalRabbitMQ } = require("./infrastructure/rabbitmq/rabbitmq.local-lifecycle");
const { initializePublisher } = require("./infrastructure/rabbitmq/rabbitmq.publisher");
const { startOrderProcessingWorker } = require("./modules/order-processing/order-processing.worker");

let server = null;
let embeddedWorkerChannel = null;

async function shutdown(signal) {
  console.log(`Received ${signal}; shutting down server`);
  try {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
      server = null;
    }
    if (embeddedWorkerChannel) {
      await embeddedWorkerChannel.close();
      embeddedWorkerChannel = null;
    }
    await closeRabbitMQ();
    await stopLocalRabbitMQ();
  } catch (error) {
    console.error(`Server shutdown error: ${error.message}`);
  }
  process.exit(0);
}

async function startServer() {
  await startLocalRabbitMQ();
  await connectMongoDB();
  await initializePublisher();
  if (env.rabbitmqEmbedWorker) {
    embeddedWorkerChannel = await startOrderProcessingWorker();
    console.log("Embedded order processing worker is running");
  }

  server = app.listen(env.port, () => {
    console.log(`MarketHub is running at http://localhost:${env.port}`);
  });
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

startServer().catch((error) => {
  console.error("Cannot start MarketHub server", error);
  process.exit(1);
});
