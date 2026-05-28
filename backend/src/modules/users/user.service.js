const orderService = require("../orders/order.service");

function toPublicUser(user) {
  if (!user) return null;
  return {
    id: String(user._id),
    email: user.email,
    name: user.name,
    role: user.role
  };
}

function getPurchasedProducts(userId) {
  return orderService.getPurchasedProducts(userId);
}

module.exports = { toPublicUser, getPurchasedProducts };
