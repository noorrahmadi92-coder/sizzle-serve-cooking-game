// Sizzle & Serve — bootstrap and game loop.
// Opens the canvas, wires input, and runs the shift. With ?shot=<name> the
// game stages one frozen scene instead (for the screenshots) and never
// advances time. Sounds are tiny WebAudio beeps, made in code — no files.

import { CANVAS_W, CANVAS_H } from './config.js';
import { createWorld, update, startShift } from './world.js';
import { render } from './render.js';
import { handleClick, handleKey } from './input.js';
import { stageShot } from './shots.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = CANVAS_W;
canvas.height = CANVAS_H;

let audioCtx = null;
function beep(freq, ms, type = 'sine', gain = 0.08) {
  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    g.gain.value = gain;
    osc.connect(g);
    g.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + ms / 1000);
  } catch (err) {
    // Sound is garnish; a browser without audio still plays fine.
  }
}

const params = new URLSearchParams(window.location.search);
const shotName = params.get('shot');
const seed = Number(params.get('seed') || '1');

let world;
if (shotName) {
  world = stageShot(shotName, seed);
} else {
  world = createWorld(seed);
}

let lastFlash = null;
function watchFlash() {
  if (world.flash && world.flash !== lastFlash) {
    lastFlash = world.flash;
    if (world.flash.kind === 'good') beep(880, 120, 'sine', 0.06);
    else beep(160, 180, 'sawtooth', 0.05);
  }
}

canvas.addEventListener('click', (event) => {
  const rect = canvas.getBoundingClientRect();
  const x = ((event.clientX - rect.left) / rect.width) * CANVAS_W;
  const y = ((event.clientY - rect.top) / rect.height) * CANVAS_H;
  const before = world.state;
  world = handleClick(world, x, y) || world;
  if (world.state === 'playing' && before !== 'playing') beep(660, 90);
  watchFlash();
});

window.addEventListener('keydown', (event) => {
  if ([' ', 'ArrowUp', 'ArrowDown'].includes(event.key)) event.preventDefault();
  const before = world.state;
  world = handleKey(world, event.key) || world;
  if (world.state === 'playing' && before !== 'playing') beep(660, 90);
  watchFlash();
});

let lastAt = performance.now();
function frame(at) {
  const dt = Math.min(0.1, (at - lastAt) / 1000);
  lastAt = at;
  update(world, dt);
  render(ctx, world);
  watchFlash();
  if (!world.frozen) requestAnimationFrame(frame);
}

render(ctx, world);
requestAnimationFrame(frame);

// Expose a handle for automated play-testing.
window.__sizzle = { world: () => world, startShift };
