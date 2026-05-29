const { chance, pick } = require("../utils/random");
const { humanDelay } = require("../utils/wait");

async function applyFilter(page, config, summary) {
  if (!chance(config.filterRate)) return;
  await page.selectOption("#priceFilter", pick(["under_500", "500_1200", "over_1200"])).catch(() => {});
  await humanDelay(config, 0.5);
  await page.selectOption("#tagFilter", pick(["deal", "mall", "best", "new"])).catch(() => {});
  await humanDelay(config);
  summary.filters += 1;
}

module.exports = { applyFilter };
