const env = require("../../config/env");
const logger = require("../../utils/logger");
const trackingApiClient = require("../../infrastructure/http/tracking-api.client");
const retryService = require("./retry.service");

async function deliverEvent(event) {
  const responseData = await retryService.withRetry(async (attempt) => {
    logger.info("Delivering business event", {
      event_id: event.event_id,
      event_type: event.event_type,
      order_id: event.order_id,
      attempt
    });
    return trackingApiClient.postBusinessEvents([event]);
  }, env.maxDeliveryRetries);

  if (retryService.isSuccessResponse(responseData) || retryService.isDuplicateResponse(responseData)) {
    logger.info("Business event delivered", {
      event_id: event.event_id,
      accepted: responseData.accepted || 0,
      duplicates: responseData.duplicates || 0
    });
    return responseData;
  }

  const error = new Error(responseData?.message || "Tracking API delivery failed");
  error.responseData = responseData;
  throw error;
}

module.exports = { deliverEvent };
