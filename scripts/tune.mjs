import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { oklchToHex, parseColor, blend } from './color.mjs';
import { ROOT } from './palette.mjs';
import { SYNTAX, STATUS } from './rules.mjs';
import { checkVariant } from './check-contrast.mjs';

const file = join(ROOT, 'palette', 'clearsight.json');
const raw = JSON.parse(readFileSync(file, 'utf8'));
const only = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const write = process.argv.includes('--write');

const TUNE = [...SYNTAX, ...STATUS];
const HUE_ANCHOR = {
  keyword: 305, function: 232, type: 185, string: 88, number: 45, property: 225, parameter: 30,
  tag: 355, attribute: 70, regex: 150, operator: 215,
  error: 25, warning: 65, info: 245, hint: 165, added: 160, modified: 80, deleted: 25, conflict: 330,
};
const HUE_FREEDOM = 12;
const L_RANGE = { dark: [0.68, 0.92], soft: [0.7, 0.87], light: [0.36, 0.58] };
const ladder = (spec) => Object.fromEntries(Object.entries(spec).map(([k, [lmin, lmax, cmin, cmax]]) => [k, { lmin, lmax, cmin, cmax }]));
const OVERRIDES = {
  dark: {
    string: { cmax: 0.12 }, regex: { cmin: 0.08 }, type: { cmin: 0.08 },
    ...ladder({ function: [0.74, 0.84, 0.12, 0.16] }),
  },
  soft: {
    string: { cmax: 0.1 }, regex: { cmin: 0.07 }, type: { cmin: 0.07 },
    ...ladder({ function: [0.72, 0.79, 0.1, 0.14] }),
    added: { cmax: 0.11 }, modified: { cmin: 0.08 },
  },
  light: {
    string: { hue: 140, cmin: 0.1, lmin: 0.42 }, type: { lmin: 0.44, cmin: 0.08 },
    ...ladder({ function: [0.47, 0.54, 0.13, 0.18] }),
    warning: { lmin: 0.5 }, modified: { lmin: 0.5 }, added: { lmin: 0.45 }, deleted: { lmin: 0.45 }, error: { lmin: 0.48 }, number: { lmin: 0.45, lmax: 0.52 },
  },
};
const CHROMA_MIN = {
  keyword: 0.11, function: 0.1, type: 0.07, string: 0.07, number: 0.11, property: 0.025, parameter: 0.04,
  tag: 0.09, attribute: 0.06, regex: 0.07, operator: 0.025,
  error: 0.15, warning: 0.11, info: 0.08, hint: 0.08, added: 0.1, modified: 0.1, deleted: 0.13, conflict: 0.11,
};
const CHROMA_FACTOR = { dark: 1, soft: 0.8, light: 1 };
const limits = (id, k) => {
  const o = OVERRIDES[id]?.[k] ?? {};
  const [lmin, lmax] = L_RANGE[id];
  const cmin = o.cmin ?? CHROMA_MIN[k] * CHROMA_FACTOR[id];
  return {
    hue: o.hue ?? HUE_ANCHOR[k],
    lmin: o.lmin ?? lmin,
    lmax: o.lmax ?? lmax,
    cmin,
    cmax: o.cmax ?? cmin + 0.09,
  };
};

const parse = (s) => s.match(/[\d.]+/g).map(Number);
const fmt = ([L, C, H]) => `oklch(${L.toFixed(4)} ${C.toFixed(4)} ${(((H % 360) + 360) % 360).toFixed(1)})`;

function build(id, v, params) {
  const colors = Object.fromEntries(Object.entries(v.colors).map(([k, val]) => [k, parseColor(val)]));
  for (const k of TUNE) colors[k] = oklchToHex(...params[k]);
  colors.selectionOnBg = blend(colors.selection, colors.bg, v.selectionAlpha);
  return { ...v, id, colors };
}

function score(id, v, params) {
  const { worstPair, deficit } = checkVariant(build(id, v, params), 1.03);
  return Math.min(worstPair, 1.5) - deficit * 20;
}

function tune(id, v) {
  const start = Object.fromEntries(TUNE.map((k) => [k, parse(v.colors[k])]));
  const lim = Object.fromEntries(TUNE.map((k) => [k, limits(id, k)]));
  if (process.argv.includes('--reset')) {
    for (const k of TUNE.filter((x) => !only.length || only.includes(x))) {
      const l = lim[k];
      start[k] = [Math.min(l.lmax, Math.max(l.lmin, start[k][0])), Math.min(l.cmax, Math.max(l.cmin, start[k][1])), l.hue];
    }
  }
  const keys = only.length ? TUNE.filter((k) => only.includes(k)) : TUNE;
  let best = structuredClone(start);
  let bestScore = score(id, v, best);
  const startScore = bestScore;
  const iters = 8000;
  for (let restart = 0; restart < 5; restart++) {
    let cur = structuredClone(best);
    let curScore = bestScore;
    for (let i = 0; i < iters; i++) {
      const k = keys[Math.floor(Math.random() * keys.length)];
      const next = structuredClone(cur);
      const [L, C, H] = next[k];
      const step = 1 - i / iters;
      const l = lim[k];
      const h = l.hue + ((((H - l.hue + 540) % 360) - 180));
      next[k] = [
        Math.min(l.lmax, Math.max(l.lmin, L + (Math.random() - 0.5) * 0.05 * step)),
        Math.min(l.cmax, Math.max(l.cmin, C + (Math.random() - 0.5) * 0.03 * step)),
        Math.min(l.hue + HUE_FREEDOM, Math.max(l.hue - HUE_FREEDOM, h + (Math.random() - 0.5) * 14 * step)),
      ];
      const s = score(id, v, next);
      const temp = 0.2 * step * step + 1e-4;
      if (s >= curScore || Math.random() < Math.exp((s - curScore) / temp)) { cur = next; curScore = s; }
      if (curScore > bestScore) { best = structuredClone(cur); bestScore = curScore; }
    }
  }
  console.log(`${id}: ${startScore.toFixed(3)} -> ${bestScore.toFixed(3)}`);
  for (const k of TUNE) v.colors[k] = fmt(best[k]);
}

for (const [id, v] of Object.entries(raw.variants)) tune(id, v);
if (write) writeFileSync(file, JSON.stringify(raw, null, 2) + '\n');
