const productRepository = require("../modules/products/product.repository");

function expandCatalogProducts(sourceProducts, suppliersByCategory, targetCount) {
  const products = sourceProducts.map((product) => ({ ...product, sku: product.id }));
  const categories = Array.from(suppliersByCategory.keys());
  const usedNames = new Set(products.map((product) => product.name.toLowerCase()));
  const imagesByCategory = sourceProducts.reduce((acc, product) => {
    if (!acc[product.category]) acc[product.category] = [];
    if (product.image && !acc[product.category].includes(product.image)) {
      acc[product.category].push(product.image);
    }
    return acc;
  }, {});
  const startSize = products.length;
  const need = Math.max(targetCount - startSize, 0);
  const quota = {
    best: Math.round(need * 0.10),
    mid: Math.round(need * 0.20),
    long: Math.max(need - Math.round(need * 0.10) - Math.round(need * 0.20), 0),
  };
  const generatedByTier = { best: 0, mid: 0, long: 0 };

  const palette = ["Den", "Trang", "Xam", "Navy", "Be", "Do", "Xanh", "Tim", "Nau", "Hong"];
  const materials = ["Canvas", "Leather", "Cotton", "Linen", "Denim", "Steel", "Silicone", "Mesh", "Wool", "Plastic"];
  const lines = ["Core", "Urban", "Daily", "Studio", "Flex", "Prime", "Edge", "Nova", "Flow", "Max"];
  const variants = ["Lite", "Pro", "Plus", "Mini", "Classic", "Signature", "Air", "Ultra", "Advance", "Essential"];
  const useCases = ["di lam", "di hoc", "di choi", "tap luyen", "du lich", "hang ngay", "mua sam online", "su dung tai nha"];

  const priceBandByCategory = {
    "Giày dép": [390000, 2400000],
    "Túi ví": [220000, 1900000],
    "Phụ kiện": [120000, 1600000],
    "Thời trang nam": [180000, 1700000],
    "Điện tử": [260000, 4900000],
    "Nhà cửa": [90000, 1300000],
    "Làm đẹp": [110000, 980000],
  };

  function priceInBand(category, idx) {
    const [minPrice, maxPrice] = priceBandByCategory[category] || [120000, 1900000];
    const span = Math.max(maxPrice - minPrice, 1);
    const raw = minPrice + ((idx * 7919) % span);
    return Math.round(raw / 10000) * 10000;
  }

  function pickTier() {
    if (generatedByTier.best < quota.best) return "best";
    if (generatedByTier.mid < quota.mid) return "mid";
    return "long";
  }

  function tierStats(tier, idx) {
    if (tier === "best") {
      return {
        rating: Number((4.7 + ((idx * 13) % 3) / 10).toFixed(1)),
        sold: 6000 + ((idx * 97) % 18000),
        tag: "best",
      };
    }
    if (tier === "mid") {
      return {
        rating: Number((4.4 + ((idx * 17) % 4) / 10).toFixed(1)),
        sold: 1200 + ((idx * 83) % 4200),
        tag: idx % 2 === 0 ? "mall" : "new",
      };
    }
    return {
      rating: Number((3.9 + ((idx * 19) % 7) / 10).toFixed(1)),
      sold: 80 + ((idx * 43) % 1300),
      tag: idx % 3 === 0 ? "deal" : "new",
    };
  }

  function uniqueName(baseName) {
    if (!usedNames.has(baseName.toLowerCase())) {
      usedNames.add(baseName.toLowerCase());
      return baseName;
    }
    let suffix = 2;
    while (usedNames.has(`${baseName} ${suffix}`.toLowerCase())) {
      suffix += 1;
    }
    const finalName = `${baseName} ${suffix}`;
    usedNames.add(finalName.toLowerCase());
    return finalName;
  }

  function pickImage(category, idx) {
    const pool = imagesByCategory[category] || [];
    if (pool.length === 0) return "";
    const image = pool[idx % pool.length];
    // Keep source image stable but avoid aggressive browser cache collision.
    return `${image}${image.includes("?") ? "&" : "?"}v=${idx}`;
  }

  let index = startSize + 1;
  while (products.length < targetCount) {
    const category = categories[(index - 1) % categories.length];
    const supplier = suppliersByCategory.get(category);
    const tier = pickTier();
    const stats = tierStats(tier, index);

    const color = palette[index % palette.length];
    const material = materials[(index * 3) % materials.length];
    const line = lines[(index * 5) % lines.length];
    const variant = variants[(index * 7) % variants.length];
    const useCase = useCases[(index * 11) % useCases.length];
    const price = priceInBand(category, index);
    const supplierName = supplier?.name || "MarketHub Supplier";
    const shortSupplier = supplierName.split(" ").slice(0, 2).join(" ");
    const name = uniqueName(`${shortSupplier} ${line} ${material} ${variant} ${color}`);

    products.push({
      sku: `p${String(index).padStart(3, "0")}`,
      name,
      category,
      price,
      rating: stats.rating,
      sold: stats.sold,
      tag: stats.tag,
      image: pickImage(category, index),
      description: `${name} cho nhu cau ${useCase}; chat lieu ${material.toLowerCase()}, phien ban ${variant.toLowerCase()}, mau ${color.toLowerCase()}.`,
    });

    generatedByTier[tier] += 1;
    index += 1;
  }

  return products.slice(0, targetCount);
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
