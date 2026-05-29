const path = require("path");
const dotenv = require("dotenv");

const rootDir = __dirname;
const envPath = path.join(rootDir, ".env");

dotenv.config({ path: envPath });

module.exports = { rootDir, envPath };
