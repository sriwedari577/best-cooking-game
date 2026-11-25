// Dapur Kilat — keyboard and mouse input.
// Clicks and keys funnel into the callbacks main.js wires up, so the input
// layer never changes game rules itself. Coordinates are mapped from the
// page into the 1280x480 canvas, whatever size the canvas is shown at.

import { stationAt, INGREDIENTS } from './config.js';

function toCanvas(canvas, clientX, clientY) {
  const r = canvas.getBoundingClientRect();
  return {
    x: ((clientX - r.left) / r.width) * 1280,
    y: ((clientY - r.top) / r.height) * 480,
  };
}

function inRect(x, y, r) {
  return r && x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
}

export function attachInput(canvas, api) {
  const { state, chef, ui, keys } = api;

  function canvasPos(e) {
    return toCanvas(canvas, e.clientX, e.clientY);
  }

  canvas.addEventListener('mousemove', (e) => {
    const p = canvasPos(e);
    ui.hover = stationAt(p.x, p.y);
    ui.hoverBtn = null;
    if (state.screen === 'title' && inRect(p.x, p.y, ui.startBtn)) ui.hoverBtn = 'start';
    if (state.screen === 'over' && inRect(p.x, p.y, ui.restartBtn)) ui.hoverBtn = 'restart';
  });

  canvas.addEventListener('click', (e) => {
    const p = canvasPos(e);
    api.sfx.unlock();
    if (state.screen === 'title') {
      if (inRect(p.x, p.y, ui.startBtn)) api.startGame();
      return;
    }
    if (state.screen === 'over') {
      if (inRect(p.x, p.y, ui.restartBtn)) api.restartGame();
      return;
    }
    if (state.screen === 'pause') {
      if (inRect(p.x, p.y, ui.pauseBtn)) api.togglePause();
      return;
    }
    if (inRect(p.x, p.y, ui.soundBtn)) { api.toggleMute(); return; }
    if (inRect(p.x, p.y, ui.pauseBtn)) { api.togglePause(); return; }
    if (state.screen !== 'play') return;

    const hit = stationAt(p.x, p.y);
    if (!hit) {
      // Clicked open floor: just walk there.
      api.walkToPoint(p.x, p.y);
      return;
    }
    if (hit.kind === 'bin') {
      api.requestAction('pick', hit.id);
    } else {
      api.requestAction(hit.kind);
    }
  });

  window.addEventListener('keydown', (e) => {
    const k = e.key;
    if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', ' '].includes(k)) e.preventDefault();
    api.sfx.unlock();
    if (k === 'm' || k === 'M') { api.toggleMute(); return; }
    if (k === 'p' || k === 'P') {
      if (state.screen === 'play' || state.screen === 'pause') api.togglePause();
      return;
    }
    if (state.screen === 'title' && (k === 'Enter' || k === ' ')) { api.startGame(); return; }
    if (state.screen === 'over' && (k === 'r' || k === 'R' || k === 'Enter')) { api.restartGame(); return; }
    if (state.screen !== 'play') return;
    if (k === 'ArrowLeft' || k === 'a' || k === 'A') keys.left = true;
    if (k === 'ArrowRight' || k === 'd' || k === 'D') keys.right = true;
    if (k === 'ArrowUp' || k === 'w' || k === 'W') keys.up = true;
    if (k === 'ArrowDown' || k === 's' || k === 'S') keys.down = true;
    if (k === 'e' || k === 'E' || k === ' ') {
      const { nearestStation } = api;
      const near = nearestStation(chef);
      if (near) api.requestAction(near === 'counter' ? 'pickNearest' : near);
    }
    const bin = INGREDIENTS.find((g) => g.key === k);
    if (bin) api.requestAction('pick', bin.id);
  });

  window.addEventListener('keyup', (e) => {
    const k = e.key;
    if (k === 'ArrowLeft' || k === 'a' || k === 'A') keys.left = false;
    if (k === 'ArrowRight' || k === 'd' || k === 'D') keys.right = false;
    if (k === 'ArrowUp' || k === 'w' || k === 'W') keys.up = false;
    if (k === 'ArrowDown' || k === 's' || k === 'S') keys.down = false;
  });

  canvas.addEventListener('mouseleave', () => { ui.hover = null; });
}

export function stationForAction(kind) {
  if (kind === 'pick' || kind === 'pickNearest') return 'counter';
  return kind; // 'grill' | 'plate' | 'serve' | 'trash'
}
