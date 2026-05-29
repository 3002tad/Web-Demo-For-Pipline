const { chance, randomBetween } = require("../utils/random");
const { humanDelay } = require("../utils/wait");

async function scrollBannerIntoView(page, config, summary) {
  if (!chance(config.bannerViewRate)) return;
  const banners = page.locator("[data-track-banner]");
  const count = await banners.count();
  if (!count) return;

  const index = randomBetween(0, count - 1);
  const banner = banners.nth(index);
  await banner.scrollIntoViewIfNeeded().catch(() => {});
  await humanDelay(config, 0.8);
  summary.bannerViews += 1;
}

async function clickBanner(page, config, summary) {
  if (!chance(config.bannerClickRate)) return;
  const visibleBanners = page.locator("[data-track-banner]:visible");
  const count = await visibleBanners.count();
  if (!count) return;

  const index = randomBetween(0, count - 1);
  const clicked = await visibleBanners.nth(index).click({ timeout: 10000 })
    .then(() => true)
    .catch(() => false);
  if (!clicked) return;
  await humanDelay(config, 0.5);
  summary.bannerClicks += 1;
}

async function interactWithBanner(page, config, summary) {
  await scrollBannerIntoView(page, config, summary);
  await clickBanner(page, config, summary);
}

module.exports = { interactWithBanner };
