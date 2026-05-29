const sleep = require("../../utils/sleep");

const retryDelays = [500, 1500, 3000];

function isRetryableError(error) {
  if (!error.response) return true;
  return [429, 500, 502, 503, 504].includes(error.response.status);
}

function isDuplicateResponse(responseData) {
  return responseData?.success === true && Number(responseData.duplicates || 0) > 0;
}

function isSuccessResponse(responseData) {
  return responseData?.success === true;
}

async function withRetry(operation, maxRetries) {
  let lastError;
  for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
    try {
      return await operation(attempt + 1);
    } catch (error) {
      if (isDuplicateResponse(error.response?.data)) {
        return error.response.data;
      }
      lastError = error;
      if (!isRetryableError(error) || attempt === maxRetries) break;
      await sleep(retryDelays[Math.min(attempt, retryDelays.length - 1)]);
    }
  }
  throw lastError;
}

module.exports = { withRetry, isRetryableError, isDuplicateResponse, isSuccessResponse };
