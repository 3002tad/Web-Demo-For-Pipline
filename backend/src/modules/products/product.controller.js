const asyncHandler = require("../../common/utils/async-handler");
const response = require("../../common/utils/response");
const productService = require("./product.service");

const listProducts = asyncHandler(async (req, res) => {
  const products = await productService.listProducts(req.query);
  response.ok(res, products);
});

const getProduct = asyncHandler(async (req, res) => {
  const product = await productService.getProduct(req.params.id);
  response.ok(res, product);
});

module.exports = { listProducts, getProduct };
