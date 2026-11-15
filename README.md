# Turn & Flip

A 3D block puzzle that teaches rotation (회전) and reflection (대칭) to K–2 students.
It is built for a teacher to demonstrate on an iPad in landscape, mirrored to a classroom screen.
The game text is Korean.

## Files

| File | What it is |
| --- | --- |
| `Turn & Flip.dc.html` | The game: template, styles and logic in one file |
| `Turn & Flip Spec.dc.html` | The v2 spec: layout, levels, gestures, score switch, Korean wording |
| `support.js` | The page runtime both pages load. Generated; do not edit. |
| `_ds/` | The Broadsheet design system stylesheet and script the pages use |
| `index.html` | Redirects to the game |

## Running it

Serve this folder with any static web server and open `index.html`.
The pages need an internet connection: the runtime loads React and Babel from unpkg, and fonts come from Google Fonts.

Running from this repository has not been tested. The game has been tried on an iPad from its Claude design project, where these same files are served.

## Levels

1. 회전: turn an L-block to fit a hole
2. 대칭: turn and flip a P-block to fit a mirrored hole
3. 예측: predict the result of a move, four questions
4. 선대칭: complete a mirrored shape across the 대칭축
5. 채우기: fill a 4×4 board with four L-blocks

## Controls

Every move has a button and a gesture: drag the bench disc to turn, flick across the block to flip, drag the block to place it.
The 점수 button in the header hides the move counter and stars.
Progress is saved in the browser under the `turnflip.v1` localStorage key.
