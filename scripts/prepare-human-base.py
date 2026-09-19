"""Extract data-only anatomical references from Blender Studio's CC0 bundle.
Run in an isolated background Blender with --factory-startup --disable-autoexec.
This is a sculpting foundation, not a finished likeness or a website asset.
"""
import bpy
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
bpy.ops.object.select_all(action='DESELECT')
selected=[]
for o in bpy.data.objects:
 if o.type=='MESH' and (o.name=='GEO-body_male_realistic' or o.name.startswith('GEO-body_male_realistic.eye')):
  o.hide_set(False);o.hide_viewport=False;o.hide_render=False
  o.animation_data_clear()
  # Bake only the anatomical mesh, without bundled drivers or mask controls.
  for m in list(o.modifiers):
   if m.type!='SUBSURF':o.modifiers.remove(m)
   else:m.levels=1;m.render_levels=1
  o.select_set(True);selected.append(o)
assert selected,'Realistic male body asset missing'
bpy.ops.export_scene.gltf(filepath=str(ROOT/'assets/blender/human-anatomical-reference.glb'),export_format='GLB',use_selection=True,export_apply=True,export_animations=False)
print('HUMAN_REFERENCE',[(o.name,len(o.data.vertices)) for o in selected])
