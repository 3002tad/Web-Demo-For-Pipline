const Cart = require("./cart.model");

async function findBySessionId(sessionId) {
  return Cart.findOne({ sessionId });
}

async function createForSession(sessionId) {
  return Cart.create({ sessionId, items: [] });
}

async function save(cart) {
  return cart.save();
}

async function deleteBySessionId(sessionId) {
  return Cart.deleteOne({ sessionId });
}

module.exports = { findBySessionId, createForSession, save, deleteBySessionId };
