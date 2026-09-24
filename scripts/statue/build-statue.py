"""Build Nikhil's stylized, seated plaster statue for the portfolio room.

Run from the repository root (headless Blender 5.2):

  blender -b --factory-startup --python scripts/statue/build-statue.py

then optimise the exported GLB:

  bunx gltfpack@1.2.0 -i assets/_local/statue/statue-raw.glb -o public/journey/statue.glb -cc -noq

Optional review renders (Cycles, Metal) of the finished statue in the room:

  blender -b --factory-startup --python scripts/statue/render-statue.py

Inputs (read-only):
  assets/blender/human-anatomical-reference.glb   Blender Studio human base mesh (CC0)
  assets/_local/studio-clean.blend                room, for the chair/desk/floor fit

Outputs:
  assets/_local/statue/statue.blend   collection "Statue" (posed, applied, room coordinates)
  assets/_local/statue/statue-raw.glb unoptimised export (world placement, Y-up)
  assets/_local/statue/statue-report.json  placement, chair transform, clearances

No textures, photos or photo projections are used anywhere: the likeness is carried
only by proportions, the sculpted hair mass and the pose.

Coordinate notes: the build works in metres with Blender Z-up. The room file uses
half-metre units (2 BU = 1 m); the final mesh is scaled by 2 into room units.
Website (three.js) coordinates are three(x, y, z) = blender(x, z, -y).
"""
import bpy, bmesh, sys, math, json, time
import numpy as np
from mathutils import Vector, Matrix, Quaternion, Euler
from mathutils.bvhtree import BVHTree
from mathutils.kdtree import KDTree
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'assets/_local/statue'
OUT.mkdir(parents=True, exist_ok=True)
BASE_GLB = ROOT / 'assets/blender/human-anatomical-reference.glb'
ROOM = ROOT / 'assets/_local/studio-clean.blend'
ARGS = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
PREVIEW = '--preview' in ARGS          # quick workbench previews of intermediate stages
PREVIEW_DIR = Path(ARGS[ARGS.index('--preview-dir') + 1]) if '--preview-dir' in ARGS else OUT / 'wip'
STOP = ARGS[ARGS.index('--stop') + 1] if '--stop' in ARGS else ''

T0 = time.time()
def log(*a):
    print(f'[statue {time.time()-T0:6.1f}s]', *a, flush=True)

# ----------------------------------------------------------------------------
# Subject / placement parameters (metres, room frame = room BU / 2, Z-up)
# ----------------------------------------------------------------------------
HEIGHT = 1.81                  # standing height of the body without hair volume
UNIT = 2.0                     # room BU per metre
CHAIR_SHIFT = Vector((0.0, 0.19, 0.0))   # metres; whole chair moved toward the desk
SEAT_DROP = 0.05                          # metres; seat/back/arms lowered on the gas lift (base stays on the floor)
SEAT_TOP = 0.4857 - SEAT_DROP             # chair cushion crown (0.9715 BU before the drop)
BACKREST_Y = -0.8975 + CHAIR_SHIFT.y     # backrest front face (-1.795 BU) after the shift
DESK_TOP, DESK_UNDER, DESK_EDGE = 0.795, 0.735, -0.335
SCREEN = Vector((0.0, 0.2205, 0.9142))

P = dict(
    pelvis_y=-0.505,           # hips-bone head (pelvis pivot) in room y
    pelvis_tilt=-28.0,         # deg, negative = rolled back (posterior tilt)
    spine=(-22.0, -14.0, 0.0),  # lumbar, thoracic, chest pitch (deg, + = forward, world)
    neck=22.0, head=12.0,      # world pitch of neck/head bones (deg, + = forward)
    head_roll=3.0, head_yaw=-3.0,
    knee_x=0.135, ankle_x=0.15, ankle_fwd=0.07,   # leg placement
)

# ----------------------------------------------------------------------------
# Joint layout on the base mesh (base-mesh metres, centred on x, feet at z=0,
# figure faces -Y, character right = -X). Measured from cross-sections.
# ----------------------------------------------------------------------------
J = {
    'hips': ((0, 0.005, 0.90), (0, 0.005, 0.99)),
    'spine1': ((0, 0.005, 0.99), (0, 0.025, 1.12)),
    'spine2': ((0, 0.025, 1.12), (0, 0.040, 1.26)),
    'chest': ((0, 0.040, 1.26), (0, 0.020, 1.425)),
    'neck': ((0, 0.020, 1.425), (0, 0.000, 1.535)),
    'head': ((0, 0.000, 1.535), (0, 0.000, 1.70)),
    'clavicle.R': ((-0.025, -0.015, 1.405), (-0.165, 0.012, 1.385)),
    'upperarm.R': ((-0.180, 0.005, 1.360), (-0.284, 0.004, 1.095)),
    'forearm.R': ((-0.284, 0.004, 1.095), None),
    'forearm_tw.R': (None, (-0.362, -0.058, 0.885)),
    'thigh.R': ((-0.090, -0.005, 0.875), (-0.134, 0.012, 0.465)),
    'shin.R': ((-0.134, 0.012, 0.465), (-0.172, 0.050, 0.085)),
}
# finger guides in the (y, z) palm plane of the right hand: base -> tip
FINGER_GUIDE = {
    'thumb': ((-0.092, 0.866), (-0.180, 0.810)),
    'index': ((-0.148, 0.800), (-0.170, 0.745)),
    'middle': ((-0.126, 0.797), (-0.148, 0.721)),
    'ring': ((-0.104, 0.797), (-0.119, 0.713)),
    'pinky': ((-0.080, 0.803), (-0.063, 0.724)),
}
PARENT = {
    'hips': None, 'spine1': 'hips', 'spine2': 'spine1', 'chest': 'spine2', 'neck': 'chest', 'head': 'neck',
}

def V3(t):
    return Vector(t)

# ----------------------------------------------------------------------------
# helpers
# ----------------------------------------------------------------------------
def mesh_np(me):
    a = np.empty(len(me.vertices) * 3, dtype=np.float64)
    me.vertices.foreach_get('co', a)
    return a.reshape(-1, 3)

def set_np(me, co):
    me.vertices.foreach_set('co', co.astype(np.float64).ravel())
    me.update()

def adjacency(me):
    e = np.empty(len(me.edges) * 2, dtype=np.int64)
    me.edges.foreach_get('vertices', e)
    return e.reshape(-1, 2)

def laplacian(co, edges, weight, iters=10, lam=0.5, mu=-0.53):
    """Taubin smoothing, weighted per vertex (0 = locked)."""
    n = len(co)
    deg = np.bincount(edges.ravel(), minlength=n).astype(np.float64)
    deg[deg == 0] = 1
    w = weight[:, None]
    for it in range(iters):
        for f in (lam, mu):
            s = np.zeros_like(co)
            np.add.at(s, edges[:, 0], co[edges[:, 1]])
            np.add.at(s, edges[:, 1], co[edges[:, 0]])
            co = co + f * w * (s / deg[:, None] - co)
    return co

def vertex_normals(me):
    me.update()
    a = np.empty(len(me.vertices) * 3)
    # Blender 4.1+: normals on mesh.vertex_normals
    me.vertex_normals.foreach_get('vector', a)
    return a.reshape(-1, 3)

def smoothstep(e0, e1, x):
    t = np.clip((x - e0) / (e1 - e0), 0.0, 1.0)
    return t * t * (3 - 2 * t)

def seg_param(p, a, b):
    """param t (unclamped) and radial distance of points p to segment a->b"""
    a = np.asarray(a); b = np.asarray(b)
    d = b - a; L2 = d @ d
    t = ((p - a) @ d) / L2
    tc = np.clip(t, 0, 1)
    r = np.linalg.norm(p - (a + tc[:, None] * d), axis=1)
    return t, r

def new_collection(name):
    c = bpy.data.collections.new(name)
    bpy.context.scene.collection.children.link(c)
    return c

def rz180(v):
    return Vector((-v[0], -v[1], v[2]))

# ----------------------------------------------------------------------------
# 1. base mesh
# ----------------------------------------------------------------------------
def load_base():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=str(BASE_GLB))
    body = bpy.data.objects['GEO-body_male_realistic']
    eyes = [o for o in bpy.data.objects if o.type == 'MESH' and '.eye' in o.name]
    for o in [body] + eyes:
        mw = o.matrix_world.copy()
        o.parent = None
        o.data.transform(mw)
        o.matrix_world = Matrix.Identity(4)
    for o in list(bpy.data.objects):
        if o.type != 'MESH':
            bpy.data.objects.remove(o)
    co = mesh_np(body.data)
    cx = 0.5 * (co[:, 0].min() + co[:, 0].max())
    zmin = co[:, 2].min()
    k = HEIGHT / (co[:, 2].max() - zmin)
    M = Matrix.Scale(k, 4) @ Matrix.Translation((-cx, 0, -zmin))
    for o in [body] + eyes:
        o.data.transform(M)
    log('base mesh', len(body.data.vertices), 'verts, scale', round(k, 4))
    return body, eyes, k, cx, zmin

# ----------------------------------------------------------------------------
# 2. rig
# ----------------------------------------------------------------------------
def fit_fingers(co_base, side):
    """Fit finger centre lines on the base-frame hand. side=-1 right, +1 left."""
    xs = co_base[:, 0] * -side      # mirror left hand onto the right
    m = (xs < -0.30) & (co_base[:, 2] < 0.93)
    P = np.c_[xs[m], co_base[m, 1], co_base[m, 2]]
    yz = P[:, 1:]
    out = {}
    names = list(FINGER_GUIDE)
    params = []; dists = []
    for n in names:
        a, b = np.array(FINGER_GUIDE[n][0]), np.array(FINGER_GUIDE[n][1])
        t, r = seg_param(yz, a, b)
        params.append(t); dists.append(r)
    params = np.array(params); dists = np.array(dists)
    owner = np.argmin(dists, axis=0)
    for i, n in enumerate(names):
        lo = 0.45 if n == 'thumb' else 0.25
        sel = (owner == i) & (params[i] > lo) & (params[i] < 0.95) & (dists[i] < 0.013)
        t = params[i][sel]; Q = P[sel]
        A = np.c_[np.ones_like(t), t]
        coef, *_ = np.linalg.lstsq(A, Q, rcond=None)
        line = lambda s: coef[0] + coef[1] * s
        if n == 'thumb':
            ss = [0.0, 0.55, 0.78, 1.0]
        else:
            ss = [0.0, 0.47, 0.74, 1.0]
        pts = [line(s) for s in ss]
        # tip: pull back slightly inside the finger pad
        pts[-1] = pts[-2] + (pts[-1] - pts[-2]) * 0.92
        for p in pts:
            p[0] *= -side
        out[n] = [Vector(p) for p in pts]
    return out

def build_rig(body, eyes, k):
    co0 = mesh_np(body.data) / k        # back to base-mesh metres for the finger fit
    arm_data = bpy.data.armatures.new('StatueRig')
    rig = bpy.data.objects.new('StatueRig', arm_data)
    bpy.context.scene.collection.objects.link(rig)
    bpy.context.view_layer.objects.active = rig
    bpy.ops.object.mode_set(mode='EDIT')
    eb = arm_data.edit_bones
    S = lambda t: Vector(t) * k
    FWD = Vector((0, -1, 0))

    def add(name, head, tail, parent=None, connect=False, roll_vec=FWD):
        b = eb.new(name)
        b.head = head; b.tail = tail
        b.align_roll(roll_vec)
        if parent:
            b.parent = eb[parent]; b.use_connect = connect
        return b

    for n in ['hips', 'spine1', 'spine2', 'chest', 'neck', 'head']:
        h, t = J[n]
        add(n, S(h), S(t), PARENT[n], connect=(PARENT[n] not in (None, 'hips')) or n == 'spine1')
    for side, sfx in ((-1, '.R'), (1, '.L')):
        mir = lambda t: Vector((t[0] * -side * -1, t[1], t[2])) if False else Vector((-abs(t[0]) if side < 0 else abs(t[0]), t[1], t[2]))
        def M(t):
            return mir(t) * k
        ch, ct = J['clavicle.R']; add('clavicle' + sfx, M(ch), M(ct), 'chest')
        uh, ut = J['upperarm.R']; add('upperarm' + sfx, M(uh), M(ut), 'clavicle' + sfx)
        wrist = M(J['forearm_tw.R'][1]); elbow = M(ut)
        mid = elbow.lerp(wrist, 0.5)
        add('forearm' + sfx, elbow, mid, 'upperarm' + sfx, True)
        add('forearm_tw' + sfx, mid, wrist, 'forearm' + sfx, True)
        fingers = fit_fingers(co0, side)
        dorsal = Vector((side * 1.0, 0, 0)) * -1 if side < 0 else Vector((1, 0, 0))
        dorsal = Vector((-1, 0, 0)) if side < 0 else Vector((1, 0, 0))
        mcp_mid = fingers['middle'][0] * k
        add('hand' + sfx, wrist, mcp_mid, 'forearm_tw' + sfx, True, roll_vec=dorsal)
        for fn, pts in fingers.items():
            pts = [p * k for p in pts]
            prev = 'hand' + sfx
            for i in range(3):
                nm = f'{fn}{i+1}{sfx}'
                add(nm, pts[i], pts[i + 1], prev, i > 0, roll_vec=dorsal)
                prev = nm
        th, tt = J['thigh.R']; add('thigh' + sfx, M(th), M(tt), 'hips')
        sh, st = J['shin.R']; add('shin' + sfx, M(sh), M(st), 'thigh' + sfx, True)
        # foot: ankle -> ball of the foot (found from the sole)
        ankle = M(st)
        co = mesh_np(body.data)
        fm = (np.sign(co[:, 0]) == side) & (co[:, 2] < 0.06 * k)
        F = co[fm]
        front = F[np.argsort(F[:, 1])[:max(8, len(F) // 12)]]
        toe = Vector(front.mean(0)); toe.z = 0.03 * k
        ball = ankle.lerp(toe, 0.72); ball.z = 0.035 * k
        add('foot' + sfx, ankle, ball, 'shin' + sfx, True, roll_vec=Vector((0, 0, 1)))
        add('toe' + sfx, ball, toe, 'foot' + sfx, True, roll_vec=Vector((0, 0, 1)))
    bpy.ops.object.mode_set(mode='OBJECT')

    # automatic (bone heat) weights for the body
    bpy.ops.object.select_all(action='DESELECT')
    body.select_set(True); rig.select_set(True)
    bpy.context.view_layer.objects.active = rig
    bpy.ops.object.parent_set(type='ARMATURE_AUTO')
    missing = [v.index for v in body.data.vertices if not any(g.weight > 1e-4 for g in v.groups)]
    log('auto weights done; unweighted verts:', len(missing))
    for e in eyes:
        vg = e.vertex_groups.new(name='head'); vg.add(list(range(len(e.data.vertices))), 1.0, 'REPLACE')
        e.parent = rig
        mod = e.modifiers.new('Armature', 'ARMATURE'); mod.object = rig
    return rig

# ----------------------------------------------------------------------------
# 3. room references (chair, desk, floor, laptop) appended read-only
# ----------------------------------------------------------------------------
CHAIR_PARTS = ['Contoured seat', 'Contoured seat stitched piping', 'Contoured backrest',
               'Contoured backrest stitched piping', 'Seat mechanism', 'Gas lift', 'Backrest support',
               'Armrest support', 'Padded armrest', 'Backrest support.001', 'Armrest support.001',
               'Padded armrest.001', 'Cast aluminum spoke', 'Cast aluminum spoke.001', 'Cast aluminum spoke.002',
               'Cast aluminum spoke.003', 'Cast aluminum spoke.004'] + \
              [f'Dual caster wheel{s}' for s in ['', '.001', '.002', '.003', '.004', '.005', '.006', '.007', '.008', '.009']] + \
              [f'Caster fork{s}' for s in ['', '.001', '.002', '.003', '.004']]

CHAIR_BASE = [n for n in CHAIR_PARTS if n.startswith(('Cast aluminum', 'Dual caster', 'Caster fork'))]
CHAIR_UPPER = [n for n in CHAIR_PARTS if n not in CHAIR_BASE]

def load_room_refs():
    col = new_collection('RoomRef')
    with bpy.data.libraries.load(str(ROOM), link=False) as (src, dst):
        dst.collections = [c for c in src.collections if c in ('02 - Desk chair and props', 'Collection')]
    objs = []
    for c in dst.collections:
        for o in c.all_objects:
            if o.type == 'MESH' and not o.hide_render and o.name not in col.objects:
                col.objects.link(o); objs.append(o)
    for o in objs:
        if o.name in CHAIR_PARTS:
            d = CHAIR_SHIFT.copy()
            if o.name in CHAIR_UPPER:
                d.z -= SEAT_DROP
            o.matrix_world = Matrix.Translation(d * UNIT) @ o.matrix_world
    # the room is in BU; parent everything under an empty scaled 0.5 so we can work in metres
    root = bpy.data.objects.new('RoomRef_root', None); col.objects.link(root)
    root.scale = (1 / UNIT,) * 3
    for o in objs:
        if o.parent is None:
            o.parent = root
    bpy.context.view_layer.update()
    log('room refs', len(objs))
    return col, objs

def bvh_of(objs, owners=None):
    dg = bpy.context.evaluated_depsgraph_get()
    verts = []; polys = []
    for o in objs:
        if owners is not None: owners.append((len(polys), o.name))
        oe = o.evaluated_get(dg)
        me = oe.to_mesh()
        base = len(verts)
        mw = o.matrix_world
        verts += [mw @ v.co for v in me.vertices]
        polys += [[base + i for i in p.vertices] for p in me.polygons]
        oe.to_mesh_clear()
    return BVHTree.FromPolygons(verts, polys)

# ----------------------------------------------------------------------------
# 4. pose solve (explicit two-bone IK, twist distribution, finger curls)
# ----------------------------------------------------------------------------
def two_bone(a, target, l1, l2, pole):
    d = target - a
    L = min(d.length, (l1 + l2) * 0.999)
    u = d.normalized()
    x = (l1 * l1 - l2 * l2 + L * L) / (2 * L)
    h = math.sqrt(max(l1 * l1 - x * x, 1e-9))
    p = (pole - u * pole.dot(u)).normalized()
    return a + u * x + p * h, a + u * L

def mat_from(y, zhint, head):
    y = y.normalized()
    x = y.cross(zhint).normalized()
    z = x.cross(y)
    M = Matrix((x, y, z)).transposed().to_4x4()
    M.translation = head
    return M

def pose_rig(rig, t_room):
    """t_room: body->room translation (room = Rz180*body + t). Pose is written in body frame."""
    pb = rig.pose.bones
    arm = rig.data.bones
    for b in pb:
        b.rotation_mode = 'QUATERNION'
        b.matrix_basis = Matrix.Identity(4)
    upd = bpy.context.view_layer.update
    upd()
    to_body = lambda p: rz180(Vector(p) - t_room)
    dir_body = lambda d: rz180(Vector(d))

    def pitch_dir(deg):
        a = math.radians(deg)   # + = forward (body forward is -Y)
        return Vector((0, -math.sin(a), math.cos(a))), Vector((0, -math.cos(a), -math.sin(a)))

    def set_world(name, M):
        upd()
        b = pb[name]
        M = M.copy(); M.translation = b.head.copy() if arm[name].use_connect or True else M.translation
        b.matrix = M
        upd()

    # pelvis + spine (world pitch per bone)
    for name, deg in [('hips', P['pelvis_tilt']), ('spine1', P['spine'][0]), ('spine2', P['spine'][1]),
                      ('chest', P['spine'][2]), ('neck', P['neck'])]:
        y, z = pitch_dir(deg)
        set_world(name, mat_from(y, z, pb[name].head))
    y, z = pitch_dir(P['head'])
    R = Matrix.Rotation(math.radians(P['head_yaw']), 3, 'Z') @ Matrix.Rotation(math.radians(P['head_roll']), 3, y)
    set_world('head', mat_from(R @ y, R @ z, pb['head'].head))

    # ---------------- legs ----------------
    for side, sfx in ((-1, '.R'), (1, '.L')):
        # room: character right = +X (faces +Y). body right = -X.
        rs = -side   # room x sign for this leg
        hip = pb['thigh' + sfx].head.copy()
        l1 = arm['thigh' + sfx].length; l2 = arm['shin' + sfx].length
        hip_room = rz180(hip) + t_room
        ankle_room = Vector((rs * P['ankle_x'], 0, 0))
        # ankle above the floor: bone ankle height + shoe sole
        ankle_room.z = arm['shin' + sfx].tail_local.z + 0.028
        knee_guess_y = hip_room.y + 0.44
        ankle_room.y = knee_guess_y + P['ankle_fwd']
        pole_room = Vector((rs * 0.25, 1.0, 0.6))
        knee_r, ank_r = two_bone(hip_room, ankle_room, l1, l2, pole_room)
        knee = to_body(knee_r); ank = to_body(ank_r)
        tdir = knee - hip; sdir = ank - knee
        zt = -(sdir - tdir.normalized() * sdir.dot(tdir.normalized())).normalized()
        set_world('thigh' + sfx, mat_from(tdir, zt, hip))
        xs = pb['thigh' + sfx].matrix.to_3x3().col[0]
        set_world('shin' + sfx, mat_from(sdir, xs.cross(sdir.normalized()), knee))
        # foot keeps its rest orientation: the sole stays flat on the floor
        for fb in ('foot' + sfx, 'toe' + sfx):
            upd = bpy.context.view_layer.update; upd()
            M = arm[fb].matrix_local.copy(); M.translation = pb[fb].head.copy()
            pb[fb].matrix = M; upd()
    return pb

def pose_arm(rig, t_room, sfx, wrist_room, pole_room, hand_fwd_room, palm_n_room, clav=(0, 0), twist_split=(0.35, 0.8), elbow_hint=None):
    pb = rig.pose.bones; arm = rig.data.bones
    upd = bpy.context.view_layer.update
    to_body = lambda p: rz180(Vector(p) - t_room)
    dir_body = lambda d: rz180(Vector(d))
    # clavicle: elevate / protract (deg) about the chest frame
    c = pb['clavicle' + sfx]
    upd()
    cm = c.matrix.copy()
    elev, prot = clav
    ydir = cm.to_3x3().col[1]
    side = 1 if sfx == '.L' else -1
    R = Matrix.Rotation(math.radians(elev) * side, 3, Vector((0, 1, 0))) @ Matrix.Rotation(math.radians(prot) * -side, 3, Vector((0, 0, 1)))
    c.matrix = mat_from(R @ ydir, R @ cm.to_3x3().col[2], c.head.copy()); upd()
    S = pb['upperarm' + sfx].head.copy()
    l1 = arm['upperarm' + sfx].length
    l2 = arm['forearm' + sfx].length + arm['forearm_tw' + sfx].length
    W = to_body(wrist_room)
    pole = dir_body(pole_room) if elbow_hint is None else (to_body(elbow_hint) - S)
    E, W = two_bone(S, W, l1, l2, pole)
    udir = E - S; fdir = W - E
    zu = (fdir - udir.normalized() * fdir.dot(udir.normalized())).normalized()
    pb['upperarm' + sfx].matrix = mat_from(udir, zu, S); upd()
    X = pb['upperarm' + sfx].matrix.to_3x3().col[0]
    F0 = mat_from(fdir, X.cross(fdir.normalized()), E)          # forearm without twist
    # desired hand frame: Y along fingers, Z = dorsal (opposite the palm normal)
    hy = dir_body(hand_fwd_room).normalized()
    hz = -dir_body(palm_n_room).normalized()
    H = mat_from(hy, hz, W)
    # rest relation between forearm_tw and hand
    Rrel = (arm['forearm_tw' + sfx].matrix_local.to_3x3().inverted() @ arm['hand' + sfx].matrix_local.to_3x3())
    D = F0.to_3x3().inverted() @ H.to_3x3() @ Rrel.inverted()
    q = D.to_quaternion()
    tw = 2 * math.atan2(q.y, q.w)
    if tw > math.pi: tw -= 2 * math.pi
    if tw < -math.pi: tw += 2 * math.pi
    def twisted(frac, head):
        M = F0.to_3x3() @ Matrix.Rotation(tw * frac, 3, 'Y')
        M = M.to_4x4(); M.translation = head; return M
    pb['forearm' + sfx].matrix = twisted(twist_split[0], E); upd()
    pb['forearm_tw' + sfx].matrix = twisted(twist_split[1], pb['forearm_tw' + sfx].head.copy()); upd()
    Hm = H.copy(); Hm.translation = pb['hand' + sfx].head.copy()
    pb['hand' + sfx].matrix = Hm; upd()
    log(f'arm{sfx}: forearm twist {math.degrees(tw):.1f} deg; shoulder', tuple(round(v, 3) for v in (rz180(S) + t_room)),
        'elbow', tuple(round(v, 3) for v in (rz180(E) + t_room)), 'wrist', tuple(round(v, 3) for v in (rz180(W) + t_room)))
    return E, W

def curl_fingers(rig, sfx, curl, spread=0.5, thumb=(10, 10, 10)):
    """curl: (mcp, pip, dip) flexion degrees for the four fingers"""
    pb = rig.pose.bones; arm = rig.data.bones
    mid = arm['middle1' + sfx]
    for fn in ['index', 'middle', 'ring', 'pinky']:
        b1 = arm[fn + '1' + sfx]
        # spread: rotate toward the middle finger about the bone's own Z (dorsal) axis
        m_loc = b1.matrix_local.to_3x3().inverted() @ (mid.tail_local - mid.head_local).normalized()
        th = math.atan2(-m_loc.x, m_loc.y) * spread if fn != 'middle' else 0.0
        for i in range(3):
            b = pb[f'{fn}{i+1}{sfx}']
            q = Quaternion((1, 0, 0), -math.radians(curl[i] * (1.0 + 0.12 * ['index', 'middle', 'ring', 'pinky'].index(fn))))
            if i == 0:
                q = Quaternion((0, 0, 1), th) @ q
            b.rotation_quaternion = q
    for i in range(3):
        pb[f'thumb{i+1}{sfx}'].rotation_quaternion = Quaternion((1, 0, 0), -math.radians(thumb[i]))
    bpy.context.view_layer.update()

def world_co(o):
    dg = bpy.context.evaluated_depsgraph_get()
    oe = o.evaluated_get(dg); me = oe.to_mesh()
    co = mesh_np(me); oe.to_mesh_clear()
    M = np.array(o.matrix_world)
    return co @ M[:3, :3].T + M[:3, 3]

def report_pose(rig, body, eyes):
    ec = np.mean([world_co(e).mean(0) for e in eyes], axis=0)
    co = world_co(body)
    log('eye centre (m)', np.round(ec, 3), ' eye->screen', round(float(np.linalg.norm(ec - np.array(SCREEN))), 3),
        ' head top', round(float(co[:, 2].max()), 3))
    return ec

# ----------------------------------------------------------------------------
# preview helpers
# ----------------------------------------------------------------------------
def preview(name, objs_visible=None, views=('side', 'front34', 'top')):
    if not PREVIEW:
        return
    PREVIEW_DIR.mkdir(parents=True, exist_ok=True)
    s = bpy.context.scene
    s.render.engine = 'BLENDER_WORKBENCH'
    s.display.shading.light = 'STUDIO'; s.display.shading.color_type = 'OBJECT'
    s.display.shading.show_shadows = False
    s.render.resolution_x = 700; s.render.resolution_y = 700
    cam = bpy.data.objects.get('PreviewCam')
    if not cam:
        cd = bpy.data.cameras.new('PreviewCam'); cam = bpy.data.objects.new('PreviewCam', cd)
        s.collection.objects.link(cam)
    s.camera = cam
    cam.data.lens = 50
    tgt = Vector((0, -0.55, 0.75))
    views_def = {
        'side': Vector((2.4, -0.55, 0.8)),
        'front34': Vector((1.1, 0.9, 1.25)),
        'back34': Vector((1.2, -2.2, 1.5)),
        'top': Vector((0.01, -0.5, 3.2)),
        'front': Vector((0, 1.8, 1.0)),
    }
    for v in views:
        cam.data.type = 'PERSP'
        if v == 'sideortho':
            cam.data.type = 'ORTHO'; cam.data.ortho_scale = 1.7
            cam.location = Vector((3, -0.35, 0.72)); cam.rotation_euler = (math.pi / 2, 0, math.pi / 2)
        elif v in ('rhand', 'lhand', 'back34'):
            cam.data.lens = {'rhand': 70, 'lhand': 70, 'back34': 40}[v]
            cam.location, tg = {'rhand': (Vector((0.75, -0.75, 1.25)), Vector((0.3, -0.3, 0.83))),
                                'lhand': (Vector((-0.8, 0.05, 1.05)), Vector((-0.18, -0.35, 0.62))),
                                'back34': (Vector((1.3, -1.9, 1.5)), Vector((0, -0.5, 0.8)))}[v]
            cam.rotation_euler = (tg - cam.location).to_track_quat('-Z', 'Y').to_euler()
        elif v == 'head':
            cam.data.lens = 120
            cam.location = Vector((0.9, 0.9, 1.45)); tg = Vector((0, -0.5, 1.2))
            cam.rotation_euler = (tg - cam.location).to_track_quat('-Z', 'Y').to_euler()
        else:
            cam.location = views_def[v]
            cam.rotation_euler = (tgt - cam.location).to_track_quat('-Z', 'Y').to_euler()
        s.render.filepath = str(PREVIEW_DIR / f'{name}-{v}.png')
        bpy.ops.render.render(write_still=True)
    return
    for v in views:
        cam.location = views_def[v]
        cam.rotation_euler = (tgt - cam.location).to_track_quat('-Z', 'Y').to_euler()
        s.render.filepath = str(PREVIEW_DIR / f'{name}-{v}.png')
        bpy.ops.render.render(write_still=True)

# ----------------------------------------------------------------------------
# 5. topology prep: weld glTF seam splits, head weights, subdivide
# ----------------------------------------------------------------------------
def weld(obj):
    bm = bmesh.new(); bm.from_mesh(obj.data)
    n0 = len(bm.verts)
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-5)
    bm.to_mesh(obj.data); bm.free(); obj.data.update()
    log(f'welded {obj.name}: {n0} -> {len(obj.data.vertices)} verts')

def weights(obj, names):
    idx = {obj.vertex_groups[n].index: n for n in names if n in obj.vertex_groups}
    out = {n: np.zeros(len(obj.data.vertices)) for n in names}
    for v in obj.data.vertices:
        for g in v.groups:
            n = idx.get(g.group)
            if n: out[n][v.index] = g.weight
    return out

def group_sum(W, prefixes):
    return sum((a for n, a in W.items() if n.startswith(prefixes)), np.zeros(len(next(iter(W.values())))))

def fix_head_weights(body, rig, k):
    """Everything inside the skull (mouth bag, eye sockets) follows the head rigidly."""
    co = mesh_np(body.data)
    c = Vector((0, -0.02, 1.60)) * k
    d = np.linalg.norm(co - np.array(c), axis=1)
    jz = rig.data.bones['head'].head_local.z
    inner = (co[:, 2] > jz + 0.025 * k) & (d < 0.125 * k)
    ids = np.nonzero(inner)[0].tolist()
    for vg in body.vertex_groups:
        vg.remove(ids)
    body.vertex_groups['head'].add(ids, 1.0, 'REPLACE')
    log('head-locked verts', len(ids))

def subdivide(body):
    m = body.modifiers.new('Sub', 'SUBSURF'); m.levels = 1; m.render_levels = 1
    m.quality = 3
    bpy.context.view_layer.objects.active = body
    while body.modifiers[0] != m:
        bpy.ops.object.modifier_move_up(modifier=m.name)
    bpy.ops.object.modifier_apply(modifier=m.name)
    log('subdivided body:', len(body.data.vertices), 'verts')

# ----------------------------------------------------------------------------
# 6. clothing, sneakers (rest space, before posing)
# ----------------------------------------------------------------------------
def limb_axis(co, sel, a, b, nb=30):
    a = np.asarray(a); b = np.asarray(b)
    t, _ = seg_param(co, a, b)
    cen = np.zeros((nb, 3)); ts = (np.arange(nb) + 0.5) / nb
    for i in range(nb):
        m = sel & (t >= i / nb) & (t < (i + 1) / nb)
        cen[i] = co[m].mean(0) if m.sum() > 6 else a + (b - a) * ts[i]
    for _ in range(3):   # smooth the centre line
        cen[1:-1] = 0.25 * cen[:-2] + 0.5 * cen[1:-1] + 0.25 * cen[2:]
    def at(tt):
        tt = np.clip(tt, ts[0], ts[-1])
        return np.stack([np.interp(tt, ts, cen[:, j]) for j in range(3)], 1)
    return t, at

def dress(body, rig, k):
    me = body.data
    co = mesh_np(me); n = vertex_normals(me)
    edges = adjacency(me)
    bones = [b.name for b in rig.data.bones]
    W = weights(body, bones)
    B = rig.data.bones
    N = len(co)
    new = co.copy()
    region = np.zeros(N, dtype=np.int8)   # 0 skin, 1 shirt, 2 sleeve, 3 pants, 4 shoe
    info = {}
    for side, sfx in ((-1, '.R'), (1, '.L')):
        sgn = (np.sign(co[:, 0]) == side)
        w_up = W['upperarm' + sfx]; w_fa = W['forearm' + sfx] + W['forearm_tw' + sfx]
        w_hand = group_sum({n: a for n, a in W.items() if n.endswith(sfx)}, ('hand', 'thumb', 'index', 'middle', 'ring', 'pinky'))
        w_leg = W['thigh' + sfx] + W['shin' + sfx]
        w_foot = W['foot' + sfx] + W['toe' + sfx]
        S = np.array(B['upperarm' + sfx].head_local); E = np.array(B['upperarm' + sfx].tail_local)
        Wr = np.array(B['forearm_tw' + sfx].tail_local)
        armsel = sgn & ((w_up + w_fa + w_hand) > 0.5)
        tu, cu = limb_axis(co, armsel & (w_up >= w_fa), S, E)
        tf, cf = limb_axis(co, armsel & (w_fa > w_up) & (w_hand < 0.5), E, Wr)
        # --- hands stay skin beyond the cuff
        hand = armsel & (tf > 0.965) & (w_fa + w_hand > w_up)
        sleeve = armsel & ~hand
        region[sleeve] = 2
        # upper arm: loose tube
        up = sleeve & (w_up >= w_fa)
        c = cu(tu[up]); r = co[up] - c; rl = np.linalg.norm(r, axis=1)
        blend = smoothstep(0.05, 0.3, tu[up])        # merge into the torso near the armpit
        rt = np.maximum(rl + 0.009, 0.052 * blend + (rl + 0.009) * (1 - blend))
        new[up] = c + r / rl[:, None] * rt[:, None]
        fa = sleeve & (w_up < w_fa)
        t = tf[fa]; c = cf(t); r = co[fa] - c; rl = np.linalg.norm(r, axis=1)
        rmin = np.interp(t, [0, 0.55, 0.74, 0.8, 0.86, 1.0], [0.050, 0.047, 0.046, 0.044, 0.0, 0.0])
        off = np.interp(t, [0, 0.8, 0.84, 0.94, 0.965], [0.009, 0.009, 0.006, 0.006, 0.0075])
        rt = np.maximum(rl + off, rmin)
        new[fa] = c + r / rl[:, None] * rt[:, None]
        info['cuff' + sfx] = (fa, t)
        # --- legs
        H = np.array(B['thigh' + sfx].head_local); K = np.array(B['thigh' + sfx].tail_local)
        A = np.array(B['shin' + sfx].tail_local)
        legsel = sgn & (w_leg > 0.35) & (co[:, 2] > 0.078 * k)
        tt, ct = limb_axis(co, legsel & (W['thigh' + sfx] >= W['shin' + sfx]), H, K)
        ts, cs = limb_axis(co, legsel & (W['shin' + sfx] > W['thigh' + sfx]), K, A)
        th = legsel & (W['thigh' + sfx] >= W['shin' + sfx]) & (tt > 0.2)
        c = ct(tt[th]); r = co[th] - c; rl = np.linalg.norm(r, axis=1)
        rt = np.maximum(rl + 0.008, np.interp(tt[th], [0.2, 0.7, 1.0], [0.0, 0.066, 0.064]))
        new[th] = c + r / rl[:, None] * rt[:, None]
        sh = legsel & (W['shin' + sfx] > W['thigh' + sfx])
        c = cs(ts[sh]); r = co[sh] - c; rl = np.linalg.norm(r, axis=1)
        rt = np.maximum(rl + 0.007, np.interp(ts[sh], [0, 0.3, 0.8, 1.0], [0.062, 0.060, 0.059, 0.061]))
        new[sh] = c + r / rl[:, None] * rt[:, None]
        region[th | sh] = 3
        info['shin' + sfx] = (sh, ts[sh])
        # --- feet -> sneakers
        foot = sgn & ((w_foot > 0.3) | (co[:, 2] < 0.078 * k)) & ~(sh & (co[:, 2] > 0.078 * k))
        region[foot] = 4
    # torso: shirt above the hem, trousers below
    torso = region == 0
    head_neck = (W['head'] + W['neck']) > 0.5
    z = co[:, 2]; y = co[:, 1]
    zc = (1.418 + 0.30 * (y - (-0.02))) * k          # crew neckline, dips at the front
    hem = 0.885 * k
    shirt = torso & (z < zc) & (z > hem) & ~((W['head']) > 0.5)
    shirt |= torso & (z < zc) & (z > hem) & (np.abs(co[:, 0]) > 0.09 * k)
    shirt &= ~(head_neck & (z > zc))
    pants = torso & (z <= hem) & (co[:, 2] > 0.3 * k)
    region[shirt] = 1; region[pants & ~shirt] = 3
    # shirt offset: a loose sweatshirt, roomier over the belly
    off = np.where(region == 1, 0.015 + 0.007 * smoothstep(1.20 * k, 0.97 * k, z), 0.0)
    new[region == 1] = co[region == 1] + n[region == 1] * off[region == 1, None]
    tor_p = pants & (region == 3)
    new[tor_p] = co[tor_p] + n[tor_p] * 0.008
    # feet: tuck the bare foot slightly inward; the sneaker shell is a separate volume
    shoe = region == 4
    new[shoe] = co[shoe] - n[shoe] * 0.004
    # cloth bridges concavities (under the pecs, spine groove, crotch, knee pits):
    # push the garment out to a heavily relaxed copy of itself wherever that lies outside
    gw = np.isin(region, (1, 2, 3)).astype(float)
    relaxed = laplacian(new, edges, gw, iters=45, lam=0.5, mu=0.5)
    dn = np.maximum(((relaxed - new) * n).sum(1), 0.0)
    dn = np.minimum(dn, 0.03)
    new = new + n * (dn * gw)[:, None]
    # hide anatomy under the cloth: keep only ~15 % of the convex relief (pecs, nipples, glutes, groin)
    torso_w = (np.isin(region, (1, 3)) & (co[:, 2] > 0.62 * k) & ~((region == 3) & (np.abs(co[:, 0]) > 0.16 * k))).astype(float)
    low = laplacian(new, edges, torso_w, iters=70, lam=0.5, mu=0.5)
    D = ((new - low) * n).sum(1)
    keep = np.where(D > 0, 0.15, 1.0)
    new = new - n * ((D * (1 - keep)) * torso_w)[:, None]
    new = laplacian(new, edges, gw * 0.8, iters=10)
    # soften the stair-stepped hem lines (region borders)
    border = np.zeros(N, bool)
    diff = region[edges[:, 0]] != region[edges[:, 1]]
    border[edges[diff].ravel()] = True
    for _ in range(2):
        nb = border.copy(); nb[edges[border[edges[:, 0]], 1]] = True; nb[edges[border[edges[:, 1]], 0]] = True; border = nb
    new = laplacian(new, edges, border * 0.5, iters=4)
    set_np(me, new)
    reg = me.attributes.new('garment', 'INT', 'POINT'); reg.data.foreach_set('value', region.astype(np.int32))
    rest = me.attributes.new('rest_co', 'FLOAT_VECTOR', 'POINT'); rest.data.foreach_set('vector', co.ravel())
    log('dressed: shirt', int((region == 1).sum()), 'sleeve', int((region == 2).sum()), 'pants', int((region == 3).sum()), 'shoe', int(shoe.sum()))
    return region

# ----------------------------------------------------------------------------
# 7. sculpted hair mass (metaball locks grown on the scalp)
# ----------------------------------------------------------------------------
def metaball_to_object(mb, name, rig, group):
    ob = bpy.data.objects.new(name + 'MB', mb); bpy.context.scene.collection.objects.link(ob)
    bpy.context.view_layer.update()
    dg = bpy.context.evaluated_depsgraph_get()
    me = bpy.data.meshes.new_from_object(ob.evaluated_get(dg))
    bpy.data.objects.remove(ob); bpy.data.metaballs.remove(mb)
    o = bpy.data.objects.new(name, me); bpy.context.scene.collection.objects.link(o)
    vg = o.vertex_groups.new(name=group); vg.add(list(range(len(me.vertices))), 1.0, 'REPLACE')
    o.parent = rig
    m = o.modifiers.new('Armature', 'ARMATURE'); m.object = rig
    return o

def remesh_obj(o, voxel, smooth_iters=0):
    m = o.modifiers.new('R', 'REMESH'); m.mode = 'VOXEL'; m.voxel_size = voxel; m.adaptivity = 0
    bpy.context.view_layer.objects.active = o
    bpy.ops.object.modifier_apply(modifier=m.name)
    if smooth_iters:
        sm = o.modifiers.new('S', 'LAPLACIANSMOOTH'); sm.iterations = smooth_iters; sm.lambda_factor = 0.5
        sm.use_volume_preserve = True
        bpy.ops.object.modifier_apply(modifier=sm.name)

def grow_hair(body, rig, k, seed=11):
    """Sculpted hair: a continuous wavy mass, tapered locks at the hairline, carved lock grooves."""
    rng = np.random.default_rng(seed)
    me = body.data
    co = np.empty(len(me.vertices) * 3); me.attributes['rest_co'].data.foreach_get('vector', co); co = co.reshape(-1, 3)
    n = vertex_normals(me)
    bvh = BVHTree.FromPolygons([Vector(p) for p in co], [list(p.vertices) for p in me.polygons])
    W = weights(body, ['head'])
    C = np.array([0, -0.005, 1.600]) * k
    d = co - C; dist = np.linalg.norm(d, axis=1)
    u = d / dist[:, None]
    az = np.degrees(np.arctan2(u[:, 0], -u[:, 1]))
    el = np.degrees(np.arcsin(np.clip(u[:, 2], -1, 1)))
    line = np.interp(np.abs(az), [0, 25, 45, 70, 95, 115, 150, 180], [31, 27, 20, 14, 13, 4, -20, -30])
    scalp = (W['head'] > 0.9) & (el > line) & (dist < 0.14 * k) & (n[:, 2] > -0.6)
    idx = np.nonzero(scalp)[0]
    kd = KDTree(len(idx))
    for j, i in enumerate(idx): kd.insert(co[i], j)
    kd.balance()
    taken = np.zeros(len(idx), bool); blocked = np.zeros(len(idx), bool)
    for j in rng.permutation(len(idx)):
        if blocked[j]: continue
        taken[j] = True
        for (_, jj, _) in kd.find_range(co[idx[j]], 0.009 * k): blocked[jj] = True
    roots = idx[taken]
    eye_z = 1.574 * k
    crown = np.array([0, 0.06, 1.70]) * k
    R = lambda rendered: rendered / 0.58          # metaball radius for a wanted isolated radius

    def outside(p, clear):
        loc, nor, fi, dd = bvh.find_nearest(Vector(p))
        if (Vector(p) - loc).dot(nor) < clear:
            return np.array(loc + nor * clear)
        return p

    def flow_at(p, nn):
        f = p - crown; f = f - nn * f.dot(nn); f /= np.linalg.norm(f) + 1e-9
        q = (p - C) / (np.linalg.norm(p - C) + 1e-9)
        a = abs(math.degrees(math.atan2(q[0], -q[1]))); e = math.degrees(math.asin(max(-1, min(1, q[2]))))
        wf = float(smoothstep(60, 30, a) * smoothstep(60, 20, e))
        f = f + wf * np.array([0.5, -0.35, -0.8]) * 1.5
        f = f - nn * f.dot(nn)
        return f / (np.linalg.norm(f) + 1e-9)

    def thick(i):
        a = abs(az[i]); e = el[i]
        top = smoothstep(0, 50, e)
        edge = 0.3 + 0.7 * smoothstep(line[i], line[i] + 18, e)
        T = (0.018 + 0.030 * top) * edge
        if a < 50 and e < 50: T = max(T, 0.028 * edge)
        if a > 125 and e < 15: T *= 0.85
        return T

    mb = bpy.data.metaballs.new('HairMB'); mb.resolution = 0.0035; mb.render_resolution = 0.0035; mb.threshold = 0.6
    for i in roots:
        T = thick(i)
        el_ = mb.elements.new(); el_.co = Vector(co[i] + n[i] * T * 0.3); el_.radius = R(0.55 * T + 0.003)
    # large irregular waves in the volume
    for i in rng.choice(roots, size=min(28, len(roots)), replace=False):
        T = thick(i)
        el_ = mb.elements.new(); el_.co = Vector(co[i] + n[i] * T * 0.55); el_.radius = R(0.55 * T + 0.004)
    # tapered locks spilling over the hairline (fringe, temples, nape)
    # rolled fringe: the front edge of the mass spills forward and down over the forehead
    for i in roots:
        a = abs(az[i])
        if a < 60 and el[i] < line[i] + 20:
            T = thick(i)
            f = flow_at(co[i], n[i])
            spill = (1 - smoothstep(35, 60, a)) * (0.004 + 0.026 * rng.random() ** 1.5)
            p = outside(co[i] + n[i] * T * 0.45 + f * spill, 0.004 + 0.4 * T)
            if p[2] < eye_z + 0.045 * k: continue
            el_ = mb.elements.new(); el_.co = Vector(p); el_.radius = R(0.55 * T + 0.004)
            q = outside(co[i] + n[i] * T * 0.45 + f * spill * 0.5, 0.004 + 0.4 * T)
            el_ = mb.elements.new(); el_.co = Vector(q); el_.radius = R(0.55 * T + 0.004)
    edge_roots = [i for i in roots if el[i] < line[i] + 14 and abs(az[i]) > 130]
    for i in edge_roots:
        p0 = co[i]; nn = n[i]; a = abs(az[i]); T = thick(i)
        L = (0.035 + 0.025 * rng.random()) * (1.2 if a < 50 else 0.8)
        ph = rng.random() * 6.283; amp = 0.004 + 0.003 * rng.random()
        r0 = 0.40 * max(T, 0.018) + 0.004
        p = p0 + nn * T * 0.5
        for s_ in range(12):
            f = s_ / 11
            fl = flow_at(p, nn)
            side = np.cross(nn, fl)
            p = p + fl * (L / 11) + side * amp * math.cos(ph + f * 5) * 0.35
            p = outside(p, 0.003 + r0 * (1 - f) * 0.7)
            if a < 50 and p[2] < eye_z + 0.040 * k: break
            if 50 <= a < 125 and p[2] < eye_z + 0.018 * k: break
            if a >= 125 and p[2] < eye_z - 0.07 * k: break
            el_ = mb.elements.new(); el_.co = Vector(p); el_.radius = R(r0 * (1.0 - 0.45 * f * f))
    hair = metaball_to_object(mb, 'Hair', rig, 'head')
    for m in list(hair.modifiers): hair.modifiers.remove(m)
    remesh_obj(hair, 0.0022, smooth_iters=4)
    # carve lock grooves along the flow field
    hm = hair.data
    hco = mesh_np(hm); hn = vertex_normals(hm)
    hb = BVHTree.FromPolygons([Vector(p) for p in hco], [list(p.vertices) for p in hm.polygons])
    samples = []; wts = []
    seeds = hco[rng.choice(len(hco), size=900, replace=False)]
    # keep seeds on the outer shell and spaced
    sk = KDTree(len(seeds))
    for j, q in enumerate(seeds): sk.insert(q, j)
    sk.balance()
    used = np.zeros(len(seeds), bool); chosen = []
    for j in rng.permutation(len(seeds)):
        if used[j]: continue
        chosen.append(j)
        for (_, jj, _) in sk.find_range(seeds[j], 0.022): used[jj] = True
    for j in chosen:
        p = seeds[j].copy(); ph = rng.random() * 6.283
        nsteps = int(13 + rng.integers(0, 9))
        pts = []
        for s_ in range(nsteps):
            loc, nor, fi, dd = hb.find_nearest(Vector(p))
            nn = np.array(nor); p = np.array(loc)
            if (p - C).dot(nn) < 0: nn = -nn
            fl = flow_at(p, nn)
            side = np.cross(nn, fl)
            ang = 0.5 * math.sin(ph + s_ * 0.55)
            p = p + (fl * math.cos(ang) + side * math.sin(ang)) * 0.005
            pts.append(p.copy())
        for s_, q in enumerate(pts):
            samples.append(q); wts.append(math.sin(math.pi * (s_ + 0.5) / len(pts)) ** 0.6)
    tk = KDTree(len(samples))
    for j, q in enumerate(samples): tk.insert(q, j)
    tk.balance()
    disp = np.zeros(len(hco))
    width = 0.0062
    for vi, q in enumerate(hco):
        best = 0.0
        for (qq, j, dd) in tk.find_range(q, width * 2.5):
            best = max(best, wts[j] * math.exp(-(dd / width) ** 2))
        disp[vi] = best
    # grooves only on the outer surface, shallower near the hairline
    depth = 0.0062
    set_np(hm, hco - hn * (disp * depth)[:, None])
    sm = hair.modifiers.new('S', 'LAPLACIANSMOOTH'); sm.iterations = 3; sm.lambda_factor = 0.5; sm.use_volume_preserve = True
    bpy.context.view_layer.objects.active = hair; bpy.ops.object.modifier_apply(modifier=sm.name)
    hair.vertex_groups.clear()
    vg = hair.vertex_groups.new(name='head'); vg.add(list(range(len(hm.vertices))), 1.0, 'REPLACE')
    m = hair.modifiers.new('Armature', 'ARMATURE'); m.object = rig
    log('hair: roots', len(roots), 'edge locks', len(edge_roots), 'grooves', len(chosen), 'verts', len(hm.vertices))
    return hair

def hull2d(P):
    P = sorted(map(tuple, P))
    def cross(o, a, b): return (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0])
    lo, up = [], []
    for p in P:
        while len(lo) >= 2 and cross(lo[-2], lo[-1], p) <= 0: lo.pop()
        lo.append(p)
    for p in reversed(P):
        while len(up) >= 2 and cross(up[-2], up[-1], p) <= 0: up.pop()
        up.append(p)
    return np.array(lo[:-1] + up[:-1])

def make_sole(F, name, bottom=-0.026, top=0.008, grow=0.009, nseg=72):
    H = hull2d(F[F[:, 2] < 0.03][:, :2])
    # resample the hull evenly, push outward, round the corners
    seg = np.r_[H, H[:1]]; L = np.r_[0, np.cumsum(np.linalg.norm(np.diff(seg, axis=0), axis=1))]
    t = np.linspace(0, L[-1], nseg, endpoint=False)
    P = np.c_[np.interp(t, L, seg[:, 0]), np.interp(t, L, seg[:, 1])]
    c = P.mean(0)
    for _ in range(6):
        P = 0.5 * P + 0.25 * (np.roll(P, 1, 0) + np.roll(P, -1, 0))
    tang = np.roll(P, -1, 0) - np.roll(P, 1, 0)
    nrm = np.c_[tang[:, 1], -tang[:, 0]]; nrm /= np.linalg.norm(nrm, axis=1)[:, None]
    if ((P - c) * nrm).sum(1).mean() < 0: nrm = -nrm
    P = P + nrm * grow
    bm = bmesh.new()
    bot = [bm.verts.new((x, y, bottom)) for x, y in P]
    tp = [bm.verts.new((x, y, top)) for x, y in P]
    bm.faces.new(bot[::-1]); bm.faces.new(tp)
    for i in range(nseg):
        j = (i + 1) % nseg
        bm.faces.new((bot[i], bot[j], tp[j], tp[i]))
    me = bpy.data.meshes.new(name); bm.to_mesh(me); bm.free()
    o = bpy.data.objects.new(name, me); bpy.context.scene.collection.objects.link(o)
    bv = o.modifiers.new('B', 'BEVEL'); bv.width = 0.006; bv.segments = 4; bv.limit_method = 'ANGLE'
    bpy.context.view_layer.objects.active = o
    bpy.ops.object.modifier_apply(modifier=bv.name)
    return o

def make_sneakers(body, rig, k):
    me = body.data
    co = np.empty(len(me.vertices) * 3); me.attributes['rest_co'].data.foreach_get('vector', co); co = co.reshape(-1, 3)
    shoes = []
    for side, sfx in ((-1, '.R'), (1, '.L')):
        F = co[(np.sign(co[:, 0]) == side) & (co[:, 2] < 0.10 * k)]
        lowF = F[F[:, 2] < 0.035]
        heel = lowF[np.argmax(lowF[:, 1])].copy(); toe = lowF[np.argmin(lowF[:, 1])].copy()
        L = np.linalg.norm((toe - heel)[:2])
        fwd = np.r_[(toe - heel)[:2] / L, 0]
        wid = np.array([fwd[1], -fwd[0], 0.0])
        # centre the width on the forefoot / heel material
        def at(f, z, dx=0.0):
            q = heel + fwd * (L * f) + wid * dx
            q[2] = z
            return Vector(q)
        rot = Vector((0, 1, 0)).rotation_difference(Vector(fwd))
        mb = bpy.data.metaballs.new('ShoeMB' + sfx); mb.resolution = 0.004; mb.render_resolution = 0.004; mb.threshold = 0.6
        def elem(kind, p, r, size=(1, 1, 1)):
            e = mb.elements.new(type=kind); e.co = p; e.radius = r; e.rotation = rot
            if kind in ('ELLIPSOID', 'CUBE'):
                e.size_x, e.size_y, e.size_z = size
            return e
        # find the mean x of the foot along its length to follow its outline
        def cx(f):
            q = heel + fwd * (L * f)
            m = np.abs((F[:, :2] - q[:2]) @ fwd[:2]) < 0.02
            return 0.0 if m.sum() < 4 else float(((F[m] - q) @ wid).mean())
        def ell(p, half, R=0.1):   # isolated metaball renders at ~0.58 * radius
            return elem('ELLIPSOID', p, R, tuple(h / (0.58 * R) for h in half))
        g = 0.95
        ell(at(0.14, 0.040, cx(0.14)), (0.045 * g, 0.058 * g, 0.052 * g))
        ell(at(0.42, 0.040, cx(0.42)), (0.050 * g, 0.080 * g, 0.050 * g))
        ell(at(0.68, 0.026, cx(0.68)), (0.052 * g, 0.070 * g, 0.036 * g))
        ell(at(0.88, 0.016, cx(0.88)), (0.046 * g, 0.052 * g, 0.028 * g))
        ank = rig.data.bones['foot' + sfx].head_local
        ell(Vector((ank.x, ank.y + 0.008, 0.078)), (0.044 * g, 0.050 * g, 0.032 * g))
        upper = metaball_to_object(mb, 'Sneaker' + sfx, rig, 'foot' + sfx)
        sole = make_sole(F, 'Sole' + sfx)
        for m in list(upper.modifiers): upper.modifiers.remove(m)
        upper.vertex_groups.clear()
        bpy.ops.object.select_all(action='DESELECT')
        upper.select_set(True); sole.select_set(True); bpy.context.view_layer.objects.active = upper
        bpy.ops.object.join()
        remesh_obj(upper, 0.003, smooth_iters=2)
        vg = upper.vertex_groups.new(name='foot' + sfx); vg.add(list(range(len(upper.data.vertices))), 1.0, 'REPLACE')
        m = upper.modifiers.new('Armature', 'ARMATURE'); m.object = rig
        shoes.append(upper)
    log('sneakers', [len(o.data.vertices) for o in shoes])
    return shoes

# ----------------------------------------------------------------------------
# 8. bake the pose, fit against chair / desk / floor
# ----------------------------------------------------------------------------
def bake_pose(objs):
    """Apply armature (and parent) so every mesh holds final room-metre coordinates."""
    dg = bpy.context.evaluated_depsgraph_get()
    for o in objs:
        oe = o.evaluated_get(dg)
        co = mesh_np(oe.to_mesh()); oe.to_mesh_clear()
        M = np.array(o.matrix_world)
        co = co @ M[:3, :3].T + M[:3, 3]
        for m in list(o.modifiers): o.modifiers.remove(m)
        o.parent = None; o.matrix_world = Matrix.Identity(4)
        set_np(o.data, co)
        for vg in list(o.vertex_groups): o.vertex_groups.remove(vg)

class Obstacles:
    """Per-object BVHs with a ray-parity inside test (robust to flipped normals)."""
    def __init__(self, objs):
        self.items = []
        for o in objs:
            bvh = bvh_of([o])
            pts = np.array([o.matrix_world @ Vector(c) for c in o.bound_box])
            self.items.append((o.name, bvh, pts.min(0), pts.max(0)))

    @staticmethod
    def _inside(bvh, p):
        hits = 0; q = Vector(p); d = Vector((0.0123, 0.0071, 1.0)).normalized()
        for _ in range(12):
            loc, nor, fi, dist = bvh.ray_cast(q, d)
            if loc is None: break
            hits += 1; q = loc + d * 1e-5
        return hits % 2 == 1

    def penetrations(self, co, pad=0.0):
        """yields (vertex index, object name, nearest surface point)"""
        for name, bvh, lo, hi in self.items:
            cand = np.nonzero(np.all((co > lo - 0.01) & (co < hi + 0.01), axis=1))[0]
            for i in cand:
                if self._inside(bvh, co[i]):
                    loc, nor, fi, dist = bvh.find_nearest(Vector(co[i]))
                    yield i, name, np.array(loc)

def resolve_collisions(obj, obstacles, margin=0.0025, iters=4):
    obs = obstacles if isinstance(obstacles, Obstacles) else Obstacles(obstacles)
    me = obj.data
    edges = adjacency(me)
    N = len(me.vertices)
    for it in range(iters):
        co = mesh_np(me)
        disp = np.zeros_like(co); hit = np.zeros(N, bool); who = {}
        for i, name, loc in obs.penetrations(co):
            d = loc - co[i]; l = np.linalg.norm(d) + 1e-12
            disp[i] = d + d / l * margin; hit[i] = True
            who[name] = who.get(name, 0) + 1
        log(f'collision pass {it}: {int(hit.sum())} verts inside', who)
        if not hit.any(): break
        # move the penetrating skin out, then relax a small neighbourhood so contacts flatten smoothly
        new = co + disp
        ring = hit.copy()
        for _ in range(3):
            nb = ring.copy(); nb[edges[ring[edges[:, 0]], 1]] = True; nb[edges[ring[edges[:, 1]], 0]] = True; ring = nb
        w = (ring & ~hit).astype(float) * 0.8
        new = laplacian(new, edges, w, iters=3)
        set_np(me, new)
    return obs

def floor_clamp(obj):
    co = mesh_np(obj.data)
    low = co[:, 2] < 0.0
    co[low, 2] = 0.0
    set_np(obj.data, co)
    return int(low.sum())

def add_folds(body, region, k):
    """Posed-space cloth pass: relax pose artefacts under the cloth, then sculpt soft folds.
    Fold patterns are laid out in rest coordinates (stored as 'rest_co') so they follow the body."""
    me = body.data
    co = mesh_np(me)
    edges = adjacency(me)
    N = len(co)
    rest = np.empty(N * 3); me.attributes['rest_co'].data.foreach_get('vector', rest); rest = rest.reshape(-1, 3)
    # distance (in edge rings) from any garment border, so hems/cuffs/collar stay crisp
    border = np.zeros(N, bool)
    diff = region[edges[:, 0]] != region[edges[:, 1]]
    border[edges[diff].ravel()] = True
    ring = border.copy(); dist = np.where(border, 0, 99)
    for r in range(1, 7):
        nb = ring.copy(); nb[edges[ring[edges[:, 0]], 1]] = True; nb[edges[ring[edges[:, 1]], 0]] = True
        dist[nb & ~ring] = r; ring = nb
    gw = np.select([region == 1, region == 2, region == 3], [1.0, 0.8, 0.6], 0.0) * np.clip(dist / 6.0, 0, 1)
    co = laplacian(co, edges, gw, iters=15)
    set_np(me, co)
    n = vertex_normals(me)
    # thick fleece hides anatomy: strip most of the local relief (not the overall volume) under the shirt
    fw = np.select([region == 1, region == 2], [1.0, 0.7], 0.0) * np.clip(dist / 5.0, 0, 1)
    low = laplacian(co, edges, (region > 0).astype(float), iters=60, lam=0.5, mu=0.5)
    D = ((co - low) * n).sum(1)
    Dlow = laplacian(D[:, None].repeat(3, 1), edges, (region > 0).astype(float), iters=80, lam=0.5, mu=0.5)[:, 0]
    rel = D - Dlow
    co = co - n * (np.where(rel > 0, 0.8, 0.6) * rel * fw)[:, None]
    co = laplacian(co, edges, fw * 0.7, iters=6)
    set_np(me, co)
    n = vertex_normals(me)
    x = rest[:, 0] / k; y = rest[:, 1] / k; z = rest[:, 2] / k   # base-mesh units for the layouts below
    d = np.zeros(N)
    gauss = lambda u, w: np.exp(-(u / w) ** 2)
    # rib bands: rolled crew collar, waist band with a lip, cuffs; each set off by a carved seam line
    zc = 1.418 + 0.30 * (y + 0.02); cz = 0.022
    m = region == 1
    band = m & (z > zc - cz)
    d += band * 0.0065 * np.sin(np.pi * np.clip((z - (zc - cz)) / cz, 0, 1)) ** 0.6
    d -= m * 0.0032 * gauss(z - (zc - cz), 0.0035)
    hem = 0.885
    d += m * 0.005 * smoothstep(hem + 0.016, hem + 0.008, z)
    d -= m * 0.003 * gauss(z - (hem + 0.052), 0.0035)
    for sx in (-1, 1):
        E = np.array([0.284 * sx, 0.004, 1.095]); W = np.array([0.362 * sx, -0.058, 0.885])
        t, _ = seg_param(np.c_[x, y, z], E, W)
        m2 = (region == 2) & (np.sign(x) == sx)
        d += m2 * 0.003 * smoothstep(0.86, 0.875, t)
        d -= m2 * 0.003 * gauss(t - 0.862, 0.016)
    # trouser hems: a turned edge just above the shoe
    m3 = region == 3
    d += m3 * 0.003 * smoothstep(0.1, 0.09, z) * (z > 0.05)
    det = d.copy(); d = np.zeros(N)
    log('details: collar band verts', int(band.sum()), 'det>3mm', int((det > 0.003).sum()), 'det<-2mm', int((det < -0.002).sum()))
    ridge = lambda ph: np.maximum(np.sin(ph), 0) ** 1.4 - 0.25 * np.maximum(-np.sin(ph), 0)
    # sweatshirt: horizontal belly folds from the slumped posture, undulating across the front
    m = region == 1
    env = smoothstep(0.93, 0.99, z) * smoothstep(1.17, 1.08, z) * smoothstep(0.0, -0.07, y) * smoothstep(0.15, 0.08, np.abs(x))
    d += m * env * 0.009 * ridge((z - 0.95) / 0.045 * 6.283 + 1.6 * np.sin(x * 22 + 0.7))
    # diagonal drag folds from the armpits toward the sternum (arms forward)
    for sx in (-1, 1):
        u = (np.abs(x) * 0.8 + (1.33 - z) * 0.6)
        env = (np.sign(x) == sx) * smoothstep(1.02, 1.12, z) * smoothstep(1.34, 1.26, z) * smoothstep(0.02, -0.06, y) * smoothstep(0.04, 0.10, np.abs(x)) * smoothstep(0.2, 0.15, np.abs(x))
        d += (region == 1) * env * 0.0065 * ridge(u / 0.055 * 6.283)
    # sleeves: stacked rings above the cuffs and compression at the inner elbow
    for sx in (-1, 1):
        E = np.array([0.284 * sx, 0.004, 1.095]); W = np.array([0.362 * sx, -0.058, 0.885])
        t, _ = seg_param(np.c_[x, y, z], E, W)
        ang = np.arctan2(y - (E[1] + (W[1] - E[1]) * np.clip(t, 0, 1)), (x - E[0]) * sx)
        m = (region == 2) & (np.sign(x) == sx)
        env = smoothstep(0.35, 0.5, t) * smoothstep(0.86, 0.78, t)
        d += m * env * 0.007 * ridge(t / 0.14 * 6.283 + 1.2 * np.sin(ang * 2 + sx))
        env = smoothstep(-0.25, -0.1, t) * smoothstep(0.2, 0.05, t) * smoothstep(0.0, -0.8, np.cos(ang - 0.3))
        d += m * env * 0.006 * ridge(ang * 3.0 + t * 12)
    # trousers: lap creases at the hip fold, folds behind the knees, a soft break above the shoes
    m = region == 3
    env = smoothstep(0.76, 0.82, z) * smoothstep(0.93, 0.87, z) * smoothstep(0.03, -0.05, y)
    d += m * env * 0.007 * ridge((z - 0.8) / 0.04 * 6.283 + 2.0 * np.sin(np.abs(x) * 30))
    env = smoothstep(0.38, 0.44, z) * smoothstep(0.56, 0.5, z) * smoothstep(0.0, 0.04, y)
    d += m * env * 0.007 * ridge((z - 0.44) / 0.032 * 6.283 + 1.5 * np.sin(x * 40))
    env = smoothstep(0.08, 0.1, z) * smoothstep(0.2, 0.14, z)
    d += m * env * 0.005 * ridge(z / 0.035 * 6.283 + 2 * np.sin(np.arctan2(y, x) * 3))
    d = d * np.clip(dist / 3.0, 0, 1) + det
    log('folds: max', round(float(np.abs(d).max()), 4), 'verts >2mm', int((np.abs(d) > 0.002).sum()), 'by region', [int(((np.abs(d) > 0.002) & (region == r)).sum()) for r in range(5)])
    d = laplacian(d[:, None].repeat(3, 1), edges, np.ones(N), iters=2, lam=0.5, mu=0.5)[:, 0]
    set_np(me, co + n * d[:, None])

# ----------------------------------------------------------------------------
# 9. unify as one carved surface
# ----------------------------------------------------------------------------
def carve(objs, voxel=0.0026, target_tris=58000, protect=(), crisp=None):
    """crisp = (reference objects, centre, radius): after remeshing, snap that region back onto the
    un-remeshed surface so eyelids, lips and nostrils stay sharp."""
    ref = bvh_of(crisp[0]) if crisp else None
    bpy.ops.object.select_all(action='DESELECT')
    for o in objs: o.select_set(True)
    bpy.context.view_layer.objects.active = objs[0]
    bpy.ops.object.join()
    st = objs[0]; st.name = 'Statue'; st.data.name = 'Statue'
    for a in list(st.data.attributes):
        if a.name in ('garment', 'rest_co'): st.data.attributes.remove(a)
    st.vertex_groups.clear()
    m = st.modifiers.new('Remesh', 'REMESH'); m.mode = 'VOXEL'; m.voxel_size = voxel; m.adaptivity = 0.0
    bpy.ops.object.modifier_apply(modifier=m.name)
    log('remeshed:', len(st.data.polygons), 'faces')
    sm = st.modifiers.new('Smooth', 'LAPLACIANSMOOTH'); sm.iterations = 1; sm.lambda_factor = 0.4; sm.lambda_border = 0
    sm.use_volume_preserve = True
    bpy.ops.object.modifier_apply(modifier=sm.name)
    if ref:
        co = mesh_np(st.data); c, r = np.asarray(crisp[1]), crisp[2]
        d = np.linalg.norm(co - c, axis=1)
        idx = np.nonzero(d < r)[0]
        for i in idx:
            loc, nor, fi, dist = ref.find_nearest(Vector(co[i]), 0.01)
            if loc is None: continue
            w = float(smoothstep(0.006, 0.0025, dist) * smoothstep(r, r * 0.75, d[i]))
            co[i] = co[i] + (np.array(loc) - co[i]) * w
        set_np(st.data, co)
        log('crisp region verts', len(idx))
    # decimation budget: face, hair and hands keep more triangles (weight 1 = decimate freely)
    co = mesh_np(st.data)
    w = np.ones(len(co))
    for c, r, wt in protect:
        d = np.linalg.norm(co - np.asarray(c), axis=1)
        w = np.minimum(w, wt + (1 - wt) * smoothstep(r, r * 1.4, d))
    vg = st.vertex_groups.new(name='decimate')
    wr = np.round(w, 2)
    for val in np.unique(wr):
        vg.add(np.nonzero(wr == val)[0].tolist(), float(val), 'REPLACE')
    tris = sum(len(p.vertices) - 2 for p in st.data.polygons)
    dm = st.modifiers.new('Dec', 'DECIMATE'); dm.decimate_type = 'COLLAPSE'; dm.ratio = min(1.0, target_tris / tris)
    dm.use_collapse_triangulate = True; dm.vertex_group = 'decimate'; dm.vertex_group_factor = 1.0
    bpy.ops.object.modifier_apply(modifier=dm.name)
    st.vertex_groups.clear()
    bpy.ops.object.shade_smooth()
    tris = sum(len(p.vertices) - 2 for p in st.data.polygons)
    log('decimated:', tris, 'tris')
    return st

# ----------------------------------------------------------------------------
# main
# ----------------------------------------------------------------------------
def main():
    body, eyes, k, cx, zmin = load_base()
    weld(body)
    rig = build_rig(body, eyes, k)
    fix_head_weights(body, rig, k)
    subdivide(body)
    region = dress(body, rig, k)
    hair = grow_hair(body, rig, k)
    shoes = make_sneakers(body, rig, k)
    if STOP == 'rest':
        preview_rest(body, hair, rig)
        return
    room_col, room_objs = load_room_refs()
    for o in room_objs:
        o.color = (0.55, 0.45, 0.35, 1)
    body.color = (0.85, 0.83, 0.8, 1)
    hips_head = rig.data.bones['hips'].head_local
    t_room = Vector((0, P['pelvis_y'], 0.55)) - rz180(hips_head)
    for it in range(2):
        pose_rig(rig, t_room)
        # right forearm on the desk (room +X side), left hand on the left thigh
        pose_arm(rig, t_room, '.R', wrist_room=Vector((0.285, -0.15, DESK_TOP + 0.028)),
                 pole_room=None, elbow_hint=Vector((0.36, -0.40, 0.855)), hand_fwd_room=Vector((-0.2, 1.0, -0.06)),
                 palm_n_room=Vector((0.12, 0, -1)), clav=(8, 8))
        pb = rig.pose.bones
        knee_l = rz180(pb['shin.L'].head) + t_room
        hip_l = rz180(pb['thigh.L'].head) + t_room
        on_thigh = hip_l.lerp(knee_l, 0.52) + Vector((-0.035, 0, 0.09))
        tdir = (knee_l - hip_l).normalized()
        pose_arm(rig, t_room, '.L', wrist_room=on_thigh - tdir * 0.02, pole_room=Vector((-0.7, -1.0, -0.3)),
                 hand_fwd_room=tdir + Vector((0.12, 0, -0.35)), palm_n_room=Vector((0.05, 0.1, -1)), clav=(0, 0))
        curl_fingers(rig, '.R', (12, 18, 10), spread=0.45)
        curl_fingers(rig, '.L', (18, 30, 16), spread=0.5)
        dg = bpy.context.evaluated_depsgraph_get()
        oe = body.evaluated_get(dg); co = mesh_np(oe.to_mesh()); oe.to_mesh_clear()
        co = np.c_[-co[:, 0], -co[:, 1], co[:, 2]] + np.array(t_room)
        seat = (np.abs(co[:, 0]) < 0.17) & (co[:, 1] < -0.45) & (co[:, 1] > -0.75)
        low = co[seat, 2].min()
        dz = (SEAT_TOP - 0.008) - low
        t_room.z += dz
        log(f'pass {it}: buttock low {low:.3f} -> shift {dz:+.3f}')
    rig.matrix_world = Matrix.Translation(t_room) @ Matrix.Rotation(math.pi, 4, 'Z')
    cs = body.modifiers.new('CorrectiveSmooth', 'CORRECTIVE_SMOOTH')
    cs.rest_source = 'ORCO'; cs.factor = 0.5; cs.iterations = 6; cs.smooth_type = 'LENGTH_WEIGHTED'
    bpy.context.view_layer.update()
    report_pose(rig, body, eyes)
    hand_pts = [np.array(rig.matrix_world @ rig.pose.bones['hand' + s_].tail) for s_ in ('.R', '.L')]
    wc = world_co(body)
    m = (wc[:, 0] > 0.18) & (np.abs(wc[:, 1] - DESK_EDGE) < 0.015) & (wc[:, 2] > 0.72)
    if m.any(): log('right forearm underside at desk edge z=', round(float(wc[m, 2].min()), 4), 'desk top', DESK_TOP)
    if STOP == 'pose':
        preview('pose', views=('sideortho', 'front34', 'back34', 'rhand', 'lhand'))
        return
    bake_pose([body, hair] + eyes + shoes)
    eye_c = np.mean([mesh_np(e.data).mean(0) for e in eyes], axis=0)

    add_folds(body, region, k)
    if STOP == 'folds':
        return
    obstacles = [o for o in room_objs if o.name in CHAIR_UPPER or o.name.startswith(('Walnut desktop', 'Air /', 'Calibrated'))]
    resolve_collisions(body, obstacles)
    floor_clamp(body)
    bpy.data.objects.remove(rig)
    preview('posed', views=('sideortho', 'front34', 'back34', 'head'))
    face_ref = []
    for o in [body] + eyes:
        c = o.copy(); c.data = o.data.copy(); bpy.context.scene.collection.objects.link(c); c.hide_render = True
        face_ref.append(c)
    st = carve([body, hair] + eyes + shoes, crisp=(face_ref, eye_c + np.array([0, -0.01, -0.035]), 0.11), protect=[(eye_c + np.array([0, 0.02, 0.0]), 0.075, 0.18),
                                                   (eye_c + np.array([0, -0.08, 0.05]), 0.14, 0.35)] +
               [(h, 0.07, 0.3) for h in hand_pts])
    resolve_collisions(st, obstacles, margin=0.002, iters=2)
    floor_clamp(st)
    st.color = (0.85, 0.83, 0.8, 1)
    preview('carved', views=('sideortho', 'front34', 'back34', 'head'))
    finalize(st, obstacles, eye_c)

CORRIDOR = dict(x=(-0.45, 0.45), y=(1.70, 3.0), z=(-0.15, 0.55))   # three.js BU
HEAD_TOP_MAX = 2.84                                               # three.js BU

def to_three(co_m):
    """room metres (Blender Z-up) -> three.js BU (Y-up)"""
    return np.c_[co_m[:, 0], co_m[:, 2], -co_m[:, 1]] * UNIT

def inside_count(co, obstacles):
    obs = obstacles if isinstance(obstacles, Obstacles) else Obstacles(obstacles)
    c = 0; worst = 0.0; who = {}
    for i, name, loc in obs.penetrations(co):
        c += 1; worst = max(worst, float(np.linalg.norm(loc - co[i]))); who[name] = who.get(name, 0) + 1
    return c, -worst, who

def finalize(st, obstacles, eye_c):
    co = mesh_np(st.data)
    th = to_three(co)
    lo = np.array([CORRIDOR[a][0] for a in 'xyz']); hi = np.array([CORRIDOR[a][1] for a in 'xyz'])
    dvec = np.maximum(np.maximum(lo - th, th - hi), 0.0)
    dist = np.linalg.norm(dvec, axis=1)
    inside = int((dist == 0).sum())
    j = int(np.argmin(dist))
    eye3 = to_three(eye_c[None])[0]
    pen, worst, pen_who = inside_count(co, obstacles)
    tris = sum(len(p.vertices) - 2 for p in st.data.polygons)
    rep = dict(
        triangles=tris,
        eye_center_three=[round(float(v), 4) for v in eye3],
        eye_height_m=round(float(eye_c[2]), 4),
        eye_to_screen_center_m=round(float(np.linalg.norm(eye_c - np.array(SCREEN))), 4),
        head_top_three_y=round(float(th[:, 1].max()), 4),
        head_top_m=round(float(co[:, 2].max()), 4),
        corridor_verts_inside=inside,
        corridor_min_distance_bu=round(float(dist.min()), 4),
        corridor_closest_point_three=[round(float(v), 4) for v in th[j]],
        corridor_margin_to_x_bu=round(float(np.min(np.where((th[:, 1] > 1.7) & (th[:, 2] > -0.15) & (th[:, 2] < 0.55), np.abs(th[:, 0]) - 0.45, 9))), 4),
        floor_min_z_bu=round(float(co[:, 2].min() * UNIT), 4),
        penetrating_verts=pen, worst_penetration_mm=round(worst * 1000, 2), penetrating_by_object=pen_who,
        chair_transform=dict(
            note='translate these objects of collection "02 - Desk chair and props" (BU, room file)',
            all_chair_parts_delta_bu=[0.0, round(CHAIR_SHIFT.y * UNIT, 4), 0.0],
            upper_parts_extra_delta_bu=[0.0, 0.0, round(-SEAT_DROP * UNIT, 4)],
            upper_parts=CHAIR_UPPER, base_parts=CHAIR_BASE),
    )
    log('REPORT', json.dumps(rep, indent=1))
    # room units, material, collection
    st.data.transform(Matrix.Scale(UNIT, 4))
    mat = bpy.data.materials.new('Statue plaster')
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes['Principled BSDF']
    bsdf.inputs['Base Color'].default_value = (0.624, 0.597, 0.552, 1)   # #CFCBC4
    bsdf.inputs['Roughness'].default_value = 0.75
    bsdf.inputs['Subsurface Weight'].default_value = 0.04
    bsdf.inputs['Subsurface Radius'].default_value = (0.01, 0.008, 0.006)
    mat.diffuse_color = (0.624, 0.597, 0.552, 1)
    st.data.materials.clear(); st.data.materials.append(mat)
    for p in st.data.polygons: p.use_smooth = True
    for o in list(bpy.data.objects):
        if o != st: bpy.data.objects.remove(o)
    for c in list(bpy.data.collections): bpy.data.collections.remove(c)
    col = new_collection('Statue')
    for c in list(st.users_collection): c.objects.unlink(st)
    col.objects.link(st)
    bpy.data.orphans_purge(do_recursive=True)
    bpy.context.scene.unit_settings.scale_length = 0.5
    bpy.ops.wm.save_as_mainfile(filepath=str(OUT / 'statue.blend'), compress=True)
    raw = OUT / 'statue-raw.glb'
    bpy.ops.object.select_all(action='DESELECT'); st.select_set(True); bpy.context.view_layer.objects.active = st
    bpy.ops.export_scene.gltf(filepath=str(raw), export_format='GLB', use_selection=True, export_yup=True,
                              export_apply=True, export_normals=True, export_texcoords=False, export_animations=False)
    (OUT / 'statue-report.json').write_text(json.dumps(rep, indent=2))
    import subprocess
    dst = ROOT / 'public/journey/statue.glb'
    cmd = ['bunx', 'gltfpack@1.2.0', '-i', str(raw), '-o', str(dst), '-cc', '-vpf', '-vn', '10']
    try:
        r = subprocess.run(cmd, cwd=str(ROOT), capture_output=True, text=True, timeout=300)
        log('gltfpack', r.returncode, r.stdout[-300:], r.stderr[-300:])
        if dst.exists(): log('statue.glb bytes', dst.stat().st_size)
    except Exception as e:
        log('gltfpack not run:', e, ' run manually:', ' '.join(cmd))

def preview_rest(body, hair, rig):
    if not PREVIEW: return
    s = bpy.context.scene
    reg = np.empty(len(body.data.vertices), dtype=np.int32); body.data.attributes['garment'].data.foreach_get('value', reg)
    pal = np.array([[0.9, 0.75, 0.65, 1], [0.3, 0.5, 0.9, 1], [0.3, 0.8, 0.4, 1], [0.8, 0.3, 0.3, 1], [0.6, 0.6, 0.6, 1]])
    ca = body.data.color_attributes.new('reg', 'FLOAT_COLOR', 'POINT'); ca.data.foreach_set('color', pal[reg].ravel())
    s.display.shading.color_type = 'VERTEX' if '--regions' in ARGS else 'MATERIAL'
    s.render.engine = 'BLENDER_WORKBENCH'; s.display.shading.light = 'STUDIO'
    s.render.resolution_x = 900; s.render.resolution_y = 900
    cd = bpy.data.cameras.new('c'); cam = bpy.data.objects.new('c', cd); s.collection.objects.link(cam); s.camera = cam
    PREVIEW_DIR.mkdir(parents=True, exist_ok=True)
    for nm, loc, tg, lens in [('rest-front', (0.6, -3.0, 1.2), (0, 0, 0.95), 50), ('rest-back', (-0.6, 3.0, 1.2), (0, 0, 0.95), 50),
                              ('rest-head', (0.35, -0.9, 1.85), (0, 0, 1.72), 85), ('rest-headside', (1.0, 0.0, 1.8), (0, 0, 1.72), 85),
                              ('rest-feet', (0.5, -0.9, 0.35), (0, -0.05, 0.08), 70)]:
        cam.location = loc; cam.data.lens = lens
        cam.rotation_euler = (Vector(tg) - Vector(loc)).to_track_quat('-Z', 'Y').to_euler()
        s.render.filepath = str(PREVIEW_DIR / f'{nm}.png'); bpy.ops.render.render(write_still=True)

if __name__ == '__main__':
    main()
