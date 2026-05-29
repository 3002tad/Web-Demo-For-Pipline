module.exports = {
  supportedEventTypes: new Set([
    "order.created",
    "inventory.reserved",
    "payment.succeeded",
    "payment.failed",
    "order.completed",
    "order.cancelled"
  ]),
  defaultCurrency: "VND"
};
