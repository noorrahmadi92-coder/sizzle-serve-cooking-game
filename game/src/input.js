// Sizzle & Serve — mouse and keyboard.
// Every clickable thing is a rectangle in world.js's LAYOUT; a click is
// routed to the matching verb. Keyboard 1-7 picks a bin, Space serves,
// T trashes the plate, P pauses, R restarts after the shift ends.

import { BIN_ORDER } from './config.js';
import { LAYOUT, addIngredient, removeFromPlate, trashPlate, serve, startShift } from './world.js';

function inside(x, y, box) {
  return x >= box.x && x <= box.x + box.w && y >= box.y && y <= box.y + box.h;
}

function binAt(x, y) {
  const box = LAYOUT.bins;
  if (!inside(x, y, box)) return null;
  const n = BIN_ORDER.length;
  const bw = (box.w - 24) / n;
  const relX = x - (box.x + 12);
  const i = Math.floor(relX / bw);
  if (i < 0 || i >= n) return null;
  if (y < box.y + 30) return null;
  return BIN_ORDER[i];
}

function plateIngredientAt(world, x, y) {
  const pl = LAYOUT.plate;
  const n = world.plate.length;
  if (n === 0) return -1;
  for (let i = 0; i < n; i++) {
    const px = pl.x + pl.w / 2 + (i - (n - 1) / 2) * 34;
    const py = pl.y + 66 - (i % 2) * 6;
    if (Math.abs(x - px) < 20 && Math.abs(y - py) < 20) return i;
  }
  return -1;
}

export function handleClick(world, x, y) {
  if (world.state === 'title') {
    if (x >= 1280 / 2 - 110 && x <= 1280 / 2 + 110 && y >= 380 && y <= 432) {
      return startShift(world);
    }
    return world;
  }
  if (world.state === 'over') {
    if (x >= 1280 / 2 - 110 && x <= 1280 / 2 + 110 && y >= 320 && y <= 372) {
      return startShift(world);
    }
    return world;
  }
  if (world.state === 'paused') {
    world.state = 'playing';
    return world;
  }
  if (world.state !== 'playing' || world.frozen) return world;

  const bin = binAt(x, y);
  if (bin) {
    world.selectedBin = bin;
    addIngredient(world, bin);
    return world;
  }
  if (inside(x, y, LAYOUT.bell)) {
    serve(world);
    return world;
  }
  if (inside(x, y, LAYOUT.trash)) {
    trashPlate(world);
    return world;
  }
  const plateIndex = plateIngredientAt(world, x, y);
  if (plateIndex >= 0) {
    removeFromPlate(world, plateIndex);
    return world;
  }
  return world;
}

export function handleKey(world, key) {
  const k = key.toLowerCase();
  if (world.state === 'title' && (k === 'enter' || k === ' ')) return startShift(world);
  if (world.state === 'over' && k === 'r') return startShift(world);
  if (k === 'p') {
    if (world.state === 'playing') world.state = 'paused';
    else if (world.state === 'paused') world.state = 'playing';
    return world;
  }
  if (world.state !== 'playing' || world.frozen) return world;
  if (k >= '1' && k <= '7') {
    const bin = BIN_ORDER[Number(k) - 1];
    if (bin) {
      world.selectedBin = bin;
      addIngredient(world, bin);
    }
    return world;
  }
  if (k === ' ') {
    serve(world);
    return world;
  }
  if (k === 't') {
    trashPlate(world);
    return world;
  }
  return world;
}
