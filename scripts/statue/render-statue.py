"""Cycles review renders of the plaster statue sitting in the room.

  blender -b --factory-startup --python scripts/statue/render-statue.py [-- --samples 128 --only side]

Opens assets/_local/studio-clean.blend read-only (never saved), applies the chair move
recorded in assets/_local/statue/statue-report.json, appends collection "Statue" from
assets/_local/statue/statue.blend and writes:
  assets/_local/statue/review-front34.png, review-side.png, review-over-shoulder.png  (studio 3-point light)
  assets/_local/statue/review-room.png, review-room-shoulder.png                       (room lighting composite)
"""
import bpy, sys, json, math
from mathutils import Vector
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'assets/_local/statue'
ARGS = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
SAMPLES = int(ARGS[ARGS.index('--samples') + 1]) if '--samples' in ARGS else 128
ONLY = ARGS[ARGS.index('--only') + 1].split(',') if '--only' in ARGS else None
RES = int(ARGS[ARGS.index('--res') + 1]) if '--res' in ARGS else 1200
PREFIX = ARGS[ARGS.index('--prefix') + 1] if '--prefix' in ARGS else 'review'

bpy.ops.wm.open_mainfile(filepath=str(ROOT / 'assets/_local/studio-clean.blend'), load_ui=False)
rep = json.loads((OUT / 'statue-report.json').read_text())
ct = rep['chair_transform']
for n in ct['upper_parts'] + ct['base_parts']:
    o = bpy.data.objects[n]
    d = Vector(ct['all_chair_parts_delta_bu'])
    if n in ct['upper_parts']:
        d += Vector(ct['upper_parts_extra_delta_bu'])
    o.matrix_world.translation += d

with bpy.data.libraries.load(str(OUT / 'statue.blend'), link=False) as (src, dst):
    dst.collections = ['Statue']
statue_col = dst.collections[0]
bpy.context.scene.collection.children.link(statue_col)
statue = statue_col.objects[0]

s = bpy.context.scene
s.render.engine = 'CYCLES'
prefs = bpy.context.preferences.addons['cycles'].preferences
try:
    prefs.compute_device_type = 'METAL'
    prefs.get_devices()
    for d in prefs.devices: d.use = True
    s.cycles.device = 'GPU'
except Exception as e:
    print('GPU unavailable', e)
s.cycles.samples = SAMPLES
s.cycles.use_denoising = True
s.render.resolution_x = s.render.resolution_y = RES
s.render.resolution_percentage = 100
s.render.film_transparent = False
s.view_settings.view_transform = 'AgX'
s.view_settings.look = 'None'

room_cols = [c for c in bpy.data.collections if c.name not in ('Collection', '02 - Desk chair and props', 'Statue')]
room_lights = [o for o in bpy.data.objects if o.type == 'LIGHT']
world0 = s.world

cam_d = bpy.data.cameras.new('ReviewCam'); cam = bpy.data.objects.new('ReviewCam', cam_d)
s.collection.objects.link(cam); s.camera = cam

def aim(loc, tgt, lens):
    cam.location = loc; cam.data.lens = lens
    cam.rotation_euler = (Vector(tgt) - Vector(loc)).to_track_quat('-Z', 'Y').to_euler()

VIEWS = {   # BU, room frame (he faces +Y, his right is +X)
    'front34': ((2.35, 0.55, 3.05), (0.02, -1.0, 1.75), 42),
    'side': ((3.6, -0.95, 2.0), (0.0, -0.95, 1.55), 40),
    'over-shoulder': ((0.62, -2.35, 3.25), (0.0, 0.44, 1.83), 32),
    'face': ((0.55, 0.0, 2.45), (0.0, -0.92, 2.45), 60),
    'torso': ((1.3, 0.3, 2.2), (0.05, -0.95, 1.9), 45),
    'back': ((-1.9, -3.6, 3.2), (0.0, -1.0, 1.4), 40),
    'rarm': ((1.35, -0.2, 2.35), (0.45, -0.5, 1.75), 45),
    'nape': ((0.5, -2.4, 2.9), (0.0, -1.1, 2.1), 55),
    'lap': ((-1.4, 0.4, 1.9), (-0.2, -0.8, 1.2), 40),
}

def studio():
    for c in room_cols:
        c.hide_render = True
    for o in room_lights:
        o.hide_render = True
    w = bpy.data.worlds.new('ReviewWorld'); w.use_nodes = True
    w.node_tree.nodes['Background'].inputs[0].default_value = (0.05, 0.05, 0.055, 1)
    w.node_tree.nodes['Background'].inputs[1].default_value = 1.0
    s.world = w
    # floor so the feet sit on something
    bpy.ops.mesh.primitive_plane_add(size=30, location=(0, 0, 0))
    fl = bpy.context.active_object; fl.name = 'ReviewFloor'
    m = bpy.data.materials.new('ReviewFloor'); m.diffuse_color = (0.2, 0.2, 0.2, 1)
    m.use_nodes = True; m.node_tree.nodes['Principled BSDF'].inputs['Base Color'].default_value = (0.18, 0.18, 0.19, 1)
    fl.data.materials.append(m)
    def area(name, loc, energy, size, tgt=(0, -1.0, 1.6), color=(1, 1, 1)):
        L = bpy.data.lights.new(name, 'AREA'); L.energy = energy; L.size = size; L.color = color
        o = bpy.data.objects.new(name, L); s.collection.objects.link(o)
        o.location = loc; o.rotation_euler = (Vector(tgt) - Vector(loc)).to_track_quat('-Z', 'Y').to_euler()
        return o
    lights = [area('Key', (2.8, 1.4, 4.4), 260, 0.9, color=(1.0, 0.96, 0.9)),
              area('Fill', (-3.2, 0.6, 2.4), 70, 3.0, color=(0.9, 0.95, 1.0)),
              area('Rim', (-1.2, -4.2, 4.0), 220, 1.5)]
    return [fl] + lights

def room():
    for c in room_cols:
        c.hide_render = False
    for o in room_lights:
        o.hide_render = False
    s.world = world0

def shoot(name, view, force=False):
    if ONLY and view not in ONLY and not force:
        return
    aim(*VIEWS[view])
    s.render.filepath = str(OUT / f'{name}.png')
    bpy.ops.render.render(write_still=True)
    print('WROTE', s.render.filepath)

extra = studio()
for v in ('front34', 'side', 'over-shoulder', 'face', 'back', 'torso', 'rarm', 'nape', 'lap'):
    shoot(f'{PREFIX}-{v}', v)
for o in extra:
    bpy.data.objects.remove(o)
room()
if not ONLY or 'room' in ONLY:
  shoot(f'{PREFIX}-room', 'front34', True)
  shoot(f'{PREFIX}-room-shoulder', 'over-shoulder', True)
