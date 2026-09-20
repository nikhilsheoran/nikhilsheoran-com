"""Live Blender finish pass: solved cube, plain floor and pink Apple emission."""
import bpy, math
from mathutils import Matrix
ROOT=bpy.path.abspath('//../../').rstrip('/')
old=bpy.data.collections['05 - Manhattan apartment']
finish=bpy.data.collections['07 - Apartment finish details']
for o in old.objects:
    if o.name.startswith(('Oak floor plank','Oak skirting')):
        o.hide_render=True
        o.hide_set(True)
floor=bpy.data.objects['Seamless off white floor']
p=next(n for n in floor.active_material.node_tree.nodes if n.type=='BSDF_PRINCIPLED')
p.inputs['Base Color'].default_value=(.78,.77,.74,1)
root=bpy.data.objects.get('Scrambled 57 mm Rubik cube')
if root:
    moves=[(0,1,1),(1,-1,-1),(2,1,1),(0,-1,1),(2,-1,-1),(1,1,1),(0,1,-1),(2,1,1)]
    for axis,layer,turn in reversed(moves):
        rot=Matrix.Rotation(-turn*math.pi/2,4,'XYZ'[axis]).to_3x3()
        for o in root.children:
            if round(o.location[axis]/.038)==layer:
                o.location=rot@o.location
                o.rotation_euler=(rot@o.rotation_euler.to_matrix()).to_euler()
    root.name='Solved 57 mm Rubik cube'
    root['configuration']='solved'
for m in bpy.data.materials:
    if m.name.startswith('Air - illuminated Apple'):
        p=next(n for n in m.node_tree.nodes if n.type=='BSDF_PRINCIPLED')
        socket=p.inputs['Emission Color']
        if socket.is_linked:
            source=socket.links[0].from_socket
            if source.node.get('pink_logo_tint'):
                tint=source.node
            else:
                tint=m.node_tree.nodes.new('ShaderNodeMixRGB')
                valid=[i.identifier for i in tint.bl_rna.properties['blend_type'].enum_items]
                assert 'MULTIPLY' in valid
                tint.blend_type='MULTIPLY'
                tint['pink_logo_tint']=True
                tint.inputs[0].default_value=1
                m.node_tree.links.new(source,tint.inputs[1])
                m.node_tree.links.new(tint.outputs[0],socket)
            tint.inputs[2].default_value=(1,.42,.62,1)
        else:
            socket.default_value=(1,.42,.62,1)
        p.inputs['Emission Strength'].default_value=4.8
# Same GLB export format and meshopt extension as the existing scene exporters.
def export(objects,path,compressed=False):
    bpy.ops.object.select_all(action='DESELECT')
    for o in objects:
        if not o.hide_render:
            o.hide_set(False)
            o.select_set(True)
    bpy.ops.export_scene.gltf(filepath=ROOT+'/public/journey/'+path,export_format='GLB',use_selection=True,export_apply=True,export_yup=True,export_meshopt_compression_enable=compressed,export_meshopt_extension='EXT_meshopt_compression')
export(list(old.objects)+list(finish.objects),'nyc-apartment.glb',True)
air=bpy.data.objects['Calibrated Air - 325 x 227 mm']
loc=air.location.copy()
air.location=(0,0,0)
try:export([air]+list(air.children_recursive),'macbook-air-calibrated.glb')
finally:air.location=loc
bpy.ops.wm.save_as_mainfile(filepath=ROOT+'/assets/blender/nikhil-nyc-studio.blend')
print('FINISHED: solved cube; plain off-white floor; pink Apple emission')
