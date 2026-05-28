const authRepository = require("./auth.repository");
const authUtils = require("./auth.utils");
const userService = require("../users/user.service");

function createError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function normalizeEmail(email) {
  return String(email || "").toLowerCase().trim();
}

async function register({ email, password, name }) {
  if (!email || !password || !name) {
    throw createError("email, password, name are required", 400);
  }

  const normalizedEmail = normalizeEmail(email);
  const existed = await authRepository.findUserByEmail(normalizedEmail);
  if (existed) {
    throw createError("Email already exists", 409);
  }

  const passwordHash = await authUtils.hashPassword(String(password));
  const user = await authRepository.createUser({
    email: normalizedEmail,
    passwordHash,
    name: String(name).trim(),
    role: "customer",
    status: "active"
  });

  return userService.toPublicUser(user);
}

async function login({ email, password }) {
  if (!email || !password) {
    throw createError("email and password are required", 400);
  }

  const user = await authRepository.findUserByEmail(email);
  if (!user) {
    throw createError("Invalid credentials", 401);
  }

  const validPassword = await authUtils.comparePassword(String(password), user.passwordHash);
  if (!validPassword) {
    throw createError("Invalid credentials", 401);
  }

  if (user.status !== "active") {
    throw createError("User is disabled", 403);
  }

  return {
    user: userService.toPublicUser(user),
    token: authUtils.signAuthToken(user)
  };
}

async function getMe(userId) {
  const user = await authRepository.findUserById(userId);
  if (!user || user.status !== "active") {
    throw createError("Unauthorized", 401);
  }

  return userService.toPublicUser(user);
}

module.exports = { register, login, getMe };
