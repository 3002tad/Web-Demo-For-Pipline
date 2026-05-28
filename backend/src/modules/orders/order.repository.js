const DemoOrder = require("./order.model");

async function create(data) {
  return DemoOrder.create(data);
}

async function findByOrderCode(orderCode) {
  return DemoOrder.findOne({ orderCode });
}

async function findCompletedByUserId(userId) {
  return DemoOrder.find({
    userId: String(userId),
    status: { $in: ["succeeded", "completed", "paid"] }
  }).sort({ createdAt: -1 });
}

module.exports = { create, findByOrderCode, findCompletedByUserId };
