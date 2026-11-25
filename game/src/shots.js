// Sizzle & Serve — staged scenes for the screenshots.
// Each shot builds one frozen moment of a shift: the timer stops, no new
// orders arrive, and the render draws exactly this state. The four shots
// together show the kitchen, the order board, the ingredients, a dish
// mid-assembly, the timer and a plate ready to serve.

import { createWorld, newOrder } from './world.js';

function base(seed) {
  const world = createWorld(seed);
  world.state = 'playing';
  world.frozen = true;
  return world;
}

function placeOrder(world, dish, bornAt, patience) {
  const order = newOrder(world.rng, bornAt);
  order.dish = dish;
  order.bornAt = bornAt;
  order.patience = patience;
  world.orders.push(order);
  return order;
}

export const SHOTS = {
  // Cover: a busy kitchen — three orders, a patty on the grill, lettuce
  // chopping, the timer running, coins already earned.
  kitchen(world) {
    world.now = 33;
    world.timeLeft = 117;
    world.coins = 34;
    world.served = 2;
    world.combo = 2;
    placeOrder(world, 'burger', 8, 45);
    placeOrder(world, 'pasta', 18, 45);
    placeOrder(world, 'salad', 28, 45);
    world.stations.grill.item = 'patty';
    world.stations.grill.startedAt = 31;
    world.stations.board.item = 'lettuce';
    world.stations.board.startedAt = 32;
    world.plate = ['bun'];
    world.message = 'Patty on the grill — watch it!';
    world.messageAt = 33;
    world.messageKind = 'info';
    return world;
  },

  // A dish mid-assembly: bun, patty and lettuce already on the plate,
  // cheese still to go, the burger order waiting.
  assembly(world) {
    world.now = 52;
    world.timeLeft = 98;
    world.coins = 46;
    world.served = 3;
    world.combo = 3;
    placeOrder(world, 'burger', 30, 45);
    placeOrder(world, 'soup', 44, 45);
    world.stations.pot.item = 'pasta';
    world.stations.pot.startedAt = 50;
    world.plate = ['bun', 'patty', 'lettuce'];
    world.selectedBin = 'cheese';
    world.message = 'One more — cheese — and the burger is done.';
    world.messageAt = 52;
    world.messageKind = 'info';
    return world;
  },

  // A plate ready to serve: the full burger, the order matched, the bell lit.
  serve(world) {
    world.now = 71;
    world.timeLeft = 79;
    world.coins = 62;
    world.served = 4;
    world.combo = 4;
    placeOrder(world, 'burger', 48, 45);
    placeOrder(world, 'pasta', 60, 45);
    world.plate = ['bun', 'patty', 'lettuce', 'cheese'];
    world.message = 'Burger complete — ring the bell!';
    world.messageAt = 71;
    world.messageKind = 'good';
    world.flash = { kind: 'good', at: 71 };
    return world;
  },

  // The service rush: four orders, the timer nearly gone, every station busy.
  rush(world) {
    world.now = 132;
    world.timeLeft = 18;
    world.coins = 118;
    world.served = 8;
    world.combo = 5;
    placeOrder(world, 'burger', 100, 45);
    placeOrder(world, 'pasta', 108, 45);
    placeOrder(world, 'salad', 116, 45);
    placeOrder(world, 'soup', 124, 45);
    world.stations.grill.item = 'patty';
    world.stations.grill.startedAt = 130;
    world.stations.board.item = 'tomato';
    world.stations.board.startedAt = 131;
    world.stations.pot.item = 'pasta';
    world.stations.pot.startedAt = 130;
    world.plate = ['bun', 'lettuce'];
    world.message = 'Final rush — 18 seconds left!';
    world.messageAt = 132;
    world.messageKind = 'bad';
    return world;
  },
};

export function stageShot(name, seed = 1) {
  const world = base(seed);
  const stage = SHOTS[name];
  if (!stage) throw new Error(`unknown shot: ${name}`);
  return stage(world);
}
