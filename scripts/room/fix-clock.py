"""The shelf clock's seven-segment digits were laid out mirror-reversed as seen
from inside the room. Reflect the segments and colon across the clock's centre.

    blender -b assets/blender/studio.blend --python scripts/room/fix-clock.py
"""
import bpy

glass = bpy.data.objects['Studio / clock glass']
if not glass.get('clock_unmirrored'):
    centre = glass.matrix_world.translation.y
    for o in bpy.data.objects:
        if o.name.startswith(('Studio / clock glowing segment', 'Studio / clock colon')):
            m = o.matrix_world.copy()
            m.translation.y = 2 * centre - m.translation.y
            o.matrix_world = m
    glass['clock_unmirrored'] = True
    bpy.ops.wm.save_mainfile()
    print('clock fixed')
