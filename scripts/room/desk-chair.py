"""Swap the office chair at the desk for the mid-century lounge chair.

  blender -b assets/blender/studio.blend --python scripts/room/desk-chair.py

Edits assets/blender/studio.blend in place. Before the first edit the untouched file is
copied to assets/_local/studio-before-desk-chair.blend (never overwritten). Safe to re-run:
the chair transform is set absolutely and already-deleted parts are skipped.

1. Deletes only the office chair parts of collection "02 - Desk chair and props" (seat,
   backrest, piping, mechanism, gas lift, backrest/armrest supports, padded armrests,
   spokes, casters, caster forks). The desk and the props on it stay.
2. Moves "PH / lounge chair / mid_century_lounge_chair" (Poly Haven, CC0) to the desk:
   centred on x = 0, turned to face +Y (the laptop), its front edge CHAIR_GAP behind the
   desk's front edge, standing on the rug.
   Scale: the Poly Haven model measures 1.01 m wide x 1.19 m deep x 1.17 m tall with the seat
   cushion front at 0.51 m and armrests at 0.69 m. Mid-century lounge chairs are about
   0.84 m wide with the seat front at ~0.40-0.45 m and armrests ~0.55-0.60 m, so the model
   is ~15-20 % oversized; it is scaled by CHAIR_SCALE = 0.85 (-> 0.86 m wide, seat front
   0.43 m, armrests 0.58 m, 0.99 m tall; a high-back lounge chair).

Units: half-metre Blender units (2 BU = 1 m), Z up. three.js (x, y, z) = Blender (x, z, -y).
"""
import bpy, os, re, shutil, math, json
from mathutils import Vector, Matrix
from mathutils.bvhtree import BVHTree

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
BACKUP = os.path.join(ROOT, 'assets', '_local', 'studio-before-desk-chair.blend')

CHAIR = 'PH / lounge chair / mid_century_lounge_chair'
CHAIR_SCALE = 0.85
CHAIR_GAP = 0.20           # BU (10 cm) from the desk's front edge back to the chair's front edge
DESK_FRONT_Y = -0.67       # desk top spans y -0.67 ... 0.83
FLOOR_Z = 0.024            # rug top is 0.027; feet press 1.5 mm into the pile
OFFICE_PARTS = {
    'Contoured seat', 'Contoured seat stitched piping', 'Contoured backrest',
    'Contoured backrest stitched piping', 'Seat mechanism', 'Gas lift', 'Backrest support',
    'Armrest support', 'Padded armrest', 'Cast aluminum spoke', 'Dual caster wheel', 'Caster fork',
}


def log(*a):
    print('[desk-chair]', *a, flush=True)


def world_bbox(o):
    pts = [o.matrix_world @ Vector(c) for c in o.bound_box]
    return (Vector([min(p[i] for p in pts) for i in range(3)]),
            Vector([max(p[i] for p in pts) for i in range(3)]))


def world_bvh(o):
    me = o.data
    M = o.matrix_world
    return BVHTree.FromPolygons([M @ v.co for v in me.vertices], [p.vertices for p in me.polygons])


# ---------------------------------------------------------------- 0. backup
src = bpy.data.filepath
if not os.path.exists(BACKUP):
    shutil.copy2(src, BACKUP)
    log('backup', BACKUP)
else:
    log('backup exists, kept', BACKUP)

# ---------------------------------------------------------------- 1. remove the office chair
col = bpy.data.collections['02 - Desk chair and props']
removed = []
for o in list(col.all_objects):
    base = re.sub(r'\.\d{3}$', '', o.name)
    if base in OFFICE_PARTS:
        removed.append(o.name)
        data = o.data
        bpy.data.objects.remove(o, do_unlink=True)
        if data is not None and data.users == 0:
            bpy.data.meshes.remove(data)
log('removed', len(removed), 'office chair objects')
left = sorted(o.name for o in col.all_objects if re.sub(r'\.\d{3}$', '', o.name) in OFFICE_PARTS)
assert not left, left

# ---------------------------------------------------------------- 2. place the lounge chair
chair = bpy.data.objects[CHAIR]
chair.parent = None
me = chair.data
lo = Vector([min(v.co[i] for v in me.vertices) for i in range(3)])
hi = Vector([max(v.co[i] for v in me.vertices) for i in range(3)])
# the model faces local -Y; a 180 degree turn makes it face +Y (toward the laptop).
front_local = lo.y
cx_local = (lo.x + hi.x) / 2
y = DESK_FRONT_Y - CHAIR_GAP + front_local * CHAIR_SCALE      # front edge -> DESK_FRONT_Y - CHAIR_GAP
x = cx_local * CHAIR_SCALE                                       # rotated: +cx -> -cx
chair.matrix_world = (Matrix.Translation((x, y, FLOOR_Z - lo.z * CHAIR_SCALE))
                      @ Matrix.Rotation(math.pi, 4, 'Z') @ Matrix.Scale(CHAIR_SCALE, 4))
bpy.context.view_layer.update()
blo, bhi = world_bbox(chair)

# seat and armrest heights (vertical rays in the chair's own frame, reported in BU and metres)
bvh = world_bvh(chair)
def top_at(x, y):
    h = bvh.ray_cast(Vector((x, y, 10.0)), Vector((0, 0, -1)))
    return h[0].z if h[0] else None
M = chair.matrix_world
seat_front = top_at(*(M @ Vector((0, lo.y + 0.12, 0)))[:2])
seat_low = min(z for z in (top_at(*(M @ Vector((0, yl, 0)))[:2]) for yl in [i * 0.05 - 1.0 for i in range(25)]) if z)
arm = top_at(*(M @ Vector((0.8, -0.3, 0)))[:2])

# ---------------------------------------------------------------- 3. clearance against the desk
desk = bpy.data.objects['Desk / light oak top']
dlo, dhi = world_bbox(desk)
overlap = all(blo[i] < dhi[i] and bhi[i] > dlo[i] for i in range(3))
touching = []
for o in bpy.data.objects:
    if o is chair or o.type != 'MESH' or o.hide_render or o.name == 'Central wool rug':
        continue
    olo, ohi = world_bbox(o)
    if all(blo[i] < ohi[i] and bhi[i] > olo[i] for i in range(3)):
        touching.append(o.name)

rep = {
    'removed_objects': sorted(removed),
    'lounge_chair': {
        'name': CHAIR,
        'location_bu': [round(v, 4) for v in chair.matrix_world.translation],
        'rotation_z_deg': 180.0,
        'scale': CHAIR_SCALE,
        'bbox_bu': {'min': [round(v, 4) for v in blo], 'max': [round(v, 4) for v in bhi]},
        'size_m': [round((bhi[i] - blo[i]) / 2, 3) for i in range(3)],
        'seat_front_top_bu': round(seat_front, 4), 'seat_front_top_m': round(seat_front / 2, 3),
        'seat_lowest_top_bu': round(seat_low, 4), 'seat_lowest_top_m': round(seat_low / 2, 3),
        'armrest_top_bu': round(arm, 4) if arm else None,
        'front_edge_y_bu': round(bhi.y, 4),
        'desk_bbox_overlap': overlap,
        'bbox_overlaps_other_objects': touching,
    },
}
log(json.dumps(rep, indent=1))
with open(os.path.join(ROOT, 'assets', '_local', 'desk-chair-report.json'), 'w') as f:
    json.dump(rep, f, indent=2)

bpy.context.preferences.filepaths.save_version = 0
bpy.ops.wm.save_mainfile()
log('saved', src)
