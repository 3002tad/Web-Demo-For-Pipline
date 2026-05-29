function randomBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function chance(rate) {
  return Math.random() < Number(rate || 0);
}

function pick(items) {
  return items[Math.floor(Math.random() * items.length)];
}

module.exports = { randomBetween, chance, pick };
