const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema(
  {
    productId: { type: String, required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true },
    amount: { type: Number, required: true }
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    orderCode: { type: String, required: true, unique: true, index: true },
    sessionId: { type: String, required: true, index: true },
    userId: { type: String, default: null },
    items: { type: [orderItemSchema], default: [] },
    totalAmount: { type: Number, required: true },
    paymentMethod: { type: String, default: "cod" },
    status: { type: String, default: "succeeded" }
  },
  { timestamps: true }
);

module.exports = mongoose.model("DemoOrder", orderSchema);
