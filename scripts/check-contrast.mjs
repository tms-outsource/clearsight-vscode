import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { wcag, apca, deltaE, simulate, VISIONS } from './color.mjs';
import { loadPalette, ROOT } from './palette.mjs';
import { SYNTAX, READABLE, STATUS, FG_RANGE, APCA_MIN, PAIRS, LOUD_CAP } from './rules.mjs';

export function checkVariant(v, margin = 1) {
  const c = v.colors;
  const failures = [];
  const rows = [];
  let deficit = 0;
  const need = (ok, msg, amount = 1) => { if (!ok) { failures.push(msg); deficit += amount; } };
  const minRatio = (a, b, min) => {
    const r = wcag(c[a], c[b]);
    min *= margin;
    need(r >= min, `${a} on ${b}: ${r.toFixed(2)} < ${min}`, (min - r) / min);
    return r;
  };

  for (const k of READABLE) {
    const r = minRatio(k, 'bg', 4.5);
    minRatio(k, 'bgLine', 4.5);
    minRatio(k, 'selectionOnBg', 3);
    const lc = Math.abs(apca(c[k], c.bg));
    const floor = k === 'fg' ? APCA_MIN.fg : k === 'comment' || k === 'punctuation' ? APCA_MIN.comment : APCA_MIN.syntax;
    const fl = floor * margin;
    need(lc >= fl, `APCA ${k} on bg: Lc ${lc.toFixed(1)} < ${fl}`, (fl - lc) / fl);
    rows.push({ k, hex: c[k], wcag: r, apca: lc });
  }

  const [lo, hi] = FG_RANGE[v.id];
  const fgR = wcag(c.fg, c.bg);
  need(fgR >= lo && fgR <= hi, `fg on bg ${fgR.toFixed(2)} outside comfort range ${lo}-${hi}`);

  const commentR = wcag(c.comment, c.bg);
  const minSyntax = Math.min(...SYNTAX.map((k) => wcag(c[k], c.bg)));
  need(commentR < minSyntax, `comment (${commentR.toFixed(2)}) should be quieter than every syntax token (min ${minSyntax.toFixed(2)})`, (commentR - minSyntax) / minSyntax + 0.01);
  for (const k of SYNTAX) {
    const r = wcag(c[k], c.bg);
    const cap = fgR * LOUD_CAP[v.id];
    need(r <= cap, `${k} (${r.toFixed(2)}) louder than cap ${cap.toFixed(2)}`, (r - cap) / fgR);
  }

  for (const s of ['bgSidebar', 'bgActivity', 'bgPanel', 'bgWidget']) minRatio('fg', s, 7);
  for (const s of ['bg', 'bgSidebar', 'bgPanel', 'bgWidget']) minRatio('fgMuted', s, 4.5);
  minRatio('fgSubtle', 'bg', 3);
  need(wcag(c.fgSubtle, c.bg) < wcag(c.fgMuted, c.bg), 'fgSubtle should be quieter than fgMuted');
  for (const k of STATUS) for (const s of ['bg', 'bgSidebar', 'bgActivity']) minRatio(k, s, 4.5);
  minRatio('ignored', 'bgSidebar', 3);
  minRatio('accent', 'bg', 3);
  minRatio('accentFg', 'accent', 4.5);
  const borderR = wcag(c.border, c.bg);
  need(borderR >= 1.15 && borderR <= 1.9, `border on bg ${borderR.toFixed(2)} outside 1.15-1.9`);

  let worstPair = Infinity;
  for (const vision of VISIONS) {
    for (const { a, b, min: base, minBy } of PAIRS) {
      const min = minBy?.[v.id] ?? base;
      const d = deltaE(simulate(c[a], vision), simulate(c[b], vision));
      worstPair = Math.min(worstPair, d / min);
      need(d >= min, `${vision}: ${a} vs ${b} too similar (dE ${d.toFixed(3)} < ${min})`);
    }
  }
  return { rows, failures, worstPair, deficit };
}

if (process.argv[1] && process.argv[1].endsWith('check-contrast.mjs')) {
  const palette = loadPalette();
  let total = 0;
  const report = [`# ${palette.name} contrast report`, ''];
  for (const v of Object.values(palette.variants)) {
    const { rows, failures, worstPair } = checkVariant(v);
    total += failures.length;
    report.push(`## ${v.label}`, '', `Background ${v.colors.bg}`, '', '| Token | Hex | WCAG | APCA Lc |', '|---|---|---|---|');
    for (const r of rows) report.push(`| ${r.k} | ${r.hex} | ${r.wcag.toFixed(2)}:1 | ${r.apca.toFixed(1)} |`);
    report.push('');
    console.log(`\n${v.label} (${v.id})  worst pair margin ${worstPair.toFixed(2)}x`);
    for (const r of rows) console.log(`  ${r.k.padEnd(12)} ${r.hex}  ${r.wcag.toFixed(2).padStart(5)}:1  Lc ${r.apca.toFixed(1)}`);
    if (failures.length) {
      console.log(`  ${failures.length} failure(s):`);
      for (const f of failures) console.log(`   - ${f}`);
    } else console.log('  all checks passed');
  }
  if (process.argv.includes('--report')) {
    mkdirSync(join(ROOT, 'dist'), { recursive: true });
    writeFileSync(join(ROOT, 'dist', 'contrast-report.md'), report.join('\n') + '\n');
  }
  console.log(total ? `\n${total} failure(s)` : '\nAll variants pass');
  process.exit(total ? 1 : 0);
}
