import { DEFAULT_ENDPOINT } from "./core/constants.js";
import { newSessionId } from "./core/identity.js";
import { createBasePayload } from "./core/payload.js";
import { createTransport } from "./core/transport.js";
import { createEventApi } from "./events/events.js";
import { initAutoPageView } from "./auto/auto-page-view.js";

export function createBehaviorSdk(options = {}) {
  const endpoint = (options.endpoint || DEFAULT_ENDPOINT).replace(/\/$/, "");
  const debug = Boolean(options.debug);
  let userId = options.userId ?? null;

  const { send, flushQueue } = createTransport({ endpoint, debug });
  const basePayload = (eventType, extra = {}) => createBasePayload(eventType, extra, userId);
  const eventApi = createEventApi({ basePayload, send });

  const sdk = {
    setUserId: (id) => { userId = id; },
    clearUserId: () => { userId = null; },
    newSession: () => { newSessionId(); },
    ...eventApi,
    initAutoPageView() {
      initAutoPageView(sdk, flushQueue);
    }
  };

  return sdk;
}
