import { defaultMetadata } from "../core/payload.js";

export function createEventApi({ basePayload, send }) {
  return {
    trackPageView: (pageUrl) => send(basePayload("page_view", { page_url: pageUrl })),

    trackProductView: (productId, pageUrl, productMeta = {}) =>
      send(basePayload("product_view", {
        product_id: productId,
        page_url: pageUrl,
        metadata: { ...productMeta }
      })),

    trackProductClick: (productId, pageUrl, productMeta = {}) =>
      send(basePayload("product_click", {
        product_id: productId,
        page_url: pageUrl,
        metadata: { ...productMeta }
      })),

    trackSearch: (query) => send(basePayload("search", { metadata: { query } })),

    trackFilterApply: (filters) => send(basePayload("filter_apply", { metadata: { filters } })),

    trackScrollDepth: (percent, pageUrl) =>
      send(basePayload("scroll_depth", { page_url: pageUrl, metadata: { scroll_percent: percent } })),

    trackBannerImpression: (banner) =>
      send(basePayload("banner_impression", { metadata: { ...banner } })),

    trackBannerClick: (banner) =>
      send(basePayload("banner_click", { metadata: { ...banner } })),

    trackCustom: (eventType, fields = {}) => {
      const { metadata, ...rest } = fields;
      return send({
        ...basePayload(eventType, rest),
        metadata: { ...defaultMetadata(), ...metadata }
      });
    }
  };
}
