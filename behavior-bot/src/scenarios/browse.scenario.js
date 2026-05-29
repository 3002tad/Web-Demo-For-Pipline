const { chance, randomBetween } = require("../utils/random");
const { humanDelay } = require("../utils/wait");

async function browse(page, config, summary) {
  if (!chance(config.scrollRate)) return;
  const scrolls = randomBetween(2, 5);
  for (let i = 0; i < scrolls; i += 1) {
    await page.mouse.wheel(0, randomBetween(350, 900));
    await humanDelay(config, 0.6);
  }
  summary.scrolls += scrolls;
}

module.exports = { browse };
