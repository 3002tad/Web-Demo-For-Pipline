const Product = require("./product.model");

async function findAll(filters = {}) {
  const query = {};

  if (filters.category) query.categoryName = filters.category;
  if (filters.tag) query.tag = filters.tag;

  return Product.find(query).sort({ sku: 1 }).lean({ virtuals: true });
}

async function findBySku(sku) {
  return Product.findOne({ sku });
}

async function upsertBySku(sku, data) {
  return Product.findOneAndUpdate({ sku }, data, { upsert: true, new: true, setDefaultsOnInsert: true });
}

async function deleteMany() {
  return Product.deleteMany({});
}

module.exports = { findAll, findBySku, upsertBySku, deleteMany };
