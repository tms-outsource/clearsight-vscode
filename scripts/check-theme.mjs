import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { wcag, flatten } from './color.mjs';
import { ROOT } from './palette.mjs';

const KNOWN = new Set(readFileSync(join(ROOT, 'scripts', 'vscode-color-keys.txt'), 'utf8').split(/\r?\n/).filter(Boolean));

const UI_PAIRS = [
  ['editor.foreground', 'editor.background', 7],
  ['editorLineNumber.foreground', 'editor.background', 3],
  ['editorLineNumber.activeForeground', 'editor.lineHighlightBackground', 4.5],
  ['editorGhostText.foreground', 'editor.background', 3],
  ['editorInlayHint.foreground', 'editorInlayHint.background', 4.5],
  ['editorCodeLens.foreground', 'editor.background', 4.5],
  ['textLink.foreground', 'editor.background', 4.5],
  ['sideBar.foreground', 'sideBar.background', 7],
  ['sideBarTitle.foreground', 'sideBar.background', 4.5],
  ['list.activeSelectionForeground', 'list.activeSelectionBackground', 7],
  ['list.highlightForeground', 'sideBar.background', 4.5],
  ['list.highlightForeground', 'list.activeSelectionBackground', 3],
  ['tab.activeForeground', 'tab.activeBackground', 7],
  ['tab.inactiveForeground', 'tab.inactiveBackground', 4.5],
  ['breadcrumb.foreground', 'breadcrumb.background', 4.5],
  ['statusBar.foreground', 'statusBar.background', 4.5],
  ['statusBarItem.remoteForeground', 'statusBarItem.remoteBackground', 4.5],
  ['statusBarItem.errorForeground', 'statusBarItem.errorBackground', 4.5],
  ['statusBarItem.warningForeground', 'statusBarItem.warningBackground', 4.5],
  ['titleBar.activeForeground', 'titleBar.activeBackground', 4.5],
  ['button.foreground', 'button.background', 4.5],
  ['button.foreground', 'button.hoverBackground', 4.5],
  ['badge.foreground', 'badge.background', 4.5],
  ['input.foreground', 'input.background', 7],
  ['input.placeholderForeground', 'input.background', 3],
  ['editorSuggestWidget.foreground', 'editorSuggestWidget.background', 7],
  ['editorSuggestWidget.selectedForeground', 'editorSuggestWidget.selectedBackground', 7],
  ['editorSuggestWidget.highlightForeground', 'editorSuggestWidget.background', 4.5],
  ['editorSuggestWidget.highlightForeground', 'editorSuggestWidget.selectedBackground', 4.5],
  ['menu.foreground', 'menu.background', 7],
  ['menu.selectionForeground', 'menu.selectionBackground', 7],
  ['quickInputList.focusForeground', 'quickInputList.focusBackground', 7],
  ['pickerGroup.foreground', 'quickInput.background', 4.5],
  ['panelTitle.activeForeground', 'panel.background', 7],
  ['panelTitle.inactiveForeground', 'panel.background', 4.5],
  ['peekViewResult.lineForeground', 'peekViewResult.background', 4.5],
  ['notifications.foreground', 'notifications.background', 7],
  ['notificationLink.foreground', 'notifications.background', 4.5],
  ['terminal.foreground', 'terminal.background', 7],
  ['chat.slashCommandForeground', 'chat.slashCommandBackground', 4.5],
  ['debugTokenExpression.name', 'editorHoverWidget.background', 4.5],
];

const BASE = {
  'editorInlayHint.background': 'editor.background',
  'chat.slashCommandBackground': 'chat.requestBackground',
};

let total = 0;
for (const file of readdirSync(join(ROOT, 'themes')).filter((f) => f.endsWith('.json'))) {
  const theme = JSON.parse(readFileSync(join(ROOT, 'themes', file), 'utf8'));
  const c = theme.colors;
  const failures = [];
  const bg = c['editor.background'];
  const solid = (key) => flatten(c[key], c[BASE[key] ?? 'editor.background'] ?? bg);

  for (const k of Object.keys(c)) if (!KNOWN.has(k)) failures.push(`unknown color key: ${k}`);
  for (const [k, v] of Object.entries(c)) if (!/^#[0-9a-f]{6}([0-9a-f]{2})?$/i.test(v)) failures.push(`bad value ${k}: ${v}`);

  for (const [fg, back, min] of UI_PAIRS) {
    if (!c[fg] || !c[back]) { failures.push(`missing ${!c[fg] ? fg : back}`); continue; }
    const r = wcag(flatten(c[fg], solid(back)), solid(back));
    if (r < min) failures.push(`${fg} on ${back}: ${r.toFixed(2)} < ${min}`);
  }

  for (const k of Object.keys(c).filter((x) => x.startsWith('gitDecoration.'))) {
    const min = k.includes('ignored') ? 3 : 4.5;
    for (const back of ['sideBar.background', 'list.activeSelectionBackground']) {
      const need = back === 'sideBar.background' ? min : 3;
      const r = wcag(c[k], solid(back));
      if (r < need) failures.push(`${k} on ${back}: ${r.toFixed(2)} < ${need}`);
    }
  }

  const termBg = c['terminal.background'];
  for (const k of Object.keys(c).filter((x) => x.startsWith('terminal.ansi'))) {
    if (k === 'terminal.ansiBlack' && theme.type === 'dark') continue;
    if (k === 'terminal.ansiBrightWhite' && theme.type === 'light') continue;
    const min = /BrightBlack|White/.test(k) ? 3 : 4.5;
    const r = wcag(c[k], termBg);
    if (r < min) failures.push(`${k} on terminal: ${r.toFixed(2)} < ${min}`);
  }

  const tokenFgs = new Set(theme.tokenColors.map((t) => t.settings.foreground).filter(Boolean));
  for (const v of Object.values(theme.semanticTokenColors)) {
    if (typeof v === 'string') tokenFgs.add(v);
    else if (v.foreground) tokenFgs.add(v.foreground);
  }
  const backs = [
    ['editor.background', 4.5], ['editor.lineHighlightBackground', 4.5], ['editor.selectionBackground', 3],
    ['diffEditor.insertedTextBackground', 4], ['diffEditor.removedTextBackground', 4],
    ['editor.findMatchHighlightBackground', 4], ['editor.findMatchBackground', 3], ['editor.wordHighlightBackground', 4],
    ['peekViewEditor.background', 4.5], ['notebook.cellEditorBackground', 4.5],
  ];
  for (const t of tokenFgs) {
    for (const [back, min] of backs) {
      const r = wcag(t, solid(back));
      if (r < min) failures.push(`token ${t} on ${back}: ${r.toFixed(2)} < ${min}`);
    }
  }

  total += failures.length;
  console.log(`${theme.name}: ${Object.keys(c).length} colors, ${theme.tokenColors.length} token rules, ${failures.length ? failures.length + ' failure(s)' : 'ok'}`);
  for (const f of failures) console.log(`  - ${f}`);
}
console.log(total ? `\n${total} failure(s)` : '\nAll themes pass');
process.exit(total ? 1 : 0);
