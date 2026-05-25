const supplierRepository = require("./supplier.repository");

async function listSuppliers() {
  const suppliers = await supplierRepository.findAll();
  return suppliers.map((supplier) => ({
    id: String(supplier._id),
    name: supplier.name,
    rating: supplier.rating,
    location: supplier.location,
    response: supplier.response,
    products: supplier.products,
    createdAt: supplier.createdAt,
    updatedAt: supplier.updatedAt
  }));
}

module.exports = { listSuppliers };
