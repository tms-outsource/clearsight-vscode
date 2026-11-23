import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { loadPalette, ROOT } from './palette.mjs';

const ROLE = {
  k: 'keyword', f: 'function', t: 'type', s: 'string', n: 'number', p: 'property', a: 'parameter',
  g: 'tag', at: 'attribute', r: 'regex', o: 'operator', c: 'comment', u: 'punctuation', v: 'fg',
};

const SAMPLES = {
  'user.ts': `⟦c|// Fetch a user, cached for one minute⟧
⟦k|import⟧ ⟦u|{⟧ ⟦t|User⟧ ⟦u|}⟧ ⟦k|from⟧ ⟦s|'./types'⟧⟦u|;⟧

⟦k|const⟧ ⟦n|CACHE_TTL⟧ ⟦o|=⟧ ⟦n|60_000⟧⟦u|;⟧
⟦k|const⟧ cache ⟦o|=⟧ ⟦k|new⟧ ⟦t|Map⟧⟦u|<⟧⟦t|string⟧⟦u|,⟧ ⟦t|Entry⟧⟦u|>⟧()⟦u|;⟧

⟦k|export⟧ ⟦k|async⟧ ⟦k|function⟧ ⟦f|getUser⟧(⟦a|id⟧⟦u|:⟧ ⟦t|string⟧)⟦u|:⟧ ⟦t|Promise⟧⟦u|<⟧⟦t|User⟧⟦u|>⟧ ⟦u|{⟧
  ⟦k|const⟧ hit ⟦o|=⟧ cache⟦u|.⟧⟦f|get⟧(⟦a|id⟧)⟦u|;⟧
  ⟦k|if⟧ (hit ⟦o|&&⟧ ⟦t|Date⟧⟦u|.⟧⟦f|now⟧() ⟦o|-⟧ hit⟦u|.⟧⟦p|at⟧ ⟦o|<⟧ ⟦n|CACHE_TTL⟧) ⟦k|return⟧ hit⟦u|.⟧⟦p|value⟧⟦u|;⟧
  ⟦k|const⟧ res ⟦o|=⟧ ⟦k|await⟧ ⟦f|fetch⟧(⟦s|\`/api/users/⟧⟦u|\${⟧⟦a|id⟧⟦u|}⟧⟦s|\`⟧)⟦u|;⟧
  ⟦k|if⟧ (⟦o|!⟧res⟦u|.⟧⟦p|ok⟧) ⟦k|throw⟧ ⟦k|new⟧ ⟦t|Error⟧(⟦s|'User not found'⟧)⟦u|;⟧
  ⟦k|return⟧ ⟦k|this⟧⟦u|.⟧⟦f|parse⟧(⟦k|await⟧ res⟦u|.⟧⟦f|json⟧())⟦u|;⟧
⟦u|}⟧

⟦k|export⟧ ⟦k|const⟧ isSlug ⟦o|=⟧ (⟦a|s⟧⟦u|:⟧ ⟦t|string⟧) ⟦o|=>⟧ ⟦r|/^[a-z0-9-]+$/⟧⟦u|.⟧⟦f|test⟧(⟦a|s⟧)⟦u|;⟧`,
  'invoice.py': `⟦k|from⟧ dataclasses ⟦k|import⟧ dataclass

⟦u|@⟧⟦f|dataclass⟧
⟦k|class⟧ ⟦t|Invoice⟧⟦u|:⟧
    total⟦u|:⟧ ⟦t|float⟧
    paid⟦u|:⟧ ⟦t|bool⟧ ⟦o|=⟧ ⟦n|False⟧

    ⟦k|def⟧ ⟦f|is_overdue⟧(⟦k|self⟧⟦u|,⟧ ⟦a|days⟧⟦u|:⟧ ⟦t|int⟧) ⟦o|->⟧ ⟦t|bool⟧⟦u|:⟧
        ⟦c|# unpaid for more than 30 days⟧
        ⟦k|return⟧ ⟦k|not⟧ ⟦k|self⟧⟦u|.⟧⟦p|paid⟧ ⟦k|and⟧ ⟦a|days⟧ ⟦o|>⟧ ⟦n|30⟧`,
  'OrderController.php': `⟦k|<?php⟧

⟦k|namespace⟧ ⟦t|App\\Http\\Controllers⟧⟦u|;⟧

⟦k|final⟧ ⟦k|class⟧ ⟦t|OrderController⟧ ⟦k|extends⟧ ⟦t|Controller⟧
⟦u|{⟧
    ⟦k|public⟧ ⟦k|function⟧ ⟦f|show⟧(⟦t|int⟧ ⟦a|$id⟧)⟦u|:⟧ ⟦t|JsonResponse⟧
    ⟦u|{⟧
        ⟦c|// 404 when the order does not exist⟧
        $order ⟦o|=⟧ ⟦t|Order⟧⟦o|::⟧⟦f|findOrFail⟧(⟦a|$id⟧)⟦u|;⟧
        ⟦k|return⟧ ⟦f|response⟧()⟦o|->⟧⟦f|json⟧([⟦s|'status'⟧ ⟦o|=>⟧ ⟦k|$this⟧⟦o|->⟧⟦p|status⟧⟦u|,⟧ ⟦s|'total'⟧ ⟦o|=>⟧ ⟦n|42.50⟧])⟦u|;⟧
    ⟦u|}⟧
⟦u|}⟧`,
  'button.html': `⟦u|<⟧⟦g|button⟧ ⟦at|class⟧⟦o|=⟧⟦s|"btn primary"⟧ ⟦at|type⟧⟦o|=⟧⟦s|"submit"⟧⟦u|>⟧Save changes⟦u|</⟧⟦g|button⟧⟦u|>⟧

⟦u|<⟧⟦g|style⟧⟦u|>⟧
  ⟦t|.btn⟧⟦u|:⟧⟦k|hover⟧ ⟦u|{⟧ ⟦p|background⟧⟦u|:⟧ ⟦f|var⟧(⟦n|--accent⟧)⟦u|;⟧ ⟦p|padding⟧⟦u|:⟧ ⟦n|0.5rem⟧ ⟦n|1rem⟧⟦u|;⟧ ⟦u|}⟧
⟦u|</⟧⟦g|style⟧⟦u|>⟧`,
};

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const render = (src) =>
  src.split('\n').map((line) =>
    esc(line).replace(/⟦(\w+)\|(.*?)⟧/g, (_, r, t) => `<span class="${ROLE[r]}">${t}</span>`),
  );

const palette = loadPalette();
const css = Object.values(palette.variants).map((v) => {
  const vars = Object.entries(v.colors).map(([k, hex]) => `--${k}:${hex};`).join('');
  return `[data-variant="${v.id}"]{${vars}--selA:${v.selectionAlpha};}`;
}).join('\n');

const files = Object.entries(SAMPLES);
const tabs = files.map(([name], i) => `<button class="tab${i === 0 ? ' on' : ''}" data-file="${i}">${name}</button>`).join('');
const panes = files.map(([, src], i) => {
  const lines = render(src);
  const rows = lines.map((l, n) => {
    const cur = i === 0 && n === 7 ? ' cur' : '';
    const sel = i === 0 && n === 8 ? l.replace('hit', '<mark>hit</mark>') : l;
    return `<div class="ln${cur}"><span class="num">${n + 1}</span><code>${sel || ' '}</code></div>`;
  }).join('');
  return `<div class="pane" data-pane="${i}"${i === 0 ? '' : ' hidden'}>${rows}</div>`;
}).join('');

const matrices = {
  protan: '0.152286 1.052583 -0.204868 0 0 0.114503 0.786281 0.099216 0 0 -0.003882 -0.048116 1.051998 0 0 0 0 0 1 0',
  deutan: '0.367322 0.860646 -0.227968 0 0 0.280085 0.672501 0.047413 0 0 -0.011820 0.042940 0.968881 0 0 0 0 0 1 0',
  tritan: '1.255528 -0.076749 -0.178779 0 0 -0.078411 0.930809 0.147602 0 0 0.004733 0.691367 0.303900 0 0 0 0 0 1 0',
};
const filters = Object.entries(matrices).map(([id, m]) => `<filter id="${id}" color-interpolation-filters="linearRGB"><feColorMatrix type="matrix" values="${m}"/></filter>`).join('');

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Clearsight preview</title>
<style>
${css}
*{box-sizing:border-box}
body{margin:0;font:14px/1.5 system-ui,sans-serif;background:#0e1014;color:#e6e6e6;padding:16px}
.controls{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:12px}
.controls button{background:#1d2129;color:#d8dce3;border:1px solid #333a46;border-radius:6px;padding:6px 10px;cursor:pointer;font:inherit}
.controls button[aria-pressed="true"]{background:#d8dce3;color:#111}
.win{display:grid;grid-template-columns:48px 220px 1fr;grid-template-rows:auto 1fr auto auto;border-radius:10px;overflow:hidden;border:1px solid var(--border);max-width:1180px;background:var(--bg);color:var(--fg)}
.act{grid-row:1/4;background:var(--bgActivity);display:flex;flex-direction:column;align-items:center;gap:18px;padding-top:14px}
.act i{width:22px;height:22px;border:2px solid var(--fgSubtle);border-radius:5px;display:block}
.act i.on{border-color:var(--fg);box-shadow:-11px 0 0 -9px var(--accent)}
.side{grid-row:1/4;background:var(--bgSidebar);border-right:1px solid var(--border);padding:10px 0;font-size:13px}
.side h2{font-size:11px;letter-spacing:.06em;text-transform:uppercase;color:var(--fgMuted);margin:0 14px 8px;font-weight:600}
.side div{padding:2px 14px 2px 22px;display:flex;justify-content:space-between}
.side div.sel{background:var(--bgLine)}
.side .added{color:var(--added)}.side .modified{color:var(--modified)}.side .deleted{color:var(--deleted);text-decoration:line-through}.side .ignored{color:var(--ignored)}.side .conflict{color:var(--conflict)}.side .plain{color:var(--fg)}
.tabs{background:var(--bgSidebar);display:flex;border-bottom:1px solid var(--border);overflow-x:auto}
.tab{background:transparent;border:0;border-right:1px solid var(--border);color:var(--fgMuted);padding:8px 14px;font:13px system-ui,sans-serif;cursor:pointer;white-space:nowrap}
.tab.on{background:var(--bg);color:var(--fg);box-shadow:inset 0 2px 0 var(--accent)}
.editor{padding:10px 0;font:14px/1.6 "JetBrains Mono","Cascadia Code",Consolas,monospace;overflow-x:auto;min-height:420px}
.ln{display:flex;white-space:pre}
.ln.cur{background:var(--bgLine)}
.num{width:52px;text-align:right;padding-right:18px;color:var(--fgSubtle);flex:none;user-select:none}
.ln.cur .num{color:var(--fg)}
code{font:inherit;color:var(--fg)}
mark{background:color-mix(in srgb,var(--selection) calc(var(--selA)*100%),transparent);color:inherit}
.keyword{color:var(--keyword)}.function{color:var(--function)}.type{color:var(--type)}.string{color:var(--string)}.number{color:var(--number)}.property{color:var(--property)}.parameter{color:var(--parameter)}.tag{color:var(--tag)}.attribute{color:var(--attribute)}.regex{color:var(--regex)}.operator{color:var(--operator)}.comment{color:var(--comment)}.punctuation{color:var(--punctuation)}.fg{color:var(--fg)}
.panel{grid-column:3;background:var(--bgPanel);border-top:1px solid var(--border);padding:8px 16px;font-size:13px}
.panel h2{font-size:11px;letter-spacing:.06em;text-transform:uppercase;color:var(--fg);margin:0 0 6px;font-weight:600}
.panel p{margin:2px 0;color:var(--fgMuted)}
.panel b{font-weight:600;margin-right:8px}
.e{color:var(--error)}.w{color:var(--warning)}.i{color:var(--info)}
.status{grid-column:1/4;background:var(--bgActivity);border-top:1px solid var(--border);color:var(--fgMuted);font-size:12px;padding:3px 12px;display:flex;gap:18px}
.status .acc{background:var(--accent);color:var(--accentFg);padding:0 8px;margin-left:-12px}
</style>
</head>
<body>
<svg width="0" height="0" style="position:absolute">${filters}</svg>
<div class="controls" id="variants"></div>
<div class="controls" id="visions"></div>
<div id="stage">
<div class="win" data-variant="dark">
  <nav class="act"><i class="on"></i><i></i><i></i><i></i></nav>
  <aside class="side">
    <h2>Explorer</h2>
    <div class="plain sel"><span>user.ts</span></div>
    <div class="added"><span>invoice.py</span><span>A</span></div>
    <div class="modified"><span>OrderController.php</span><span>M</span></div>
    <div class="deleted"><span>legacy.js</span><span>D</span></div>
    <div class="conflict"><span>routes.php</span><span>!</span></div>
    <div class="plain"><span>button.html</span></div>
    <div class="ignored"><span>node_modules</span></div>
  </aside>
  <div class="tabs">${tabs}</div>
  <div class="editor">${panes}</div>
  <div class="panel">
    <h2>Problems</h2>
    <p><b class="e">Error</b>Property 'value' does not exist on type 'Entry'. ts(2339)</p>
    <p><b class="w">Warning</b>'isSlug' is declared but never used.</p>
    <p><b class="i">Info</b>File is a CommonJS module; it may be converted to an ES module.</p>
  </div>
  <footer class="status"><span class="acc">main</span><span>Ln 8, Col 12</span><span>UTF-8</span><span>TypeScript</span></footer>
</div>
</div>
<script>
const variants = ${JSON.stringify(Object.values(palette.variants).map((v) => [v.id, v.label]))};
const visions = [['normal','Normal vision'],['protan','Protanopia'],['deutan','Deuteranopia'],['tritan','Tritanopia']];
const q = new URLSearchParams(location.search);
const state = { variant: q.get('variant') || 'dark', vision: q.get('vision') || 'normal' };
const win = document.querySelector('.win');
const stage = document.getElementById('stage');
function apply() {
  win.dataset.variant = state.variant;
  stage.style.filter = state.vision === 'normal' ? '' : 'url(#' + state.vision + ')';
  document.querySelectorAll('[data-key]').forEach((b) => b.setAttribute('aria-pressed', String(state[b.dataset.key] === b.dataset.value)));
}
function buttons(el, key, list) {
  for (const [value, label] of list) {
    const b = document.createElement('button');
    b.textContent = label; b.dataset.key = key; b.dataset.value = value;
    b.addEventListener('click', () => { state[key] = value; apply(); });
    el.appendChild(b);
  }
}
buttons(document.getElementById('variants'), 'variant', variants);
buttons(document.getElementById('visions'), 'vision', visions);
document.querySelectorAll('.tab').forEach((t) => t.addEventListener('click', () => {
  document.querySelectorAll('.tab').forEach((x) => x.classList.toggle('on', x === t));
  document.querySelectorAll('.pane').forEach((p) => { p.hidden = p.dataset.pane !== t.dataset.file; });
}));
apply();
</script>
</body>
</html>
`;

mkdirSync(join(ROOT, 'preview'), { recursive: true });
writeFileSync(join(ROOT, 'preview', 'index.html'), html);
console.log('preview/index.html written');
