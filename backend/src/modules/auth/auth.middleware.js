const env = require("../../config/env");
const authUtils = require("./auth.utils");
const authService = require("./auth.service");

function getTokenFromRequest(req) {
  const cookieToken = req.cookies?.[env.authCookieName];
  if (cookieToken) return cookieToken;

  const header = req.headers.authorization || "";
  const [scheme, token] = header.split(" ");
  return scheme === "Bearer" ? token : "";
}

function unauthorized() {
  const error = new Error("Unauthorized");
  error.statusCode = 401;
  return error;
}

async function attachUserFromToken(req) {
  const token = getTokenFromRequest(req);
  if (!token) return null;

  const payload = authUtils.verifyAuthToken(token);
  const userId = payload.user_id || payload.sub;
  if (!userId) return null;

  const user = await authService.getMe(userId);
  req.user = user;
  return user;
}

async function requireAuth(req, res, next) {
  try {
    const user = await attachUserFromToken(req);
    if (!user) return next(unauthorized());
    return next();
  } catch (error) {
    error.statusCode = error.statusCode || 401;
    return next(error);
  }
}

async function optionalAuth(req, res, next) {
  try {
    await attachUserFromToken(req);
  } catch {
    req.user = null;
  }
  return next();
}

function requireRole(roles = []) {
  return (req, res, next) => {
    if (!req.user) return next(unauthorized());
    if (!roles.includes(req.user.role)) {
      const error = new Error("Forbidden");
      error.statusCode = 403;
      return next(error);
    }
    return next();
  };
}

module.exports = { requireAuth, optionalAuth, requireRole };
