import bpy,bmesh,math
from mathutils import Vector
col=bpy.data.collections['06 - Seated reference likeness'];body=bpy.data.objects['Nikhil - anatomical body and clothing']
bm=bmesh.new();bm.from_mesh(body.data)
faces=[f for f in bm.faces if f.calc_center_median().z>1.075 and f.calc_center_median().y<-.055 and abs(f.calc_center_median().x)<.075]
bmesh.ops.delete(bm,geom=faces,context='FACES');bm.to_mesh(body.data);bm.free()
face=bpy.data.objects['Nikhil - fitted face']
for ve in face.data.vertices:ve.co.y+=.035
# Closed, photo-textured eye openings: use the same UV albedo at the rim.
bm=bmesh.new();bm.from_mesh(face.data);bm.edges.ensure_lookup_table()
boundary=[e for e in bm.edges if e.is_boundary]
# Fill only small boundary loops (eyes and mouth), retaining the face perimeter.
result=bmesh.ops.holes_fill(bm,edges=boundary,sides=40)
bm.to_mesh(face.data);bm.free()
shoe=bpy.data.materials.new('Nikhil - canvas shoes');shoe.use_nodes=True;p=next(n for n in shoe.node_tree.nodes if n.type=='BSDF_PRINCIPLED');p.inputs['Base Color'].default_value=(.57,.55,.5,1);p.inputs['Roughness'].default_value=.85
for s in [-1,1]:
 bpy.ops.mesh.primitive_cube_add(size=1,location=(s*.225,-.22,.16));o=bpy.context.object;o.name='Nikhil - minimal canvas sneaker';o.dimensions=(.23,.48,.19);bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
 for c in list(o.users_collection):c.objects.unlink(o)
 col.objects.link(o);o.data.materials.append(shoe);m=o.modifiers.new('Rounded toe and heel','BEVEL');m.width=.075;m.segments=5;o.modifiers.new('Weighted normals','WEIGHTED_NORMAL')
# Restore UVs on the small filled loops from their existing rim vertices.
mesh=face.data;uv=mesh.uv_layers.active;coords={}
for poly in mesh.polygons:
 for li in poly.loop_indices:
  if uv.data[li].uv.length>.001:coords[mesh.loops[li].vertex_index]=uv.data[li].uv.copy()
for poly in mesh.polygons:
 for li in poly.loop_indices:
  vi=mesh.loops[li].vertex_index
  if vi in coords:uv.data[li].uv=coords[vi]
bm=bmesh.new();bm.from_mesh(body.data);bmesh.ops.delete(bm,geom=[f for f in bm.faces if f.calc_center_median().z<.06],context='FACES');bm.to_mesh(body.data);bm.free()
for i,o in enumerate([o for o in col.objects if o.name.startswith('Nikhil - minimal canvas sneaker')]):
 o.location.x=(-1 if i==0 else 1)*.465;o.location.y=-.30;o.location.z=.105;o.scale=(1.25,1.15,1.15)
skin=bpy.data.materials['Nikhil - warm skin']
for name,loc,scale in [('Face transition volume',(0,-1.10,2.54),(.14,.06,.21)),('Neck transition volume',(0,-1.21,2.35),(.105,.105,.13))]:
 bpy.ops.mesh.primitive_uv_sphere_add(segments=32,ring_count=24,location=loc);o=bpy.context.object;o.name=name;o.scale=scale
 for c in list(o.users_collection):c.objects.unlink(o)
 col.objects.link(o);o.data.materials.append(skin)
 for poly in o.data.polygons:poly.use_smooth=True
bpy.ops.object.select_all(action='DESELECT')
for o in col.objects:
 if o.type=='MESH':o.select_set(True)
bpy.ops.export_scene.gltf(filepath=bpy.path.abspath('//../../public/journey/nikhil-seated.glb'),export_format='GLB',use_selection=True,export_apply=True,export_yup=True)
bpy.ops.wm.save_as_mainfile(filepath=bpy.data.filepath)
