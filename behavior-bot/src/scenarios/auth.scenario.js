const { chance, pick } = require("../utils/random");
const { humanDelay } = require("../utils/wait");

const accounts = [
  { email: "demo1@example.com", password: "123456" },
  { email: "demo2@example.com", password: "123456" },
  { email: "demo3@example.com", password: "123456" },
  { email: "demo4@example.com", password: "123456" },
  { email: "demo5@example.com", password: "123456" }
];

async function maybeLogin(page, config, summary) {
  if (!chance(config.loginRate)) return;
  const account = pick(accounts);
  let dialogStep = 0;
  page.on("dialog", async (dialog) => {
    await dialog.accept(dialogStep === 0 ? account.email : account.password);
    dialogStep += 1;
  });
  await page.click("[data-track-name=\"account_menu\"]");
  await page.waitForSelector("#authPanel[aria-hidden=\"false\"]", { timeout: 10000 });
  await page.click("#authLoginButton");
  await humanDelay(config);
  summary.logins += 1;
}

module.exports = { maybeLogin };
