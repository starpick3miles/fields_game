// @ts-check
// Turn & Flip on the CSS 3D lens: state → HTML for each screen region.
// Markup and inline styles match the Claude Design version exactly.
import { norm, apply, size } from '../../core/d4.js';
import { OPS, LEVELS, LV, bestOf, S, BCX, BCY } from './levels.js';
import { explain } from './rules.js';
import { UI } from './text.js';

const esc = v => String(v).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const each = (list, f) => list.map(f).join('');

/** Face colours: blue side up until the piece is flipped an odd number of times (two-tone on). */
const colours = (two, flipped, alt) => {
  const c = two && flipped ? 'accent-2' : 'accent', o = two ? (flipped ? 'accent' : 'accent-2') : 'accent';
  return { top: `var(--color-${c}-${alt ? 300 : 400})`, side: `var(--color-${c}-500)`, dark: `var(--color-${c}-600)`, bottom: `var(--color-${o}-400)` };
};
const opColour = (id, two) => OPS[id].flip && two ? 'var(--color-accent-2-700)' : 'var(--color-accent-700)';

/** Everything the regions need, computed once per render. */
export function values(s, two) {
  const L = LV(s.lv, s.round), t = L.type;
  const benchCx = t === 'predict' ? 320 : BCX;
  const [pw, ph] = size(s.piece);
  const B = t === 'mirror' ? { x: 96, y: 20 } : { x: 368, y: 48 };
  let cells = [], floorCubes = [], holes = [], plate = null;
  if (t === 'match') {
    plate = { left: 356, top: 36, w: 248, h: 248 };
    const tg = norm(L.target), [tw, th] = size(tg);
    holes = tg.map(([x, y]) => ({ left: 480 - tw * S / 2 + x * S + 2, top: 160 - th * S / 2 + y * S + 2, cls: s.ready ? 'tf-hole tf-ready' : 'tf-hole' }));
  }
  if (t === 'fill') {
    plate = { left: 356, top: 36, w: 248, h: 248 };
    for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) cells.push({ left: B.x + x * S, top: B.y + y * S, bg: 'var(--color-neutral-100)', cursor: 'pointer' });
    floorCubes = s.placed.flatMap((p, i) => p.cells.map(([x, y]) => ({ x: B.x + x * S, y: B.y + y * S, cursor: 'default', ...colours(two, p.flipped, i % 2) })));
  }
  if (t === 'mirror') {
    plate = { left: 84, top: 8, w: 472, h: 304 };
    for (let y = 0; y < L.rows; y++) for (let x = 0; x < L.cols; x++) {
      const r = x >= L.cols / 2;
      cells.push({ left: B.x + x * S, top: B.y + y * S, bg: r ? 'var(--color-neutral-100)' : 'var(--color-neutral-200)', cursor: r ? 'pointer' : 'default' });
    }
    floorCubes = [
      ...L.left.map(([x, y]) => ({ x: B.x + x * S, y: B.y + y * S, cursor: 'default', ...colours(two, false) })),
      ...s.right.map(k => { const [x, y] = k.split(',').map(Number); return { x: B.x + x * S, y: B.y + y * S, cursor: 'pointer', ...colours(two, true) }; })];
  }
  const ghost = s.ghost ? s.ghost.abs.filter(([x, y]) => x >= 0 && y >= 0 && x < 4 && y < 4).map(([x, y]) => ({ left: B.x + x * S, top: B.y + y * S,
    bg: s.ghost.ok ? 'color-mix(in srgb, var(--color-accent) 45%, transparent)' : 'color-mix(in srgb, var(--color-accent-2) 45%, transparent)' })) : [];
  const hc = s.hint && s.hint.cell;
  let qOp = null, options = [], qLabel = '';
  if (t === 'predict') {
    const Q = L.qs[s.q], r = s.q % 3, order = Q.opts.slice(r).concat(Q.opts.slice(0, r));
    qOp = { ...OPS[Q.op], color: opColour(Q.op, two) };
    qLabel = UI.question(s.q + 1, L.qs.length);
    options = order.map((id, i) => {
      const sh = apply(OPS[id].m, Q.piece), [w, h] = size(sh);
      return { id, label: UI.option(i + 1), w: w * 26 - 2, h: h * 26 - 2, cells: sh.map(([x, y]) => ({ left: x * 26, top: y * 26 })),
        ring: s.picked === id ? 'var(--color-accent)' : 'transparent', opacity: s.wrong.includes(id) ? 0.25 : 1 };
    });
  }
  return {
    L, t, two, showScore: s.score, soundOn: s.sound,
    tabs: LEVELS.map((lv, i) => ({ i, n: i + 1, title: lv.title, stars: s.score ? '★'.repeat(bestOf(s.best, i)) + '☆'.repeat(3 - bestOf(s.best, i)) : '',
      bg: i === s.lv ? 'var(--color-accent-700)' : 'transparent', fg: i === s.lv ? 'var(--color-bg)' : 'var(--color-text)',
      border: i === s.lv ? 'var(--color-accent-700)' : 'var(--color-divider)' })),
    kicker: UI.kicker(s.lv + 1, LEVELS.length, s.round + 1, L.n), title: L.title, say: L.say, moves: s.moves,
    disc: t !== 'mirror' ? { left: benchCx - 130 } : null, plate, cells, holes, floorCubes, ghost, isMirror: t === 'mirror',
    hintCell: hc ? { left: B.x + hc[0] * S, top: B.y + hc[1] * S } : null,
    bench: t !== 'mirror' ? { left: benchCx - pw * S / 2, top: BCY - ph * S / 2, w: pw * S, h: ph * S,
      cursor: t === 'predict' ? 'default' : 'grab', cubes: s.piece.map(([x, y]) => ({ x: x * S, y: y * S, ...colours(two, s.flipped) })) } : null,
    qOp, options, qLabel,
    ops: (t === 'match' || t === 'fill') ? (L.ops || []).map(id => ({ id, ...OPS[id], color: opColour(id, two),
      bg: s.flash === id ? 'var(--color-accent-200)' : 'var(--color-surface)', ring: s.hint && s.hint.op === id ? 'var(--color-accent-2)' : 'transparent' })) : null,
    showUndo: t !== 'predict', undoRing: s.hint && s.hint.undo ? 'var(--color-accent-2)' : 'transparent',
    extraInfo: t === 'fill' ? UI.placed(s.placed.length) : '',
    won: s.won, doneKicker: UI.done(s.lv + 1, s.round + 1, L.n),
    starColours: [0, 1, 2].map(i => i < s.stars ? 'var(--color-accent-2)' : 'var(--color-neutral-300)'),
    doneMoves: t === 'predict' ? UI.donePredict(L.qs.length, s.firstTry) : UI.doneMoves(s.moves),
    log: (t === 'match' || t === 'fill') ? s.log.map(id => ({ glyph: OPS[id].glyph, color: opColour(id, two) })) : [],
    explain: s.won ? explain(L, s, two) : [],
    nextLabel: UI.next(s.round >= L.n - 1, s.lv >= LEVELS.length - 1),
  };
}

/* ---------- regions ---------- */

const BTN = 'border-radius:2px;cursor:pointer';
export const header = v => `<header style="display:flex;align-items:center;gap:20px;flex-wrap:wrap">
  <div style="font-family:var(--font-heading);font-weight:600;font-size:24px;letter-spacing:-0.015em;margin-right:auto">Turn &amp; Flip</div>
  <nav style="display:flex;gap:8px;flex-wrap:wrap">${each(v.tabs, t => `<button data-act="level" data-arg="${t.i}" title="${esc(t.title)}" style="min-width:76px;min-height:60px;padding:6px 10px;border:1px solid ${t.border};background:${t.bg};color:${t.fg};${BTN};display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px"><span style="font-size:18px;font-weight:600;line-height:1">${t.n}</span><span style="font-size:12px;line-height:1">${esc(t.title)}</span><span style="font-size:11px;letter-spacing:1px;line-height:1">${t.stars}</span></button>`)}</nav>
  <button data-act="score" aria-pressed="${v.showScore}" class="h-n200" style="min-height:60px;min-width:76px;padding:6px 12px;border:1px solid var(--color-divider);background:transparent;${BTN};font-size:14px;color:var(--color-text)">${UI.score(v.showScore)}</button>
  <button data-act="sound" aria-pressed="${v.soundOn}" class="h-n200" style="min-height:60px;min-width:76px;padding:6px 12px;border:1px solid var(--color-divider);background:transparent;${BTN};font-size:14px;color:var(--color-text)">${UI.sound(v.soundOn)}</button>
</header>`;

export const info = v => `<div style="display:flex;gap:40px;align-items:flex-end;flex-wrap:wrap">
  <div style="display:flex;flex-direction:column;gap:6px;max-width:640px;flex:1 1 320px">
    <div style="font-size:13px;color:var(--color-accent-700)">${esc(v.kicker)}</div>
    <h1 style="margin:0;font-size:46px;line-height:1.1">${esc(v.title)}</h1>
    <p style="margin:0;font-size:21px;line-height:1.5;text-wrap:pretty">${esc(v.say)}</p>
  </div>
  ${v.showScore ? `<div style="display:flex;flex-direction:column;gap:4px;min-width:120px"><div style="font-size:13px;color:var(--color-accent-700)">${UI.moves}</div><div style="font-family:var(--font-heading);font-weight:600;font-size:88px;line-height:0.9;letter-spacing:-0.02em;font-variant-numeric:tabular-nums">${v.moves}</div></div>` : ''}
</div>`;

const FACE = 'position:absolute;inset:0;background:';
const EDGE = ';box-shadow:inset 0 0 0 1px rgba(32,30,29,.15)';
const TOP = ';box-shadow:inset 0 0 0 1px rgba(32,30,29,.18), inset 0 0 0 5px rgba(255,255,255,.2)';
const faces = (c, bench) => `<div style="${FACE}${c.bottom};transform:rotateY(180deg)${bench ? TOP : ''}"></div>`
  + `<div style="${FACE}${c.dark};transform-origin:50% 0;transform:rotateX(90deg)${EDGE}"></div>`
  + `<div style="${FACE}${c.dark};transform-origin:0 50%;transform:rotateY(-90deg)${EDGE}"></div>`
  + `<div style="${FACE}${c.dark};transform-origin:100% 50%;transform:rotateY(90deg)${EDGE}"></div>`
  + `<div style="${FACE}${c.side};transform-origin:50% 100%;transform:rotateX(-90deg)${EDGE}"></div>`
  + `<div style="${FACE}${c.top};transform:translateZ(56px)${TOP}"></div>`;

export const floor = v => (v.disc ? `<div style="position:absolute;left:${v.disc.left}px;top:30px;width:260px;height:260px;border-radius:50%;background:var(--color-surface);box-shadow:0 0 0 1px var(--color-divider), 0 18px 30px rgba(32,30,29,.12)"></div>` : '')
  + (v.plate ? `<div style="position:absolute;left:${v.plate.left}px;top:${v.plate.top}px;width:${v.plate.w}px;height:${v.plate.h}px;background:var(--color-neutral-300);border-radius:4px;box-shadow:0 18px 30px rgba(32,30,29,.16)"></div>` : '')
  + each(v.cells, q => `<div style="position:absolute;left:${q.left}px;top:${q.top}px;width:56px;height:56px;background:${q.bg};box-shadow:inset 0 0 0 1px rgba(32,30,29,.13);cursor:${q.cursor};transform:translateZ(1px)"></div>`)
  + each(v.holes, h => `<div class="${h.cls}" style="position:absolute;left:${h.left}px;top:${h.top}px;width:52px;height:52px;background:var(--color-neutral-700);box-shadow:inset 0 8px 12px rgba(0,0,0,.45);transform:translateZ(1px)"></div>`)
  + (v.isMirror ? `<div style="position:absolute;left:317px;top:14px;width:6px;height:292px;background:var(--color-accent-2);transform:translateZ(2px);pointer-events:none"></div><div style="position:absolute;left:320px;top:14px;width:84px;height:292px;transform-origin:0 50%;transform:rotateY(-90deg);background:color-mix(in srgb, var(--color-accent-2-200) 45%, transparent);box-shadow:inset 0 0 0 2px color-mix(in srgb, var(--color-accent-2) 50%, transparent);pointer-events:none"></div>` : '');

export const overlay = v => each(v.ghost, g => `<div style="position:absolute;left:${g.left}px;top:${g.top}px;width:56px;height:56px;background:${g.bg};transform:translateZ(2px);pointer-events:none"></div>`)
  + (v.hintCell ? `<div style="position:absolute;left:${v.hintCell.left}px;top:${v.hintCell.top}px;width:56px;height:56px;box-sizing:border-box;border:5px solid var(--color-accent-2);transform:translateZ(3px);pointer-events:none"></div>` : '');

export const cubes = v => each(v.floorCubes, c => `<div class="tf-cube" style="position:absolute;left:${c.x}px;top:${c.y}px;width:56px;height:56px;transform-style:preserve-3d;cursor:${c.cursor}">${faces(c, false)}</div>`);

export const bench = v => v.bench ? `<div class="tf-piece" style="position:absolute;left:${v.bench.left}px;top:${v.bench.top}px;width:${v.bench.w}px;height:${v.bench.h}px;transform-style:preserve-3d;transform-origin:50% 50% 28px;cursor:${v.bench.cursor}">${each(v.bench.cubes, c => `<div style="position:absolute;left:${c.x}px;top:${c.y}px;width:56px;height:56px;transform-style:preserve-3d">${faces(c, true)}</div>`)}</div>` : '';

export const side = v => (v.qOp ? `<div style="display:flex;flex-wrap:wrap;gap:12px;align-items:flex-start">
    <div style="display:flex;flex-direction:column;gap:10px"><div style="font-size:13px;color:var(--color-accent-700)">${esc(v.qLabel)}</div>
      <div style="display:flex;align-items:center;gap:14px;padding:12px 18px;background:var(--color-surface);border-radius:2px;min-height:76px;box-sizing:border-box">
        <span aria-hidden="true" style="font-size:44px;line-height:1;color:${v.qOp.color}">${v.qOp.glyph}</span>
        <span style="display:flex;flex-direction:column;gap:2px"><span style="font-size:24px;font-weight:600">${v.qOp.word}</span><span style="font-size:14px;color:var(--color-neutral-700)">${v.qOp.sub}</span></span></div></div>
    <div style="display:flex;flex-direction:column;gap:10px"><div style="font-size:13px;color:var(--color-accent-700)">${UI.pickOne}</div>
      <div style="display:flex;gap:12px;flex-wrap:wrap">${each(v.options, op => `<button data-act="pick" data-arg="${op.id}" aria-label="${op.label}" class="h-a100 a-a200" style="width:100px;height:100px;display:grid;place-items:center;background:var(--color-surface);border:4px solid ${op.ring};opacity:${op.opacity};${BTN};padding:0"><div style="position:relative;width:${op.w}px;height:${op.h}px">${each(op.cells, m => `<div style="position:absolute;left:${m.left}px;top:${m.top}px;width:24px;height:24px;background:var(--color-neutral-800)"></div>`)}</div></button>`)}</div></div>
  </div>` : '')
  + (v.ops ? `<div style="display:flex;gap:12px;flex-wrap:wrap">${each(v.ops, o => `<button data-act="op" data-arg="${o.id}" class="h-a100 a-a200" style="width:112px;min-height:96px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;background:${o.bg};border:4px solid ${o.ring};${BTN};color:var(--color-text);padding:8px 4px"><span aria-hidden="true" style="font-size:38px;line-height:1;color:${o.color}">${o.glyph}</span><span style="font-size:16px;font-weight:600">${o.word}</span><span style="font-size:12px;color:var(--color-neutral-700)">${o.sub}</span></button>`)}</div>` : '')
  + `<div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap">
    ${v.showUndo ? `<button data-act="undo" class="h-n200" style="min-height:56px;min-width:96px;padding:8px 12px;border:3px solid ${v.undoRing};background:transparent;${BTN};font-size:17px;color:var(--color-text);display:flex;align-items:center;gap:8px"><span aria-hidden="true" style="font-size:22px">↶</span> ${UI.undo}</button>` : ''}
    <button data-act="hint" class="h-a100" style="min-height:56px;min-width:96px;padding:8px 16px;border:3px solid transparent;background:transparent;${BTN};font-size:17px;color:var(--color-accent-700);display:flex;align-items:center;gap:8px"><span aria-hidden="true" style="font-size:20px">?</span> ${UI.hint}</button>
    <div style="display:flex;gap:24px;font-size:18px;flex-wrap:wrap"><span>${esc(v.extraInfo)}</span></div>
  </div>`;

export const modal = v => !v.won ? '' : `<div style="position:fixed;inset:0;display:grid;place-items:center;padding:20px;background:color-mix(in srgb, var(--color-neutral-900) 45%, transparent);z-index:10">
  <div role="dialog" aria-modal="true" style="width:min(540px,100%);max-height:calc(100vh - 40px);overflow:auto;box-sizing:border-box;display:flex;flex-direction:column;gap:18px;padding:36px;background:var(--color-bg);border-radius:4px;box-shadow:var(--shadow-lg)">
    <div style="font-size:13px;color:var(--color-accent-700)">${esc(v.doneKicker)}</div>
    ${v.showScore ? `<div style="display:flex;gap:8px;font-size:60px;line-height:1">${each(v.starColours, c => `<span style="color:${c}">★</span>`)}</div><div style="font-size:18px">${esc(v.doneMoves)}</div>` : ''}
    ${v.log.length ? `<div style="display:flex;gap:6px;flex-wrap:wrap">${each(v.log, lc => `<span style="min-width:40px;height:40px;display:grid;place-items:center;background:var(--color-surface);border-radius:2px;font-size:22px;color:${lc.color}">${lc.glyph}</span>`)}</div>` : ''}
    <h2 style="margin:6px 0 0;font-size:24px">${UI.summary}</h2>
    ${each(v.explain, p => `<p style="margin:0;font-size:19px;line-height:1.55;text-wrap:pretty">${esc(p)}</p>`)}
    <div style="display:flex;gap:12px;flex-wrap:wrap;margin-top:8px">
      <button data-act="next" class="h-a800 a-a900" style="min-height:56px;padding:10px 22px;border:0;background:var(--color-accent-700);color:var(--color-bg);${BTN};font-size:18px;font-weight:600">${esc(v.nextLabel)}</button>
      <button data-act="replay" class="h-n200" style="min-height:56px;padding:10px 22px;border:1px solid var(--color-divider);background:transparent;color:var(--color-text);${BTN};font-size:18px">${UI.replay}</button>
    </div>
  </div>
</div>`;
