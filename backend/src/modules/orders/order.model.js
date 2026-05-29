const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema(
  {
    productId: { type: String, required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true },
    amount: { type: Number, required: true },
    image: { type: String, default: "" }
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    orderCode: { type: String, required: true, unique: true, index: true },
    sessionId: { type: String, required: true, index: true },
    anonymousId: { type: String, default: null },
    userId: { type: String, default: null },
    items: { type: [orderItemSchema], default: [] },
    totalAmount: { type: Number, required: true },
    paymentMethod: { type: String, default: "cod" },
    status: {
      type: String,
      enum: ["pending", "processing", "inventory_reserved", "paid", "completed", "failed", "cancelled", "succeeded"],
      default: "pending",
      index: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("DemoOrder", orderSchema);
