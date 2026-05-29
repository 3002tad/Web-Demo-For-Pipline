const mapping = require("../../config/mapping.config");

function normalizeItem(item = {}) {
  const price = Number(item.price || 0);
  const quantity = Number(item.quantity || item.reserved_quantity || 0);
  return {
    product_id: String(item.product_id || item.productId || ""),
    name: item.name ? String(item.name) : "",
    price,
    quantity,
    amount: Number(item.amount || price * quantity || 0)
  };
}

function normalizeMetadata(rawEvent) {
  const metadata = { ...(rawEvent.metadata || {}) };
  metadata.currency = metadata.currency || mapping.defaultCurrency;

  if (Array.isArray(metadata.items)) {
    metadata.items = metadata.items.map(normalizeItem).filter((item) => item.product_id);
    metadata.item_count = metadata.item_count || metadata.items.reduce((total, item) => total + item.quantity, 0);
  }

  if (metadata.totalAmount !== undefined && metadata.total_amount === undefined) {
    metadata.total_amount = Number(metadata.totalAmount);
    delete metadata.totalAmount;
  }
  if (metadata.paymentMethod !== undefined && metadata.payment_method === undefined) {
    metadata.payment_method = metadata.paymentMethod;
    delete metadata.paymentMethod;
  }

  return metadata;
}

module.exports = { normalizeMetadata };
