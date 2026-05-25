const mongoose = require("mongoose");

const cartItemSchema = new mongoose.Schema(
  {
    productId: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    priceSnapshot: { type: Number, required: true },
    nameSnapshot: { type: String, required: true },
    imageSnapshot: { type: String, default: "" }
  },
  { _id: false }
);

const cartSchema = new mongoose.Schema(
  {
    sessionId: { type: String, required: true, unique: true, index: true },
    items: { type: [cartItemSchema], default: [] }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Cart", cartSchema);
