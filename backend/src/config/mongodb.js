const mongoose = require("mongoose");
const env = require("./env");

async function connectMongoDB() {
  mongoose.set("strictQuery", true);
  await mongoose.connect(env.mongoUri);
  console.log(`MongoDB connected: ${env.mongoUri}`);
}

module.exports = connectMongoDB;
