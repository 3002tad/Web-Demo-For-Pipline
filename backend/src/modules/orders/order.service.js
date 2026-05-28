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
    anonymousId: order.anonymousId,
    userId: order.userId,
    items: order.items,
    totalAmount: order.totalAmount,
    paymentMethod: order.paymentMethod,
    status: order.status,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt
  };
}

async function createOrder({ sessionId, anonymousId = null, paymentMethod = "cod" }, authUser = null) {
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
    amount: item.priceSnapshot * item.quantity,
    image: item.imageSnapshot || ""
  }));

  const order = await orderRepository.create({
    orderCode: createOrderCode(),
    sessionId,
    anonymousId,
    userId: authUser?.id || null,
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

async function getPurchasedProducts(userId) {
  if (!userId) {
    const error = new Error("Unauthorized");
    error.statusCode = 401;
    throw error;
  }

  const orders = await orderRepository.findCompletedByUserId(userId);
  const grouped = new Map();

  for (const order of orders) {
    for (const item of order.items) {
      const current = grouped.get(item.productId) || {
        productId: item.productId,
        name: item.name,
        image: item.image || "",
        lastPurchasedAt: order.createdAt,
        totalQuantity: 0,
        orderCodes: []
      };

      current.totalQuantity += item.quantity;
      if (!current.orderCodes.includes(order.orderCode)) {
        current.orderCodes.push(order.orderCode);
      }
      if (new Date(order.createdAt) > new Date(current.lastPurchasedAt)) {
        current.lastPurchasedAt = order.createdAt;
        current.name = item.name;
        current.image = item.image || current.image;
      }
      grouped.set(item.productId, current);
    }
  }

  return Array.from(grouped.values());
}

module.exports = { createOrder, getOrder, getPurchasedProducts };
