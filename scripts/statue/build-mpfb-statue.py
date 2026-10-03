"""Build the seated plaster statue from an MPFB (MakeHuman for Blender) human.

Run from the repository root (headless Blender 5.2 with the MPFB extension enabled,
so do NOT pass --factory-startup), after scripts/room/desk-chair.py has put the lounge
chair at the desk:

  blender -b --python scripts/statue/build-mpfb-statue.py -- --render
  bunx gltfpack@1.2.0 -i assets/_local/statue/statue-raw.glb -o public/journey/statue.glb -cc

Optional flags after `--`:
  --render          also write the low-cost EEVEE review renders (800 px, 4 views)
  --render-only     only the review renders, from the saved statue.blend
  --preview         workbench previews of intermediate stages into assets/_local/statue/wip/
  --stop pose       stop after posing and save assets/_local/statue/wip-mpfb-pose.blend

Inputs (assumed already downloaded, git-ignored):
  assets/_local/mpfb/system_assets/   MakeHuman system asset pack (CC0), from
      https://files.makehumancommunity.org/asset_packs/makehuman_system_assets/makehuman_system_assets_cc0.zip
      used: clothes/male_casualsuit02 (long-sleeve crew tee + jeans), clothes/shoes05
            (sneakers), hair/short02, eyes/low-poly (only for eye position/size)
  assets/blender/studio.blend          room (read-only here): lounge chair, desk, laptop, rug

Outputs:
  assets/_local/statue/statue.blend        collection "Statue" with one mesh "Statue", room coordinates
  assets/_local/statue/statue-raw.glb      unoptimised export (world placement, Y-up)
  assets/_local/statue/statue-report.json  placement, corridor and penetration numbers

How it works: MPFB macro human (male, ~20 y, 181 cm, athletic) + game-engine rig + CC0
clothes. Eyelashes and eyebrows are never loaded; eyes become plain blank eyeballs. The
body stays closed and its covered skin is sunk a few mm under the garments, which are
solidified into thick closed shells (so no air gap can open at collar/cuffs/hem). The hair
cards only define an envelope: scalp vertices are pushed out to it, smoothed, and cut
into broad locks, so the hair is carved out of the head itself.
The rig is posed in script: reclined torso and raised thighs, then the figure is dropped
into the lounge chair (a vertical drop for every slide position; the lowest resting
position wins, i.e. seat and backrest both carry him). The head is then turned to the
laptop screen, the shins solved so the soles rest on the rug, and the forearms placed on
the armrests (clearance measured and corrected against the chair mesh).
All meshes are evaluated with the pose, joined, voxel-remeshed into one continuous
surface in room units (2 BU = 1 m), lightly smoothed and decimated (face and hands kept
denser).

Coordinates: the rig works in metres with the figure facing -Y; the room transform turns
him to face +Y (toward the desk) and scales by 2. Website (three.js) coordinates are
three(x, y, z) = blender(x, z, -y).
"""
import bpy, bmesh, sys, os, math, json, time
import numpy as np
from mathutils import Vector, Matrix, Quaternion
from mathutils.bvhtree import BVHTree
from pathlib import Path

from bl_ext.blender_org.mpfb.services.humanservice import HumanService

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'assets/_local/statue'
OUT.mkdir(parents=True, exist_ok=True)
ASSETS = ROOT / 'assets/_local/mpfb/system_assets'
ROOM = ROOT / 'assets/blender/studio.blend'
ARGS = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
RENDER = '--render' in ARGS
PREVIEW = '--preview' in ARGS
STOP = ARGS[ARGS.index('--stop') + 1] if '--stop' in ARGS else ''
WIP = OUT / 'wip'

T0 = time.time()
bpy.context.preferences.filepaths.save_version = 0


def log(*a):
    print(f'[mpfb-statue {time.time()-T0:6.1f}s]', *a, flush=True)


# ----------------------------------------------------------------------------
# Subject and placement parameters
# ----------------------------------------------------------------------------
UNIT = 2.0   # room BU per metre
MACRO = {    # MakeHuman macro sliders (0..1)
    'gender': 1.0,
    'age': 0.39,          # ~20 years (0.1875 = 11 y, 0.5 = 25 y)
    'muscle': 0.66,       # athletic
    'weight': 0.48,       # ~75 kg at 181 cm, lean
    'proportions': 0.7,
    'height': 0.683,      # -> 181 cm body height (measured and reported)
    'cupsize': 0.5, 'firmness': 0.5,
    'race': {'asian': 0.30, 'caucasian': 0.50, 'african': 0.20},
}
CLOTHES = ['clothes/male_casualsuit02/male_casualsuit02.mhclo', 'clothes/shoes05/shoes05.mhclo']
HAIR = 'hair/short02/short02.mhclo'
EYES = 'eyes/low-poly/low-poly.mhclo'

# room (BU, Blender Z-up)
CHAIR = 'PH / lounge chair / mid_century_lounge_chair'
SCREEN = Vector((0.0, 0.441, 1.8285))
FLOOR_BU = 0.027          # top of the wool rug under the desk
SEAT_CLEAR = -0.012       # BU: the soft seat takes 6 mm; conform() then flattens the statue onto it
ARM_CLEAR = 0.001         # m between sleeve points and the armrest top (the sleeve shell adds ~4 mm; conform() flattens it)
VOXEL_BU = 0.007          # 3.5 mm
SKIN_SINK = 0.004         # m, covered skin pushed under the garments
CLOTH_THICK, CLOTH_OFFSET = 0.013, -0.7   # m; ~4 mm outward, ~9 mm inward
MAX_TRIS = 60000
PLASTER = (0.6038, 0.5906, 0.5520)   # linear of sRGB #CFCBC4
HAIR_REACH = 0.05        # m, how far from the scalp hair cards are searched
HAIR_FIRST = 0.025       # m, the nearest card must be this close to count as scalp
HAIR_BROW = 0.035        # m above the eye centre: face below this never grows hair
HAIR_SMOOTH = 6          # smoothing passes of the hair thickness field
HAIR_EXTRA = 0.003       # m, extra mass so the carved hair reads thick
HAIR_CLUMP, HAIR_CLUMP_FREQ = 0.15, 26.0
HAIR_LOCKS, HAIR_GROOVE = 20, 0.005   # locks around the crown, groove depth (m)
HAIR_SIDES = 0.45        # thickness kept on the lower sides/back (shorter sides)
HAIR_CROWN = None        # (point, up) set from the posed head bone

# pose (degrees; figure frame: faces -Y, +X is his left, Z up)
POSE = dict(
    pelvis=-32.0,                 # pelvis/torso recline (negative = back)
    spine_curl=(2.0, 2.0, 1.0),   # forward flex added per spine bone
    thigh_dir=(0.07, -1.0, 0.20), # left thigh aim (x mirrored); knees a little apart and up
    ankle_x=0.2,                  # m from the midline; the shin angle follows from the floor
    look_above=10.0,              # head aims this far above the screen centre (eyes do the rest)
    neck_share=0.6,
    elbow_fwd=0.04,               # m the elbow sits in front of the point closest to the shoulder
    clavicle_drop=14.0, clavicle_fwd=8.0,   # relaxed, slightly rounded shoulders (deg)
    forearm_roll=55.0, upperarm_roll=15.0,
    hand_droop=-0.25,
    finger_curl=(14.0, 22.0, 16.0),
)
# the rigid drop uses the pelvis, back and head only: the thighs press into the padded
# seat front/bolsters and are flattened onto them afterwards by conform()
SEAT_BONES = {'pelvis', 'spine_01', 'spine_02', 'spine_03', 'neck_01', 'head', 'clavicle_l', 'clavicle_r'}


def mirror(v, side):
    return Vector((v[0] if side == 'l' else -v[0], v[1], v[2]))


R_ROOM = Matrix.Rotation(math.pi, 4, 'Z') @ Matrix.Scale(UNIT, 4)   # figure -> room, before translation


# ----------------------------------------------------------------------------
# helpers
# ----------------------------------------------------------------------------
def clear_scene():
    for o in list(bpy.data.objects):
        bpy.data.objects.remove(o, do_unlink=True)
    for c in list(bpy.data.collections):
        bpy.data.collections.remove(c)


def mesh_co(o, world=True):
    me = o.data
    a = np.empty(len(me.vertices) * 3)
    me.vertices.foreach_get('co', a)
    a = a.reshape(-1, 3)
    if world:
        M = np.array(o.matrix_world)
        a = a @ M[:3, :3].T + M[:3, 3]
    return a


def eval_co(o):
    dg = bpy.context.evaluated_depsgraph_get()
    e = o.evaluated_get(dg)
    me = e.to_mesh()
    a = np.empty(len(me.vertices) * 3)
    me.vertices.foreach_get('co', a)
    e.to_mesh_clear()
    a = a.reshape(-1, 3)
    M = np.array(o.matrix_world)
    return a @ M[:3, :3].T + M[:3, 3]


def xf(M, co):
    M = np.array(M)
    return co @ M[:3, :3].T + M[:3, 3]


def select_only(objs, active=None):
    bpy.ops.object.select_all(action='DESELECT')
    for o in objs:
        o.select_set(True)
    bpy.context.view_layer.objects.active = active or objs[0]


def apply_modifiers(o):
    """Replace o's mesh by its evaluated mesh (all modifiers, incl. armature)."""
    dg = bpy.context.evaluated_depsgraph_get()
    me = bpy.data.meshes.new_from_object(o.evaluated_get(dg), preserve_all_data_layers=False, depsgraph=dg)
    o.modifiers.clear()
    old = o.data
    o.data = me
    if old.users == 0:
        bpy.data.meshes.remove(old)
    return o


def add_mod(o, kind, name=None, **kw):
    m = o.modifiers.new(name or kind, kind)
    for k, v in kw.items():
        setattr(m, k, v)
    return m


def voxel_remesh(o, size):
    add_mod(o, 'REMESH', mode='VOXEL', voxel_size=size, adaptivity=0.0, use_smooth_shade=True)
    apply_modifiers(o)


def bvh_world(o):
    dg = bpy.context.evaluated_depsgraph_get()
    e = o.evaluated_get(dg)
    me = e.to_mesh()
    bm = bmesh.new(); bm.from_mesh(me); bm.transform(o.matrix_world)
    b = BVHTree.FromBMesh(bm)
    bm.free(); e.to_mesh_clear()
    return b


def edges_np(me):
    e = np.empty(len(me.edges) * 2, dtype=np.int64)
    me.edges.foreach_get('vertices', e)
    return e.reshape(-1, 2)


def set_co(o, co):
    o.data.vertices.foreach_set('co', co.ravel())
    o.data.update()


def laplacian(co, edges, w, iters, lam=0.5, mu=-0.53):
    """Taubin smoothing weighted per vertex (w = 0 locks a vertex)."""
    n = len(co)
    deg = np.bincount(edges.ravel(), minlength=n).astype(np.float64)
    deg[deg == 0] = 1
    w = w[:, None]
    for _ in range(iters):
        for f in (lam, mu):
            acc = np.zeros_like(co)
            np.add.at(acc, edges[:, 0], co[edges[:, 1]])
            np.add.at(acc, edges[:, 1], co[edges[:, 0]])
            co = co + f * w * (acc / deg[:, None] - co)
    return co


def smooth_region(o, centre, radius, iters, lam_only=False):
    co = mesh_co(o, world=False)
    d = np.linalg.norm(co - np.array(centre), axis=1)
    w = np.clip(1.0 - d / radius, 0, 1)
    w = w * w * (3 - 2 * w)
    co = laplacian(co, edges_np(o.data), w, iters, mu=(-0.0 if lam_only else -0.53))
    set_co(o, co)


# ----------------------------------------------------------------------------
# 0. room references (appended read-only copies)
# ----------------------------------------------------------------------------
def load_room_objects():
    with bpy.data.libraries.load(str(ROOM), link=False) as (src, dst):
        dst.collections = ['02 - Desk chair and props', 'Collection']
        dst.objects = [CHAIR, 'Central wool rug']
    ref = bpy.data.collections.new('RoomRef')
    bpy.context.scene.collection.children.link(ref)
    for c in dst.collections:
        ref.children.link(c)
    for o in dst.objects:
        ref.objects.link(o)
    bpy.context.view_layer.update()
    return ref


def remove_room(ref):
    for o in list(ref.all_objects):
        bpy.data.objects.remove(o, do_unlink=True)
    for c in list(ref.children_recursive):
        bpy.data.collections.remove(c)
    bpy.data.collections.remove(ref)


# ----------------------------------------------------------------------------
# 1. MPFB human
# ----------------------------------------------------------------------------
def build_human():
    body = HumanService.create_human(macro_detail_dict=MACRO)
    body.name = 'Human'
    z = eval_co(body)[:, 2]
    height = float(z.max() - z.min())
    log('body height m', round(height, 4))
    rig = HumanService.add_builtin_rig(body, 'game_engine')
    parts = {}
    parts['eyes'] = HumanService.add_mhclo_asset(str(ASSETS / EYES), body, asset_type='Eyes', subdiv_levels=0)
    for f in CLOTHES:
        parts[Path(f).stem] = HumanService.add_mhclo_asset(str(ASSETS / f), body, asset_type='Clothes', subdiv_levels=0)
    parts['hair'] = HumanService.add_mhclo_asset(str(ASSETS / HAIR), body, asset_type='Hair', subdiv_levels=0)

    # keep the body closed: drop MPFB's delete masks and instead sink the covered
    # skin a few mm under the garments (so bent joints do not poke through)
    groups = []
    for m in list(body.modifiers):
        if m.type == 'MASK' and m.name.startswith('Delete.'):
            groups.append(m.vertex_group)
            body.modifiers.remove(m)
    vg = body.vertex_groups.new(name='under_clothes')
    idx = {body.vertex_groups[g].index for g in groups}
    covered = [v.index for v in body.data.vertices if any(gr.group in idx and gr.weight > 0.5 for gr in v.groups)]
    vg.add(covered, 1.0, 'REPLACE')
    add_mod(body, 'DISPLACE', name='SinkUnderClothes', strength=-SKIN_SINK, mid_level=0.0,
            vertex_group='under_clothes', direction='NORMAL')
    body.modifiers.move(len(body.modifiers) - 1, 0)      # at rest, before the armature
    for o in [body] + list(parts.values()):
        for m in o.modifiers:
            if m.type == 'ARMATURE':
                m.use_deform_preserve_volume = True
    add_mod(body, 'SUBSURF', levels=1, render_levels=1)
    for key in CLOTHES:
        add_mod(parts[Path(key).stem], 'SUBSURF', levels=1, render_levels=1)
    return body, rig, parts, height


# ----------------------------------------------------------------------------
# 2. pose and seat
# ----------------------------------------------------------------------------
class Poser:
    def __init__(self, rig):
        self.rig = rig
        self.pb = rig.pose.bones

    def upd(self):
        bpy.context.view_layer.update()

    def rotate(self, name, q, pivot=None):
        b = self.pb[name]
        M = b.matrix.copy()
        h = M.translation.copy() if pivot is None else pivot
        b.matrix = Matrix.Translation(h) @ q.to_matrix().to_4x4() @ Matrix.Translation(-h) @ M
        self.upd()

    def aim(self, name, d):
        b = self.pb[name]
        self.rotate(name, (b.tail - b.head).normalized().rotation_difference(Vector(d).normalized()))

    def roll(self, name, deg):
        b = self.pb[name]
        self.rotate(name, Quaternion((b.tail - b.head).normalized(), math.radians(deg)))

    def pitch(self, name, deg):   # + = forward/down (toward -Y) about the X axis
        self.rotate(name, Quaternion(Vector((1, 0, 0)), math.radians(deg)))

    def reset(self, names):
        for n in names:
            self.pb[n].matrix_basis = Matrix.Identity(4)
        self.upd()

    def face_forward(self):
        b = self.pb['head']
        R = b.matrix.to_3x3() @ b.bone.matrix_local.to_3x3().inverted()
        return (R @ Vector((0, -1, 0))).normalized()


def bone_labels(co, rig):
    """Index into rig.pose.bones of the nearest bone segment for each point."""
    names = [b.name for b in rig.pose.bones if b.name != 'Root']
    M = rig.matrix_world.copy()
    A = np.array([M @ rig.pose.bones[n].head for n in names])
    B = np.array([M @ rig.pose.bones[n].tail for n in names])
    AB = B - A
    L2 = np.maximum((AB * AB).sum(1), 1e-9)
    out = np.empty(len(co), dtype=np.int64)
    for s in range(0, len(co), 4096):
        P = co[s:s + 4096, None, :]
        t = np.clip(((P - A) * AB).sum(2) / L2, 0, 1)
        d = ((P - (A + t[..., None] * AB)) ** 2).sum(2)
        out[s:s + 4096] = d.argmin(1)
    return np.array(names)[out]


def seat_points(body, parts, rig, bones=SEAT_BONES):
    pts = [eval_co(body), eval_co(parts['male_casualsuit02'])]
    co = np.vstack(pts)
    lab = bone_labels(co, rig)
    keep = np.isin(lab, list(bones))
    return co[keep], lab[keep]


def settle(P_fig, chair_bvh, labels=None):
    """Rest position of a rigid figure in the chair.

    For each slide position y the figure is dropped straight down until any point meets
    the chair (seat, backrest or wings); the lowest resting position is the equilibrium
    (seat pan and backrest both carry the weight). Returns the figure->room matrix.
    """
    Q = xf(R_ROOM, P_fig)
    down = Vector((0, 0, -1))

    def rest_z(y, pts):
        z0 = 2.6 - pts[:, 2].min()             # start with the lowest point above the chair top
        best, arg = None, None
        for i, q in enumerate(pts):
            o = Vector((q[0], q[1] + y, q[2] + z0))
            h = chair_bvh.ray_cast(o, down, 3.0)
            if h[0] is not None:
                g = o.z - h[0].z
                if best is None or g < best:
                    best, arg = g, i
        settle.arg = arg
        return None if best is None else z0 - best + SEAT_CLEAR

    coarse = Q[::6]
    ys = np.arange(-2.6, -1.0, 0.02)
    zs = [rest_z(y, coarse) for y in ys]
    cand = [(z, y) for z, y in zip(zs, ys) if z is not None]
    z_c, y_c = min(cand)
    ys = np.arange(y_c - 0.03, y_c + 0.031, 0.004)
    cand = [(rest_z(y, Q), y) for y in ys]
    z, y = min(c for c in cand if c[0] is not None)
    rest_z(y, Q)
    contact = Q[settle.arg] + np.array([0, y, z - SEAT_CLEAR])
    log('settle: y', round(y, 4), 'z', round(z, 4), 'first contact', contact.round(3),
        labels[settle.arg] if labels is not None else '')
    return Matrix.Translation((0.0, y, z)) @ R_ROOM


def armrest_line(chair_bvh, xsign):
    """Top centre line of one armrest: list of (x, y, z) in room BU."""
    down = Vector((0, 0, -1))
    line = []
    for y in np.arange(-1.95, -0.85, 0.02):
        hits = []
        for x in np.arange(0.45, 0.95, 0.005):
            h = chair_bvh.ray_cast(Vector((xsign * x, y, 5.0)), down)
            if h[0] is not None and 1.0 < h[0].z < 1.4 and x > 0.7:
                hits.append((x, h[0].z))
        if not hits:
            continue
        zmax = max(z for _, z in hits)
        top = [x for x, z in hits if z > zmax - 0.012]
        line.append(Vector((xsign * (min(top) + max(top)) / 2, y, zmax)))
    return line


def pose_and_place(rig, body, parts, chair_bvh):
    P = Poser(rig)
    pb = P.pb
    eyes, shoes = parts['eyes'], parts['shoes05']
    shoe_z = eval_co(shoes)[:, 2].min()
    sole_off = pb['foot_l'].head.z - shoe_z          # ankle joint above the sole (rest)
    ball_off = pb['foot_l'].tail.z - shoe_z          # ball joint above the sole (rest)
    rest_dirs = {n: (pb[n].tail - pb[n].head).normalized() for n in ('foot_l', 'foot_r', 'ball_l', 'ball_r')}

    # --- torso and thighs
    P.pitch('pelvis', POSE['pelvis'])
    for n, d in zip(('spine_01', 'spine_02', 'spine_03'), POSE['spine_curl']):
        P.pitch(n, d)
    for s in ('l', 'r'):
        sg = 1 if s == 'l' else -1
        P.rotate(f'clavicle_{s}', Quaternion(Vector((0, 1, 0)), math.radians(POSE['clavicle_drop'] * sg)))
        P.rotate(f'clavicle_{s}', Quaternion(Vector((0, 0, 1)), math.radians(-POSE['clavicle_fwd'] * sg)))
        P.aim(f'thigh_{s}', mirror(POSE['thigh_dir'], s))
        # arms hang by the sides while seating (they are placed on the armrests later)
        P.aim(f'upperarm_{s}', mirror((0.25, 0.1, -1.0), s))
        P.aim(f'lowerarm_{s}', mirror((0.1, -1.0, -0.3), s))

    def place():
        co, lab = seat_points(body, parts, rig)
        return settle(co, chair_bvh, lab)

    # --- seat, look at the laptop, seat again (the head may touch the high back)
    W = place()
    for it in range(2):
        Wi = W.inverted()
        eye = Vector(eval_co(eyes).mean(axis=0))
        d = (Wi @ SCREEN) - eye
        f = P.face_forward()
        a_face = math.atan2(f.z, -f.y)
        a_want = math.atan2(d.z, -d.y) + math.radians(POSE['look_above'])
        delta = math.degrees(a_face - a_want)       # + = pitch forward/down
        P.pitch('neck_01', delta * POSE['neck_share'])
        P.pitch('head', delta * (1 - POSE['neck_share']))
        log('look: pitch correction deg', round(delta, 2))
        W = place()
    Wi = W.inverted()

    # --- shins: soles on the rug. If the knee is too high for the shin to reach, the shin
    # hangs almost vertically and the foot points down so the ball of the foot rests on
    # the rug (heel slightly raised).
    floor = (Wi @ Vector((0, 0, FLOOR_BU))).z
    info_legs = {}
    for s in ('l', 'r'):
        K = pb[f'calf_{s}'].head.copy()
        l = pb[f'calf_{s}'].length
        za = floor + sole_off + 0.001
        dx = math.copysign(max(POSE['ankle_x'] - abs(K.x), 0.0), K.x)
        dz = K.z - za
        if l * l >= dz * dz + dx * dx + 0.06 ** 2:
            A = Vector((K.x + dx, K.y - math.sqrt(l * l - dz * dz - dx * dx), za))
        else:
            A = K + Vector((dx, -0.06, -math.sqrt(max(l * l - dx * dx - 0.06 ** 2, 0.0)))).normalized() * l
        P.aim(f'calf_{s}', A - K)
        A = pb[f'foot_{s}'].head.copy()
        Lf = pb[f'foot_{s}'].length
        zb = floor + ball_off + 0.001
        rd = rest_dirs[f'foot_{s}']
        th = math.asin(max(-0.95, min(0.95, (A.z - zb) / Lf)))
        P.aim(f'foot_{s}', Vector((rd.x, -math.cos(th), -math.sin(th))))
        P.aim(f'ball_{s}', rest_dirs[f'ball_{s}'])
        info_legs[s] = {'heel_raise_mm': round(max(0.0, A.z - za) * 1000, 1),
                        'foot_pitch_deg': round(math.degrees(th), 1)}
    log('legs', info_legs)

    # --- forearms on the armrests
    arm_bones = {s: [f'upperarm_{s}', f'lowerarm_{s}', f'hand_{s}'] +
                 [f'{f}_0{k}_{s}' for f in ('index', 'middle', 'ring', 'pinky', 'thumb') for k in (1, 2, 3)]
                 for s in ('l', 'r')}
    lift = {'l': 0.035, 'r': 0.035}       # m from the elbow joint down to the sleeve underside (first guess)
    info = {}
    for it in range(3):
        for s in ('l', 'r'):
            P.reset(arm_bones[s])
            xs = -1 if s == 'l' else 1          # his left (+X figure) is -X in the room
            line = [Wi @ p for p in armrest_line(chair_bvh, xs)]
            S = pb[f'upperarm_{s}'].head.copy()
            l1, l2 = pb[f'upperarm_{s}'].length, pb[f'lowerarm_{s}'].length
            up = Vector((0, 0, 1))
            pts = [p + up * lift[s] for p in line]
            # elbow: the armrest point a little in front of the one nearest the shoulder,
            # pulled onto the upper-arm sphere when it is out of reach
            k = min(range(len(pts)), key=lambda i: (pts[i] - S).length)
            k2 = min(range(len(pts)), key=lambda i: abs((pts[i].y - pts[k].y) + POSE['elbow_fwd']))
            E = pts[k2]
            if (E - S).length > l1 * 0.995:
                E = S + (E - S).normalized() * l1 * 0.995
            # wrist: along the armrest, forearm length ahead of the elbow
            j = min(range(len(pts)), key=lambda i: abs((pts[i] - E).length - l2) + (0 if pts[i].y < E.y else 1))
            Wt = pts[j] + up * (-0.01)          # wrist is thinner than the elbow
            Wt = E + (Wt - E).normalized() * l2
            P.aim(f'upperarm_{s}', E - S)
            P.roll(f'upperarm_{s}', POSE['upperarm_roll'] * (1 if s == 'l' else -1))
            P.aim(f'lowerarm_{s}', Wt - pb[f'lowerarm_{s}'].head)
            P.roll(f'lowerarm_{s}', POSE['forearm_roll'] * (1 if s == 'l' else -1))
            fwd = (Wt - pb[f'lowerarm_{s}'].head).normalized()
            P.aim(f'hand_{s}', fwd + Vector((0, 0, POSE['hand_droop'])))
            c1, c2, c3 = POSE['finger_curl']
            for f in ('index', 'middle', 'ring', 'pinky'):
                for kk, c in zip((1, 2, 3), (c1, c2, c3)):
                    b = pb[f'{f}_0{kk}_{s}']
                    b.rotation_mode = 'XYZ'
                    b.rotation_euler.x += math.radians(c)
            P.upd()
            info[s] = dict(elbow_reach_m=round((pts[k2] - S).length - l1, 4),
                           shoulder_room=[round(v, 3) for v in W @ S], elbow_room=[round(v, 3) for v in W @ E],
                           wrist_room=[round(v, 3) for v in W @ Wt])
        # forearm clearance above the armrest top (height field: rays from above), correct lift
        co = np.vstack([eval_co(body), eval_co(parts['male_casualsuit02'])])
        lab = bone_labels(co, rig)
        room = xf(W, co)
        for s in ('l', 'r'):
            sel = lab == f'lowerarm_{s}'
            worst = 1e9
            for q in room[sel][::2]:
                h = chair_bvh.ray_cast(Vector((q[0], q[1], 5.0)), Vector((0, 0, -1)))
                if h[0] is None or not (1.0 < h[0].z < 1.4) or abs(q[0]) < 0.55:
                    continue
                worst = min(worst, q[2] - h[0].z)
            if worst > 1e8:
                info[s]['forearm_clearance_mm'] = None
                continue
            gap = worst / UNIT
            info[s]['forearm_clearance_mm'] = round(gap * 1000, 1)
            lift[s] += ARM_CLEAR - gap
        log('arms', it, info, 'lift', {k: round(v, 4) for k, v in lift.items()})
    log('armrest line (room BU, his left):', [tuple(round(v, 3) for v in p) for p in armrest_line(chair_bvh, -1)[::8]])
    info['legs'] = info_legs
    return W, info


def two_bone(S, W, l1, l2, pole):
    """Elbow position for a two-bone chain from S to W bending toward pole."""
    d = W - S
    L = min(d.length, (l1 + l2) * 0.999)
    u = d.normalized()
    a = (l1 * l1 - l2 * l2 + L * L) / (2 * L)
    h = math.sqrt(max(l1 * l1 - a * a, 0.0))
    p = Vector(pole)
    p = (p - u * p.dot(u)).normalized()
    return S + u * a + p * h


# ----------------------------------------------------------------------------
# previews
# ----------------------------------------------------------------------------
def preview(name, target, views, res=(640, 640), lens=50):
    sc = bpy.context.scene
    sc.render.engine = 'BLENDER_WORKBENCH'
    sc.render.resolution_x, sc.render.resolution_y = res
    sc.render.resolution_percentage = 100
    sh = sc.display.shading
    sh.light = 'STUDIO'
    sh.color_type = 'MATERIAL'
    sh.show_cavity = True
    sh.cavity_type = 'WORLD'
    cam = bpy.data.objects.get('ReviewCam') or bpy.data.objects.new('ReviewCam', bpy.data.cameras.new('ReviewCam'))
    if cam.name not in sc.collection.objects:
        sc.collection.objects.link(cam)
    sc.camera = cam
    cam.data.lens = lens
    WIP.mkdir(exist_ok=True)
    for vn, eye in views.items():
        cam.location = eye
        cam.rotation_euler = (Vector(target) - Vector(eye)).to_track_quat('-Z', 'Y').to_euler()
        sc.render.filepath = str(WIP / f'{name}-{vn}.png')
        bpy.ops.render.render(write_still=True)


# ----------------------------------------------------------------------------
# 3. bake the pose, fix garments, carve the hair
# ----------------------------------------------------------------------------
def blank_eyes(eyes):
    """Replace MakeHuman's eye meshes (cornea bulge, iris cut) by two plain eyeballs."""
    co = mesh_co(eyes)
    bm = bmesh.new()
    for side in (co[:, 0] > 0, co[:, 0] <= 0):
        c = co[side].mean(axis=0)
        r = float(np.linalg.norm(co[side] - c, axis=1).mean())
        m = Matrix.Translation(Vector(c)) @ Matrix.Scale(r * 0.93, 4)
        bmesh.ops.create_uvsphere(bm, u_segments=32, v_segments=16, radius=1.0, matrix=m)
    bm.to_mesh(eyes.data); bm.free()
    eyes.matrix_world = Matrix.Identity(4)


def bake(body, rig, parts):
    global HAIR_CROWN
    pb = rig.pose.bones
    M = rig.matrix_world.copy()
    hd = pb['head']
    up = (M @ hd.tail - M @ hd.head).normalized()
    back = Vector((0, 1, 0)); back = (back - up * back.dot(up)).normalized()
    HAIR_CROWN = (M @ hd.head + up * 0.12 + back * 0.035, up)
    crotch = (M @ pb['thigh_l'].head + M @ pb['thigh_r'].head) / 2
    for o in [body] + list(parts.values()):
        apply_modifiers(o)
        mw = o.matrix_world.copy()
        o.parent = None
        o.data.transform(mw)
        o.matrix_world = Matrix.Identity(4)
    bpy.data.objects.remove(rig)
    blank_eyes(parts['eyes'])
    suit = parts['male_casualsuit02']
    # relax small body-driven bumps in the tee/jeans, then the crumpled crotch into a saddle
    co = mesh_co(suit, world=False)
    set_co(suit, laplacian(co, edges_np(suit.data), np.ones(len(co)), 4))
    c = crotch + Vector((0, -0.03, -0.07))
    smooth_region(suit, c, 0.16, 40, lam_only=True)
    smooth_region(suit, c, 0.20, 10)
    for key in CLOTHES:
        o = parts[Path(key).stem]
        # thick shells reaching well inside the (slightly sunk) skin: the union then has
        # no air gap under the garment that could open at the collar, cuffs or hem
        add_mod(o, 'SOLIDIFY', thickness=CLOTH_THICK, offset=CLOTH_OFFSET, use_even_offset=False)
        apply_modifiers(o)
    return body, parts


def carve_hair(hair, body, eyes):
    """Turn the alpha hair cards into a carved mass grown out of the scalp.

    Every scalp vertex is pushed outward along its normal to the outermost hair card it
    finds; the thickness field is smoothed so the hairline ramps into the skin, thinned on
    the lower sides and back, and cut into broad locks radiating from the crown. The cards
    themselves are discarded, so no card edges survive into the plaster.
    """
    from mathutils import noise
    hb = bvh_world(hair)
    me = body.data
    me.update()
    co = mesh_co(body, world=False)
    nrm = np.empty(len(me.vertices) * 3)
    me.vertices.foreach_get('normal', nrm)
    nrm = nrm.reshape(-1, 3)
    hz = mesh_co(hair)[:, 2].min() - 0.01
    crown, up = HAIR_CROWN
    fwd = Vector((0, -1, 0)); fwd = (fwd - up * fwd.dot(up)).normalized()
    side = up.cross(fwd)
    eye_c = Vector(mesh_co(eyes).mean(axis=0))
    t = np.zeros(len(co))
    for i in np.nonzero(co[:, 2] > hz)[0]:
        p, n = Vector(co[i]), Vector(nrm[i])
        if (p - eye_c).dot(up) < HAIR_BROW and (p - crown).dot(fwd) > 0.0:
            continue                       # the face never grows hair
        org, far = p + n * 0.001, 0.0
        for k in range(8):
            h = hb.ray_cast(org, n, HAIR_REACH if k else HAIR_FIRST)
            if h[0] is None:
                break
            far = (h[0] - p).dot(n)
            org = h[0] + n * 0.0005
        t[i] = far
    covered = t > 0
    E = edges_np(me)
    deg = np.bincount(E.ravel(), minlength=len(co)).astype(float); deg[deg == 0] = 1
    for _ in range(HAIR_SMOOTH):
        acc = np.zeros_like(t)
        np.add.at(acc, E[:, 0], t[E[:, 1]]); np.add.at(acc, E[:, 1], t[E[:, 0]])
        t = 0.5 * t + 0.5 * acc / deg
    t = np.where(t > 0.0015, t + HAIR_EXTRA * np.clip(t / 0.01, 0, 1), 0.0)
    for i in np.nonzero(t)[0]:
        p = Vector(co[i])
        v = p - crown
        # shorter sides and back: taper below the crown except over the forehead
        below = -v.dot(up)
        front = v.dot(fwd)
        taper = 1.0 - (1.0 - HAIR_SIDES) * min(1.0, max(0.0, (below - 0.03) / 0.07)) * min(1.0, max(0.0, (0.05 - front) / 0.05))
        phi = math.atan2(v.dot(side), v.dot(fwd)) + 0.35 * noise.noise(p * 9.0)
        lock = 0.5 + 0.5 * math.cos(HAIR_LOCKS * phi)
        edge = min(1.0, t[i] / 0.008)
        groove = HAIR_GROOVE * edge * (1.0 - lock) ** 3
        t[i] = t[i] * taper * (1.0 + HAIR_CLUMP * noise.noise(p * HAIR_CLUMP_FREQ)) - groove * taper
    t = np.maximum(t, 0.0)
    set_co(body, co + nrm * t[:, None])
    log('hair: scalp verts covered', int(covered.sum()), 'max thickness mm', round(float(t.max()) * 1000, 1))
    bpy.data.objects.remove(hair, do_unlink=True)


# ----------------------------------------------------------------------------
# 4. union and surface
# ----------------------------------------------------------------------------
def keep_largest_island(o):
    bm = bmesh.new(); bm.from_mesh(o.data)
    seen, islands = set(), []
    for v in bm.verts:
        if v.index in seen:
            continue
        stack, isl = [v], []
        seen.add(v.index)
        while stack:
            x = stack.pop(); isl.append(x)
            for e in x.link_edges:
                y = e.other_vert(x)
                if y.index not in seen:
                    seen.add(y.index); stack.append(y)
        islands.append(isl)
    islands.sort(key=len, reverse=True)
    bmesh.ops.delete(bm, geom=[v for isl in islands[1:] for v in isl], context='VERTS')
    bm.to_mesh(o.data); bm.free()
    log('islands', len(islands), 'kept', len(islands[0]))


def conform(o, bvh, box, max_depth=0.06, margin=0.002, rounds=3):
    """Flatten the statue where it presses into the (soft, open-shelled) chair.

    A vertex is inside the chair when a ray from it into the statue (along -normal) meets a
    chair surface from that surface's back side within max_depth. Such vertices move inward
    to the chair surface (+margin); the displacement is feathered into the neighbours so the
    contact reads as soft flesh/cloth pressed on a cushion.
    """
    me = o.data
    E = edges_np(me)
    deg = np.bincount(E.ravel(), minlength=len(me.vertices)).astype(float); deg[deg == 0] = 1
    lo, hi = np.array(box[0]) - 0.05, np.array(box[1]) + 0.05
    for r in range(rounds):
        me.update()
        co = mesh_co(o, world=False)
        nrm = np.empty(len(co) * 3); me.vertices.foreach_get('normal', nrm); nrm = nrm.reshape(-1, 3)
        idx = np.nonzero(np.all((co > lo) & (co < hi), axis=1))[0]
        D = np.zeros(len(co))
        for i in idx:
            d = Vector(-nrm[i])
            h = bvh.ray_cast(Vector(co[i]) + d * 1e-4, d, max_depth)
            if h[0] is not None and h[1].dot(d) > 0.1:
                D[i] = h[3] + margin
        n_in = int((D > 0).sum())
        log('conform round', r, 'verts inside chair', n_in, 'max depth mm', round(float(D.max()) * 1000 / UNIT, 1))
        if not n_in:
            break
        Ds = D.copy()
        for _ in range(8):
            acc = np.zeros_like(Ds)
            np.add.at(acc, E[:, 0], Ds[E[:, 1]]); np.add.at(acc, E[:, 1], Ds[E[:, 0]])
            Ds = np.maximum(D, 0.35 * Ds + 0.65 * acc / deg * 0.9)
        set_co(o, co - nrm * Ds[:, None])


def chair_depth(co, nrm, bvh, max_depth=0.1):
    """Worst depth (BU) of statue vertices inside the open-shelled chair (same test as conform)."""
    worst, where, n_in = 0.0, None, 0
    for i in range(len(co)):
        d = Vector(-nrm[i])
        h = bvh.ray_cast(Vector(co[i]) + d * 1e-4, d, max_depth)
        if h[0] is not None and h[1].dot(d) > 0.1:
            n_in += 1
            if h[3] > worst:
                worst, where = h[3], co[i]
    return n_in, worst, where


def finish_surface(o, detail_centres, chair_bvh=None, chair_box=None):
    voxel_remesh(o, VOXEL_BU)
    keep_largest_island(o)
    if chair_bvh is not None:
        conform(o, chair_bvh, chair_box)
    log('surface area m2', round(sum(p.area for p in o.data.polygons) / UNIT ** 2, 3),
        'remeshed tris', sum(len(p.vertices) - 2 for p in o.data.polygons))
    co = mesh_co(o, world=False)
    co = laplacian(co, edges_np(o.data), np.ones(len(co)), 2)
    set_co(o, co)
    # keep the face and hands denser: decimation weight 0 there, 1 elsewhere
    w = np.ones(len(co))
    for c, r in detail_centres:
        d = np.linalg.norm(co - np.array(c), axis=1)
        w = np.minimum(w, np.clip((d - r) / r, 0.0, 1.0) * 0.9 + 0.1)
    vg = o.vertex_groups.new(name='decimate')
    for val in np.unique(np.round(w, 2)):
        ids = np.nonzero(np.round(w, 2) == val)[0].tolist()
        vg.add(ids, float(val), 'REPLACE')
    tris = sum(len(p.vertices) - 2 for p in o.data.polygons)
    add_mod(o, 'DECIMATE', decimate_type='COLLAPSE', ratio=min(1.0, (MAX_TRIS - 300) / tris),
            use_collapse_triangulate=True, vertex_group='decimate', vertex_group_factor=4.0)
    apply_modifiers(o)
    o.vertex_groups.clear()
    for p in o.data.polygons:
        p.use_smooth = True
    return o


def plaster_material():
    m = bpy.data.materials.get('Plaster') or bpy.data.materials.new('Plaster')
    m.use_nodes = True
    bs = m.node_tree.nodes.get('Principled BSDF')
    bs.inputs['Base Color'].default_value = (*PLASTER, 1.0)
    bs.inputs['Roughness'].default_value = 0.8
    bs.inputs['Metallic'].default_value = 0.0
    for n in ('Subsurface Weight', 'Transmission Weight', 'Coat Weight', 'Sheen Weight'):
        if n in bs.inputs:
            bs.inputs[n].default_value = 0.0
    if 'Specular IOR Level' in bs.inputs:
        bs.inputs['Specular IOR Level'].default_value = 0.35
    m.diffuse_color = (*PLASTER, 1.0)
    return m


# ----------------------------------------------------------------------------
# 5. checks against the room
# ----------------------------------------------------------------------------
def penetration(co, o):
    """Deepest statue vertex inside obstacle o (closest point + normal, confirmed by ray parity)."""
    pts = [o.matrix_world @ Vector(c) for c in o.bound_box]
    lo = np.array([min(p[i] for p in pts) for i in range(3)]) - 0.02
    hi = np.array([max(p[i] for p in pts) for i in range(3)]) + 0.02
    sel = np.all((co > lo) & (co < hi), axis=1)
    if not sel.any():
        return None
    b = bvh_world(o)
    worst, n_in, where = 0.0, 0, None
    dirn = Vector((0.0123, 0.0071, 1.0)).normalized()
    for p in co[sel]:
        q = Vector(p)
        hit = b.find_nearest(q)
        if hit[0] is None or (q - hit[0]).dot(hit[1]) >= 0:
            continue
        cnt, org = 0, q.copy()
        for _ in range(20):
            h = b.ray_cast(org, dirn)
            if h[0] is None:
                break
            cnt += 1
            org = h[0] + dirn * 1e-5
        if cnt % 2 == 1:
            n_in += 1
            if hit[3] > worst:
                worst, where = hit[3], p
    if not n_in:
        return None
    return {'verts_inside': n_in, 'worst_mm': round(worst * 1000 / UNIT, 2),
            'worst_at_blender_bu': [round(float(v), 3) for v in where]}


def checks(statue, ref):
    co = mesh_co(statue)
    rep = {'triangles': sum(len(p.vertices) - 2 for p in statue.data.polygons)}

    def three(v):
        return [round(float(v[0]), 4), round(float(v[2]), 4), round(float(-v[1]), 4)]
    top = co[co[:, 2].argmax()]
    rep['head_top_three_y'] = round(float(top[2]), 4)
    rep['head_top_m'] = round(float(top[2]) / UNIT, 4)
    # camera corridor: three x[-.45,.45] y[1.70,3.0] z[-.15,.55] -> blender y[-0.55,0.15], z[1.70,3.0]
    lo, hi = np.array([-0.45, -0.55, 1.70]), np.array([0.45, 0.15, 3.0])
    inside = np.all((co > lo) & (co < hi), axis=1)
    dist = np.linalg.norm(np.maximum(np.maximum(lo - co, 0), np.maximum(co - hi, 0)), axis=1)
    k = int(dist.argmin())
    rep['corridor_verts_inside'] = int(inside.sum())
    rep['corridor_min_distance_bu'] = round(float(dist[k]), 4)
    rep['corridor_closest_point_three'] = three(co[k])
    # torso box three x[-.45,.45] y[.95,2.4] z[.72,1.5]: report where the torso actually is
    tor = co[(co[:, 2] > 1.1) & (co[:, 2] < 2.3) & (np.abs(co[:, 0]) < 0.3)]
    rep['torso_extent_three'] = {'x': [round(float(tor[:, 0].min()), 3), round(float(tor[:, 0].max()), 3)],
                                 'y': [round(float(tor[:, 2].min()), 3), round(float(tor[:, 2].max()), 3)],
                                 'z': [round(float(-tor[:, 1].max()), 3), round(float(-tor[:, 1].min()), 3)]}
    rep['bbox_three'] = {'min': three(np.array([co[:, 0].min(), co[:, 1].max(), co[:, 2].min()])),
                         'max': three(np.array([co[:, 0].max(), co[:, 1].min(), co[:, 2].max()]))}
    rep['sole_min_z_bu'] = round(float(co[:, 2].min()), 4)
    rep['rug_top_z_bu'] = FLOOR_BU
    pen = {}
    for o in ref.all_objects:
        if o.type == 'MESH' and not o.hide_render and o.name != CHAIR:
            r = penetration(co, o)
            if r:
                pen[o.name] = r
    statue.data.update()
    nrm = np.empty(len(co) * 3); statue.data.vertices.foreach_get('normal', nrm); nrm = nrm.reshape(-1, 3)
    n_in, worst, where = chair_depth(co, nrm, bvh_world(bpy.data.objects[CHAIR]))
    if n_in:
        pen[CHAIR] = {'verts_inside': n_in, 'worst_mm': round(worst * 1000 / UNIT, 2),
                      'worst_at_blender_bu': [round(float(v), 3) for v in where],
                      'method': 'ray along -normal meets chair back-face (chair mesh is open-shelled)'}
    rep['penetration'] = pen
    rep['worst_penetration_mm'] = max([v['worst_mm'] for v in pen.values()], default=0.0)
    return rep


def export_glb(statue):
    select_only([statue])
    bpy.ops.export_scene.gltf(filepath=str(OUT / 'statue-raw.glb'), use_selection=True, export_format='GLB',
                              export_apply=True, export_yup=True, export_normals=True,
                              export_materials='EXPORT', export_texcoords=False)


def main():
    clear_scene()
    body, rig, parts, height = build_human()
    ref = load_room_objects()
    chair = bpy.data.objects[CHAIR]
    chair_bvh = bvh_world(chair)
    W, arm_info = pose_and_place(rig, body, parts, chair_bvh)
    M = rig.matrix_world.copy()
    hand_centres = [(W @ (M @ rig.pose.bones[f'middle_01_{sd}'].head), 0.10) for sd in ('l', 'r')]
    if PREVIEW:
        rig.matrix_world = W @ M
        bpy.context.view_layer.update()
        preview('pose', (0, -1.7, 1.6), {'front34': (2.4, 0.2, 2.8), 'side': (3.6, -1.6, 1.8)}, lens=40)
        rig.matrix_world = M
        bpy.context.view_layer.update()
    if STOP == 'pose':
        bpy.ops.wm.save_as_mainfile(filepath=str(OUT / 'wip-mpfb-pose.blend'))
        return
    body, parts = bake(body, rig, parts)          # figure frame, metres
    carve_hair(parts.pop('hair'), body, parts['eyes'])
    objs = [body] + list(parts.values())
    for o in objs:                                 # into the room
        o.data.transform(W)
    eyes = parts['eyes']
    eye = Vector(mesh_co(eyes).mean(axis=0))
    select_only(objs, body)
    bpy.ops.object.join()
    statue = body
    statue.name = statue.data.name = 'Statue'
    pts = [chair.matrix_world @ Vector(c) for c in chair.bound_box]
    box = ([min(p[i] for p in pts) for i in range(3)], [max(p[i] for p in pts) for i in range(3)])
    finish_surface(statue, [(eye + Vector((0, 0.04, 0.03)), 0.2)] + hand_centres, chair_bvh, box)
    statue.data.materials.clear()
    statue.data.materials.append(plaster_material())
    if PREVIEW:
        tgt = eye
        preview('final', tgt, {'face': tgt + Vector((0.35, 0.95, -0.05)), 'nape': tgt + Vector((0.5, -1.2, 0.5))}, lens=75)
        preview('final', (0, -1.7, 1.6), {'front34': (2.4, 0.2, 2.8), 'side': (3.6, -1.6, 1.8), 'back': (-1.9, -4.2, 3.0),
                                          'shoulder': (0.7, -3.0, 3.2)}, lens=40)

    rep = checks(statue, ref)
    rep['body_height_m'] = round(height, 4)
    rep['macro'] = MACRO
    rep['eye_center_three'] = [round(eye.x, 4), round(eye.z, 4), round(-eye.y, 4)]
    rep['eye_height_m'] = round(eye.z / UNIT, 4)
    rep['eye_to_screen_center_m'] = round((eye - SCREEN).length / UNIT, 4)
    rep['arms'] = arm_info
    rep['chair'] = CHAIR + ' (placed by scripts/room/desk-chair.py; not moved here)'
    rep['assets'] = {'clothes': CLOTHES, 'hair': HAIR, 'eyes': EYES, 'rig': 'game_engine'}
    (OUT / 'statue-report.json').write_text(json.dumps(rep, indent=2))
    log('report', json.dumps({k: v for k, v in rep.items() if k != 'macro'}))
    remove_room(ref)

    # final file: only collection "Statue"
    for o in list(bpy.data.objects):
        if o is not statue:
            bpy.data.objects.remove(o, do_unlink=True)
    col = bpy.data.collections.new('Statue')
    bpy.context.scene.collection.children.link(col)
    for c in list(statue.users_collection):
        c.objects.unlink(statue)
    col.objects.link(statue)
    bpy.ops.outliner.orphans_purge(do_recursive=True)
    bpy.ops.wm.save_as_mainfile(filepath=str(OUT / 'statue.blend'), compress=True)
    export_glb(statue)
    log('saved', OUT / 'statue.blend')
    if RENDER:
        render_reviews()


# ----------------------------------------------------------------------------
# 6. review renders (EEVEE, 800 px)
# ----------------------------------------------------------------------------
def render_reviews(only=None):
    rep = json.loads((OUT / 'statue-report.json').read_text())
    ex, ey, ez = rep['eye_center_three']
    eye = Vector((ex, -ez, ey))                      # back to Blender coordinates
    views = {   # BU, room frame (he faces +Y, his right is +X)
        'front34': ((2.3, 0.35, 2.9), (0.0, -1.6, 1.55), 40),
        'side': ((3.7, -1.3, 1.9), (0.0, -1.3, 1.45), 38),
        'over-shoulder': ((0.75, eye.y - 1.25, eye.z + 0.75), (0.0, 0.44, 1.83), 30),
        'face': (tuple(eye + Vector((0.32, 0.9, -0.08))), tuple(eye + Vector((0, 0.02, 0.05))), 80),
    }
    bpy.ops.wm.open_mainfile(filepath=str(ROOM), load_ui=False)   # never saved
    keep = {'02 - Desk chair and props', 'Collection', '11 - Poly Haven'}
    for c in bpy.data.collections:
        if c.name not in keep:
            c.hide_render = True
    for o in bpy.data.objects:
        if o.type == 'LIGHT':
            o.hide_render = True
    with bpy.data.libraries.load(str(OUT / 'statue.blend'), link=False) as (src, dst):
        dst.collections = ['Statue']
    sc = bpy.context.scene
    sc.collection.children.link(dst.collections[0])
    sc.render.engine = 'BLENDER_EEVEE'
    sc.eevee.taa_render_samples = 32
    if hasattr(sc.eevee, 'use_raytracing'):
        sc.eevee.use_raytracing = False
    sc.render.resolution_x = sc.render.resolution_y = 800
    sc.render.resolution_percentage = 100
    sc.view_settings.view_transform = 'AgX'
    w = bpy.data.worlds.new('ReviewWorld')
    w.use_nodes = True
    w.node_tree.nodes['Background'].inputs[0].default_value = (0.32, 0.31, 0.30, 1)
    w.node_tree.nodes['Background'].inputs[1].default_value = 0.6
    sc.world = w
    bpy.ops.mesh.primitive_plane_add(size=30, location=(0, 0, FLOOR_BU))
    fl = bpy.context.active_object
    m = bpy.data.materials.new('ReviewFloor')
    m.use_nodes = True
    m.node_tree.nodes['Principled BSDF'].inputs['Base Color'].default_value = (0.35, 0.34, 0.33, 1)
    fl.data.materials.append(m)

    def light(name, loc, energy, size, tgt=(0, -1.5, 1.6), color=(1, 1, 1)):
        L = bpy.data.lights.new(name, 'AREA'); L.energy = energy; L.size = size; L.color = color
        o = bpy.data.objects.new(name, L); sc.collection.objects.link(o)
        o.location = loc; o.rotation_euler = (Vector(tgt) - Vector(loc)).to_track_quat('-Z', 'Y').to_euler()
    light('Key', (2.8, 1.0, 4.4), 420, 1.2, color=(1.0, 0.96, 0.9))
    light('Fill', (-3.2, 0.2, 2.4), 140, 3.0, color=(0.9, 0.95, 1.0))
    light('Rim', (-1.2, -4.8, 4.0), 300, 1.5)
    cam = bpy.data.objects.new('ReviewCam', bpy.data.cameras.new('ReviewCam'))
    sc.collection.objects.link(cam); sc.camera = cam
    for v, (loc, tgt, lens) in views.items():
        if only and v not in only:
            continue
        cam.location = loc; cam.data.lens = lens
        cam.rotation_euler = (Vector(tgt) - Vector(loc)).to_track_quat('-Z', 'Y').to_euler()
        sc.render.filepath = str(OUT / f'mpfb-{v}.png')
        bpy.ops.render.render(write_still=True)
        log('render', sc.render.filepath)


if '--render-only' in ARGS:
    i = ARGS.index('--render-only')
    render_reviews(ARGS[i + 1].split(',') if len(ARGS) > i + 1 and not ARGS[i + 1].startswith('--') else None)
else:
    main()
