const orderRepository = require("../orders/order.repository");
const productRepository = require("../products/product.repository");
const orderEvents = require("../orders/order.events");
const { publishEvent } = require("../../infrastructure/rabbitmq/rabbitmq.publisher");
const { ROUTING_KEYS } = require("../../infrastructure/rabbitmq/rabbitmq.constants");

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const STEP_DELAY_MS = Number(process.env.ORDER_PROCESSING_STEP_DELAY_MS || 0);

async function setOrderStatus(orderCode, status) {
  const order = await orderRepository.updateStatusByOrderCode(orderCode, status);
  if (!order) {
    const error = new Error(`Order not found: ${orderCode}`);
    error.statusCode = 404;
    throw error;
  }
  return order;
}

async function reserveInventory(order) {
  for (const item of order.items) {
    const updatedProduct = await productRepository.decrementStock(item.productId, item.quantity);
    if (!updatedProduct) {
      const error = new Error(`Insufficient stock for product ${item.productId}`);
      error.statusCode = 409;
      throw error;
    }
  }
}

async function processOrderCreated(event) {
  if (event.event_type !== ROUTING_KEYS.ORDER_CREATED) {
    throw new Error(`Unsupported event type: ${event.event_type}`);
  }

  const orderCode = event.order_id;
  console.log(`[order-processing] received ${event.event_type} for ${orderCode}`);
  const order = await orderRepository.findByOrderCode(orderCode);
  if (!order) {
    throw new Error(`Order not found: ${orderCode}`);
  }

  if (order.status === "completed") {
    console.log(`Order ${orderCode} already completed; acking duplicate order.created`);
    return;
  }

  let current = order;

  if (current.status === "pending") {
    console.log(`[order-processing] ${orderCode} -> processing`);
    current = await setOrderStatus(orderCode, "processing");
  }

  if (STEP_DELAY_MS > 0) await delay(STEP_DELAY_MS);

  if (current.status === "processing") {
    try {
      await reserveInventory(current);
      console.log(`[order-processing] ${orderCode} -> inventory_reserved`);
      current = await setOrderStatus(orderCode, "inventory_reserved");
      await publishEvent(ROUTING_KEYS.INVENTORY_RESERVED, orderEvents.inventoryReservedEvent(current));
    } catch (error) {
      await setOrderStatus(orderCode, "failed");
      throw error;
    }
  }

  if (STEP_DELAY_MS > 0) await delay(STEP_DELAY_MS);

  if (current.status === "inventory_reserved") {
    console.log(`[order-processing] ${orderCode} -> paid`);
    current = await setOrderStatus(orderCode, "paid");
    await publishEvent(ROUTING_KEYS.PAYMENT_SUCCEEDED, orderEvents.paymentSucceededEvent(current));
  }

  if (STEP_DELAY_MS > 0) await delay(STEP_DELAY_MS);

  if (current.status === "paid") {
    console.log(`[order-processing] ${orderCode} -> completed`);
    current = await setOrderStatus(orderCode, "completed");
    await publishEvent(ROUTING_KEYS.ORDER_COMPLETED, orderEvents.orderCompletedEvent(current));
  }

  console.log(`Order ${orderCode} processed with status ${current.status}`);
}

module.exports = { processOrderCreated };
