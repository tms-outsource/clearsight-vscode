# Contrast study: the 20 most installed VS Code color themes

Data collected on 2026-11-23 from the Visual Studio Marketplace.

## Headline numbers

- **16 of 20** default variants show code comments below the WCAG AA minimum for text (4.5:1). Together these themes account for **64.3M of 92.9M** installs (69%).
- The median comment contrast across the 20 default variants is **3.67:1**. The lowest is Atom One Dark at **2.32:1**.
- **17 of 20** default variants have at least one syntax role (comments, keywords, strings, functions and so on) below 4.5:1.
- **18 of 20** default variants have at least one pair of syntax colors that look clearly different with normal vision but become hard to tell apart under a simulated color vision deficiency.
- Across all **141** variants these 20 extensions ship, **120** (85%) have comments below 4.5:1, **125** (89%) have at least one role below 4.5:1, and **123** (87%) lose at least one color distinction under a colorblindness simulation.
- GitHub Dark Default (16.02:1) has the highest editor-text contrast in the group, above 15:1.

## Default variant of each theme

| # | Theme | Installs | Text contrast | Comment contrast | Comments pass AA | Roles below AA | Code below AA | Colorblind collisions |
|---|---|---|---|---|---|---|---|---|
| 1 | GitHub Theme (GitHub Dark Default) | 20.7M | 16.02:1 | 6.15:1 | yes | none | 0.0% | function/type, function/string |
| 2 | One Dark Pro (One Dark Pro) | 12.9M | 6.57:1 | 3.73:1 | no | comment, parameter, tag | 20.5% | keyword/function, type/string, string/number, keyword/number, tag/attribute |
| 3 | Dracula Theme Official (Dracula Theme) | 11.2M | 13.36:1 | 3.03:1 | no | comment | 8.9% | function/type, function/string |
| 4 | Atom One Dark Theme (Atom One Dark) | 7.4M | 6.57:1 | 2.32:1 | no | comment, tag | 18.2% | keyword/function, type/string, string/number, keyword/number, tag/attribute |
| 5 | Ayu (Ayu Dark) | 4.3M | 9.81:1 | 3.15:1 | no | comment | 8.6% | keyword/function, keyword/string, function/string, type/number |
| 6 | Monokai Pro (Monokai Pro) | 4.2M | 13.79:1 | 2.88:1 | no | comment | 9.2% | function/string |
| 7 | Winter is Coming Theme (Winter is Coming (Dark Blue)) | 3.8M | 12.33:1 | 6.44:1 | yes | none | 0.3% | keyword/function, keyword/type, string/number, type/number |
| 8 | Night Owl (Night Owl) | 3.6M | 13.54:1 | 3.87:1 | no | comment | 8.0% | keyword/function, type/string, tag/attribute |
| 9 | Tokyo Night (Tokyo Night) | 3.0M | 8.10:1 | 2.50:1 | no | comment | 11.2% | keyword/function, keyword/type, function/type, string/number |
| 10 | One Monokai Theme (One Monokai) | 3.0M | 9.44:1 | 2.76:1 | no | keyword, comment, tag | 25.4% | function/string, type/number |
| 11 | Palenight Theme (Palenight Theme) | 2.7M | 8.02:1 | 2.84:1 | no | comment, parameter, tag | 12.7% | keyword/function, type/string |
| 12 | SynthWave '84 (SynthWave '84) | 2.6M | 10.31:1 | 4.66:1 | yes | type | 12.4% | string/number, type/number |
| 13 | Shades of Purple (Shades of Purple) | 2.4M | 13.22:1 | 3.85:1 | no | comment | 7.2% | none |
| 14 | Cobalt2 Theme Official (Cobalt2) | 1.9M | 12.75:1 | 3.62:1 | no | number, comment, regex | 10.1% | none |
| 15 | Andromeda (Andromeda) | 1.7M | 9.84:1 | 4.29:1 | no | keyword, comment, property, tag | 30.3% | function/string, type/string |
| 16 | Theme (Theme) | 1.6M | 6.57:1 | 3.73:1 | no | keyword, comment, parameter, tag | 35.7% | keyword/function, type/string, string/number, tag/attribute |
| 17 | Bearded Theme (Bearded Theme Monokai Metallian) | 1.5M | 10.75:1 | 2.39:1 | no | comment | 17.9% | keyword/string, string/number |
| 18 | Catppuccin for VSCode (Catppuccin Mocha) | 1.5M | 11.34:1 | 5.81:1 | yes | none | 0.0% | keyword/function, type/string, string/number |
| 19 | Atom One Light Theme (Atom One Light) | 1.5M | 10.86:1 | 2.47:1 | no | string, function, type, comment, tag | 44.8% | function/string, type/string, tag/attribute |
| 20 | Noctis (Noctis) | 1.4M | 9.38:1 | 3.97:1 | no | number, comment | 11.5% | keyword/function, keyword/type, tag/attribute |

## All variants, per extension

| Theme | Variants | Comments pass AA | All roles pass AA | No colorblind collisions |
|---|---|---|---|---|
| GitHub Theme | 9 | 7 | 7 | 1 |
| One Dark Pro | 5 | 1 | 1 | 0 |
| Dracula Theme Official | 2 | 0 | 0 | 0 |
| Atom One Dark Theme | 1 | 0 | 0 | 0 |
| Ayu | 6 | 0 | 0 | 0 |
| Monokai Pro | 8 | 0 | 0 | 0 |
| Winter is Coming Theme | 6 | 6 | 4 | 0 |
| Night Owl | 4 | 0 | 0 | 0 |
| Tokyo Night | 3 | 0 | 0 | 0 |
| One Monokai Theme | 1 | 0 | 0 | 0 |
| Palenight Theme | 4 | 0 | 0 | 0 |
| SynthWave '84 | 1 | 1 | 0 | 0 |
| Shades of Purple | 2 | 1 | 1 | 2 |
| Cobalt2 Theme Official | 1 | 0 | 0 | 1 |
| Andromeda | 5 | 1 | 0 | 0 |
| Theme | 4 | 0 | 0 | 0 |
| Bearded Theme | 63 | 0 | 0 | 14 |
| Catppuccin for VSCode | 4 | 3 | 3 | 0 |
| Atom One Light Theme | 1 | 0 | 0 | 0 |
| Noctis | 11 | 1 | 0 | 0 |

## Clearsight, for reference

Clearsight is the theme published by the authors of this study and was designed against these exact checks, so it is listed separately rather than ranked. Default variant: text 13.16:1, comments 6.59:1, roles below AA: none, code below AA: 0.0%, colorblind collisions: none.

## Method

- **Selection.** The 20 most installed extensions in the Marketplace "Themes" category whose main purpose is a color theme. Excluded: icon themes, C/C++ Themes (installed automatically as a dependency of the C/C++ extension), PowerShell (a language extension that bundles a theme), non-theme tools and extensions their authors mark as deprecated.
- **Default variant.** For extensions that ship several themes, the headline table uses the variant named after the extension or its best-known dark variant (for example GitHub Dark Default, Catppuccin Mocha). Every variant is still analyzed in the second table.
- **Code.** The same six files (TypeScript, Python, PHP, HTML, CSS, Go; about 150 lines) were highlighted with each theme using Shiki, which runs the same TextMate grammars and theme-matching rules as VS Code. Semantic highlighting from language servers is not applied, so some identifiers may be colored differently in a live editor. Comments, strings, numbers and keywords are not affected by semantic highlighting.
- **Roles.** Each highlighted token was assigned a role (comment, keyword, function, type, string, number, property, parameter, tag, attribute, regex) from its innermost TextMate scope. The color covering the most characters in that role is taken as the role color.
- **Contrast.** WCAG 2.x contrast ratio against the editor background. 4.5:1 is the AA minimum for normal-size text. "Code below AA" is the share of non-whitespace characters drawn in a color below 4.5:1.
- **Colorblind collisions.** Role colors were passed through the Machado, Oliveira and Fernandes (2009) simulation matrices for protanopia, deuteranopia and tritanopia (full severity). A collision is a pair of roles whose colors differ by at least 0.07 in the OKLab color space with normal vision but by less than 0.07 in a simulation. Pairs a theme colors the same on purpose are not counted. The 0.07 threshold is the one used to design Clearsight; it is deliberately strict, so the collision counts show where distinctions weaken, not where colors become identical.
- **Limits.** Contrast ratios do not capture font weight, font size, anti-aliasing, monitor calibration or personal preference. Low-contrast comments are often a deliberate design choice. The study measures readability against a published standard, not overall quality.

Raw data: `study/data/results.json`. Scripts: `study/fetch-top.mjs`, `study/download.py`, `study/analyze.mjs`, `study/summarize.mjs`.
