const axios = require("axios");
const env = require("../../config/env");
const logger = require("../../utils/logger");

function ingestUrl() {
  return `${env.trackingIngestUrl.replace(/\/$/, "")}${env.trackingIngestPath}`;
}

const client = axios.create({
  baseURL: env.trackingIngestUrl,
  timeout: env.trackingIngestTimeoutMs
});

async function postBusinessEvents(events) {
  const payload = {
    source: env.adapterSource,
    tenant_id: env.tenantId,
    events
  };
  const eventId = events.length === 1 ? events[0].event_id : undefined;
  const response = await client.post(env.trackingIngestPath, payload, {
    headers: {
      Authorization: `Bearer ${env.trackingIngestApiKey}`,
      "Content-Type": "application/json",
      "X-Adapter-Source": env.adapterSource,
      "X-Tenant-Id": env.tenantId,
      ...(eventId ? { "X-Idempotency-Key": eventId } : {})
    }
  });
  logger.info("Tracking API response", {
    status: response.status,
    accepted: response.data?.accepted,
    duplicates: response.data?.duplicates
  });
  return response.data;
}

async function healthCheck() {
  const response = await client.get("/health");
  return response.data;
}

module.exports = { postBusinessEvents, healthCheck, ingestUrl };
