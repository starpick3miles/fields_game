# Fields Math Playground

A shelf of interactive 3D math books for teachers to present from an iPad in landscape, mirrored to a classroom screen.
The game text is Korean. The plan is in [`docs/project.md`](docs/project.md); the research behind it is in [`docs/techartist-teardown.md`](docs/techartist-teardown.md).

The first module is **Turn & Flip**, a 3D block puzzle that teaches rotation (회전) and reflection (대칭).
It now runs on the playground's shared engine (roadmap step P0). It looks and plays the same as the Claude Design version.

## Running it

Serve this folder with any static web server and open `index.html`, for example:

```sh
python3 -m http.server 8080    # then open http://localhost:8080
```

There is no build step and nothing to install: the code is plain JavaScript modules.
Fonts come from Google Fonts; everything else is in this folder.

Teacher settings can go in the address: `index.html?twoTone=0&scoring=0&sound=0`.

## Tests

```sh
npm test    # Node's built-in test runner; no packages needed
```

The replay tests play every puzzle start to finish using only the game rules. They check that:

- every target can be reached;
- following hints solves each puzzle in the fewest moves;
- the level 5 solutions tile the board exactly;
- every move combination has its Korean explanation.

## Files

| Path | What it is |
| --- | --- |
| `index.html` | The game page |
| `src/core/` | Shared engine: exact square symmetries (`d4.js`), board tiling (`tiling.js`), finger-to-table mapping (`homography.js`) |
| `src/ui/` | Shared screen helpers: in-place screen updates (`morph.js`), synthesised sounds (`sound.js`) |
| `src/modules/turn-flip/` | Turn & Flip:<br>• `levels.js`: level data<br>• `rules.js`: pure, tested rules<br>• `text.js`: all Korean text<br>• `view.js`: markup<br>• `app.js`: animations and gestures<br>• `turn-flip.css`: styles |
| `tests/` | Replay tests |
| `docs/` | Project doc and research |
| `_ds/` | The Broadsheet design system stylesheet |
| `Turn & Flip.dc.html`, `Turn & Flip Spec.dc.html`, `support.js` | The original Claude Design files, kept for reference and the spec |

## Levels

1. 회전: turn a block to fit a hole, three puzzles
2. 대칭: turn and flip a block to fit a mirrored hole, three puzzles
3. 예측: predict the result of a move, four questions
4. 선대칭: complete a mirrored shape across the 대칭축, three puzzles
5. 채우기: fill a 4×4 board with four L-blocks, then four T-blocks

## Controls

Every move has a button and a gesture:

- **Turn:** drag round the bench disc, or twist with two fingers.
- **Flip:** flick across the block.
- **Place:** drag the block. On the 4×4 board, a preview shows where it will land; you can also tap a cell to preview, then tap again to place.

The 점수 button in the header hides the move counter and stars.
Progress is saved in the browser under the `turnflip.v1` localStorage key, the same key the Claude Design version used.
