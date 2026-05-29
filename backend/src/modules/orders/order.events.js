function createEventId() {
  return `evt_${Date.now().toString(36)}${Math.random().toString(16).slice(2, 10)}`;
}

function orderItemsMetadata(order) {
  return order.items.map((item) => ({
    product_id: item.productId,
    name: item.name,
    price: item.price,
    quantity: item.quantity,
    amount: item.amount
  }));
}

function baseBusinessEvent(order, eventType, eventSource, metadata = {}) {
  return {
    event_id: createEventId(),
    event_type: eventType,
    event_source: eventSource,
    occurred_at: new Date().toISOString(),
    anonymous_id: order.anonymousId || null,
    session_id: order.sessionId,
    user_id: order.userId || null,
    order_id: order.orderCode,
    metadata
  };
}

function orderCreatedEvent(order) {
  return baseBusinessEvent(order, "order.created", "web_demo_api", {
    status: "pending",
    total_amount: order.totalAmount,
    payment_method: order.paymentMethod,
    item_count: order.items.reduce((total, item) => total + item.quantity, 0),
    items: orderItemsMetadata(order)
  });
}

function inventoryReservedEvent(order) {
  return baseBusinessEvent(order, "inventory.reserved", "web_demo_worker", {
    status: "inventory_reserved",
    items: order.items.map((item) => ({
      product_id: item.productId,
      reserved_quantity: item.quantity
    }))
  });
}

function paymentSucceededEvent(order) {
  return baseBusinessEvent(order, "payment.succeeded", "web_demo_worker", {
    payment_method: order.paymentMethod,
    amount: order.totalAmount,
    currency: "VND",
    status: "succeeded"
  });
}

function orderCompletedEvent(order) {
  return baseBusinessEvent(order, "order.completed", "web_demo_worker", {
    status: "completed",
    total_amount: order.totalAmount,
    payment_method: order.paymentMethod,
    item_count: order.items.reduce((total, item) => total + item.quantity, 0),
    items: orderItemsMetadata(order)
  });
}

module.exports = {
  orderCreatedEvent,
  inventoryReservedEvent,
  paymentSucceededEvent,
  orderCompletedEvent
};
