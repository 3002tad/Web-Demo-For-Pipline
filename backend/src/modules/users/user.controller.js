const asyncHandler = require("../../common/utils/async-handler");
const response = require("../../common/utils/response");
const userService = require("./user.service");

const getPurchasedProducts = asyncHandler(async (req, res) => {
  response.ok(res, await userService.getPurchasedProducts(req.user.id));
});

module.exports = { getPurchasedProducts };
