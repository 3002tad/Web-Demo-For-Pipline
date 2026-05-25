const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    sku: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    categoryId: { type: mongoose.Schema.Types.ObjectId, ref: "Category" },
    categoryName: { type: String, required: true, index: true },
    supplierId: { type: mongoose.Schema.Types.ObjectId, ref: "Supplier" },
    supplierName: { type: String, required: true },
    price: { type: Number, required: true },
    rating: { type: Number, default: 0 },
    sold: { type: Number, default: 0 },
    tag: { type: String, default: "new", index: true },
    image: { type: String, default: "" },
    description: { type: String, default: "" },
    stock: { type: Number, default: 0 },
    shipping: { type: String, default: "" },
    origin: { type: String, default: "" }
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform(doc, ret) {
        ret.id = ret.sku;
        ret.category = ret.categoryName;
        ret.supplier = {
          id: ret.supplierId,
          name: ret.supplierName,
          location: ret.origin,
          products: undefined,
          response: undefined
        };
        delete ret._id;
        delete ret.__v;
        delete ret.categoryId;
        delete ret.categoryName;
        delete ret.supplierId;
        delete ret.supplierName;
        delete ret.sku;
        return ret;
      }
    }
  }
);

module.exports = mongoose.model("Product", productSchema);
