const amqp = require("amqplib");
const env = require("../../config/env");
const logger = require("../../utils/logger");

let connection = null;

function redactedRabbitUrl() {
  try {
    const url = new URL(env.rabbitmqUrl);
    if (url.password) url.password = "***";
    return url.toString();
  } catch {
    return "amqp://***";
  }
}

async function connectRabbitMQ() {
  if (connection) return connection;
  connection = await amqp.connect(env.rabbitmqUrl);
  connection.on("error", (error) => logger.error("RabbitMQ connection error", { message: error.message }));
  connection.on("close", () => {
    logger.warn("RabbitMQ connection closed");
    connection = null;
  });
  logger.info("RabbitMQ connected", { url: redactedRabbitUrl() });
  return connection;
}

async function closeRabbitMQ() {
  if (!connection) return;
  await connection.close();
  connection = null;
}

module.exports = { connectRabbitMQ, closeRabbitMQ };
