const dotenv = require("dotenv");

dotenv.config();

function requireEnv(name) {
  const value = process.env[name];
  if (!value || !String(value).trim()) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return String(value).trim();
}

const env = {
  port: Number(requireEnv("PORT")),
  mongoUri: requireEnv("MONGO_URI"),
  nodeEnv: process.env.NODE_ENV || "development",
  clientOrigin: process.env.CLIENT_ORIGIN || "",
  trackingForwardUrl: process.env.TRACKING_FORWARD_URL || "",
  trackingDebugStore: process.env.TRACKING_DEBUG_STORE !== "false",
  jwtSecret: process.env.JWT_SECRET || process.env.JWT_ACCESS_SECRET || "",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || process.env.JWT_ACCESS_EXPIRES || "7d",
  authCookieName: process.env.AUTH_COOKIE_NAME || "markethub_token",
  cookieSecure: process.env.COOKIE_SECURE === "true" || process.env.AUTH_COOKIE_SECURE === "true",
  cookieSameSite: process.env.COOKIE_SAME_SITE || process.env.AUTH_COOKIE_SAMESITE || "lax",
};

if (!env.jwtSecret) {
  throw new Error("Missing required environment variable: JWT_SECRET");
}

module.exports = env;
