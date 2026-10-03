"""BITS Pilani marks: clean the printed logo and print it on the mug too.

  blender -b assets/blender/studio.blend --python scripts/room/bits-marks.py

1. The logo PNG had dark colour under its transparent pixels and repeated at
   the edges, so filtering pulled a dark line round the print. Write a copy
   with the ink colour bled outward under the transparency and a clear margin,
   and clamp it at the edges.
2. Wrap the same print round the mug, on the side facing away from the chair.
Then re-bake the desk group (see README).
"""
import math
import bpy
import numpy as np

PAD = 6
SOURCE = bpy.path.abspath('//../textures/bits-pilani-logo.png')
OUT = bpy.path.abspath('//../textures/bits-pilani-logo-clean.png')

src = bpy.data.images.load(SOURCE)
w, h = src.size
px = np.array(src.pixels[:], dtype=np.float32).reshape(h, w, 4)
big = np.zeros((h + 2 * PAD, w + 2 * PAD, 4), dtype=np.float32)
big[PAD:PAD + h, PAD:PAD + w] = px
rgb, alpha = big[..., :3].copy(), big[..., 3]
known = alpha > 0.5
rgb[~known] = 0
# Bleed: every unknown pixel takes the average of its known neighbours, outward.
for _ in range(max(w, h)):
    if known.all():
        break
    total = np.zeros_like(rgb); count = np.zeros(known.shape, dtype=np.float32)
    for dy in (-1, 0, 1):
        for dx in (-1, 0, 1):
            if dx == 0 and dy == 0:
                continue
            k = np.roll(np.roll(known, dy, 0), dx, 1)
            total += np.roll(np.roll(rgb, dy, 0), dx, 1) * k[..., None]
            count += k
    grow = (~known) & (count > 0)
    rgb[grow] = total[grow] / count[grow][:, None]
    known = known | grow
big[..., :3] = rgb
clean = bpy.data.images.new('BITS Pilani logo (clean)', w + 2 * PAD, h + 2 * PAD, alpha=True)
clean.alpha_mode = 'STRAIGHT'
clean.pixels = big.ravel()
clean.filepath_raw = OUT
clean.file_format = 'PNG'
clean.save()
clean = bpy.data.images.load(OUT, check_existing=False)
clean.alpha_mode = 'STRAIGHT'

cover = bpy.data.materials['BITS Pilani printed cover']
tex = cover.node_tree.nodes['Image Texture']
tex.image = clean
tex.extension = 'CLIP'

# The notebook print sat exactly in the cover's surface; lift it a hair.
mark = bpy.data.objects['BITS Pilani diary mark']
mark.location.z = -0.0005

# ---- the mug
mug = bpy.data.objects['Porcelain mug']
pts = np.array([mug.matrix_world @ v.co for v in mug.data.vertices])
cx, cy = (pts[:, 0].min() + pts[:, 0].max()) / 2, (pts[:, 1].min() + pts[:, 1].max()) / 2
z0, z1 = pts[:, 2].min(), pts[:, 2].max()
mid = z0 + (z1 - z0) * 0.52
height = (z1 - z0) * 0.24
aspect = (w + 2 * PAD) / (h + 2 * PAD)

# The mug's wall is straight where the print goes: use its widest radius there.
_band = pts[(pts[:, 2] > z0 + (z1 - z0) * 0.2) & (pts[:, 2] < z1 - (z1 - z0) * 0.1)]
_outer = float(np.hypot(_band[:, 0] - cx, _band[:, 1] - cy).max())

def radius_at(z):
    return _outer

r_mid = radius_at(mid)
arc = height * aspect / r_mid                      # radians the print covers
COLS, ROWS = 28, 4
verts, uvs, faces = [], [], []
for j in range(ROWS + 1):
    v = j / ROWS
    z = mid + (v - 0.5) * height
    r = radius_at(z) + 0.0012
    for i in range(COLS + 1):
        u = i / COLS
        # Centred on +Y (away from the chair), reading left to right from outside.
        a = math.pi / 2 + (u - 0.5) * arc
        verts.append((cx + math.cos(a) * r, cy + math.sin(a) * r, z))
        uvs.append((u, v))
for j in range(ROWS):
    for i in range(COLS):
        a = j * (COLS + 1) + i
        faces.append((a, a + COLS + 2, a + COLS + 1))
        faces.append((a, a + 1, a + COLS + 2))
name = 'BITS Pilani mug mark'
if name in bpy.data.objects:
    bpy.data.objects.remove(bpy.data.objects[name], do_unlink=True)
me = bpy.data.meshes.new(name)
me.from_pydata(verts, [], faces)
layer = me.uv_layers.new(name='UVMap')
for loop in me.loops:
    layer.data[loop.index].uv = uvs[loop.vertex_index]
me.update()
# Face outward.
n = me.polygons[0].normal; c = me.polygons[0].center
if (c.x - cx) * n.x + (c.y - cy) * n.y < 0:
    me.flip_normals()
for poly in me.polygons:
    poly.use_smooth = True

# The same porcelain as the mug, with the print mixed into its colour, so the
# patch is indistinguishable from the mug except where there is ink.
old = bpy.data.materials.get('BITS Pilani printed mug')
if old:
    bpy.data.materials.remove(old)
printed = bpy.data.materials['Warm porcelain'].copy()
printed.name = 'BITS Pilani printed mug'
nodes, links = printed.node_tree.nodes, printed.node_tree.links
bsdf = nodes['Principled BSDF']
image = nodes.new('ShaderNodeTexImage')
image.image = clean
image.extension = 'CLIP'
mix = nodes.new('ShaderNodeMix')
mix.data_type = 'RGBA'
colour = [i for i in mix.inputs if i.type == 'RGBA']
colour[0].default_value = tuple(bsdf.inputs['Base Color'].default_value)
links.new(image.outputs['Alpha'], mix.inputs[0])
links.new(image.outputs['Color'], colour[1])
links.new(next(o for o in mix.outputs if o.type == 'RGBA'), bsdf.inputs['Base Color'])
me.materials.append(printed)
ob = bpy.data.objects.new(name, me)
for col in mug.users_collection:
    col.objects.link(ob)

bpy.ops.wm.save_mainfile()
print('BITS marks: mug centre', round(cx, 3), round(cy, 3), 'radius', round(r_mid, 4), 'arc deg', round(math.degrees(arc), 1))
