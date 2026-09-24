"""Upgrade the clean studio into the bake-ready source scene.

    blender -b assets/_local/studio-clean.blend --python scripts/room/upgrade.py

Reads the person-free room (assets/_local/studio-clean.blend), applies the
lighting / material / furniture upgrades below and saves
assets/blender/studio.blend (git-ignored). Idempotent in the sense that it
always starts from the clean file; do not run it on studio.blend itself.

Coordinates in this file are Blender (Z-up, half-metre units: 2 BU = 1 m).
three.js (x, y, z) = Blender (x, z, -y).

Needs the Poly Haven downloads: python3 scripts/room/fetch_polyhaven.py
"""
import bpy, math, os, numpy as np
from mathutils import Vector, Matrix, Euler

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
PH = os.path.join(ROOT, 'assets', '_local', 'polyhaven')
OUT_BLEND = os.path.join(ROOT, 'assets', 'blender', 'studio.blend')
PANO_PATH = os.path.join(ROOT, 'assets', '_local', 'window-view-pano.png')
SKYLINE = os.path.join(ROOT, 'assets', '_local', 'unused-public', 'manhattan-view.png')
LOGO = os.path.join(ROOT, 'assets', 'textures', 'bits-pilani-logo.png')
HDRI = os.path.join(PH, 'hdri', 'qwantani_late_afternoon_puresky_2k.hdr')

AXIS = Vector((0.0, 0.44))          # website camera orbit axis (Blender x, y)
M = 2.0                             # Blender units per metre

sc = bpy.context.scene
PH_COL = bpy.data.collections.get('11 - Poly Haven') or bpy.data.collections.new('11 - Poly Haven')
if PH_COL.name not in sc.collection.children:
    sc.collection.children.link(PH_COL)


# ---------------------------------------------------------------- helpers
def hide(obj):
    obj.hide_render = True
    obj.hide_viewport = True
    obj.hide_set(True)


def hide_prefix(*prefixes):
    n = 0
    for o in bpy.data.objects:
        if any(o.name.startswith(p) for p in prefixes):
            hide(o); n += 1
    return n


def img(path, colorspace='sRGB'):
    i = bpy.data.images.load(path, check_existing=True)
    i.colorspace_settings.name = colorspace
    return i


def pbr_material(name, diff, nor=None, rough=None, tile=1.0, tint=None, rough_value=None, normal_strength=1.0, saturation=None):
    """Principled material from Poly Haven maps, sampled from the UV map with a scale."""
    m = bpy.data.materials.get(name) or bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree; nt.nodes.clear()
    out = nt.nodes.new('ShaderNodeOutputMaterial')
    p = nt.nodes.new('ShaderNodeBsdfPrincipled')
    nt.links.new(p.outputs[0], out.inputs[0])
    uv = nt.nodes.new('ShaderNodeTexCoord')
    mp = nt.nodes.new('ShaderNodeMapping'); mp.inputs['Scale'].default_value = (tile, tile, 1)
    nt.links.new(uv.outputs['UV'], mp.inputs['Vector'])
    t = nt.nodes.new('ShaderNodeTexImage'); t.image = img(diff)
    nt.links.new(mp.outputs[0], t.inputs[0])
    col = t.outputs['Color']
    if saturation is not None:
        hsv = nt.nodes.new('ShaderNodeHueSaturation'); hsv.inputs['Saturation'].default_value = saturation
        nt.links.new(col, hsv.inputs['Color']); col = hsv.outputs['Color']
    if tint is not None:
        mix = nt.nodes.new('ShaderNodeMix'); mix.data_type = 'RGBA'; mix.blend_type = 'MULTIPLY'
        mix.inputs['Factor'].default_value = 1.0
        nt.links.new(col, mix.inputs['A']); mix.inputs['B'].default_value = (*tint, 1)
        col = mix.outputs['Result']
    nt.links.new(col, p.inputs['Base Color'])
    if rough:
        r = nt.nodes.new('ShaderNodeTexImage'); r.image = img(rough, 'Non-Color')
        nt.links.new(mp.outputs[0], r.inputs[0]); nt.links.new(r.outputs['Color'], p.inputs['Roughness'])
    elif rough_value is not None:
        p.inputs['Roughness'].default_value = rough_value
    if nor:
        n = nt.nodes.new('ShaderNodeTexImage'); n.image = img(nor, 'Non-Color')
        nm = nt.nodes.new('ShaderNodeNormalMap'); nm.inputs['Strength'].default_value = normal_strength
        nt.links.new(mp.outputs[0], n.inputs[0]); nt.links.new(n.outputs['Color'], nm.inputs['Color'])
        nt.links.new(nm.outputs[0], p.inputs['Normal'])
    return m


def apply_modifiers(o):
    """Bake modifiers into the mesh so UV edits are exact."""
    if o.type != 'MESH' or not o.modifiers:
        return
    dg = bpy.context.evaluated_depsgraph_get()
    me = bpy.data.meshes.new_from_object(o.evaluated_get(dg), preserve_all_data_layers=True, depsgraph=dg)
    old = o.data; o.modifiers.clear(); o.data = me
    if old.users == 0:
        bpy.data.meshes.remove(old)


def world_box_uv(o, tile_bu, axis_swap=False):
    """Per-face box projection of *world* coordinates (tile_bu Blender units per UV unit)."""
    apply_modifiers(o)
    me = o.data
    uvl = me.uv_layers.get('UVMap') or me.uv_layers.new(name='UVMap')
    me.uv_layers.active = uvl; uvl.active_render = True
    mw = o.matrix_world; nm = mw.to_3x3().inverted().transposed()
    for poly in me.polygons:
        n = (nm @ poly.normal); ax = max(range(3), key=lambda i: abs(n[i]))
        for li in poly.loop_indices:
            p = mw @ me.vertices[me.loops[li].vertex_index].co
            if ax == 2: u, v = p.x, p.y
            elif ax == 0: u, v = p.y, p.z
            else: u, v = p.x, p.z
            if axis_swap: u, v = v, u
            uvl.data[li].uv = (u / tile_bu, v / tile_bu)


def import_ph(asset, res, loc, rot_deg=0.0, scale=1.0, keep=None, name=None, decimate=None):
    """Import a Poly Haven glTF (metres) into Blender units at loc (x, y, floor z)."""
    path = os.path.join(PH, 'models', asset, f'{asset}_{res}.gltf')
    before = set(bpy.data.objects)
    bpy.ops.import_scene.gltf(filepath=path)
    new = [o for o in bpy.data.objects if o not in before]
    meshes = []
    for o in new:
        if o.type != 'MESH' or (keep and not any(k in o.name for k in keep)):
            continue
        meshes.append(o)
    # bake parent transforms, then drop helper empties and unwanted variants
    for o in meshes:
        mw = o.matrix_world.copy(); o.parent = None; o.matrix_world = mw
    for o in new:
        if o not in meshes:
            bpy.data.objects.remove(o, do_unlink=True)
    T = Matrix.Translation(Vector(loc)) @ Matrix.Rotation(math.radians(rot_deg), 4, 'Z') @ Matrix.Scale(scale, 4)  # importer already converts metres to scene units
    # centre the kept pieces on the origin footprint so loc is the footprint centre
    lo = Vector((1e9,) * 3); hi = Vector((-1e9,) * 3)
    for o in meshes:
        for c in o.bound_box:
            w = o.matrix_world @ Vector(c); lo = Vector(map(min, lo, w)); hi = Vector(map(max, hi, w))
    centre = Matrix.Translation(Vector((-(lo.x + hi.x) / 2, -(lo.y + hi.y) / 2, -lo.z)))
    for o in meshes:
        o.matrix_world = T @ centre @ o.matrix_world
        for c in list(o.users_collection):
            c.objects.unlink(o)
        PH_COL.objects.link(o)
        o.name = 'PH / ' + (name or asset) + ' / ' + o.name
        for key, ratio in (decimate or {}).items():
            if key in o.name:
                d = o.modifiers.new('Web budget', 'DECIMATE'); d.ratio = ratio
                d.use_collapse_triangulate = True
    return meshes


def bbox(objs):
    lo = Vector((1e9,) * 3); hi = Vector((-1e9,) * 3)
    for o in objs:
        for c in o.bound_box:
            w = o.matrix_world @ Vector(c); lo = Vector(map(min, lo, w)); hi = Vector(map(max, hi, w))
    return lo, hi


# ---------------------------------------------------------------- 1. lighting
for n in ('Large softbox', 'Rim strip', 'Soft room bounce'):
    o = bpy.data.objects.get(n)
    if o: bpy.data.objects.remove(o, do_unlink=True)

# Window opening as a Cycles light portal: guides sky sampling through the glass line.
portal = bpy.data.objects.get('Window daylight')
portal.data.type = 'AREA'; portal.data.shape = 'RECTANGLE'
portal.data.size = 16.8; portal.data.size_y = 5.4
portal.location = (0, -7.25, 3.5); portal.rotation_euler = (math.radians(90), 0, 0)
portal.data.cycles.is_portal = True
portal.name = 'Window sky portal'

# Late-afternoon clear sky, rotated so the sun (19 deg high) sits outside the
# window to the right of the skyline and rakes in across the rug and desk.
SUN_AZ_IMAGE = -36.0      # measured: brightest texel of the 2k HDR
SUN_AZ_WORLD = -58.0      # desired direction to the sun (atan2(y, x), degrees)
world = sc.world; world.use_nodes = True
nt = world.node_tree; nt.nodes.clear()
tc = nt.nodes.new('ShaderNodeTexCoord'); mp = nt.nodes.new('ShaderNodeMapping')
mp.inputs['Rotation'].default_value = (0, 0, math.radians(SUN_AZ_IMAGE - SUN_AZ_WORLD))
env = nt.nodes.new('ShaderNodeTexEnvironment'); env.image = img(HDRI, 'Linear Rec.709')
bg = nt.nodes.new('ShaderNodeBackground'); bg.inputs['Strength'].default_value = 1.0
wo = nt.nodes.new('ShaderNodeOutputWorld')
nt.links.new(tc.outputs['Generated'], mp.inputs['Vector']); nt.links.new(mp.outputs[0], env.inputs[0])
nt.links.new(env.outputs[0], bg.inputs[0]); nt.links.new(bg.outputs[0], wo.inputs[0])
world['sky_strength'] = 1.0

# Warm practicals stay (lounge lamp, paper lantern, shelf spill); ceiling downlights off in daylight.
for m in bpy.data.materials:
    if m.name.startswith('Finish - ceiling diffuser') and m.node_tree:
        for n in m.node_tree.nodes:
            if n.type == 'BSDF_PRINCIPLED':
                n.inputs['Emission Strength'].default_value = 0.0

# ---------------------------------------------------------------- 2. window view
def build_pano():
    """Skyline plate centred on the window, mirrored at the far edges, sky extended up."""
    src = bpy.data.images.load(SKYLINE, check_existing=True)
    w, h = src.size
    a = np.array(src.pixels[:], dtype=np.float32).reshape(h, w, 4)[..., :3]   # bottom-up rows
    # horizontal: image covers the central 130 deg of a 200 deg canvas
    side = int(round(w * 35 / 130))
    left = a[:, :side][:, ::-1]; right = a[:, -side:][:, ::-1]
    row = np.concatenate([left, a, right], axis=1)
    W = row.shape[1]
    top_px = int(h * 0.83); bot_px = int(h * 0.41)
    # sky above: blend the (blurred) top rows toward a clear zenith blue
    top = row[-8:].mean(axis=0)
    k = 101; ker = np.ones(k) / k
    top = np.stack([np.convolve(np.pad(top[:, c], k // 2, mode='edge'), ker, 'valid') for c in range(3)], 1)
    zenith = np.array([0.33, 0.47, 0.72], dtype=np.float32) * top.mean() / 0.55
    t = (np.arange(top_px, dtype=np.float32) / (top_px - 1))[:, None, None] ** 0.8
    sky = top[None] * (1 - t) + zenith[None, None] * t
    # city below: reflected foreground rows, slightly darker
    below = row[:bot_px][::-1] * 0.82
    pano = np.concatenate([below, row, sky], axis=0)
    H = pano.shape[0]
    out = bpy.data.images.get('Window view pano')
    if out: bpy.data.images.remove(out)
    out = bpy.data.images.new('Window view pano', W, H, alpha=False)
    rgba = np.concatenate([pano, np.ones((H, W, 1), np.float32)], axis=2)
    out.pixels.foreach_set(rgba.astype(np.float32).ravel())
    out.filepath_raw = PANO_PATH; out.file_format = 'PNG'; out.save()
    return out, W, H, h, bot_px


def build_backdrop():
    old = bpy.data.objects.get('Manhattan skyline')
    if old: hide(old)
    sk = bpy.data.images.get('manhattan-view.png')
    if sk: sk.filepath = SKYLINE
    pano, W, H, h, bot_px = build_pano()
    R = 34.0; arc0, arc1 = math.radians(-190), math.radians(10)
    px_per_rad = (W / (arc1 - arc0))
    height = H / px_per_rad * R / 1.0                       # undistorted: same px per BU both ways
    horizon_frac = (bot_px + h * (1 - 0.487)) / H            # horizon row of the skyline plate
    z0 = 3.0 - horizon_frac * height                           # horizon at ~1.5 m eye height
    seg = 160
    verts, faces, uvs = [], [], []
    for i in range(seg + 1):
        a = arc0 + (arc1 - arc0) * i / seg
        x, y = AXIS.x + R * math.cos(a), AXIS.y + R * math.sin(a)
        verts += [(x, y, z0), (x, y, z0 + height)]
    for i in range(seg):
        faces.append((2 * i, 2 * i + 2, 2 * i + 3, 2 * i + 1))
    me = bpy.data.meshes.new('Window view backdrop')
    me.from_pydata(verts, [], faces); me.update()
    uvl = me.uv_layers.new(name='UVMap')
    for poly in me.polygons:
        for li in poly.loop_indices:
            vi = me.loops[li].vertex_index
            # canvas runs left->right when looking out (+x is on the left from inside)
            uvl.data[li].uv = (1.0 - (vi // 2) / seg, float(vi % 2))
    o = bpy.data.objects.new('Window view backdrop', me)
    sc.collection.objects.link(o)
    m = bpy.data.materials.get('Window view emission') or bpy.data.materials.new('Window view emission')
    m.use_nodes = True; nt = m.node_tree; nt.nodes.clear()
    t = nt.nodes.new('ShaderNodeTexImage'); t.image = pano; t.extension = 'EXTEND'
    e = nt.nodes.new('ShaderNodeEmission'); e.inputs['Strength'].default_value = 1.6
    out = nt.nodes.new('ShaderNodeOutputMaterial')
    nt.links.new(t.outputs[0], e.inputs[0]); nt.links.new(e.outputs[0], out.inputs[0])
    me.materials.append(m)
    # the room is lit by the sky HDRI; the plate is only what the camera sees
    o.visible_diffuse = o.visible_glossy = o.visible_transmission = False
    o.visible_volume_scatter = o.visible_shadow = False
    o['bake_role'] = 'emissive-view'
    return o

build_backdrop()

# ---------------------------------------------------------------- 3. desk: clean light oak
oak_desk = pbr_material('Desk / silver oak veneer',
                        f'{PH}/textures/silver_oak_veneer_01/silver_oak_veneer_01_diff_2k.jpg',
                        f'{PH}/textures/silver_oak_veneer_01/silver_oak_veneer_01_nor_gl_2k.jpg',
                        f'{PH}/textures/silver_oak_veneer_01/silver_oak_veneer_01_rough_2k.jpg',
                        tint=(0.97, 0.95, 0.92), normal_strength=0.35)
top = bpy.data.objects['Walnut desktop with eased edge']
top.name = 'Desk / light oak top'
top.data.materials.clear(); top.data.materials.append(oak_desk)
world_box_uv(top, 2.0)                        # 1 m texture tile, grain along the desk (x)
for o in bpy.data.collections['02 - Desk chair and props'].objects:
    base = o.name.split('.')[0]
    if base in ('Welded upright', 'Upper rail', 'Lower rail', 'Rear support rail'):
        o.data.materials.clear(); o.data.materials.append(oak_desk)
        world_box_uv(o, 2.0, axis_swap=(base == 'Welded upright'))
    elif base in ('Inset frame bolt', 'Foot leveler', 'Cable tray'):
        hide(o)                               # cleaner: no visible hardware under the top

# Notebook: warm cream cloth so the full-colour BITS mark reads; logo centred on the cover.
cream = bpy.data.materials['Notebook linen']
for n in cream.node_tree.nodes:
    if n.type == 'BSDF_PRINCIPLED':
        n.inputs['Base Color'].default_value = (0.80, 0.76, 0.66, 1)
cream.diffuse_color = (0.80, 0.76, 0.66, 1)
bits = bpy.data.images.get('bits-pilani-logo.png')
bits.filepath = LOGO; bits.reload()
# print the logo onto an opaque cream patch so the baked desk atlas needs no alpha
bm_ = bpy.data.materials['BITS Pilani printed cover']; nt_ = bm_.node_tree
p_ = next(n for n in nt_.nodes if n.type == 'BSDF_PRINCIPLED')
t_ = next(n for n in nt_.nodes if n.type == 'TEX_IMAGE')
for l in list(p_.inputs['Alpha'].links) + list(p_.inputs['Base Color'].links):
    nt_.links.remove(l)
mix_ = nt_.nodes.new('ShaderNodeMix'); mix_.data_type = 'RGBA'
mix_.inputs['A'].default_value = (0.80, 0.76, 0.66, 1)
nt_.links.new(t_.outputs['Alpha'], mix_.inputs['Factor']); nt_.links.new(t_.outputs['Color'], mix_.inputs['B'])
nt_.links.new(mix_.outputs['Result'], p_.inputs['Base Color'])
p_.inputs['Alpha'].default_value = 1.0
t_.interpolation = 'Cubic'
covers = [o for o in bpy.data.objects if o.name.startswith('Linen notebook cover') and not o.hide_render]
clo, chi = bbox(covers)                       # front cover is the upper of the two boards
mark = bpy.data.objects['BITS Pilani diary mark']
mlo, mhi = bbox([mark])
mark.location += Vector(((clo.x + chi.x) / 2 - (mlo.x + mhi.x) / 2, (clo.y + chi.y) / 2 - (mlo.y + mhi.y) / 2, chi.z + 0.0004 - mlo.z))
# 11 cm wide mark (was 14 cm) so it sits clear of the elastic band, which moves to the fore-edge
mc = sum((v.co for v in mark.data.vertices), Vector()) / len(mark.data.vertices)
for v in mark.data.vertices:
    v.co = mc + (v.co - mc) * 0.8
p_.inputs['Roughness'].default_value = 0.87          # same finish as the cloth around it
bpy.data.objects['Notebook elastic'].location.x += 0.045
# pencil (and its graphite tip) moves off the cover to lie on the desk beside the notebook
pen = bpy.data.objects['Pencil']; tip = bpy.data.objects['Graphite tip']
plo, phi = bbox([pen, tip])
off = Vector((chi.x + 0.08 - plo.x, 0, 1.5905 - plo.z))
pen.location += off; tip.location += off

# ---------------------------------------------------------------- 4. soft goods
boucle = pbr_material('Studio / cream boucle',
                      f'{PH}/textures/curly_teddy_natural/curly_teddy_natural_diff_2k.jpg',
                      f'{PH}/textures/curly_teddy_natural/curly_teddy_natural_nor_gl_2k.jpg',
                      tint=(0.93, 0.90, 0.86), rough_value=0.95, normal_strength=0.8)
sofa_parts = [o for o in bpy.data.objects if not o.hide_render and o.type == 'MESH' and any(
    k in o.name for k in ('deep sofa seat', 'rounded sofa back', 'rounded sofa arm'))]
for o in sofa_parts:
    o.data.materials.clear(); o.data.materials.append(boucle)
    world_box_uv(o, 0.67)                     # 33.6 cm texture tile

rug_mat = pbr_material('Finish - cream fleece rug',
                       f'{PH}/textures/polar_fleece/polar_fleece_diff_2k.jpg',
                       f'{PH}/textures/polar_fleece/polar_fleece_nor_gl_2k.jpg',
                       tint=(1.34, 1.32, 1.27), rough_value=0.97, normal_strength=0.7, saturation=0.22)
rug = bpy.data.objects['Central wool rug']
rug.data.materials.clear(); rug.data.materials.append(rug_mat)
world_box_uv(rug, 0.546)                      # 27.3 cm texture tile

# ---------------------------------------------------------------- 5. Poly Haven furniture and plants
# Reading chair by the window -> mid-century lounge chair, turned toward the desk.
old_chair = [o for o in bpy.data.objects if o.name.startswith('Studio / reading chair')]
clo, chi = bbox(old_chair)
for o in old_chair: hide(o)
chair_xy = Vector((6.05, -4.75))
face = (Vector((AXIS.x, AXIS.y)) - chair_xy)
rot = math.degrees(math.atan2(face.y, face.x)) + 90      # model faces -Y (glTF +Z)
import_ph('mid_century_lounge_chair', '2k', (chair_xy.x, chair_xy.y, 0), rot, 1.0, name='lounge chair')

# Window-corner ficus -> Poly Haven potted plant 01 (about 1.9 m).
old = [o for o in bpy.data.objects if o.name.startswith('Studio / window ficus')]
lo, hi = bbox(old)
for o in old: hide(o)
import_ph('potted_plant_01', '2k', ((lo.x + hi.x) / 2 + 0.1, (lo.y + hi.y) / 2 - 0.15, 0), 35, 1.42, name='window ficus',
          decimate={'leaves': 0.22, 'stem': 0.35, 'pebbles': 0.2, 'pot': 0.5})

# Library rubber tree -> Poly Haven alocasia (potted plant 02), a lower, broader silhouette.
old = [o for o in bpy.data.objects if o.name.startswith('Studio / library rubber tree')]
lo, hi = bbox(old)
for o in old: hide(o)
import_ph('potted_plant_02', '2k', ((lo.x + hi.x) / 2 - 0.1, (lo.y + hi.y) / 2, 0), -70, 1.45, name='alocasia',
          decimate={'leaves': 0.3, 'dirt': 0.3, 'pot': 0.5})

# Calathea on the floor at the north end of the sofa.
import_ph('calathea_orbifolia_01', '1k', (-7.45, 2.35, 0), 20, 1.25, keep=['_a'], name='calathea')

# White ceramic vases: record cabinet top and the free end of the kitchen counter.
import_ph('ceramic_vase_01', '1k', (4.55, 7.72, 1.30), 0, 1.0, name='vase tall', decimate={'vase': 0.3})
import_ph('ceramic_vase_04', '1k', (5.12, 7.62, 1.30), 40, 0.8, name='vase jug', decimate={'vase': 0.3})
import_ph('ceramic_vase_03', '1k', (-1.9, 7.62, 1.80), 10, 0.9, name='vase slim', decimate={'vase': 0.3})

# ---------------------------------------------------------------- 6. web triangle budget
# Lighting is baked, so small bevel/curve detail away from the desk only costs triangles.
DESK_KEEP = ('Desk /', 'Porcelain mug', 'Mug handle', 'Coffee meniscus', 'Linen notebook', 'Notebook',
             'Page edge', 'Pencil', 'Graphite', 'BITS', 'Rubik', 'Studio / deep sofa', 'Studio / rounded sofa')
budget = {'curves': 0, 'bevels': 0}
for o in bpy.data.objects:
    if o.hide_render or o.name.startswith(DESK_KEEP):
        continue
    if o.type == 'CURVE':
        d = o.data
        if d.resolution_u > 3 or d.bevel_resolution > 1:
            d.resolution_u = min(d.resolution_u, 3); d.bevel_resolution = min(d.bevel_resolution, 1)
            budget['curves'] += 1
    elif o.type == 'FONT':
        o.data.resolution_u = min(o.data.resolution_u, 2)
    if o.type == 'MESH':
        for mod in o.modifiers:
            if mod.type == 'BEVEL' and mod.segments > 2:
                mod.segments = 2; budget['bevels'] += 1
# sub-centimetre hardware and hairline vinyl grooves are invisible from the web camera
budget['hidden'] = hide_prefix('Window frame fixing', 'Studio / record groove')
print('WEB BUDGET simplified', budget)

# ---------------------------------------------------------------- 7. cameras + film
def look(cam, pos, at):
    cam.location = pos
    cam.rotation_euler = (Vector(at) - Vector(pos)).to_track_quat('-Z', 'Y').to_euler()

cd = bpy.data.cameras.get('Web start camera') or bpy.data.cameras.new('Web start camera')
cam = bpy.data.objects.get('Web start camera') or bpy.data.objects.new('Web start camera', cd)
if cam.name not in sc.collection.objects:
    sc.collection.objects.link(cam)
# three (-4.23, 3.2, -6.26) -> Blender (-4.23, 6.26, 3.2); target three (0, 2.48, -0.44) -> (0, 0.44, 2.48)
look(cam, (-4.23, 6.26, 3.2), (0.0, 0.44, 2.48))
cd.sensor_fit = 'VERTICAL'; cd.angle_y = math.radians(40); cd.clip_start = 0.05; cd.clip_end = 200

sc.view_settings.view_transform = 'AgX'
sc.view_settings.look = 'None'
sc.view_settings.exposure = 0.0
sc.render.engine = 'CYCLES'
sc.cycles.samples = 256
sc.cycles.use_denoising = True
sc.render.resolution_x, sc.render.resolution_y = 1600, 1000

# ---------------------------------------------------------------- 8. clearance report
def clearance_report():
    dg = bpy.context.evaluated_depsgraph_get()
    desk_like = ('Desk', 'Welded', 'rail', 'Rubik', 'Porcelain mug', 'Mug handle', 'Coffee meniscus', 'notebook',
                 'Notebook', 'Page edge', 'Pencil', 'Graphite', 'BITS', 'Air /', 'Calibrated', 'Contoured', 'Seat',
                 'Gas lift', 'Backrest', 'Armrest', 'armrest', 'spoke', 'Caster', 'caster', 'Adjustable foot')
    bad = []
    for o in bpy.data.objects:
        if o.hide_render or o.type not in ('MESH', 'CURVE', 'FONT') or o.name == 'Window view backdrop':
            continue
        if any(k in o.name for k in desk_like):
            continue
        lo, hi = bbox([o])
        if hi.z < 1.5 or lo.z > 4.0:
            continue
        # cheap bbox pre-test
        dx = max(lo.x - AXIS.x, 0, AXIS.x - hi.x); dy = max(lo.y - AXIS.y, 0, AXIS.y - hi.y)
        if math.hypot(dx, dy) > 4.8:
            continue
        ev = o.evaluated_get(dg); me = ev.to_mesh()
        for v in me.vertices:
            p = o.matrix_world @ v.co
            if 1.5 <= p.z <= 4.0 and math.hypot(p.x - AXIS.x, p.y - AXIS.y) < 4.8:
                bad.append(o.name); break
        ev.to_mesh_clear()
    print('CLEARANCE violations:', bad or 'none')

clearance_report()
for o in PH_COL.objects:
    lo, hi = bbox([o])
    c = (lo + hi) / 2
    print('PLACED %-60s centre (%.2f, %.2f) z %.2f..%.2f  axis dist %.2f BU' % (
        o.name, c.x, c.y, lo.z, hi.z, math.hypot(c.x - AXIS.x, c.y - AXIS.y)))

os.makedirs(os.path.dirname(OUT_BLEND), exist_ok=True)
bpy.ops.file.make_paths_relative()
bpy.ops.wm.save_as_mainfile(filepath=OUT_BLEND)
print('Saved', OUT_BLEND)
