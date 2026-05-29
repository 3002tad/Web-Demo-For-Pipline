const path = require("path");
const dotenv = require("dotenv");

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

function argValue(name) {
  const index = process.argv.indexOf(name);
  if (index >= 0 && process.argv[index + 1]) return process.argv[index + 1];
  const inline = process.argv.find((arg) => arg.startsWith(`${name}=`));
  return inline ? inline.split("=").slice(1).join("=") : undefined;
}

function numberOption(cliName, envName, fallback) {
  const value = argValue(cliName) ?? process.env[envName];
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function boolOption(cliName, envName, fallback) {
  if (process.argv.includes(cliName)) return true;
  if (process.argv.includes(`--no-${cliName.replace(/^--/, "")}`)) return false;
  const value = process.env[envName];
  if (value === undefined) return fallback;
  return String(value).toLowerCase() === "true";
}

module.exports = {
  baseUrl: argValue("--base-url") || process.env.BOT_BASE_URL || "http://localhost:3000",
  users: numberOption("--users", "BOT_USERS", 20),
  concurrency: numberOption("--concurrency", "BOT_CONCURRENCY", 3),
  headless: boolOption("--headless", "BOT_HEADLESS", true),
  edgePath: process.env.BOT_EDGE_PATH || "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  minDelayMs: numberOption("--min-delay", "BOT_MIN_DELAY_MS", 500),
  maxDelayMs: numberOption("--max-delay", "BOT_MAX_DELAY_MS", 2500),
  loginRate: numberOption("--login-rate", "BOT_LOGIN_RATE", 0.3),
  searchRate: numberOption("--search-rate", "BOT_SEARCH_RATE", 0.65),
  filterRate: numberOption("--filter-rate", "BOT_FILTER_RATE", 0.4),
  productViewRate: numberOption("--product-view-rate", "BOT_PRODUCT_VIEW_RATE", 0.8),
  addToCartRate: numberOption("--add-to-cart-rate", "BOT_ADD_TO_CART_RATE", 0.35),
  checkoutStartRate: numberOption("--checkout-start-rate", "BOT_CHECKOUT_START_RATE", 0.2),
  purchaseRate: numberOption("--purchase-rate", "BOT_PURCHASE_RATE", 0.12),
  cartAbandonRate: numberOption("--cart-abandon-rate", "BOT_CART_ABANDON_RATE", 0.08),
  scrollRate: numberOption("--scroll-rate", "BOT_SCROLL_RATE", 0.9),
  usePersonaRates: boolOption("--persona-rates", "BOT_USE_PERSONA_RATES", false),
  outputPath: process.env.BOT_REPORT_PATH || "output/behavior-bot/latest-report.json"
};
