const express = require("express");
const userController = require("./user.controller");
const { requireAuth } = require("../auth/auth.middleware");

const router = express.Router();

router.get("/me/purchased-products", requireAuth, userController.getPurchasedProducts);

module.exports = router;
