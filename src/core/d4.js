// @ts-check
// Exact moves on a square grid. Every turn and flip of a polyomino is one of the
// 8 symmetries of the square (the dihedral group D4), written as a 2×2 integer
// matrix [a, b, c, d] acting on cells [x, y] → [a·x + b·y, c·x + d·y].
// Shapes are compared after normalising, so checks are exact (no floating point).

/** @typedef {[number, number]} Cell */
/** @typedef {[number, number, number, number]} Mat */

/** @type {Mat} */
export const IDENTITY = [1, 0, 0, 1];

/** Shift a shape to touch the origin and sort its cells, so equal shapes look equal. */
export const norm = (/** @type {Cell[]} */ cells) => {
  const mx = Math.min(...cells.map(c => c[0])), my = Math.min(...cells.map(c => c[1]));
  return cells.map(([x, y]) => /** @type {Cell} */ ([x - mx, y - my])).sort((a, b) => a[1] - b[1] || a[0] - b[0]);
};

/** A string that is equal for two shapes exactly when they are the same shape in the same orientation. */
export const key = (/** @type {Cell[]} */ cells) => norm(cells).map(c => c.join(',')).join(';');

/** Apply a move matrix to a shape. */
export const apply = (/** @type {Mat} */ m, /** @type {Cell[]} */ cells) =>
  norm(cells.map(([x, y]) => /** @type {Cell} */ ([m[0] * x + m[1] * y, m[2] * x + m[3] * y])));

/** Compose two moves: mul(a, b) means "b, then a". */
export const mul = (/** @type {Mat} */ a, /** @type {Mat} */ b) => /** @type {Mat} */ ([
  a[0] * b[0] + a[1] * b[2], a[0] * b[1] + a[1] * b[3],
  a[2] * b[0] + a[3] * b[2], a[2] * b[1] + a[3] * b[3]]);

/** −1 for a move that flips the shape over, +1 for a pure turn. */
export const det = (/** @type {Mat} */ m) => m[0] * m[3] - m[1] * m[2];

/**
 * Fewest moves from `start` to the shape whose key is `targetKey`, using only `ids`.
 * Breadth-first search over at most 8 orientations, so it is instant.
 * @param {Cell[]} start @param {string} targetKey @param {string[]} ids
 * @param {Record<string, {m: Mat}>} moves
 * @returns {string[] | null} move ids, or null if the target cannot be reached
 */
export const shortestPath = (start, targetKey, ids, moves) => {
  const q = [{ c: norm(start), p: /** @type {string[]} */ ([]) }], seen = new Set([key(start)]);
  while (q.length) {
    const { c, p } = /** @type {{c: Cell[], p: string[]}} */ (q.shift());
    if (key(c) === targetKey) return p;
    for (const id of ids) {
      const n = apply(moves[id].m, c), k = key(n);
      if (!seen.has(k)) { seen.add(k); q.push({ c: n, p: [...p, id] }); }
    }
  }
  return null;
};

/**
 * Every orientation a piece can reach with the given moves.
 * @param {Cell[]} piece @param {string[]} ids @param {Record<string, {m: Mat}>} moves
 */
export const reachable = (piece, ids, moves) => {
  const seen = new Map([[key(piece), norm(piece)]]), q = [norm(piece)];
  while (q.length) {
    const c = /** @type {Cell[]} */ (q.shift());
    for (const id of ids) {
      const n = apply(moves[id].m, c), k = key(n);
      if (!seen.has(k)) { seen.set(k, n); q.push(n); }
    }
  }
  return [...seen.values()];
};

/** Width and height of a normalised shape, in cells. */
export const size = (/** @type {Cell[]} */ cells) => cells.length
  ? [Math.max(...cells.map(c => c[0])) + 1, Math.max(...cells.map(c => c[1])) + 1]
  : [0, 0];
