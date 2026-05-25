const asyncHandler = require("../../common/utils/async-handler");
const response = require("../../common/utils/response");
const cartService = require("./cart.service");

const getCart = asyncHandler(async (req, res) => {
  response.ok(res, await cartService.getCart(req.query.sessionId));
});

const addItem = asyncHandler(async (req, res) => {
  response.created(res, await cartService.addItem(req.body));
});

const updateItem = asyncHandler(async (req, res) => {
  response.ok(res, await cartService.updateItem({ ...req.body, productId: req.params.productId }));
});

const removeItem = asyncHandler(async (req, res) => {
  response.ok(res, await cartService.removeItem({ sessionId: req.query.sessionId, productId: req.params.productId }));
});

const clearCart = asyncHandler(async (req, res) => {
  response.ok(res, await cartService.clearCart(req.query.sessionId));
});

module.exports = { getCart, addItem, updateItem, removeItem, clearCart };
