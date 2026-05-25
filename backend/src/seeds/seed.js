const fs = require("fs");
const path = require("path");
const connectMongoDB = require("../config/mongodb");
const categoryRepository = require("../modules/categories/category.repository");
const supplierRepository = require("../modules/suppliers/supplier.repository");
const productRepository = require("../modules/products/product.repository");
const Cart = require("../modules/carts/cart.model");
const DemoOrder = require("../modules/orders/order.model");
const TrackingDebugEvent = require("../modules/tracking/tracking-debug.model");
const seedCategories = require("./seed-categories");
const seedSuppliers = require("./seed-suppliers");
const seedProducts = require("./seed-products");

const rootDir = path.resolve(__dirname, "../../..");

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(rootDir, relativePath), "utf8"));
}

async function clearDemoCollections() {
  console.log("Clearing demo collections: products, categories, suppliers, carts, demo orders, tracking debug events");
  await Promise.all([
    productRepository.deleteMany(),
    categoryRepository.deleteMany(),
    supplierRepository.deleteMany(),
    Cart.deleteMany({}),
    DemoOrder.deleteMany({}),
    TrackingDebugEvent.deleteMany({})
  ]);
}

async function runSeed() {
  await connectMongoDB();

  const products = readJson("data/products.json");
  const categories = readJson("data/categories.json");
  const suppliers = readJson("data/suppliers.json");

  await clearDemoCollections();
  const savedCategories = await seedCategories(categories);
  const savedSuppliers = await seedSuppliers(suppliers);
  const savedProducts = await seedProducts(products, savedCategories, savedSuppliers, 500);

  console.log(`Seeded ${savedCategories.length} categories`);
  console.log(`Seeded ${savedSuppliers.size} suppliers`);
  console.log(`Seeded ${savedProducts.length} products`);
}

runSeed()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
