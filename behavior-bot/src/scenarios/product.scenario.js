const { chance, randomBetween } = require("../utils/random");
const { humanDelay } = require("../utils/wait");

async function clickRandom(page, selector) {
  const count = await page.locator(selector).count();
  if (!count) return false;
  await page.locator(selector).nth(randomBetween(0, count - 1)).click();
  return true;
}

async function viewProduct(page, config, summary) {
  if (!chance(config.productViewRate)) return false;
  const clicked = await clickRandom(page, "[data-detail-id]");
  if (!clicked) return false;
  await page.waitForSelector("#detailPanel[aria-hidden=\"false\"]", { timeout: 10000 }).catch(() => {});
  await humanDelay(config);
  summary.productViews += 1;
  return true;
}

async function addToCart(page, config, summary) {
  if (!chance(config.addToCartRate)) return false;
  const detailOpen = await page.locator("#detailPanel[aria-hidden=\"false\"]").count();
  const selector = detailOpen ? "#detailPanel [data-add-id]" : "[data-add-id]";
  const clicked = await clickRandom(page, selector);
  if (!clicked) return false;
  await page.waitForFunction(() => Number(document.querySelector("#cartCount")?.textContent || 0) > 0, null, { timeout: 15000 }).catch(() => {});
  await humanDelay(config);
  summary.addToCart += 1;
  return true;
}

async function closeDetailIfOpen(page) {
  const detailOpen = await page.locator("#detailPanel[aria-hidden=\"false\"]").count();
  if (detailOpen) await page.click("#detailPanel [data-close-panel]").catch(() => {});
}

module.exports = { viewProduct, addToCart, closeDetailIfOpen };
