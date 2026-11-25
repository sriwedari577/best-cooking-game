# best-cooking-game

[![make.fun · best-cooking-game-20261125-0137](https://make.fun/badge/best-cooking-game-20261125-0137.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![rank](https://make.fun/badge/best-cooking-game-20261125-0137/sriwedari577/best-cooking-game/rank.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![reward](https://make.fun/badge/best-cooking-game-20261125-0137/sriwedari577/best-cooking-game/reward.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)

# Dapur Kilat — Make the best cooking game

**Dapur Kilat** (Lightning Kitchen) is an original, complete cooking game
that runs offline in a desktop browser from static files — no network
requests, no libraries, vanilla JavaScript and Canvas only.

You run a small Indonesian street-food kitchen. Orders appear on the order
board with a countdown timer. Walk the chef around the kitchen (WASD /
arrow keys, or click a station to walk there), grab ingredients from the
counter, grill the proteins that need it, assemble each dish on the plate,
and serve it at the window before the timer runs out. Earn Rp 150.000
before the 3-minute shift ends, with 3 hearts for failed or expired
orders. In the last minute the closing rush hits: orders arrive faster,
their timers shorten, and tips grow 50%.

## How to play

- **Move:** WASD / arrow keys, or click any station (or open floor) to
  walk the chef there. Actions only land when the chef is standing at the
  station, so routing through the kitchen is part of the game.
- **Interact:** `E`, `Space`, or click: pick up, grill, assemble, serve.
- **Ingredients:** keys `1`–`8` at the counter, or click a bin. The `E`
  key at the counter grabs the first missing item of the oldest ticket.
- **Grill:** ayam, sate and telur must be grilled (marked 🔥). Two grill
  slots, about 4.5 seconds to cook — left too long, food burns, and a
  burnt item must be carried to the trash.
- **Serve:** the plate must hold exactly the ticket's items, grilled
  where the recipe needs it, nothing burnt. A wrong dish costs a heart.
  Serving fast earns a tip; serving in a row builds a combo bonus.
- **Pause:** `P` (or the ⏸ button). **Sound:** `M`. **Restart:** `R`
  on the end screen.

## Menu

Eight ingredients — nasi, mie, ayam, sate, telur, sayur, sambal,
kerupuk — combine into six dishes: Nasi Ayam Sambal, Mie Telur Sayur,
Sate Nasi Kerupuk, Nasi Telur Kerupuk, Mie Ayam Sayur, and Sate Mie
Sambal. Recipes share ingredients, so consecutive tickets pull the chef
between the counter, the grill and the plate in different orders, and
grilling two proteins at once is usually the fastest route.

## Layout

- `game/index.html` — the page; everything is drawn on one canvas.
- `game/src/main.js` — boot, game loop, action wiring, built-in
  self-test (`?selftest=1`).
- `game/src/config.js` — tuning, recipes, ingredients, station geometry.
- `game/src/random.js` — the small seeded random generator.
- `game/src/state.js` — game state, order lifecycle, scoring.
- `game/src/kitchen.js` — the kitchen rules: pick, grill, assemble,
  serve, trash.
- `game/src/chef.js` — chef movement and station proximity.
- `game/src/draw-food.js` — all food and character art, drawn in code.
- `game/src/render.js` — draws the kitchen, board, HUD and overlays.
- `game/src/input.js` — keyboard and mouse handling.
- `game/src/audio.js` — synthesized WebAudio sound effects, no files.
- `game/src/shots.js` — deterministic screenshot staging
  (`?shot=cover|assembly|serve|rush|title`).
- `main.ts` — hands `game/` and `screenshots/` in with a dossier.
- `screenshots/` — real renders of this game's own code in a browser:
  the full kitchen, the title screen, the closing rush, and a serve.

## Run it

Serve `game/` with any static HTTP server and open `game/index.html`
in desktop Chrome. It plays with zero network requests (the page even
carries an inline empty favicon so the browser makes no favicon
request). Running `main.ts` twice with `MAKEFUN_OUTPUT_DIR` set writes
byte-identical output both times.

## License

MIT. See `LICENSE`.
