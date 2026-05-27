const authService = require("../../modules/auth/auth.service");

function authMiddleware(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!token) {
    const error = new Error("Unauthorized");
    error.statusCode = 401;
    return next(error);
  }

  try {
    const payload = authService.verifyAccessToken(token);
    req.user = { id: payload.sub, email: payload.email, name: payload.name };
    return next();
  } catch (error) {
    return next(error);
  }
}

module.exports = authMiddleware;
