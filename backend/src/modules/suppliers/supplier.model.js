const mongoose = require("mongoose");

const supplierSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    rating: { type: Number, default: 0 },
    location: { type: String, default: "" },
    response: { type: String, default: "" },
    products: { type: Number, default: 0 }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Supplier", supplierSchema);
