"""Bake Cycles lighting into texture atlases and export the unlit web room.

    blender -b assets/blender/studio.blend --python scripts/room/bake.py -- [options]

Options (after the "--"):
    --with-statue [PATH]  append collection "Statue" from PATH
                          (default assets/_local/statue/statue.blend) so it is
                          lit, casts baked shadows and is exported as its own group
    --samples N           bake samples per texel (default 1024)
    --quick               preview quality: 1/4 resolution atlases, 64 samples
    --groups a,b          only (re)bake these groups; others reuse cached bakes
    --reuse               reuse every cached bake in assets/_local/bake-cache
    --no-render           skip the Cycles review renders
    --render-only         only the Cycles review renders
    --dry-run             print the bake-group classification and exit
    --limit-groups a,b    debugging: bake/export only these groups (others still cast light)

Pipeline: classify static geometry into bake groups -> join an evaluated copy
per group -> lightmap UV (smart project, texel-importance weights, pack) ->
Cycles GPU bake COMBINED without glossy (albedo x direct+indirect light,
plus emission) + albedo/normal passes -> OIDN denoise with those aux passes
-> scale by K for 8-bit headroom -> glTF (one mesh + one baked texture per
group, single UV set, no normals) -> gltfpack (meshopt + WebP) ->
KHR_materials_unlit + extras patched into the GLB.

Outputs:
    public/journey/studio-baked.glb
    public/journey/studio-baked.json      {"exposureScale": 1/K, ...}
    assets/blender/review-cycles-overview.png, review-cycles-start.png
The source .blend is never saved; everything happens on an in-memory copy.
The laptop ("Collection") is a shadow/occlusion caster only and is not exported.
"""
import bpy, bmesh, sys, os, math, json, time, struct, subprocess, shutil
import numpy as np
from mathutils import Vector

T0 = time.time()
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
CACHE = os.path.join(ROOT, 'assets', '_local', 'bake-cache')
PUBLIC = os.path.join(ROOT, 'public', 'journey')
OUT_GLB = os.path.join(PUBLIC, 'studio-baked.glb')
OUT_JSON = os.path.join(PUBLIC, 'studio-baked.json')
REVIEW = os.path.join(ROOT, 'assets', 'blender')
STATUE_DEFAULT = os.path.join(ROOT, 'assets', '_local', 'statue', 'statue.blend')
AXIS = Vector((0.0, 0.44))

# Radiance headroom: texture = linear radiance * K (then sRGB 8-bit); runtime multiplies by 1/K.
# K is chosen automatically from the baked radiance (see 'headroom' below).
K = 0.5
WEBP_QUALITY = 90        # WebP quality of the baked atlases (Blender glTF exporter)

# group -> atlas size (px)
GROUPS = {
    'architecture': 4096,
    'floor': 4096,
    'furniture': 4096,
    'desk': 4096,
    'decor': 2048,
    'foliage': 2048,
    'statue': 4096,       # the seated figure: the face is looked at up close
}

# ---------------------------------------------------------------- arguments
argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
def flag(name):
    return name in argv
def opt(name, default=None):
    if name in argv:
        i = argv.index(name)
        if i + 1 < len(argv) and not argv[i + 1].startswith('--'):
            return argv[i + 1]
        return True
    return default

WITH_STATUE = opt('--with-statue')
SAMPLES = int(opt('--samples', 1024))
QUICK = flag('--quick')
if QUICK:
    SAMPLES = int(opt('--samples', 64))
ONLY = set(opt('--groups').split(',')) if opt('--groups') not in (None, True) else None
REUSE = flag('--reuse')
os.makedirs(CACHE, exist_ok=True)

sc = bpy.context.scene
view_layer = bpy.context.view_layer


def log(*a):
    print('[bake %6.1fs]' % (time.time() - T0), *a, flush=True)


def setup_gpu():
    prefs = bpy.context.preferences.addons['cycles'].preferences
    prefs.compute_device_type = 'METAL'
    prefs.refresh_devices()
    for d in prefs.devices:
        d.use = d.type == 'METAL'
    sc.render.engine = 'CYCLES'
    sc.cycles.device = 'GPU'
    log('GPU devices:', [d.name for d in prefs.devices if d.use])


def bbox(objs):
    lo = Vector((1e9,) * 3); hi = Vector((-1e9,) * 3)
    for o in objs:
        for c in o.bound_box:
            w = o.matrix_world @ Vector(c)
            lo = Vector(map(min, lo, w)); hi = Vector(map(max, hi, w))
    return lo, hi


# ---------------------------------------------------------------- statue
def append_statue(path):
    if path is True:
        path = STATUE_DEFAULT
    if not os.path.exists(path):
        log('statue file not found, continuing without it:', path)
        return None
    with bpy.data.libraries.load(path, link=False) as (src, dst):
        if 'Statue' not in src.collections:
            log('no collection "Statue" in', path); return None
        dst.collections = ['Statue']
    col = dst.collections[0]
    sc.collection.children.link(col)
    log('appended Statue from', path, 'objects:', len(col.all_objects))
    return col


# ---------------------------------------------------------------- classification
LAPTOP_COLLECTION = 'Collection'
FLOOR_NAMES = ('Seamless off white floor', 'Central wool rug', 'Studio / rug short fringe')
FOLIAGE_KW = ('leaf', 'leaves', 'blade', 'midrib', 'branch', 'trunk', 'planter', 'soil', 'plant',
              'pothos', 'ficus', 'olive', 'calathea', 'alocasia')
# Built-in shell: walls, ceiling, window wall, door, kitchen run, media wall (name prefixes).
ARCH_PREFIX = ('East plaster wall', 'West plaster wall', 'Studio / rear plaster wall', 'Off white ceiling',
               'Window', 'Slender steel mullion', 'Deep oak window sill', 'Painted skirting',
               'Studio / rear skirting', 'Studio / perimeter cornice', 'Studio / cove diffuser', 'Curtain top rail',
               'Studio / entry door', 'Studio / door', 'Studio / lounge wall inset', 'Studio / lounge vertical reveal',
               'Studio / media recess shadow', 'Studio / media top reveal', 'Studio / vertical walnut batten',
               'Studio / library recessed back', 'Flush kitchen cabinet', 'Cabinet shadow pull',
               'Stone kitchen counter', 'Integrated refrigerator', 'Fridge', 'Inset oven surround', 'Oven',
               'Induction ceramic hob', 'Sink', 'Kitchen backsplash tile', 'Studio / kitchen upper shelf',
               'Studio / kitchen undershelf light', 'Socket recess', 'Wall double socket', 'Ceiling diffuser',
               'Ceiling light recess')


def in_laptop(o):
    return any(c.name == LAPTOP_COLLECTION for c in o.users_collection) or (
        o.parent is not None and o.parent.name.startswith('Calibrated Air'))


def classify(o, statue_objs):
    n = o.name; ln = n.lower()
    if o in statue_objs:
        return 'statue'
    if n.startswith(FLOOR_NAMES):
        return 'floor'
    if n.startswith('PH / '):
        if 'lounge chair' in n: return 'furniture'
        if 'vase' in n: return 'decor'
        return 'foliage'
    if n.startswith(ARCH_PREFIX):
        return 'architecture'
    if any(k in ln for k in FOLIAGE_KW):
        return 'foliage'
    lo, hi = bbox([o]); c = (lo + hi) / 2; size = max(hi - lo)
    if abs(c.x) < 1.65 and -0.85 < c.y < 0.95 and 0.02 < c.z < 2.3:
        return 'desk'
    if any(col.name == '02 - Desk chair and props' for col in o.users_collection):
        return 'furniture'                       # the office chair stays in one atlas
    if size > 0.9:
        return 'furniture'
    return 'decor'


def collect(statue_col):
    statue_objs = set(statue_col.all_objects) if statue_col else set()
    groups = {g: [] for g in GROUPS}
    casters = []
    for o in sc.objects:
        if o.type not in ('MESH', 'CURVE', 'FONT', 'SURFACE', 'META') or o.hide_render:
            continue
        if in_laptop(o):
            casters.append(o); continue
        if o.get('bake_role') == 'emissive-view':
            continue
        groups[classify(o, statue_objs)].append(o)
    return {g: v for g, v in groups.items() if v}, casters


def world_area(objs):
    dg = bpy.context.evaluated_depsgraph_get(); a = 0.0
    for o in objs:
        ev = o.evaluated_get(dg)
        try:
            me = ev.to_mesh()
        except RuntimeError:
            continue
        s = o.matrix_world.to_scale(); f = abs(s.x * s.y * s.z) ** (2 / 3)
        a += sum(p.area for p in me.polygons) * f
        ev.to_mesh_clear()
    return a


# ---------------------------------------------------------------- reference renders
def review_renders():
    sc.cycles.samples = 1024 if not QUICK else 64
    sc.cycles.use_adaptive_sampling = True
    sc.cycles.adaptive_threshold = 0.01
    sc.cycles.use_denoising = True
    sc.render.resolution_x, sc.render.resolution_y, sc.render.resolution_percentage = 1600, 1000, 100
    sc.render.image_settings.file_format = 'PNG'
    for cam, name in (('Apartment overview camera', 'review-cycles-overview.png'),
                      ('Web start camera', 'review-cycles-start.png')):
        sc.camera = bpy.data.objects[cam]
        sc.render.filepath = os.path.join(REVIEW, name)
        t = time.time(); bpy.ops.render.render(write_still=True)
        log('review render', name, '%.0fs' % (time.time() - t))


# ---------------------------------------------------------------- group meshes
FALLBACK_MAT = None


def fallback_material():
    global FALLBACK_MAT
    if FALLBACK_MAT is None:
        FALLBACK_MAT = bpy.data.materials.new('Bake fallback grey')
        FALLBACK_MAT.use_nodes = True
    return FALLBACK_MAT


def texel_weight(g, o, name):
    """Linear texel-density multiplier for an object (faces facing down get less, see below)."""
    if g == 'desk':
        if name.startswith(('Welded upright', 'Upper rail', 'Lower rail', 'Rear support rail', 'Adjustable foot')):
            return 0.45
        if name.startswith('Desk / light oak top'):
            return 1.0
        return 1.7          # mug, notebook, BITS mark, cube, pencil: the close-up heroes
    if g == 'architecture':
        if name.startswith('Off white ceiling'): return 0.7
        if name.startswith(('Socket', 'Wall double socket', 'Ceiling')): return 0.6
    if g == 'floor' and name.startswith('Central wool rug'):
        return 1.25
    if g == 'furniture' and name.startswith('Full height linen curtain'):
        return 0.8
    return 1.0


ROOM_CENTRE = Vector((0.0, 0.6, 3.3))


def orient_normals(me, g):
    """Cycles bakes from the side the normal points to. Scripted lathes and single-quad walls
    were modelled with inward/outward normals that the two-sided renderer never showed."""
    n = len(me.polygons)
    nrm = np.zeros(n * 3, np.float32); me.polygons.foreach_get('normal', nrm); nrm = nrm.reshape(-1, 3)
    cen = np.zeros(n * 3, np.float32); me.polygons.foreach_get('center', cen); cen = cen.reshape(-1, 3)
    area = np.zeros(n, np.float32); me.polygons.foreach_get('area', area)
    # 1. large planar shell pieces (walls, ceiling, floor) face the room interior
    if g in ('architecture', 'floor') and n <= 2:          # single-sheet walls
        big = area > 3.0
        if big.any():
            inward = np.einsum('ij,ij->i', np.array(ROOM_CENTRE)[None] - cen, nrm) < 0
            flip = np.nonzero(big & inward)[0]
            if len(flip):
                bm = bmesh.new(); bm.from_mesh(me); bm.faces.ensure_lookup_table()
                for i in flip:
                    bm.faces[int(i)].normal_flip()
                bm.to_mesh(me); bm.free()
                return
    # 2. closed-ish objects: flip if the normals point inward on (area-weighted) balance
    c = (cen * area[:, None]).sum(0) / max(area.sum(), 1e-9)
    d = np.einsum('ij,ij->i', cen - c[None], nrm) * area
    if d.sum() < -0.25 * np.abs(d).sum():
        me.flip_normals()
    orient_lathe_walls(me)


def orient_lathe_walls(me):
    """Vessels (mugs, cups, pots) can be modelled inside out while their caps skew
    the whole-object balance above, so they escape the flip and Cycles bakes the
    wall from inside (black). If the outermost round wall faces the axis, the
    whole consistently wound mesh is inverted: flip it."""
    bm = bmesh.new(); bm.from_mesh(me); bm.faces.ensure_lookup_table()
    faces = [f for f in bm.faces if abs(f.normal.z) < 0.5]
    if len(faces) < 16:
        bm.free(); return
    cen = np.array([f.calc_center_median()[:2] for f in faces])
    nrm = np.array([f.normal[:2] for f in faces])
    area = np.array([f.calc_area() for f in faces])
    bm.free()
    axis = (cen * area[:, None]).sum(0) / max(area.sum(), 1e-9)
    radial = cen - axis[None]
    r = np.linalg.norm(radial, axis=1)
    outer = r > 0.97 * r.max()
    round_ring = r[outer].std() / max(r[outer].mean(), 1e-9) < 0.05
    inward = (radial * nrm).sum(1) < 0
    if outer.sum() >= 16 and round_ring and inward[outer].mean() > 0.9:
        me.flip_normals()


def build_group(g, objs):
    col = bpy.data.collections.get('Bake runtime') or bpy.data.collections.new('Bake runtime')
    if col.name not in sc.collection.children:
        sc.collection.children.link(col)
    dg = bpy.context.evaluated_depsgraph_get()
    parts = []
    for o in objs:
        ev = o.evaluated_get(dg)
        try:
            me = bpy.data.meshes.new_from_object(ev, preserve_all_data_layers=True, depsgraph=dg)
        except RuntimeError:
            continue
        if not me.polygons:
            bpy.data.meshes.remove(me); continue
        me.transform(o.matrix_world)
        if o.matrix_world.determinant() < 0:
            me.flip_normals()
        orient_normals(me, g)
        # material slots (object-linked materials included)
        mats = [s.material for s in o.material_slots]
        me.materials.clear()
        for m in mats:
            me.materials.append(m or fallback_material())
        if not me.materials:
            me.materials.append(fallback_material())
        # render UV map -> "UVMap" so image textures keep sampling the right layer after the join
        ren = next((u for u in me.uv_layers if u.active_render), None)
        if ren is not None and ren.name != 'UVMap':
            other = me.uv_layers.get('UVMap')
            if other is not None: other.name = 'UVMap_src'
            ren.name = 'UVMap'
        if not me.uv_layers:
            me.uv_layers.new(name='UVMap')
        for a in [a for a in me.color_attributes]:
            me.color_attributes.remove(a)
        # per-face texel weight: undersides (not the ceiling) matter little
        base = texel_weight(g, o, o.name)
        w = np.full(len(me.polygons), base, np.float32)
        nz = np.zeros(len(me.polygons) * 3, np.float32); me.polygons.foreach_get('normal', nz)
        cz = np.zeros(len(me.polygons) * 3, np.float32); me.polygons.foreach_get('center', cz)
        down = (nz[2::3] < -0.6) & (cz[2::3] < 6.0)
        if g == 'statue':
            # the head gets the texels (it is what the camera comes close to), and its undersides
            # (chin, nose, brow) are in plain view, so they are not discounted
            head = cz[2::3] > cz[2::3].max() - 0.62
            w[head] *= 2.2; down &= ~head
        w[down] *= 0.2
        attr = me.attributes.new('lm_weight', 'FLOAT', 'FACE'); attr.data.foreach_set('value', w)
        ob = bpy.data.objects.new('Bake / ' + g + ' / ' + o.name, me)
        col.objects.link(ob); parts.append(ob)
    for o in objs:
        o.hide_render = True                       # the joined copy replaces it from here on
    bpy.ops.object.select_all(action='DESELECT')
    for ob in parts:
        ob.select_set(True)
    view_layer.objects.active = parts[0]
    bpy.ops.object.join()
    ob = view_layer.objects.active
    ob.name = 'studio-' + g
    ob.data.name = 'studio-' + g
    # the render UV must stay render-active; drop leftovers from the join
    for u in list(ob.data.uv_layers):
        if u.name != 'UVMap':
            ob.data.uv_layers.remove(u)
    return ob


# ---------------------------------------------------------------- lightmap UVs
def weight_islands(me, uvname):
    bm = bmesh.new(); bm.from_mesh(me)
    uv = bm.loops.layers.uv[uvname]
    wl = bm.faces.layers.float.get('lm_weight')
    bm.faces.ensure_lookup_table()
    n = len(bm.faces); parent = list(range(n))

    def find(i):
        while parent[i] != i:
            parent[i] = parent[parent[i]]; i = parent[i]
        return i
    for e in bm.edges:
        ls = e.link_loops
        if len(ls) != 2:
            continue
        l1, l2 = ls
        a1 = l1[uv].uv; b1 = l1.link_loop_next[uv].uv
        if l2.vert == l1.vert:
            a2 = l2[uv].uv; b2 = l2.link_loop_next[uv].uv
        else:
            a2 = l2.link_loop_next[uv].uv; b2 = l2[uv].uv
        if (a1 - a2).length_squared < 1e-12 and (b1 - b2).length_squared < 1e-12:
            ra, rb = find(l1.face.index), find(l2.face.index)
            if ra != rb: parent[ra] = rb
    islands = {}
    for f in bm.faces:
        islands.setdefault(find(f.index), []).append(f)
    scaled = 0
    for faces in islands.values():
        area = sum(f.calc_area() for f in faces) or 1e-9
        wt = sum(f[wl] * f.calc_area() for f in faces) / area
        if abs(wt - 1.0) < 1e-3:
            continue
        loops = [l for f in faces for l in f.loops]
        c = sum((l[uv].uv for l in loops), Vector((0, 0))) / len(loops)
        for l in loops:
            l[uv].uv = c + (l[uv].uv - c) * wt
        scaled += 1
    bm.to_mesh(me); bm.free()
    return len(islands), scaled


def _dbg_uv(me, label):
    if not opt('--debug-uv'):
        return
    mode = bpy.context.object.mode
    bpy.ops.object.mode_set(mode='OBJECT')
    lm = me.uv_layers['Lightmap']
    uv = np.zeros(len(me.loops) * 2, np.float32); lm.data.foreach_get('uv', uv); uv = uv.reshape(-1, 2)
    log('   dbg', label, 'bounds', uv.min(0), uv.max(0), 'active', me.uv_layers.active.name)
    bpy.ops.object.mode_set(mode=mode)


def lightmap_uv(ob, res):
    me = ob.data
    lm = me.uv_layers.new(name='Lightmap')
    me.uv_layers['UVMap'].active_render = True
    me.uv_layers.active = lm
    bpy.ops.object.select_all(action='DESELECT'); ob.select_set(True); view_layer.objects.active = ob
    sc.tool_settings.use_uv_select_sync = True
    bpy.ops.object.mode_set(mode='EDIT')
    bpy.ops.mesh.reveal(); bpy.ops.mesh.select_all(action='SELECT')
    bpy.ops.uv.smart_project(angle_limit=math.radians(66), island_margin=0.0, area_weight=0.0,
                             correct_aspect=True, scale_to_bounds=False)
    bpy.ops.uv.select_all(action='SELECT')
    _dbg_uv(me, 'after smart project')
    bpy.ops.uv.average_islands_scale()
    bpy.ops.object.mode_set(mode='OBJECT')
    _dbg_uv(me, 'after average scale')
    n_isl, n_scaled = weight_islands(me, 'Lightmap')
    me.uv_layers.active = me.uv_layers['Lightmap']; me.uv_layers['UVMap'].active_render = True
    bpy.ops.object.mode_set(mode='EDIT')
    bpy.ops.mesh.select_all(action='SELECT'); bpy.ops.uv.select_all(action='SELECT')
    margin_px = {4096: 4, 2048: 2}.get(res, 2)
    for attempt in range(4):
        bpy.ops.uv.pack_islands(rotate=True, scale=True, margin_method='FRACTION', margin=margin_px / res,
                                shape_method='CONCAVE')
        _dbg_uv(me, 'after pack')
        bpy.ops.object.mode_set(mode='OBJECT')
        uvs = np.zeros(len(me.loops) * 2, np.float32); me.uv_layers['Lightmap'].data.foreach_get('uv', uvs)
        if uvs.max() <= 1.0005 and uvs.min() >= -0.0005:
            break
        log('  pack overflowed (%.2f) with %.1f px margins, retrying tighter' % (uvs.max(), margin_px))
        margin_px *= 0.5
        bpy.ops.object.mode_set(mode='EDIT')
    else:
        # last resort: uniform rescale into the unit square
        uvs = uvs.reshape(-1, 2); lo = uvs.min(0); span = (uvs.max(0) - lo).max()
        uvs = (uvs - lo) / span * 0.998 + 0.001
        me.uv_layers['Lightmap'].data.foreach_set('uv', uvs.ravel())
        log('  WARNING: pack still overflowing, rescaled into 0..1')
    lm = me.uv_layers['Lightmap']; me.uv_layers.active = lm; me.uv_layers['UVMap'].active_render = True
    # packed coverage / density report
    uvs = np.zeros(len(me.loops) * 2, np.float32); lm.data.foreach_get('uv', uvs); uvs = uvs.reshape(-1, 2)
    uv_area = 0.0; w_area = 0.0
    for p in me.polygons:
        idx = list(p.loop_indices)
        if len(idx) < 3: continue
        pts = uvs[idx]
        x, y = pts[:, 0], pts[:, 1]
        uv_area += 0.5 * abs(np.dot(x, np.roll(y, -1)) - np.dot(y, np.roll(x, -1)))
        w_area += p.area
    dens = res * math.sqrt(uv_area / max(w_area, 1e-9)) * 2      # px per metre (unweighted mean)
    log('  lightmap UV: %d islands (%d weighted), coverage %.0f%%, ~%.0f px/m' % (n_isl, n_scaled, uv_area * 100, dens))
    return dens


# ---------------------------------------------------------------- baking
def float_image(name, res, colorspace='Linear Rec.709'):
    im = bpy.data.images.get(name)
    if im: bpy.data.images.remove(im)
    im = bpy.data.images.new(name, res, res, alpha=True, float_buffer=True)
    im.colorspace_settings.name = colorspace
    return im


def prepare_materials(ob, image):
    """Point every material of ob at the bake target; metals/glass bake as their diffuse colour."""
    for m in ob.data.materials:
        if not m.use_nodes:
            m.use_nodes = True
        nt = m.node_tree
        t = nt.nodes.get('LM_TARGET') or nt.nodes.new('ShaderNodeTexImage')
        t.name = 'LM_TARGET'; t.image = image
        uvn = nt.nodes.get('LM_UV') or nt.nodes.new('ShaderNodeUVMap')
        uvn.name = 'LM_UV'; uvn.uv_map = 'Lightmap'
        if not t.inputs[0].is_linked:
            nt.links.new(uvn.outputs[0], t.inputs[0])
        nt.nodes.active = t
        if m.get('lm_prepped'):
            continue
        m['lm_prepped'] = True
        for n in nt.nodes:
            if n.type == 'BSDF_PRINCIPLED':
                # Glossy is view dependent and is left out of the bake; keep metals readable
                # by letting their base colour act as a diffuse albedo.
                met = n.inputs['Metallic']
                if not met.is_linked and met.default_value > 0:
                    met.default_value = 0.0
                    bc = n.inputs['Base Color']
                    if not bc.is_linked:
                        c = bc.default_value
                        bc.default_value = (min(1, c[0] * 1.15), min(1, c[1] * 1.15), min(1, c[2] * 1.15), 1)
                tr = n.inputs.get('Transmission Weight')
                if tr is not None and not tr.is_linked:
                    tr.default_value = 0.0


def has_alpha(ob):
    for m in ob.data.materials:
        if not m or not m.use_nodes: continue
        for n in m.node_tree.nodes:
            if n.type == 'BSDF_PRINCIPLED' and (n.inputs['Alpha'].is_linked or n.inputs['Alpha'].default_value < 1):
                return True
    return False


def alpha_outputs(ob, enable):
    """Temporarily route each material's alpha into an emission output for an EMIT bake."""
    for m in ob.data.materials:
        nt = m.node_tree
        outs = [n for n in nt.nodes if n.type == 'OUTPUT_MATERIAL']
        if enable:
            p = next((n for n in nt.nodes if n.type == 'BSDF_PRINCIPLED'), None)
            e = nt.nodes.get('LM_ALPHA_EMIT') or nt.nodes.new('ShaderNodeEmission'); e.name = 'LM_ALPHA_EMIT'
            o = nt.nodes.get('LM_ALPHA_OUT') or nt.nodes.new('ShaderNodeOutputMaterial'); o.name = 'LM_ALPHA_OUT'
            if p is not None and p.inputs['Alpha'].is_linked:
                nt.links.new(p.inputs['Alpha'].links[0].from_socket, e.inputs['Color'])
            else:
                a = p.inputs['Alpha'].default_value if p is not None else 1.0
                e.inputs['Color'].default_value = (a, a, a, 1)
            e.inputs['Strength'].default_value = 1.0
            nt.links.new(e.outputs[0], o.inputs[0])
            m['lm_prev_output'] = next((n.name for n in outs if n.is_active_output), outs[0].name if outs else '')
            o.is_active_output = True
        else:
            prev = nt.nodes.get(m.get('lm_prev_output', ''))
            if prev: prev.is_active_output = True


def bake_pass(ob, kind, image, samples, **kw):
    prepare_materials(ob, image)
    bpy.ops.object.select_all(action='DESELECT'); ob.select_set(True); view_layer.objects.active = ob
    sc.cycles.samples = samples
    b = sc.render.bake
    b.target = 'IMAGE_TEXTURES'; b.use_selected_to_active = False
    b.margin = 16; b.margin_type = 'EXTEND'; b.use_clear = True
    t = time.time()
    bpy.ops.object.bake(type=kind, margin=16, margin_type='EXTEND', use_clear=True, **kw)
    log('  bake %-8s %4d spp  %.0fs' % (kind, samples, time.time() - t))


def pixels(image):
    w, h = image.size
    a = np.empty(w * h * 4, np.float32); image.pixels.foreach_get(a)
    return a.reshape(h, w, 4)


def save_exr(image, path):
    image.filepath_raw = path; image.file_format = 'OPEN_EXR'
    image.save()


DENOISE_SCENE = None


def denoise(noisy, albedo, normal, out_path):
    """OIDN (compositor Denoise node) with albedo + normal guides; writes a float EXR."""
    global DENOISE_SCENE
    if DENOISE_SCENE is None:
        DENOISE_SCENE = bpy.data.scenes.new('LM denoise')
        DENOISE_SCENE.render.engine = 'BLENDER_WORKBENCH'
        DENOISE_SCENE.render.resolution_x = DENOISE_SCENE.render.resolution_y = 4
        ng = bpy.data.node_groups.new('LM denoise', 'CompositorNodeTree')
        DENOISE_SCENE.compositing_node_group = ng
        for nm in ('noisy', 'albedo', 'normal'):
            ng.nodes.new('CompositorNodeImage').name = nm
        dn = ng.nodes.new('CompositorNodeDenoise'); dn.name = 'dn'
        dn.inputs['HDR'].default_value = True
        dn.inputs['Quality'].default_value = 'High'
        fo = ng.nodes.new('CompositorNodeOutputFile'); fo.name = 'out'
        fo.format.media_type = 'IMAGE'; fo.format.file_format = 'OPEN_EXR'; fo.format.color_depth = '32'
        fo.file_output_items.new('RGBA', 'Image')
        ng.links.new(ng.nodes['noisy'].outputs['Image'], dn.inputs['Image'])
        ng.links.new(ng.nodes['albedo'].outputs['Image'], dn.inputs['Albedo'])
        ng.links.new(ng.nodes['normal'].outputs['Image'], dn.inputs['Normal'])
        ng.links.new(dn.outputs[0], fo.inputs[0])
    ng = DENOISE_SCENE.compositing_node_group
    ng.nodes['noisy'].image = noisy; ng.nodes['albedo'].image = albedo; ng.nodes['normal'].image = normal
    fo = ng.nodes['out']
    fo.directory = os.path.dirname(out_path); fo.file_name = os.path.basename(out_path).replace('Image.exr', '')
    bpy.ops.render.render(scene=DENOISE_SCENE.name)
    return out_path


def signature(ob):
    me = ob.data
    co = np.empty(len(me.vertices) * 3, np.float32); me.vertices.foreach_get('co', co)
    return '%d-%d-%.4f' % (len(me.vertices), len(me.polygons), float(np.abs(co).sum()))


def bake_group(g, ob, res):
    """Returns dict with paths of the denoised radiance EXR and (optional) alpha."""
    sig = signature(ob)
    meta_path = os.path.join(CACHE, g + '.json')
    den_path = os.path.join(CACHE, g + '_Image.exr')
    alpha_path = os.path.join(CACHE, g + '_alpha.exr')
    want_alpha = has_alpha(ob)
    if (REUSE or (ONLY is not None and g not in ONLY)) and os.path.exists(meta_path):
        meta = json.load(open(meta_path))
        if meta.get('signature') == sig and meta.get('res') == res and os.path.exists(den_path):
            log('  reusing cached bake for', g)
            return {'radiance': den_path, 'alpha': alpha_path if want_alpha else None}
        log('  cache for %s is stale (geometry or resolution changed), re-baking' % g)
    rad = float_image('LM %s radiance' % g, res)
    alb = float_image('LM %s albedo' % g, res)
    nrm = float_image('LM %s normal' % g, res, 'Non-Color')
    b = sc.render.bake
    b.use_pass_direct = b.use_pass_indirect = True
    b.use_pass_diffuse = b.use_pass_emit = b.use_pass_transmission = True
    b.use_pass_glossy = False
    bake_pass(ob, 'COMBINED', rad, SAMPLES,
              pass_filter={'DIRECT', 'INDIRECT', 'DIFFUSE', 'EMIT', 'TRANSMISSION'})
    bake_pass(ob, 'DIFFUSE', alb, 16, pass_filter={'COLOR'})
    bake_pass(ob, 'NORMAL', nrm, 4, normal_space='OBJECT')
    # OIDN wants normals in [-1, 1]
    n = pixels(nrm); n[..., :3] = n[..., :3] * 2 - 1; nrm.pixels.foreach_set(n.ravel())
    save_exr(rad, os.path.join(CACHE, g + '_raw.exr'))
    denoise(rad, alb, nrm, den_path)
    if want_alpha:
        a_img = float_image('LM %s alpha' % g, res)
        alpha_outputs(ob, True)
        bake_pass(ob, 'EMIT', a_img, 16)
        alpha_outputs(ob, False)
        save_exr(a_img, alpha_path)
    json.dump({'signature': sig, 'res': res, 'samples': SAMPLES}, open(meta_path, 'w'))
    for im in (rad, alb, nrm):
        bpy.data.images.remove(im)
    return {'radiance': den_path, 'alpha': alpha_path if want_alpha else None}


# ---------------------------------------------------------------- encoding
def lin_to_srgb(x):
    x = np.clip(x, 0.0, 1.0)
    return np.where(x <= 0.0031308, 12.92 * x, 1.055 * np.power(x, 1 / 2.4) - 0.055)


def load_exr(path):
    im = bpy.data.images.load(path, check_existing=False)
    im.colorspace_settings.name = 'Linear Rec.709'
    a = pixels(im).copy(); bpy.data.images.remove(im)
    return a


def encode_png(name, rgb_lin, alpha, path):
    """Linear radiance (already * K) -> dithered sRGB 8-bit PNG."""
    h, w = rgb_lin.shape[:2]
    s = lin_to_srgb(rgb_lin)
    rng = np.random.default_rng(7)
    s = s + (rng.random(s.shape, np.float32) - rng.random(s.shape, np.float32)) / 255.0
    out = np.ones((h, w, 4), np.float32)
    out[..., :3] = np.clip(s, 0, 1)
    if alpha is not None:
        out[..., 3] = alpha
    im = bpy.data.images.get(name)
    if im: bpy.data.images.remove(im)
    im = bpy.data.images.new(name, w, h, alpha=alpha is not None, float_buffer=False)
    im.colorspace_settings.name = 'sRGB'
    im.pixels.foreach_set(out.ravel())
    im.filepath_raw = path; im.file_format = 'PNG'
    im.save()
    im.reload()
    return im


def texel_mask(alpha_exr_or_none, rad):
    """Texels that belong to geometry (the margin extension counts as covered)."""
    return np.any(rad[..., :3] > 1e-6, axis=2)


# ---------------------------------------------------------------- export
def unlit_material(name, image, alpha=False):
    m = bpy.data.materials.new(name); m.use_nodes = True
    nt = m.node_tree; nt.nodes.clear()
    out = nt.nodes.new('ShaderNodeOutputMaterial')
    p = nt.nodes.new('ShaderNodeBsdfPrincipled')
    t = nt.nodes.new('ShaderNodeTexImage'); t.image = image
    nt.links.new(t.outputs['Color'], p.inputs['Base Color'])
    if alpha:
        nt.links.new(t.outputs['Alpha'], p.inputs['Alpha'])
    p.inputs['Roughness'].default_value = 1.0
    nt.links.new(p.outputs[0], out.inputs[0])
    return m


def finalize_mesh(ob, material):
    me = ob.data
    for u in list(me.uv_layers):
        if u.name != 'Lightmap':
            me.uv_layers.remove(u)
    me.uv_layers['Lightmap'].name = 'UVMap'
    for a in [a for a in me.attributes if a.name == 'lm_weight']:
        me.attributes.remove(a)
    for a in [a for a in me.color_attributes]:
        me.color_attributes.remove(a)
    me.materials.clear(); me.materials.append(material)


def window_view_export(k):
    src = bpy.data.objects.get('Window view backdrop')
    if src is None or src.hide_render:
        return None
    mat = src.data.materials[0]
    tex = next(n for n in mat.node_tree.nodes if n.type == 'TEX_IMAGE')
    em = next(n for n in mat.node_tree.nodes if n.type == 'EMISSION')
    strength = em.inputs['Strength'].default_value
    im = tex.image
    a = pixels(im).copy()
    # stored bytes are sRGB; radiance = srgb_to_linear * strength; texture = radiance * k
    x = np.clip(a[..., :3], 0, 1)
    lin = np.where(x <= 0.04045, x / 12.92, ((x + 0.055) / 1.055) ** 2.4) * strength * k
    path = os.path.join(CACHE, 'window-view.png')
    img = encode_png('studio-window-view', lin, None, path)
    ob = src.copy(); ob.data = src.data.copy(); ob.name = 'studio-window-view'; ob.data.name = 'studio-window-view'
    sc.collection.objects.link(ob)
    ob.data.materials.clear(); ob.data.materials.append(unlit_material('studio-window-view', img))
    clipped = float((lin > 1).mean())
    log('window view: emission %.2f, clipped %.2f%%' % (strength, clipped * 100))
    return ob


def export_glb(objs, tmp_path):
    bpy.ops.object.select_all(action='DESELECT')
    for o in objs:
        o.hide_render = False; o.hide_set(False); o.select_set(True)
    view_layer.objects.active = objs[0]
    kw = dict(filepath=tmp_path, export_format='GLB', use_selection=True, export_yup=True, export_apply=False,
              export_normals=False, export_tangents=False, export_texcoords=True, export_materials='EXPORT',
              export_image_format='WEBP', export_image_quality=WEBP_QUALITY, export_cameras=False, export_lights=False, export_extras=False,
              export_animations=False, export_skins=False, export_morph=False)
    try:
        bpy.ops.export_scene.gltf(export_vertex_color='NONE', **kw)
    except TypeError:
        bpy.ops.export_scene.gltf(**kw)


def glb_read(path):
    data = open(path, 'rb').read()
    magic, ver, length = struct.unpack_from('<III', data, 0)
    off = 12; chunks = []
    while off < length:
        clen, ctype = struct.unpack_from('<II', data, off)
        chunks.append([ctype, data[off + 8: off + 8 + clen]]); off += 8 + clen
    return chunks


def glb_write(path, chunks):
    body = b''
    for ctype, cdata in chunks:
        pad = (4 - len(cdata) % 4) % 4
        cdata = cdata + ((b' ' if ctype == 0x4E4F534A else b'\0') * pad)
        body += struct.pack('<II', len(cdata), ctype) + cdata
    open(path, 'wb').write(struct.pack('<III', 0x46546C67, 2, 12 + len(body)) + body)


def patch_glb(path, alpha_groups, extras):
    chunks = glb_read(path)
    js = json.loads(chunks[0][1].decode('utf8'))
    for m in js.get('materials', []):
        m.setdefault('extensions', {})['KHR_materials_unlit'] = {}
        pbr = m.setdefault('pbrMetallicRoughness', {})
        pbr['metallicFactor'] = 0.0; pbr['roughnessFactor'] = 1.0
        if any(m.get('name', '') == 'studio-' + g for g in alpha_groups):
            m['alphaMode'] = 'MASK'; m['alphaCutoff'] = 0.5
        else:
            m.pop('alphaMode', None); m.pop('alphaCutoff', None)
        m['doubleSided'] = True       # thin scripted planes (prints, leaves, curtains) are single sheets
    used = set(js.get('extensionsUsed', [])); used.add('KHR_materials_unlit'); js['extensionsUsed'] = sorted(used)
    js.setdefault('asset', {})['extras'] = extras
    chunks[0][1] = json.dumps(js, separators=(',', ':')).encode('utf8')
    glb_write(path, chunks)
    return js


# ---------------------------------------------------------------- main
setup_gpu()
statue_col = append_statue(WITH_STATUE) if WITH_STATUE else None
groups, casters = collect(statue_col)
if opt('--limit-groups') not in (None, True):          # debugging: process only these groups
    keep = set(opt('--limit-groups').split(','))
    for g in [g for g in groups if g not in keep]:
        for o in groups[g]:
            pass                                       # stay visible as bounce/shadow geometry
        del groups[g]

if flag('--dry-run'):
    for g, objs in groups.items():
        area = world_area(objs)
        res = GROUPS[g] // (4 if QUICK else 1)
        dens = res * math.sqrt(0.62 / max(area, 1e-6)) * 2       # px per metre at ~62% packing
        log('%-12s %4d objects  area %8.1f BU^2  atlas %d  ~%.0f px/m' % (g, len(objs), area, res, dens))
        names = sorted({o.name.split('.')[0] for o in objs})
        print('    ', ', '.join(names)[:1500])
    log('casters (not exported):', len(casters))
    sys.exit(0)

if opt('--debug-uv'):
    g = opt('--debug-uv'); res = GROUPS[g] // (4 if QUICK else 1)
    ob = build_group(g, groups[g])
    lightmap_uv(ob, res)
    uv = np.zeros(len(ob.data.loops) * 2, np.float32); ob.data.uv_layers['Lightmap'].data.foreach_get('uv', uv)
    uv = uv.reshape(-1, 2); log('uv bounds', uv.min(0), uv.max(0))
    bpy.ops.wm.save_as_mainfile(filepath=os.path.join(CACHE, 'debug-uv.blend'), copy=True)
    sys.exit(0)

if not flag('--no-render'):
    review_renders()
if flag('--render-only'):
    sys.exit(0)

report = {'groups': {}}
baked = {}
for g, objs in groups.items():
    res = GROUPS[g] // (4 if QUICK else 1)
    log('group %s: %d source objects, atlas %d' % (g, len(objs), res))
    ob = build_group(g, objs)
    tris = sum(len(p.vertices) - 2 for p in ob.data.polygons)
    dens = lightmap_uv(ob, res)
    baked[g] = (ob, res, bake_group(g, ob, res))
    report['groups'][g] = {'atlas': res, 'triangles': tris, 'px_per_metre': round(dens)}
    log('  %s: %d triangles' % (g, tris))

# Headroom: K maps the 98th percentile of covered texels to ~0.95; brighter (sunlit) texels are
# rolled off smoothly into [KNEE, 1] instead of clipping hard.
KNEE = 0.6
samples_all = []
rads = {}
for g, (ob, res, paths) in baked.items():
    rad = load_exr(paths['radiance'])
    rads[g] = rad
    m = texel_mask(None, rad)
    mx = rad[..., :3].max(axis=2)[m]
    if mx.size:
        samples_all.append(mx[:: max(1, mx.size // 400000)])
        log('  %s radiance: median %.3f  p98 %.3f  p99.9 %.3f  max %.2f' % (
            g, np.median(mx), np.percentile(mx, 98), np.percentile(mx, 99.9), mx.max()))
p98 = float(np.percentile(np.concatenate(samples_all), 98))
K = float(np.clip(math.floor(0.95 / p98 * 20) / 20, 0.2, 1.0))
log('headroom: p98 radiance %.3f -> K = %.2f, exposureScale = %.3f (knee above %.2f)' % (p98, K, 1 / K, KNEE / K))


def soft_knee(x):
    y = x.copy()
    hi = x > KNEE
    y[hi] = KNEE + (1 - KNEE) * (1 - np.exp(-(x[hi] - KNEE) / (1 - KNEE)))
    return y


export_objs = []
alpha_groups = []
clip_stats = {}
for g, (ob, res, paths) in baked.items():
    rad = soft_knee(rads[g][..., :3] * K)
    alpha = None
    if paths['alpha']:
        alpha = np.clip(load_exr(paths['alpha'])[..., 0], 0, 1)
        alpha = (alpha > 0.5).astype(np.float32)
        alpha_groups.append(g)
    m = texel_mask(None, rads[g])
    clip_stats[g] = float((rad.max(axis=2)[m] > KNEE).mean()) if m.any() else 0.0
    png = os.path.join(CACHE, 'studio-%s.png' % g)
    img = encode_png('studio-' + g, rad, alpha, png)
    finalize_mesh(ob, unlit_material('studio-' + g, img, alpha is not None))
    export_objs.append(ob)
    report['groups'][g]['kneed_texels_pct'] = round(clip_stats[g] * 100, 3)
wv = window_view_export(K)
if wv:
    export_objs.append(wv)

tmp = os.path.join(CACHE, 'studio-baked-unpacked.glb')
export_glb(export_objs, tmp)
log('exported', os.path.getsize(tmp) // 1024, 'KB unpacked')
gltfpack = ['bunx', 'gltfpack@1.2.0', '-i', tmp, '-o', OUT_GLB, '-cc', '-vpf', '-vtf', '-kn', '-km']
log(' '.join(gltfpack))
subprocess.run(gltfpack, check=True, cwd=ROOT)
extras = {'exposureScale': round(1 / K, 4), 'bakedWith': 'Cycles %s' % bpy.app.version_string,
          'units': 'half-metre (2 units = 1 m), Y-up'}
patch_glb(OUT_GLB, alpha_groups, extras)

tris_total = sum(v['triangles'] for v in report['groups'].values())
notes = ('Baked Cycles lighting (albedo x direct+indirect diffuse light, plus emission; no glossy). '
         'Every material is unlit; the base-colour texture stores linear radiance * %.3f encoded as sRGB. '
         'Multiply colour by exposureScale in linear space (e.g. material.color.setScalar(exposureScale) on '
         'MeshBasicMaterial), then AgX tone mapping at toneMappingExposure 1.0 matches Blender AgX '
         'with exposure 0 (the review PNGs). studio-foliage uses alphaTest 0.5, double sided. '
         'studio-window-view is the skyline backdrop (same encoding). The laptop is not included.' % K)
json.dump({'exposureScale': round(1 / K, 4), 'K': K, 'notes': notes,
           'groups': report['groups'], 'triangles': tris_total,
           'windowView': bool(wv), 'statue': bool(statue_col),
           'bakeSamples': SAMPLES, 'quick': QUICK},
          open(OUT_JSON, 'w'), indent=2)
log('wrote', OUT_GLB, '%.2f MB' % (os.path.getsize(OUT_GLB) / 1e6), 'triangles', tris_total)
log('wrote', OUT_JSON)
log('done in %.1f min' % ((time.time() - T0) / 60))
