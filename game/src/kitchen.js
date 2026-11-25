// Dapur Kilat — the kitchen rules: pick, grill, assemble, serve, trash.
// Every player action funnels through here so mouse, keyboard, the staged
// screenshots and the self-test all play by exactly the same rules.

import { INGREDIENT_BY_ID, TUNING } from './config.js';
import { say, popup, burst, checkGameOver } from './state.js';

export function pickIngredient(state, id, sfx) {
  const def = INGREDIENT_BY_ID[id];
  if (!def) return false;
  state.selected = id;
  if (state.hand) {
    say(state, 'Tangan penuh! Taruh dulu di piring atau tempat sampah.', '#ffd54a');
    return false;
  }
  state.hand = { id, cooked: false, burnt: false };
  if (sfx) sfx.pick();
  return true;
}

export function placeOnGrill(state, sfx) {
  if (!state.hand) return false;
  const def = INGREDIENT_BY_ID[state.hand.id];
  if (!def.grill) {
    say(state, `${def.label} tidak perlu dipanggang.`, '#ffd54a');
    return false;
  }
  if (state.hand.cooked) {
    say(state, `${def.label} sudah matang, langsung ke piring.`, '#ffd54a');
    return false;
  }
  const free = state.grill.findIndex((s) => s === null);
  if (free === -1) {
    say(state, 'Panggangan penuh! Angkat dulu yang sudah matang.', '#ffd54a');
    return false;
  }
  state.grill[free] = { id: state.hand.id, progress: 0, done: false, burnt: false };
  state.hand = null;
  if (sfx) sfx.sizzle();
  return true;
}

export function takeFromGrill(state, slot, sfx) {
  // With no slot given, take the first ready item (done first, then burnt so
  // the player can bin it); a named slot takes exactly that slot.
  let index = slot;
  if (index === undefined || index === null) {
    index = state.grill.findIndex((s) => s && s.done && !s.burnt);
    if (index === -1) index = state.grill.findIndex((s) => s && s.burnt);
    if (index === -1) index = state.grill.findIndex((s) => s && !s.done);
  }
  const item = state.grill[index];
  if (!item) return false;
  if (state.hand) {
    say(state, 'Tangan penuh! Kosongkan dulu tanganmu.', '#ffd54a');
    return false;
  }
  if (item.burnt) {
    state.hand = { id: item.id, cooked: true, burnt: true };
    state.grill[index] = null;
    say(state, `${INGREDIENT_BY_ID[item.id].label} gosong! Buang ke tempat sampah.`, '#ff8a7a');
    if (sfx) sfx.pick();
    return true;
  }
  if (!item.done) {
    say(state, 'Belum matang! Tunggu sampai kecokelatan.', '#ffd54a');
    return false;
  }
  state.hand = { id: item.id, cooked: true, burnt: false };
  state.grill[index] = null;
  state.stats.grilled += 1;
  if (sfx) sfx.pick();
  return true;
}

export function addToPlate(state, sfx) {
  if (!state.hand) {
    say(state, 'Piring kosong — ambil bahan dulu dari counter.', '#ffd54a');
    return false;
  }
  if (state.hand.burnt) {
    say(state, 'Bahan gosong tidak bisa disajikan! Buang dulu.', '#ff8a7a');
    return false;
  }
  state.dish.push({ id: state.hand.id, cooked: state.hand.cooked, burnt: false });
  burst(state, 862, 250, '#ffe9a8', 8);
  state.hand = null;
  if (sfx) sfx.chop();
  return true;
}

export function trash(state, sfx) {
  if (state.hand) {
    state.hand = null;
    state.stats.trashed += 1;
    if (sfx) sfx.trash();
    say(state, 'Bahan dibuang.', '#cfd8dc');
    return true;
  }
  if (state.dish.length > 0) {
    state.dish = [];
    state.stats.trashed += 1;
    if (sfx) sfx.trash();
    say(state, 'Piring dikosongkan.', '#cfd8dc');
    return true;
  }
  say(state, 'Tidak ada yang dibuang.', '#cfd8dc');
  return false;
}

// The serve check: the plate must hold exactly the ticket's items, every item
// that needs grilling must be cooked, and nothing may be burnt. Item order
// on the plate does not matter.
export function dishMatches(recipe, dish) {
  if (dish.length !== recipe.items.length) return false;
  if (dish.some((d) => d.burnt)) return false;
  const want = [...recipe.items].sort();
  const have = dish.map((d) => d.id).sort();
  if (want.join() !== have.join()) return false;
  return dish.every((d) => !INGREDIENT_BY_ID[d.id].grill || d.cooked);
}

export function serveDish(state, sfx) {
  if (state.dish.length === 0) {
    say(state, 'Belum ada hidangan di piring!', '#ffd54a');
    return false;
  }
  const match = state.orders.find((o) => dishMatches(o.recipe, state.dish));
  if (!match) {
    state.hearts -= 1;
    state.failed += 1;
    state.combo = 0;
    state.dish = [];
    say(state, 'Hidangan salah! Pelanggan kecewa. -1 hati', '#ff8a7a');
    if (sfx) sfx.fail();
    checkGameOver(state);
    return false;
  }
  const remain = Math.max(0, match.timeLeft / match.total);
  let tip = Math.round(remain * TUNING.tipMax);
  if (state.rush) tip = Math.round(tip * 1.5);
  state.combo += 1;
  state.bestCombo = Math.max(state.bestCombo, state.combo);
  const comboBonus = (state.combo - 1) * 1000;
  const earned = match.recipe.price + tip + comboBonus;
  state.money += earned;
  state.served += 1;
  state.orders = state.orders.filter((o) => o.id !== match.id);
  state.servedDisplay = { items: state.dish.map((d) => ({ id: d.id, cooked: d.cooked, burnt: false })), until: state.elapsed + 4, name: match.recipe.name };
  state.bellUntil = state.elapsed + 0.8;
  popup(state, 1138, 210, `+Rp ${earned.toLocaleString('id-ID')}`, '#7ddc6a');
  burst(state, 1138, 250, '#ffd54a', 16);
  say(state, `${match.recipe.name} tersaji! +Rp ${earned.toLocaleString('id-ID')}${state.combo > 1 ? ` (kombo x${state.combo})` : ''}`, '#7ddc6a');
  state.dish = [];
  if (sfx) sfx.serve();
  return true;
}

// One dispatch for keyboard/mouse actions at a station: the chef must be
// near the station, which main.js enforces before calling this.
export function actAtStation(state, station, sfx) {
  if (station.kind === 'bin') return pickIngredient(state, station.id, sfx);
  if (station.kind === 'grill') {
    if (state.hand && INGREDIENT_BY_ID[state.hand.id].grill && !state.hand.cooked) return placeOnGrill(state, sfx);
    return takeFromGrill(state, undefined, sfx);
  }
  if (station.kind === 'plate') return addToPlate(state, sfx);
  if (station.kind === 'serve') return serveDish(state, sfx);
  if (station.kind === 'trash') return trash(state, sfx);
  return false;
}
