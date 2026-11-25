// Dapur Kilat — deterministic screenshot staging.
// `?shot=cover|assembly|serve|rush|title` arranges a real game state through the
// same state objects and the same renderer the player sees, so every
// screenshot is a genuine render of the game's own code in a browser —
// never edited, composited or borrowed. The staged states are built with
// the same orders, dishes, grill slots and served plates the rules produce:
// the cover is a mid-shift kitchen with three timed tickets, a plate
// mid-assembly, the grill working, and a finished plate at the window.
// The game loop keeps ticking in shot mode, but staging freezes spawning
// (spawnIn is huge) and the clock (shots set their own timeLeft), and the
// main loop paints twice and sets window.__shotReady for the capture.

import { RECIPES } from './config.js';
import { patienceById } from './state.js';

function findRecipe(id) {
  return RECIPES.find((r) => r.id === id);
}

function makeOrder(id, recipeId, timeLeft, total, slot, patienceId) {
  return { id, recipe: findRecipe(recipeId), timeLeft, total, slot, patience: patienceById(patienceId || 'biasa') };
}

export function stageShot(state, chef, name) {
  state.spawnIn = 99999;
  state.elapsed = 12;
  state.message = '';
  state.messageUntil = 0;
  state.popups = [];
  state.particles = [];
  state.servedDisplay = null;
  state.bellUntil = 0;
  if (name === 'title') {
    state.screen = 'title';
    return;
  }
  state.screen = 'play';
  state.timeLeft = 96;
  state.money = 87500;
  state.hearts = 3;
  state.combo = 2;
  state.served = 5;

  if (name === 'cover') {
    // The full game at its busiest and most readable: three tickets with
    // timers, ingredients on the counter, a dish mid-assembly on the plate,
    // the grill working, the chef carrying the last ingredient, and a
    // finished plate waiting at the serve window.
    state.orders = [
      makeOrder(1, 'nasi-ayam', 38, 45, 0, 'biasa'),
      makeOrder(2, 'mie-telur', 21, 45, 1, 'buru'),
      makeOrder(3, 'sate-nasi', 30, 45, 2, 'santai'),
    ];
    state.dish = [
      { id: 'nasi', cooked: false, burnt: false },
      { id: 'ayam', cooked: true, burnt: false },
    ];
    state.hand = { id: 'sambal', cooked: false, burnt: false };
    state.grill = [
      { id: 'ayam', progress: 4.5, done: true, burnt: false },
      { id: 'sate', progress: 2.2, done: false, burnt: false },
    ];
    state.servedDisplay = {
      items: [
        { id: 'mie', cooked: false, burnt: false },
        { id: 'telur', cooked: true, burnt: false },
        { id: 'sayur', cooked: false, burnt: false },
      ],
      until: 99999,
      name: 'Mie Telur Sayur',
    };
    chef.x = 700;
    chef.y = 388;
    chef.facing = 1;
  } else if (name === 'assembly') {
    // One ticket, the plate mid-assembly, the chef carrying the grilled
    // protein, steam over the grill.
    state.orders = [makeOrder(1, 'nasi-ayam', 31, 45, 1)];
    state.dish = [{ id: 'nasi', cooked: false, burnt: false }];
    state.hand = { id: 'ayam', cooked: true, burnt: false };
    state.grill = [
      { id: 'sate', progress: 3.1, done: false, burnt: false },
      null,
    ];
    state.money = 42000;
    state.combo = 1;
    state.served = 2;
    chef.x = 830;
    chef.y = 388;
    chef.facing = 1;
  } else if (name === 'serve') {
    // The serve moment: chef at the window, bell ringing, the finished
    // plate on the counter, the payout popping.
    state.orders = [
      makeOrder(1, 'sate-mie', 26, 45, 0, 'biasa'),
      makeOrder(2, 'nasi-goreng', 38, 45, 1, 'santai'),
      makeOrder(3, 'mie-kerupuk', 33, 45, 2, 'buru'),
    ];
    state.dish = [];
    state.hand = null;
    state.grill = [
      { id: 'telur', progress: 3.4, done: false, burnt: false },
      null,
    ];
    state.servedDisplay = {
      items: [
        { id: 'mie', cooked: false, burnt: false },
        { id: 'sate', cooked: true, burnt: false },
        { id: 'sambal', cooked: false, burnt: false },
      ],
      until: 99999,
      name: 'Sate Mie Sambal',
    };
    state.bellUntil = 99999;
    // A normal popup lifetime: the lift in drawFx is (until - elapsed), so
    // a huge `until` would throw the text off-screen.
    state.popups = [{ x: 1138, y: 210, text: '+Rp 21.500', color: '#7ddc6a', until: 13.4 }];
    state.money = 109000;
    state.combo = 3;
    state.served = 6;
    chef.x = 1162;
    chef.y = 388;
    chef.facing = -1;
  } else if (name === 'rush') {
    // The closing rush, mid-assembly: one ticket nearly out of time (red
    // bar), the JAM SIBUK badge and banner up, one heart already lost, the
    // chef carrying the last item of the oldest ticket to the plate.
    state.timeLeft = 47;
    state.rush = true;
    state.orders = [
      makeOrder(1, 'mie-ayam', 8, 34, 0, 'buru'),
      makeOrder(2, 'nasi-telur', 24, 34, 1, 'biasa'),
      makeOrder(3, 'sate-mie', 29, 34, 2, 'santai'),
    ];
    state.dish = [
      { id: 'mie', cooked: false, burnt: false },
      { id: 'ayam', cooked: true, burnt: false },
    ];
    state.hand = { id: 'sayur', cooked: false, burnt: false };
    state.grill = [
      { id: 'sate', progress: 2.2, done: false, burnt: false },
      { id: 'ayam', progress: 4.5, done: true, burnt: false },
    ];
    state.servedDisplay = {
      items: [
        { id: 'mie', cooked: false, burnt: false },
        { id: 'ayam', cooked: true, burnt: false },
        { id: 'sayur', cooked: false, burnt: false },
      ],
      until: 99999,
      name: 'Mie Ayam Sayur',
    };
    state.rushBannerUntil = 9999;
    state.message = 'JAM SIBUK! Pesanan lebih cepat, tip naik 50%!';
    state.messageUntil = 9999;
    state.messageColor = '#ffd54a';
    state.money = 121000;
    state.hearts = 2;
    state.combo = 4;
    state.served = 8;
    chef.x = 700;
    chef.y = 388;
    chef.facing = 1;
  } else if (name === 'depth') {
    // Depth: three tickets at once including a four-item special, both
    // grill slots working, a three-item dish mid-assembly, chef carrying
    // the final item from between the stations so the plate stays visible.
    state.orders = [
      makeOrder(1, 'nasi-goreng', 40, 45, 0, 'buru'),
      makeOrder(2, 'mie-komplit', 28, 45, 1, 'biasa'),
      makeOrder(3, 'sayur-sambal', 18, 45, 2, 'santai'),
    ];
    state.dish = [
      { id: 'nasi', cooked: false, burnt: false },
      { id: 'ayam', cooked: true, burnt: false },
      { id: 'telur', cooked: true, burnt: false },
    ];
    state.hand = { id: 'sambal', cooked: false, burnt: false };
    state.grill = [
      { id: 'ayam', progress: 4.5, done: true, burnt: false },
      { id: 'sate', progress: 2.6, done: false, burnt: false },
    ];
    state.money = 132000;
    state.combo = 5;
    state.served = 9;
    chef.x = 700;
    chef.y = 388;
    chef.facing = 1;
  } else {
    // Unknown shot name: fall back to the cover staging.
    stageShot(state, chef, 'cover');
    return;
  }
  chef.tx = null;
  chef.ty = null;
  chef.pending = null;
  chef.moving = false;
}
