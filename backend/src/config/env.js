const dotenv = require("dotenv");

dotenv.config();

const env = {
  port: Number(process.env.PORT || 3000),
  mongoUri: process.env.MONGO_URI || "mongodb://localhost:27017/markethub_demo",
  trackingForwardUrl: process.env.TRACKING_FORWARD_URL || "http://lap1.bigdata.ts.net:31000/track",
  trackingDebugStore: process.env.TRACKING_DEBUG_STORE !== "false"
};

module.exports = env;
