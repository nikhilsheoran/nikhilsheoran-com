"""Create a disposable evaluated export mesh, preserving the editable Blender model."""
import bmesh
# Isolated evaluated copy: fonts, bevels and curved stems become real web geometry.
exportcol=bpy.data.collections.get('10 - Runtime export')
if exportcol:
    for o in list(exportcol.objects):bpy.data.objects.remove(o,do_unlink=True)
else:
    exportcol=bpy.data.collections.new('10 - Runtime export');scene.collection.children.link(exportcol)
bpy.ops.wm.save_as_mainfile(filepath=ROOT+'/assets/blender/nikhil-designed-studio.blend')
dg=bpy.context.evaluated_depsgraph_get();copies=[]
source=[]
for cname in ['05 - Manhattan apartment','07 - Apartment finish details',COL]:
    source.extend([o for o in bpy.data.collections[cname].objects if not o.hide_render and o.type in {'MESH','CURVE','FONT'}])
for o in source:
    data=bpy.data.meshes.new_from_object(o.evaluated_get(dg),preserve_all_data_layers=True,depsgraph=dg)
    data.transform(o.matrix_world)
    # The uninterrupted floor needs enough vertices for soft baked contact shading.
    if o.name=='Seamless off white floor':
        bm=bmesh.new();bm.from_mesh(data)
        bmesh.ops.subdivide_edges(bm,edges=list(bm.edges),cuts=55,use_grid_fill=True)
        bm.to_mesh(data);bm.free()
    cp=bpy.data.objects.new('Runtime / '+o.name,data);exportcol.objects.link(cp);copies.append(cp)
bpy.ops.object.select_all(action='DESELECT')
for o in copies:o.select_set(True)
bpy.context.view_layer.objects.active=copies[0]
bpy.ops.object.join();joined=bpy.context.object;joined.name='Designed apartment - baked runtime mesh'
print('Export sources',len(source),'vertices',len(joined.data.vertices),'faces',len(joined.data.polygons),'materials',len(joined.data.materials))
