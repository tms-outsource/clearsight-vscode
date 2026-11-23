import { readFileSync, writeFileSync, mkdirSync, existsSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { createHighlighter } from 'shiki';
import { ROOT } from './palette.mjs';

const CHROME = process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const OUT = join(ROOT, 'images');
const TMP = join(tmpdir(), 'clearsight-shots');
mkdirSync(OUT, { recursive: true });
mkdirSync(TMP, { recursive: true });

const SAMPLES = {
  ts: {
    file: 'users.ts', lang: 'typescript', crumbs: ['src', 'api', 'users.ts', 'getUser'], current: 13, select: 'hit',
    code: `import { type User, type Entry } from '../types';
import { logger } from '../logger';

const CACHE_TTL = 60_000;
const MAX_ENTRIES = 500;
const cache = new Map<string, Entry<User>>();

/**
 * Returns a user by id, cached for one minute.
 * @throws {NotFoundError} when the API answers 404
 */
export async function getUser(id: string, opts?: { fresh: boolean }): Promise<User> {
  const hit = cache.get(id);
  if (hit && !opts?.fresh && Date.now() - hit.at < CACHE_TTL) {
    return hit.value;
  }

  const res = await fetch(\`/api/users/\${encodeURIComponent(id)}\`);
  if (!res.ok) {
    logger.warn('user lookup failed', { id, status: res.status });
    throw new NotFoundError(\`User \${id} not found\`);
  }

  const user = (await res.json()) as User;
  cache.set(id, { at: Date.now(), value: user });
  return user;
}

export class NotFoundError extends Error {
  readonly code = 404;
}`,
  },
  py: {
    file: 'invoice.py', lang: 'python', crumbs: ['src', 'billing', 'invoice.py', 'Invoice', 'is_overdue'], current: 24, select: 'due',
    code: `from dataclasses import dataclass, field
from datetime import date, timedelta
from decimal import Decimal


@dataclass
class Invoice:
    """An invoice that becomes overdue after \`terms\` days."""

    number: str
    total: Decimal
    issued: date
    terms: int = 30
    paid: bool = False
    tags: list[str] = field(default_factory=list)

    @property
    def due(self) -> date:
        return self.issued + timedelta(days=self.terms)

    def is_overdue(self, today: date | None = None) -> bool:
        # unpaid and past the due date
        today = today or date.today()
        return not self.paid and today > self.due

    def apply_discount(self, percent: float) -> Decimal:
        if not 0 <= percent <= 100:
            raise ValueError(f"invalid discount: {percent}")
        self.total *= Decimal(1 - percent / 100)
        return self.total.quantize(Decimal("0.01"))`,
  },
  php: {
    file: 'OrderController.php', lang: 'php', crumbs: ['app', 'Http', 'OrderController.php', 'show'], current: 19, select: 'order',
    code: `<?php

declare(strict_types=1);

namespace App\\Http\\Controllers;

use App\\Models\\Order;
use Illuminate\\Http\\JsonResponse;

final class OrderController extends Controller
{
    private const PER_PAGE = 25;

    public function __construct(private readonly OrderService $orders) {}

    public function show(int $id): JsonResponse
    {
        // 404 when the order does not exist
        $order = Order::with('items')->findOrFail($id);

        return response()->json([
            'id' => $order->id,
            'status' => $order->status->label(),
            'total' => round($order->total, 2),
            'paid' => $order->paid_at !== null,
        ]);
    }
}`,
  },
};

const TREE = (active) => [
  { name: 'ACME-ORDERS', root: true },
  { name: 'app', depth: 0, folder: true, open: active === 'php' },
  ...(active === 'php' ? [{ name: 'Http', depth: 1, folder: true, open: true }, { name: 'OrderController.php', depth: 2, active: true }] : []),
  { name: 'node_modules', depth: 0, folder: true, status: 'ignored' },
  { name: 'src', depth: 0, folder: true, open: true, status: 'dot' },
  { name: 'api', depth: 1, folder: true, open: true, status: 'dot' },
  { name: 'users.ts', depth: 2, status: 'M', active: active === 'ts' },
  { name: 'billing', depth: 1, folder: true, open: true },
  { name: 'invoice.py', depth: 2, active: active === 'py' },
  { name: 'legacy.ts', depth: 1, status: 'U' },
  { name: 'logger.ts', depth: 1 },
  { name: 'types.ts', depth: 1 },
  { name: 'web', depth: 0, folder: true },
  { name: '.gitignore', depth: 0, status: 'U' },
  { name: 'package.json', depth: 0 },
  { name: 'tsconfig.json', depth: 0 },
];

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function icon(name, color) {
  const paths = {
    files: '<path d="M7 3h7l5 5v13H7z M14 3v5h5" />',
    search: '<circle cx="10.5" cy="10.5" r="6"/><path d="M15 15l6 6"/>',
    git: '<circle cx="7" cy="5" r="2.2"/><circle cx="7" cy="19" r="2.2"/><circle cx="17" cy="9" r="2.2"/><path d="M7 7.2v9.6 M17 11.2c0 4-10 3-10 5.6"/>',
    run: '<path d="M8 5l11 7-11 7z"/>',
    ext: '<path d="M4 4h7v7H4z M13 13h7v7h-7z M4 13h7v7H4z M14.5 3.5l6 6-6 6-6-6z"/>',
    gear: '<circle cx="12" cy="12" r="3.2"/><path d="M12 3v3 M12 18v3 M3 12h3 M18 12h3 M5.6 5.6l2.1 2.1 M16.3 16.3l2.1 2.1 M5.6 18.4l2.1-2.1 M16.3 7.7l2.1-2.1"/>',
    account: '<circle cx="12" cy="8.5" r="3.5"/><path d="M5 20c1.5-4 4-5.5 7-5.5s5.5 1.5 7 5.5"/>',
  };
  return `<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="${color}" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round">${paths[name]}</svg>`;
}

function editorLines(hl, theme, sample, { numbers = true } = {}) {
  const c = theme.colors;
  const { tokens } = hl.codeToTokens(sample.code, { lang: sample.lang, theme: theme.name });
  let selected = false;
  return tokens.map((line, i) => {
    const n = i + 1;
    const spans = line.map((t) => {
      const style = [`color:${t.color}`];
      if (t.fontStyle & 1) style.push('font-style:italic');
      if (t.fontStyle & 2) style.push('font-weight:bold');
      let text = esc(t.content);
      if (!selected && n === sample.current && sample.select && t.content.trim() === sample.select) {
        selected = true;
        text = `<span class="sel">${text}</span><span class="caret"></span>`;
      }
      return `<span style="${style.join(';')}">${text}</span>`;
    }).join('');
    const cur = n === sample.current;
    return `<div class="ln${cur ? ' cur' : ''}">${numbers ? `<span class="num" style="color:${cur ? c['editorLineNumber.activeForeground'] : c['editorLineNumber.foreground']}">${n}</span>` : ''}<span class="code">${spans || ' '}</span></div>`;
  }).join('');
}

function terminalHtml(c) {
  const g = c['terminal.ansiGreen'], r = c['terminal.ansiRed'], y = c['terminal.ansiYellow'], d = c['terminal.ansiBrightBlack'], b = c['terminal.ansiBlue'], m = c['terminal.ansiMagenta'], f = c['terminal.foreground'];
  const s = (col, t) => `<span style="color:${col}">${esc(t)}</span>`;
  return [
    `${s(b, 'acme-orders')} ${s(m, 'main*')} ${s(f, '$ npm test')}`,
    '',
    ` ${s(g, '✓')} ${s(f, 'src/api/users.test.ts')} ${s(d, '(6 tests) 41ms')}`,
    ` ${s(g, '✓')} ${s(f, 'src/billing/invoice.test.ts')} ${s(d, '(9 tests) 18ms')}`,
    ` ${s(r, '✗')} ${s(f, 'src/api/orders.test.ts')} ${s(d, '>')} ${s(f, 'rejects an unknown status')}`,
    `   ${s(r, 'AssertionError:')} ${s(f, 'expected')} ${s(y, '400')} ${s(f, 'to be')} ${s(y, '422')}`,
    '',
    ` ${s(d, 'Test Files')}  ${s(r, '1 failed')} ${s(d, '|')} ${s(g, '2 passed')} ${s(d, '(3)')}`,
    ` ${s(d, '  Duration')}  ${s(f, '1.24s')}`,
  ].map((l) => `<div>${l || ' '}</div>`).join('');
}

function windowHtml(hl, theme, key, { terminal }) {
  const c = theme.colors;
  const sample = SAMPLES[key];
  const tree = TREE(key).map((it) => {
    if (it.root) return `<div class="root">${it.name}</div>`;
    const colorFor = { M: c['gitDecoration.modifiedResourceForeground'], U: c['gitDecoration.untrackedResourceForeground'], ignored: c['gitDecoration.ignoredResourceForeground'], dot: c['gitDecoration.modifiedResourceForeground'] };
    const color = it.status && it.status !== 'dot' ? colorFor[it.status] : c['sideBar.foreground'];
    const badge = it.status === 'M' || it.status === 'U' ? `<span class="badge" style="color:${colorFor[it.status]}">${it.status}</span>` : it.status === 'dot' ? `<span class="badge" style="color:${colorFor.dot}">●</span>` : '';
    const chev = it.folder ? `<span class="chev" style="color:${c['icon.foreground']}">${it.open ? '⌄' : '›'}</span>` : '<span class="chev"></span>';
    const bg = it.active ? `background:${c['list.inactiveSelectionBackground']};` : '';
    return `<div class="row" style="${bg}padding-left:${10 + it.depth * 14}px;color:${color}">${chev}<span class="nm">${it.name}</span>${badge}</div>`;
  }).join('');
  const others = Object.entries(SAMPLES).filter(([k]) => k !== key).map(([, s]) => s.file);
  const tabs = [sample.file, ...others].map((f, i) =>
    `<div class="tab" style="background:${i === 0 ? c['tab.activeBackground'] : c['tab.inactiveBackground']};color:${i === 0 ? c['tab.activeForeground'] : c['tab.inactiveForeground']};${i === 0 ? `box-shadow:inset 0 1px 0 ${c['tab.activeBorderTop']}` : ''};border-right:1px solid ${c['tab.border']}">${f}${i === 0 && key === 'ts' ? `<span style="color:${c['tab.activeForeground']};margin-left:10px">●</span>` : ''}</div>`).join('');
  const crumbs = sample.crumbs.map((x, i) => `<span style="color:${i === sample.crumbs.length - 1 ? c['breadcrumb.focusForeground'] : c['breadcrumb.foreground']}">${x}</span>`).join(`<span style="color:${c['breadcrumb.foreground']};padding:0 6px">›</span>`);
  const act = ['files', 'search', 'git', 'run', 'ext'].map((n, i) => `<div class="act-i" style="${i === 0 ? `box-shadow:inset 2px 0 0 ${c['activityBar.activeBorder']}` : ''}">${icon(n, i === 0 ? c['activityBar.foreground'] : c['activityBar.inactiveForeground'])}${n === 'git' ? `<span class="act-badge" style="background:${c['activityBarBadge.background']};color:${c['activityBarBadge.foreground']}">3</span>` : ''}</div>`).join('');
  const panel = terminal ? `
    <div class="panel" style="background:${c['panel.background']};border-top:1px solid ${c['panel.border']}">
      <div class="ptabs">${['PROBLEMS', 'OUTPUT', 'DEBUG CONSOLE', 'TERMINAL'].map((t) => `<span style="color:${t === 'TERMINAL' ? c['panelTitle.activeForeground'] : c['panelTitle.inactiveForeground']};${t === 'TERMINAL' ? `box-shadow:inset 0 -1px 0 ${c['panelTitle.activeBorder']}` : ''}">${t}</span>`).join('')}</div>
      <div class="term" style="background:${c['terminal.background']}">${terminalHtml(c)}</div>
    </div>` : '';
  return `<!doctype html><html><head><meta charset="utf-8"><style>
    *{box-sizing:border-box}html,body{margin:0;width:1280px;height:800px;overflow:hidden;background:${c['editor.background']}}
    body{font:13px "Segoe UI",system-ui,sans-serif;color:${c.foreground};display:grid;grid-template-rows:35px 1fr 22px}
    .title{background:${c['titleBar.activeBackground']};border-bottom:1px solid ${c['titleBar.border']};display:flex;align-items:center;justify-content:center;position:relative;color:${c['titleBar.activeForeground']}}
    .title .menu{position:absolute;left:12px;display:flex;gap:14px;font-size:13px}
    .cc{width:420px;height:24px;border-radius:6px;background:${c['commandCenter.background']};border:1px solid ${c['commandCenter.border']};color:${c['commandCenter.foreground']};display:flex;align-items:center;justify-content:center;font-size:12px}
    .dots{position:absolute;right:14px;display:flex;gap:18px;color:${c['titleBar.activeForeground']};font-size:14px}
    .main{display:grid;grid-template-columns:48px 260px 1fr;min-height:0}
    .act{background:${c['activityBar.background']};border-right:1px solid ${c['activityBar.border']};display:flex;flex-direction:column;align-items:center;padding-top:6px}
    .act-i{width:48px;height:48px;display:flex;align-items:center;justify-content:center;position:relative}
    .act-badge{position:absolute;right:7px;bottom:8px;font-size:9px;font-weight:600;min-width:16px;height:16px;border-radius:8px;display:flex;align-items:center;justify-content:center}
    .act .bottom{margin-top:auto;padding-bottom:6px}
    .side{background:${c['sideBar.background']};border-right:1px solid ${c['sideBar.border']};overflow:hidden}
    .side h3{margin:0;height:35px;display:flex;align-items:center;padding-left:20px;font:400 11px "Segoe UI",sans-serif;letter-spacing:.04em;color:${c['sideBarTitle.foreground']}}
    .root{font-weight:700;font-size:11px;padding:3px 0 3px 8px;color:${c['sideBarSectionHeader.foreground']}}
    .row{display:flex;align-items:center;height:22px;padding-right:14px;white-space:nowrap}
    .chev{width:16px;flex:none;text-align:center;font-size:12px}.nm{flex:1;padding-left:4px}.badge{font-size:12px;margin-left:6px}
    .ed{display:grid;grid-template-rows:35px 22px 1fr ${terminal ? '232px' : ''};min-width:0;min-height:0;background:${c['editor.background']}}
    .tabs{display:flex;background:${c['editorGroupHeader.tabsBackground']};border-bottom:1px solid ${c['editorGroupHeader.tabsBorder']}}
    .tab{display:flex;align-items:center;padding:0 16px;height:35px;font-size:13px}
    .crumbs{display:flex;align-items:center;padding-left:16px;font-size:12.5px;background:${c['breadcrumb.background']}}
    .code-area{padding-top:4px;font:15px/24px Consolas,"Courier New",monospace;overflow:hidden;white-space:pre}
    .ln{display:flex;height:24px}.ln.cur{background:${c['editor.lineHighlightBackground']}}
    .num{width:62px;flex:none;text-align:right;padding-right:26px}
    .sel{background:${c['editor.selectionBackground']}}
    .caret{display:inline-block;width:2px;height:20px;vertical-align:-4px;background:${c['editorCursor.foreground']}}
    .panel{display:grid;grid-template-rows:35px 1fr;min-height:0}
    .ptabs{display:flex;gap:22px;padding-left:20px;align-items:center;font-size:11px;letter-spacing:.02em}
    .ptabs span{padding:8px 0}
    .term{padding:4px 20px;font:14px/21px Consolas,monospace;white-space:pre;overflow:hidden}
    .status{background:${c['statusBar.background']};border-top:1px solid ${c['statusBar.border']};color:${c['statusBar.foreground']};display:flex;align-items:center;font-size:12px}
    .status .remote{background:${c['statusBarItem.remoteBackground']};color:${c['statusBarItem.remoteForeground']};height:100%;display:flex;align-items:center;padding:0 10px;margin-right:8px}
    .status span{padding:0 8px}.status .r{margin-left:auto;display:flex}
  </style></head><body>
    <div class="title"><div class="menu"><span>File</span><span>Edit</span><span>Selection</span><span>View</span><span>Go</span><span>Run</span><span>…</span></div><div class="cc">⌕&nbsp;&nbsp;acme-orders</div><div class="dots"><span>—</span><span>▢</span><span>✕</span></div></div>
    <div class="main">
      <nav class="act">${act}<div class="bottom">${icon('account', c['activityBar.inactiveForeground'])}<div style="height:22px"></div>${icon('gear', c['activityBar.inactiveForeground'])}</div></nav>
      <aside class="side"><h3>EXPLORER</h3>${tree}</aside>
      <section class="ed">
        <div class="tabs">${tabs}</div>
        <div class="crumbs">${crumbs}</div>
        <div class="code-area">${editorLines(hl, theme, sample)}</div>
        ${panel}
      </section>
    </div>
    <footer class="status"><span class="remote">⇄</span><span>⑂ main*</span><span>⟳</span><span style="color:${c['statusBar.foreground']}">⊗ 0  ⚠ 0</span><div class="r"><span>Ln ${sample.current}, Col 21</span><span>Spaces: ${key === 'ts' ? 2 : 4}</span><span>UTF-8</span><span>LF</span><span>${{ ts: 'TypeScript', py: 'Python', php: 'PHP' }[key]}</span></div></footer>
  </body></html>`;
}

function cvdHtml(hl, theme) {
  const c = theme.colors;
  const sample = { ...SAMPLES.ts, current: 0, code: SAMPLES.ts.code.split('\n').slice(11, 26).join('\n') };
  const m = {
    protan: '0.152286 1.052583 -0.204868 0 0 0.114503 0.786281 0.099216 0 0 -0.003882 -0.048116 1.051998 0 0 0 0 0 1 0',
    deutan: '0.367322 0.860646 -0.227968 0 0 0.280085 0.672501 0.047413 0 0 -0.011820 0.042940 0.968881 0 0 0 0 0 1 0',
    tritan: '1.255528 -0.076749 -0.178779 0 0 -0.078411 0.930809 0.147602 0 0 0.004733 0.691367 0.303900 0 0 0 0 0 1 0',
  };
  const filters = Object.entries(m).map(([id, v]) => `<filter id="${id}" color-interpolation-filters="linearRGB"><feColorMatrix type="matrix" values="${v}"/></filter>`).join('');
  const panes = [['normal', 'Normal vision'], ['protan', 'Protanopia'], ['deutan', 'Deuteranopia'], ['tritan', 'Tritanopia']].map(([id, label]) =>
    `<figure><figcaption>${label}</figcaption><div class="pane" style="${id === 'normal' ? '' : `filter:url(#${id})`}">${editorLines(hl, theme, sample, { numbers: false })}</div></figure>`).join('');
  return `<!doctype html><html><head><meta charset="utf-8"><style>
    *{box-sizing:border-box}html,body{margin:0;width:1280px;height:800px;overflow:hidden;background:${c['sideBar.background']}}
    body{padding:28px;display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);grid-template-rows:minmax(0,1fr) minmax(0,1fr);gap:20px;font:13px "Segoe UI",sans-serif}
    figure{margin:0;display:flex;flex-direction:column;min-height:0}
    figcaption{color:${c['sideBar.foreground']};font-size:14px;font-weight:600;margin:0 0 8px 2px}
    .pane{flex:1;background:${c['editor.background']};border:1px solid ${c['editorGroup.border']};border-radius:8px;padding:12px 16px;font:12px/20px Consolas,monospace;white-space:pre;overflow:hidden;min-width:0}
    .ln{display:flex;height:20px}
  </style></head><body><svg width="0" height="0" style="position:absolute">${filters}</svg>${panes}</body></html>`;
}

function shoot(html, name) {
  const page = join(TMP, `${name}.html`);
  writeFileSync(page, html);
  const out = join(OUT, `${name}.png`);
  if (existsSync(out)) rmSync(out);
  execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--hide-scrollbars', `--user-data-dir=${join(TMP, 'profile')}`,
    '--force-device-scale-factor=1.5', '--window-size=1280,800', '--virtual-time-budget=3000', `--screenshot=${out}`, `file:///${page.replace(/\\/g, '/')}`], { stdio: 'ignore' });
  console.log(`images/${name}.png`);
}

const load = (n) => JSON.parse(readFileSync(join(ROOT, 'themes', `${n}-color-theme.json`), 'utf8'));
const themes = { dark: load('clearsight'), soft: load('clearsight-soft'), light: load('clearsight-light') };
const hl = await createHighlighter({ themes: Object.values(themes), langs: ['typescript', 'python', 'php'] });

shoot(windowHtml(hl, themes.dark, 'ts', { terminal: true }), 'screenshot-dark');
shoot(windowHtml(hl, themes.soft, 'py', { terminal: false }), 'screenshot-soft');
shoot(windowHtml(hl, themes.light, 'php', { terminal: true }), 'screenshot-light');
shoot(cvdHtml(hl, themes.dark), 'screenshot-colorblind');
