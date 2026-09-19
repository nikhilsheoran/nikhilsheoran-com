"""Consolidate editable character sources into the browser asset. Run through Blender MCP."""
import bpy
ROOT=bpy.path.abspath('//../../').rstrip('/')
name='08 - Character render mesh'
if name in bpy.data.collections:
 for o in list(bpy.data.collections[name].objects):bpy.data.objects.remove(o,do_unlink=True)
 rendercol=bpy.data.collections[name]
else:rendercol=bpy.data.collections.new(name);bpy.context.scene.collection.children.link(rendercol)
deps=bpy.context.evaluated_depsgraph_get();copies=[]
for o in bpy.data.collections['06 - Seated reference likeness'].objects:
 if o.hide_render or o.type not in ['MESH','CURVE']:continue
 me=bpy.data.meshes.new_from_object(o.evaluated_get(deps),preserve_all_data_layers=True,depsgraph=deps);copy=bpy.data.objects.new('Render / '+o.name,me);rendercol.objects.link(copy);copy.matrix_world=o.matrix_world.copy();copies.append(copy)
bpy.ops.object.select_all(action='DESELECT')
for o in copies:o.select_set(True)
bpy.context.view_layer.objects.active=copies[0];bpy.ops.object.join();render=bpy.context.object;render.name='Nikhil - photo fitted seated character'
for o in bpy.data.collections['06 - Seated reference likeness'].objects:o.hide_render=True;o.hide_set(True)
bpy.ops.export_scene.gltf(filepath=ROOT+'/public/journey/nikhil-seated.glb',export_format='GLB',use_selection=True,export_apply=True,export_yup=True,export_meshopt_compression_enable=True,export_meshopt_extension="EXT_meshopt_compression")
bpy.ops.wm.save_as_mainfile(filepath=ROOT+'/assets/blender/nikhil-nyc-studio.blend')
print('CHARACTER_EXPORTED',len(render.data.vertices),len(render.data.polygons))
