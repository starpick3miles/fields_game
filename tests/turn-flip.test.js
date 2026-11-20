// Replay tests: every Turn & Flip puzzle is played start to finish with pure rules only.
import test from 'node:test';
import assert from 'node:assert/strict';
import { key, apply, mul, det, IDENTITY, shortestPath, reachable } from '../src/core/d4.js';
import { canTile } from '../src/core/tiling.js';
import { solveH, mapPoint } from '../src/core/homography.js';
import { OPS, LEVELS, LV } from '../src/modules/turn-flip/levels.js';
import * as R from '../src/modules/turn-flip/rules.js';
import { NET } from '../src/modules/turn-flip/text.js';

const rounds = type => LEVELS.flatMap((L, lv) => L.type === type ? L.rounds.map((_, r) => [lv, r]) : []);
const run = (s, patch) => ({ ...s, ...patch });

test('D4: the six moves are exact symmetries of the square', () => {
  for (const id in OPS) assert.equal(Math.abs(det(OPS[id].m)), 1, id);
  for (const id in OPS) assert.equal(det(OPS[id].m) < 0, OPS[id].flip, `${id} flip flag matches its determinant`);
  const same = (a, b) => assert.equal(a.join(','), b.join(','));   // join() treats -0 and 0 alike, as the game's keys do
  same(mul(OPS.cw.m, OPS.ccw.m), IDENTITY);
  same(mul(OPS.cw.m, OPS.cw.m), OPS.half.m);
  same(mul(OPS.lr.m, OPS.lr.m), IDENTITY);
});

test('D4: every combined move has a Korean explanation', () => {
  const all = new Set([IDENTITY.join(',')]);
  for (let i = 0; i < 3; i++) for (const k of [...all]) for (const id in OPS) all.add(mul(OPS[id].m, k.split(',').map(Number)).join(','));
  assert.equal(all.size, 8);
  for (const k of all) assert.ok(NET[k], `NET text for ${k}`);
});

test('homography: maps the four markers back to plane corners', () => {
  const src = [[0, 0], [400, 10], [380, 200], [20, 190]], dst = [[0, 0], [640, 0], [640, 320], [0, 320]];
  const h = solveH(src, dst);
  src.forEach((p, i) => mapPoint(h, [0, 0], p[0], p[1]).forEach((v, j) => assert.ok(Math.abs(v - dst[i][j]) < 1e-6)));
});

test('levels 1–2: the shortest path fits the hole, and so does following hints', () => {
  for (const [lv, r] of rounds('match')) {
    const L = LV(lv, r), best = R.minMoves(L);
    let s = R.fresh(lv, r);
    assert.ok(!R.fitsHole(L, s), `${lv}.${r} doesn't start solved`);
    s = run(s, R.commitOps(s, shortestPath(L.piece, key(L.target), L.ops, OPS)));
    assert.ok(R.fitsHole(L, s), `${lv}.${r} solved by shortest path`);
    assert.equal(R.stars(L, s.moves, false), 3);
    s = R.fresh(lv, r);
    for (let i = 0; i < 10 && !R.fitsHole(L, s); i++) { const h = R.hint(L, s, true).hint; s = run(s, R.commitOps(s, [h.op])); }
    assert.ok(R.fitsHole(L, s) && s.moves === best, `${lv}.${r} hints solve it in ${best}`);
    assert.equal(R.stars(L, s.moves, true), 2, 'a hint caps stars at 2');
    assert.ok(R.explain(L, s, true).every(Boolean));
  }
});

test('level 3: right answers advance, wrong ones are marked, options all look different', () => {
  for (const [lv, r] of rounds('predict')) {
    const L = LV(lv, r);
    for (const Q of L.qs) assert.equal(new Set(Q.opts.map(id => key(apply(OPS[id].m, Q.piece)))).size, Q.opts.length, 'no two options look the same');
    let s = R.fresh(lv, r);
    const wrong = L.qs[0].opts.find(id => id !== L.qs[0].op);
    s = run(s, R.pick(L, s, wrong).patch);
    assert.deepEqual(s.wrong, [wrong]);
    assert.equal(R.pick(L, s, wrong), null, 'a marked option cannot be picked again');
    for (let q = 0; q < L.qs.length; q++) {
      const res = R.pick(L, s, L.qs[s.q].op);
      assert.ok(res.right);
      s = run(run(s, res.patch), R.afterPick(run(s, res.patch), L.qs[s.q].op));
      const n = R.nextQ(L, s);
      if (n) s = run(s, n);
    }
    assert.equal(R.nextQ(L, s), null);
    assert.equal(s.firstTry, L.qs.length - 1, 'first question was missed once');
  }
});

test('level 4: filling the mirror image solves it; the left half is locked; undo works', () => {
  for (const [lv, r] of rounds('mirror')) {
    const L = LV(lv, r);
    let s = R.fresh(lv, r);
    assert.equal(R.setCell(L, s, 0, 0, true), null, 'left half cannot be changed');
    const before = s;
    s = run(s, R.setCell(L, s, 7, 4, !L.target.includes('7,4')));
    s = run(s, R.undo(s));
    assert.deepEqual(s.right, before.right);
    for (let i = 0; i < 40 && !R.mirrorDone(L, s.right); i++) {
      const [x, y] = R.hint(L, s, false).hint.cell;
      s = run(s, R.setCell(L, s, x, y, !s.right.includes(x + ',' + y)));
    }
    assert.ok(R.mirrorDone(L, s.right));
    assert.equal(s.moves, L.target.length, 'undo also takes back the move it counted');
  }
});

test('level 5: the stored solution tiles the board, and following hints fills it', () => {
  for (const [lv, r] of rounds('fill')) {
    const L = LV(lv, r);
    const cells = L.solution.flat().map(c => c.join(','));
    assert.equal(new Set(cells).size, 16, 'solution covers 16 different cells');
    const shapes = reachable(L.piece, L.ops, OPS);
    for (const c of L.solution) assert.ok(shapes.some(sh => key(sh) === key(c)), 'each piece is a reachable orientation');
    assert.ok(canTile(new Set(), shapes));
    let s = R.fresh(lv, r);
    for (let i = 0; i < 40 && !R.boardFull(s.placed); i++) {
      const h = R.hint(L, s, false).hint;
      if (h.op) s = run(s, R.commitOps(s, [h.op]));
      else if (h.cell) { const p = R.placement(s, h.cell[0], h.cell[1]); assert.ok(p.ok); s = run(s, R.place(L, s, p.abs)); }
      else assert.fail('hint should never ask to undo on a clean run');
    }
    assert.ok(R.boardFull(s.placed));
    assert.equal(R.stars(L, s.moves, false), 3, `solved in ${s.moves} (min ${R.minMoves(L)})`);
    assert.equal(R.explain(L, s, true).length, 2);
  }
});

test('stars: 3 at the minimum, 2 within four extra, then 1', () => {
  const L = LV(0, 0), m = R.minMoves(L);
  assert.deepEqual([m, m + 4, m + 5].map(n => R.stars(L, n, false)), [3, 2, 1]);
});
