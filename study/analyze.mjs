import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHighlighter } from 'shiki';
import { wcag, apca, deltaE, simulate, flatten } from '../scripts/color.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const THEMES_DIR = process.argv[2];
const OUT = join(HERE, 'data', 'results.json');

const SAMPLES = [
  ['users.ts', 'typescript'], ['invoice.py', 'python'], ['OrderController.php', 'php'],
  ['index.html', 'html'], ['styles.css', 'css'], ['main.go', 'go'],
].map(([f, lang]) => ({ lang, code: readFileSync(join(HERE, 'samples', f), 'utf8') }));

const ROLES = [
  ['comment', /^comment|^punctuation\.definition\.comment/],
  ['regex', /^string\.regexp|^constant\.character\.escape|^constant\.other\.character-class/],
  ['string', /^string|^punctuation\.definition\.string/],
  ['number', /^constant\.numeric|^constant\.language|^keyword\.other\.unit|^constant\.other\.color/],
  ['function', /^entity\.name\.function|^support\.function|^variable\.function|^meta\.function-call\.generic/],
  ['type', /^entity\.name\.(type|class|namespace)|^support\.(class|type)(?!\.property-name)|^entity\.other\.inherited-class|^storage\.type\.(primitive|numeric|string|boolean|built-in)|^entity\.other\.attribute-name\.(class|id)/],
  ['tag', /^entity\.name\.tag/],
  ['attribute', /^entity\.other\.attribute-name/],
  ['property', /^variable\.other\.(property|object\.property|member)|^meta\.object-literal\.key|^support\.type\.property-name|^variable\.other\.constant\.property/],
  ['parameter', /^variable\.parameter/],
  ['keyword', /^keyword(?!\.operator)|^storage\.(type|modifier)|^keyword\.operator\.(new|expression|logical\.python|word)|^variable\.language/],
];
const PAIRS = [['keyword', 'function'], ['keyword', 'type'], ['keyword', 'string'], ['function', 'type'], ['function', 'string'], ['type', 'string'], ['string', 'number'], ['type', 'number'], ['keyword', 'number'], ['tag', 'attribute']];
const VISIONS = ['protan', 'deutan', 'tritan'];

function parseJsonc(text) {
  let out = '';
  let i = 0;
  let inStr = false;
  while (i < text.length) {
    const ch = text[i];
    if (inStr) {
      out += ch;
      if (ch === '\\') { out += text[i + 1] ?? ''; i += 2; continue; }
      if (ch === '"') inStr = false;
      i++;
      continue;
    }
    if (ch === '"') { inStr = true; out += ch; i++; continue; }
    if (ch === '/' && text[i + 1] === '/') { while (i < text.length && text[i] !== '\n') i++; continue; }
    if (ch === '/' && text[i + 1] === '*') { i += 2; while (i < text.length && !(text[i] === '*' && text[i + 1] === '/')) i++; i += 2; continue; }
    out += ch;
    i++;
  }
  return JSON.parse(out.replace(/,(\s*[}\]])/g, '$1'));
}

function loadTheme(file) {
  const t = parseJsonc(readFileSync(file, 'utf8').replace(/^﻿/, ''));
  if (t.include) {
    const base = loadTheme(join(dirname(file), t.include));
    return {
      ...base, ...t,
      colors: { ...(base.colors ?? {}), ...(t.colors ?? {}) },
      tokenColors: [...(Array.isArray(base.tokenColors) ? base.tokenColors : []), ...(Array.isArray(t.tokenColors) ? t.tokenColors : [])],
      semanticTokenColors: { ...(base.semanticTokenColors ?? {}), ...(t.semanticTokenColors ?? {}) },
    };
  }
  return t;
}

const norm = (hex) => {
  if (!hex || typeof hex !== 'string' || !hex.startsWith('#')) return null;
  let h = hex.slice(1).toLowerCase();
  if (h.length === 3 || h.length === 4) h = [...h].map((c) => c + c).join('');
  return '#' + h;
};

function analyze(theme, label, uiTheme) {
  const dark = uiTheme !== 'vs' && uiTheme !== 'hc-light';
  const c = theme.colors ?? {};
  const bg = flatten(norm(c['editor.background']) ?? (dark ? '#1e1e1e' : '#ffffff'), dark ? '#1e1e1e' : '#ffffff');
  const tokenDefault = (theme.tokenColors ?? []).find((r) => !r.scope && r.settings?.foreground)?.settings.foreground;
  const fg = flatten(norm(c['editor.foreground']) ?? norm(tokenDefault) ?? (dark ? '#d4d4d4' : '#000000'), bg);
  const line = norm(c['editor.lineHighlightBackground']) ? flatten(norm(c['editor.lineHighlightBackground']), bg) : bg;
  return { dark, bg, fg, line };
}

const results = [];
const highlighterThemes = [];
const jobs = [];

function collect(dir, extId, extName, installs, flagshipLabel) {
  const manifest = JSON.parse(readFileSync(join(dir, '_manifest.json'), 'utf8'));
  manifest.themes.forEach((t, idx) => {
    const file = join(dir, t.path.replace(/^\.\//, ''));
    if (!existsSync(file)) { results.push({ extId, label: t.label, error: 'theme file missing (generated at runtime?)' }); return; }
    let theme;
    try { theme = loadTheme(file); } catch (e) { results.push({ extId, label: t.label, error: 'parse error: ' + e.message }); return; }
    if (!Array.isArray(theme.tokenColors)) { results.push({ extId, label: t.label, error: 'tokenColors not inline (tmTheme reference)' }); return; }
    const name = `${extId}::${idx}`;
    const base = analyze(theme, t.label, t.uiTheme);
    const tokenColors = theme.tokenColors.filter((r) => r && r.settings);
    highlighterThemes.push({ name, type: base.dark ? 'dark' : 'light', colors: { ...theme.colors, 'editor.background': base.bg, 'editor.foreground': base.fg }, tokenColors });
    jobs.push({ name, extId, extName, installs, label: t.label ?? t.id, uiTheme: t.uiTheme, flagship: flagshipLabel ? (t.label ?? t.id) === flagshipLabel : idx === 0, ...base });
  });
}

const top = JSON.parse(readFileSync(join(HERE, 'data', 'top20.json'), 'utf8'));
const selection = JSON.parse(readFileSync(join(HERE, 'selection.json'), 'utf8'));
for (const row of top) collect(join(THEMES_DIR, row.id), row.id, row.name, row.installs, selection.flagship[row.id]);
collect(join(HERE, 'clearsight'), 'tms-outsource.clearsight-theme', 'Clearsight', 0, 'Clearsight');

const langs = [...new Set(SAMPLES.map((s) => s.lang))];
const hl = await createHighlighter({ themes: [], langs });

for (const job of jobs) {
  const th = highlighterThemes.find((t) => t.name === job.name);
  try { await hl.loadTheme(th); } catch (e) { results.push({ extId: job.extId, label: job.label, error: 'shiki: ' + e.message }); continue; }
  const roleChars = {};
  let totalChars = 0;
  let lowChars = 0;
  const colorChars = {};
  for (const s of SAMPLES) {
    const { tokens } = hl.codeToTokens(s.code, { lang: s.lang, theme: job.name, includeExplanation: true });
    for (const line of tokens) for (const tok of line) {
      const text = tok.content.replace(/\s/g, '');
      if (!text) continue;
      const color = flatten(norm(tok.color) ?? job.fg, job.bg);
      totalChars += text.length;
      colorChars[color] = (colorChars[color] ?? 0) + text.length;
      if (wcag(color, job.bg) < 4.5) lowChars += text.length;
      const scopes = (tok.explanation ?? []).flatMap((e) => e.scopes.map((x) => x.scopeName));
      const inner = [...scopes].reverse();
      let role = null;
      for (const sc of inner) {
        const hit = ROLES.find(([, re]) => re.test(sc));
        if (hit) { role = hit[0]; break; }
      }
      if (!role) continue;
      roleChars[role] ??= {};
      roleChars[role][color] = (roleChars[role][color] ?? 0) + text.length;
    }
  }
  const roleColor = Object.fromEntries(Object.entries(roleChars).map(([r, m]) => [r, Object.entries(m).sort((a, b) => b[1] - a[1])[0][0]]));
  const roleContrast = Object.fromEntries(Object.entries(roleColor).map(([r, col]) => [r, +wcag(col, job.bg).toFixed(2)]));
  const failingRoles = Object.entries(roleContrast).filter(([, v]) => v < 4.5).map(([r]) => r);
  const lost = [];
  for (const [a, b] of PAIRS) {
    if (!roleColor[a] || !roleColor[b]) continue;
    const normal = deltaE(roleColor[a], roleColor[b]);
    if (normal < 0.07) continue;
    for (const v of VISIONS) {
      const d = deltaE(simulate(roleColor[a], v), simulate(roleColor[b], v));
      if (d < 0.07) lost.push({ pair: `${a}/${b}`, vision: v, normal: +normal.toFixed(3), simulated: +d.toFixed(3) });
    }
  }
  results.push({
    extId: job.extId, extName: job.extName, installs: job.installs, label: job.label, flagship: job.flagship, dark: job.dark,
    bg: job.bg, fg: job.fg,
    fgContrast: +wcag(job.fg, job.bg).toFixed(2),
    commentColor: roleColor.comment ?? null,
    commentContrast: roleContrast.comment ?? null,
    commentContrastOnLine: roleColor.comment ? +wcag(roleColor.comment, job.line).toFixed(2) : null,
    commentApca: roleColor.comment ? +Math.abs(apca(roleColor.comment, job.bg)).toFixed(1) : null,
    roleColor, roleContrast, failingRoles,
    lowContrastShare: +(lowChars / totalChars).toFixed(4),
    distinctColors: Object.keys(colorChars).length,
    lostPairs: lost,
    lostPairCount: new Set(lost.map((l) => l.pair)).size,
  });
}

writeFileSync(OUT, JSON.stringify(results, null, 2));
const ok = results.filter((r) => !r.error);
console.log(`analyzed ${ok.length} themes, ${results.length - ok.length} skipped`);
for (const r of results.filter((x) => x.error)) console.log('  skipped', r.extId, r.label, '-', r.error);
for (const r of ok.filter((x) => x.flagship)) {
  console.log(`${r.label.padEnd(30)} fg ${String(r.fgContrast).padStart(5)}  comment ${String(r.commentContrast).padStart(5)}  failing [${r.failingRoles.join(',')}]  low ${(r.lowContrastShare * 100).toFixed(1)}%  CVD-lost ${r.lostPairCount} ${[...new Set(r.lostPairs.map((l) => l.pair))].join(' ')}`);
}
