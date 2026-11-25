// Sizzle & Serve — the kitchen's state and rules.
// The world holds orders, the plate, the three stations, the timer and the
// score. It knows nothing about drawing or input; render.js draws it and
// input.js calls its verbs.

import {
  CANVAS_W, CANVAS_H, SHIFT_SECONDS, MAX_ORDERS, MAX_STRIKES,
  ORDER_PATIENCE, STATIONS, INGREDIENTS, RECIPES, DISH_ORDER,
  spawnIntervalSeconds,
} from './config.js';
import { mulberry32, pickFrom } from './random.js';

let orderCounter = 0;

export function newOrder(rng, nowSeconds) {
  orderCounter += 1;
  return {
    id: orderCounter,
    dish: pickFrom(rng, DISH_ORDER),
    bornAt: nowSeconds,
    patience: ORDER_PATIENCE,
    served: false,
  };
}

export function createWorld(seed = 1) {
  return {
    seed,
    rng: mulberry32(seed),
    state: 'title', // title | playing | paused | over
    now: 0, // seconds since the shift started
    timeLeft: SHIFT_SECONDS,
    spawnIn: 6, // seconds until the first order
    orders: [],
    plate: [], // ingredient ids, in the order they landed
    stations: {
      grill: { item: null, startedAt: 0, done: false, burnt: false },
      board: { item: null, startedAt: 0, done: false, burnt: false },
      pot: { item: null, startedAt: 0, done: false, burnt: false },
    },
    coins: 0,
    served: 0,
    lost: 0,
    strikes: 0,
    combo: 0,
    bestCombo: 0,
    mistakes: 0,
    message: '',
    messageAt: 0,
    messageKind: 'info',
    flash: null, // { kind: 'good' | 'bad', at }
    frozen: false, // staged screenshots: render but never advance time
    selectedBin: null,
  };
}

export function orderPatienceLeft(order, nowSeconds) {
  return Math.max(0, order.patience - (nowSeconds - order.bornAt));
}

export function recipeMatches(dish, plate) {
  const needs = [...RECIPES[dish].needs].sort();
  const got = [...plate].sort();
  return needs.length === got.length && needs.every((n, i) => n === got[i]);
}

export function plateMatchesAnyOrder(world) {
  return world.orders.find((o) => recipeMatches(o.dish, world.plate));
}

function stationFor(ingredientId) {
  return INGREDIENTS[ingredientId].station;
}

function stationIsFree(world, stationName) {
  return world.stations[stationName].item === null;
}

// Drop an ingredient into its station; returns false when the station is busy.
function startCooking(world, stationName, ingredientId) {
  const st = world.stations[stationName];
  if (st.item !== null) return false;
  st.item = ingredientId;
  st.startedAt = world.now;
  st.done = false;
  st.burnt = false;
  return true;
}

// Move finished station items onto the plate.
function collectFinishedStations(world) {
  for (const name of Object.keys(world.stations)) {
    const st = world.stations[name];
    if (st.item === null || st.done) continue;
    const spec = STATIONS[name];
    const cooked = world.now - st.startedAt;
    if (cooked >= spec.cookSeconds) {
      st.done = true;
      world.plate.push(st.item);
      st.item = null;
      flash(world, 'good');
    }
  }
}

// A burnt item is lost: it never reaches the plate.
function burnOverdueStations(world) {
  for (const name of Object.keys(world.stations)) {
    const st = world.stations[name];
    if (st.item === null) continue;
    const spec = STATIONS[name];
    if (world.now - st.startedAt >= spec.burnAfterSeconds) {
      st.item = null;
      st.done = false;
      st.burnt = true;
      world.mistakes += 1;
      world.combo = 0;
      setMessage(world, 'Burnt! That one is ruined.', 'bad');
      flash(world, 'bad');
    }
  }
}

export function setMessage(world, text, kind = 'info') {
  world.message = text;
  world.messageAt = world.now;
  world.messageKind = kind;
}

export function flash(world, kind) {
  world.flash = { kind, at: world.now };
}

// The player's main verb: click an ingredient bin.
export function addIngredient(world, ingredientId) {
  if (world.state !== 'playing' || world.frozen) return false;
  const station = stationFor(ingredientId);
  if (station === null) {
    world.plate.push(ingredientId);
    return true;
  }
  if (!stationIsFree(world, station)) {
    setMessage(world, `${STATIONS[station].label} is busy!`, 'bad');
    flash(world, 'bad');
    return false;
  }
  return startCooking(world, station, ingredientId);
}

// Take one ingredient back off the plate.
export function removeFromPlate(world, index) {
  if (world.state !== 'playing' || world.frozen) return false;
  if (index < 0 || index >= world.plate.length) return false;
  world.plate.splice(index, 1);
  return true;
}

// Empty the whole plate into the bin.
export function trashPlate(world) {
  if (world.state !== 'playing' || world.frozen) return false;
  if (world.plate.length === 0) return false;
  world.plate = [];
  setMessage(world, 'Plate cleared.', 'info');
  return true;
}

// Ring the bell: serve the plate to the oldest order it matches.
export function serve(world) {
  if (world.state !== 'playing' || world.frozen) return false;
  const order = plateMatchesAnyOrder(world);
  if (!order) {
    world.mistakes += 1;
    world.combo = 0;
    setMessage(world, 'No order matches this plate!', 'bad');
    flash(world, 'bad');
    return false;
  }
  const left = orderPatienceLeft(order, world.now);
  const tip = Math.round((RECIPES[order.dish].price * 0.5 * left) / ORDER_PATIENCE);
  world.combo += 1;
  world.bestCombo = Math.max(world.bestCombo, world.combo);
  const multiplier = 1 + Math.min(1, (world.combo - 1) * 0.1);
  const earned = Math.round((RECIPES[order.dish].price + tip) * multiplier);
  world.coins += earned;
  world.served += 1;
  world.orders = world.orders.filter((o) => o.id !== order.id);
  world.plate = [];
  setMessage(world, `Served ${RECIPES[order.dish].name}! +${earned} coins`, 'good');
  flash(world, 'good');
  return true;
}

export function startShift(world) {
  const fresh = createWorld(world.seed);
  fresh.state = 'playing';
  return fresh;
}

export function update(world, dtSeconds) {
  if (world.state !== 'playing' || world.frozen) return;
  world.now += dtSeconds;
  world.timeLeft = Math.max(0, SHIFT_SECONDS - world.now);

  collectFinishedStations(world);
  burnOverdueStations(world);

  // New orders arrive on a tightening schedule, up to the board's limit.
  world.spawnIn -= dtSeconds;
  if (world.spawnIn <= 0 && world.orders.length < MAX_ORDERS) {
    world.orders.push(newOrder(world.rng, world.now));
    world.spawnIn = spawnIntervalSeconds(world.now);
  }

  // Orders whose patience runs out leave the board.
  const stillHere = [];
  for (const order of world.orders) {
    if (orderPatienceLeft(order, world.now) <= 0) {
      world.lost += 1;
      world.strikes += 1;
      world.combo = 0;
      setMessage(world, `${RECIPES[order.dish].name} walked out!`, 'bad');
      flash(world, 'bad');
    } else {
      stillHere.push(order);
    }
  }
  world.orders = stillHere;

  if (world.strikes >= MAX_STRIKES || world.timeLeft <= 0) {
    world.state = 'over';
    world.message = '';
  }
}

// Geometry the renderer and the input handler share.
export const LAYOUT = {
  topBar: { x: 0, y: 0, w: CANVAS_W, h: 56 },
  board: { x: 16, y: 64, w: CANVAS_W - 32, h: 76 },
  grill: { x: 40, y: 168, w: 220, h: 120 },
  boardStation: { x: 300, y: 168, w: 220, h: 120 },
  pot: { x: 560, y: 168, w: 220, h: 120 },
  plate: { x: 820, y: 168, w: 220, h: 120 },
  bell: { x: 1080, y: 168, w: 160, h: 120 },
  bins: { x: 16, y: 316, w: CANVAS_W - 32, h: 148 },
  trash: { x: 1140, y: 316, w: 124, h: 40 },
};
