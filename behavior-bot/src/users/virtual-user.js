const { maybeLogin } = require("../scenarios/auth.scenario");
const { browse } = require("../scenarios/browse.scenario");
const { search } = require("../scenarios/search.scenario");
const { applyFilter } = require("../scenarios/filter.scenario");
const { viewProduct, addToCart, closeDetailIfOpen } = require("../scenarios/product.scenario");
const { checkout } = require("../scenarios/checkout.scenario");

function createSummary(userId, persona) {
  return {
    userId,
    persona,
    ok: true,
    error: null,
    pageViews: 0,
    scrolls: 0,
    searches: 0,
    keywords: {},
    filters: 0,
    productViews: 0,
    addToCart: 0,
    checkoutStarts: 0,
    purchases: 0,
    abandoned: 0,
    logins: 0,
    trackResponses: 0,
    apiErrors: []
  };
}

async function runVirtualUser(browser, config, userId) {
  const context = await browser.newContext();
  const page = await context.newPage();
  const summary = createSummary(userId, config.persona);

  page.on("response", (response) => {
    const url = response.url();
    if (url.endsWith("/track") && response.status() === 204) summary.trackResponses += 1;
    if ((url.includes("/api/") || url.endsWith("/track")) && response.status() >= 400 && response.status() !== 401) {
      summary.apiErrors.push({ url, status: response.status() });
    }
  });

  try {
    await page.goto(config.baseUrl, { waitUntil: "networkidle", timeout: 45000 });
    summary.pageViews += 1;
    await page.waitForSelector("#productGrid article, #productGrid .product-card", { timeout: 20000 });

    await maybeLogin(page, config, summary).catch(() => {});
    await browse(page, config, summary);
    await search(page, config, summary);
    await applyFilter(page, config, summary);
    await viewProduct(page, config, summary);
    await addToCart(page, config, summary);
    await closeDetailIfOpen(page);
    await checkout(page, config, summary);
  } catch (error) {
    summary.ok = false;
    summary.error = error.message;
  } finally {
    await context.close().catch(() => {});
  }

  return summary;
}

module.exports = { runVirtualUser };
