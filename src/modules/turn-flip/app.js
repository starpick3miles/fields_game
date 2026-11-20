// Turn & Flip controller: state, animations, sound and touch gestures.
// The rules live in rules.js (pure, tested); the markup lives in view.js.
import { key, size } from '../../core/d4.js';
import { solveH, mapPoint } from '../../core/homography.js';
import { OPS, LEVELS, LV, S, STORE, BCX, BCY, HOLE_DX } from './levels.js';
import * as R from './rules.js';
import * as V from './view.js';
import { morph } from '../../ui/morph.js';
import { play } from '../../ui/sound.js';

const ZERO = 'translate3d(0px,0px,0px)';
const REGIONS = ['header', 'info', 'floor', 'overlay', 'cubes', 'bench', 'side', 'modal'];
const wrap180 = d => ((d % 360) + 540) % 360 - 180;
const kf = op => { const lift = op.flip ? 110 : 16; return [
  { transform: `translateZ(0px) ${op.f(0)}` },
  { transform: `translateZ(${lift}px) ${op.f(op.deg / 2)}` },
  { transform: `translateZ(0px) ${op.f(op.deg)}` }]; };
const uiFresh = (lv, round) => ({ ...R.fresh(lv, round), busy: false, won: false, ready: false, stars: 0, ghost: null });

const SHELL = `<div class="tf-root">
  <div data-r="header" style="display:contents"></div>
  <div data-r="info" style="display:contents"></div>
  <div style="display:flex;gap:24px;flex-wrap:wrap;align-items:flex-start">
    <div class="tf-stage" role="application" aria-label="원판을 돌려 회전하고, 도형을 쓸어 넘겨 대칭시키고, 도형을 끌어서 놓습니다." style="flex:1 1 480px;min-width:0;max-width:800px;position:relative;touch-action:none">
      <div class="tf-scaler" style="position:absolute;left:0;top:0;width:660px;height:380px;transform-origin:0 0;perspective:1300px;perspective-origin:50% 10%">
        <div class="tf-plane" style="position:absolute;left:10px;top:20px;width:640px;height:320px;transform:rotateX(50deg);transform-style:preserve-3d">
          <div class="tf-m" style="left:0;top:0"></div><div class="tf-m" style="left:639px;top:0"></div>
          <div class="tf-m" style="left:639px;top:319px"></div><div class="tf-m" style="left:0;top:319px"></div>
          ${['floor', 'overlay', 'cubes', 'bench'].map(r => `<div class="tf-layer" data-r="${r}"></div>`).join('')}
        </div>
      </div>
    </div>
    <div class="tf-side" data-r="side"></div>
  </div>
  <div data-r="modal" style="display:contents"></div>
</div>`;

export class TurnFlipApp {
  constructor(host, props = {}) {
    this.props = { twoTone: true, scoring: true, sound: true, ...props };
    host.innerHTML = SHELL;
    this.root = host.firstElementChild;
    this.wrap = host.querySelector('.tf-stage');
    this.scaler = host.querySelector('.tf-scaler');
    this.plane = host.querySelector('.tf-plane');
    this.regions = {};
    host.querySelectorAll('[data-r]').forEach(el => { this.regions[el.dataset.r] = el; });
    let saved = {}; try { saved = JSON.parse(localStorage.getItem(STORE) || '{}') || {}; } catch (e) { /* private mode */ }
    const lv = Math.min(LEVELS.length - 1, Math.max(0, saved.lv ?? 0));
    const round = Math.min(LEVELS[lv].rounds.length - 1, Math.max(0, saved.round ?? 0));
    this.state = { scale: 1, best: saved.best || {}, sound: saved.sound ?? this.props.sound, score: saved.score ?? this.props.scoring, flash: null, ...uiFresh(lv, round) };
    this.g = null; this.held = null;
    this.render();
    this.mount();
  }

  /* ---------- plumbing ---------- */
  setState(p, cb) {
    const patch = typeof p === 'function' ? p(this.state) : p;
    if (patch) this.state = { ...this.state, ...patch };
    this.render();
    if (cb) cb();
  }
  render() {
    const s = this.state, v = V.values(s, this.props.twoTone);
    for (const r of REGIONS) morph(this.regions[r], V[r](v));
    this.wrap.style.height = Math.round(380 * s.scale) + 'px';
    this.scaler.style.transform = `scale(${s.scale})`;
  }
  mount() {
    // the stage is as large as the width allows, but never so tall that the page has to scroll
    this.fit = () => {
      const top = this.wrap.getBoundingClientRect().top + window.scrollY, availH = window.innerHeight - top - 16;
      const sc = Math.min(1.2, this.wrap.clientWidth / 660, Math.max(0.8, availH / 380));
      if (Math.abs(sc - this.state.scale) > 0.002) this.setState({ scale: sc });
    };
    new ResizeObserver(this.fit).observe(this.wrap);
    window.addEventListener('resize', this.fit);
    this.fit();
    for (const [ev, f] of [['pointerdown', 'pDown'], ['pointermove', 'pMove'], ['pointerup', 'pUp'], ['pointercancel', 'pCancel']])
      this.wrap.addEventListener(ev, e => this[f](e));
    this.root.addEventListener('click', e => {
      const b = e.target.closest('[data-act]');
      if (b) this.act(b.dataset.act, b.dataset.arg);
    });
  }
  act(a, arg) {
    const s = this.state, L = LV(s.lv, s.round);
    if (a === 'level') this.load(+arg, 0);
    if (a === 'score') this.setState({ score: !s.score }, () => this.persist());
    if (a === 'sound') this.setState({ sound: !s.sound }, () => this.persist());
    if (a === 'pick') this.pick(arg);
    if (a === 'op') this.doOp(arg);
    if (a === 'undo') this.undo();
    if (a === 'hint') this.hint();
    if (a === 'next') s.round < L.n - 1 ? this.load(s.lv, s.round + 1) : this.load((s.lv + 1) % LEVELS.length, 0);
    if (a === 'replay') this.load(s.lv, s.round);
  }
  pieceEl() { return this.regions.bench.querySelector('.tf-piece'); }
  clearTimers() { clearTimeout(this.tm); clearTimeout(this.readyTm); clearTimeout(this.flashTm); if (this.g) clearTimeout(this.g.timer); }
  load(lv, round = 0) {
    this.clearTimers(); this.g = null; this.held = null;
    if (this.winAnim) { this.winAnim.cancel(); this.winAnim = null; }
    this.setT('');
    this.setState(uiFresh(lv, round), () => this.fit());
    this.persist({ lv, round });
  }
  persist(over) {
    const s = { ...this.state, ...(over || {}) };
    try { localStorage.setItem(STORE, JSON.stringify({ best: s.best, lv: s.lv, round: s.round, score: s.score, sound: s.sound })); } catch (e) { /* private mode */ }
  }
  beep(kind) { if (this.state.sound) play(kind); }

  /* ---------- animation helpers ---------- */
  setT(v) { const el = this.pieceEl(); if (el) el.style.transform = v; }
  tween(from, to, ms, done) {
    const el = this.pieceEl();
    if (el && el.animate) {
      el.style.transform = '';
      const a = el.animate([{ transform: from }, { transform: to }], { duration: ms, easing: 'ease-out', fill: 'forwards' });
      a.onfinish = () => done(a);
    } else { if (el) el.style.transform = ''; done(null); }
  }
  animate(op, done) {
    const el = this.pieceEl();
    if (el && el.animate) { const a = el.animate(kf(op), { duration: op.flip ? 600 : 380, easing: 'ease-in-out', fill: 'forwards' }); a.onfinish = () => done(a); }
    else done(null);
  }
  flash(id) { clearTimeout(this.flashTm); this.setState({ flash: id }); this.flashTm = setTimeout(() => this.setState({ flash: null }), 300); }
  runHeld() { const h = this.held; this.held = null; if (h) h(); }
  idle() { this.setState({ busy: false, ghost: null }, () => { this.resumeReady(); this.runHeld(); }); }
  resumeReady() {
    const s = this.state; clearTimeout(this.readyTm);
    if (s.ready && !s.won && !s.busy) this.readyTm = setTimeout(() => this.fly(), 2000);
  }

  /* ---------- moves ---------- */
  commitOps(ids, after) { this.setState({ ...R.commitOps(this.state, ids), busy: false, ready: false, hint: null, ghost: null }, after); }
  doOp(id, byGesture) {
    const s = this.state, L = LV(s.lv, s.round);
    if (s.won || !(L.ops || []).includes(id)) return;
    if (s.busy) { this.held = () => this.doOp(id, byGesture); return; }
    clearTimeout(this.readyTm);
    const op = OPS[id];
    this.beep(op.flip ? 'flip' : 'turn'); if (byGesture) this.flash(id);
    this.setState({ busy: true, ready: false, hint: null, ghost: null });
    this.animate(op, a => this.commitOps([id], () => { if (a) a.cancel(); this.afterOp(); }));
  }
  afterOp() {
    const s = this.state, L = LV(s.lv, s.round);
    if (R.fitsHole(L, s)) this.setState({ ready: true }, () => { this.resumeReady(); this.runHeld(); });
    else this.runHeld();
  }
  fly() {
    const s = this.state;
    if (!s.ready || s.busy || s.won || this.g) return;
    this.setState({ busy: true, ready: false });
    const el = this.pieceEl();
    if (!el || !el.animate) return this.finish();
    this.winAnim = el.animate([{ transform: ZERO }, { transform: `translate3d(${HOLE_DX / 2}px,0px,130px)` }, { transform: `translate3d(${HOLE_DX}px,0px,0px)` }],
      { duration: 800, easing: 'ease-in-out', fill: 'forwards' });
    this.winAnim.onfinish = () => { this.beep('place'); this.tm = setTimeout(() => this.finish(), 400); };
  }
  finish() {
    const s = this.state, L = LV(s.lv, s.round), k = s.lv + '.' + s.round;
    const stars = R.stars(L, s.moves, s.hintUsed);
    const best = s.score ? { ...s.best, [k]: Math.max(stars, s.best[k] || 0) } : s.best;
    this.persist({ best }); this.beep('good');
    this.setState({ won: true, stars, best, busy: false, ready: false });
  }
  pick(id) {
    const s = this.state, L = LV(s.lv, s.round);
    if (s.busy || s.won) return;
    const res = R.pick(L, s, id);
    if (!res) return;
    if (!res.right) { this.beep('bad'); this.setState(res.patch); return; }
    const op = OPS[id]; this.beep(op.flip ? 'flip' : 'turn');
    this.setState({ busy: true, ...res.patch });
    this.animate(op, a => this.setState(st => R.afterPick(st, id), () => { if (a) a.cancel(); this.tm = setTimeout(() => this.nextQ(), 900); }));
  }
  nextQ() {
    const n = R.nextQ(LV(this.state.lv, this.state.round), this.state);
    if (!n) return this.finish();
    this.setState({ ...n, busy: false });
  }
  setCell(x, y, on) {
    const s = this.state, L = LV(s.lv, s.round);
    if (s.busy || s.won) return;
    const p = R.setCell(L, s, x, y, on);
    if (!p) return;
    this.beep(on ? 'place' : 'turn');
    this.setState(p, () => {
      if (!this.state.busy && R.mirrorDone(L, this.state.right)) { this.g = null; this.setState({ busy: true }); this.tm = setTimeout(() => this.finish(), 500); }
    });
  }
  place(abs, after) {
    const s = this.state, L = LV(s.lv, s.round);
    this.beep('place');
    this.setState({ ...R.place(L, s, abs), busy: false }, () => {
      if (after) after();
      if (R.boardFull(this.state.placed)) { this.setState({ busy: true }); this.tm = setTimeout(() => this.finish(), 600); }
      else this.runHeld();
    });
  }
  tapCell(cell) {
    const s = this.state, L = LV(s.lv, s.round);
    if (s.won) return;
    const [x, y] = cell;
    if (L.type === 'mirror') { this.setCell(x, y, !s.right.includes(x + ',' + y)); return; }
    if (L.type !== 'fill') return;
    if (s.busy) { this.held = () => this.tapCell(cell); return; }
    const gh = s.ghost;
    if (gh && gh.tap && gh.ok && gh.abs.some(c => c[0] === x && c[1] === y)) { this.place(gh.abs); return; }
    const p = R.placement(s, x, y);
    this.beep(p.ok ? 'tick' : 'bad');
    this.setState({ ghost: { ...p, tap: true }, hint: null });
  }
  undo() {
    const s = this.state;
    if (s.busy || s.won || !s.history.length) return;
    clearTimeout(this.readyTm);
    this.setState(R.undo(s));
  }
  hint() {
    const s = this.state, L = LV(s.lv, s.round);
    if (s.busy || s.won || s.ready) return;
    const p = R.hint(L, s, s.score);
    if (p) this.setState(L.type === 'predict' ? p : { ...p, ghost: null });
  }

  /* ---------- touch: where is the finger on the table? ---------- */
  measure() {
    const ms = [...this.plane.querySelectorAll('.tf-m')];
    const pts = ms.map(m => { const r = m.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; });
    const o = pts[0];
    const h = solveH(pts.map(p => [p[0] - o[0], p[1] - o[1]]), [[.5, .5], [639.5, .5], [639.5, 319.5], [.5, 319.5]]);
    return h ? { h, o } : null;
  }
  toPlane(cx, cy) { return mapPoint(this.H.h, this.H.o, cx, cy); }
  boardOf(L) { return L.type === 'mirror' ? { x: 96, y: 20, cols: L.cols, rows: L.rows } : { x: 368, y: 48, cols: 4, rows: 4 }; }
  cellAt(cx, cy, L) {
    if (L.type !== 'mirror' && L.type !== 'fill') return null;
    const B = this.boardOf(L);
    const hit = document.elementFromPoint(cx, cy), cube = hit && hit.closest ? hit.closest('.tf-cube') : null;
    if (cube) return [Math.round((parseFloat(cube.style.left) - B.x) / S), Math.round((parseFloat(cube.style.top) - B.y) / S)];
    const P = this.toPlane(cx, cy), fx = (P[0] - B.x) / S, fy = (P[1] - B.y) / S;
    if (fx < -.5 || fy < -.5 || fx >= B.cols + .5 || fy >= B.rows + .5) return null;
    return [Math.max(0, Math.min(B.cols - 1, Math.floor(fx))), Math.max(0, Math.min(B.rows - 1, Math.floor(fy)))];
  }
  angleAt(cx, cy) { const P = this.toPlane(cx, cy); return Math.atan2(P[1] - BCY, P[0] - BCX) * 180 / Math.PI; }
  twistAngle(g) {
    const ids = Object.keys(g.pts), a = this.toPlane(...g.pts[ids[0]]), b = this.toPlane(...g.pts[ids[1]]);
    return Math.atan2(b[1] - a[1], b[0] - a[0]) * 180 / Math.PI;
  }

  /* ---------- touch: gestures ---------- */
  pDown(e) {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    const s = this.state, L = LV(s.lv, s.round), t = L.type, el = this.wrap;
    if (s.won || t === 'predict') return;
    const g0 = this.g;
    if (g0) {
      if (!g0.pts && (g0.mode === 'pending' || g0.mode === 'turn') && !s.busy) {
        clearTimeout(g0.timer);
        g0.mode = 'twist'; g0.pts = { [g0.id]: g0.last, [e.pointerId]: [e.clientX, e.clientY] };
        g0.ang = this.twistAngle(g0); g0.acc = 0;
        try { el.setPointerCapture(e.pointerId); } catch (err) { /* already released */ }
      }
      return;
    }
    this.H = this.measure(); if (!this.H) return;
    const x = e.clientX, y = e.clientY, piece = this.pieceEl(), hit = document.elementFromPoint(x, y);
    let zone = null, cell = null;
    if (piece && hit && piece.contains(hit)) zone = 'piece';
    else if ((cell = this.cellAt(x, y, L))) zone = 'cell';
    else if (t !== 'mirror') { const P = this.toPlane(x, y); if (Math.hypot(P[0] - BCX, P[1] - BCY) <= 146) zone = 'disc'; }
    if (!zone) return;
    try { el.setPointerCapture(e.pointerId); } catch (err) { /* already released */ }
    e.preventDefault();
    const g = { id: e.pointerId, x0: x, y0: y, t0: performance.now(), last: [x, y] };
    if (s.busy) { if (zone === 'cell' && t === 'fill') { g.mode = 'heldtap'; g.cell = cell; this.g = g; } return; }
    clearTimeout(this.readyTm);
    if (zone === 'piece') { g.mode = 'pending'; g.timer = setTimeout(() => this.startDrag(), 250); }
    if (zone === 'disc') { g.mode = 'turn'; g.ang = this.angleAt(x, y); g.acc = 0; }
    if (zone === 'cell') { g.mode = 'cell'; g.cell = cell; g.painting = false; }
    this.g = g;
  }
  pMove(e) {
    const g = this.g; if (!g) return;
    const x = e.clientX, y = e.clientY;
    if (g.mode === 'twist') {
      if (!g.pts[e.pointerId]) return;
      g.pts[e.pointerId] = [x, y];
      const a = this.twistAngle(g); g.acc += wrap180(a - g.ang); g.ang = a;
      this.setT(`rotateZ(${g.acc}deg)`); return;
    }
    if (e.pointerId !== g.id) return;
    g.last = [x, y];
    if (g.mode === 'turn') { const a = this.angleAt(x, y); g.acc += wrap180(a - g.ang); g.ang = a; this.setT(`rotateZ(${g.acc}deg)`); }
    if (g.mode === 'drag') this.dragTo(x, y);
    if (g.mode === 'cell' && LV(this.state.lv, this.state.round).type === 'mirror') {
      const c = this.cellAt(x, y, LV(this.state.lv, this.state.round));
      if (!g.painting && c && (Math.hypot(x - g.x0, y - g.y0) > 10 || c[0] !== g.cell[0] || c[1] !== g.cell[1])) {
        g.painting = true; g.want = !this.state.right.includes(g.cell[0] + ',' + g.cell[1]);
        this.setCell(g.cell[0], g.cell[1], g.want);
      }
      if (g.painting && c) this.setCell(c[0], c[1], g.want);
    }
  }
  pUp(e) {
    const g = this.g; if (!g) return;
    if (g.mode === 'twist') { if (!g.pts[e.pointerId]) return; this.g = null; this.endTurn(g.acc); return; }
    if (e.pointerId !== g.id) return;
    this.g = null; clearTimeout(g.timer);
    const dx = e.clientX - g.x0, dy = e.clientY - g.y0, dist = Math.hypot(dx, dy), dt = performance.now() - g.t0;
    if (g.mode === 'pending') { if (dist >= 40 && dt <= 250) this.flick(dx, dy); else this.resumeReady(); }
    else if (g.mode === 'turn') this.endTurn(g.acc);
    else if (g.mode === 'drag') this.endDrag(g);
    else if (g.mode === 'cell') { if (!g.painting && dist <= 10) this.tapCell(g.cell); }
    else if (g.mode === 'heldtap') { if (dist <= 10) this.tapCell(g.cell); }
  }
  pCancel() {
    const g = this.g; if (!g) return;
    this.g = null; clearTimeout(g.timer); this.setT('');
    if (this.state.ghost && !this.state.ghost.tap) this.setState({ ghost: null });
    this.resumeReady();
  }
  flick(dx, dy) {
    const a = ((Math.atan2(dy, dx) * 180 / Math.PI) % 180 + 180) % 180;
    const id = (a < 22.5 || a >= 157.5) ? 'lr' : (a >= 67.5 && a < 112.5) ? 'ud' : 'diag';
    if ((LV(this.state.lv, this.state.round).ops || []).includes(id)) this.doOp(id, true); else this.resumeReady();
  }
  endTurn(acc) {
    const steps = Math.round(acc / 90), from = `rotateZ(${acc}deg)`;
    if (!steps) {
      if (Math.abs(acc) < 1) { this.setT(''); this.resumeReady(); return; }
      this.setState({ busy: true });
      this.tween(from, 'rotateZ(0deg)', 150, a => { if (a) a.cancel(); this.idle(); }); return;
    }
    const id = steps > 0 ? 'cw' : 'ccw', ids = Array(Math.abs(steps)).fill(id);
    this.beep('turn'); this.flash(id);
    this.setState({ busy: true, ready: false, hint: null });
    this.tween(from, `rotateZ(${steps * 90}deg)`, 150, a => this.commitOps(ids, () => { if (a) a.cancel(); this.afterOp(); }));
  }
  startDrag() {
    const g = this.g, s = this.state, t = LV(s.lv, s.round).type;
    if (!g || g.mode !== 'pending' || s.busy || s.won || (t !== 'fill' && t !== 'match')) return;
    g.mode = 'drag'; this.beep('tick');
    if (s.hint || s.ghost) this.setState({ hint: null, ghost: null });
    this.dragTo(g.last[0], g.last[1]);
  }
  dragTo(x, y) {
    const g = this.g, s = this.state, P = this.toPlane(x, y), [pw, ph] = size(s.piece);
    const cx = P[0], cy = P[1] - ph * S / 2 - 20;          // the piece rides above the finger
    g.d = [cx - BCX, cy - BCY];
    this.setT(`translate3d(${g.d[0]}px,${g.d[1]}px,40px)`);
    if (LV(s.lv, s.round).type !== 'fill') return;
    const ox = Math.round((cx - pw * S / 2 - 368) / S), oy = Math.round((cy - ph * S / 2 - 48) / S);
    const over = ox > -pw && ox < 4 && oy > -ph && oy < 4, k = over ? ox + ',' + oy : '';
    if (k === g.gk) return;
    g.gk = k; g.o = [ox, oy];
    this.setState({ ghost: over ? R.placementAt(s, ox, oy) : null });
  }
  endDrag(g) {
    const s = this.state, L = LV(s.lv, s.round), d = g.d || [0, 0];
    const from = `translate3d(${d[0]}px,${d[1]}px,40px)`;
    const back = loud => { if (loud) this.beep('bad'); this.setState({ busy: true }); this.tween(from, ZERO, 250, a => { if (a) a.cancel(); this.idle(); }); };
    if (L.type === 'fill') {
      const gh = s.ghost;
      if (gh && gh.ok && !gh.tap) {
        const [pw, ph] = size(s.piece);
        const tx = 368 + g.o[0] * S + pw * S / 2 - BCX, ty = 48 + g.o[1] * S + ph * S / 2 - BCY;
        this.setState({ busy: true });
        this.tween(from, `translate3d(${tx}px,${ty}px,0px)`, 120, a => this.place(gh.abs, () => { if (a) a.cancel(); }));
      } else back(Math.hypot(d[0], d[1]) > 80);
      return;
    }
    if (Math.hypot(d[0] - HOLE_DX, d[1]) >= 100) { back(false); return; }
    if (key(s.piece) === key(L.target)) {
      this.setState({ busy: true, ready: false });
      this.tween(from, `translate3d(${HOLE_DX}px,0px,0px)`, 200, a => { this.winAnim = a; this.beep('place'); this.tm = setTimeout(() => this.finish(), 400); });
    } else {
      const rest = `translate3d(${HOLE_DX}px,0px,6px)`;
      this.setState({ busy: true });
      this.tween(from, rest, 150, a => { this.tm = setTimeout(() => { this.beep('bad');
        this.tween(rest, ZERO, 250, b => { if (a) a.cancel(); if (b) b.cancel(); this.idle(); }); }, 400); });
    }
  }
}
