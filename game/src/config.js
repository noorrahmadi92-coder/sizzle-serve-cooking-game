// Sizzle & Serve — configuration: dishes, ingredients, stations, timings.
// Every dish is a set of ingredients; an ingredient that needs work goes to a
// station first (grill, chopping board, pot) and only lands on the plate when
// it is ready. Direct ingredients go straight to the plate.

export const CANVAS_W = 1280;
export const CANVAS_H = 480;
export const SHIFT_SECONDS = 150;
export const MAX_ORDERS = 4;
export const MAX_STRIKES = 3;
export const ORDER_PATIENCE = 45;

export const STATIONS = {
  grill: { label: 'Grill', cookSeconds: 4, burnAfterSeconds: 9 },
  board: { label: 'Chopping board', cookSeconds: 2, burnAfterSeconds: Infinity },
  pot: { label: 'Pot', cookSeconds: 3, burnAfterSeconds: 8 },
};

export const INGREDIENTS = {
  bun:     { name: 'Bun',     station: null,    color: '#E8B96A', price: 0 },
  patty:   { name: 'Patty',   station: 'grill', color: '#8B5A2B', price: 0 },
  lettuce: { name: 'Lettuce', station: 'board', color: '#5CB85C', price: 0 },
  tomato:  { name: 'Tomato',  station: 'board', color: '#D94F3D', price: 0 },
  cheese:  { name: 'Cheese',  station: null,    color: '#F2C230', price: 0 },
  pasta:   { name: 'Pasta',   station: 'pot',   color: '#F0D060', price: 0 },
  sauce:   { name: 'Sauce',   station: null,    color: '#C0392B', price: 0 },
};

// The order of the bins on the counter, left to right.
export const BIN_ORDER = ['bun', 'patty', 'lettuce', 'tomato', 'cheese', 'pasta', 'sauce'];

export const RECIPES = {
  burger: {
    name: 'Burger', price: 18, needs: ['bun', 'patty', 'lettuce', 'cheese'],
    blurb: 'Bun + grilled patty + chopped lettuce + cheese',
  },
  salad: {
    name: 'Garden Salad', price: 12, needs: ['lettuce', 'tomato', 'cheese'],
    blurb: 'Chopped lettuce + chopped tomato + cheese',
  },
  pasta: {
    name: 'Pasta', price: 16, needs: ['pasta', 'sauce', 'cheese'],
    blurb: 'Boiled pasta + sauce + cheese',
  },
  soup: {
    name: 'Tomato Soup', price: 10, needs: ['tomato', 'sauce'],
    blurb: 'Chopped tomato + sauce',
  },
};

export const DISH_ORDER = ['burger', 'salad', 'pasta', 'soup'];

// How often a new order arrives (seconds), tightening as the shift goes on.
export function spawnIntervalSeconds(elapsedSeconds) {
  const t = Math.min(1, elapsedSeconds / SHIFT_SECONDS);
  return 12 - 5 * t;
}
