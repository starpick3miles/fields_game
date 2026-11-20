// Entry point. Teacher settings can be set in the address, e.g. index.html?twoTone=0&scoring=0&sound=0
import { TurnFlipApp } from './modules/turn-flip/app.js';

const q = new URLSearchParams(location.search);
const flag = (name, fallback) => q.has(name) ? !['0', 'false', 'off'].includes(q.get(name)) : fallback;

new TurnFlipApp(document.getElementById('app'), {
  twoTone: flag('twoTone', true),
  scoring: flag('scoring', true),
  sound: flag('sound', true),
});
