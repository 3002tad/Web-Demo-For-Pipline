const asyncHandler = require("../../common/utils/async-handler");
const response = require("../../common/utils/response");
const env = require("../../config/env");
const authService = require("./auth.service");
const authUtils = require("./auth.utils");

const register = asyncHandler(async (req, res) => {
  const user = await authService.register(req.body);
  response.created(res, { user });
});

const login = asyncHandler(async (req, res) => {
  const { user, token } = await authService.login(req.body);
  res.cookie(env.authCookieName, token, authUtils.authCookieOptions());
  response.ok(res, { user });
});

const logout = asyncHandler(async (req, res) => {
  res.clearCookie(env.authCookieName, authUtils.clearCookieOptions());
  res.json({ success: true, message: "Logged out" });
});

const me = asyncHandler(async (req, res) => {
  response.ok(res, { user: req.user });
});

module.exports = { register, login, logout, me };
