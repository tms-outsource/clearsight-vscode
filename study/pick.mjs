import { readFileSync, writeFileSync } from 'node:fs';
const all = JSON.parse(readFileSync(new URL('./data/marketplace-themes.json', import.meta.url)));
const sel = JSON.parse(readFileSync(new URL('./selection.json', import.meta.url)));
const top = all.filter((r) => r.colorThemes?.length && !sel.excluded.includes(r.id) && !/deprecated/i.test(r.name)).slice(0, 20);
writeFileSync(new URL('./data/top20.json', import.meta.url), JSON.stringify(top, null, 2));
top.forEach((r, i) => console.log(String(i + 1).padStart(2), String(r.installs).padStart(9), r.id, '|', r.colorThemes.length, 'themes |', r.colorThemes.map((t) => t.label).slice(0, 4).join(', ')));
