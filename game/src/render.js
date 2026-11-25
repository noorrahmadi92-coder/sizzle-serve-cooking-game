// Sizzle & Serve — everything the player sees, drawn on one canvas.
// All art is drawn shapes (no image files), so the game loads nothing over
// the network and every screenshot is a render of this file's own code.

import {
  CANVAS_W, CANVAS_H, SHIFT_SECONDS, STATIONS, INGREDIENTS, RECIPES,
  BIN_ORDER,
} from './config.js';
import { orderPatienceLeft, recipeMatches, plateMatchesAnyOrder, LAYOUT } from './world.js';

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function text(ctx, s, x, y, size, color, weight = '700', align = 'left') {
  ctx.fillStyle = color;
  ctx.font = `${weight} ${size}px Trebuchet MS, Verdana, sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(s, x, y);
}

function formatTime(seconds) {
  const s = Math.max(0, Math.ceil(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

// One ingredient, drawn as a small picture, centred at (cx, cy).
export function drawIngredient(ctx, id, cx, cy, s) {
  const u = s / 48;
  ctx.save();
  ctx.translate(cx, cy);
  if (id === 'bun') {
    ctx.fillStyle = '#E8B96A';
    rr(ctx, -20 * u, -8 * u, 40 * u, 16 * u, 8 * u);
    ctx.fill();
    ctx.fillStyle = '#F5D9A0';
    ctx.beginPath();
    ctx.ellipse(0, -8 * u, 20 * u, 9 * u, 0, Math.PI, 0);
    ctx.fill();
    ctx.fillStyle = '#FFF3D0';
    for (const [dx, dy] of [[-10, -10], [0, -13], [10, -10], [-5, -6], [6, -7]]) {
      ctx.beginPath();
      ctx.ellipse(dx * u, dy * u, 2.2 * u, 1.4 * u, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (id === 'patty') {
    ctx.fillStyle = '#8B5A2B';
    rr(ctx, -21 * u, -9 * u, 42 * u, 18 * u, 9 * u);
    ctx.fill();
    ctx.strokeStyle = '#5E3A17';
    ctx.lineWidth = 2 * u;
    for (const dx of [-12, -4, 4, 12]) {
      ctx.beginPath();
      ctx.moveTo(dx * u, -7 * u);
      ctx.lineTo(dx * u, 7 * u);
      ctx.stroke();
    }
  } else if (id === 'lettuce') {
    ctx.fillStyle = '#5CB85C';
    for (const [dx, dy, rx] of [[-10, 2, 12], [0, -4, 13], [10, 2, 12]]) {
      ctx.beginPath();
      ctx.ellipse(dx * u, dy * u, rx * u, 9 * u, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.strokeStyle = '#3E8E3E';
    ctx.lineWidth = 1.5 * u;
    ctx.beginPath();
    ctx.moveTo(-14 * u, 0);
    ctx.quadraticCurveTo(0, -10 * u, 14 * u, 0);
    ctx.stroke();
  } else if (id === 'tomato') {
    ctx.fillStyle = '#D94F3D';
    ctx.beginPath();
    ctx.arc(0, 2 * u, 15 * u, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#4E9A4E';
    ctx.beginPath();
    ctx.moveTo(0, -8 * u);
    ctx.lineTo(-7 * u, -15 * u);
    ctx.lineTo(0, -11 * u);
    ctx.lineTo(7 * u, -15 * u);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.beginPath();
    ctx.ellipse(-5 * u, -3 * u, 4 * u, 2.5 * u, -0.5, 0, Math.PI * 2);
    ctx.fill();
  } else if (id === 'cheese') {
    ctx.fillStyle = '#F2C230';
    ctx.beginPath();
    ctx.moveTo(-20 * u, 10 * u);
    ctx.lineTo(20 * u, 10 * u);
    ctx.lineTo(20 * u, -2 * u);
    ctx.lineTo(-8 * u, -12 * u);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#D9A416';
    for (const [dx, dy] of [[-6, 2], [6, 4], [12, -2]]) {
      ctx.beginPath();
      ctx.arc(dx * u, dy * u, 2.5 * u, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (id === 'pasta') {
    ctx.strokeStyle = '#F0D060';
    ctx.lineWidth = 4 * u;
    ctx.lineCap = 'round';
    for (let i = -1; i <= 1; i++) {
      ctx.beginPath();
      ctx.moveTo(-18 * u, i * 8 * u);
      ctx.bezierCurveTo(-8 * u, (i * 8 - 7) * u, 8 * u, (i * 8 + 7) * u, 18 * u, i * 8 * u);
      ctx.stroke();
    }
  } else if (id === 'sauce') {
    ctx.fillStyle = '#C0392B';
    ctx.beginPath();
    ctx.moveTo(0, -16 * u);
    ctx.quadraticCurveTo(12 * u, 2 * u, 12 * u, 8 * u);
    ctx.quadraticCurveTo(12 * u, 16 * u, 0, 16 * u);
    ctx.quadraticCurveTo(-12 * u, 16 * u, -12 * u, 8 * u);
    ctx.quadraticCurveTo(-12 * u, 2 * u, 0, -16 * u);
    ctx.fill();
    ctx.fillStyle = '#E8E8E8';
    ctx.fillRect(-4 * u, -20 * u, 8 * u, 5 * u);
  }
  ctx.restore();
}

function drawProgressRing(ctx, cx, cy, r, fraction, color) {
  ctx.strokeStyle = 'rgba(0,0,0,0.18)';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = color;
  ctx.beginPath();
  ctx.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.min(1, fraction));
  ctx.stroke();
}

function drawStation(ctx, world, name, box, label, accent) {
  const st = world.stations[name];
  const spec = STATIONS[name];
  ctx.fillStyle = '#FFF8EC';
  rr(ctx, box.x, box.y, box.w, box.h, 12);
  ctx.fill();
  ctx.strokeStyle = '#D8C3A0';
  ctx.lineWidth = 2;
  ctx.stroke();
  text(ctx, label, box.x + 14, box.y + 18, 15, '#6B4F2A', '800');
  if (name === 'grill') {
    ctx.fillStyle = '#3A3A3A';
    rr(ctx, box.x + 14, box.y + 34, box.w - 28, 52, 8);
    ctx.fill();
    ctx.strokeStyle = '#222';
    for (let i = 1; i < 5; i++) {
      ctx.beginPath();
      ctx.moveTo(box.x + 14 + i * ((box.w - 28) / 5), box.y + 36);
      ctx.lineTo(box.x + 14 + i * ((box.w - 28) / 5), box.y + 84);
      ctx.stroke();
    }
  } else if (name === 'board') {
    ctx.fillStyle = '#E8C98F';
    rr(ctx, box.x + 14, box.y + 34, box.w - 28, 52, 8);
    ctx.fill();
    ctx.strokeStyle = '#C9A86A';
    ctx.stroke();
  } else if (name === 'pot') {
    ctx.fillStyle = '#4A6FA5';
    rr(ctx, box.x + 14, box.y + 34, box.w - 28, 52, 10);
    ctx.fill();
    ctx.fillStyle = '#7FA8D8';
    ctx.fillRect(box.x + 18, box.y + 38, box.w - 36, 8);
    if (st.item) {
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      for (const dx of [-14, 0, 14]) {
        ctx.beginPath();
        ctx.arc(box.x + box.w / 2 + dx, box.y + 52, 4, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
  if (st.item) {
    const cx = box.x + box.w / 2;
    const cy = box.y + 60;
    if (name === 'grill') {
      ctx.fillStyle = 'rgba(255,120,40,0.85)';
      ctx.beginPath();
      ctx.moveTo(cx - 26, box.y + 84);
      ctx.quadraticCurveTo(cx - 12, box.y + 62, cx, box.y + 84);
      ctx.quadraticCurveTo(cx + 12, box.y + 62, cx + 26, box.y + 84);
      ctx.fill();
    }
    drawIngredient(ctx, st.item, cx, cy, 44);
    const cooked = world.now - st.startedAt;
    const frac = cooked / spec.cookSeconds;
    drawProgressRing(ctx, cx + 30, cy - 24, 11, frac, frac >= 1 ? '#2E9E5B' : accent);
    if (frac >= 1) text(ctx, 'READY', cx, box.y + 102, 13, '#2E9E5B', '800', 'center');
  } else {
    text(ctx, 'empty', box.x + box.w / 2, box.y + 60, 13, '#B09A7A', '600', 'center');
  }
  if (st.burnt) text(ctx, 'burnt!', box.x + box.w / 2, box.y + 102, 13, '#C0392B', '800', 'center');
}

function drawOrderTicket(ctx, world, order, x, y, w, h, highlight) {
  const recipe = RECIPES[order.dish];
  const left = orderPatienceLeft(order, world.now);
  const frac = left / order.patience;
  ctx.fillStyle = highlight ? '#FFF3C4' : '#FFFFFF';
  rr(ctx, x, y, w, h, 10);
  ctx.fill();
  ctx.strokeStyle = highlight ? '#E8B93C' : '#D8C3A0';
  ctx.lineWidth = highlight ? 3 : 2;
  ctx.stroke();
  text(ctx, `#${order.id} ${recipe.name}`, x + 10, y + 16, 14, '#3A2E22', '800');
  text(ctx, `$${recipe.price}`, x + w - 10, y + 16, 14, '#2E7D32', '800', 'right');
  let ix = x + 12;
  for (const ing of recipe.needs) {
    drawIngredient(ctx, ing, ix + 11, y + 40, 24);
    ix += 26;
  }
  const barY = y + h - 12;
  ctx.fillStyle = '#E8DDD0';
  rr(ctx, x + 10, barY, w - 20, 7, 3);
  ctx.fill();
  ctx.fillStyle = frac > 0.5 ? '#2E9E5B' : frac > 0.25 ? '#E8A13C' : '#C0392B';
  rr(ctx, x + 10, barY, (w - 20) * frac, 7, 3);
  ctx.fill();
}

function drawBins(ctx, world) {
  const box = LAYOUT.bins;
  ctx.fillStyle = '#8A5A2B';
  rr(ctx, box.x, box.y, box.w, box.h, 14);
  ctx.fill();
  ctx.fillStyle = '#A9713A';
  rr(ctx, box.x + 6, box.y + 6, box.w - 12, box.h - 12, 10);
  ctx.fill();
  text(ctx, 'COUNTER — click an ingredient to add it', box.x + 14, box.y + 18, 13, '#F5E6C8', '800');
  const n = BIN_ORDER.length;
  const bw = (box.w - 24) / n;
  BIN_ORDER.forEach((id, i) => {
    const bx = box.x + 12 + i * bw;
    const by = box.y + 30;
    const bh = box.h - 42;
    const busy = INGREDIENTS[id].station !== null && world.stations[INGREDIENTS[id].station].item !== null;
    ctx.fillStyle = world.selectedBin === id ? '#FFE9A8' : '#FFF8EC';
    rr(ctx, bx + 4, by, bw - 8, bh, 10);
    ctx.fill();
    if (busy) {
      ctx.fillStyle = 'rgba(120,90,40,0.25)';
      rr(ctx, bx + 4, by, bw - 8, bh, 10);
      ctx.fill();
    }
    drawIngredient(ctx, id, bx + bw / 2, by + 38, 46);
    text(ctx, INGREDIENTS[id].name, bx + bw / 2, by + 78, 14, '#3A2E22', '800', 'center');
    const st = INGREDIENTS[id].station;
    text(ctx, st ? `→ ${STATIONS[st].label}` : '→ plate', bx + bw / 2, by + 96, 11, '#8A6D4B', '600', 'center');
    text(ctx, `[${i + 1}]`, bx + bw / 2, by + bh - 12, 11, '#B09A7A', '600', 'center');
  });
}

export function render(ctx, world) {
  ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
  // Wall and floor.
  ctx.fillStyle = '#F7E8C9';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  ctx.fillStyle = '#EFD9AE';
  for (let x = 0; x < CANVAS_W; x += 64) {
    ctx.fillRect(x, 300, 62, 2);
  }
  ctx.fillStyle = '#E8D5A8';
  ctx.fillRect(0, 300, CANVAS_W, 180);

  // Top bar.
  const top = LAYOUT.topBar;
  ctx.fillStyle = '#2F3E46';
  ctx.fillRect(top.x, top.y, top.w, top.h);
  text(ctx, 'SIZZLE & SERVE', 16, 28, 24, '#FFD166', '800');
  text(ctx, 'take orders · chop · grill · plate · serve', 250, 30, 13, '#B8C4C9', '600');
  const timeLeft = world.timeLeft;
  const low = timeLeft <= 20 && world.state === 'playing';
  ctx.fillStyle = low ? '#C0392B' : '#FFFFFF';
  rr(ctx, 640, 10, 130, 36, 8);
  ctx.fill();
  text(ctx, `⏱ ${formatTime(timeLeft)}`, 705, 29, 20, low ? '#FFFFFF' : '#2F3E46', '800', 'center');
  text(ctx, `🪙 ${world.coins}`, 810, 29, 20, '#FFD166', '800');
  text(ctx, `served ${world.served}`, 920, 29, 16, '#FFFFFF', '700');
  text(ctx, `lost ${world.lost}`, 1010, 29, 16, '#E8A13C', '700');
  if (world.combo >= 2) {
    text(ctx, `combo ×${(1 + Math.min(1, (world.combo - 1) * 0.1)).toFixed(1)}`, 1100, 29, 16, '#7ED491', '800');
  }

  // Order board.
  const board = LAYOUT.board;
  ctx.fillStyle = '#2F3E46';
  rr(ctx, board.x, board.y, board.w, board.h, 10);
  ctx.fill();
  text(ctx, 'ORDER BOARD', board.x + 12, board.y + 16, 13, '#FFD166', '800');
  if (world.orders.length === 0) {
    text(ctx, 'No orders yet — the lunch rush is coming…', board.x + 150, board.y + 44, 15, '#B8C4C9', '600');
  } else {
    const match = plateMatchesAnyOrder(world);
    const tw = 240;
    world.orders.forEach((order, i) => {
      drawOrderTicket(ctx, world, order, board.x + 150 + i * (tw + 12), board.y + 8, tw, board.h - 16, match === order);
    });
  }

  // Stations.
  drawStation(ctx, world, 'grill', LAYOUT.grill, 'GRILL', '#E8730C');
  drawStation(ctx, world, 'board', LAYOUT.boardStation, 'CHOPPING BOARD', '#2E9E5B');
  drawStation(ctx, world, 'pot', LAYOUT.pot, 'POT', '#4A6FA5');

  // The plate being assembled.
  const pl = LAYOUT.plate;
  ctx.fillStyle = '#FFF8EC';
  rr(ctx, pl.x, pl.y, pl.w, pl.h, 12);
  ctx.fill();
  ctx.strokeStyle = '#D8C3A0';
  ctx.lineWidth = 2;
  ctx.stroke();
  text(ctx, 'PLATE', pl.x + 14, pl.y + 18, 15, '#6B4F2A', '800');
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.ellipse(pl.x + pl.w / 2, pl.y + 68, 78, 30, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#D8D8D8';
  ctx.stroke();
  if (world.plate.length === 0) {
    text(ctx, 'empty plate', pl.x + pl.w / 2, pl.y + 68, 13, '#B09A7A', '600', 'center');
  } else {
    const n = world.plate.length;
    world.plate.forEach((ing, i) => {
      const x = pl.x + pl.w / 2 + (i - (n - 1) / 2) * 34;
      drawIngredient(ctx, ing, x, pl.y + 66 - (i % 2) * 6, 36);
    });
    const match = plateMatchesAnyOrder(world);
    text(ctx, match ? `= ${RECIPES[match.dish].name} ✓` : 'not a recipe yet', pl.x + pl.w / 2, pl.y + 106, 12, match ? '#2E9E5B' : '#8A6D4B', '800', 'center');
  }

  // Serve bell.
  const bell = LAYOUT.bell;
  const match = plateMatchesAnyOrder(world);
  ctx.fillStyle = match ? '#FFE9A8' : '#FFF8EC';
  rr(ctx, bell.x, bell.y, bell.w, bell.h, 12);
  ctx.fill();
  ctx.strokeStyle = match ? '#E8B93C' : '#D8C3A0';
  ctx.lineWidth = match ? 3 : 2;
  ctx.stroke();
  ctx.fillStyle = '#E8B93C';
  ctx.beginPath();
  ctx.arc(bell.x + bell.w / 2, bell.y + 52, 30, Math.PI, 0);
  ctx.fill();
  ctx.fillRect(bell.x + bell.w / 2 - 30, bell.y + 50, 60, 8);
  ctx.fillStyle = '#2F3E46';
  ctx.beginPath();
  ctx.arc(bell.x + bell.w / 2 + 34, bell.y + 60, 5, 0, Math.PI * 2);
  ctx.fill();
  text(ctx, 'SERVE', bell.x + bell.w / 2, bell.y + 96, 16, match ? '#2E7D32' : '#6B4F2A', '800', 'center');
  if (match) text(ctx, 'ready!', bell.x + bell.w / 2, bell.y + 14, 12, '#2E9E5B', '800', 'center');

  // Ingredient counter.
  drawBins(ctx, world);

  // Trash button.
  const tr = LAYOUT.trash;
  ctx.fillStyle = '#C0392B';
  rr(ctx, tr.x, tr.y, tr.w, tr.h, 8);
  ctx.fill();
  text(ctx, '🗑 Trash plate', tr.x + tr.w / 2, tr.y + 21, 13, '#FFFFFF', '800', 'center');

  // Message toast.
  if (world.message && world.now - world.messageAt < 3) {
    const colors = { good: '#2E9E5B', bad: '#C0392B', info: '#2F3E46' };
    ctx.fillStyle = colors[world.messageKind] || '#2F3E46';
    const w = ctx.measureText(world.message).width + 28;
    rr(ctx, (CANVAS_W - w) / 2, 300, w, 30, 15);
    ctx.fill();
    text(ctx, world.message, CANVAS_W / 2, 316, 14, '#FFFFFF', '700', 'center');
  }

  // Flash on serve / mistake.
  if (world.flash && world.now - world.flash.at < 0.25) {
    ctx.fillStyle = world.flash.kind === 'good' ? 'rgba(46,158,91,0.12)' : 'rgba(192,57,43,0.12)';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  }

  // Screens.
  if (world.state === 'title') drawTitle(ctx);
  if (world.state === 'paused') drawPaused(ctx);
  if (world.state === 'over') drawOver(ctx, world);
}

function drawTitle(ctx) {
  ctx.fillStyle = 'rgba(47,62,70,0.88)';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  text(ctx, 'SIZZLE & SERVE', CANVAS_W / 2, 110, 52, '#FFD166', '800', 'center');
  text(ctx, 'A tiny lunch-rush cooking game', CANVAS_W / 2, 160, 20, '#FFFFFF', '600', 'center');
  const lines = [
    '1 · Orders appear on the board — each one lists its ingredients.',
    '2 · Click an ingredient on the counter. Patty goes to the grill, lettuce',
    '     and tomato to the chopping board, pasta to the pot — the rest go',
    '     straight to the plate. Take a cooked item off its station in time!',
    '3 · When the plate matches an order, ring SERVE before patience runs out.',
    '4 · Serve fast for tips and combos. Three walked-out orders end the shift.',
  ];
  lines.forEach((line, i) => text(ctx, line, CANVAS_W / 2, 210 + i * 26, 16, '#E8E0D0', '600', 'center'));
  ctx.fillStyle = '#2E9E5B';
  rr(ctx, CANVAS_W / 2 - 110, 380, 220, 52, 12);
  ctx.fill();
  text(ctx, '▶  START SHIFT', CANVAS_W / 2, 407, 22, '#FFFFFF', '800', 'center');
  text(ctx, 'mouse · keys 1-7 ingredients · Space serve · T trash · P pause', CANVAS_W / 2, 452, 13, '#B8C4C9', '600', 'center');
}

function drawPaused(ctx) {
  ctx.fillStyle = 'rgba(47,62,70,0.7)';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  text(ctx, 'PAUSED', CANVAS_W / 2, 220, 44, '#FFFFFF', '800', 'center');
  text(ctx, 'press P or click to continue', CANVAS_W / 2, 270, 16, '#E8E0D0', '600', 'center');
}

function drawOver(ctx, world) {
  ctx.fillStyle = 'rgba(47,62,70,0.9)';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  text(ctx, 'SHIFT OVER', CANVAS_W / 2, 100, 44, '#FFD166', '800', 'center');
  text(ctx, `🪙 ${world.coins} coins earned`, CANVAS_W / 2, 160, 26, '#FFFFFF', '800', 'center');
  text(ctx, `Orders served: ${world.served}   ·   Walked out: ${world.lost}   ·   Mistakes: ${world.mistakes}`, CANVAS_W / 2, 205, 17, '#E8E0D0', '600', 'center');
  text(ctx, `Best combo: ×${(1 + Math.min(1, (world.bestCombo - 1) * 0.1)).toFixed(1)} (${world.bestCombo} in a row)`, CANVAS_W / 2, 235, 17, '#E8E0D0', '600', 'center');
  const verdict = world.coins >= 150 ? 'A rush to remember — the regulars are already back!' : world.coins >= 80 ? 'A solid shift. Faster hands next time!' : 'The kitchen survived. Practice the grill timing!';
  text(ctx, verdict, CANVAS_W / 2, 275, 17, '#FFD166', '700', 'center');
  ctx.fillStyle = '#2E9E5B';
  rr(ctx, CANVAS_W / 2 - 110, 320, 220, 52, 12);
  ctx.fill();
  text(ctx, '↻  PLAY AGAIN', CANVAS_W / 2, 347, 22, '#FFFFFF', '800', 'center');
  text(ctx, 'press R or click the button', CANVAS_W / 2, 400, 13, '#B8C4C9', '600', 'center');
}
