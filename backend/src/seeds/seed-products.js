const productRepository = require("../modules/products/product.repository");

function expandCatalogProducts(sourceProducts, suppliersByCategory, targetCount) {
  const products = sourceProducts.map((product) => ({ ...product, sku: product.id }));
  const tags = ["deal", "mall", "best", "new"];
  const prefixes = ["Bo suu tap", "Phien ban", "San pham", "Combo", "Mau moi", "Hang chon loc", "Uu dai"];
  const variants = ["Premium", "Daily", "Urban", "Lite", "Pro", "Classic", "Modern", "Essential", "Plus", "Signature"];
  const supplierCategories = Array.from(suppliersByCategory.keys());
  let index = products.length + 1;

  while (products.length < targetCount) {
    const category = supplierCategories[(index - 1) % supplierCategories.length];
    const seedProduct = products.find((product) => product.category === category) || products[0];
    const price = Math.round((180000 + ((index * 7919) % 2300000)) / 10000) * 10000;
    const rating = Number((4.1 + ((index * 37) % 9) / 10).toFixed(1));
    const sold = 120 + ((index * 347) % 9800);
    const tag = tags[index % tags.length];

    products.push({
      sku: `p${String(index).padStart(3, "0")}`,
      name: `${prefixes[index % prefixes.length]} ${category} ${variants[index % variants.length]} ${String(index).padStart(3, "0")}`,
      category,
      price,
      rating,
      sold,
      tag,
      image: seedProduct.image,
      description: `San pham ${category.toLowerCase()} duoc tuyen chon boi ${suppliersByCategory.get(category).name}, phu hop cho nhu cau mua sam hang ngay.`
    });

    index += 1;
  }

  return products;
}

async function seedProducts(sourceProducts, categories, suppliersByCategory, targetCount = 500) {
  const categoriesByName = new Map(categories.map((category) => [category.name, category]));
  const expandedProducts = expandCatalogProducts(sourceProducts, suppliersByCategory, targetCount);
  const saved = [];

  for (const [index, product] of expandedProducts.entries()) {
    const supplier = suppliersByCategory.get(product.category);
    const category = categoriesByName.get(product.category);

    saved.push(await productRepository.upsertBySku(product.sku, {
      sku: product.sku,
      name: product.name,
      categoryId: category ? category._id : undefined,
      categoryName: product.category,
      supplierId: supplier ? supplier._id : undefined,
      supplierName: supplier ? supplier.name : "MarketHub Supplier",
      price: product.price,
      rating: product.rating,
      sold: product.sold,
      tag: product.tag,
      image: product.image,
      description: product.description,
      stock: 24 + index * 7,
      shipping: index % 3 === 0 ? "Freeship Extra" : "Giao trong 2-3 ngay",
      origin: supplier ? supplier.location : ""
    }));
  }

  return saved;
}

module.exports = seedProducts;
