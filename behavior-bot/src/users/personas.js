const personas = [
  {
    name: "casual_browser",
    weight: 60,
    overrides: {
      searchRate: 0.35,
      filterRate: 0.2,
      addToCartRate: 0.08,
      removeFromCartRate: 0.02,
      checkoutStartRate: 0.02,
      purchaseRate: 0
    }
  },
  {
    name: "intent_shopper",
    weight: 25,
    overrides: {
      searchRate: 0.85,
      filterRate: 0.55,
      addToCartRate: 0.45,
      removeFromCartRate: 0.1,
      checkoutStartRate: 0.2,
      purchaseRate: 0.08
    }
  },
  {
    name: "buyer",
    weight: 10,
    overrides: {
      loginRate: 0.75,
      searchRate: 0.75,
      filterRate: 0.45,
      addToCartRate: 0.8,
      removeFromCartRate: 0.08,
      checkoutStartRate: 0.75,
      purchaseRate: 0.65
    }
  },
  {
    name: "cart_abandoner",
    weight: 5,
    overrides: {
      searchRate: 0.75,
      filterRate: 0.4,
      addToCartRate: 0.85,
      removeFromCartRate: 0.35,
      checkoutStartRate: 0.8,
      purchaseRate: 0,
      cartAbandonRate: 0.85
    }
  }
];

function pickPersona() {
  const total = personas.reduce((sum, persona) => sum + persona.weight, 0);
  let target = Math.random() * total;
  for (const persona of personas) {
    target -= persona.weight;
    if (target <= 0) return persona;
  }
  return personas[0];
}

function applyPersona(config, persona) {
  if (!config.usePersonaRates) {
    return { ...config, persona: persona.name };
  }
  return { ...config, ...persona.overrides, persona: persona.name };
}

module.exports = { pickPersona, applyPersona };
