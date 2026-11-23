import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { parseColor, blend } from './color.mjs';

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

export function loadPalette() {
  const raw = JSON.parse(readFileSync(join(ROOT, 'palette', 'clearsight.json'), 'utf8'));
  const variants = {};
  for (const [id, v] of Object.entries(raw.variants)) {
    const colors = Object.fromEntries(Object.entries(v.colors).map(([k, val]) => [k, parseColor(val)]));
    colors.selectionOnBg = blend(colors.selection, colors.bg, v.selectionAlpha);
    variants[id] = { ...v, id, colors, source: v.colors };
  }
  return { name: raw.name, variants };
}
