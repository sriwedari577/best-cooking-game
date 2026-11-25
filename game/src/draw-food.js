// Dapur Kilat — all food and character art, drawn in code with canvas shapes.
// No image files: every ingredient is a small appetising drawing, sized by
// `size` (roughly its width) and centred on (x, y). `cooked` browns grilled
// items; `burnt` chars them. The same drawings appear in bins, on the grill,
// on the plate, in tickets and at the serve window, so the player learns
// each ingredient once and reads the kitchen at a glance.

import { INGREDIENT_BY_ID } from './config.js';

export function roundRect(ctx, x, y, w, h, r) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

export function ellipse(ctx, x, y, rx, ry) {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
}

function shade(id, cooked, burnt) {
  if (burnt) return { main: '#2b2118', accent: '#17100a' };
  const def = INGREDIENT_BY_ID[id];
  if (cooked && def.grill) return { main: def.dot, accent: '#6b3410' };
  return { main: def.base, accent: def.dot };
}

export function drawIngredient(ctx, id, x, y, size, cooked, burnt) {
  const s = size / 64;
  const c = shade(id, cooked, burnt);
  ctx.save();
  ctx.translate(x, y);
  if (id === 'nasi') {
    ctx.fillStyle = c.main;
    ellipse(ctx, 0, 2 * s, 30 * s, 13 * s); ctx.fill();
    ctx.strokeStyle = c.accent;
    ctx.lineWidth = 2 * s;
    ellipse(ctx, 0, 2 * s, 30 * s, 13 * s); ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ellipse(ctx, -8 * s, -4 * s, 22 * s, 12 * s); ctx.fill();
    ellipse(ctx, 8 * s, -5 * s, 20 * s, 11 * s); ctx.fill();
    ctx.fillStyle = c.accent;
    for (let i = 0; i < 8; i++) ellipse(ctx, -20 * s + i * 6 * s, (i % 2 ? -6 : 2) * s, 3 * s, 1.6 * s), ctx.fill();
  } else if (id === 'mie') {
    ctx.strokeStyle = '#e8a13a';
    ctx.lineWidth = 5 * s;
    ctx.lineCap = 'round';
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.arc(-10 * s + i * 7 * s, 0, 20 * s, 0.15 * Math.PI, 0.85 * Math.PI);
      ctx.stroke();
    }
    ctx.strokeStyle = c.main;
    ctx.lineWidth = 4 * s;
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.arc(-12 * s + i * 8 * s, -2 * s, 18 * s, 0.2 * Math.PI, 0.8 * Math.PI);
      ctx.stroke();
    }
    ctx.fillStyle = '#7cb95c';
    ellipse(ctx, 22 * s, -12 * s, 6 * s, 5 * s); ctx.fill();
  } else if (id === 'ayam') {
    // A golden drumstick.
    ctx.save();
    ctx.rotate(-0.45);
    ctx.fillStyle = c.main;
    ellipse(ctx, -4 * s, 0, 26 * s, 19 * s); ctx.fill();
    ctx.fillStyle = c.accent;
    ctx.fillRect(16 * s, -4 * s, 18 * s, 8 * s);
    ctx.fillStyle = '#fdf6d8';
    ellipse(ctx, 28 * s, -6 * s, 6 * s, 6 * s); ctx.fill();
    ellipse(ctx, 28 * s, 6 * s, 6 * s, 6 * s); ctx.fill();
    ctx.fillStyle = c.accent;
    ellipse(ctx, -12 * s, -5 * s, 4 * s, 3 * s); ctx.fill();
    ctx.restore();
  } else if (id === 'sate') {
    // Three glossy skewers of meat cubes.
    for (let k = -1; k <= 1; k++) {
      ctx.save();
      ctx.rotate(k * 0.16);
      ctx.fillStyle = '#c9a06a';
      ctx.fillRect(-30 * s, -2 * s, 60 * s, 3.5 * s);
      for (let i = 0; i < 3; i++) {
        const px = -18 * s + i * 18 * s;
        ctx.fillStyle = i % 2 ? c.main : c.accent;
        roundRect(ctx, px - 9 * s, -10 * s, 18 * s, 18 * s, 5 * s); ctx.fill();
      }
      ctx.restore();
    }
  } else if (id === 'telur') {
    // Fried egg: crisped white, bright yolk.
    ctx.fillStyle = cooked ? '#f3e9c8' : '#fdf6d8';
    ellipse(ctx, 0, 0, 30 * s, 17 * s); ctx.fill();
    ellipse(ctx, -16 * s, -5 * s, 14 * s, 10 * s); ctx.fill();
    ellipse(ctx, 16 * s, 4 * s, 14 * s, 10 * s); ctx.fill();
    ctx.fillStyle = cooked ? '#e8940f' : '#f0b429';
    ellipse(ctx, 2 * s, -2 * s, 11 * s, 10 * s); ctx.fill();
    ctx.fillStyle = '#ffd968';
    ellipse(ctx, -1 * s, -5 * s, 4 * s, 3.5 * s); ctx.fill();
  } else if (id === 'sayur') {
    ctx.fillStyle = '#5da244';
    ellipse(ctx, 0, 2 * s, 28 * s, 15 * s); ctx.fill();
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2;
      ctx.fillStyle = i % 2 ? '#7cb95c' : '#4d8a38';
      ellipse(ctx, Math.cos(a) * 13 * s, Math.sin(a) * 8 * s, 12 * s, 8 * s); ctx.fill();
    }
    ctx.fillStyle = '#e86a2a';
    ellipse(ctx, 12 * s, 8 * s, 6 * s, 5 * s); ctx.fill();
    ellipse(ctx, -13 * s, -6 * s, 5 * s, 4 * s); ctx.fill();
  } else if (id === 'sambal') {
    // A small bowl of glossy red sambal with a chilli on top.
    ctx.fillStyle = '#f4f1e6';
    ctx.beginPath();
    ctx.ellipse(0, 4 * s, 26 * s, 15 * s, 0, 0, Math.PI);
    ctx.fill();
    ctx.fillStyle = c.main;
    ellipse(ctx, 0, 0, 22 * s, 11 * s); ctx.fill();
    ctx.fillStyle = '#ff7a5c';
    ellipse(ctx, -7 * s, -2 * s, 5 * s, 3.5 * s); ctx.fill();
    ellipse(ctx, 7 * s, 3 * s, 4 * s, 3 * s); ctx.fill();
    ctx.strokeStyle = '#2f7a2a';
    ctx.lineWidth = 3 * s;
    ctx.beginPath();
    ctx.moveTo(8 * s, -10 * s);
    ctx.quadraticCurveTo(18 * s, -18 * s, 24 * s, -8 * s);
    ctx.stroke();
  } else if (id === 'kerupuk') {
    // Three overlapping prawn crackers.
    const spots = [[-12, -4, 13], [10, -6, 14], [0, 8, 15]];
    for (const [dx, dy, r] of spots) {
      ctx.fillStyle = '#f9ead0';
      ellipse(ctx, dx * s, dy * s, r * s, (r - 3) * s); ctx.fill();
      ctx.strokeStyle = c.accent;
      ctx.lineWidth = 2 * s;
      ellipse(ctx, dx * s, dy * s, (r - 5) * s, (r - 7) * s);
      ctx.stroke();
    }
    ctx.fillStyle = c.accent;
    for (const [dx, dy] of [[-8, -2], [6, -4], [2, 6]]) ellipse(ctx, dx * s, dy * s, 2 * s, 2 * s), ctx.fill();
  }
  // Garnish pass: steam, shine and grill marks over every item, so the
  // food reads as hot and worth serving wherever it is drawn.
  if (!burnt && size >= 44) {
    ctx.strokeStyle = 'rgba(255,255,255,.55)';
    ctx.lineWidth = 2 * s;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-14 * s, -20 * s);
    ctx.quadraticCurveTo(-10 * s, -26 * s, -14 * s, -32 * s);
    ctx.moveTo(10 * s, -20 * s);
    ctx.quadraticCurveTo(14 * s, -26 * s, 10 * s, -32 * s);
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,.5)';
    ellipse(ctx, -12 * s, -8 * s, 6 * s, 3 * s); ctx.fill();
  }
  if (cooked && !burnt && (id === 'ayam' || id === 'sate' || id === 'telur')) {
    ctx.strokeStyle = 'rgba(90,45,10,.65)';
    ctx.lineWidth = 2.5 * s;
    ctx.beginPath();
    ctx.moveTo(-16 * s, -6 * s); ctx.lineTo(16 * s, -6 * s);
    ctx.moveTo(-16 * s, 4 * s); ctx.lineTo(16 * s, 4 * s);
    ctx.stroke();
  }
  ctx.restore();
}

// A finished plate: white plate with the dish's items arranged on it.
export function drawPlate(ctx, x, y, size, items) {
  const s = size / 120;
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = '#e8e8ea';
  ellipse(ctx, 0, 0, 58 * s, 22 * s); ctx.fill();
  ctx.fillStyle = '#ffffff';
  ellipse(ctx, 0, -3 * s, 48 * s, 18 * s); ctx.fill();
  ctx.strokeStyle = '#b9c0c7';
  ctx.lineWidth = 2 * s;
  ctx.beginPath();
  ctx.ellipse(0, -3 * s, 48 * s, 18 * s, 0, 0, Math.PI * 2);
  ctx.stroke();
  const spots = [[-22, -2], [20, -4], [0, -8], [-2, 2]];
  items.forEach((item, i) => {
    const [dx, dy] = spots[i % spots.length];
    drawIngredient(ctx, item.id, dx * s, dy * s, 52 * s, item.cooked, item.burnt);
  });
  // Sauce drizzle and herb garnish over the finished plate.
  ctx.strokeStyle = '#c98a2e';
  ctx.lineWidth = 2.5 * s;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-34 * s, -6 * s);
  ctx.quadraticCurveTo(-10 * s, -14 * s, 12 * s, -4 * s);
  ctx.quadraticCurveTo(26 * s, 2 * s, 36 * s, -6 * s);
  ctx.stroke();
  ctx.fillStyle = '#4d8a38';
  ellipse(ctx, -30 * s, 6 * s, 3 * s, 2 * s); ctx.fill();
  ellipse(ctx, 28 * s, -10 * s, 3 * s, 2 * s); ctx.fill();
  ellipse(ctx, 4 * s, 8 * s, 3 * s, 2 * s); ctx.fill();
  ctx.restore();
}

// The chef: toque, face, apron, arms. `step` animates the legs while walking.
// `carrying` is the hand item, drawn floating above the chef's hands.
export function drawChef(ctx, x, y, facing, step, carrying) {
  ctx.save();
  ctx.translate(x, y);
  const bob = Math.sin(step) * 2;
  const legSwing = Math.sin(step) * 6;
  ctx.fillStyle = '#3a3f4a';
  roundRect(ctx, -14, -16 + bob, 11, 16 - bob, 4); ctx.fill();
  roundRect(ctx, 3, -16 - bob, 11, 16 + bob, 4); ctx.fill();
  ctx.fillStyle = '#22242a';
  ellipse(ctx, -8 + legSwing * 0.4, 0, 9, 4); ctx.fill();
  ellipse(ctx, 9 - legSwing * 0.4, 0, 9, 4); ctx.fill();
  ctx.fillStyle = '#f2f2f2';
  roundRect(ctx, -19, -52 + bob, 38, 38, 10); ctx.fill();
  ctx.fillStyle = '#e2574c';
  roundRect(ctx, -15, -44 + bob, 30, 30, 8); ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(-15, -44 + bob, 30, 5);
  ctx.fillStyle = '#f2c89b';
  const armSwing = Math.sin(step) * 5;
  roundRect(ctx, -26, -46 + bob + armSwing, 9, 22, 4); ctx.fill();
  roundRect(ctx, 17, -46 + bob - armSwing, 9, 22, 4); ctx.fill();
  ctx.fillStyle = '#f6cf9f';
  ellipse(ctx, 0, -62 + bob, 15, 14); ctx.fill();
  ctx.fillStyle = '#ffffff';
  ellipse(ctx, -10, -76 + bob, 9, 8); ctx.fill();
  ellipse(ctx, 0, -80 + bob, 11, 9); ctx.fill();
  ellipse(ctx, 10, -76 + bob, 9, 8); ctx.fill();
  ctx.fillRect(-13, -78 + bob, 26, 8);
  ctx.fillStyle = '#2b2b2b';
  ellipse(ctx, -5 * facing, -62 + bob, 1.8, 2.4); ctx.fill();
  ellipse(ctx, 5 * facing, -62 + bob, 1.8, 2.4); ctx.fill();
  ctx.strokeStyle = '#2b2b2b';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(0, -58 + bob, 4, 0.15 * Math.PI, 0.85 * Math.PI);
  ctx.stroke();
  if (carrying) {
    ctx.fillStyle = 'rgba(255,255,255,.9)';
    ellipse(ctx, 26 * facing, -34 + bob, 16, 9); ctx.fill();
    drawIngredient(ctx, carrying.id, 26 * facing, -38 + bob, 34, carrying.cooked, carrying.burnt);
  }
  ctx.restore();
}
