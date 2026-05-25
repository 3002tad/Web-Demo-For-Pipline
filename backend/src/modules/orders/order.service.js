const orderRepository = require("./order.repository");
const cartRepository = require("../carts/cart.repository");

function createOrderCode() {
  const stamp = new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0, 14);
  const suffix = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `ORDER-${stamp}-${suffix}`;
}

function normalizeOrder(order) {
  return {
    orderCode: order.orderCode,
    sessionId: order.sessionId,
    userId: order.userId,
    items: order.items,
    totalAmount: order.totalAmount,
    paymentMethod: order.paymentMethod,
    status: order.status,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt
  };
}

async function createOrder({ sessionId, userId = null, paymentMethod = "cod" }) {
  if (!sessionId) {
    const error = new Error("sessionId is required");
    error.statusCode = 400;
    throw error;
  }

  const cart = await cartRepository.findBySessionId(sessionId);
  if (!cart || cart.items.length === 0) {
    const error = new Error("Cart is empty");
    error.statusCode = 400;
    throw error;
  }

  const items = cart.items.map((item) => ({
    productId: item.productId,
    name: item.nameSnapshot,
    price: item.priceSnapshot,
    quantity: item.quantity,
    amount: item.priceSnapshot * item.quantity
  }));

  const order = await orderRepository.create({
    orderCode: createOrderCode(),
    sessionId,
    userId,
    items,
    totalAmount: items.reduce((total, item) => total + item.amount, 0),
    paymentMethod,
    status: "succeeded"
  });

  cart.items = [];
  await cartRepository.save(cart);

  return normalizeOrder(order);
}

async function getOrder(orderCode) {
  const order = await orderRepository.findByOrderCode(orderCode);
  if (!order) {
    const error = new Error("Order not found");
    error.statusCode = 404;
    throw error;
  }

  return normalizeOrder(order);
}

module.exports = { createOrder, getOrder };
