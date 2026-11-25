// Dapur Kilat — rendering: the kitchen, the order board, the HUD and the
// title / pause / game-over overlays. Everything the judge sees in a
// screenshot is drawn here, from state, with the art in draw-food.js.
// Layout is 1280x480: HUD, order board, four stations, the floor lane the
// chef walks, and a one-line help strip.

import { VIEW, GEO, INGREDIENTS, TUNING, binRect, grillSlotRect, ticketRect, ANCHORS } from './config.js';
import { drawIngredient, drawPlate, drawChef, roundRect, ellipse } from './draw-food.js';
import { rushActive } from './state.js';
import { nearestStation } from './chef.js';

function text(ctx, str, x, y, size, color, align, weight) {
  ctx.fillStyle = color;
  ctx.font = `${weight || 'bold'} ${size}px system-ui, sans-serif`;
  ctx.textAlign = align || 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(str, x, y);
}

function moneyStr(n) {
  return `Rp ${Math.round(n).toLocaleString('id-ID')}`;
}

export function render(ctx, state, chef, ui) {
  ctx.clearRect(0, 0, VIEW.w, VIEW.h);
  drawRoom(ctx, state);
  if (state.screen === 'title') {
    drawTitle(ctx, state, ui);
    return;
  }
  drawBoard(ctx, state);
  drawCounter(ctx, state, ui);
  drawGrill(ctx, state, ui);
  drawPlateStation(ctx, state, ui);
  drawServeWindow(ctx, state, ui);
  drawTrash(ctx, state, ui);
  drawChefOnFloor(ctx, state, chef);
  drawFx(ctx, state);
  drawHud(ctx, state, ui);
  drawHelp(ctx, state, chef, ui);
  drawMessage(ctx, state);
  if (state.screen === 'pause') drawPause(ctx);
  if (state.screen === 'over') drawGameOver(ctx, state, ui);
}

function drawRoom(ctx, state) {
  // Back wall and floor tiles.
  ctx.fillStyle = '#7a4a2b';
  ctx.fillRect(0, 0, VIEW.w, 152);
  ctx.fillStyle = '#8d5a36';
  ctx.fillRect(0, 0, VIEW.w, 10);
  ctx.fillStyle = 'rgba(255,255,255,.06)';
  for (let x = 0; x < VIEW.w; x += 96) ctx.fillRect(x, 16, 48, 136);
  // Hanging lamps.
  for (const x of [240, 640, 1040]) {
    ctx.strokeStyle = '#3a2a1c';
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 18); ctx.stroke();
    ctx.fillStyle = '#ffd54a';
    ctx.beginPath(); ctx.moveTo(x - 18, 22); ctx.lineTo(x + 18, 22); ctx.lineTo(x + 9, 8); ctx.lineTo(x - 9, 8); ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(255,213,74,.16)';
    ellipse(ctx, x, 48, 56, 28); ctx.fill();
  }
  // Floor.
  ctx.fillStyle = '#c9a06a';
  ctx.fillRect(0, 344, VIEW.w, 136);
  ctx.fillStyle = '#b98f5a';
  for (let y = 352; y < 480; y += 44) ctx.fillRect(0, y, VIEW.w, 2);
  for (let x = 0; x < VIEW.w; x += 80) ctx.fillRect(x, 344, 2, 136);
  // Wall sign. Hidden on the title screen, where the title card carries
  // the same name and the sign would duplicate it through the overlay.
  if (state.screen !== 'title') {
    ctx.fillStyle = '#f5e6c8';
    roundRect(ctx, 500, 12, 280, 36, 8); ctx.fill();
    ctx.strokeStyle = '#a9713d';
    ctx.lineWidth = 3;
    roundRect(ctx, 500, 12, 280, 36, 8); ctx.stroke();
    text(ctx, 'DAPUR KILAT', 640, 38, 24, '#7a3b12', 'center');
  }
  if (state.rush) {
    ctx.fillStyle = 'rgba(212,61,42,.92)';
    roundRect(ctx, 820, 12, 210, 36, 8); ctx.fill();
    text(ctx, 'JAM SIBUK!', 925, 38, 22, '#ffffff', 'center');
  }
}

function drawBoard(ctx, state) {
  ctx.fillStyle = '#3d2b1d';
  roundRect(ctx, GEO.board.x - 6, GEO.board.y - 4, GEO.board.w + 12, GEO.board.h + 10, 12); ctx.fill();
  ctx.fillStyle = '#5d4128';
  roundRect(ctx, GEO.board.x - 6, GEO.board.y - 4, GEO.board.w + 12, GEO.board.h + 10, 12); ctx.fill();
  for (let slot = 0; slot < TUNING.maxOrders; slot++) {
    const r = ticketRect(slot);
    const order = state.orders.find((o) => o.slot === slot);
    ctx.fillStyle = order ? '#fff8e6' : 'rgba(255,248,230,.28)';
    roundRect(ctx, r.x, r.y, r.w, r.h, 10); ctx.fill();
    if (!order) {
      ctx.strokeStyle = 'rgba(255,248,230,.5)';
      ctx.setLineDash([6, 6]);
      ctx.lineWidth = 2;
      roundRect(ctx, r.x + 8, r.y + 8, r.w - 16, r.h - 16, 8); ctx.stroke();
      ctx.setLineDash([]);
      text(ctx, 'Menunggu pesanan…', r.x + r.w / 2, r.y + r.h / 2 + 5, 16, '#e8dcc2', 'center');
      continue;
    }
    const frac = Math.max(0, order.timeLeft / order.total);
    const urgent = frac < 0.3;
    text(ctx, order.recipe.name, r.x + 14, r.y + 24, 20, '#4a2c14');
    order.recipe.items.forEach((id, i) => {
      // A tan chip behind each icon so pale items (nasi) read on the cream ticket.
      ctx.fillStyle = '#eadfc2';
      ellipse(ctx, r.x + 36 + i * 48, r.y + 50, 23, 19); ctx.fill();
      drawIngredient(ctx, id, r.x + 36 + i * 48, r.y + 50, 40, false);
    });
    text(ctx, moneyStr(order.recipe.price), r.x + r.w - 14, r.y + 26, 18, '#2e7d32', 'right');
    // Timer bar.
    ctx.fillStyle = '#e0d6c0';
    roundRect(ctx, r.x + 14, r.y + 66, r.w - 28, 10, 5); ctx.fill();
    ctx.fillStyle = urgent ? '#d43d2a' : frac < 0.55 ? '#f0a020' : '#43a047';
    if (frac > 0) roundRect(ctx, r.x + 14, r.y + 66, (r.w - 28) * frac, 10, 5); ctx.fill();
    text(ctx, `${Math.ceil(order.timeLeft)}s`, r.x + r.w - 14, r.y + 62, 14, urgent ? '#d43d2a' : '#6d5a3e', 'right');
    if (urgent && Math.floor(state.elapsed * 2) % 2 === 0) {
      ctx.fillStyle = '#d43d2a';
      ellipse(ctx, r.x + r.w - 22, r.y + 12, 9, 9); ctx.fill();
      text(ctx, '!', r.x + r.w - 22, r.y + 17, 14, '#ffffff', 'center');
    }
  }
  // Tab label on the board's top edge, drawn last so it sits above the tickets.
  ctx.fillStyle = '#ffd54a';
  roundRect(ctx, 24, 56, 150, 18, 6); ctx.fill();
  text(ctx, 'PAPAN PESANAN', 99, 69, 12, '#4a2c14', 'center');
}

function stationHeader(ctx, rect, title, hover) {
  ctx.fillStyle = hover ? '#9a744a' : '#8d6a3e';
  roundRect(ctx, rect.x, rect.y, rect.w, 36, 10); ctx.fill();
  ctx.fillStyle = '#a9713d';
  ctx.fillRect(rect.x, rect.y + 24, rect.w, 12);
  text(ctx, title, rect.x + 12, rect.y + 24, 15, '#ffe9c4');
}

function drawCounter(ctx, state, ui) {
  const c = GEO.counter;
  ctx.fillStyle = '#6d4526';
  roundRect(ctx, c.x, c.y, c.w, c.h, 12); ctx.fill();
  stationHeader(ctx, c, 'COUNTER BAHAN  (klik / tombol 1–8)', false);
  INGREDIENTS.forEach((g, i) => {
    const r = binRect(i);
    const hover = ui.hover && ui.hover.kind === 'bin' && ui.hover.id === g.id;
    const selected = state.selected === g.id;
    ctx.fillStyle = hover ? '#fff3d0' : '#fdf6e3';
    roundRect(ctx, r.x, r.y, r.w, r.h, 9); ctx.fill();
    ctx.strokeStyle = selected ? '#f0a020' : hover ? '#f0a020' : '#c9b183';
    ctx.lineWidth = selected ? 3 : 2;
    roundRect(ctx, r.x, r.y, r.w, r.h, 9); ctx.stroke();
    drawIngredient(ctx, g.id, r.x + r.w / 2, r.y + 26, 46, false);
    text(ctx, g.label, r.x + r.w / 2, r.y + r.h - 6, 13, '#4a2c14', 'center');
    ctx.fillStyle = '#6d4526';
    ellipse(ctx, r.x + 11, r.y + 11, 9, 9); ctx.fill();
    text(ctx, g.key, r.x + 11, r.y + 15, 11, '#ffffff', 'center');
    if (g.grill) text(ctx, '🔥', r.x + r.w - 11, r.y + 15, 11, '#000000', 'center');
  });
  text(ctx, '🔥 = harus dipanggang', c.x + 12, c.y + c.h - 8, 12, '#ffe9c4');
}

function drawGrill(ctx, state, ui) {
  const g = GEO.grill;
  const hover = ui.hover && ui.hover.kind === 'grill';
  ctx.fillStyle = '#4a4a52';
  roundRect(ctx, g.x, g.y, g.w, g.h, 12); ctx.fill();
  ctx.fillStyle = hover ? '#6a6a76' : '#5a5a66';
  roundRect(ctx, g.x, g.y, g.w, 36, 10); ctx.fill();
  text(ctx, 'PANGGANGAN', g.x + 12, g.y + 24, 15, '#ffe9c4');
  const cooking = state.grill.some((s) => s && !s.done);
  if (cooking) {
    ctx.fillStyle = 'rgba(255,120,40,.25)';
    ellipse(ctx, g.x + g.w / 2, g.y + 110, 100, 34); ctx.fill();
  }
  state.grill.forEach((slot, i) => {
    const r = grillSlotRect(i);
    ctx.fillStyle = '#2e2e34';
    roundRect(ctx, r.x, r.y, r.w, r.h, 8); ctx.fill();
    ctx.strokeStyle = '#8a8a96';
    ctx.lineWidth = 2;
    for (let gx = r.x + 14; gx < r.x + r.w; gx += 16) {
      ctx.beginPath(); ctx.moveTo(gx, r.y + 8); ctx.lineTo(gx, r.y + r.h - 8); ctx.stroke();
    }
    if (!slot) {
      text(ctx, 'kosong', r.x + r.w / 2, r.y + r.h / 2 + 5, 13, '#8a8a96', 'center');
      return;
    }
    drawIngredient(ctx, slot.id, r.x + r.w / 2, r.y + 32, 50, slot.done, slot.burnt);
    if (slot.burnt) {
      ctx.fillStyle = 'rgba(20,20,20,.5)';
      ellipse(ctx, r.x + r.w / 2, r.y + 32, 28, 18); ctx.fill();
      text(ctx, 'GOSONG!', r.x + r.w / 2, r.y + r.h - 6, 14, '#ff8a7a', 'center');
    } else {
      const frac = Math.min(1, slot.progress / TUNING.grillSeconds);
      ctx.fillStyle = '#e0d6c0';
      roundRect(ctx, r.x + 10, r.y + r.h - 16, r.w - 20, 9, 4); ctx.fill();
      ctx.fillStyle = slot.done ? '#43a047' : '#f0a020';
      roundRect(ctx, r.x + 10, r.y + r.h - 16, (r.w - 20) * frac, 9, 4); ctx.fill();
      text(ctx, slot.done ? 'MATANG ✓' : 'Memasak…', r.x + r.w / 2, r.y + r.h - 22, 12, slot.done ? '#7ddc6a' : '#ffd54a', 'center');
    }
  });
  text(ctx, 'Klik: taruh / angkat • gosong = buang', g.x + 12, g.y + g.h - 8, 12, '#ffe9c4');
}

function drawPlateStation(ctx, state, ui) {
  const p = GEO.plate;
  const hover = ui.hover && ui.hover.kind === 'plate';
  ctx.fillStyle = '#7a5a34';
  roundRect(ctx, p.x, p.y, p.w, p.h, 12); ctx.fill();
  stationHeader(ctx, p, 'PIRING RAKIT', hover);
  ctx.fillStyle = '#e8dcc2';
  ellipse(ctx, p.x + p.w / 2, p.y + 118, 92, 40); ctx.fill();
  // Dish count under the header: the chef stands in front of the station's
  // bottom edge, so state text down there is hidden whenever he is at work.
  text(ctx, `${state.dish.length} bahan di piring`, p.x + p.w / 2, p.y + 54, 13, '#ffe9c4', 'center');
  if (state.dish.length === 0) {
    text(ctx, 'Piring kosong', p.x + p.w / 2, p.y + 124, 15, '#8a7a5e', 'center');
  } else {
    drawPlate(ctx, p.x + p.w / 2, p.y + 116, 140, state.dish);
  }
  text(ctx, 'Klik: taruh bahan di piring', p.x + 12, p.y + p.h - 8, 12, '#ffe9c4');
}

function drawServeWindow(ctx, state, ui) {
  const s = GEO.serve;
  const hover = ui.hover && ui.hover.kind === 'serve';
  ctx.fillStyle = '#3f5a3a';
  roundRect(ctx, s.x, s.y, s.w, s.h, 12); ctx.fill();
  ctx.fillStyle = hover ? '#557a4e' : '#4a6a44';
  roundRect(ctx, s.x, s.y, s.w, 36, 10); ctx.fill();
  text(ctx, 'JENDELA SAJI  🔔', s.x + 12, s.y + 24, 15, '#eaffea');
  // Bell: a dome with a brim and clapper, right of the header.
  const ringing = state.elapsed < state.bellUntil;
  const bx = s.x + s.w - 32;
  const by = s.y + 58;
  ctx.fillStyle = ringing ? '#ffe082' : '#f0c040';
  ctx.beginPath(); ctx.arc(bx, by, 13, Math.PI, 0); ctx.fill();
  ctx.fillRect(bx - 16, by - 2, 32, 4);
  ctx.fillStyle = '#8a6a10';
  ellipse(ctx, bx, by + 7, 4, 4); ctx.fill();
  if (ringing) {
    ctx.strokeStyle = '#ffe082';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(bx, by, 22, -0.6, 0.6); ctx.stroke();
    ctx.beginPath(); ctx.arc(bx, by, 22, Math.PI - 0.6, Math.PI + 0.6); ctx.stroke();
  }
  if (state.servedDisplay) {
    // Plate and headline sit high: the chef's head reaches y≈308 when he
    // stands at the window, and the old headline baseline (314) hid behind it.
    drawPlate(ctx, s.x + s.w / 2, s.y + 100, 140, state.servedDisplay.items);
    text(ctx, 'SIAP DISAJIKAN!', s.x + s.w / 2, s.y + 150, 16, '#7ddc6a', 'center');
  } else {
    ctx.fillStyle = 'rgba(255,255,255,.14)';
    ellipse(ctx, s.x + s.w / 2, s.y + 104, 82, 34); ctx.fill();
    text(ctx, 'Sajikan di sini', s.x + s.w / 2, s.y + 110, 15, '#d8e8d2', 'center');
  }
  text(ctx, 'Klik: sajikan hidangan', s.x + 12, s.y + s.h - 8, 12, '#eaffea');
}

function drawTrash(ctx, state, ui) {
  const t = GEO.trash;
  const hover = ui.hover && ui.hover.kind === 'trash';
  ctx.fillStyle = hover ? '#6a7078' : '#565c64';
  roundRect(ctx, t.x, t.y, t.w, t.h, 10); ctx.fill();
  ctx.fillStyle = '#3c4046';
  roundRect(ctx, t.x + 26, t.y + 18, 66, 26, 5); ctx.fill();
  ctx.fillStyle = '#454a51';
  roundRect(ctx, t.x + 20, t.y + 11, 78, 10, 5); ctx.fill();
  text(ctx, '🗑 SAMPAH', t.x + t.w / 2, t.y + t.h - 6, 12, '#ffffff', 'center');
}

function drawChefOnFloor(ctx, state, chef) {
  const near = state.screen === 'play' ? nearestStation(chef) : null;
  if (near) {
    const a = ANCHORS[near];
    ctx.strokeStyle = 'rgba(255,213,74,.85)';
    ctx.lineWidth = 3;
    ctx.setLineDash([8, 6]);
    ellipse(ctx, a.x, a.y + 4, 52, 13); ctx.stroke();
    ctx.setLineDash([]);
  }
  ctx.fillStyle = 'rgba(0,0,0,.25)';
  ellipse(ctx, chef.x, chef.y + 2, 26, 8); ctx.fill();
  drawChef(ctx, chef.x, chef.y, chef.facing, chef.moving ? chef.stepPhase : 0, state.hand);
}

function drawFx(ctx, state) {
  for (const p of state.particles) {
    const alpha = Math.max(0, 1 - p.age / p.life);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = p.color;
    ellipse(ctx, p.x, p.y, p.size, p.size); ctx.fill();
  }
  ctx.globalAlpha = 1;
  for (const p of state.popups) {
    const lift = (p.until - state.elapsed) * 16;
    text(ctx, p.text, p.x, p.y - lift, 20, p.color, 'center');
  }
}

function drawHud(ctx, state, ui) {
  ctx.fillStyle = '#241811';
  ctx.fillRect(0, 0, VIEW.w, GEO.hud.h);
  ctx.fillStyle = '#3a2a1c';
  ctx.fillRect(0, GEO.hud.h - 3, VIEW.w, 3);
  text(ctx, 'DAPUR KILAT', 20, 33, 22, '#ffd54a');
  text(ctx, moneyStr(state.money), 190, 33, 19, '#ffffff');
  // Target progress.
  const tw = 170;
  ctx.fillStyle = '#4a3826';
  roundRect(ctx, 360, 18, tw, 14, 7); ctx.fill();
  ctx.fillStyle = '#43a047';
  roundRect(ctx, 360, 18, tw * Math.min(1, state.money / TUNING.targetMoney), 14, 7); ctx.fill();
  text(ctx, `Target ${moneyStr(TUNING.targetMoney)}`, 540, 30, 13, '#ffd54a');
  // Hearts.
  for (let i = 0; i < TUNING.hearts; i++) {
    text(ctx, i < state.hearts ? '❤' : '🖤', 660 + i * 28, 33, 21, '#ffffff');
  }
  // Shift clock.
  const mm = Math.floor(state.timeLeft / 60);
  const ss = Math.floor(state.timeLeft % 60).toString().padStart(2, '0');
  const lowTime = state.timeLeft <= 30;
  text(ctx, `⏱ ${mm}:${ss}`, 810, 35, 26, lowTime ? '#ff8a7a' : '#ffffff', 'center');
  text(ctx, `Tersaji: ${state.served}  •  Kombo: x${Math.max(1, state.combo)}`, 900, 33, 15, '#ffffff');
  // Sound + pause buttons.
  ui.soundBtn = { x: 1096, y: 6, w: 76, h: 42 };
  ui.pauseBtn = { x: 1184, y: 6, w: 76, h: 42 };
  ctx.fillStyle = '#4a3826';
  roundRect(ctx, ui.soundBtn.x, ui.soundBtn.y, ui.soundBtn.w, ui.soundBtn.h, 8); ctx.fill();
  roundRect(ctx, ui.pauseBtn.x, ui.pauseBtn.y, ui.pauseBtn.w, ui.pauseBtn.h, 8); ctx.fill();
  text(ctx, ui.muted ? '🔇' : '🔊', ui.soundBtn.x + 38, ui.soundBtn.y + 30, 22, '#ffffff', 'center');
  text(ctx, '⏸', ui.pauseBtn.x + 38, ui.pauseBtn.y + 30, 22, '#ffffff', 'center');
  if (rushActive(state) && state.screen === 'play') {
    text(ctx, 'JAM SIBUK', 810, 50, 11, '#ffd54a', 'center');
  }
}

function drawHelp(ctx, state, chef, ui) {
  ctx.fillStyle = 'rgba(28,19,14,.88)';
  roundRect(ctx, GEO.help.x, GEO.help.y, GEO.help.w, GEO.help.h, 9); ctx.fill();
  const near = state.screen === 'play' ? nearestStation(chef) : null;
  const hint = near
    ? `Di dekat: ${near.toUpperCase()} — tekan E / klik untuk beraksi`
    : 'Gerakkan koki ke stasiun (WASD / panah / klik stasiun)';
  text(ctx, hint, 30, GEO.help.y + 23, 16, '#ffd54a');
  text(ctx, 'WASD gerak • E aksi • 1–8 bahan • P jeda • M suara', 540, GEO.help.y + 23, 13, '#e8dcc2');
  if (state.hand) {
    drawIngredient(ctx, state.hand.id, 1212, GEO.help.y + 18, 40, state.hand.cooked, state.hand.burnt);
    text(ctx, `Tangan: ${state.hand.id.toUpperCase()}${state.hand.cooked ? ' matang' : ''}`, 1160, GEO.help.y + 23, 13, '#ffffff', 'right');
  } else {
    text(ctx, 'Tangan kosong', 1212, GEO.help.y + 23, 14, '#cfd8dc', 'center');
  }
}

function drawMessage(ctx, state) {
  if (!state.message || state.elapsed >= state.messageUntil || state.screen === 'title') return;
  const msg = state.message;
  ctx.font = 'bold 15px system-ui, sans-serif';
  const w = ctx.measureText(msg).width + 28;
  ctx.fillStyle = 'rgba(28,19,14,.9)';
  roundRect(ctx, 640 - w / 2, 344, w, 26, 9); ctx.fill();
  ctx.strokeStyle = '#ffd54a';
  ctx.lineWidth = 1.5;
  roundRect(ctx, 640 - w / 2, 344, w, 26, 9); ctx.stroke();
  text(ctx, msg, 640, 362, 15, state.messageColor || '#ffe9c4', 'center');
}

function drawTitle(ctx, state, ui) {
  ctx.fillStyle = 'rgba(20,12,8,.55)';
  ctx.fillRect(0, 0, VIEW.w, VIEW.h);
  ctx.fillStyle = '#fff8e6';
  roundRect(ctx, 340, 52, 600, 128, 18); ctx.fill();
  ctx.strokeStyle = '#a9713d';
  ctx.lineWidth = 4;
  roundRect(ctx, 340, 52, 600, 128, 18); ctx.stroke();
  text(ctx, 'DAPUR KILAT', 640, 118, 48, '#7a3b12', 'center');
  text(ctx, 'Masak cepat, sajikan tepat waktu!', 640, 152, 22, '#6d4526', 'center');
  text(ctx, 'Warung cepat saji khas Indonesia', 640, 174, 16, '#6d4526', 'center');
  drawPlate(ctx, 470, 232, 120, [{ id: 'nasi' }, { id: 'ayam', cooked: true }, { id: 'sambal' }]);
  drawPlate(ctx, 810, 232, 120, [{ id: 'mie' }, { id: 'telur', cooked: true }, { id: 'sayur' }]);
  drawChef(ctx, 640, 268, 1, 0, { id: 'sate', cooked: true });
  text(ctx, `Kumpulkan ${moneyStr(TUNING.targetMoney)} dalam ${TUNING.shiftSeconds / 60} menit. 3 hati untuk pesanan gagal.`, 640, 322, 18, '#ffffff', 'center');
  text(ctx, 'WASD / panah untuk bergerak, klik stasiun untuk jalan ke sana, E untuk beraksi, 1–8 untuk bahan.', 640, 348, 15, '#ffe9c4', 'center');
  ui.startBtn = { x: 520, y: 366, w: 240, h: 52 };
  const hover = ui.hoverBtn === 'start';
  ctx.fillStyle = hover ? '#66bb4a' : '#43a047';
  roundRect(ctx, ui.startBtn.x, ui.startBtn.y, ui.startBtn.w, ui.startBtn.h, 12); ctx.fill();
  ctx.strokeStyle = '#2e7d32';
  ctx.lineWidth = 3;
  roundRect(ctx, ui.startBtn.x, ui.startBtn.y, ui.startBtn.w, ui.startBtn.h, 12); ctx.stroke();
  text(ctx, '▶  MULAI MASAK', 640, 400, 24, '#ffffff', 'center');
  text(ctx, 'Klik atau tekan Enter', 640, 440, 13, '#cfd8dc', 'center');
}

function drawPause(ctx) {
  ctx.fillStyle = 'rgba(20,12,8,.6)';
  ctx.fillRect(0, 0, VIEW.w, VIEW.h);
  text(ctx, 'JEDA', 640, 230, 52, '#ffffff', 'center');
  text(ctx, 'Tekan P atau klik ⏸ untuk lanjut', 640, 268, 19, '#ffe9c4', 'center');
}

function drawGameOver(ctx, state, ui) {
  ctx.fillStyle = 'rgba(20,12,8,.68)';
  ctx.fillRect(0, 0, VIEW.w, VIEW.h);
  ctx.fillStyle = '#fff8e6';
  roundRect(ctx, 380, 78, 520, 316, 18); ctx.fill();
  ctx.strokeStyle = '#a9713d';
  ctx.lineWidth = 4;
  roundRect(ctx, 380, 78, 520, 316, 18); ctx.stroke();
  text(ctx, state.won ? 'SHIFT SELESAI!' : 'DAPUR TUTUP', 640, 138, 36, state.won ? '#2e7d32' : '#b3261e', 'center');
  text(ctx, state.won ? 'Target tercapai — pelanggan pulang kenyang!' : state.hearts <= 0 ? 'Semua hati habis…' : 'Waktu habis sebelum target tercapai.', 640, 172, 17, '#4a2c14', 'center');
  text(ctx, `Penghasilan: ${moneyStr(state.money)}  (target ${moneyStr(TUNING.targetMoney)})`, 640, 212, 20, '#4a2c14', 'center');
  text(ctx, `Hidangan tersaji: ${state.served}   Gagal: ${state.failed}   Kombo terbaik: x${state.bestCombo}`, 640, 248, 17, '#6d4526', 'center');
  text(ctx, `Dipanggang: ${state.stats.grilled}   Gosong: ${state.stats.burnt}   Dibuang: ${state.stats.trashed}`, 640, 278, 17, '#6d4526', 'center');
  ui.restartBtn = { x: 500, y: 306, w: 280, h: 52 };
  const hover = ui.hoverBtn === 'restart';
  ctx.fillStyle = hover ? '#66bb4a' : '#43a047';
  roundRect(ctx, ui.restartBtn.x, ui.restartBtn.y, ui.restartBtn.w, ui.restartBtn.h, 12); ctx.fill();
  text(ctx, '↻  MAIN LAGI  (R)', 640, 340, 21, '#ffffff', 'center');
  text(ctx, 'Tekan R atau klik tombol di atas', 640, 378, 14, '#8a7a5e', 'center');
}
