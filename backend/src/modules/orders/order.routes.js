const express = require("express");
const orderController = require("./order.controller");
const { optionalAuth } = require("../auth/auth.middleware");

const router = express.Router();

router.post("/", optionalAuth, orderController.createOrder);
router.get("/:orderCode", orderController.getOrder);

module.exports = router;
