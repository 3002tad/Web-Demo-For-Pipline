const express = require("express");
const orderController = require("./order.controller");

const router = express.Router();

router.post("/", orderController.createOrder);
router.get("/:orderCode", orderController.getOrder);

module.exports = router;
