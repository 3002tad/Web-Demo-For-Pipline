const Supplier = require("./supplier.model");

async function findAll() {
  return Supplier.find({}).sort({ name: 1 });
}

async function findById(id) {
  return Supplier.findById(id);
}

async function findByName(name) {
  return Supplier.findOne({ name });
}

async function upsertByName(name, data) {
  return Supplier.findOneAndUpdate({ name }, data, { upsert: true, new: true, setDefaultsOnInsert: true });
}

async function deleteMany() {
  return Supplier.deleteMany({});
}

module.exports = { findAll, findById, findByName, upsertByName, deleteMany };
