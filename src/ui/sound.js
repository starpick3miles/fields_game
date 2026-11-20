// @ts-check
// Small synthesised sounds (WebAudio). Nothing to download.
// The audio context is created on the first sound, which always follows a tap,
// so iPad Safari allows it to play.

/** @type {AudioContext | null} */
let ac = null;

/** @param {'turn'|'flip'|'place'|'tick'|'bad'|'good'} kind */
export function play(kind) {
  try {
    const W = /** @type {any} */ (window);
    const A = ac || (ac = new (W.AudioContext || W.webkitAudioContext)());
    if (A.state === 'suspended') A.resume();
    const t = A.currentTime;
    const note = (f, st, d, type, f2 = 0, vol = .16) => {
      const o = A.createOscillator(), g = A.createGain();
      o.type = type; o.frequency.setValueAtTime(f, t + st);
      if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + st + d);
      g.gain.setValueAtTime(0.0001, t + st); g.gain.exponentialRampToValueAtTime(vol, t + st + .02); g.gain.exponentialRampToValueAtTime(0.0001, t + st + d);
      o.connect(g).connect(A.destination); o.start(t + st); o.stop(t + st + d + .05);
    };
    if (kind === 'turn') note(520, 0, .18, 'triangle', 700);
    if (kind === 'flip') note(300, 0, .45, 'sine', 900, .14);
    if (kind === 'place') note(440, 0, .14, 'triangle', 330);
    if (kind === 'tick') note(700, 0, .07, 'triangle', 0, .09);
    if (kind === 'bad') note(170, 0, .22, 'square', 120, .05);
    if (kind === 'good') [523, 659, 784, 1047].forEach((f, i) => note(f, i * .11, .32, 'triangle'));
  } catch (e) { /* no audio available: stay silent */ }
}
