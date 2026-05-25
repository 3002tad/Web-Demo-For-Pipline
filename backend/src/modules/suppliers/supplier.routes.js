const express = require("express");
const supplierController = require("./supplier.controller");

const router = express.Router();

router.get("/", supplierController.listSuppliers);

module.exports = router;
