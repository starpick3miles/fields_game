// @ts-check
// Turn & Flip content: the moves, the pieces and the five levels.
import { apply } from '../../core/d4.js';
import { OP_TEXT } from './text.js';

export const S = 56;                    // cube size in px
export const STORE = 'turnflip.v1';     // localStorage key (same as the Claude Design version)
export const BCX = 160, BCY = 160;      // bench centre on the table plane (levels 1, 2, 5)
export const HOLE_DX = 320;             // bench centre to hole centre

/** Each move: its matrix, glyph, and the CSS rotation that animates it. */
export const OPS = {
  cw:   { m: [0, -1, 1, 0],  glyph: '↻', f: a => `rotateZ(${a}deg)`,  deg: 90,  flip: false },
  ccw:  { m: [0, 1, -1, 0],  glyph: '↺', f: a => `rotateZ(${-a}deg)`, deg: 90,  flip: false },
  half: { m: [-1, 0, 0, -1], glyph: '↻', f: a => `rotateZ(${a}deg)`,  deg: 180, flip: false },
  lr:   { m: [-1, 0, 0, 1],  glyph: '↔', f: a => `rotateY(${a}deg)`,  deg: 180, flip: true },
  ud:   { m: [1, 0, 0, -1],  glyph: '↕', f: a => `rotateX(${a}deg)`,  deg: 180, flip: true },
  diag: { m: [0, 1, 1, 0],   glyph: '⤡', f: a => `rotate3d(1,1,0,${a}deg)`, deg: 180, flip: true },
};
for (const id in OPS) Object.assign(OPS[id], OP_TEXT[id]);

const L4 = [[0, 0], [0, 1], [0, 2], [1, 2]];
const P5 = [[0, 0], [1, 0], [0, 1], [1, 1], [0, 2]];
const T4 = [[0, 0], [1, 0], [2, 0], [1, 1]];
const F5 = [[1, 0], [2, 0], [0, 1], [1, 1], [1, 2]];
const TREE = [[3, 0], [2, 1], [3, 1], [1, 2], [2, 2], [3, 2], [3, 3], [3, 4]];
const STEPS = [[3, 1], [2, 2], [3, 2], [1, 3], [2, 3], [3, 3], [0, 4], [1, 4], [2, 4], [3, 4]];
const DOTS = [[0, 0], [1, 0], [1, 1], [2, 1], [2, 2], [3, 2], [0, 4], [3, 4]];
const HALF = [-1, 0, 0, -1];
const mirrorOf = left => left.map(([x, y]) => (7 - x) + ',' + y);

export const LEVELS = [
  { type: 'match', title: '회전', say: '도형을 회전하여 구멍에 맞춰 보세요.', ops: ['cw', 'ccw'], rounds: [
    { piece: L4, target: apply(HALF, L4) },
    { piece: P5, target: apply(OPS.ccw.m, P5) },
    { piece: F5, target: apply(HALF, F5) }] },
  { type: 'match', title: '대칭', say: '도형을 회전하고 대칭시켜 구멍에 맞춰 보세요.', ops: ['cw', 'ccw', 'lr', 'ud', 'diag'], rounds: [
    { piece: P5, target: apply([0, -1, -1, 0], P5) },
    { piece: L4, target: apply(OPS.lr.m, L4) },
    { piece: F5, target: apply(OPS.cw.m, apply(OPS.ud.m, F5)) }] },
  { type: 'predict', title: '예측', say: '이동한 뒤의 도형은 어떤 모양일까요?', rounds: [{ qs: [
    { piece: L4, op: 'cw', opts: ['cw', 'ccw', 'lr'] },
    { piece: P5, op: 'lr', opts: ['lr', 'ud', 'half'] },
    { piece: L4, op: 'half', opts: ['half', 'ud', 'cw'] },
    { piece: P5, op: 'diag', opts: ['diag', 'cw', 'lr'] }] }] },
  { type: 'mirror', title: '선대칭', say: '대칭축을 기준으로 선대칭이 되도록 칸을 채워 보세요.', cols: 8, rows: 5, rounds: [
    { left: TREE, target: mirrorOf(TREE) },
    { left: STEPS, target: mirrorOf(STEPS) },
    { left: DOTS, target: mirrorOf(DOTS) }] },
  { type: 'fill', title: '채우기', rounds: [
    { say: '도형을 회전하고 대칭시켜 판에 놓아 보세요. 모든 칸을 채웁니다.', piece: L4, ops: ['cw', 'ccw', 'lr', 'ud'],
      solution: [[[0, 0], [1, 0], [2, 0], [0, 1]], [[3, 0], [1, 1], [2, 1], [3, 1]], [[1, 2], [2, 2], [3, 2], [3, 3]], [[0, 2], [0, 3], [1, 3], [2, 3]]] },
    { say: '도형을 회전하여 판에 놓아 보세요. 모든 칸을 채웁니다.', piece: T4, ops: ['cw', 'ccw'],
      solution: [[[0, 0], [1, 0], [2, 0], [1, 1]], [[3, 0], [2, 1], [3, 1], [3, 2]], [[0, 1], [0, 2], [1, 2], [0, 3]], [[2, 2], [1, 3], [2, 3], [3, 3]]] }] },
];

/** One puzzle: the level's shared settings plus this round's own. */
export const LV = (lv, r) => { const L = LEVELS[lv]; return { ...L, ...(L.rounds[r] || L.rounds[0]), n: L.rounds.length }; };

/** A level's star count is its weakest round. */
export const bestOf = (best, lv) => Math.min(...LEVELS[lv].rounds.map((_, r) => best[lv + '.' + r] || 0));
