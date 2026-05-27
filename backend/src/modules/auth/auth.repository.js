const AuthUser = require("./auth.model");

function findByEmail(email) {
  return AuthUser.findOne({ email: String(email).toLowerCase().trim() });
}

function findById(id) {
  return AuthUser.findById(id);
}

function createUser(data) {
  return AuthUser.create(data);
}

function save(user) {
  return user.save();
}

module.exports = { findByEmail, findById, createUser, save };
