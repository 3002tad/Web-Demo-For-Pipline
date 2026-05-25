const supplierRepository = require("../modules/suppliers/supplier.repository");

async function seedSuppliers(suppliersByCategory) {
  const saved = new Map();

  for (const [categoryName, supplier] of Object.entries(suppliersByCategory)) {
    const record = await supplierRepository.upsertByName(supplier.name, supplier);
    saved.set(categoryName, record);
  }

  return saved;
}

module.exports = seedSuppliers;
