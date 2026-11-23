import gzip, io, json, os, posixpath, sys, urllib.request, zipfile

top = json.load(open(sys.argv[1], encoding='utf-8'))
vsix_root, out_root = sys.argv[2], sys.argv[3]

def fetch(url):
    req = urllib.request.Request(url, headers={'Accept-Encoding': 'gzip', 'User-Agent': 'theme-contrast-study'})
    with urllib.request.urlopen(req, timeout=120) as r:
        data = r.read()
        if r.headers.get('Content-Encoding') == 'gzip' or data[:2] == b'\x1f\x8b':
            data = gzip.decompress(data)
    return data

for row in top:
    ext_id = row['id']
    vdir = os.path.join(vsix_root, ext_id)
    os.makedirs(vdir, exist_ok=True)
    vpath = os.path.join(vdir, 'package.vsix')
    if not os.path.exists(vpath):
        with open(vpath, 'wb') as f:
            f.write(fetch(row['vsixUrl']))
    z = zipfile.ZipFile(vpath)
    names = set(z.namelist())
    pkg = json.loads(z.read('extension/package.json').decode('utf-8-sig'))
    odir = os.path.join(out_root, ext_id)
    os.makedirs(odir, exist_ok=True)
    pending = [posixpath.normpath(posixpath.join('extension', t['path'])) for t in pkg.get('contributes', {}).get('themes', [])]
    seen = set()
    while pending:
        p = pending.pop()
        if p in seen or p not in names or not p.endswith('.json'):
            continue
        seen.add(p)
        raw = z.read(p)
        rel = p[len('extension/'):]
        dest = os.path.join(odir, *rel.split('/'))
        os.makedirs(os.path.dirname(dest), exist_ok=True)
        open(dest, 'wb').write(raw)
        text = raw.decode('utf-8-sig', errors='replace')
        if '"include"' in text:
            import re
            for inc in re.findall(r'"include"\s*:\s*"([^"]+)"', text):
                pending.append(posixpath.normpath(posixpath.join(posixpath.dirname(p), inc)))
    json.dump({'id': ext_id, 'version': pkg.get('version'), 'themes': pkg.get('contributes', {}).get('themes', [])}, open(os.path.join(odir, '_manifest.json'), 'w', encoding='utf-8'), indent=1)
    print(f"{ext_id:45} {os.path.getsize(vpath)/1024:8.0f} KB  {len(seen)} theme files")
