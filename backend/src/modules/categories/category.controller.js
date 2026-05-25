const asyncHandler = require("../../common/utils/async-handler");
const response = require("../../common/utils/response");
const categoryService = require("./category.service");

const listCategories = asyncHandler(async (req, res) => {
  const categories = await categoryService.listCategories();
  response.ok(res, categories);
});

module.exports = { listCategories };
