const config = require("./config");
const { runBot } = require("./runner");
const { log } = require("./utils/logger");

runBot(config)
  .then((report) => {
    log("completed", report.aggregate);
    log("report written", { path: config.outputPath });
    process.exit(report.aggregate.failed ? 1 : 0);
  })
  .catch((error) => {
    console.error(`[behavior-bot] failed ${error.message}`);
    process.exit(1);
  });
