const express = require("express");
const cartController = require("./cart.controller");

const router = express.Router();

router.get("/", cartController.getCart);
router.post("/items", cartController.addItem);
router.patch("/items/:productId", cartController.updateItem);
router.delete("/items/:productId", cartController.removeItem);
router.delete("/", cartController.clearCart);

module.exports = router;
