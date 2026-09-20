"""Bake gentle vertex contact shading once, then export meshopt-compressed glTF."""
from mathutils.bvhtree import BVHTree
from mathutils import Vector
joined=bpy.data.objects['Designed apartment - baked runtime mesh'];data=joined.data
verts=[v.co.copy() for v in data.vertices];polys=[list(p.vertices) for p in data.polygons]
# Desk and laptop cast contact occlusion even though they stay in their separate assets.
occluders=list(bpy.data.collections['02 - Desk chair and props'].objects)
air=bpy.data.objects.get('Calibrated Air - 325 x 227 mm')
if air:occluders+=list(air.children_recursive)
dg=bpy.context.evaluated_depsgraph_get()
for o in occluders:
    if o.hide_render or o.type!='MESH':continue
    ev=o.evaluated_get(dg);m=ev.to_mesh();base=len(verts)
    verts.extend([o.matrix_world @ v.co for v in m.vertices]);polys.extend([[base+i for i in p.vertices] for p in m.polygons]);ev.to_mesh_clear()
bvh=BVHTree.FromPolygons(verts,polys,all_triangles=False,epsilon=.0001)
cache={};colors=[];up=Vector((0,0,1));side=Vector((0,1,0))
for vert in data.vertices:
    p=vert.co;n=vert.normal.normalized()
    key=(round(p.x*45),round(p.y*45),round(p.z*45),round(n.x*5),round(n.y*5),round(n.z*5))
    amount=cache.get(key)
    if amount is None:
        tangent=n.cross(up if abs(n.z)<.9 else side).normalized();bitangent=n.cross(tangent)
        occlusion=0
        for i in range(10):
            r=math.sqrt((i+.5)/10);a=i*2.399963
            ray=tangent*(r*math.cos(a))+bitangent*(r*math.sin(a))+n*math.sqrt(1-r*r)
            hit,hn,idx,d=bvh.ray_cast(p+n*.009,ray,1.1)
            if hit is not None:occlusion+=(1-d/1.1)**.7
        amount=1-.52*occlusion/10;cache[key]=amount
    colors.extend((amount,amount,amount,1))
ao=data.color_attributes.get('BakedContact') or data.color_attributes.new(name='BakedContact',type='FLOAT_COLOR',domain='POINT')
ao.data.foreach_set('color',colors);data.color_attributes.active_color=ao
print('Baked',len(cache),'surface samples')
bpy.ops.object.select_all(action='DESELECT');joined.select_set(True);bpy.context.view_layer.objects.active=joined
bpy.ops.export_scene.gltf(filepath='/tmp/nikhil-studio-unoptimized.glb',export_format='GLB',use_selection=True,export_yup=True,export_apply=False,export_vertex_color='NAME',export_vertex_color_name='BakedContact',export_all_vertex_colors=False,export_meshopt_compression_enable=True,export_meshopt_extension='EXT_meshopt_compression')
# Keep the source editable and the viewport free of doubled surfaces.
joined.hide_render=True;joined.hide_set(True)
print('Room exported with baked contact shading')
