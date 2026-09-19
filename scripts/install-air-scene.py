"""Run through Blender MCP with a studio source open. Import browser geometry
with neutral unit conversion, then restore the studio's half-metre unit scale.
The old model remains hidden and recoverable. Run once per studio source.
"""
import bpy, math
from mathutils import Vector
ROOT=bpy.path.abspath('//../../').rstrip('/')
scene=bpy.context.scene
assert not bpy.data.objects.get('Calibrated Air - 325 x 227 mm'), 'Open the pre-calibration studio before importing again.'
# Keep old authored parts recoverable, but out of renders and viewports.
old=bpy.data.objects.get('MacBook assembly')
if old:
 for o in [old]+list(old.children_recursive):o.hide_render=True;o.hide_set(True)
scene.unit_settings.scale_length=1
bpy.ops.import_scene.gltf(filepath=ROOT+'/public/journey/macbook-air-calibrated.glb')
parts=list(bpy.context.selected_objects)
root=bpy.data.objects.new('Calibrated Air - 325 x 227 mm',None);scene.collection.objects.link(root)
for o in parts:
 if not o.parent:o.parent=root
root.location=(0,.13,1.59)
scene.unit_settings.system='METRIC';scene.unit_settings.scale_length=.5
# Native preview plane has exactly the web screen's measured anchor and diagonal.
w=.5729415741179977;h=.3580884838237486
m=bpy.data.materials.get('Display preview')
bpy.ops.mesh.primitive_plane_add(size=1)
o=bpy.context.object;o.name='Calibrated display preview - web iframe replaces this'
o.scale=(w,h,1);o.rotation_euler=(math.pi/2-.35,0,0)
o.location=(0,.4409845962524414,1.8284824905394906)
if m:o.data.materials.append(m)
# Front three-quarter review at realistic scale.
def v(p):return Vector((p[0],-p[2],p[1]))
cam=scene.camera
cam.location=v((.68,2.12,.65));cam.rotation_euler=(v((0,1.8,-.20))-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.lens=48
scene.render.resolution_x=1200;scene.render.resolution_y=850;scene.render.resolution_percentage=100
scene.cycles.samples=24;scene.cycles.use_denoising=True;scene.render.threads_mode='FIXED';scene.render.threads=4
scene.render.filepath=ROOT+'/assets/blender/calibrated-air-review.png'
for screen in bpy.data.screens:
 for a in screen.areas:
  if a.type=='VIEW_3D':a.spaces.active.region_3d.view_perspective='CAMERA'
bpy.ops.wm.save_as_mainfile(filepath=ROOT+'/assets/blender/nikhil-studio-calibrated.blend')
print('IMPORTED_AIR',len(parts), 'scene metres/unit',scene.unit_settings.scale_length)
