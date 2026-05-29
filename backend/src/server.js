const app = require("./app");
const env = require("./config/env");
const connectMongoDB = require("./config/mongodb");
const { closeRabbitMQ } = require("./infrastructure/rabbitmq/rabbitmq.connection");

let server = null;

async function shutdown(signal) {
  console.log(`Received ${signal}; shutting down server`);
  try {
    await closeRabbitMQ();
    if (server) {
      server.close(() => process.exit(0));
      return;
    }
  } catch (error) {
    console.error(`Server shutdown error: ${error.message}`);
  }
  process.exit(0);
}

async function startServer() {
  await connectMongoDB();

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
