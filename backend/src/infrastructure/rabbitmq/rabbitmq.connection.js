const amqp = require("amqplib");
const env = require("../../config/env");

let connectionPromise = null;
let connection = null;

async function connectRabbitMQ() {
  if (connection) return connection;
  if (!connectionPromise) {
    connectionPromise = amqp.connect(env.rabbitmqUrl)
      .then((conn) => {
        connection = conn;
        console.log(`RabbitMQ connected: ${env.rabbitmqUrl}`);
        conn.on("error", (error) => {
          console.error(`RabbitMQ connection error: ${error.message}`);
        });
        conn.on("close", () => {
          console.warn("RabbitMQ connection closed");
          connection = null;
          connectionPromise = null;
        });
        return conn;
      })
      .catch((error) => {
        connectionPromise = null;
        console.error(`RabbitMQ connect failed: ${error.message}`);
        throw error;
      });
  }
  return connectionPromise;
}

async function closeRabbitMQ() {
  if (!connection) return;
  await connection.close();
  connection = null;
  connectionPromise = null;
}

module.exports = { connectRabbitMQ, closeRabbitMQ };
