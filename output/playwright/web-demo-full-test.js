const { chromium } = require("playwright");
const fs = require("fs");

const results = [];
const issues = [];
const consoleMessages = [];
const failedRequests = [];
const apiResponses = [];
let dialogIndex = 0;
const dialogAnswers = ["demo1@example.com", "123456", "Test User"];

function record(name, ok, detail = "") {
  results.push({ name, ok, detail });
  const mark = ok ? "PASS" : "FAIL";
  console.log(`${mark} ${name}${detail ? ` - ${detail}` : ""}`);
}

async function expectStep(name, fn) {
  try {
    const detail = await fn();
    record(name, true, detail || "");
  } catch (error) {
    record(name, false, error.message);
    issues.push({ name, message: error.message });
  }
}

(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"
  });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const page = await context.newPage();

  page.on("console", (msg) => consoleMessages.push({ type: msg.type(), text: msg.text() }));
  page.on("requestfailed", (request) => failedRequests.push({ url: request.url(), failure: request.failure()?.errorText || "" }));
  page.on("response", async (response) => {
    const url = response.url();
    if (url.includes("/api/") || url.endsWith("/track")) apiResponses.push({ url, status: response.status() });
  });
  page.on("dialog", async (dialog) => {
    const answer = dialogAnswers[Math.min(dialogIndex, dialogAnswers.length - 1)];
    dialogIndex += 1;
    await dialog.accept(answer);
  });

  await expectStep("Load homepage", async () => {
    const response = await page.goto("http://127.0.0.1:3000/", { waitUntil: "networkidle", timeout: 45000 });
    if (!response || response.status() !== 200) throw new Error(`status ${response?.status()}`);
    return `status ${response.status()}`;
  });

  await expectStep("SDK module loaded and identity created", async () => {
    await page.waitForFunction(() => window.tracking && typeof window.tracking.trackPageView === "function", null, { timeout: 15000 });
    const identity = await page.evaluate(() => ({
      anon: localStorage.getItem("pipeline_anonymous_id"),
      sess: localStorage.getItem("pipeline_session_id"),
      hasSetUser: typeof window.tracking.setUserId === "function",
      hasClearUser: typeof window.tracking.clearUserId === "function"
    }));
    if (!identity.anon || !identity.sess || !identity.hasSetUser || !identity.hasClearUser) throw new Error(JSON.stringify(identity));
    return `${identity.anon} / ${identity.sess}`;
  });

  await expectStep("Products/categories render", async () => {
    await page.waitForSelector("#productGrid article, #productGrid .product-card", { timeout: 20000 });
    const counts = await page.evaluate(() => ({
      products: document.querySelectorAll("#productGrid article, #productGrid .product-card").length,
      categories: document.querySelectorAll("#categoryGrid button").length,
      deals: document.querySelectorAll("#dealRow button, #dealRow article").length
    }));
    if (counts.products < 1 || counts.categories < 1) throw new Error(JSON.stringify(counts));
    return JSON.stringify(counts);
  });

  await expectStep("Vietnamese text quality smoke check", async () => {
    const text = await page.locator("body").innerText({ timeout: 5000 });
    const mojibakeMatches = text.match(/[\u00c3\u00c6\u00c4\u00c2]|\u00e1[\u00bb\u00ba]/g) || [];
    if (mojibakeMatches.length > 10) throw new Error(`mojibake markers=${mojibakeMatches.length}`);
    return `markers=${mojibakeMatches.length}`;
  });

  await expectStep("Search flow", async () => {
    await page.fill("#searchInput", "tai nghe");
    await page.click("#searchForm button[type=\"submit\"]");
    await page.waitForTimeout(700);
    const summary = await page.locator("#resultSummary").innerText();
    if (!summary) throw new Error("missing result summary");
    return summary;
  });

  await expectStep("Filter and reset flow", async () => {
    await page.selectOption("#priceFilter", "under_500");
    await page.selectOption("#tagFilter", "deal").catch(() => {});
    await page.waitForTimeout(500);
    await page.click("#resetFiltersButton");
    await page.waitForTimeout(500);
    const state = await page.evaluate(() => ({
      search: document.querySelector("#searchInput").value,
      price: document.querySelector("#priceFilter").value,
      tag: document.querySelector("#tagFilter").value
    }));
    if (state.search !== "" || state.price !== "all" || state.tag !== "all") throw new Error(JSON.stringify(state));
    return JSON.stringify(state);
  });

  await expectStep("Product detail modal", async () => {
    await page.click("[data-detail-id]");
    await page.waitForSelector("#detailPanel[aria-hidden=\"false\"]", { timeout: 10000 });
    const visible = await page.locator("#detailPanel").isVisible();
    await page.click("#detailPanel [data-close-panel]");
    if (!visible) throw new Error("detail panel not visible");
    return "opened and closed";
  });

  await expectStep("Add to cart and open cart", async () => {
    await page.click("[data-add-id]");
    await page.waitForFunction(() => Number(document.querySelector("#cartCount")?.textContent || 0) > 0, null, { timeout: 15000 });
    await page.click("#floatingCartButton");
    await page.waitForSelector("#cartPanel[aria-hidden=\"false\"]", { timeout: 10000 });
    const count = await page.locator("#cartCount").innerText();
    if (Number(count) < 1) throw new Error(`cart count ${count}`);
    return `cart count ${count}`;
  });

  await expectStep("Checkout opens", async () => {
    await page.click("#checkoutButton");
    await page.waitForSelector("#checkoutPanel[aria-hidden=\"false\"]", { timeout: 10000 });
    const visible = await page.locator("#checkoutPanel").isVisible();
    if (!visible) throw new Error("checkout panel not visible");
    return "checkout visible";
  });

  await expectStep("Complete order and worker status", async () => {
    await page.click("#completeOrderButton");
    await page.waitForFunction(() => /ORDER-|completed|pending|processing/.test(document.querySelector("#successBox")?.textContent || ""), null, { timeout: 20000 });
    await page.waitForFunction(() => /completed|failed|cancelled/.test(document.querySelector("#successBox")?.textContent || ""), null, { timeout: 35000 }).catch(() => {});
    const text = await page.locator("#successBox").innerText();
    if (!/ORDER-/.test(text)) throw new Error(text);
    await page.click("#checkoutPanel [data-close-panel]");
    await page.waitForFunction(() => document.querySelector("#checkoutPanel")?.getAttribute("aria-hidden") === "true", null, { timeout: 10000 });
    return text;
  });

  const beforeAuthIdentity = await page.evaluate(() => ({
    anon: localStorage.getItem("pipeline_anonymous_id"),
    sess: localStorage.getItem("pipeline_session_id")
  }));

  await expectStep("Auth login via account modal", async () => {
    await page.click("[data-track-name=\"account_menu\"]");
    await page.waitForSelector("#authPanel[aria-hidden=\"false\"]", { timeout: 10000 });
    await page.click("#authLoginButton");
    await page.waitForTimeout(1500);
    const state = await page.evaluate(() => ({
      auth: JSON.parse(localStorage.getItem("markethub_auth_state") || "null"),
      anon: localStorage.getItem("pipeline_anonymous_id"),
      sess: localStorage.getItem("pipeline_session_id")
    }));
    if (!state.auth?.user?.id) throw new Error(JSON.stringify(state));
    if (state.anon !== beforeAuthIdentity.anon || state.sess !== beforeAuthIdentity.sess) throw new Error("tracking identity reset after login");
    return state.auth.user.email;
  });

  await expectStep("Purchased products panel requires auth and renders", async () => {
    await page.click("#openPurchasedButton");
    await page.waitForSelector("#purchasedPanel[aria-hidden=\"false\"]", { timeout: 10000 });
    await page.waitForTimeout(1500);
    const text = await page.locator("#purchasedPanel").innerText();
    if (!text || /Khong the tai|Không thể tải/.test(text)) throw new Error(text);
    return text.split("\n").slice(0, 3).join(" | ");
  });

  await expectStep("Tracking requests are non-blocking", async () => {
    const trackResponses = apiResponses.filter((item) => item.url.endsWith("/track"));
    if (!trackResponses.length) throw new Error("no /track request observed");
    const badLocal = trackResponses.filter((item) => item.status >= 400);
    if (badLocal.length) throw new Error(JSON.stringify(badLocal.slice(0, 3)));
    return `${trackResponses.length} /track responses, backend forwarding bypassed`;
  });

  await page.screenshot({ path: "output/playwright/web-demo-full-test.png", fullPage: true });

  const report = { results, issues, consoleMessages, failedRequests, apiResponses };
  fs.writeFileSync("output/playwright/web-demo-full-test-report.json", JSON.stringify(report, null, 2));
  await browser.close();

  if (issues.length) process.exitCode = 1;
})();
