const fs = require("fs");
const { chromium } = require("playwright");

async function launchBrowser(config) {
  const options = { headless: config.headless };
  if (config.edgePath && fs.existsSync(config.edgePath)) {
    options.executablePath = config.edgePath;
  }
  return chromium.launch(options);
}

module.exports = { launchBrowser };
