const app = require("./app");
const env = require("./config/env");
const connectMongoDB = require("./config/mongodb");

async function startServer() {
  await connectMongoDB();

  app.listen(env.port, () => {
    console.log(`MarketHub is running at http://localhost:${env.port}`);
  });
}

startServer().catch((error) => {
  console.error("Cannot start MarketHub server", error);
  process.exit(1);
});
