"""Download the CC0 Poly Haven assets used by the baked studio.

Run from the repository root with a normal Python 3:

    python3 scripts/room/fetch_polyhaven.py            # everything in ASSETS
    python3 scripts/room/fetch_polyhaven.py sofa_03    # just one

Files land in assets/_local/polyhaven/ (git-ignored). Existing files with a
matching size are skipped, so the script is cheap to re-run.
Credits for everything listed here are in public/journey/CREDITS.md.
"""
import json, os, sys, urllib.request

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
OUT = os.path.join(ROOT, 'assets', '_local', 'polyhaven')
UA = {'User-Agent': 'nikhilsheoran.com room build (CC0 asset fetch)'}

# id: (kind, resolution)
ASSETS = {
    # lighting sky (the window *view* is a separate backdrop image)
    'qwantani_late_afternoon_puresky': ('hdri', '2k'),
    # models (glTF + textures)
    'mid_century_lounge_chair': ('model', '2k'),
    'potted_plant_01': ('model', '2k'),
    'potted_plant_02': ('model', '2k'),
    'potted_plant_04': ('model', '1k'),
    'calathea_orbifolia_01': ('model', '1k'),
    'ceramic_vase_01': ('model', '1k'),
    'ceramic_vase_03': ('model', '1k'),
    'ceramic_vase_04': ('model', '1k'),
    # textures
    'silver_oak_veneer_01': ('texture', '2k'),
    'curly_teddy_natural': ('texture', '2k'),
    'polar_fleece': ('texture', '2k'),
}


def get(url):
    return urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=120).read()


def save(url, path, size=None):
    if os.path.exists(path) and (size is None or os.path.getsize(path) == size):
        return
    os.makedirs(os.path.dirname(path), exist_ok=True)
    data = get(url)
    with open(path + '.part', 'wb') as f:
        f.write(data)
    os.replace(path + '.part', path)
    print('  ', os.path.relpath(path, ROOT), len(data) // 1024, 'KB')


def fetch(asset_id, kind, res):
    files = json.loads(get('https://api.polyhaven.com/files/' + asset_id))
    info = json.loads(get('https://api.polyhaven.com/info/' + asset_id))
    print(asset_id, '-', info.get('name'), '-', ', '.join(info.get('authors', {})))
    if kind == 'hdri':
        f = files['hdri'][res]['hdr']
        save(f['url'], os.path.join(OUT, 'hdri', f'{asset_id}_{res}.hdr'), f['size'])
        return
    if kind == 'model':
        g = files['gltf'][res]['gltf']
        base = os.path.join(OUT, 'models', asset_id)
        save(g['url'], os.path.join(base, f'{asset_id}_{res}.gltf'), g['size'])
        for rel, f in g['include'].items():
            save(f['url'], os.path.join(base, rel), f['size'])
        return
    if kind == 'texture':
        base = os.path.join(OUT, 'textures', asset_id)
        for key in ('Diffuse', 'nor_gl', 'Rough', 'AO', 'arm', 'Displacement'):
            if key in files and res in files[key]:
                fmt = 'jpg' if 'jpg' in files[key][res] else next(iter(files[key][res]))
                f = files[key][res][fmt]
                save(f['url'], os.path.join(base, os.path.basename(f['url'])), f['size'])


if __name__ == '__main__':
    wanted = sys.argv[1:] or list(ASSETS)
    for a in wanted:
        kind, res = ASSETS.get(a, ('model', '1k'))
        fetch(a, kind, res)
