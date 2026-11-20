# Techartist 3D Books — Reverse-Engineering Teardown

> **Subject:** *Newton's Laws of Motion: a 3D holographic book*, at iamtechartist.com/newtons-laws-of-motion/ (published 2026-10-27, updated 2026-11-18)
> **Purpose:** learn the product pattern behind it, for **Fields Math Playground**
> **Status:** Layers 1–2 (delivery, content, lesson design) come from the public pages of this book and five sibling books. Layer 3 (code) is **reconstructed without a browser** (§6), from the books' app shells, the author's open-source repos and the three.js docs. Anything marked *Inferred* is unverified.
> **Ground rule:** the books state no license and their footer reads "© 2026 Techartist", so from them we take patterns only: no code, 3D models, art, music or text. The author's GitHub repos used in §6 are MIT-licensed, so code from those could be reused with the MIT notice, though we plan to write our own.

---

## 1. What Techartist is

- A studio site with **21 free browser demos**. Each opens full screen, with nothing to install and no sign-up. The site describes them as "Built with AI, free to play".
- The demos fall into three families:
  - **Curriculum books:** Newton's Laws of Motion, Every Joule (energy), Waves and Sound, Light and Optics, Moving Charges and Magnetism, How Planes Fly, DNA and the Genetic Code, Heart and Blood, Breathing and Respiration, Dinosaurs to Birds, The Science of Black Holes, The 13 Muscles, and What Happens When You Ask an AI.
  - **"How it works" machines:** How an Airliner Works, Press · Burn · Harvest · Boost (F1 2026), Two Hearts (petrol engine vs electric motor), and Firefighting Dragon.
  - **Games and art:** Trick or Tear, Off the Line, Wind-Up Parade, and Worldline Dancer.
- Channels: YouTube @tech-artist, X @techartist_, GitHub iamtechartist (18 public repos of three.js experiments, the ones we checked MIT-licensed), CodePen VoXelo. The blog had no posts when we read it.

**Key read:** one creator has shipped 21 polished 3D pieces quickly, with AI help. That almost certainly means a **reusable template**: a book shell plus per-lesson scenes and data. That template is what we are reverse-engineering, and it is the same bet our hub makes with its shared engine.

---

## 2. How it is delivered

```
Landing page (WordPress)   /newtons-laws-of-motion/
  ├─ share image for OG/Twitter cards, served by the Jetpack image CDN (i0.wp.com); theme colour #FBFAF6
  ├─ one-paragraph pitch: subject · age · exam boards · number of spreads · extras
  ├─ "Interactive 3D demo" panel
  ├─ graphics-acceleration notice  +  "Open anyway →"
  ▼
Standalone app             /Apps/newtons-laws-of-motion/
  ├─ dark theme colour #0D0B12; viewport-fit=cover (respects iPad/iPhone safe areas)
  ├─ title card: "Enter"  |  "Enter without sound"
  ├─ fallback panel if WebGL fails ("This book needs WebGL"); lesson text stays readable   ← seen in Every Joule
  ├─ the 3D book: 7 spreads, one experiment each
  └─ teachers.html: teachers' notes, filled in from data                                  ← seen in Every Joule
```

| Observation | Why it matters |
|---|---|
| The marketing page lives in a CMS; the 3D app is a separate static app | Search and share cards come from the CMS page, and the 3D runtime carries none of the CMS's weight |
| A graphics-acceleration warning showed for our page reader, with an "Open anyway" link | *Inference:* the page checks on the client for missing or software-only WebGL and **warns instead of blocking** |
| "Enter" and "Enter without sound" on the very first screen | One tap meets browser autoplay rules (iPad Safari only starts audio after a user gesture) and respects quiet classrooms |
| `viewport-fit=cover` | Built to fill tablet and phone screens edge to edge |
| Every book uses the same app shell: dark title card, "Enter" / "Enter without sound", © footer (seen in Newton, and in Waves and Sound, whose app is titled "Every Wave · Waves and Sound") | One shared template; only the book's data and scenes change |
| If WebGL fails, Every Joule shows "This book needs WebGL" and says the teachers' page and lesson text still work | The words live in the page, not in the 3D scene, so a book degrades instead of breaking |
| Each book has its own teachers' page (`teachers.html`) | The teacher layer doesn't depend on the 3D runtime |

---

## 3. Inside the Newton book

**Audience:** ages ~14–16 (GCSE, IGCSE, CBSE Class 9). **Format:** 7 spreads. On each spread, an experiment is projected out of the book as a hologram.

| Spread | Idea | Experiment(s) | Readouts seen |
|---|---|---|---|
| 1 | Forces and resultants | Tug of war | Force labels on objects (the hero image shows "Resultant 0 N") |
| 2 | Inertia (1st law) | Tablecloth pull; braking bus | — |
| 3 | Friction | Pucks on ice vs carpet | — |
| 4 | Force, mass, acceleration (2nd law) | Trolley | Speed–time graph |
| 5 | Action and reaction (3rd law) | Boat, balloon rocket, jump | — |
| 6 | Momentum | Crash test with crumple zones and airbags | — |
| 7 | Newton's cradle | Newton's cradle | — |

"—" means the public text doesn't say.

- **Demonstrator:** a marble bust of Newton performs each experiment once, telling a joke that carries a real fact. Then the student runs the experiment.
- **Extras:** teachers' notes, a **projector mode**, and sources.
- **Teaching shape:** *I do, then you do*, built on everyday physical setups (a tablecloth, a bus, a balloon) rather than abstract diagrams.

---

## 4. Patterns across the books

Gathered from the Newton book and five sibling landing pages (Every Joule, Waves and Sound, Moving Charges and Magnetism, How Planes Fly, What Happens When You Ask an AI), plus the catalogue.

| # | Pattern | What it does | Seen in |
|---|---|---|---|
| P1 | **The book is the navigation** | A fixed number of spreads or lessons (6–10), often followed by a chapter test, so progress is always obvious | Newton (7), Every Joule (10), Waves (10), Moving Charges (10 + test), Planes (10 + test), Dinosaurs (6), Two Hearts (6), Airliner (7) |
| P2 | **Content rises off the page** | A flat diagram lifts into a 3D scene | Newton (holograms), Every Joule (diagrams rise off the page), Waves (a neon drawing lifts off a rainy window) |
| P3 | **A themed world for each book** | The setting itself motivates the topic | Holographic book (Newton), blueprint (Planes), night launderette with a jukebox (Waves), x-ray (Airliner), toy shop (Wind-Up Parade) |
| P4 | **Demonstrator character** | Performs once, with a joke that carries a fact | Newton bust |
| P5 | **Watch, then try** | The student runs the same apparatus after the demo | Newton; Moving Charges (tasks on virtual apparatus) |
| P6 | **Predict → test → prove** | Learners commit to a prediction before seeing the result | Every Joule |
| P7 | **Lift-the-flap check** | The answer hides under a flap until learners commit | Every Joule |
| P8 | **Stamps** | A light reward for finishing | Every Joule |
| P9 | **Tour → try → quiz** | A three-step loop in every lesson, at the learner's own pace | Waves and Sound |
| P10 | **Self-check per lesson, test per chapter** | Quick checks during, a summary test at the end | Moving Charges, Planes |
| P11 | **Readouts inside the scene** | Labels sit on objects; graphs update live | Newton (force labels, speed–time graph) |
| P12 | **Show what's invisible** | E.g. energy shown as glowing colour flowing between stores | Every Joule |
| P13 | **Teacher layer** | Teachers' notes, projector mode, sources | Newton; Every Joule (notes, sources) |
| P14 | **Many languages** | 10 languages, **including Korean** | Waves and Sound |
| P15 | **Exam-board framing** | GCSE / IGCSE / CBSE named up front | Newton, Waves, Moving Charges, DNA |
| P16 | **Real studies rebuilt** | Each lesson recreates a real experiment or study | Black Holes |

---

## 5. The lesson loop (combined from these pages)

```
[Hook]     demonstrator performs the experiment + one fun fact
   ↓
[Tour]     self-paced guided steps (camera moves + captions)
   ↓
[Try]      the learner runs the apparatus / does the task
   ↓
[Predict → Test → Prove]
   ↓
[Check]    self-check questions, answer under a flap
   ↓
[Reward]   stamp  →  next spread   …   end of book: chapter test
```

No single book uses every step. The loop is a superset built from the pages above, and it is the part that transfers most directly to math.

---

## 6. Layer 3: the code (reconstructed without a browser)

The book bundles weren't opened: there was no browser, and the shell's network is blocked. Instead this layer is pieced together from three sources:

1. **The book app shells** (`/Apps/every-joule/`, `/Apps/waves-and-sound/`, `/Apps/newtons-laws-of-motion/`) and Every Joule's teachers' page, as served to a page reader.
2. **The author's own open-source repos** (MIT): Chronograph, coastal-simulation and tideglass-cove. We read their repo pages and two `index.html` files; folder listings and JS files couldn't be read.
3. **The three.js WebGPURenderer manual**, for what that stack implies.

Confidence labels: **Seen** = read directly · **Strong** = consistent across several of the author's projects · **Inferred** = best guess, unverified.

### 6.1 What the book apps show

| Finding | Evidence | Confidence |
|---|---|---|
| Each book is its own static app under `/Apps/<slug>/`, titled per book: "Every Joule · a physics book about energy", "Every Wave · Waves and Sound", "Newton's Laws of Motion: a 3D holographic book" | App shells | Seen |
| Shared shell: theme colour `#0D0B12`, `viewport-fit=cover`, title card with "Enter" / "Enter without sound", "© 2026 Techartist" footer | Newton, Waves | Seen |
| WebGL failure panel ("This book needs WebGL") saying the teachers' page and lesson text still work; a `noscript` line saying the book needs JavaScript | Every Joule | Seen |
| The teachers' page is a separate static file, filled in by a small script from data. It gives per-lesson learning objectives, **simplifications** and **questions to ask**, mapped to AQA, OCR, Edexcel, Cambridge IGCSE and CBSE | Every Joule `teachers.html` | Seen |
| No language picker on the title card, even in the 10-language book, and no `hreflang` links | Waves | Seen. So the language choice is inside the app or follows the browser (Inferred) |

### 6.2 The author's house style (from the MIT repos)

| Pattern | Where | Applies to the books? |
|---|---|---|
| three.js in every described repo | GitHub profile | Strong |
| Recent work uses the **WebGPU build + TSL**. The import map points `"three"` and `"three/webgpu"` to `./vendor/three.webgpu.js`, `"three/tsl"` to `./vendor/three.tsl.js` and `"three/addons/"` to `./vendor/addons/` | tideglass-cove | Inferred. "This book needs WebGL" fits either `WebGLRenderer` or WebGPURenderer's WebGL 2 fallback |
| Two build styles: a no-build static site (`index.html` + `style.css` + `js/` or `src/` + a vendored `vendor/`), or a bundled build with hashed files (`assets/index-*.js`, `index-*.css`) | tideglass, coastal / Chronograph | Strong |
| Startup in layers: `performance.mark()` → dynamic `import('./js/main.js')` → on failure, an error panel with a Reload button. A status line (`role="status"`, `aria-live="polite"`) shows a spinner and short text ("Opening cove") | tideglass | Strong |
| UI is an **HTML/CSS overlay** on the canvas, not drawn in 3D: a control dock, segmented toggles with `aria-pressed`, range sliders, a camera-view select, a "More controls" drawer | tideglass, Chronograph | Strong |
| **Keyboard shortcuts** shown in button titles (D day/dusk, J jump, H hide controls), plus a **hide-all-controls** toggle | tideglass | Strong. Probably how "projector mode" is built (Inferred) |
| **Quality setting**: Auto / High / Light | tideglass | Strong |
| **Time controls** for inspection: speed 1× / 0.1× / 0.01×, a 0–1 scrub slider, step back/forward, and buttons that isolate one subsystem | Chronograph | Strong |
| An `aria-label` on the stage that says how to interact ("Drag to orbit, scroll to zoom, …") | tideglass, Chronograph | Seen |
| A precomputed start state shipped as a compressed binary (`initial-state.bin.gz`) for an instant start | coastal-simulation | Inferred for the books |
| Geometry built in code rather than loaded (home-sweet-home is "procedurally built"; no model files in the visible repo roots) | Repo descriptions and roots | Inferred |
| Hosting on GitHub Pages (`iamtechartist.github.io/<repo>/`); the books on the main domain under `/Apps/` | Repos, site | Seen |

### 6.3 What the WebGPU stack implies (three.js manual)

- `WebGPURenderer` **falls back to a WebGL 2 backend by itself**. `forceWebGL: true` forces that backend.
- WebGPU starts asynchronously, so use `setAnimationLoop()` (or `await renderer.init()`).
- `ShaderMaterial`, `RawShaderMaterial`, `onBeforeCompile` and `EffectComposer` **don't work** with it. Effects such as glow, ink or hologram are written as **TSL node materials** and node-based post-processing.
- The manual still calls it experimental. `WebGLRenderer` remains maintained for pure WebGL 2 apps.
- Safari 26 on iOS and iPadOS 26 has WebGPU (web.dev). An up-to-date iPad gets WebGPU; older ones get the WebGL 2 fallback.

### 6.4 Answers to the original checklist

| Question | Answer | Confidence | Our decision |
|---|---|---|---|
| 3D engine and version | three.js; WebGPU build + TSL likely; version unknown | Strong / Inferred | three.js `WebGPURenderer` + TSL with the automatic WebGL 2 fallback, CSS 3D lens as the last resort; pin the version |
| Bundle shape | One static app per book, either no-build (import map + vendored three) or a hashed bundle | Strong | Vite build → static files; one lazy chunk per module |
| Asset formats | Probably geometry built in code plus small data files; no models seen | Inferred | Code-built geometry only for math worlds; no model files |
| Hologram look | Not visible; in this stack it would be TSL materials + node post-processing | Inferred | A TSL "ink and glow" material set, switched off on Light quality |
| GPU check | "Needs WebGL" panel in the app; acceleration notice + "Open anyway" on the landing page | Seen | Probe before loading; the panel keeps spread text and 교사용 안내 usable |
| Content data | Teachers' page generated from data; lesson text works without WebGL, so words live in the page, separate from 3D | Seen / Strong | All words in locale JSON, rendered as HTML; 교사용 안내 generated from book data |
| Progress storage | Not visible | — | `localStorage`, as planned |
| Projector mode | Not visible; the author's habit is hide-controls (H) plus shortcuts | Inferred | Presenter mode = larger type + hidden chrome + input lock, all with shortcuts |
| Routing | Not visible | — | Hash routes, as planned |
| Performance | Auto/High/Light quality; performance marks at startup | Strong | Auto quality samples frame time for ~2 s, then caps pixel ratio and effects |

### 6.5 Still unverified (needs a live browser)

- The books' exact renderer, three.js version and post-processing
- Storage keys, routes, and what projector mode actually changes
- Where the language choice lives in the 10-language book
- Real frame times on an iPad

None of these block our build; each one already has a decision in §6.4.

---

## 7. Adopt, adapt or skip, for Fields Math Playground

| Decision | Patterns |
|---|---|
| **Adopt as is** | P1 book navigation · P2 rise off the page · P5 watch, then try · P6 + P7 predict and lift the flap · P10 self-check and unit test · P11 readouts in the scene · P13 teacher layer · the entry screen with a sound choice · separate landing page and app · GPU check with a fallback |
| **Adopt from the code layer** | Startup in layers, with a status line and an error panel · all words in the page (HTML), never in the 3D scene · a teachers' page generated from data, including what each model **simplifies** and **questions to ask** · speed / scrub / step controls · Auto / High / Light quality · keyboard shortcuts and a hide-controls toggle · a stage `aria-label` that says how to interact · geometry built in code |
| **Adapt** | P4 → an **original** Fields demonstrator character (not a Newton-bust copy), with age-appropriate Korean fun facts · P8 stamps alongside the optional stars · P14 Korean first · P15 exam boards → **2022 개정 교육과정** units · P3 one themed world per book |
| **Skip for now** | Games and art pieces, the music playlist, photoreal rendering |

---

## Sources

- [Newton's Laws of Motion — landing page](https://iamtechartist.com/newtons-laws-of-motion/)
- [Newton's Laws of Motion — app](https://iamtechartist.com/Apps/newtons-laws-of-motion/)
- [Techartist — Demos](https://iamtechartist.com/demos/)
- [Techartist — About](https://iamtechartist.com/about/)
- [Every Joule](https://iamtechartist.com/every-joule/)
- [Waves and Sound](https://iamtechartist.com/waves-and-sound/)
- [Moving Charges and Magnetism](https://iamtechartist.com/moving-charges-and-magnetism/)
- [How Planes Fly](https://iamtechartist.com/how-planes-fly/)
- [What Happens When You Ask an AI](https://iamtechartist.com/what-happens-when-you-ask-an-ai/)
- [Every Joule — app](https://iamtechartist.com/Apps/every-joule/) · [teachers' notes](https://iamtechartist.com/Apps/every-joule/teachers.html)
- [Waves and Sound — app](https://iamtechartist.com/Apps/waves-and-sound/)
- [iamtechartist on GitHub](https://github.com/iamtechartist)
- [Chronograph repo](https://github.com/iamtechartist/Chronograph) · [its index.html](https://github.com/iamtechartist/Chronograph/blob/main/index.html)
- [coastal-simulation repo](https://github.com/iamtechartist/coastal-simulation)
- [tideglass-cove repo](https://github.com/iamtechartist/tideglass-cove) · [its index.html](https://github.com/iamtechartist/tideglass-cove/blob/main/index.html)
- [three.js manual — WebGPURenderer](https://threejs.org/manual/pages/webgpurenderer.html)
- [web.dev — WebGPU is now supported in major browsers](https://web.dev/blog/webgpu-supported-major-browsers)
