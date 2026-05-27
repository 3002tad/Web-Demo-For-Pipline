const asyncHandler = require("../../common/utils/async-handler");
const response = require("../../common/utils/response");
const env = require("../../config/env");
const authService = require("./auth.service");

function cookieOptions() {
  return {
    httpOnly: true,
    secure: env.authCookieSecure,
    sameSite: env.authCookieSameSite,
    path: "/",
  };
}

const register = asyncHandler(async (req, res) => {
  const user = await authService.register(req.body);
  response.created(res, { user });
});

const login = asyncHandler(async (req, res) => {
  const { user, accessToken, refreshToken } = await authService.login(req.body);
  res.cookie(env.authCookieName, refreshToken, cookieOptions());
  response.ok(res, { user, accessToken });
});

const refresh = asyncHandler(async (req, res) => {
  const token = req.cookies?.[env.authCookieName];
  const { user, accessToken, refreshToken } = await authService.refresh(token);
  res.cookie(env.authCookieName, refreshToken, cookieOptions());
  response.ok(res, { user, accessToken });
});

const logout = asyncHandler(async (req, res) => {
  await authService.logout(req.user?.id);
  res.clearCookie(env.authCookieName, cookieOptions());
  response.ok(res, { success: true });
});

const me = asyncHandler(async (req, res) => {
  const user = await authService.getMe(req.user.id);
  response.ok(res, { user });
});

module.exports = { register, login, refresh, logout, me };
