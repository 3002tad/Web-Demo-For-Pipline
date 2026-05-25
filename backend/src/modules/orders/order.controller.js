const asyncHandler = require("../../common/utils/async-handler");
const response = require("../../common/utils/response");
const orderService = require("./order.service");

const createOrder = asyncHandler(async (req, res) => {
  response.created(res, await orderService.createOrder(req.body));
});

const getOrder = asyncHandler(async (req, res) => {
  response.ok(res, await orderService.getOrder(req.params.orderCode));
});

module.exports = { createOrder, getOrder };
