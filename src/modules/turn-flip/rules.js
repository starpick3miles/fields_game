// @ts-check
// Turn & Flip rules as pure functions: (level, state, action) → state patch.
// No DOM, no timers, no sound — so every puzzle can be replayed and tested in Node.
import { IDENTITY, norm, key, apply, mul, det, shortestPath, reachable } from '../../core/d4.js';
import { firstEmpty, fitAt, canTile } from '../../core/tiling.js';
import { OPS, LV } from './levels.js';
import { NET, EXPLAIN } from './text.js';

/** The starting state of one puzzle. */
export const fresh = (lv, round = 0) => {
  const L = LV(lv, round);
  return { lv, round, moves: 0, hintUsed: false, hint: null, history: [], log: [], net: IDENTITY,
    flipped: false, placed: [], right: [], q: 0, wrong: [], firstTry: 0, qMiss: false, picked: null,
    piece: L.type === 'predict' ? L.qs[0].piece : norm(L.piece || [[0, 0]]) };
};

/** What undo needs to restore. */
export const snap = s => ({ piece: s.piece, flipped: s.flipped, net: s.net, log: s.log, placed: s.placed, right: s.right, moves: s.moves });

/** Apply one or more turn/flip moves to the piece. */
export const commitOps = (s, ids) => {
  const history = [...s.history];
  let { piece, flipped, net, log, moves } = s;
  for (const id of ids) {
    const op = OPS[id];
    history.push({ piece, flipped, net, log, placed: s.placed, right: s.right, moves });
    piece = apply(op.m, piece); if (op.flip) flipped = !flipped; net = mul(op.m, net); log = [...log, id]; moves += 1;
  }
  return { piece, flipped, net, log, moves, history };
};

/** Levels 1–2: does the piece now fit the hole? */
export const fitsHole = (L, s) => L.type === 'match' && key(s.piece) === key(L.target);

/* ---------- level 3: predict ---------- */

/** A wrong answer is marked and counted; a right one is counted and animated, then `afterPick` applies it. */
export const pick = (L, s, id) => {
  const Q = L.qs[s.q];
  if (s.wrong.includes(id)) return null;
  if (id !== Q.op) return { right: false, patch: { wrong: [...s.wrong, id], moves: s.moves + 1, qMiss: true } };
  return { right: true, patch: { moves: s.moves + 1, picked: id, hint: null } };
};
export const afterPick = (s, id) => {
  const op = OPS[id];
  return { piece: apply(op.m, s.piece), flipped: op.flip ? !s.flipped : s.flipped, firstTry: s.firstTry + (s.qMiss ? 0 : 1) };
};
/** The next question, or null when the round is over. */
export const nextQ = (L, s) => s.q + 1 >= L.qs.length ? null
  : { q: s.q + 1, piece: L.qs[s.q + 1].piece, flipped: false, wrong: [], qMiss: false, picked: null };

/* ---------- level 4: mirror ---------- */

/** Fill or clear one cell on the right half. Returns null when nothing changes. */
export const setCell = (L, s, x, y, on) => {
  if (x < L.cols / 2) return null;
  const k = x + ',' + y;
  if (s.right.includes(k) === on) return null;
  const right = on ? [...s.right, k] : s.right.filter(r => r !== k);
  return { right, moves: s.moves + 1, history: [...s.history, snap(s)], hint: null };
};
export const mirrorDone = (L, right) => right.length === L.target.length && L.target.every(t => right.includes(t));

/* ---------- level 5: fill ---------- */

export const occupied = s => new Set(s.placed.flatMap(p => p.cells.map(c => c.join(','))));
/** The piece with its top-left corner on board cell (ox, oy). */
export const placementAt = (s, ox, oy) => {
  const occ = occupied(s), abs = s.piece.map(([px, py]) => [px + ox, py + oy]);
  return { abs, ok: abs.every(([cx, cy]) => cx >= 0 && cy >= 0 && cx < 4 && cy < 4 && !occ.has(cx + ',' + cy)) };
};
/** The piece with its first block on board cell (x, y). */
export const placement = (s, x, y) => { const a = s.piece[0]; return placementAt(s, x - a[0], y - a[1]); };
export const place = (L, s, abs) => ({
  placed: [...s.placed, { cells: abs, flipped: s.flipped }], piece: norm(L.piece), flipped: false, net: IDENTITY,
  moves: s.moves + 1, history: [...s.history, snap(s)], ghost: null, hint: null });
export const boardFull = placed => placed.length * 4 >= 16;

/* ---------- every level ---------- */

export const undo = s => s.history.length
  ? { ...s.history[s.history.length - 1], history: s.history.slice(0, -1), hint: null, ghost: null, ready: false }
  : null;

const shapeCache = new Map();
/**
 * The next helpful step. With scoring on, using a hint caps the result at 2 stars.
 * @returns {object | null} a state patch
 */
export const hint = (L, s, scoring) => {
  const used = scoring ? true : s.hintUsed;
  let h = null;
  if (L.type === 'match') { const p = shortestPath(s.piece, key(L.target), L.ops, OPS); if (p && p.length) h = { op: p[0] }; }
  if (L.type === 'predict') {
    const Q = L.qs[s.q], w = Q.opts.find(o => o !== Q.op && !s.wrong.includes(o));
    return w ? { wrong: [...s.wrong, w], hintUsed: used } : null;
  }
  if (L.type === 'mirror') {
    const k = s.right.find(r => !L.target.includes(r)) || L.target.find(t => !s.right.includes(t));
    if (k) h = { cell: k.split(',').map(Number) };
  }
  if (L.type === 'fill') {
    const sk = s.lv + '.' + s.round;
    if (!shapeCache.has(sk)) shapeCache.set(sk, reachable(L.piece, L.ops, OPS));
    const shapes = shapeCache.get(sk), occ = occupied(s), e = firstEmpty(occ);
    let best = null;
    if (e) for (const sh of shapes) {
      const abs = fitAt(sh, e, occ);
      if (!abs) continue;
      const o2 = new Set(occ); abs.forEach(c => o2.add(c.join(',')));
      if (!canTile(o2, shapes)) continue;
      const p = shortestPath(s.piece, key(sh), L.ops, OPS);
      if (p && (!best || p.length < best.p.length)) best = { abs, p };
    }
    if (!best) h = s.placed.length ? { undo: true } : null;
    else h = best.p.length ? { op: best.p[0] } : { cell: best.abs[0] };
  }
  return { hint: h, hintUsed: used };
};

/** The fewest moves that solve the puzzle. */
export const minMoves = L => {
  if (L.type === 'match') return shortestPath(L.piece, key(L.target), L.ops, OPS).length;
  if (L.type === 'predict') return L.qs.length;
  if (L.type === 'mirror') return L.target.length;
  return L.solution.reduce((n, c) => n + shortestPath(L.piece, key(c), L.ops, OPS).length + 1, 0);
};

/** 3 stars at the minimum (level 5 allows 2 spare moves), 2 within 4 extra, else 1. A hint caps it at 2. */
export const stars = (L, moves, hintUsed) => {
  const extra = moves - minMoves(L), free = L.type === 'fill' ? 2 : 0;
  const n = extra <= free ? 3 : extra <= free + 4 ? 2 : 1;
  return hintUsed ? Math.min(n, 2) : n;
};

/** The result card's explanation, in formal Korean terms. */
export const explain = (L, s, twoTone) => {
  if (L.type === 'match') {
    const netKey = s.net.join(','), flipped = det(s.net) < 0;
    return [NET[netKey], flipped
      ? EXPLAIN.flip + (twoTone ? EXPLAIN.flipColour : '')
      : EXPLAIN.turn + (netKey === '-1,0,0,-1' ? EXPLAIN.twoQuarters : '')];
  }
  if (L.type === 'predict') return EXPLAIN.predict;
  if (L.type === 'mirror') return EXPLAIN.mirror;
  const turns = s.log.filter(id => !OPS[id].flip).length;
  return [EXPLAIN.fillCount(turns, s.log.length - turns),
    !L.ops.some(id => OPS[id].flip) ? EXPLAIN.fillTurnOnly : twoTone ? EXPLAIN.fillTwoTone : EXPLAIN.fillPlain];
};
