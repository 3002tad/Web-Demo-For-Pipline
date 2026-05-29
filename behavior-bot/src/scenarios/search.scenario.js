const { chance, pick } = require("../utils/random");
const { humanDelay } = require("../utils/wait");

const keywords = ["tai nghe", "giay", "tui", "dong ho", "laptop", "ao", "voucher", "deal"];

async function search(page, config, summary) {
  if (!chance(config.searchRate)) return;
  const keyword = pick(keywords);
  await page.fill("#searchInput", keyword);
  await page.click("#searchForm button[type=\"submit\"]");
  await humanDelay(config);
  summary.searches += 1;
  summary.keywords[keyword] = (summary.keywords[keyword] || 0) + 1;
}

module.exports = { search };
