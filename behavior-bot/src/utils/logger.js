function log(message, details = {}) {
  const suffix = Object.keys(details).length ? ` ${JSON.stringify(details)}` : "";
  console.log(`[behavior-bot] ${message}${suffix}`);
}

module.exports = { log };
