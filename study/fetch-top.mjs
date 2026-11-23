import { writeFileSync } from 'node:fs';

const API = 'https://marketplace.visualstudio.com/_apis/public/gallery/extensionquery';
const HEADERS = { 'Content-Type': 'application/json', Accept: 'application/json;api-version=3.0-preview.1' };
const FLAGS = 0x1 | 0x2 | 0x4 | 0x100 | 0x200;

async function page(n) {
  const body = {
    filters: [{
      criteria: [{ filterType: 8, value: 'Microsoft.VisualStudio.Code' }, { filterType: 5, value: 'Themes' }, { filterType: 12, value: '4096' }],
      pageNumber: n, pageSize: 100, sortBy: 4, sortOrder: 0,
    }],
    flags: FLAGS,
  };
  const r = await fetch(API, { method: 'POST', headers: HEADERS, body: JSON.stringify(body) });
  return (await r.json()).results[0].extensions;
}

const stat = (e, name) => e.statistics?.find((s) => s.statisticName === name)?.value ?? 0;
const rows = [];
for (let n = 1; n <= 2; n++) {
  for (const e of await page(n)) {
    const v = e.versions?.[0];
    const manifestUrl = v?.files?.find((f) => f.assetType === 'Microsoft.VisualStudio.Code.Manifest')?.source;
    rows.push({
      id: `${e.publisher.publisherName}.${e.extensionName}`,
      name: e.displayName,
      publisher: e.publisher.displayName,
      installs: Math.round(stat(e, 'install')),
      rating: +stat(e, 'averagerating').toFixed(2),
      version: v?.version,
      lastUpdated: e.lastUpdated,
      manifestUrl,
      vsixUrl: v?.files?.find((f) => f.assetType === 'Microsoft.VisualStudio.Services.VSIXPackage')?.source,
      tags: e.tags ?? [],
    });
  }
}

for (const row of rows) {
  try {
    const m = await (await fetch(row.manifestUrl)).json();
    const c = m.contributes ?? {};
    row.colorThemes = (c.themes ?? []).map((t) => ({ label: t.label ?? t.id, uiTheme: t.uiTheme, path: t.path }));
    row.iconThemes = (c.iconThemes ?? []).length;
    row.extensionDependencies = m.extensionDependencies ?? [];
  } catch (err) {
    row.error = String(err);
  }
}

rows.sort((a, b) => b.installs - a.installs);
writeFileSync(new URL('./data/marketplace-themes.json', import.meta.url), JSON.stringify(rows, null, 2));
for (const r of rows.slice(0, 40)) console.log(String(r.installs).padStart(9), r.id.padEnd(55), (r.colorThemes?.length ?? '?') + ' color', r.iconThemes ? r.iconThemes + ' icon' : '', r.name);
