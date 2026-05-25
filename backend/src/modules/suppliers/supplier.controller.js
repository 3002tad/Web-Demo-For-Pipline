const asyncHandler = require("../../common/utils/async-handler");
const response = require("../../common/utils/response");
const supplierService = require("./supplier.service");

const listSuppliers = asyncHandler(async (req, res) => {
  const suppliers = await supplierService.listSuppliers();
  response.ok(res, suppliers);
});

module.exports = { listSuppliers };
