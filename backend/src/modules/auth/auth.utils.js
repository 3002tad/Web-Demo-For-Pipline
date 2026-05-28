const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const env = require("../../config/env");

function parseDurationMs(value) {
  const match = String(value || "7d").trim().match(/^(\d+)(ms|s|m|h|d)?$/);
  if (!match) return 7 * 24 * 60 * 60 * 1000;

  const amount = Number(match[1]);
  const unit = match[2] || "s";
  const multipliers = {
    ms: 1,
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000
  };

  return amount * multipliers[unit];
}

function authCookieOptions() {
  return {
    httpOnly: true,
    sameSite: env.cookieSameSite,
    secure: env.cookieSecure || env.nodeEnv === "production",
    path: "/",
    maxAge: parseDurationMs(env.jwtExpiresIn)
  };
}

function clearCookieOptions() {
  const { maxAge, ...options } = authCookieOptions();
  return options;
}

function signAuthToken(user) {
  const id = String(user._id);
  return jwt.sign(
    {
      sub: id,
      user_id: id,
      email: user.email,
      role: user.role
    },
    env.jwtSecret,
    { expiresIn: env.jwtExpiresIn }
  );
}

function verifyAuthToken(token) {
  return jwt.verify(token, env.jwtSecret);
}

function hashPassword(password) {
  return bcrypt.hash(password, 10);
}

function comparePassword(password, passwordHash) {
  return bcrypt.compare(password, passwordHash);
}

module.exports = {
  authCookieOptions,
  clearCookieOptions,
  signAuthToken,
  verifyAuthToken,
  hashPassword,
  comparePassword
};
