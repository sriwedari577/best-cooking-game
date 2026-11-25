// Dapur Kilat — a tiny seeded random generator (mulberry32).
// The live game seeds from the clock; staged screenshots seed fixed values,
// so the same ?shot= + &seed= always stages the same kitchen.

export function createRandom(seed) {
  let a = (seed >>> 0) || 1;
  return function nextRandom() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function pickFrom(rng, list) {
  return list[Math.floor(rng() * list.length)];
}
