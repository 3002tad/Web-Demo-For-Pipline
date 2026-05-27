const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const env = require("../../config/env");
const authRepository = require("./auth.repository");

function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function toPublicUser(user) {
  return {
    id: String(user._id),
    email: user.email,
    name: user.name,
  };
}

function signAccessToken(user) {
  return jwt.sign(
    { sub: String(user._id), email: user.email, name: user.name, type: "access" },
    env.jwtAccessSecret,
    { expiresIn: env.jwtAccessExpiresIn }
  );
}

function signRefreshToken(user) {
  return jwt.sign(
    { sub: String(user._id), type: "refresh", jti: crypto.randomUUID() },
    env.jwtRefreshSecret,
    { expiresIn: env.jwtRefreshExpiresIn }
  );
}

function verifyAccessToken(token) {
  const payload = jwt.verify(token, env.jwtAccessSecret);
  if (payload.type !== "access" || !payload.sub) {
    const error = new Error("Invalid access token");
    error.statusCode = 401;
    throw error;
  }
  return payload;
}

async function register({ email, password, name }) {
  if (!email || !password || !name) {
    const error = new Error("email, password, name are required");
    error.statusCode = 400;
    throw error;
  }
  const existed = await authRepository.findByEmail(email);
  if (existed) {
    const error = new Error("Email already exists");
    error.statusCode = 409;
    throw error;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await authRepository.createUser({
    email: String(email).toLowerCase().trim(),
    name: String(name).trim(),
    passwordHash,
  });
  return toPublicUser(user);
}

async function login({ email, password }) {
  if (!email || !password) {
    const error = new Error("email and password are required");
    error.statusCode = 400;
    throw error;
  }
  const user = await authRepository.findByEmail(email);
  if (!user) {
    const error = new Error("Invalid credentials");
    error.statusCode = 401;
    throw error;
  }
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) {
    const error = new Error("Invalid credentials");
    error.statusCode = 401;
    throw error;
  }

  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);
  const decoded = jwt.decode(refreshToken);
  user.refreshTokenHash = hashToken(refreshToken);
  user.refreshTokenExpiresAt = decoded?.exp ? new Date(decoded.exp * 1000) : null;
  await authRepository.save(user);

  return { user: toPublicUser(user), accessToken, refreshToken };
}

async function refresh(refreshToken) {
  if (!refreshToken) {
    const error = new Error("Missing refresh token");
    error.statusCode = 401;
    throw error;
  }
  let payload;
  try {
    payload = jwt.verify(refreshToken, env.jwtRefreshSecret);
  } catch {
    const error = new Error("Invalid refresh token");
    error.statusCode = 401;
    throw error;
  }
  if (payload.type !== "refresh" || !payload.sub) {
    const error = new Error("Invalid refresh token");
    error.statusCode = 401;
    throw error;
  }

  const user = await authRepository.findById(payload.sub);
  if (!user || !user.refreshTokenHash) {
    const error = new Error("Session not found");
    error.statusCode = 401;
    throw error;
  }
  if (user.refreshTokenHash !== hashToken(refreshToken)) {
    const error = new Error("Refresh token mismatch");
    error.statusCode = 401;
    throw error;
  }
  if (user.refreshTokenExpiresAt && user.refreshTokenExpiresAt.getTime() < Date.now()) {
    const error = new Error("Refresh token expired");
    error.statusCode = 401;
    throw error;
  }

  const accessToken = signAccessToken(user);
  const nextRefreshToken = signRefreshToken(user);
  const decoded = jwt.decode(nextRefreshToken);
  user.refreshTokenHash = hashToken(nextRefreshToken);
  user.refreshTokenExpiresAt = decoded?.exp ? new Date(decoded.exp * 1000) : null;
  await authRepository.save(user);

  return { user: toPublicUser(user), accessToken, refreshToken: nextRefreshToken };
}

async function logout(userId) {
  if (!userId) return;
  const user = await authRepository.findById(userId);
  if (!user) return;
  user.refreshTokenHash = null;
  user.refreshTokenExpiresAt = null;
  await authRepository.save(user);
}

async function getMe(userId) {
  const user = await authRepository.findById(userId);
  if (!user) {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }
  return toPublicUser(user);
}

module.exports = {
  register,
  login,
  refresh,
  logout,
  getMe,
  verifyAccessToken,
};
