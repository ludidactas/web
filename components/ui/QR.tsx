import React from "react";

type Cell = boolean | null;

type Props = { url: string }

// Version 3-M:
// 29x29 modules
// 44 data codewords
// 26 ECC codewords
const SIZE = 29;
const DATA_CODEWORDS = 44;
const ECC_CODEWORDS = 26;
const ECC_LEVEL_BITS = 0b00; // M

function utf8Bytes(text: string): number[] {
  return Array.from(new TextEncoder().encode(text));
}

function pushBits(out: number[], value: number, length: number) {
  for (let i = length - 1; i >= 0; i--) out.push((value >>> i) & 1);
}

function makeGfTables() {
  const exp = new Uint8Array(512);
  const log = new Uint8Array(256);

  let x = 1;
  for (let i = 0; i < 255; i++) {
    exp[i] = x;
    log[x] = i;
    x <<= 1;
    if (x & 0x100) x ^= 0x11d;
  }
  for (let i = 255; i < 512; i++) exp[i] = exp[i - 255];

  return { exp, log };
}

const GF = makeGfTables();

function gfMul(a: number, b: number) {
  if (a === 0 || b === 0) return 0;
  return GF.exp[GF.log[a] + GF.log[b]];
}

function polyMul(a: number[], b: number[]) {
  const out = Array(a.length + b.length - 1).fill(0);
  for (let i = 0; i < a.length; i++) {
    for (let j = 0; j < b.length; j++) {
      out[i + j] ^= gfMul(a[i], b[j]);
    }
  }
  return out;
}

function rsGenerator(degree: number) {
  let g = [1];
  for (let i = 0; i < degree; i++) {
    g = polyMul(g, [1, GF.exp[i]]);
  }
  return g;
}

function rsEncode(data: number[], eccCount: number) {
  const gen = rsGenerator(eccCount);
  const msg = data.concat(Array(eccCount).fill(0));

  for (let i = 0; i < data.length; i++) {
    const coef = msg[i];
    if (coef === 0) continue;
    for (let j = 0; j < gen.length; j++) {
      msg[i + j] ^= gfMul(gen[j], coef);
    }
  }

  return msg.slice(data.length);
}

function makeDataCodewords(text: string) {
  const bytes = utf8Bytes(text);

  if (bytes.length > 42) {
    throw new Error("This fixed QR version only fits up to 42 bytes.");
  }

  const bits: number[] = [];

  pushBits(bits, 0b0100, 4); // Byte mode
  pushBits(bits, bytes.length, 8); // Version 1-9 length field
  for (const b of bytes) pushBits(bits, b, 8);

  const capacityBits = DATA_CODEWORDS * 8;
  const terminator = Math.min(4, capacityBits - bits.length);
  pushBits(bits, 0, terminator);

  while (bits.length % 8 !== 0) bits.push(0);

  const codewords: number[] = [];
  for (let i = 0; i < bits.length; i += 8) {
    let b = 0;
    for (let j = 0; j < 8; j++) b = (b << 1) | bits[i + j];
    codewords.push(b);
  }

  let pad = 0xec;
  while (codewords.length < DATA_CODEWORDS) {
    codewords.push(pad);
    pad = pad === 0xec ? 0x11 : 0xec;
  }

  return codewords;
}

function emptyMatrix(): Cell[][] {
  return Array.from({ length: SIZE }, () => Array<Cell>(SIZE).fill(null));
}

function emptyFixed(): boolean[][] {
  return Array.from({ length: SIZE }, () => Array<boolean>(SIZE).fill(false));
}

function setModule(
  m: Cell[][],
  fixed: boolean[][],
  x: number,
  y: number,
  value: boolean
) {
  if (x < 0 || y < 0 || x >= SIZE || y >= SIZE) return;
  m[y][x] = value;
  fixed[y][x] = true;
}

function drawFinder(m: Cell[][], fixed: boolean[][], x: number, y: number) {
  for (let dy = -1; dy <= 7; dy++) {
    for (let dx = -1; dx <= 7; dx++) {
      const xx = x + dx;
      const yy = y + dy;
      if (xx < 0 || yy < 0 || xx >= SIZE || yy >= SIZE) continue;

      const inside = dx >= 0 && dx <= 6 && dy >= 0 && dy <= 6;
      if (inside) {
        const border = dx === 0 || dx === 6 || dy === 0 || dy === 6;
        const center = dx >= 2 && dx <= 4 && dy >= 2 && dy <= 4;
        setModule(m, fixed, xx, yy, border || center);
      } else {
        setModule(m, fixed, xx, yy, false);
      }
    }
  }
}

function drawAlignment(m: Cell[][], fixed: boolean[][], cx: number, cy: number) {
  for (let dy = -2; dy <= 2; dy++) {
    for (let dx = -2; dx <= 2; dx++) {
      const xx = cx + dx;
      const yy = cy + dy;
      const dark = Math.max(Math.abs(dx), Math.abs(dy)) === 2 || (dx === 0 && dy === 0);
      setModule(m, fixed, xx, yy, dark);
    }
  }
}

function drawTiming(m: Cell[][], fixed: boolean[][]) {
  for (let i = 8; i < SIZE - 8; i++) {
    const v = i % 2 === 0;
    setModule(m, fixed, i, 6, v);
    setModule(m, fixed, 6, i, v);
  }
}

function drawDarkModule(m: Cell[][], fixed: boolean[][]) {
  setModule(m, fixed, 8, 4 * 3 + 9, true);
}

function reserveFormatAreas(m: Cell[][], fixed: boolean[][]) {
  const a: Array<[number, number]> = [
    [8, 0],
    [8, 1],
    [8, 2],
    [8, 3],
    [8, 4],
    [8, 5],
    [8, 7],
    [8, 8],
    [7, 8],
    [5, 8],
    [4, 8],
    [3, 8],
    [2, 8],
    [1, 8],
    [0, 8],
  ];

  const b: Array<[number, number]> = [
    [SIZE - 1, 8],
    [SIZE - 2, 8],
    [SIZE - 3, 8],
    [SIZE - 4, 8],
    [SIZE - 5, 8],
    [SIZE - 6, 8],
    [SIZE - 7, 8],
    [8, SIZE - 8],
    [8, SIZE - 7],
    [8, SIZE - 6],
    [8, SIZE - 5],
    [8, SIZE - 4],
    [8, SIZE - 3],
    [8, SIZE - 2],
    [8, SIZE - 1],
  ];

  for (const [x, y] of [...a, ...b]) setModule(m, fixed, x, y, false);
}

function formatBits(mask: number) {
  const data = (ECC_LEVEL_BITS << 3) | mask;
  let rem = data << 10;
  const gen = 0x537;

  for (let i = 14; i >= 10; i--) {
    if ((rem >>> i) & 1) rem ^= gen << (i - 10);
  }

  return ((data << 10) | rem) ^ 0x5412;
}

function writeFormatBits(m: Cell[][], fixed: boolean[][], mask: number) {
  const bits = formatBits(mask);
  const coords: Array<[number, number]> = [
    [8, 0],
    [8, 1],
    [8, 2],
    [8, 3],
    [8, 4],
    [8, 5],
    [8, 7],
    [8, 8],
    [7, 8],
    [5, 8],
    [4, 8],
    [3, 8],
    [2, 8],
    [1, 8],
    [0, 8],
  ];

  const coords2: Array<[number, number]> = [
    [SIZE - 1, 8],
    [SIZE - 2, 8],
    [SIZE - 3, 8],
    [SIZE - 4, 8],
    [SIZE - 5, 8],
    [SIZE - 6, 8],
    [SIZE - 7, 8],
    [8, SIZE - 8],
    [8, SIZE - 7],
    [8, SIZE - 6],
    [8, SIZE - 5],
    [8, SIZE - 4],
    [8, SIZE - 3],
    [8, SIZE - 2],
    [8, SIZE - 1],
  ];

  for (let i = 0; i < 15; i++) {
    const bit = (bits >>> (14 - i)) & 1;
    const [x1, y1] = coords[i];
    setModule(m, fixed, x1, y1, bit === 1);
    const [x2, y2] = coords2[i];
    setModule(m, fixed, x2, y2, bit === 1);
  }
}

function maskApplies(mask: number, r: number, c: number) {
  switch (mask) {
    case 0:
      return (r + c) % 2 === 0;
    case 1:
      return r % 2 === 0;
    case 2:
      return c % 3 === 0;
    case 3:
      return (r + c) % 3 === 0;
    case 4:
      return (Math.floor(r / 2) + Math.floor(c / 3)) % 2 === 0;
    case 5:
      return ((r * c) % 2 + (r * c) % 3) === 0;
    case 6:
      return (((r * c) % 2 + (r * c) % 3) % 2) === 0;
    case 7:
      return (((r + c) % 2 + (r * c) % 3) % 2) === 0;
    default:
      return false;
  }
}

function placeDataBits(
  m: Cell[][],
  fixed: boolean[][],
  codewords: number[],
  mask: number
) {
  const bits: number[] = [];
  for (const b of codewords) pushBits(bits, b, 8);

  let k = 0;
  let dir = -1;

  for (let x = SIZE - 1; x > 0; x -= 2) {
    if (x === 6) x--;

    for (let i = 0; i < SIZE; i++) {
      const y = dir === -1 ? SIZE - 1 - i : i;

      for (let dx = 0; dx < 2; dx++) {
        const xx = x - dx;
        if (fixed[y][xx]) continue;

        const bit = k < bits.length ? bits[k++] : 0;
        const masked = bit ^ (maskApplies(mask, y, xx) ? 1 : 0);
        m[y][xx] = masked === 1;
      }
    }

    dir = -dir;
  }
}

function buildMatrixForMask(text: string, mask: number) {
  const data = makeDataCodewords(text);
  const ecc = rsEncode(data, ECC_CODEWORDS);
  const codewords = [...data, ...ecc];

  const m = emptyMatrix();
  const fixed = emptyFixed();

  drawFinder(m, fixed, 0, 0);
  drawFinder(m, fixed, SIZE - 7, 0);
  drawFinder(m, fixed, 0, SIZE - 7);

  drawTiming(m, fixed);
  drawAlignment(m, fixed, 22, 22);
  drawDarkModule(m, fixed);
  reserveFormatAreas(m, fixed);

  placeDataBits(m, fixed, codewords, mask);
  writeFormatBits(m, fixed, mask);

  return m.map((row) => row.map((v) => !!v));
}

function penaltyScore(m: boolean[][]) {
  let score = 0;

  for (let y = 0; y < SIZE; y++) {
    let runColor = m[y][0];
    let runLen = 1;
    for (let x = 1; x < SIZE; x++) {
      if (m[y][x] === runColor) {
        runLen++;
      } else {
        if (runLen >= 5) score += 3 + (runLen - 5);
        runColor = m[y][x];
        runLen = 1;
      }
    }
    if (runLen >= 5) score += 3 + (runLen - 5);
  }

  for (let x = 0; x < SIZE; x++) {
    let runColor = m[0][x];
    let runLen = 1;
    for (let y = 1; y < SIZE; y++) {
      if (m[y][x] === runColor) {
        runLen++;
      } else {
        if (runLen >= 5) score += 3 + (runLen - 5);
        runColor = m[y][x];
        runLen = 1;
      }
    }
    if (runLen >= 5) score += 3 + (runLen - 5);
  }

  for (let y = 0; y < SIZE - 1; y++) {
    for (let x = 0; x < SIZE - 1; x++) {
      const c = m[y][x];
      if (
        m[y][x + 1] === c &&
        m[y + 1][x] === c &&
        m[y + 1][x + 1] === c
      ) {
        score += 3;
      }
    }
  }

  const p1 = [true, false, true, true, true, false, true, false, false, false, false];
  const p2 = p1.map((v) => !v);

  function scanLine(line: boolean[]) {
    for (let i = 0; i <= line.length - 11; i++) {
      let ok1 = true;
      let ok2 = true;
      for (let j = 0; j < 11; j++) {
        if (line[i + j] !== p1[j]) ok1 = false;
        if (line[i + j] !== p2[j]) ok2 = false;
      }
      if (ok1 || ok2) score += 40;
    }
  }

  for (let y = 0; y < SIZE; y++) scanLine(m[y]);
  for (let x = 0; x < SIZE; x++) {
    const col = Array.from({ length: SIZE }, (_, y) => m[y][x]);
    scanLine(col);
  }

  let dark = 0;
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) if (m[y][x]) dark++;
  }

  const total = SIZE * SIZE;
  const k = Math.abs(Math.round((dark * 20) / total) - 10);
  score += k * 10;

  return score;
}

function makeQrMatrix(text: string) {
  let best: boolean[][] | null = null;
  let bestScore = Infinity;

  for (let mask = 0; mask < 8; mask++) {
    const m = buildMatrixForMask(text, mask);
    const s = penaltyScore(m);
    if (s < bestScore) {
      bestScore = s;
      best = m;
    }
  }

  return best!;
}

export default function ManualQr({ url }: Props) {
  const matrix = makeQrMatrix(url);
  const cell = 8;

  return (
    <div
      style={{
        display: "inline-block",
        background: "white",
        padding: cell * 4, // quiet zone — mínimo 4 módulos según el estándar QR
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${SIZE}, ${cell}px)`,
          gridTemplateRows: `repeat(${SIZE}, ${cell}px)`,
          lineHeight: 0,
        }}
      >
        {matrix.map((row, y) =>
          row.map((v, x) => (
            <div
              key={`${y}-${x}`}
              style={{
                width: cell,
                height: cell,
                background: v ? "black" : "white",
              }}
            />
          ))
        )}
      </div>
    </div>
  );
}