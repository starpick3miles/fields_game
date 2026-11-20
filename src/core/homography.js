// @ts-check
// Map a finger's screen position onto a tilted 3D plane.
// Four marker points with known plane coordinates are measured on screen; the
// 3×3 projective transform between them is solved once per gesture.

/**
 * Solve the homography that maps 4 `src` points to 4 `dst` points.
 * @param {number[][]} src @param {number[][]} dst
 * @returns {number[] | null} 8 coefficients (h33 = 1), or null if the points are degenerate
 */
export const solveH = (src, dst) => {
  const A = [];
  for (let i = 0; i < 4; i++) {
    const [u, v] = src[i], [x, y] = dst[i];
    A.push([u, v, 1, 0, 0, 0, -u * x, -v * x, x]);
    A.push([0, 0, 0, u, v, 1, -u * y, -v * y, y]);
  }
  for (let c = 0; c < 8; c++) {
    let p = c;
    for (let r = c + 1; r < 8; r++) if (Math.abs(A[r][c]) > Math.abs(A[p][c])) p = r;
    if (Math.abs(A[p][c]) < 1e-12) return null;
    [A[c], A[p]] = [A[p], A[c]];
    for (let r = 0; r < 8; r++) {
      if (r === c) continue;
      const f = A[r][c] / A[c][c];
      for (let k = c; k < 9; k++) A[r][k] -= f * A[c][k];
    }
  }
  return A.map((row, i) => row[8] / row[i]);
};

/**
 * Apply a solved homography to a screen point.
 * @param {number[]} h coefficients from solveH @param {number[]} o screen origin the source points were measured from
 */
export const mapPoint = (h, o, cx, cy) => {
  const u = cx - o[0], v = cy - o[1], w = h[6] * u + h[7] * v + 1;
  return [(h[0] * u + h[1] * v + h[2]) / w, (h[3] * u + h[4] * v + h[5]) / w];
};
