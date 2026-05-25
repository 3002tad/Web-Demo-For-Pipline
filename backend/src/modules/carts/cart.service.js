const cartRepository = require("./cart.repository");
const productRepository = require("../products/product.repository");

function requireSessionId(sessionId) {
  if (!sessionId) {
    const error = new Error("sessionId is required");
    error.statusCode = 400;
    throw error;
  }
}

function normalizeCart(cart) {
  const items = cart.items.map((item) => ({
    productId: item.productId,
    quantity: item.quantity,
    priceSnapshot: item.priceSnapshot,
    nameSnapshot: item.nameSnapshot,
    imageSnapshot: item.imageSnapshot,
    amount: item.priceSnapshot * item.quantity
  }));

  return {
    sessionId: cart.sessionId,
    items,
    itemCount: items.reduce((total, item) => total + item.quantity, 0),
    totalAmount: items.reduce((total, item) => total + item.amount, 0),
    createdAt: cart.createdAt,
    updatedAt: cart.updatedAt
  };
}

async function getOrCreateCart(sessionId) {
  requireSessionId(sessionId);
  return (await cartRepository.findBySessionId(sessionId)) || cartRepository.createForSession(sessionId);
}

async function getCart(sessionId) {
  const cart = await getOrCreateCart(sessionId);
  return normalizeCart(cart);
}

async function addItem({ sessionId, productId, quantity = 1 }) {
  const cart = await getOrCreateCart(sessionId);
  const product = await productRepository.findBySku(productId);

  if (!product) {
    const error = new Error("Product not found");
    error.statusCode = 404;
    throw error;
  }

  const existing = cart.items.find((item) => item.productId === productId);
  if (existing) {
    existing.quantity += Number(quantity);
  } else {
    cart.items.push({
      productId,
      quantity: Number(quantity),
      priceSnapshot: product.price,
      nameSnapshot: product.name,
      imageSnapshot: product.image
    });
  }

  await cartRepository.save(cart);
  return normalizeCart(cart);
}

async function updateItem({ sessionId, productId, quantity }) {
  const cart = await getOrCreateCart(sessionId);
  const nextQuantity = Number(quantity);

  cart.items = nextQuantity <= 0
    ? cart.items.filter((item) => item.productId !== productId)
    : cart.items.map((item) => item.productId === productId ? { ...item.toObject(), quantity: nextQuantity } : item);

  await cartRepository.save(cart);
  return normalizeCart(cart);
}

async function removeItem({ sessionId, productId }) {
  const cart = await getOrCreateCart(sessionId);
  cart.items = cart.items.filter((item) => item.productId !== productId);
  await cartRepository.save(cart);
  return normalizeCart(cart);
}

async function clearCart(sessionId) {
  requireSessionId(sessionId);
  await cartRepository.deleteBySessionId(sessionId);
  return { sessionId, items: [], itemCount: 0, totalAmount: 0 };
}

module.exports = { getCart, addItem, updateItem, removeItem, clearCart };
