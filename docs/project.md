# Fields Math Playground — Project Doc

> Working name: **Fields Math Playground** (필즈 수학 놀이터)
> Status: **v0.3** · 2026-11-20. v0.2 reframed the product as a shelf of 3D math books, with Techartist as the main reference. v0.3 updates the architecture (§9) from the code-level teardown.
> Grows out of: **Turn & Flip** (repo `starpick3miles/fields_game`, v2.1 on PR #1)
> Companion doc: `techartist-teardown.md` (the reverse-engineering notes this version is built on)

---

## 1. Summary

Fields Math Playground is a **shelf of interactive 3D math books** that a teacher presents from an iPad. It follows the format of Techartist's 3D physics books.

- **Book (입체책):** one curriculum unit.
- **Spread (펼침면):** one idea. A small 3D world rises off the page, a demonstrator character shows it once, and then the class works it out together.
- **Engine:** every spread runs on one shared math engine. The same world can be explored, solved as a puzzle, predicted, watched as a looping clip, or reversed.
- **First book:** **Turn & Flip**. Its five levels become five spreads. Later books (stacked cubes, nets, gears, probability) are mostly data plus a few new modules.

---

## 2. Starting point: what Turn & Flip already proves

| Already working in Turn & Flip | What it becomes |
|---|---|
| 3D table stage (CSS 3D, 660×380 artboard, cube 56 px, two-tone faces) | The shared **Stage**, with a swappable renderer |
| Five levels with different interaction types (match, predict, tap, fill) | Five **spreads** of Book 1, built from reusable **Beats** and **Modes** |
| Move counter, stars, undo, hints | Shared **Timeline + Scoring**; stars stay optional and **stamps** are added |
| Turn 380 ms, flip 600 ms with lift | Shared **Motion** layer (analytic springs, §5.3) |
| Cyan side up = only turned; magenta = flipped an odd number of times | A design rule for every book: **make hidden state visible** |
| Progress saved in `localStorage` (`turnflip.v1`) | Per-book saved progress (§9.1) |
| Tweaks: `twoTone`, `mathLabels`, `sound` | Global teacher settings plus per-book tweaks |

Classroom constraints carried forward:

- **The teacher runs it**, on an **iPad in landscape**, mirrored to a classroom screen. Students don't play alone (yet).
- **Korean UI with formal math terms** (돌리기, 뒤집기, 대칭축, 전개도 …).
- **Gestures and buttons both available.** Dragging must work, taps must not miss or misfire, and every placement shows a preview first.
- **Scoring is optional.**
- **Teacher annotation** comes later, reusing the user's GoodNotes-style side project.

---

## 3. Main reference: Techartist 3D books

Full notes are in `techartist-teardown.md`. In short:

Techartist (iamtechartist.com) has 21 free browser demos, most of them **3D curriculum books**. *Newton's Laws of Motion: a 3D holographic book* has 7 spreads. On each, an experiment is projected out of the book, a marble bust of Newton performs it once with a joke that carries a real fact, and then students run it themselves. Every book comes with teachers' notes, a projector mode and sources. Sibling books add **predict → test → prove**, **lift-the-flap** answers, **stamps**, a **tour → try → quiz** loop, **self-checks and a chapter test**, and **10 languages including Korean**.

| Techartist pattern | Fields version |
|---|---|
| Book of 6–10 spreads, plus a chapter test | Book = one curriculum unit (단원); spread = roughly one lesson (차시); ends with a **단원 평가** |
| Experiment rises off the page as a hologram | Each spread's math world rises off the page onto the 3D stage |
| Demonstrator performs once, with a joke | An **original Fields character** shows the move once, with a one-line math fun fact in Korean |
| Watch, then try | **Hook beat** → **Try beat**, with the teacher driving |
| Predict → test → prove; lift the flap | **Predict beat** (the class commits, then the answer is revealed under a flap) |
| Stamps | A stamp for each finished spread; stars stay optional |
| Projector mode, teachers' notes, sources | **Presenter-first by default**, plus a 교사용 안내 (teacher's guide) and sources for each book |
| Themed world per book | One themed world per book (e.g. a toy workshop for Book 1) |
| Separate landing page and app; GPU warning with "Open anyway"; "Enter" / "Enter without sound" | Book landing page + app route; a "그래도 열기" (open anyway) gate with a CSS 3D fallback; **시작 / 소리 없이 시작** (start / start without sound) |
| Multilingual | Korean first; the string files are ready for other languages |

**Code-level findings** (teardown §6, pieced together without a browser from the books' app shells and the author's MIT-licensed repos):

- Each book is a separate static app on a shared shell.
- All words live in the page rather than in the 3D scene, so lesson text and the teachers' page still work when WebGL fails.
- Teachers' notes are generated from data, including what each model simplifies and which questions to ask.
- The author's recent work uses three.js's WebGPU build with TSL, an HTML control dock with keyboard shortcuts and a hide-controls toggle, Auto / High / Light quality, and speed / scrub / step time controls.

§9 adopts these.

---

## 4. Other inspirations (what we take from each)

| Source | What we take | How we go further |
|---|---|---|
| **Newton** (newton-physics/newton). GPU-accelerated, differentiable physics on NVIDIA Warp; Apache-2.0; Linux Foundation project | The split of `ModelBuilder → Model / State / Control → Solver.step → Renderer`; swappable solvers; several viewers; an examples registry (`--list`); importers | We swap **math kernels**, not physics solvers. Its DiffSim examples (finding inputs from outcomes) inspire our **Reverse** mode, solved exactly by search instead of gradients |
| **SimuPhysics**. 100+ simulations in 9 categories, including Mathematics; "Request a Simulation" | A browsable catalogue and a request channel | We add lesson structure (books, beats) and teacher controls |
| **@magic-spells/physics-engine**. ~1.4 kB analytic spring; frame-rate independent; retargets mid-motion while keeping its velocity | Analytic, time-based motion everywhere, and retargeting when a drag is released | We extend it to rotations (slerp) and to scripted multi-step sequences |
| **Engineering Magic** (YouTube Shorts). Looping 3D mechanism clips with close-ups and motion paths | **Show mode**, motion trails, and "math as mechanism" (gears, cranks, wheels) | Our clips are live scenes: pause, rotate, change a parameter, replay |
| **Desmos 3D / Polypad / MathBox / Polyhedra Viewer** | Sliders and "quests"; Polypad's authoring mode (disable actions, restrict tiles); presentation-quality 3D math; morphs between solids | — |

---

## 5. Vision and principles

**Vision.** *A teacher taps a book, and within ten seconds the class is watching a math idea rise off the page. Then they are turning it, breaking it and rebuilding it together.*

### 5.1 Principles

1. **Presenter first.** Techartist's books are self-paced, with a projector mode as an extra. Ours start from the teacher at the front: big targets, no misfires, instant reset, lock and reveal, no surprise pop-ups.
2. **Show once, then hand over.** Each spread opens with a demonstration (*I do*), then the class takes control (*we do*).
3. **Commit before revealing.** Predict first, then lift the flap. The answer is never visible before the class commits.
4. **Exact math underneath, smooth motion on top.** Checks run on exact values (integer grids, transform groups, rationals). Animation only fills the gap between two exact states.
5. **Make hidden state visible.** Orientation, parity, sign, remainder and symmetry are shown with colour, trails and ghosts.
6. **Everything replays.** Starting state plus the list of actions fully determines a spread. That gives undo, replay, share-by-link and recording for free.
7. **One idea per spread, one unit per book.** Each book has a fixed number of spreads, so progress is always obvious.
8. **No jargon during play; precise words at the check.** The check step and the result card use the formal Korean terms.
9. **Offline and instant.** No install, no account needed to present, and it works with no network after the first load.

### 5.2 Non-goals (for now)

- Student self-paced accounts, homework and grading
- A general CAS or graphing calculator
- Realistic engineering physics; game and art pieces

### 5.3 Motion spec (shared)

| Motion | Model | Default |
|---|---|---|
| Discrete step (turn, flip, fold) | Analytic spring on progress 0→1, with slerp for orientation | ζ ≈ 0.8, settles in ≈ 380–600 ms |
| "Rise off the page" (start of a spread) | Spring on lift and scale, staggered per object | ≈ 700 ms |
| Drag release | Retarget the spring, keeping its velocity, to the nearest valid snap | — |
| Wrong move | Short damped shake | 250 ms |
| Flap reveal | Hinge rotation on a spring | ≈ 450 ms |
| Show-mode camera | Critically damped spring on the camera pose | — |
| Reduced motion | Cross-fade between states | — |

---

## 6. Core concepts

```
Shelf (책장)
 └─ Book (입체책)          one unit: theme, demonstrator, teacher's guide, sources, 단원 평가
     └─ Spread (펼침면)     one idea: a Module + a Scene + a list of Beats
         └─ Beat (단계)     hook → tour → try → predict → check → stamp
             └─ Module      World / State / Action / Rule / Goal / Lens   ← Newton-style split
```

### 6.1 The module layer (Newton-inspired)

```
ModuleDef ──build(scene)──▶ World (fixed setup)          ← Newton: ModelBuilder → Model
                             │
                  State ◀────┤ init(world)               ← Newton: State
                    │
     Action ──▶ Rule.step(world, state, action) → State'  ← Newton: Control + Solver.step
                    │
                 Goal.check(state) → {solved, progress, hint}
                    │
            Lens.render(world, state, motion)             ← Newton: Renderer / viewers
```

| Concept | Meaning | Turn & Flip example |
|---|---|---|
| **World** | The fixed setup: board, pieces, allowed moves, parameters | A board with an L-shaped hole; moves ↻ ↺ ↔ ↕ ⤡ |
| **State** | A plain, serialisable snapshot | The piece's orientation as an element of D4 (the dihedral group), plus placed cells |
| **Action** | One user intent | `{type:"turn", dir:"cw"}` |
| **Rule** | A pure function `(world, state, action) → state` | Compose D4 elements |
| **Goal** | The win condition plus a hint generator | Orientation equals the target; hint = next move on the shortest path |
| **Lens** | One way to draw the state | 3D table · top view · symbol strip "↻↻↔" |
| **Timeline** | Ordered list of actions; undo, redo, replay | The move-log chips on the result card |

### 6.2 Contracts (TypeScript sketch)

```ts
// ── Module: one kind of math world ──────────────────────────
export interface MathModule<W, S, A> {
  id: string;                                // "geometry.turn-flip"
  version: number;                           // bump when the State shape changes
  build(scene: SceneJSON): W;
  init(world: W): S;
  actions(world: W, state: S): A[];          // legal moves → buttons and gestures
  step(world: W, state: S, action: A): S;    // pure, deterministic
  goal?: Goal<W, S>;
  lenses: Lens<W, S>[];                      // at least one 3D lens
  shows?: Record<string, ShowScript>;        // scripted demos, used by hook beats
  explain(world: W, timeline: A[]): Explanation;  // formal Korean wording for the check
}

// ── Book: a curriculum unit, made of spreads ────────────────
export interface BookDef {
  id: string;                                // "book.turn-flip"
  title: Localized;                          // { ko: "돌리기와 뒤집기" }
  unit: { grade: string; curriculum?: string[] };  // 2022 개정 교육과정 mapping
  theme: ThemeId;                            // the book's world, e.g. "toy-workshop"
  demonstrator?: CharacterId;                // original Fields character
  spreads: SpreadDef[];
  test?: BeatDef[];                          // 단원 평가
  teacherGuide: TeacherNotes;                // 교사용 안내, generated into its own page (§9.1)
  sources: Source[];
}

export interface SpreadDef {
  id: string;
  title: Localized;
  module: string;                            // which module runs this spread
  scene: SceneJSON;                          // that module's parameters (§6.3)
  beats: BeatDef[];
}

export type BeatDef =
  | { kind: "hook";    show: string; fact?: Localized }               // demonstrator performs once
  | { kind: "tour";    steps: { camera?: CameraPose; caption: Localized }[] }
  | { kind: "try";     mode: "puzzle" | "explore"; task?: Localized }
  | { kind: "predict"; prompt: Localized; choices: Choice[]; answer: string }  // flap reveal
  | { kind: "reverse"; from: SceneJSON; to: SceneJSON }               // "what happened?"
  | { kind: "check";   items: CheckItem[] }                           // self-check
  | { kind: "stamp" };

export interface TeacherNotes {                // one entry per spread
  [spreadId: string]: {
    objective: Localized;                      // 학습 목표
    standard?: string;                         // 성취기준 code
    simplifications: Localized[];              // what the model leaves out or simplifies
    questions: Localized[];                    // 발문: questions to ask the class
    misconceptions?: Localized[];              // 예상 오개념
    minutes?: number;
  };
}
```

Because `step` is pure, the shell provides **undo, shortest-path hints (breadth-first search over `actions`), replay, share links and recording** for every module without extra module code. Because a book is just data, a new book is mostly JSON plus Korean strings, which is how one person can ship many books.

### 6.3 Scene format (one spread's parameters)

```json
{
  "module": "geometry.turn-flip",
  "params": { "piece": "P5", "target": { "turn": 90, "flip": "diag" } },
  "allowed": ["cw", "ccw", "flipH", "flipV", "flipD"],
  "scoring": { "visible": false },
  "lock": ["camera"]
}
```

---

## 7. Beats and modes

A **beat** is one step of a spread's lesson. A **mode** is the interaction a module offers. Beats use modes.

| Beat | Uses mode | What the presenter sees | Origin |
|---|---|---|---|
| **Hook** | Show | The demonstrator performs the move once (scripted camera, trails), then one fun fact | Techartist P4, Engineering Magic |
| **Tour** | Show (stepped) | Next/back through captions and camera moves | Techartist P9 |
| **Try** | Puzzle or Explore | Full control; hints and undo; optional moves and stars | Turn & Flip levels 1, 2, 4, 5 |
| **Predict** | Predict | 3–4 answer tiles → **lift the flap** → the reveal animation plays | Turn & Flip level 3; Techartist P6–P7 |
| **Reverse** | Reverse | Start and end states shown; the class reconstructs the moves | Newton DiffSim, inverted |
| **Check** | — | 1–3 self-check questions in formal terms; the explanation card | Techartist P10 |
| **Stamp** | — | A stamp lands on the spread; the book's progress bar fills | Techartist P8 |

Presenter controls on every beat:

- **pause / step**
- **speed** (1× · ¼× · ⅒×) and a **scrub bar** for any animation
- **reveal / hide**
- **lock input** (stray taps on the mirrored screen do nothing)
- **spotlight**
- **skip beat**
- **hide controls** (a clean screen for the class)
- later, an **annotation layer** (from the GoodNotes side project)

Each control has a keyboard shortcut for an iPad with a keyboard (§9.1).

---

## 8. Shelf v1

Grade and unit mapping is a first pass. Check each one against the **2022 개정 교육과정**.

| Book | Spreads (draft) | Modules | Unit and grade (to verify) |
|---|---|---|---|
| **1 · 돌리기와 뒤집기** (from Turn & Flip) | 돌리기 · 뒤집기 · 어떻게 될까? · 거울 대칭 · 채우기 + 단원 평가 | G1 (G2 and G3 later) | Current spec: K–2. Closest unit: 평면도형의 이동, grade 4 |
| **2 · 쌓기나무** | 세어 보기 · 위/앞/옆에서 본 모양 · 모양 보고 쌓기 · 가장 적게/많게 · 층별로 나타내기 | G5 | Grade 6 |
| **3 · 전개도** | 펼치기 · 접기 · 정육면체가 되는 전개도 찾기 · 각기둥과 각뿔의 전개도 | G4 | Grades 5–6 |
| **4 · 톱니바퀴 수학** ⚙️ | 맞물려 도는 수 · 곱셈 · 약수와 배수 · 다시 만나는 순간 (최소공배수) | N2 | Grade 5 |
| **5 · 주사위와 가능성** | 주사위 던지기 · 두 주사위의 합 · 갈톤 보드 | D1, D2 | Grades 5–6 |

### 8.1 Module catalogue (the building blocks books draw from)

| Strand | Modules |
|---|---|
| Geometry and space | G1 Turn & Flip · G2 Slide, Flip, Turn on a grid · G3 Mirror Line · G4 Fold It (nets) · G5 Cube Stacks · G6 Slice It (cross-sections) · G7 Tile the Plane · G8 Polyhedra Morph |
| Number and operations | N1 Place-Value Blocks · N2 Gear Ratio ⚙️ · N3 Array Builder · N4 Fraction Volumes |
| Measurement | M1 Fill the Box · M2 Unwrap the Can · M3 Rolling Wheel ⚙️ |
| Data and probability | D1 Galton Board · D2 Dice Lab |
| Patterns and algebra | A1 Crank to Wave ⚙️ · A2 Growing Patterns · A3 Surface Garden |

⚙️ = a "math mechanism" module (Engineering Magic style), which makes a strong hook beat.

---

## 9. Architecture

### 9.1 Stack and delivery

| Layer | Choice | Why |
|---|---|---|
| Language / UI | **Plain JavaScript modules** with JSDoc types (`// @ts-check`); no framework and no build step. *Decided in P0* | Runs straight from GitHub Pages and offline, like the reference author's no-build repos. The screen is updated in place, so taps aren't lost mid-update |
| 3D | **three.js `WebGPURenderer` + TSL** as the main lens. It falls back to WebGL 2 by itself; teacher settings add a `forceWebGL` switch. **CSS 3D** lens as the last resort | Matches the reference author's current stack. iPadOS 26 Safari has WebGPU; older iPads get WebGL 2, and TSL materials work on both. The manual still calls it experimental, so pin the three.js version; the Lens interface keeps a switch to `WebGLRenderer` cheap |
| Math kernels | Pure TypeScript, exact arithmetic | Deterministic checks; easy to test |
| Physics (only where needed) | **Rapier** (WASM) behind a seeded, fixed-step wrapper, lazy-loaded | Only probability-type modules need it |
| Motion | Our own ~2 kB analytic spring + quaternion slerp | Frame-rate independent on a mirrored iPad |
| Sound | WebAudio synth | No assets to load |
| Input | One Pointer Events gesture layer (drag, tap, two-finger rotate, long-press = preview) | Fixes the Turn & Flip touch problems once, for every module |
| **Startup** | A static title card in plain HTML (shows before any JS loads) with **시작** / **소리 없이 시작** → capability probe → dynamic `import()` of the book runtime, with a status line (`aria-live`) → on failure, an error panel with **다시 열기** (reopen) | The first tap unlocks audio (iPad Safari requires a user gesture) and sets the sound preference. Startup in layers, as in the reference books and the author's repos |
| **Capability gate** | No WebGPU or WebGL 2, or a software renderer → warning + **그래도 열기**. If 3D can't start at all, use the CSS 3D lens; the spread text and 교사용 안내 still work | Warn instead of blocking, and degrade instead of failing (as Every Joule does) |
| Viewport | `viewport-fit=cover` + safe-area insets; landscape-first | Fills the iPad screen |
| Content | Books as JSON + per-locale string files (`ko` first). **All words are HTML** over the canvas, never drawn into the 3D scene | A new book is data, not code. Text stays sharp when mirrored, works without WebGL, and is easy to translate |
| **교사용 안내** | A separate static page per book, generated from `TeacherNotes` (§6.2): objective, 성취기준, simplifications, questions to ask, misconceptions, minutes | The teacher layer works without the 3D runtime (Every Joule's teachers' page is built the same way) |
| UI controls | An HTML/CSS dock over the canvas: segmented toggles with `aria-pressed`, sliders, camera presets, a **더 보기** (more) drawer, and an `aria-label` on the stage that says how to interact | The reference author's pattern; accessible and easy to restyle |
| Shortcuts | → / ← next / previous beat · Space play/pause · R reveal · L lock · H hide controls · S spotlight (shown in button tooltips) | Fast presenting from an iPad keyboard or a clicker |
| Quality | **자동 / 높음 / 가볍게** (Auto / High / Light). Auto samples frame time for ~2 s, then caps pixel ratio and switches effects off if needed | Same tiers as the reference author's work; keeps mirrored iPads smooth |
| Geometry | Built in code only (cubes, nets, gears, dice); no model files | Tiny downloads and an instant start; math shapes are simple to generate |
| Progress | `localStorage` `fields.book.<id>.v<n>`: stamps per spread, best stars, last spread; JSON export | Matches the current approach; accounts later |
| Recording | Canvas `captureStream` + `MediaRecorder` | Show/hook clips teachers can keep |
| Build / hosting | No build step: static files on **GitHub Pages** from `fields_game`; PWA later (offline, add to Home Screen). Tests run on Node's built-in test runner | Instant and offline; the reference author also hosts on GitHub Pages |
| Book landing pages | A static page per book, generated from `BookDef` (pitch, spreads, grade, share image taken from the hook clip) | Techartist's landing-page + app split, without a CMS |

### 9.2 Repository layout (proposed, in `fields_game`)

```
/packages
  /core          World/State/Action/Rule/Goal/Lens types, timeline, BFS hinter, seeded RNG
  /book          BookDef/SpreadDef/BeatDef runtime: beat player, stamps, 단원 평가, progress
  /motion        analytic spring, slerp, camera rig, trails, "rise off the page"
  /input         unified gesture layer
  /lens-three    three.js renderer + shared materials (two-tone faces, ghosts, trails, flaps)
  /lens-css3d    legacy CSS 3D renderer (Turn & Flip parity)
  /physics       Rapier wrapper (lazy)
  /ui            shelf, book chrome, presenter bar, entry screen, capability gate, ko strings
/modules         geometry.turn-flip, geometry.cube-stacks, geometry.fold-it, number.gears, …
/books           book.turn-flip.json, book.cube-stacks.json, …  (+ /locales/ko/*.json)
/apps
  /hub           shelf → book → spread (PWA)
  /module-dev    single-module harness, like `newton.examples <name>` (`--list`)
```

### 9.3 URLs

- `/#/` shelf · `/#/b/turn-flip` book cover · `/#/b/turn-flip/s/3` spread 3 · `/#/b/turn-flip/test` 단원 평가
- `?scene=<base64>` overrides a spread's scene, so a teacher can bookmark an exact setup for tomorrow.

### 9.4 Quality bars

- **Under 2 s from load to interactive** on a recent iPad (physics books excepted)
- **60 fps target, 30 fps floor**, and the motion looks the same at both
- **Touch targets of 56 px or more**; drags snap to valid positions and preview before release
- **Unit tests** on every `step` and `goal`; **replay tests** on every puzzle; **beat-script tests** on every book (each spread can be played from start to finish)
- **Degrades, never dead-ends:** with 3D unavailable, every spread's text, checks and 교사용 안내 still work

---

## 10. Hub UX

- **Shelf.** Book covers grouped by strand. Each cover plays its hook clip, muted, on hover or focus. Filters: grade, strand, ⚙️.
- **Book cover.** Title, unit and grade, the list of spreads with stamps earned, a 교사용 안내 button, sources.
- **Spread.** The stage takes about 75% of the landscape screen. A beat bar at the top shows dots for hook · try · predict · check · stamp. The presenter bar is at the bottom. Parameters open in a drawer.
- **단원 평가.** Predict and reverse items from across the book, shown one at a time, with the reveal controlled by the teacher.
- **Request a book or spread.** A simple form (the SimuPhysics pattern).
- **Language.** Korean strings in one place, using formal terms. Other languages can be added later (Techartist ships 10).

---

## 11. Roadmap

| Phase | Goal | Deliverables | Exit criteria |
|---|---|---|---|
| **P0 Extract** ✅ 2026-11-21 | Turn & Flip runs on the new core with no visible change (built as `src/core`, `src/ui`, `src/modules/turn-flip`, `tests/`) | `core`, `motion`, `input`, `lens-css3d`; Turn & Flip as module G1 | All five levels pass replay tests; iPad touch issues fixed |
| **P1 First book** | Book 1 · 돌리기와 뒤집기 on the book shell | `book` package; entry screen; beat player (hook/try/predict/check/stamp); 단원 평가; 교사용 안내; presenter controls | A teacher runs the whole unit (5 spreads + test) on the iPad without leaving the app |
| **P2 Shelf** | Several books on one shelf | Shelf, book covers, landing pages, `lens-three`, capability gate; Books 2–3 (쌓기나무, 전개도) | Any spread opens in 3 taps or fewer; CSS 3D fallback works |
| **P3 Demonstrator and mechanisms** | Techartist-style hooks plus Engineering Magic clips | Original demonstrator character, scripted shows, trails, recorder, Reverse beat; Book 4 (톱니바퀴) | A 30 s hook clip records cleanly on the iPad |
| **P4 Authoring** | Teachers make their own spreads and books | Polypad-style allow/lock editor; book JSON editor; share links | A teacher builds and shares a 4-spread mini-book without help |
| **P5 Breadth** | Probability and more | `physics` package; Book 5; more modules; other languages | 5+ books live |
| **P6 Classroom layer** | Annotation and student devices | Annotation layer from the GoodNotes project; optional student join by code | The teacher can draw over any spread |

---

## 12. Where we go beyond Techartist and the others

1. **Built for the teacher at the front.** Techartist books are self-paced with a projector mode added. Ours are presenter-first: lock, spotlight, reveal, skip, and later annotation.
2. **Exact math means provable help.** Hints are shortest paths, scoring uses true minimum moves, and Reverse puzzles are possible, none of which an approximate physics scene can guarantee.
3. **One engine, many books.** A module is reused across books (gears for multiplication *and* for LCM), so books are mostly data.
4. **Teachers can author.** Spreads and books are JSON, with an editor in P4. Techartist books are made only by their creator.
5. **Mapped to the Korean curriculum.** Units and terms come from the 2022 개정 교육과정, not GCSE or CBSE.
6. **Touch-first on the iPad.** Gestures and buttons for everything, with previews before every placement.
7. **Offline PWA.** It works in a classroom with poor Wi-Fi.

---

## 13. Open questions

1. **Demonstrator character.** Should it be a Fields mascot, a historical mathematician, or a friendly object (e.g. a talking block)? What voice should its fun facts have for young students?
2. **One theme per book, or one Fields look across the whole shelf?**
3. **Spread size.** Should a spread map to exactly one lesson period (차시), or be smaller?
4. **Renderer timing.** Should Book 1 move to three.js (`WebGPURenderer`) in P1, or stay on CSS 3D until P2? Which iPadOS version do the classroom iPads run? (WebGPU needs iPadOS 26; older versions use the WebGL 2 fallback.)
5. **Grade focus.** Should Shelf v1 stay in elementary school, or include middle-school modules early?
6. **Landing pages and domain.** Hosting is now GitHub Pages (§9.1). Do we also need public landing pages per book (for other teachers or parents), and a custom domain?
7. **Languages.** Korean only for now, or Korean plus English for demos?

---

## Sources

- [Techartist — Newton's Laws of Motion (landing)](https://iamtechartist.com/newtons-laws-of-motion/) · [app](https://iamtechartist.com/Apps/newtons-laws-of-motion/) · [Demos](https://iamtechartist.com/demos/) · [About](https://iamtechartist.com/about/)
- [Techartist — Every Joule](https://iamtechartist.com/every-joule/) · [Waves and Sound](https://iamtechartist.com/waves-and-sound/) · [Moving Charges and Magnetism](https://iamtechartist.com/moving-charges-and-magnetism/) · [How Planes Fly](https://iamtechartist.com/how-planes-fly/)
- [Every Joule teachers' notes](https://iamtechartist.com/Apps/every-joule/teachers.html) · [iamtechartist on GitHub](https://github.com/iamtechartist) (Chronograph, coastal-simulation, tideglass-cove; MIT)
- [three.js manual — WebGPURenderer](https://threejs.org/manual/pages/webgpurenderer.html) · [web.dev — WebGPU in major browsers](https://web.dev/blog/webgpu-supported-major-browsers)
- [newton-physics/newton (GitHub)](https://github.com/newton-physics/newton) · [Newton — Key Concepts](https://newton-physics.github.io/newton/guide/key-concepts.html)
- [SimuPhysics](https://simuphysics.com/)
- [magic-spells/physics-engine (GitHub)](https://github.com/magic-spells/physics-engine)
- [Engineering Magic (YouTube Shorts)](https://www.youtube.com/@EngineeringMagic0/shorts) · [rotary-to-linear write-up](https://scan-design.blogspot.com/2025/11/how-rotary-turns-linear-without-gears.html)
- [Desmos 3D (Beta)](https://blog.desmos.com/articles/beta-3d-release) · [Polypad help](https://polypad.amplify.com/help) · [Awesome Interactive Math](https://github.com/Pomax/awesome-interactive-math)
