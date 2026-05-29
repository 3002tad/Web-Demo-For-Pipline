const env = require("../config/env");

function write(level, message, details = {}) {
  const safeDetails = Object.keys(details).length ? ` ${JSON.stringify(details)}` : "";
  const line = `[tracking-adapter] ${level.toUpperCase()} ${message}${safeDetails}`;
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);
}

module.exports = {
  info: (message, details) => write("info", message, details),
  warn: (message, details) => write("warn", message, details),
  error: (message, details) => write("error", message, details),
  debug: (message, details) => {
    if (env.debug) write("debug", message, details);
  }
};
