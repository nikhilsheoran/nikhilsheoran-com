"""Local anatomical fit, 181 cm reference stature. Run via Blender MCP.
FACE is the locally extracted landmark dictionary; never commit source photographs.
This is a reference-guided likeness study, not a photogrammetry scan.
"""
import bpy,math,random
from mathutils import Vector,Quaternion
ROOT=bpy.path.abspath('//../../').rstrip('/')
scene=bpy.context.scene
name='06 - Seated reference likeness'
if name in bpy.data.collections:
 for o in list(bpy.data.collections[name].objects):bpy.data.objects.remove(o,do_unlink=True)
 col=bpy.data.collections[name]
else:col=bpy.data.collections.new(name);scene.collection.children.link(col)
parts=[]
def material(name,c,rough=.7):
 m=bpy.data.materials.new(name);m.use_nodes=True;p=next(n for n in m.node_tree.nodes if n.type=='BSDF_PRINCIPLED');p.inputs['Base Color'].default_value=(*c,1);p.inputs['Roughness'].default_value=rough;return m
skin=material('Nikhil - warm skin',(.40,.245,.16),.57)
shirt=material('Nikhil - charcoal cotton',(.019,.023,.022),.93)
pants=material('Nikhil - sand twill',(.36,.32,.24),.86)
shoe=material('Nikhil - off white sneakers',(.65,.63,.57),.8)
hair=material('Nikhil - dark wavy hair',(.012,.009,.007),.62)
def add(o):
 for c in list(o.users_collection):c.objects.unlink(o)
 col.objects.link(o);parts.append(o);return o
base=bpy.data.objects['GEO-body_male_realistic'];body=base.copy();body.data=base.data.copy();body.name='Nikhil - anatomical body and clothing';body.parent=None;body.location=(0,0,0);body.scale=(1,1,1);body.hide_render=False;body.hide_viewport=False;col.objects.link(body);body.hide_set(False);parts.append(body)
for mod in list(body.modifiers):body.modifiers.remove(mod)
for m in [skin,shirt,pants,shoe]:body.data.materials.append(m)
# Garment regions in the undeformed anatomical mesh; loose fabric offset and small folds.
for poly in body.data.polygons:
 c=sum((body.data.vertices[i].co for i in poly.vertices),Vector())/len(poly.vertices)
 poly.material_index=3 if c.z<.09 else 2 if c.z<.95 and abs(c.x)<.26 else 1 if .93<c.z<1.475 and (abs(c.x)<.21 or c.z>1.24) else 0
 poly.use_smooth=True
clothverts=set(i for p in body.data.polygons if p.material_index in [1,2] for i in p.vertices)
for i in clothverts:
 ve=body.data.vertices[i];co=ve.co;amount=.009+(.0025*math.sin(co.z*87+co.x*13)*math.cos(co.y*24));ve.co+=ve.normal*amount
# Smooth piecewise anatomical deformation for a static seated pose. Explicit joint
# targets avoid heat-weight leakage across the closely spaced limbs.
def smooth(x):
 x=max(0,min(1,x));return x*x*(3-2*x)
def segment(p,a,b,c,d):
 a,b,c,d=map(Vector,(a,b,c,d));axis=b-a;target=d-c;t=(p-a).dot(axis)/axis.length_squared
 q=axis.rotation_difference(target);return c+target*t+q@(p-a-axis*t)
def pose(p):
 x,y,z=p;s=-1 if x<0 else 1;ax=abs(x);torso=Vector((x,y,z-.405))
 if (z>.67 and ax>.23) or (z>.96 and ax>.16):
  shoulder=(s*.17,.015,1.36);elbow=(s*.28,.006,1.16);wrist=(s*.38,-.075,.905)
  a=segment(p,shoulder,elbow,(s*.16,0,.99),(s*.24,-.11,.69))
  b=segment(p,elbow,wrist,(s*.24,-.11,.69),(s*.12,-.49,.76))
  arm=a.lerp(b,smooth((1.20-z)/.095))
  blend=smooth((ax-.16)/.09)*smooth((1.47-z)/.07)
  return torso.lerp(arm,blend)
 if z<.95:
  hip=(s*.09,0,.89);knee=(s*.095,-.003,.49);ankle=(s*.095,.015,.085)
  thigh=segment(p,hip,knee,(s*.09,0,.485),(s*.105,-.39,.47))
  shin=segment(p,knee,ankle,(s*.105,-.39,.47),(s*.105,-.39,.065))
  leg=thigh.lerp(shin,smooth((.55-z)/.12))
  return torso.lerp(leg,1-smooth((z-.80)/.15))
 return torso
for ve in body.data.vertices:ve.co=pose(ve.co.copy())
# Stature normalization (base height 1.68996 m) and rotate to face the laptop.
S=2*1.81/1.689961
body.scale=(S,S,S);body.rotation_mode="XYZ";body.rotation_euler=(0,0,math.pi);body.location=(0,-1.22,.06)
bpy.ops.object.select_all(action="DESELECT");body.select_set(True);bpy.context.view_layer.objects.active=body
bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
# Photo-derived face surface with actual landmarks and UVs. Full original is never exported.
pts=FACE['points'];w=FACE['width'];h=FACE['height'];cx=(pts[234][0]+pts[454][0])/2;cy=(pts[10][1]+pts[152][1])/2
width=abs(pts[454][0]-pts[234][0])*w;scale=.31/width
verts=[]
# Match central facial plane to the head, with MediaPipe's relative depth.
for x,y,z in pts[:468]:verts.append(((x-cx)*w*scale,-1.22+.267-z*w*scale*.85,2.565-(y-cy)*h*scale))
tris=[]
for a,b,c in FACE['triangles']:
 va,vb,vc=Vector(verts[a]),Vector(verts[b]),Vector(verts[c])
 if (vb-va).cross(vc-va).y<0:b,c=c,b
 tris.append((a,b,c))
mesh=bpy.data.meshes.new('Reference fitted face topology');mesh.from_pydata(verts,[],tris);mesh.update();face=bpy.data.objects.new('Nikhil - fitted face',mesh);col.objects.link(face);parts.append(face)
source=bpy.data.images.load('/tmp/nikhil-references/face-upright.png',check_existing=True)
# Crop to the landmark bounds before embedding the UV image in the web asset.
x0=max(0,int(min(p[0] for p in pts[:468])*w)-2);x1=min(w,int(max(p[0] for p in pts[:468])*w)+3);y0=max(0,int(min(p[1] for p in pts[:468])*h)-2);y1=min(h,int(max(p[1] for p in pts[:468])*h)+3)
src=list(source.pixels);pixels=[]
for y in range(h-y1,h-y0):pixels.extend(src[(y*w+x0)*4:(y*w+x1)*4])
tex=bpy.data.images.new('Nikhil face UV crop',width=x1-x0,height=y1-y0);tex.pixels=pixels;tex.pack()
fm=material('Nikhil - photographic face albedo',(.4,.25,.17),.72);n=fm.node_tree.nodes;p=next(n for n in n if n.type=='BSDF_PRINCIPLED');t=n.new('ShaderNodeTexImage');t.image=tex;fm.node_tree.links.new(t.outputs['Color'],p.inputs['Base Color']);face.data.materials.append(fm)
uv=mesh.uv_layers.new()
for poly in mesh.polygons:
 poly.use_smooth=True
 for li in poly.loop_indices:
  point=pts[mesh.loops[li].vertex_index];uv.data[li].uv=((point[0]*w-x0)/(x1-x0),1-(point[1]*h-y0)/(y1-y0))
# Continuous scalp volume under the fine locks.
bpy.ops.mesh.primitive_uv_sphere_add(segments=48,ring_count=24,location=(0,-1.24,2.74))
cap=bpy.context.object;cap.name='Nikhil - wavy hair volume';cap.scale=(.177,.167,.14);bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);add(cap);cap.data.materials.append(hair)
for ve in cap.data.vertices:
 p=ve.co;ve.co+=ve.normal*(.006*math.sin(p.x*110)*math.cos(p.y*95))
for p in cap.data.polygons:p.use_smooth=True
# Dense sculpted wavy locks, following the scalp instead of a smooth helmet.
random.seed(37)
for i in range(260):
 az=random.uniform(0,math.tau);elev=random.uniform(.05,1.8);r=.166
 center=Vector((r*math.cos(az)*math.sin(elev),-1.24+r*math.sin(az)*math.sin(elev),2.69+.17*math.cos(elev)))
 d=bpy.data.curves.new('Wavy hair lock','CURVE');d.dimensions='3D';d.bevel_depth=random.uniform(.0025,.0055);d.bevel_resolution=2;spline=d.splines.new('NURBS');spline.points.add(6)
 for j,p in enumerate(spline.points):
  t=j/6;co=center+Vector((.06*(t-.5),.02*math.sin(t*6+i),.016*math.sin(t*7+i)));p.co=(*co,1)
 spline.order_u=3;spline.use_endpoint_u=True;o=bpy.data.objects.new('Wavy black hair',d);col.objects.link(o);o.data.materials.append(hair);parts.append(o)
 bpy.ops.object.select_all(action='DESELECT');o.select_set(True);bpy.context.view_layer.objects.active=o;bpy.ops.object.convert(target='MESH')
# Hide construction rig/targets and original reference. Keep them editable in the source.
for o in col.objects:
 if o not in parts:o.hide_render=True;o.hide_set(True)
bpy.ops.object.select_all(action='DESELECT')
for o in parts:o.hide_set(False);o.select_set(True)
bpy.ops.export_scene.gltf(filepath=ROOT+'/public/journey/nikhil-seated.glb',export_format='GLB',use_selection=True,export_apply=True,export_yup=True)
bpy.ops.wm.save_as_mainfile(filepath=ROOT+'/assets/blender/nikhil-nyc-studio.blend')
print('LIKEnESS_READY',len(parts),S)
