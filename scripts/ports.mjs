import { readFileSync, writeFileSync, mkdirSync, copyFileSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT, loadPalette } from './palette.mjs';
import { hexToRgb, flatten, withAlpha, wcag } from './color.mjs';

const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'));
const palette = loadPalette();
const VARIANTS = ['dark', 'soft', 'light'];
const FILES = { dark: 'clearsight', soft: 'clearsight-soft', light: 'clearsight-light' };

const loadTheme = (id) => JSON.parse(readFileSync(join(ROOT, 'themes', `${FILES[id]}-color-theme.json`), 'utf8'));
const write = (path, text) => {
  mkdirSync(join(ROOT, path, '..'), { recursive: true });
  writeFileSync(join(ROOT, path), text);
};

const ANSI = ['Black', 'Red', 'Green', 'Yellow', 'Blue', 'Magenta', 'Cyan', 'White'];

function terminal(id) {
  const c = loadTheme(id).colors;
  const bg = c['terminal.background'];
  const fg = c['terminal.foreground'];
  const normal = ANSI.map((n) => c[`terminal.ansi${n}`]);
  const bright = ANSI.map((n) => c[`terminal.ansiBright${n}`]);
  return {
    name: palette.variants[id].label,
    bg,
    fg,
    cursor: c['terminalCursor.foreground'],
    cursorText: bg,
    selection: flatten(c['terminal.selectionBackground'], bg),
    selectionText: fg,
    normal,
    bright,
  };
}

function itermcolors(t) {
  const entry = (key, hex) => {
    const [r, g, b] = hexToRgb(hex);
    return `\t<key>${key}</key>\n\t<dict>\n\t\t<key>Alpha Component</key>\n\t\t<real>1</real>\n\t\t<key>Blue Component</key>\n\t\t<real>${b.toFixed(6)}</real>\n\t\t<key>Color Space</key>\n\t\t<string>sRGB</string>\n\t\t<key>Green Component</key>\n\t\t<real>${g.toFixed(6)}</real>\n\t\t<key>Red Component</key>\n\t\t<real>${r.toFixed(6)}</real>\n\t</dict>\n`;
  };
  const items = [
    ...[...t.normal, ...t.bright].map((hex, i) => [`Ansi ${i} Color`, hex]),
    ['Background Color', t.bg],
    ['Bold Color', t.fg],
    ['Cursor Color', t.cursor],
    ['Cursor Text Color', t.cursorText],
    ['Foreground Color', t.fg],
    ['Link Color', t.bright[4]],
    ['Selected Text Color', t.selectionText],
    ['Selection Color', t.selection],
  ].sort((a, b) => a[0].localeCompare(b[0], 'en', { numeric: true }));
  return `<?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">\n<plist version="1.0">\n<dict>\n${items.map(([k, v]) => entry(k, v)).join('')}</dict>\n</plist>\n`;
}

function windowsTerminal(t) {
  const names = ['black', 'red', 'green', 'yellow', 'blue', 'purple', 'cyan', 'white'];
  const scheme = { name: t.name, background: t.bg, foreground: t.fg, cursorColor: t.cursor, selectionBackground: t.selection };
  names.forEach((n, i) => { scheme[n] = t.normal[i]; });
  names.forEach((n, i) => { scheme[`bright${n[0].toUpperCase()}${n.slice(1)}`] = t.bright[i]; });
  return scheme;
}

const ghostty = (t) => [
  `background = ${t.bg}`,
  `foreground = ${t.fg}`,
  `cursor-color = ${t.cursor}`,
  `cursor-text = ${t.cursorText}`,
  `selection-background = ${t.selection}`,
  `selection-foreground = ${t.selectionText}`,
  ...[...t.normal, ...t.bright].map((hex, i) => `palette = ${i}=${hex}`),
].join('\n') + '\n';

const alacritty = (t) => {
  const block = (list) => ANSI.map((n, i) => `${n.toLowerCase()} = "${list[i]}"`).join('\n');
  return `[colors.primary]\nbackground = "${t.bg}"\nforeground = "${t.fg}"\n\n[colors.cursor]\ncursor = "${t.cursor}"\ntext = "${t.cursorText}"\n\n[colors.selection]\nbackground = "${t.selection}"\ntext = "${t.selectionText}"\n\n[colors.normal]\n${block(t.normal)}\n\n[colors.bright]\n${block(t.bright)}\n`;
};

const kitty = (t) => [
  `background ${t.bg}`,
  `foreground ${t.fg}`,
  `cursor ${t.cursor}`,
  `cursor_text_color ${t.cursorText}`,
  `selection_background ${t.selection}`,
  `selection_foreground ${t.selectionText}`,
  `url_color ${t.bright[4]}`,
  ...[...t.normal, ...t.bright].map((hex, i) => `color${i} ${hex}`),
].join('\n') + '\n';

const wezterm = (t) => {
  const list = (l) => `[${l.map((x) => `"${x}"`).join(', ')}]`;
  return `[colors]\nbackground = "${t.bg}"\nforeground = "${t.fg}"\ncursor_bg = "${t.cursor}"\ncursor_border = "${t.cursor}"\ncursor_fg = "${t.cursorText}"\nselection_bg = "${t.selection}"\nselection_fg = "${t.selectionText}"\nansi = ${list(t.normal)}\nbrights = ${list(t.bright)}\n\n[metadata]\nname = "${t.name}"\n`;
};

function zedTheme(id, italic) {
  const v = palette.variants[id];
  const r = v.colors;
  const c = loadTheme(id).colors;
  const transparent = '#00000000';
  const status = (hex) => ({ base: hex, bg: withAlpha(hex, 0.1), border: withAlpha(hex, 0.5) });
  const style = {
    'background.appearance': 'opaque',
    background: c['titleBar.activeBackground'],
    border: r.border,
    'border.variant': r.border,
    'border.focused': c.focusBorder,
    'border.selected': r.accent,
    'border.transparent': transparent,
    'border.disabled': r.border,
    'elevated_surface.background': c['editorWidget.background'],
    'surface.background': c['sideBar.background'],
    'element.background': c['editorWidget.background'],
    'element.hover': c['list.hoverBackground'],
    'element.active': c['list.activeSelectionBackground'],
    'element.selected': c['list.activeSelectionBackground'],
    'element.disabled': c['editorWidget.background'],
    'drop_target.background': c['list.dropBackground'],
    'ghost_element.background': transparent,
    'ghost_element.hover': c['list.hoverBackground'],
    'ghost_element.active': c['list.activeSelectionBackground'],
    'ghost_element.selected': c['list.inactiveSelectionBackground'],
    'ghost_element.disabled': transparent,
    text: r.fg,
    'text.muted': r.fgMuted,
    'text.placeholder': r.fgSubtle,
    'text.disabled': r.fgSubtle,
    'text.accent': c['textLink.foreground'],
    icon: r.fg,
    'icon.muted': r.fgMuted,
    'icon.disabled': r.fgSubtle,
    'icon.placeholder': r.fgSubtle,
    'icon.accent': c['textLink.foreground'],
    'status_bar.background': c['statusBar.background'],
    'title_bar.background': c['titleBar.activeBackground'],
    'title_bar.inactive_background': c['titleBar.inactiveBackground'],
    'toolbar.background': c['editor.background'],
    'tab_bar.background': c['editorGroupHeader.tabsBackground'],
    'tab.inactive_background': c['tab.inactiveBackground'],
    'tab.active_background': c['tab.activeBackground'],
    'search.match_background': c['editor.findMatchHighlightBackground'],
    'panel.background': c['sideBar.background'],
    'panel.focused_border': c.focusBorder,
    'panel.indent_guide': c['editorIndentGuide.background1'],
    'panel.indent_guide_active': c['editorIndentGuide.activeBackground1'],
    'panel.indent_guide_hover': c['editorIndentGuide.activeBackground1'],
    'pane.focused_border': c.focusBorder,
    'pane_group.border': r.border,
    'scrollbar.thumb.background': c['scrollbarSlider.background'],
    'scrollbar.thumb.hover_background': c['scrollbarSlider.hoverBackground'],
    'scrollbar.thumb.border': transparent,
    'scrollbar.track.background': transparent,
    'scrollbar.track.border': transparent,
    'editor.foreground': r.fg,
    'editor.background': c['editor.background'],
    'editor.gutter.background': c['editor.background'],
    'editor.subheader.background': c['editorWidget.background'],
    'editor.active_line.background': c['editor.lineHighlightBackground'],
    'editor.highlighted_line.background': c['editor.lineHighlightBackground'],
    'editor.line_number': c['editorLineNumber.foreground'],
    'editor.active_line_number': c['editorLineNumber.activeForeground'],
    'editor.invisible': c['editorWhitespace.foreground'],
    'editor.wrap_guide': c['editorRuler.foreground'],
    'editor.active_wrap_guide': c['editorIndentGuide.activeBackground1'],
    'editor.indent_guide': c['editorIndentGuide.background1'],
    'editor.indent_guide_active': c['editorIndentGuide.activeBackground1'],
    'editor.document_highlight.read_background': c['editor.wordHighlightBackground'],
    'editor.document_highlight.write_background': c['editor.wordHighlightStrongBackground'],
    'editor.document_highlight.bracket_background': c['editor.wordHighlightBackground'],
    'link_text.hover': c['textLink.activeForeground'],
    'terminal.background': c['terminal.background'],
    'terminal.foreground': c['terminal.foreground'],
    'terminal.bright_foreground': c['terminal.ansiBrightWhite'],
    'terminal.dim_foreground': c['terminal.ansiWhite'],
    'terminal.ansi.background': c['terminal.background'],
  };
  for (const n of ANSI) {
    const key = n.toLowerCase();
    style[`terminal.ansi.${key}`] = c[`terminal.ansi${n}`];
    style[`terminal.ansi.bright_${key}`] = c[`terminal.ansiBright${n}`];
  }
  const states = {
    error: r.error, warning: r.warning, info: r.info, hint: r.hint, success: r.added,
    created: r.added, modified: r.modified, deleted: r.deleted, conflict: r.conflict, renamed: r.info,
    ignored: r.ignored, hidden: r.fgSubtle, predictive: r.fgSubtle, unreachable: r.fgSubtle,
  };
  for (const [k, hex] of Object.entries(states)) {
    const s = status(hex);
    style[k] = s.base;
    style[`${k}.background`] = s.bg;
    style[`${k}.border`] = s.border;
  }
  style.accents = [1, 2, 3, 4, 5, 6].map((i) => c[`editorBracketHighlight.foreground${i}`]).filter(Boolean);
  style.players = [r.accent, r.function, r.number, r.tag, r.regex, r.keyword, r.type, r.attribute].map((hex, i) => ({
    cursor: i === 0 ? c['editorCursor.foreground'] : hex,
    background: hex,
    selection: i === 0 ? c['editor.selectionBackground'] : withAlpha(hex, 0.24),
  }));
  const it = italic ? 'italic' : null;
  const s = (color, font_style = null, font_weight = null) => ({ color, font_style, font_weight });
  style.syntax = {
    attribute: s(r.attribute),
    boolean: s(r.number),
    comment: s(r.comment, it),
    'comment.doc': s(r.comment, it),
    constant: s(r.number),
    constructor: s(r.type),
    embedded: s(r.fg),
    emphasis: s(r.fg, 'italic'),
    'emphasis.strong': s(r.fg, null, 700),
    enum: s(r.type),
    function: s(r.function),
    hint: s(r.hint),
    keyword: s(r.keyword),
    label: s(r.tag),
    link_text: s(r.function),
    link_uri: s(r.string),
    number: s(r.number),
    operator: s(r.operator),
    predictive: s(r.fgSubtle, it),
    preproc: s(r.keyword),
    primary: s(r.fg),
    property: s(r.property),
    punctuation: s(r.punctuation),
    'punctuation.bracket': s(r.punctuation),
    'punctuation.delimiter': s(r.punctuation),
    'punctuation.list_marker': s(r.keyword),
    'punctuation.special': s(r.keyword),
    string: s(r.string),
    'string.escape': s(r.regex),
    'string.regex': s(r.regex),
    'string.special': s(r.regex),
    'string.special.symbol': s(r.number),
    tag: s(r.tag),
    'text.literal': s(r.string),
    title: s(r.function, null, 700),
    type: s(r.type),
    variable: s(r.fg),
    'variable.special': s(r.keyword, it),
    variant: s(r.type),
  };
  return { name: italic ? v.label : `${v.label} No Italics`, appearance: v.type, style };
}

const report = [];
const terms = {};
for (const id of VARIANTS) {
  const t = terminal(id);
  terms[id] = t;
  write(`extras/iterm2/${t.name}.itermcolors`, itermcolors(t));
  write(`extras/ghostty/${t.name}`, ghostty(t));
  write(`extras/alacritty/${FILES[id]}.toml`, alacritty(t));
  write(`extras/kitty/${FILES[id]}.conf`, kitty(t));
  write(`extras/wezterm/${t.name}.toml`, wezterm(t));
  const checks = [...t.normal.slice(1, 7), ...t.bright.slice(1, 7), t.fg].map((hex) => wcag(hex, t.bg));
  report.push(`${t.name}: terminal colors min ${Math.min(...checks).toFixed(2)}:1 on ${t.bg}`);
}
write('extras/windows-terminal/clearsight.json', JSON.stringify(VARIANTS.map((id) => windowsTerminal(terms[id])), null, 2) + '\n');

const family = {
  $schema: 'https://zed.dev/schema/themes/v0.2.0.json',
  name: 'Clearsight',
  author: 'TMS Outsource',
  themes: VARIANTS.flatMap((id) => [zedTheme(id, true), zedTheme(id, false)]),
};
write('zed/themes/clearsight.json', JSON.stringify(family, null, 2) + '\n');
write('zed/extension.toml', `id = "clearsight-theme"
name = "Clearsight"
version = "${pkg.version}"
schema_version = 1
authors = ["TMS Outsource <hello@tms-outsource.com>"]
description = "Readable by default: every syntax color, comments included, passes WCAG AA contrast. Dark, Soft and Light variants, safe for colorblind developers."
repository = "https://github.com/tms-outsource/clearsight-vscode"
`);
copyFileSync(join(ROOT, 'LICENSE'), join(ROOT, 'zed', 'LICENSE'));

console.log(report.join('\n'));
console.log(`ports written: extras/ (iTerm2, Ghostty, Windows Terminal, Alacritty, kitty, WezTerm), zed/ (${family.themes.length} themes)`);
