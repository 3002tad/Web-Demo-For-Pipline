const mongoose = require("mongoose");
const dotenv = require("dotenv");

dotenv.config();

function requireEnv(name) {
  const value = process.env[name];
  if (!value || !String(value).trim()) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return String(value).trim();
}

async function connectMongoDB() {
  mongoose.set("strictQuery", true);
  const mongoUri = requireEnv("MONGO_URI");
  await mongoose.connect(mongoUri);
  console.log(`MongoDB connected: ${mongoUri}`);
}

module.exports = connectMongoDB;
