// @ts-check
// Exact tiling checks for a small rectangular board (4×4 by default).
// Cells are "x,y" strings in a Set of occupied cells.

/** @typedef {[number, number]} Cell */

/** The first empty cell in reading order, or null when the board is full. */
export const firstEmpty = (/** @type {Set<string>} */ occ, w = 4, h = 4) => {
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (!occ.has(x + ',' + y)) return /** @type {Cell} */ ([x, y]);
  return null;
};

/**
 * Place `shape` so its first cell lands on `e`. Returns the board cells, or null if it doesn't fit.
 * @param {Cell[]} shape @param {Cell} e @param {Set<string>} occ
 */
export const fitAt = (shape, e, occ, w = 4, h = 4) => {
  const ox = e[0] - shape[0][0], oy = e[1] - shape[0][1];
  const abs = shape.map(([x, y]) => /** @type {Cell} */ ([x + ox, y + oy]));
  return abs.every(([x, y]) => x >= 0 && y >= 0 && x < w && y < h && !occ.has(x + ',' + y)) ? abs : null;
};

/**
 * Can the rest of the board still be covered with copies of these shapes?
 * Fills the first empty cell each time, so every tiling is tried once.
 * @param {Set<string>} occ @param {Cell[][]} shapes
 * @returns {boolean}
 */
export const canTile = (occ, shapes, w = 4, h = 4) => {
  const e = firstEmpty(occ, w, h);
  if (!e) return true;
  for (const sh of shapes) {
    const abs = fitAt(sh, e, occ, w, h);
    if (!abs) continue;
    const o2 = new Set(occ); abs.forEach(c => o2.add(c.join(',')));
    if (canTile(o2, shapes, w, h)) return true;
  }
  return false;
};
