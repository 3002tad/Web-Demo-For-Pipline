const { randomBetween } = require("./random");

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function humanDelay(config, factor = 1) {
  await sleep(Math.round(randomBetween(config.minDelayMs, config.maxDelayMs) * factor));
}

module.exports = { sleep, humanDelay };
