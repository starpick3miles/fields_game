// @ts-check
// Every Korean string the Turn & Flip module shows, in one place.

/** Name and detail for each move button. */
export const OP_TEXT = {
  cw:   { word: '회전', sub: '시계 방향 90°' },
  ccw:  { word: '회전', sub: '반시계 방향 90°' },
  half: { word: '회전', sub: '180°' },
  lr:   { word: '대칭', sub: '세로 대칭축' },
  ud:   { word: '대칭', sub: '가로 대칭축' },
  diag: { word: '대칭', sub: '대각선 대칭축' },
};

/** What all the moves so far add up to, keyed by the combined matrix. */
export const NET = {
  '1,0,0,1': '지금까지의 이동을 합치면 처음 모양 그대로입니다.',
  '0,-1,1,0': '지금까지의 이동을 합치면 시계 방향 90° 회전과 같습니다.',
  '-1,0,0,-1': '지금까지의 이동을 합치면 180° 회전과 같습니다.',
  '0,1,-1,0': '지금까지의 이동을 합치면 반시계 방향 90° 회전과 같습니다. 시계 방향 270° 회전과도 같습니다.',
  '-1,0,0,1': '지금까지의 이동을 합치면 세로 대칭축에 대한 대칭과 같습니다.',
  '1,0,0,-1': '지금까지의 이동을 합치면 가로 대칭축에 대한 대칭과 같습니다.',
  '0,1,1,0': '지금까지의 이동을 합치면 대각선 대칭축에 대한 대칭과 같습니다.',
  '0,-1,-1,0': '지금까지의 이동을 합치면 대각선 대칭축에 대한 대칭과 같습니다.',
};

export const EXPLAIN = {
  flip: '대칭은 대칭축을 기준으로 도형을 뒤집는 이동입니다. 모양과 크기는 그대로이고 좌우 또는 위아래가 바뀝니다.',
  flipColour: ' 도형의 반대쪽 면이 위로 올라와서 색이 바뀌었습니다.',
  turn: '회전은 도형을 한 점을 중심으로 돌리는 이동입니다. 모양과 크기는 그대로이고 방향만 바뀝니다.',
  twoQuarters: ' 90° 회전을 두 번 하면 180° 회전이 됩니다.',
  predict: [
    '회전은 도형을 한 점을 중심으로 돌리는 이동입니다. 90° 회전을 두 번 하면 180° 회전이 됩니다.',
    '대칭은 대칭축을 기준으로 도형을 뒤집는 이동입니다. 거울에 비친 모양과 같습니다.'],
  mirror: [
    '선대칭에서는 서로 짝이 되는 두 칸이 대칭축에서 같은 거리에 있습니다.',
    '대칭축을 따라 판을 접으면 두 쪽이 완전히 겹칩니다.'],
  fillCount: (/** @type {number} */ turns, /** @type {number} */ flips) => `회전 ${turns}번, 대칭 ${flips}번을 사용했습니다.`,
  fillTurnOnly: '같은 도형을 회전하기만 해도 판을 빈틈없이 채울 수 있습니다.',
  fillTwoTone: '파란색 도형은 회전만 한 도형입니다. 분홍색 도형은 대칭시킨 도형이어서 파란색 도형과 좌우가 반대입니다.',
  fillPlain: '대칭시킨 도형은 회전만 한 도형과 좌우가 반대입니다.',
};

export const UI = {
  moves: '이동 횟수',
  pickOne: '하나를 고르세요',
  undo: '되돌리기',
  hint: '힌트',
  summary: '이동 정리',
  replay: '다시 하기',
  score: (/** @type {boolean} */ on) => on ? '★ 점수 켬' : '★ 점수 끔',
  sound: (/** @type {boolean} */ on) => on ? '♪ 소리 켬' : '♪ 소리 끔',
  kicker: (lv, total, round, rounds) => `${lv}단계 / ${total}단계` + (rounds > 1 ? ` · 문제 ${round} / ${rounds}` : ''),
  question: (n, total) => `문제 ${n} / ${total} · 이 이동을 하면`,
  option: (n) => `보기 ${n}`,
  placed: (n) => `놓은 도형 ${n} / 4`,
  done: (lv, round, rounds) => rounds > 1 ? `${lv}단계 문제 ${round} 완료` : `${lv}단계 완료`,
  doneMoves: (n) => `이동 ${n}번`,
  donePredict: (total, first) => `${total}문제 중 ${first}문제를 한 번에 맞혔습니다`,
  next: (lastRound, lastLevel) => !lastRound ? '다음 문제' : !lastLevel ? '다음 단계' : '1단계로',
};
