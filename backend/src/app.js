const path = require("path");
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");

const productRoutes = require("./modules/products/product.routes");
const categoryRoutes = require("./modules/categories/category.routes");
const supplierRoutes = require("./modules/suppliers/supplier.routes");
const cartRoutes = require("./modules/carts/cart.routes");
const orderRoutes = require("./modules/orders/order.routes");
const trackingRoutes = require("./modules/tracking/tracking.routes");
const notFoundMiddleware = require("./common/middlewares/not-found.middleware");
const errorMiddleware = require("./common/middlewares/error.middleware");

const app = express();
const rootDir = path.resolve(__dirname, "../..");

app.use(cors());
app.use(morgan("dev"));
app.use(express.json({ limit: "1mb" }));

app.use("/track", trackingRoutes);
app.use("/api/products", productRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/suppliers", supplierRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);

app.use("/assets", express.static(path.join(rootDir, "assets"), { etag: false, maxAge: 0 }));
app.use("/template-assets", express.static(path.join(rootDir, "UI Template", "1.HTML_Template_Frontend_LTR", "assets"), { etag: false, maxAge: 0 }));
app.use("/data", express.static(path.join(rootDir, "data"), { etag: false, maxAge: 0 }));
app.use("/input", express.static(path.join(rootDir, "Input"), { etag: false, maxAge: 0 }));

app.get(["/", "/index.html"], (req, res) => {
  res.sendFile(path.join(rootDir, "index.html"));
});

app.use(notFoundMiddleware);
app.use(errorMiddleware);

module.exports = app;
