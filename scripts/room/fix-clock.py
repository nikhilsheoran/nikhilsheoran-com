"""Rebuild the shelf clock's seven-segment display so it reads 14:08 from
inside the room (the original digits were laid out mirror-reversed).

    blender -b assets/blender/studio.blend --python scripts/room/fix-clock.py
"""
import bpy
from mathutils import Vector

TIME = '14:08'
SEGMENTS = {'0': 'abcdef', '1': 'bc', '2': 'abged', '3': 'abgcd', '4': 'fgbc',
            '5': 'afgcd', '6': 'afgedc', '7': 'abc', '8': 'abcdefg', '9': 'abfgcd'}

old = [o for o in bpy.data.objects
       if o.name.startswith(('Studio / clock glowing segment', 'Studio / clock colon'))]
glass = bpy.data.objects['Studio / clock glass']
material = old[0].data.materials[0]
collection = old[0].users_collection[0]
face_x = min((o.matrix_world @ Vector(c)).x for o in old for c in o.bound_box)
corners = [glass.matrix_world @ Vector(c) for c in glass.bound_box]
centre_y = sum(c.y for c in corners) / 8
centre_z = sum(c.z for c in corners) / 8
for o in old:
    bpy.data.objects.remove(o, do_unlink=True)

W, H, T, GAP, COLON = 0.074, 0.15, 0.015, 0.03, 0.05   # digit size, stroke, spacing (Blender units)


def bar(across, up, size_across, size_up):
    # Seen from inside the room, "right" is -Y.
    bpy.ops.mesh.primitive_cube_add(size=1, location=(face_x + 0.004, centre_y - across, centre_z + up))
    o = bpy.context.object
    o.dimensions = (0.008, size_across, size_up)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    o.name = 'Studio / clock glowing segment'
    o.data.materials.append(material)
    for c in list(o.users_collection):
        c.objects.unlink(o)
    collection.objects.link(o)


total = 4 * W + 2 * GAP + 2 * COLON
cursor = -total / 2
for ch in TIME:
    if ch == ':':
        for up in (H * 0.2, -H * 0.2):
            bar(cursor + COLON / 2, up, T, T)
        cursor += COLON
        continue
    cx = cursor + W / 2
    on = SEGMENTS[ch]
    long, tall = W - T, H / 2 - T
    for name, across, up, sa, su in (
        ('a', 0, H / 2, long, T), ('g', 0, 0, long, T), ('d', 0, -H / 2, long, T),
        ('f', -W / 2, H / 4, T, tall), ('b', W / 2, H / 4, T, tall),
        ('e', -W / 2, -H / 4, T, tall), ('c', W / 2, -H / 4, T, tall)):
        if name in on:
            bar(cx + across, up, sa, su)
    cursor += W + (GAP if ch != TIME[1] else 0)

bpy.ops.wm.save_mainfile()
print('clock set to', TIME)
