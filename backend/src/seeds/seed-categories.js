const categoryRepository = require("../modules/categories/category.repository");

function slugify(value) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "category";
}

async function seedCategories(categoryImages) {
  const categories = Object.entries(categoryImages)
    .filter(([name], index) => index > 0 && name !== "Tất cả" && name !== "Tat ca")
    .map(([name, image]) => ({ name, slug: slugify(name), image }));

  const saved = [];
  for (const category of categories) {
    saved.push(await categoryRepository.upsertByName(category.name, category));
  }

  return saved;
}

module.exports = seedCategories;
