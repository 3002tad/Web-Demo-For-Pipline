const categoryRepository = require("./category.repository");

async function listCategories() {
  const categories = await categoryRepository.findAll();
  return categories.map((category) => ({
    id: category.slug,
    name: category.name,
    slug: category.slug,
    image: category.image,
    createdAt: category.createdAt,
    updatedAt: category.updatedAt
  }));
}

module.exports = { listCategories };
