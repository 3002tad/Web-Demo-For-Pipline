const asyncHandler = require("../../common/utils/async-handler");
const trackingService = require("./tracking.service");

const receiveEvent = asyncHandler(async (req, res) => {
  await trackingService.receiveEvent(req.body);
  res.status(204).send();
});

module.exports = { receiveEvent };
