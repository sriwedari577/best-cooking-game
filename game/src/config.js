// Dapur Kilat — tuning, menu data and station geometry.
// Every rect here is shared by render.js (drawing) and input.js (hit-testing),
// so what the player sees is exactly what the player can click.
// The playfield is 1280x480, so a screenshot at that size fills the frame.

export const VIEW = { w: 1280, h: 480 };

// Shift tuning. Money is in rupiah; the target is one busy lunch shift.
export const TUNING = {
  shiftSeconds: 180,
  targetMoney: 150000,
  hearts: 3,
  orderSeconds: 45,
  rushOrderSeconds: 34,
  spawnSeconds: 12,
  rushSpawnSeconds: 8,
  rushBigChance: 0.5,
  rushAtSecondsLeft: 60,
  grillSeconds: 4.5,
  burnSeconds: 9,
  maxOrders: 3,
  chefSpeed: 430,
  tipMax: 6000,
};

// Ingredients. `grill` means the item must be grilled before it can be served.
export const INGREDIENTS = [
  { id: 'nasi',    label: 'Nasi',    key: '1', grill: false, base: '#f7f3e6', dot: '#d8cfae' },
  { id: 'mie',     label: 'Mie',     key: '2', grill: false, base: '#f2c94c', dot: '#d9a92e' },
  { id: 'ayam',    label: 'Ayam',    key: '3', grill: true,  base: '#e8a06a', dot: '#b96a35' },
  { id: 'sate',    label: 'Sate',    key: '4', grill: true,  base: '#a9713d', dot: '#7a4a22' },
  { id: 'telur',   label: 'Telur',   key: '5', grill: true,  base: '#fdf6d8', dot: '#f0b429' },
  { id: 'sayur',   label: 'Sayur',   key: '6', grill: false, base: '#7cb95c', dot: '#4d8a38' },
  { id: 'sambal',  label: 'Sambal',  key: '7', grill: false, base: '#d43d2a', dot: '#8f1f12' },
  { id: 'kerupuk', label: 'Kerupuk', key: '8', grill: false, base: '#f6e3b4', dot: '#d9b878' },
];

export const INGREDIENT_BY_ID = Object.fromEntries(INGREDIENTS.map((g) => [g.id, g]));

// Recipes: each ticket is one dish; `items` lists exactly what the plate must hold.
export const RECIPES = [
  { id: 'nasi-ayam',  name: 'Nasi Ayam Sambal',   items: ['nasi', 'ayam', 'sambal'],  price: 15000 },
  { id: 'mie-telur',  name: 'Mie Telur Sayur',    items: ['mie', 'telur', 'sayur'],   price: 14000 },
  { id: 'sate-nasi',  name: 'Sate Nasi Kerupuk',  items: ['nasi', 'sate', 'kerupuk'], price: 18000 },
  { id: 'nasi-telur', name: 'Nasi Telur Kerupuk', items: ['nasi', 'telur', 'kerupuk'], price: 13000 },
  { id: 'mie-ayam',   name: 'Mie Ayam Sayur',     items: ['mie', 'ayam', 'sayur'],    price: 16000 },
  { id: 'sate-mie',   name: 'Sate Mie Sambal',    items: ['mie', 'sate', 'sambal'],   price: 17000 },
  { id: 'nasi-goreng', name: 'Nasi Goreng Spesial', items: ['nasi', 'ayam', 'telur', 'sambal'], price: 22000 },
  { id: 'mie-komplit',  name: 'Mie Komplit',        items: ['mie', 'sate', 'telur', 'sayur'],  price: 21000 },
  { id: 'sayur-sambal', name: 'Sayur Sambal Kerupuk', items: ['sayur', 'sambal', 'kerupuk'], price: 12000 },
  { id: 'mie-kerupuk',  name: 'Mie Kerupuk Sambal', items: ['mie', 'kerupuk', 'sambal'],      price: 13000 },
];

// Station geometry (canvas coordinates, 1280x480).
export const GEO = {
  hud: { x: 0, y: 0, w: 1280, h: 54 },
  board: { x: 16, y: 60, w: 1248, h: 86 },
  ticket: { w: 400, h: 82, gap: 24 },
  counter: { x: 16, y: 152, w: 420, h: 188 },
  bins: { x: 32, y: 182, w: 92, h: 62, gapX: 8, gapY: 8, cols: 4 },
  grill: { x: 460, y: 152, w: 252, h: 188 },
  grillSlot: { w: 104, h: 84 },
  plate: { x: 736, y: 152, w: 252, h: 188 },
  serve: { x: 1012, y: 152, w: 252, h: 188 },
  trash: { x: 16, y: 348, w: 118, h: 58 },
  floor: { x: 0, y: 344, w: 1280, h: 88 },
  help: { x: 16, y: 438, w: 1248, h: 36 },
};

// Anchor points the chef walks to for each station.
export const ANCHORS = {
  counter: { x: 226, y: 388 },
  grill: { x: 586, y: 388 },
  plate: { x: 862, y: 388 },
  serve: { x: 1138, y: 388 },
  trash: { x: 76, y: 392 },
};

export function binRect(index) {
  const b = GEO.bins;
  const col = index % b.cols;
  const row = Math.floor(index / b.cols);
  return {
    x: b.x + col * (b.w + b.gapX),
    y: b.y + row * (b.h + b.gapY),
    w: b.w,
    h: b.h,
  };
}

export function grillSlotRect(slot) {
  const g = GEO.grill;
  return {
    x: g.x + 22 + slot * (GEO.grillSlot.w + 8),
    y: g.y + 62,
    w: GEO.grillSlot.w,
    h: GEO.grillSlot.h,
  };
}

export function ticketRect(slot) {
  const t = GEO.ticket;
  return {
    x: GEO.board.x + slot * (t.w + t.gap),
    y: GEO.board.y + 2,
    w: t.w,
    h: t.h,
  };
}

export function stationAt(x, y) {
  // Returns the station under a point, or null. The small bins win over the
  // big counter rect, so a bin click never reads as a plain counter click.
  for (let i = 0; i < INGREDIENTS.length; i++) {
    const r = binRect(i);
    if (x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) return { kind: 'bin', id: INGREDIENTS[i].id };
  }
  const g = GEO.grill;
  if (x >= g.x && x <= g.x + g.w && y >= g.y && y <= g.y + g.h) return { kind: 'grill' };
  const p = GEO.plate;
  if (x >= p.x && x <= p.x + p.w && y >= p.y && y <= p.y + p.h) return { kind: 'plate' };
  const s = GEO.serve;
  if (x >= s.x && x <= s.x + s.w && y >= s.y && y <= s.y + s.h) return { kind: 'serve' };
  const t = GEO.trash;
  if (x >= t.x && x <= t.x + t.w && y >= t.y && y <= t.y + t.h) return { kind: 'trash' };
  return null;
}
