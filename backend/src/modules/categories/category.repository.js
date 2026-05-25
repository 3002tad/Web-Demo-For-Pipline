const Category = require("./category.model");

async function findAll() {
  return Category.find({}).sort({ name: 1 });
}

async function findByName(name) {
  return Category.findOne({ name });
}

async function upsertByName(name, data) {
  return Category.findOneAndUpdate({ name }, data, { upsert: true, new: true, setDefaultsOnInsert: true });
}

async function deleteMany() {
  return Category.deleteMany({});
}

module.exports = { findAll, findByName, upsertByName, deleteMany };
