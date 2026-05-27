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
  trackingForwardUrl: requireEnv("TRACKING_FORWARD_URL"),
  trackingDebugStore: process.env.TRACKING_DEBUG_STORE !== "false",
  jwtAccessSecret: requireEnv("JWT_ACCESS_SECRET"),
  jwtRefreshSecret: requireEnv("JWT_REFRESH_SECRET"),
  jwtAccessExpiresIn: requireEnv("JWT_ACCESS_EXPIRES"),
  jwtRefreshExpiresIn: requireEnv("JWT_REFRESH_EXPIRES"),
  authCookieName: requireEnv("AUTH_COOKIE_NAME"),
  authCookieSecure: requireEnv("AUTH_COOKIE_SECURE") === "true",
  authCookieSameSite: requireEnv("AUTH_COOKIE_SAMESITE"),
};

module.exports = env;
