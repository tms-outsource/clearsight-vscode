import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const all = JSON.parse(readFileSync(join(HERE, 'data', 'results.json'), 'utf8'));
const ok = all.filter((r) => !r.error);
const others = ok.filter((r) => r.extId !== 'tms-outsource.clearsight-theme');
const flag = others.filter((r) => r.flagship).sort((a, b) => b.installs - a.installs);
const clear = ok.find((r) => r.extId === 'tms-outsource.clearsight-theme' && r.flagship);

const median = (xs) => { const s = [...xs].sort((a, b) => a - b); const m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
const pct = (n, d) => `${Math.round((n / d) * 100)}%`;
const fmtM = (n) => (n >= 1e6 ? (n / 1e6).toFixed(1) + 'M' : Math.round(n / 1e3) + 'K');
const yes = (b) => (b ? 'yes' : 'no');

const fCommentFail = flag.filter((r) => r.commentContrast < 4.5);
const fAnyFail = flag.filter((r) => r.failingRoles.length);
const fCvd = flag.filter((r) => r.lostPairCount > 0);
const fHarsh = flag.filter((r) => r.fgContrast > 15);
const vCommentFail = others.filter((r) => r.commentContrast < 4.5);
const vAnyFail = others.filter((r) => r.failingRoles.length);
const vCvd = others.filter((r) => r.lostPairCount > 0);
const installsTotal = flag.reduce((s, r) => s + r.installs, 0);
const installsCommentFail = fCommentFail.reduce((s, r) => s + r.installs, 0);
const worst = [...flag].sort((a, b) => a.commentContrast - b.commentContrast)[0];

const lines = [];
const L = (s = '') => lines.push(s);
L('# Contrast study: the 20 most installed VS Code color themes');
L();
L(`Data collected on ${new Date().toISOString().slice(0, 10)} from the Visual Studio Marketplace.`);
L();
L('## Headline numbers');
L();
L(`- **${fCommentFail.length} of 20** default variants show code comments below the WCAG AA minimum for text (4.5:1). Together these themes account for **${fmtM(installsCommentFail)} of ${fmtM(installsTotal)}** installs (${pct(installsCommentFail, installsTotal)}).`);
L(`- The median comment contrast across the 20 default variants is **${median(flag.map((r) => r.commentContrast)).toFixed(2)}:1**. The lowest is ${worst.label} at **${worst.commentContrast}:1**.`);
L(`- **${fAnyFail.length} of 20** default variants have at least one syntax role (comments, keywords, strings, functions and so on) below 4.5:1.`);
L(`- **${fCvd.length} of 20** default variants have at least one pair of syntax colors that look clearly different with normal vision but become hard to tell apart under a simulated color vision deficiency.`);
L(`- Across all **${others.length}** variants these 20 extensions ship, **${vCommentFail.length}** (${pct(vCommentFail.length, others.length)}) have comments below 4.5:1, **${vAnyFail.length}** (${pct(vAnyFail.length, others.length)}) have at least one role below 4.5:1, and **${vCvd.length}** (${pct(vCvd.length, others.length)}) lose at least one color distinction under a colorblindness simulation.`);
L(`- ${fHarsh.length ? `${fHarsh.map((r) => `${r.label} (${r.fgContrast.toFixed(2)}:1)`).join(', ')} has the highest editor-text contrast in the group, above 15:1.` : 'No default variant uses editor text above 15:1.'}`);
L();
L('## Default variant of each theme');
L();
L('| # | Theme | Installs | Text contrast | Comment contrast | Comments pass AA | Roles below AA | Code below AA | Colorblind collisions |');
L('|---|---|---|---|---|---|---|---|---|');
flag.forEach((r, i) => {
  L(`| ${i + 1} | ${r.extName} (${r.label}) | ${fmtM(r.installs)} | ${r.fgContrast.toFixed(2)}:1 | ${r.commentContrast.toFixed(2)}:1 | ${yes(r.commentContrast >= 4.5)} | ${r.failingRoles.length ? r.failingRoles.join(', ') : 'none'} | ${(r.lowContrastShare * 100).toFixed(1)}% | ${r.lostPairCount ? [...new Set(r.lostPairs.map((l) => l.pair))].join(', ') : 'none'} |`);
});
L();
L('## All variants, per extension');
L();
L('| Theme | Variants | Comments pass AA | All roles pass AA | No colorblind collisions |');
L('|---|---|---|---|---|');
for (const f of flag) {
  const vs = others.filter((r) => r.extId === f.extId);
  L(`| ${f.extName} | ${vs.length} | ${vs.filter((r) => r.commentContrast >= 4.5).length} | ${vs.filter((r) => !r.failingRoles.length).length} | ${vs.filter((r) => !r.lostPairCount).length} |`);
}
L();
if (clear) {
  L('## Clearsight, for reference');
  L();
  L(`Clearsight is the theme published by the authors of this study and was designed against these exact checks, so it is listed separately rather than ranked. Default variant: text ${clear.fgContrast.toFixed(2)}:1, comments ${clear.commentContrast.toFixed(2)}:1, roles below AA: ${clear.failingRoles.length ? clear.failingRoles.join(', ') : 'none'}, code below AA: ${(clear.lowContrastShare * 100).toFixed(1)}%, colorblind collisions: ${clear.lostPairCount || 'none'}.`);
  L();
}
L('## Method');
L();
L('- **Selection.** The 20 most installed extensions in the Marketplace "Themes" category whose main purpose is a color theme. Excluded: icon themes, C/C++ Themes (installed automatically as a dependency of the C/C++ extension), PowerShell (a language extension that bundles a theme), non-theme tools and extensions their authors mark as deprecated.');
L('- **Default variant.** For extensions that ship several themes, the headline table uses the variant named after the extension or its best-known dark variant (for example GitHub Dark Default, Catppuccin Mocha). Every variant is still analyzed in the second table.');
L('- **Code.** The same six files (TypeScript, Python, PHP, HTML, CSS, Go; about 150 lines) were highlighted with each theme using Shiki, which runs the same TextMate grammars and theme-matching rules as VS Code. Semantic highlighting from language servers is not applied, so some identifiers may be colored differently in a live editor. Comments, strings, numbers and keywords are not affected by semantic highlighting.');
L('- **Roles.** Each highlighted token was assigned a role (comment, keyword, function, type, string, number, property, parameter, tag, attribute, regex) from its innermost TextMate scope. The color covering the most characters in that role is taken as the role color.');
L('- **Contrast.** WCAG 2.x contrast ratio against the editor background. 4.5:1 is the AA minimum for normal-size text. "Code below AA" is the share of non-whitespace characters drawn in a color below 4.5:1.');
L('- **Colorblind collisions.** Role colors were passed through the Machado, Oliveira and Fernandes (2009) simulation matrices for protanopia, deuteranopia and tritanopia (full severity). A collision is a pair of roles whose colors differ by at least 0.07 in the OKLab color space with normal vision but by less than 0.07 in a simulation. Pairs a theme colors the same on purpose are not counted. The 0.07 threshold is the one used to design Clearsight; it is deliberately strict, so the collision counts show where distinctions weaken, not where colors become identical.');
L('- **Limits.** Contrast ratios do not capture font weight, font size, anti-aliasing, monitor calibration or personal preference. Low-contrast comments are often a deliberate design choice. The study measures readability against a published standard, not overall quality.');
L();
L('Raw data: `study/data/results.json`. Scripts: `study/fetch-top.mjs`, `study/download.py`, `study/analyze.mjs`, `study/summarize.mjs`.');

writeFileSync(join(HERE, 'REPORT.md'), lines.join('\n') + '\n');
console.log(lines.slice(0, 14).join('\n'));
