const User = require("./user.model");

function normalizeEmail(email) {
  return String(email || "").toLowerCase().trim();
}

function findByEmail(email) {
  return User.findOne({ email: normalizeEmail(email) });
}

function findById(id) {
  return User.findById(id);
}

function createUser(data) {
  return User.create({
    ...data,
    email: normalizeEmail(data.email)
  });
}

function upsertByEmail(email, data) {
  return User.findOneAndUpdate(
    { email: normalizeEmail(email) },
    {
      $set: {
        ...data,
        email: normalizeEmail(email)
      }
    },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );
}

module.exports = { findByEmail, findById, createUser, upsertByEmail };
