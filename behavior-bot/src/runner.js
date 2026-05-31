const fs = require("fs");
const path = require("path");
const { launchBrowser } = require("./browser");
const { pickPersona, applyPersona } = require("./users/personas");
const { runVirtualUser } = require("./users/virtual-user");
const { log } = require("./utils/logger");

function aggregate(summaries) {
  return summaries.reduce((total, item) => {
    total.ok += item.ok ? 1 : 0;
    total.failed += item.ok ? 0 : 1;
    total.trackResponses += item.trackResponses;
    total.searches += item.searches;
    total.filters += item.filters;
    total.bannerViews += item.bannerViews;
    total.bannerClicks += item.bannerClicks;
    total.productViews += item.productViews;
    total.addToCart += item.addToCart;
    total.removeFromCart += item.removeFromCart;
    total.checkoutStarts += item.checkoutStarts;
    total.purchases += item.purchases;
    total.abandoned += item.abandoned;
    total.logins += item.logins;
    total.personas[item.persona] = (total.personas[item.persona] || 0) + 1;
    return total;
  }, {
    ok: 0,
    failed: 0,
    trackResponses: 0,
    searches: 0,
    filters: 0,
    bannerViews: 0,
    bannerClicks: 0,
    productViews: 0,
    addToCart: 0,
    removeFromCart: 0,
    checkoutStarts: 0,
    purchases: 0,
    abandoned: 0,
    logins: 0,
    personas: {}
  });
}

async function runBot(config) {
  const browser = await launchBrowser(config);
  const summaries = [];
  let nextUser = 1;

  async function worker(slot) {
    while (nextUser <= config.users) {
      const userId = nextUser;
      nextUser += 1;
      const persona = pickPersona();
      const userConfig = applyPersona(config, persona);
      log("starting user", { userId, slot, persona: persona.name });
      const summary = await runVirtualUser(browser, userConfig, userId);
      summaries.push(summary);
      log("finished user", {
        userId,
        ok: summary.ok,
        persona: summary.persona,
        tracks: summary.trackResponses,
        purchase: summary.purchases
      });
    }
  }

  const workers = Array.from({ length: Math.min(config.concurrency, config.users) }, (_, index) => worker(index + 1));
  await Promise.all(workers);
  await browser.close();

  const report = {
    generatedAt: new Date().toISOString(),
    config,
    aggregate: aggregate(summaries),
    users: summaries
  };

  fs.mkdirSync(path.dirname(config.outputPath), { recursive: true });
  fs.writeFileSync(config.outputPath, JSON.stringify(report, null, 2));
  return report;
}

module.exports = { runBot };
