// Dapur Kilat — boot, game loop, action wiring and the built-in self-test.
// The loop ticks state only while the screen is 'play'; every other screen
// renders frozen state underneath its overlay. With ?shot= the staged scene
// is arranged first, painted twice, and window.__shotReady is set so a
// headless capture knows the frame is the real game state.

import { TUNING, INGREDIENT_BY_ID } from './config.js';
import { createState, spawnOrder, tickOrders, tickGrill, tickSpawn, tickClock, tickFx, checkGameOver, say } from './state.js';
import { createChef, tickChef, nearestStation, walkToStation, arrivedPending, stopChef } from './chef.js';
import { pickIngredient, placeOnGrill, takeFromGrill, addToPlate, serveDish, trash } from './kitchen.js';
import { render } from './render.js';
import { attachInput, stationForAction } from './input.js';
import { createSfx } from './audio.js';
import { stageShot } from './shots.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const statusEl = document.getElementById('status');
const selftestEl = document.getElementById('selftest');

const state = createState();
const chef = createChef();
const sfx = createSfx();
const ui = { hover: null, hoverBtn: null, muted: false, soundBtn: null, pauseBtn: null, startBtn: null, restartBtn: null };
const keys = { left: false, right: false, up: false, down: false };

// Exposed for the self-test and for debugging in the browser console.
window.__dk = { state, chef, ui, keys };

function startShift() {
  const fresh = createState();
  Object.assign(state, fresh);
  Object.assign(chef, createChef());
  state.screen = 'play';
  spawnOrder(state);
  spawnOrder(state);
  state.spawnIn = TUNING.spawnSeconds;
  say(state, 'Shift dimulai! Sajikan 2 pesanan pertama.', '#ffe9c4');
  statusEl.textContent = 'Shift dimulai. Sajikan pesanan sebelum timer habis.';
  sfx.bell();
}

function grillAction() {
  if (state.hand && INGREDIENT_BY_ID[state.hand.id].grill && !state.hand.cooked) {
    placeOnGrill(state, sfx);
    return;
  }
  if (!state.hand) {
    const doneIdx = state.grill.findIndex((s) => s && s.done && !s.burnt);
    if (doneIdx !== -1) { takeFromGrill(state, doneIdx, sfx); return; }
    const burntIdx = state.grill.findIndex((s) => s && s.burnt);
    if (burntIdx !== -1) {
      // A burnt item is carried in hand to the trash, like every other
      // burnt pickup in kitchen.js — it is never silently binned here.
      takeFromGrill(state, burntIdx, sfx);
      return;
    }
    if (state.grill.some((s) => s)) say(state, 'Masih memanggang — tunggu sampai matang.', '#ffd54a');
    else say(state, 'Panggangan kosong. Bawa bahan yang harus dipanggang.', '#ffd54a');
    return;
  }
  placeOnGrill(state, sfx);
}

function doAction(kind, id) {
  if (kind === 'pick') {
    pickIngredient(state, id, sfx);
  } else if (kind === 'pickNearest') {
    // E on the counter: grab the first missing item of the oldest ticket.
    const oldest = state.orders[0];
    const missing = oldest
      ? oldest.recipe.items.find((item) => !state.dish.some((d) => d.id === item))
      : null;
    pickIngredient(state, missing || 'nasi', sfx);
  } else if (kind === 'grill') {
    grillAction();
  } else if (kind === 'plate') {
    addToPlate(state, sfx);
  } else if (kind === 'serve') {
    serveDish(state, sfx);
  } else if (kind === 'trash') {
    trash(state, sfx);
  }
}

function requestAction(kind, id) {
  if (state.screen !== 'play') return;
  const station = stationForAction(kind);
  const near = nearestStation(chef);
  if (near === station) {
    doAction(kind, id);
  } else {
    walkToStation(chef, station, { kind, id });
  }
}

function walkToPoint(x, y) {
  stopChef(chef);
  chef.tx = Math.max(30, Math.min(1250, x));
  chef.ty = Math.max(352, Math.min(424, y));
  chef.pending = null;
}

function togglePause() {
  if (state.screen === 'play') {
    state.screen = 'pause';
    sfx.stopSizzle();
  } else if (state.screen === 'pause') {
    state.screen = 'play';
  }
}

function toggleMute() {
  ui.muted = !sfx.toggle();
  if (!ui.muted) sfx.click();
}

attachInput(canvas, {
  state, chef, ui, keys, sfx, nearestStation,
  requestAction,
  walkToPoint,
  startGame: startShift,
  restartGame: startShift,
  togglePause,
  toggleMute,
});

let last = performance.now();
let sizzleOn = false;
let paints = 0;

const params = new URLSearchParams(location.search);
const shot = params.get('shot');
if (shot) stageShot(state, chef, shot);

function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  if (state.screen === 'play') {
    tickChef(chef, dt, keys);
    const pending = arrivedPending(chef);
    if (pending) doAction(pending.kind, pending.id);
    const expired = tickOrders(state, dt);
    if (expired.length) sfx.fail();
    const grillEvents = tickGrill(state, dt);
    for (const ev of grillEvents) {
      if (ev.kind === 'done') sfx.bell();
      if (ev.kind === 'burnt') sfx.fail();
    }
    tickSpawn(state, dt);
    tickClock(state, dt);
    if (state.timeLeft <= 10 && state.timeLeft > 0) {
      const sec = Math.ceil(state.timeLeft);
      if (sec !== state.lastTickSecond) {
        state.lastTickSecond = sec;
        sfx.tick();
      }
    }
    tickFx(state, dt);
    checkGameOver(state);
    const cooking = state.grill.some((s) => s && !s.done);
    if (cooking && !sizzleOn) { sfx.startSizzle(); sizzleOn = true; }
    if (!cooking && sizzleOn) { sfx.stopSizzle(); sizzleOn = false; }
  } else {
    tickFx(state, dt);
    if (sizzleOn) { sfx.stopSizzle(); sizzleOn = false; }
  }
  render(ctx, state, chef, ui);
  paints += 1;
  if (shot && paints >= 2) window.__shotReady = true;
  requestAnimationFrame(frame);
}

// Leaving the tab pauses a running game rather than letting orders expire unseen.
document.addEventListener('visibilitychange', () => {
  if (document.hidden && state.screen === 'play') {
    state.screen = 'pause';
  }
});

requestAnimationFrame(frame);

// ---- Built-in self-test (?selftest=1) ----
// Drives the game through real DOM keyboard/mouse events and reports
// PASS/FAIL into #selftest and document.title for headless checking.
if (params.get('selftest') === '1') {
  selftestEl.style.display = 'block';
  runSelfTest();
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function clickAt(x, y) {
  const r = canvas.getBoundingClientRect();
  const cx = r.left + (x / 1280) * r.width;
  const cy = r.top + (y / 480) * r.height;
  canvas.dispatchEvent(new MouseEvent('mousemove', { clientX: cx, clientY: cy, bubbles: true }));
  canvas.dispatchEvent(new MouseEvent('click', { clientX: cx, clientY: cy, bubbles: true }));
}

function binCenter(id) {
  const index = Object.keys(INGREDIENT_BY_ID).indexOf(id);
  const col = index % 4;
  const row = Math.floor(index / 4);
  return { x: 32 + col * 100 + 46, y: 182 + row * 70 + 31 };
}

function key(k, type) {
  window.dispatchEvent(new KeyboardEvent(type || 'keydown', { key: k, bubbles: true }));
}

async function waitFor(fn, label, timeout) {
  const t0 = performance.now();
  const limit = timeout || 15000;
  while (!fn()) {
    if (performance.now() - t0 > limit) throw new Error(`timeout waiting for ${label}`);
    await sleep(50);
  }
}

async function walkAndAct(x, y, label) {
  clickAt(x, y);
  await waitFor(() => chef.tx === null && !chef.pending, label);
  await sleep(80);
}

async function runSelfTest() {
  const notes = [];
  const note = (s) => { notes.push(s); selftestEl.textContent = notes.join(' | '); };
  try {
    note('boot screen=' + state.screen);
    if (state.screen !== 'title') throw new Error('expected title screen');
    await waitFor(() => ui.startBtn !== null, 'first frame renders the start button');
    await sleep(50);
    clickAt(640, 392); // MULAI MASAK button
    await sleep(150);
    if (state.screen !== 'play') throw new Error('start button did not start the shift');
    if (state.orders.length < 1) throw new Error('no orders spawned');
    note('shift started, orders=' + state.orders.length);

    // Pause and resume with P.
    key('p');
    await sleep(80);
    if (state.screen !== 'pause') throw new Error('P did not pause');
    key('p');
    await sleep(80);
    if (state.screen !== 'play') throw new Error('P did not resume');
    note('pause ok');

    // Read the oldest ticket, then build exactly that dish: grill the
    // items that need grilling, carry the rest straight to the plate.
    const ticket = state.orders[0];
    for (const id of ticket.recipe.items) {
      const bin = binCenter(id);
      await walkAndAct(bin.x, bin.y, 'arrive at counter for ' + id);
      if (!state.hand || state.hand.id !== id) throw new Error('hand should hold ' + id);
      if (INGREDIENT_BY_ID[id].grill) {
        await walkAndAct(586, 260, 'arrive at grill for ' + id);
        if (state.grill.every((s) => s === null)) throw new Error('grill should hold the item');
        await waitFor(() => state.grill.some((s) => s && s.done), 'grill done for ' + id);
        note('grilled ' + id);
        await walkAndAct(586, 260, 'arrive at grill to take ' + id);
        if (!state.hand || !state.hand.cooked) throw new Error('hand should hold cooked ' + id);
      }
      await walkAndAct(862, 260, 'arrive at plate for ' + id);
    }
    if (state.dish.length !== ticket.recipe.items.length) {
      throw new Error('dish incomplete: ' + JSON.stringify(state.dish));
    }
    note('dish complete: ' + ticket.recipe.name);

    // Serve at the window.
    const moneyBefore = state.money;
    await walkAndAct(1138, 260, 'arrive at serve window');
    if (state.money <= moneyBefore) throw new Error('serve did not pay');
    if (state.served < 1) throw new Error('served count did not rise');
    note('served, money=' + state.money);

    // Keyboard movement still works.
    const x0 = chef.x;
    key('ArrowLeft');
    await sleep(250);
    key('ArrowLeft', 'keyup');
    if (!(chef.x < x0)) throw new Error('keyboard move did not move chef left');
    note('keyboard move ok');

    // An expired order costs a heart.
    const heartsBefore = state.hearts;
    if (state.orders.length > 0) {
      state.orders[0].timeLeft = 0.05;
      await waitFor(() => state.hearts < heartsBefore, 'order expiry costs a heart', 8000);
      note('order expiry ok');
    }

    // Force the clock out and confirm the end screen.
    state.timeLeft = 0.2;
    await waitFor(() => state.screen === 'over', 'game over screen', 8000);
    note('game over ok, won=' + state.won);

    // Restart from the end screen with R.
    key('r');
    await sleep(150);
    if (state.screen !== 'play') throw new Error('R did not restart');
    note('restart ok');

    document.title = 'SELFTEST PASS';
    note('SELFTEST PASS');
  } catch (err) {
    document.title = 'SELFTEST FAIL: ' + err.message;
    note('SELFTEST FAIL: ' + err.message);
  }
}
