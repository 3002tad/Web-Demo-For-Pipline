const { chance } = require("../utils/random");
const { humanDelay } = require("../utils/wait");

async function checkout(page, config, summary) {
  if (!chance(config.checkoutStartRate)) return;
  await page.click("#floatingCartButton").catch(() => {});
  await page.waitForSelector("#cartPanel[aria-hidden=\"false\"]", { timeout: 10000 }).catch(() => {});
  const cartCount = Number(await page.locator("#cartCount").innerText().catch(() => "0"));
  if (!cartCount) return;

  await page.click("#checkoutButton");
  await page.waitForSelector("#checkoutPanel[aria-hidden=\"false\"]", { timeout: 10000 });
  await humanDelay(config);
  summary.checkoutStarts += 1;

  if (chance(config.purchaseRate)) {
    await page.click("#completeOrderButton");
    await page.waitForFunction(() => /ORDER-|completed|pending|processing/.test(document.querySelector("#successBox")?.textContent || ""), null, { timeout: 20000 });
    await page.waitForFunction(() => /completed|failed|cancelled/.test(document.querySelector("#successBox")?.textContent || ""), null, { timeout: 35000 }).catch(() => {});
    summary.purchases += 1;
    await page.click("#checkoutPanel [data-close-panel]").catch(() => {});
    return;
  }

  if (chance(config.cartAbandonRate)) {
    await page.click("#checkoutPanel [data-close-panel]").catch(() => {});
    summary.abandoned += 1;
  }
}

module.exports = { checkout };
