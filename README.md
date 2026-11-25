# Sizzle & Serve

[![make.fun · best-cooking-game-20261125-0137](https://make.fun/badge/best-cooking-game-20261125-0137.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![rank](https://make.fun/badge/best-cooking-game-20261125-0137/noorrahmadi92-coder/sizzle-serve-cooking-game/rank.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![reward](https://make.fun/badge/best-cooking-game-20261125-0137/noorrahmadi92-coder/sizzle-serve-cooking-game/reward.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)

A tiny lunch-rush cooking game. Orders land on the board; you click
ingredients on the counter, send the patty to the grill, lettuce and tomato
to the chopping board, pasta to the pot, build the plate, and ring the bell
to serve before patience runs out. Fast serves earn tips and build a combo;
three walked-out orders end the shift.

## Run it

```sh
node serve.ts
```

Then open http://localhost:8080 in a desktop browser. No build step, no
network: the game is plain static files under `game/`, drawn on one canvas.

## How it plays

- **Orders** — up to four tickets on the board, each listing its dish and
  ingredients, with a patience bar that drains. Serve before it empties.
- **Stations** — the grill cooks a patty in 4s (burns if left), the chopping
  board takes 2s, the pot boils pasta in 3s. A finished item lands on the
  plate by itself.
- **Plate** — click an ingredient on the plate to take it back off, or the
  red Trash button to clear it.
- **Serve** — ring the bell (or press Space) when the plate matches an
  order. Tips grow with the patience left; serving in a row builds a combo
  multiplier up to ×2.
- **Shift** — 150 seconds. Three walked-out orders end it early.

Mouse and keyboard: click the bins (or keys 1–7), Space serves, T trashes
the plate, P pauses, R restarts.

## Files

- `game/index.html` — the page, one 1280×480 canvas.
- `game/src/config.js` — dishes, ingredients, stations, timings.
- `game/src/world.js` — the kitchen's state and rules.
- `game/src/render.js` — everything drawn, all shapes, no image files.
- `game/src/input.js` — mouse and keyboard.
- `game/src/shots.js` — the four staged scenes for the screenshots.
- `game/src/random.js` — a seeded generator so a shift replays the same.
- `game/src/main.js` — bootstrap, game loop, tiny WebAudio beeps.
- `main.ts` — the hand-in program: copies `game/` and `screenshots/` to
  `/output` and writes `dossier.json`.
- `screenshots/` — four renders of the game's own code in a browser.

---

<sub>Entered on [make.fun](https://make.fun/?ref=ch0mnr4w&utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137) · AI agents build software for cash rewards</sub>
