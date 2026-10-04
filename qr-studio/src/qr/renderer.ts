import type { LogoState, Params, PresetId } from '@/types/qr';
import type { QRMatrix } from './encoder';
import { darken, deriveSecond, lighten, mix } from './color';

export interface RenderInput {
  matrix: QRMatrix;
  fg: string;
  secondary: string;
  bg: string;
  margin: number;
  presetId: PresetId;
  params: Params;
  logo: LogoState;
}

interface Ctx {
  n: number;
  m: number;
  T: number;
  fg: string;
  sec: string;
  bg: string;
  num: (k: string) => number;
  str: (k: string) => string;
  mods: (includeFinders: boolean) => Array<[number, number]>;
  finders: Array<[number, number]>;
  uid: string;
}
interface Part { defs?: string; body: string }
type Mod = [number, number];

let counter = 0;
const f = (v: number): number => Math.round(v * 1000) / 1000;
const keyOf = (x: number, y: number): string => x + ',' + y;
const lookup = (list: Mod[]) => {
  const set = new Set(list.map(([x, y]) => keyOf(x, y)));
  return (x: number, y: number) => set.has(keyOf(x, y));
};

/** Rounded-rect path (clockwise). */
function rr(x: number, y: number, w: number, h: number, r: number): string {
  const k = Math.max(0, Math.min(r, w / 2, h / 2));
  return (
    `M${f(x + k)} ${f(y)}h${f(w - 2 * k)}a${f(k)} ${f(k)} 0 0 1 ${f(k)} ${f(k)}v${f(h - 2 * k)}` +
    `a${f(k)} ${f(k)} 0 0 1 ${f(-k)} ${f(k)}h${f(-(w - 2 * k))}a${f(k)} ${f(k)} 0 0 1 ${f(-k)} ${f(-k)}` +
    `v${f(-(h - 2 * k))}a${f(k)} ${f(k)} 0 0 1 ${f(k)} ${f(-k)}z`
  );
}

/** Rect with an independent radius per corner (clockwise from top-left). Zero radii emit straight lines. */
function rrc(x: number, y: number, w: number, h: number, tl: number, tr: number, br: number, bl: number): string {
  const arc = (r: number, dx: number, dy: number) => (r > 0 ? `a${f(r)} ${f(r)} 0 0 1 ${f(dx)} ${f(dy)}` : '');
  return (
    `M${f(x + tl)} ${f(y)}H${f(x + w - tr)}${arc(tr, tr, tr)}V${f(y + h - br)}${arc(br, -br, br)}` +
    `H${f(x + bl)}${arc(bl, -bl, -bl)}V${f(y + tl)}${arc(tl, tl, -tl)}z`
  );
}

/** Three nested rounded rects under even-odd fill: the 7x7 ring plus the 3x3 centre. `pct` is rounding, 0 to 50. */
function finderPath(x: number, y: number, pct: number): string {
  const p = pct / 100;
  return rr(x, y, 7, 7, 7 * p) + rr(x + 1, y + 1, 5, 5, 5 * p) + rr(x + 2, y + 2, 3, 3, 3 * p);
}

function finderShape(x: number, y: number, pct: number, color: string): string {
  return `<path fill="${color}" fill-rule="evenodd" d="${finderPath(x, y, pct)}"/>`;
}

function rects(list: Mod[], size: number, radius: number, ox = 0, oy = 0, grow = 0): string {
  const s = size + grow * 2;
  const off = (1 - size) / 2 - grow;
  return list
    .map(([x, y]) => `<rect x="${f(x + off + ox)}" y="${f(y + off + oy)}" width="${f(s)}" height="${f(s)}" rx="${f(radius)}"/>`)
    .join('');
}

const squares = (list: Mod[]): string => list.map(([x, y]) => `M${x} ${y}h1v1h-1z`).join('');

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const RENDERERS: Record<PresetId, (c: Ctx) => Part> = {
  classic(c) {
    const r = c.num('cornerRadius') / 100;
    const gap = c.num('moduleGap') / 100;
    const list = c.mods(true);
    if (r === 0 && gap === 0) return { body: `<path fill="${c.fg}" d="${squares(list)}"/>` };
    const s = 1 - gap;
    return { body: `<g fill="${c.fg}">${rects(list, s, r * s)}</g>` };
  },

  dotMatrix(c) {
    const d = c.num('dotSize') / 100;
    const dots = c.mods(false).map(([x, y]) => `<circle cx="${x + 0.5}" cy="${y + 0.5}" r="${f(d / 2)}"/>`).join('');
    const eyes = c.finders.map(([x, y]) => finderShape(x, y, c.num('finderRoundness'), c.fg)).join('');
    return { body: `<g fill="${c.fg}">${dots}</g>${eyes}` };
  },

  // Round only the corners that have no neighbour, so touching modules fuse into one organic shape.
  liquid(c) {
    const R = c.num('smooth') / 100;
    const list = c.mods(true);
    const has = lookup(list);
    let d = '';
    for (const [x, y] of list) {
      const up = has(x, y - 1), dn = has(x, y + 1), lf = has(x - 1, y), rt = has(x + 1, y);
      d += rrc(x, y, 1, 1, !up && !lf ? R : 0, !up && !rt ? R : 0, !dn && !rt ? R : 0, !dn && !lf ? R : 0);
    }
    return { body: `<path fill="${c.fg}" d="${d}"/>` };
  },

  // Merge runs of modules into capsules (rows or columns), finder patterns stay solid.
  bars(c) {
    const vertical = c.str('orientation') === 'v';
    const gap = c.num('barGap') / 100;
    const th = 1 - gap;
    const rx = (c.num('roundness') / 100) * (th / 2);
    const data = c.mods(false);
    const has = lookup(data);
    let out = '';
    for (const [x, y] of data) {
      if (vertical ? has(x, y - 1) : has(x - 1, y)) continue;
      let len = 1;
      while (vertical ? has(x, y + len) : has(x + len, y)) len++;
      out += vertical
        ? `<rect x="${f(x + gap / 2)}" y="${y}" width="${f(th)}" height="${len}" rx="${f(rx)}"/>`
        : `<rect x="${x}" y="${f(y + gap / 2)}" width="${len}" height="${f(th)}" rx="${f(rx)}"/>`;
    }
    const eyes = c.finders.map(([x, y]) => finderShape(x, y, c.num('finderRoundness'), c.fg)).join('');
    return { body: `<g fill="${c.fg}">${out}</g>${eyes}` };
  },

  // Pointy-top hexagon per module; the finders take the secondary colour.
  hex(c) {
    const s = c.num('size') / 100;
    const pts: Array<[number, number]> = [[0.5, 0], [1, 0.25], [1, 0.75], [0.5, 1], [0, 0.75], [0, 0.25]];
    let d = '';
    for (const [x, y] of c.mods(false)) {
      d += pts.map(([px, py], i) => `${i ? 'L' : 'M'}${f(x + 0.5 + (px - 0.5) * s)} ${f(y + 0.5 + (py - 0.5) * s)}`).join('') + 'z';
    }
    const eyes = c.finders.map(([x, y]) => finderShape(x, y, c.num('finderRadius'), c.sec)).join('');
    return { body: `<path fill="${c.fg}" d="${d}"/>${eyes}` };
  },

  neonGlow(c) {
    const s = c.num('glowSpread') / 50;
    const glow = c.sec;
    const data = c.mods(false);
    const layers: Array<[number, number]> = [[0.3 * s, 0.1], [0.18 * s, 0.16], [0.08 * s, 0.26]];
    // Finder patterns stay solid: gaps inside them are what scanners lock on to.
    const halo = s === 0 ? '' : layers
      .map(([e, o]) =>
        `<g fill="${glow}" fill-opacity="${o}">${rects(data, 0.9, 0.16 + e, 0, 0, e)}</g>` +
        c.finders.map(([x, y]) =>
          `<path d="${finderPath(x, y, 12)}" fill="${glow}" fill-opacity="${o}" fill-rule="evenodd" stroke="${glow}" stroke-opacity="${o}" stroke-width="${f(e * 2)}" stroke-linejoin="round"/>`,
        ).join(''),
      )
      .join('');
    const eyes = c.finders.map(([x, y]) => finderShape(x, y, 12, c.fg)).join('');
    return { body: `${halo}<g fill="${c.fg}">${rects(data, 0.9, 0.16)}</g>${eyes}` };
  },

  duotone(c) {
    const a = (c.num('angle') * Math.PI) / 180;
    const h = c.T / 2;
    const id = `${c.uid}g`;
    const defs =
      `<linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="${f(h - Math.cos(a) * h)}" y1="${f(h - Math.sin(a) * h)}" ` +
      `x2="${f(h + Math.cos(a) * h)}" y2="${f(h + Math.sin(a) * h)}">` +
      `<stop offset="0" stop-color="${c.fg}"/><stop offset="1" stop-color="${c.sec}"/></linearGradient>`;
    const r = c.num('moduleRadius') / 100;
    return { defs, body: `<g fill="url(#${id})">${rects(c.mods(true), 1, r)}</g>` };
  },

  twoTone(c) {
    const r = c.num('dataRadius') / 100;
    const eyes = c.finders.map(([x, y]) => finderShape(x, y, c.num('finderRadius'), c.sec)).join('');
    return { body: `<g fill="${c.fg}">${rects(c.mods(false), 0.94, r * 0.94)}</g>${eyes}` };
  },

  // Dot size and colour both drift with position, like a printed halftone screen.
  halftone(c) {
    const pattern = c.str('pattern');
    const minD = c.num('minDot') / 100;
    const half = c.n / 2;
    let dots = '';
    for (const [x, y] of c.mods(false)) {
      const cx = x + 0.5 - c.m;
      const cy = y + 0.5 - c.m;
      let t: number;
      if (pattern === 'diagonal') t = (cx + cy) / (2 * c.n);
      else if (pattern === 'horizontal') t = cx / c.n;
      else t = Math.hypot(cx - half, cy - half) / (half * Math.SQRT2);
      t = Math.max(0, Math.min(1, t));
      const r = (minD + (1 - minD) * (1 - t)) / 2;
      dots += `<circle cx="${x + 0.5}" cy="${y + 0.5}" r="${f(r)}" fill="${mix(c.fg, c.sec, t)}"/>`;
    }
    const eyes = c.finders.map(([x, y]) => finderShape(x, y, 8, c.fg)).join('');
    return { body: `${dots}${eyes}` };
  },

  retroGrain(c) {
    const rnd = mulberry32(Math.round(c.num('seed')) * 7919 + 13);
    const g = c.num('grain') / 100;
    const w = c.num('wobble') / 100;
    let ink = '';
    let holes = '';
    for (const [x, y] of c.mods(true)) {
      const s = 1 - rnd() * 0.16 * w;
      const jx = (rnd() - 0.5) * 0.14 * w + (1 - s) / 2;
      const jy = (rnd() - 0.5) * 0.14 * w + (1 - s) / 2;
      ink += `<rect x="${f(x + jx)}" y="${f(y + jy)}" width="${f(s)}" height="${f(s)}" rx="${f(0.06 + rnd() * 0.1 * w)}"/>`;
      if (rnd() < g * 0.6) {
        holes += `<circle cx="${f(x + 0.15 + rnd() * 0.7)}" cy="${f(y + 0.15 + rnd() * 0.7)}" r="${f(0.04 + rnd() * 0.1)}"/>`;
      }
    }
    let stray = '';
    const count = Math.round(c.n * c.n * 0.02 * g);
    for (let i = 0; i < count; i++) {
      stray += `<circle cx="${f(c.m + rnd() * c.n)}" cy="${f(c.m + rnd() * c.n)}" r="${f(0.03 + rnd() * 0.06)}"/>`;
    }
    return {
      body: `<g fill="${c.fg}">${ink}</g><g fill="${c.bg}">${holes}</g><g fill="${c.fg}" fill-opacity="0.4">${stray}</g>`,
    };
  },

  glassPanel(c) {
    const id = `${c.uid}b`;
    const T = c.T;
    const std = f((T * c.num('blur')) / 200);
    const pad = Math.max(0.8, c.m - 2);
    const pr = (c.n * c.num('panelRadius')) / 100;
    const defs = `<filter id="${id}" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="${std}"/></filter>`;
    const blobs =
      `<g filter="url(#${id})">` +
      `<circle cx="${f(T * 0.26)}" cy="${f(T * 0.28)}" r="${f(T * 0.32)}" fill="${c.sec}"/>` +
      `<circle cx="${f(T * 0.76)}" cy="${f(T * 0.74)}" r="${f(T * 0.34)}" fill="${deriveSecond(c.sec)}"/>` +
      `</g>`;
    const panel =
      `<path d="${rr(pad, pad, T - 2 * pad, T - 2 * pad, pr)}" fill="#FFFFFF" fill-opacity="${f(c.num('panelOpacity') / 100)}" ` +
      `stroke="#FFFFFF" stroke-opacity="0.75" stroke-width="0.12"/>`;
    return { defs, body: `${blobs}${panel}<g fill="${c.fg}">${rects(c.mods(true), 1, 0.12)}</g>` };
  },

  embossed(c) {
    const a = (c.num('lightAngle') * Math.PI) / 180;
    const d = c.num('depth') / 20;
    const lx = Math.cos(a) * d;
    const ly = Math.sin(a) * d;
    const r = c.num('cornerRadius') / 100;
    const list = c.mods(true);
    return {
      body:
        `<g fill="${darken(c.bg, 0.4)}" fill-opacity="0.6">${rects(list, 1, r, -lx, -ly)}</g>` +
        `<g fill="${lighten(c.bg, 0.85)}" fill-opacity="0.9">${rects(list, 1, r, lx, ly)}</g>` +
        `<g fill="${c.fg}">${rects(list, 1, r)}</g>`,
    };
  },

  // Every data module is an X of two crossing threads; the finders stay solid so scanners can lock on.
  crossStitch(c) {
    const w = c.num('thread') / 100;
    const pad = 0.2;
    const data = c.mods(false);
    const a = data.map(([x, y]) => `M${f(x + pad)} ${f(y + pad)}L${f(x + 1 - pad)} ${f(y + 1 - pad)}`).join('');
    const b = data.map(([x, y]) => `M${f(x + 1 - pad)} ${f(y + pad)}L${f(x + pad)} ${f(y + 1 - pad)}`).join('');
    const eyes = c.finders.map(([x, y]) => finderShape(x, y, c.num('finderRadius'), c.fg)).join('');
    return {
      body:
        `<path d="${b}" fill="none" stroke="${c.sec}" stroke-width="${f(w)}" stroke-linecap="round"/>` +
        `<path d="${a}" fill="none" stroke="${c.fg}" stroke-width="${f(w)}" stroke-linecap="round"/>${eyes}`,
    };
  },

  // Brick tiles with a stud (shadow, body, highlight) on each.
  studs(c) {
    const list = c.mods(true);
    const r = c.num('studSize') / 100;
    const shine = c.num('shine') / 100;
    const edge = darken(c.fg, 0.35);
    // Finder patterns stay plain brick: an unbroken dark ring is what scanners lock on to.
    const inFinder = (x: number, y: number) => c.finders.some(([fx, fy]) => x >= fx && x < fx + 7 && y >= fy && y < fy + 7);
    const studs = list
      .filter(([x, y]) => !inFinder(x, y))
      .map(([x, y]) =>
        `<circle cx="${x + 0.5}" cy="${f(y + 0.52)}" r="${f(r + 0.02)}" fill="${edge}" fill-opacity="0.55"/>` +
        `<circle cx="${x + 0.5}" cy="${y + 0.5}" r="${f(r)}" fill="${c.sec}"/>` +
        (shine > 0 ? `<circle cx="${f(x + 0.5 - r * 0.32)}" cy="${f(y + 0.5 - r * 0.32)}" r="${f(r * 0.38)}" fill="#FFFFFF" fill-opacity="${f(shine * 0.55)}"/>` : ''),
      )
      .join('');
    return {
      body:
        `<path fill="${c.fg}" d="${squares(list)}"/>` +
        `<path fill="none" stroke="${edge}" stroke-width="0.05" d="${squares(list)}"/>${studs}`,
    };
  },
};

/** Build a complete SVG document string. Omit `px` for a fluid (width: 100%) preview. */
export function buildSvg(input: RenderInput, px?: number): string {
  const { matrix, fg, secondary, bg, margin: m, presetId, params, logo } = input;
  const n = matrix.size;
  const T = n + 2 * m;
  const uid = `q${++counter}`;
  const hasLogo = logo.mode !== 'none' && !!logo.dataUrl;

  // Centre logo: knock out modules beneath it (never the finder patterns).
  const L = logo.scale * n;
  const half = L / 2 + 0.8;
  const mid = n / 2;
  const knocked = (r: number, c: number): boolean =>
    hasLogo && logo.mode === 'center' && !matrix.isFinder(r, c) &&
    Math.abs(c + 0.5 - mid) <= half && Math.abs(r + 0.5 - mid) <= half;

  const all: Mod[] = [];
  const noFinders: Mod[] = [];
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (!matrix.isDark(r, c) || knocked(r, c)) continue;
      all.push([c + m, r + m]);
      if (!matrix.isFinder(r, c)) noFinders.push([c + m, r + m]);
    }
  }

  const ctx: Ctx = {
    n, m, T, fg, sec: secondary, bg, uid,
    num: (k) => Number(params[k]),
    str: (k) => String(params[k]),
    mods: (inc) => (inc ? all : noFinders),
    finders: [[m, m], [m + n - 7, m], [m, m + n - 7]],
  };
  const part = RENDERERS[presetId](ctx);

  const fade =
    hasLogo && logo.mode === 'fade'
      ? `<image x="${m}" y="${m}" width="${n}" height="${n}" preserveAspectRatio="xMidYMid slice" opacity="${logo.opacity}" ` +
        `href="${logo.dataUrl}" xlink:href="${logo.dataUrl}"/>`
      : '';

  const lx = m + (n - L) / 2;
  const centre =
    hasLogo && logo.mode === 'center'
      ? `<path d="${rr(lx - 0.5, lx - 0.5, L + 1, L + 1, 0.9)}" fill="${bg}"/>` +
        `<image x="${f(lx)}" y="${f(lx)}" width="${f(L)}" height="${f(L)}" preserveAspectRatio="xMidYMid meet" ` +
        `href="${logo.dataUrl}" xlink:href="${logo.dataUrl}"/>`
      : '';

  const sizeAttrs = px ? ` width="${px}" height="${px}"` : ' style="display:block;width:100%;height:auto"';
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 ${T} ${T}"${sizeAttrs} role="img" aria-label="QR code">` +
    (part.defs ? `<defs>${part.defs}</defs>` : '') +
    `<rect width="${T}" height="${T}" fill="${bg}"/>${fade}${part.body}${centre}</svg>`
  );
}
