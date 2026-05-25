const DemoOrder = require("./order.model");

async function create(data) {
  return DemoOrder.create(data);
}

async function findByOrderCode(orderCode) {
  return DemoOrder.findOne({ orderCode });
}

module.exports = { create, findByOrderCode };
