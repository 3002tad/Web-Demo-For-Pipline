const productRepository = require("./product.repository");
const supplierRepository = require("../suppliers/supplier.repository");

function normalizeProduct(product) {
  const supplier = product.supplierId && typeof product.supplierId === "object"
    ? product.supplierId
    : null;

  return {
    id: product.sku,
    name: product.name,
    category: product.categoryName,
    price: product.price,
    rating: product.rating,
    sold: product.sold,
    tag: product.tag,
    image: product.image,
    description: product.description,
    stock: product.stock,
    shipping: product.shipping,
    origin: product.origin,
    supplier: supplier
      ? {
          name: supplier.name,
          rating: supplier.rating,
          location: supplier.location,
          response: supplier.response,
          products: supplier.products
        }
      : {
          name: product.supplierName,
          location: product.origin,
          response: "",
          products: 0
        }
  };
}

async function listProducts(filters) {
  const products = await productRepository.findAll(filters);
  const suppliers = await supplierRepository.findAll();
  const suppliersById = new Map(suppliers.map((supplier) => [String(supplier._id), supplier]));

  return products.map((product) => {
    const supplier = suppliersById.get(String(product.supplierId));
    return normalizeProduct({ ...product, supplierId: supplier || product.supplierId });
  });
}

async function getProduct(sku) {
  const product = await productRepository.findBySku(sku);
  if (!product) {
    const error = new Error("Product not found");
    error.statusCode = 404;
    throw error;
  }

  const supplier = product.supplierId ? await supplierRepository.findById(product.supplierId) : null;
  return normalizeProduct({ ...product.toObject(), supplierId: supplier || product.supplierId });
}

module.exports = { listProducts, getProduct };
