// Dapur Kilat — the chef: movement, walk-to targets and station proximity.
// The chef walks the floor lane; an action only lands when the chef stands
// close to the station, which is what makes routing through the kitchen
// part of the game. Clicking a station walks there and runs the action on
// arrival; arrow keys / WASD drive the chef directly and cancel walk-to.

import { ANCHORS, TUNING } from './config.js';

export function createChef() {
  return {
    x: 640, y: 388,
    tx: null, ty: null, // walk-to target
    pending: null, // action to run on arrival: a station object
    facing: 1, // 1 right, -1 left
    moving: false,
    stepPhase: 0,
  };
}

export function walkTo(chef, x, y, pending) {
  chef.tx = Math.max(30, Math.min(1250, x));
  chef.ty = Math.max(352, Math.min(424, y));
  chef.pending = pending || null;
}

export function walkToStation(chef, station, pending) {
  const a = ANCHORS[station];
  if (a) walkTo(chef, a.x, a.y, pending);
}

export function stopChef(chef) {
  chef.tx = null;
  chef.ty = null;
  chef.pending = null;
  chef.moving = false;
}

export function nearestStation(chef) {
  let best = null;
  let bestDist = 130;
  for (const [name, a] of Object.entries(ANCHORS)) {
    const d = Math.hypot(chef.x - a.x, chef.y - a.y);
    if (d < bestDist) {
      bestDist = d;
      best = name;
    }
  }
  return best;
}

export function tickChef(chef, dt, keys) {
  let vx = 0;
  let vy = 0;
  if (keys.left) vx -= 1;
  if (keys.right) vx += 1;
  if (keys.up) vy -= 1;
  if (keys.down) vy += 1;
  if (vx !== 0 || vy !== 0) {
    // Direct control cancels a walk-to target.
    stopChef(chef);
    const len = Math.hypot(vx, vy);
    chef.x += (vx / len) * TUNING.chefSpeed * dt;
    chef.y += (vy / len) * TUNING.chefSpeed * 0.7 * dt;
    chef.facing = vx < 0 ? -1 : vx > 0 ? 1 : chef.facing;
    chef.moving = true;
  } else if (chef.tx !== null) {
    const dx = chef.tx - chef.x;
    const dy = chef.ty - chef.y;
    const d = Math.hypot(dx, dy);
    if (d < 6) {
      chef.x = chef.tx;
      chef.y = chef.ty;
      chef.tx = null;
      chef.ty = null;
      chef.moving = false;
    } else {
      const step = TUNING.chefSpeed * dt;
      chef.x += (dx / d) * step;
      chef.y += (dy / d) * step;
      chef.facing = dx < 0 ? -1 : dx > 0 ? 1 : chef.facing;
      chef.moving = true;
    }
  } else {
    chef.moving = false;
  }
  chef.x = Math.max(30, Math.min(1250, chef.x));
  chef.y = Math.max(352, Math.min(424, chef.y));
  if (chef.moving) chef.stepPhase += dt * 10;
}

export function arrivedPending(chef) {
  // Returns the pending action once, when the chef has reached the target.
  if (chef.tx === null && chef.pending) {
    const p = chef.pending;
    chef.pending = null;
    return p;
  }
  return null;
}
