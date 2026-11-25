// Dapur Kilat — game state and the order lifecycle.
// Pure logic: no drawing here. render.js reads this state, kitchen.js mutates it.
// Order picks go through the seeded `rng` carried on the state, so a staged
// screenshot and a live game share the same spawning code.

import { TUNING, RECIPES } from './config.js';
import { pickFrom } from './random.js';

let nextOrderId = 1;

export function createState(rng) {
  return {
    screen: 'title', // 'title' | 'play' | 'pause' | 'over'
    won: false,
    timeLeft: TUNING.shiftSeconds,
    money: 0,
    hearts: TUNING.hearts,
    combo: 0,
    bestCombo: 0,
    served: 0,
    failed: 0,
    orders: [], // { id, recipe, timeLeft, total, slot }
    spawnIn: 4,
    hand: null, // { id, cooked, burnt } | null
    dish: [], // [{ id, cooked, burnt }]
    grill: [null, null], // null | { id, progress, done, burnt }
    rush: false,
    message: '',
    messageUntil: 0,
    elapsed: 0,
    popups: [], // { x, y, text, color, until }
    particles: [], // { x, y, vx, vy, life, age, color, size }
    servedDisplay: null, // { items, until } — finished plate shown at the window
    bellUntil: 0,
    rushBannerUntil: 0,
    platePopUntil: 0,
    lastTickSecond: -1,
    stats: { grilled: 0, burnt: 0, trashed: 0 },
    rng: rng || Math.random,
    selected: 'nasi',
  };
}

export function rushActive(state) {
  return state.timeLeft <= TUNING.rushAtSecondsLeft;
}

export function orderSeconds(state) {
  return rushActive(state) ? TUNING.rushOrderSeconds : TUNING.orderSeconds;
}

// Patience: every ticket carries one. It scales the ticket's countdown
// and is drawn as a badge, so the player plans around the impatient ones.
export const PATIENCE = [
  { id: 'santai', label: 'SANTAI', factor: 1.25, color: '#2e7d32' },
  { id: 'biasa', label: 'BIASA', factor: 1.0, color: '#8a6d1a' },
  { id: 'buru', label: 'BURU-BURU', factor: 0.8, color: '#b3261e' },
];

export function patienceById(id) {
  return PATIENCE.find((p) => p.id === id) || PATIENCE[1];
}

function pickPatience(rng) {
  const roll = rng();
  if (roll < 0.25) return PATIENCE[0];
  if (roll < 0.75) return PATIENCE[1];
  return PATIENCE[2];
}

export function spawnOrder(state, recipe) {
  if (state.orders.length >= TUNING.maxOrders) return null;
  // During the rush, half the spawns are the big four-item specials: more
  // planning, same two grill slots, no extra chores.
  const big = RECIPES.filter((r) => r.items.length === 4);
  const pool = rushActive(state) && big.length > 0 && state.rng() < TUNING.rushBigChance ? big : RECIPES;
  const picked = recipe || pickFrom(state.rng, pool);
  const patience = pickPatience(state.rng);
  const total = Math.round(orderSeconds(state) * patience.factor);
  const slot = firstFreeSlot(state);
  const order = { id: nextOrderId++, recipe: picked, timeLeft: total, total, slot, patience };
  state.orders.push(order);
  return order;
}

function firstFreeSlot(state) {
  const used = new Set(state.orders.map((o) => o.slot));
  for (let i = 0; i < TUNING.maxOrders; i++) if (!used.has(i)) return i;
  return 0;
}

export function failOrder(state, order, reason) {
  state.orders = state.orders.filter((o) => o.id !== order.id);
  state.hearts -= 1;
  state.failed += 1;
  state.combo = 0;
  say(state, reason === 'expired'
    ? `Pesanan ${order.recipe.name} hangus! -1 hati`
    : `Hidangan salah! -1 hati`, '#ff8a7a');
}

export function tickOrders(state, dt) {
  // Returns expired orders so the caller can play the fail sound.
  const expired = [];
  for (const order of [...state.orders]) {
    order.timeLeft -= dt;
    if (order.timeLeft <= 0) {
      failOrder(state, order, 'expired');
      expired.push(order);
    }
  }
  return expired;
}

export function tickGrill(state, dt) {
  // Returns slots that just finished cooking or just burnt.
  const events = [];
  state.grill.forEach((slot, i) => {
    if (!slot) return;
    slot.progress += dt;
    if (!slot.done && slot.progress >= TUNING.grillSeconds) {
      slot.done = true;
      events.push({ slot: i, kind: 'done' });
    }
    if (!slot.burnt && slot.progress >= TUNING.burnSeconds) {
      slot.burnt = true;
      state.stats.burnt += 1;
      events.push({ slot: i, kind: 'burnt' });
    }
  });
  return events;
}

export function tickSpawn(state, dt) {
  state.spawnIn -= dt;
  if (state.spawnIn <= 0) {
    spawnOrder(state);
    state.spawnIn = rushActive(state) ? TUNING.rushSpawnSeconds : TUNING.spawnSeconds;
  }
}

export function tickClock(state, dt) {
  state.timeLeft -= dt;
  state.elapsed += dt;
  if (!state.rush && rushActive(state)) {
    state.rush = true;
    state.rushBannerUntil = state.elapsed + 2.4;
    say(state, 'JAM SIBUK! Pesanan lebih cepat, tip naik 50%!', '#ffd54a');
  }
  if (state.timeLeft <= 0) {
    state.timeLeft = 0;
    endShift(state);
  }
}

export function endShift(state) {
  state.screen = 'over';
  state.won = state.money >= TUNING.targetMoney;
}

export function checkGameOver(state) {
  if (state.hearts <= 0 && state.screen === 'play') {
    state.hearts = 0;
    state.screen = 'over';
    state.won = false;
  }
}

export function say(state, text, color) {
  state.message = text;
  state.messageUntil = state.elapsed + 2.6;
  state.messageColor = color || '#ffffff';
}

export function popup(state, x, y, text, color) {
  state.popups.push({ x, y, text, color, until: state.elapsed + 1.4 });
}

export function burst(state, x, y, color, n) {
  const count = n || 10;
  for (let i = 0; i < count; i++) {
    const a = state.rng() * Math.PI * 2;
    const sp = 40 + state.rng() * 90;
    state.particles.push({
      x, y,
      vx: Math.cos(a) * sp,
      vy: Math.sin(a) * sp - 40,
      life: 0.5 + state.rng() * 0.4,
      age: 0,
      color,
      size: 3 + state.rng() * 4,
    });
  }
}

export function tickFx(state, dt) {
  state.popups = state.popups.filter((p) => state.elapsed < p.until);
  state.particles = state.particles.filter((p) => {
    p.age += dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vy += 160 * dt;
    return p.age < p.life;
  });
  if (state.servedDisplay && state.elapsed > state.servedDisplay.until) state.servedDisplay = null;
}
