/**
 * Deterministic placeholder QR-looking SVG, ported from the design
 * handoff's qrUri(). Not a real QR code — stands in until the backend
 * issues real signed access-pass payloads (see docs/backend-spec.md).
 */
export function placeholderQrDataUri(seed = 987651): string {
  const n = 29;
  const c = 4;
  const matrix: boolean[][] = [];
  let s = seed;
  const rnd = () => {
    s = (s * 1103515245 + 12345) >>> 0;
    return (s >>> 16) / 65536;
  };

  for (let y = 0; y < n; y++) {
    matrix.push([]);
    for (let x = 0; x < n; x++) matrix[y].push(rnd() > 0.48);
  }

  const finder = (ox: number, oy: number) => {
    for (let y = -1; y < 8; y++) {
      for (let x = -1; x < 8; x++) {
        const yy = oy + y;
        const xx = ox + x;
        if (yy < 0 || yy >= n || xx < 0 || xx >= n) continue;
        if (y < 0 || y > 6 || x < 0 || x > 6) matrix[yy][xx] = false;
        else
          matrix[yy][xx] =
            x === 0 || x === 6 || y === 0 || y === 6 || (x > 1 && x < 5 && y > 1 && y < 5);
      }
    }
  };
  finder(0, 0);
  finder(n - 7, 0);
  finder(0, n - 7);

  for (let i = 8; i < n - 8; i++) {
    matrix[6][i] = i % 2 === 0;
    matrix[i][6] = i % 2 === 0;
  }

  let rects = "";
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      if (matrix[y][x]) {
        rects += `<rect x="${x * c}" y="${y * c}" width="${c}" height="${c}"/>`;
      }
    }
  }
  const size = n * c;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}"><rect width="${size}" height="${size}" fill="#ffffff"/><g fill="#1b1b19">${rects}</g></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
