"""Finish the locally photo-fitted FaceBuilder head and seated garments in Blender.
The approved FaceBuilder trial fits the head locally; references are not uploaded.
"""
import bpy,bmesh,math,random
from mathutils import Vector
ROOT=bpy.path.abspath('//../../').rstrip('/')
col=bpy.data.collections['06 - Seated reference likeness']
for o in list(col.objects):
 if o.name.startswith('Finish /'):bpy.data.objects.remove(o,do_unlink=True)
def add(o):
 for c in list(o.users_collection):c.objects.unlink(o)
 col.objects.link(o);return o
def mat(name,c,r=.8):
 m=bpy.data.materials.get(name) or bpy.data.materials.new(name);m.use_nodes=True;p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=(*c,1);p.inputs['Roughness'].default_value=r;return m
shirt=mat('Finish / washed black cotton',(.018,.023,.023),.94)
pants=mat('Finish / warm stone cotton twill',(.29,.265,.225),.87)
hair=mat('Finish / dark brown hair',(.004,.003,.002),.86)
for m in [shirt,pants]:
 p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Sheen Weight'].default_value=.04;p.inputs['Specular IOR Level'].default_value=.05
 n=m.node_tree.nodes.new('ShaderNodeTexNoise');n.inputs['Scale'].default_value=310;n.inputs['Roughness'].default_value=.7
 b=m.node_tree.nodes.new('ShaderNodeBump');b.inputs['Strength'].default_value=.12;b.inputs['Distance'].default_value=.001;m.node_tree.links.new(n.outputs['Fac'],b.inputs['Height']);m.node_tree.links.new(b.outputs['Normal'],p.inputs['Normal'])
def meshobj(name,vs,fs,material,sub=0):
 me=bpy.data.meshes.new(name);me.from_pydata(vs,[],fs);me.update();o=bpy.data.objects.new('Finish / '+name,me);col.objects.link(o);me.materials.append(material)
 for p in me.polygons:p.use_smooth=True
 if sub:mod=o.modifiers.new('Soft cloth surface','SUBSURF');mod.levels=sub;mod.render_levels=sub
 return o
def line(name,points,material,thick=.003):
 cu=bpy.data.curves.new(name,'CURVE');cu.dimensions='3D';cu.resolution_u=8;cu.bevel_depth=thick;cu.bevel_resolution=2;sp=cu.splines.new('NURBS');sp.points.add(len(points)-1)
 for p,co in zip(sp.points,points):p.co=(*co,1)
 sp.order_u=min(3,len(points));sp.use_endpoint_u=True;o=bpy.data.objects.new('Finish / '+name,cu);col.objects.link(o);cu.materials.append(material);return o
# Separate cotton torso shell: rounded neckline, relaxed shoulders, fabric drape.
rings=[(1.23,.335,.205),(1.245,.34,.207),(1.31,.34,.21),(1.43,.345,.205),(1.56,.34,.205),(1.7,.35,.215),(1.86,.375,.225),(2.02,.41,.225),(2.12,.435,.20),(2.17,.42,.185),(2.21,.34,.157),(2.28,.22,.14),(2.335,.136,.119),(2.35,.133,.117)]
vs=[];N=96
for k,(z,rx,ry) in enumerate(rings):
 for i in range(N):
  a=math.tau*i/N;fold=(.006*math.sin(a*11+z*7)+.003*math.sin(a*19-z*4))*(1 if k<10 else .3)
  vs.append(((rx+fold)*math.cos(a),-1.20+(ry+fold)*math.sin(a),z+.005*math.sin(a*7+k*.25)))
fs=[(k*N+i,k*N+(i+1)%N,(k+1)*N+(i+1)%N,(k+1)*N+i) for k in range(len(rings)-1) for i in range(N)]
o=meshobj('tailored cotton tee',vs,fs,shirt,1);s=o.modifiers.new('Cotton shell thickness','SOLIDIFY');s.thickness=.008
for k,n in [(0,'shirt hem'),(len(rings)-1,'ribbed crew neckline')]:line(n,[vs[k*N+i] for i in range(N)]+[vs[k*N]],shirt,.007 if k else .004)
# Upper-arm sleeves, oriented with the anatomical seated upper arm.
for sign in [-1,1]:
 centers=[Vector((sign*.30,-1.18,2.10)),Vector((sign*.38,-1.13,2.04)),Vector((sign*.47,-1.07,1.98)),Vector((sign*.49,-1.035,1.905)),Vector((sign*.491,-1.034,1.895))]
 axis=(centers[-1]-centers[0]).normalized();u=axis.cross(Vector((0,1,0))).normalized();v=axis.cross(u).normalized();sv=[]
 for j,c in enumerate(centers):
  for i in range(64):
   a=math.tau*i/64;r=[.14,.15,.157,.149,.15][j]+.003*math.sin(a*9+j);p=c+(u*math.cos(a)+v*math.sin(a))*r;sv.append(p)
 sf=[(j*64+i,j*64+(i+1)%64,(j+1)*64+(i+1)%64,(j+1)*64+i) for j in range(4) for i in range(64)]
 o=meshobj('short sleeve '+str(sign),sv,sf,shirt,1);o.modifiers.new('Sleeve thickness','SOLIDIFY').thickness=.008;line('sleeve stitched hem '+str(sign),sv[-64:]+[sv[-64]],shirt,.003)
# Extract relaxed trousers from anatomical drape; round the old pixelated material boundaries.
body=bpy.data.objects['Nikhil - anatomical body and clothing'];source=bpy.data.meshes['Nikhil old body backup']
ps=[p for p in source.polygons if p.material_index==2];ids=sorted({v for p in ps for v in p.vertices});mapping={v:i for i,v in enumerate(ids)}
pv=[body.matrix_world@source.vertices[i].co for i in ids];pf=[tuple(mapping[i] for i in p.vertices) for p in ps]
o=meshobj('seated stone trousers',pv,pf,pants,1)
bm=bmesh.new();bm.from_mesh(o.data)
for _ in range(4):bmesh.ops.smooth_vert(bm,verts=[v for v in bm.verts if v.is_boundary],factor=.6,use_axis_x=True,use_axis_y=True,use_axis_z=True)
for v in bm.verts:v.co+=v.normal*.012
bm.to_mesh(o.data);bm.free();o.modifiers.new('Twill thickness','SOLIDIFY').thickness=.007
# Original body now supplies uncovered forearms and hands only, without the old head or painted clothes.
body.data=source.copy();bm=bmesh.new();bm.from_mesh(body.data)
dead=[]
for f in bm.faces:
 c=sum((body.matrix_world@v.co for v in f.verts),Vector())/len(f.verts)
 if c.z>2.30 or (f.material_index==1 and not (abs(c.x)>.35 and c.y>-.98 and c.z<1.90)) or (f.material_index==2 and c.z>.25):dead.append(f);bmesh.ops.delete(bm,geom=dead,context='FACES');bm.to_mesh(body.data);bm.free()
for p in body.data.polygons:p.material_index=0
body.hide_render=False;body.hide_set(False)
# Hands rest on the keyboard. Fade the adjustment from the elbow into each forearm.
inv=body.matrix_world.inverted()
for ve in body.data.vertices:
 p=body.matrix_world@ve.co
 if p.y>-.9:
  t=max(0,min(1,(p.y+.9)/.7));t=t*t*(3-2*t)
  p.y-=.36*t
  p.z+=(1.635-p.z)*t
  ve.co=inv@p
# Match exposed skin with the fitted cheek albedo rather than the old bronze plastic.
for m in body.data.materials:
 if 'skin' in m.name:
  p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=(.41,.29,.215,1);p.inputs['Roughness'].default_value=.64;p.inputs['Subsurface Weight'].default_value=.045
# Full-head hair shell following a low, natural hairline and a high wavy crown.
# Hair is actual geometry; the photo albedo underneath is not used as a silhouette.
random.seed(71);center=Vector((0,-1.255,2.675));rx=.18;ry=.178;rz=.205;vs=[];R=28;N=96
for j in range(R+1):
 t=j/R
 for i in range(N):
  a=math.tau*i/N;front=(math.sin(a)+1)/2
  end=1.98-.43*front+.055*math.sin(a*7)+.045*math.cos(a*11)
  theta=.012+t*end
  puff=.004*math.sin(a*7+theta*5)+.003*math.cos(a*13-theta*9)
  root=max(0,(t-.8)/.2)*.034
  vs.append(center+Vector(((rx+puff-root)*math.sin(theta)*math.cos(a),(ry+puff-root)*math.sin(theta)*math.sin(a),(rz+puff)*math.cos(theta))))
fs=[(j*N+i,j*N+(i+1)%N,(j+1)*N+(i+1)%N,(j+1)*N+i) for j in range(R) for i in range(N)]
meshobj('wavy hair foundation',vs,[tuple(reversed(f)) for f in fs],hair,1)
# Tapered S-shaped locks produce an irregular silhouette without the old floating noodles.
for k in range(2200):
 a=random.uniform(0,math.tau);front=(math.sin(a)+1)/2;end=1.98-.43*front+.055*math.sin(a*7)+.045*math.cos(a*11);theta=random.uniform(.06,end*.97);pts=[]
 for j in range(9):
  t=j/8;th=theta+.19*(t-.5);az=a+.20*(t-.5)+.06*math.sin(t*6.28+k)
  puff=.004*math.sin(az*7+th*5)+.003*math.cos(az*13-th*9)+.002+.003*math.sin(math.pi*t);root=max(0,(th/end-.8)/.2)*.034;p=center+Vector(((rx+puff-root)*math.sin(th)*math.cos(az),(ry+puff-root)*math.sin(th)*math.sin(az),(rz+puff)*math.cos(th)))
  p+=Vector((.003*math.sin(t*5+k),.002*math.cos(t*6+k),.003*math.sin(math.pi*t)))
  pts.append(p)
 lock=line('sculpted wavy lock',pts,hair,random.uniform(.00065,.0011));lock.data.bevel_resolution=0;lock.data.resolution_u=2
 for j,p in enumerate(lock.data.splines[0].points):p.radius=.08+.92*math.sin(math.pi*j/8)**.4
# Fringe curls fall over the forehead as in the supplied references.
for k in range(0):
 x=random.uniform(-.15,.15);base=Vector((x,-1.10,2.78+random.uniform(-.01,.04)));pts=[]
 for j in range(10):
  t=j/9;pts.append(base+Vector((.022*math.sin(t*6+k),.035*math.sin(t*2.3),-.11*t+.014*math.sin(t*7+k))))
 line('forehead fringe',pts,hair,.0014)
# Hide the previous patch, hair, and fill spheres; retain them for reference only.
for ob in col.objects:
 if ob.name.startswith('Wavy') or 'hair volume' in ob.name or 'fitted face' in ob.name or 'transition volume' in ob.name:ob.hide_render=True;ob.hide_set(True)
# Portable woven normal map: unlike procedural nodes this survives glTF export.
tex=bpy.data.images.get('Cotton micro weave normal') or bpy.data.images.new('Cotton micro weave normal',width=128,height=128)
tex.colorspace_settings.name='Non-Color';pixels=[]
for y in range(128):
 for x in range(128):
  nx=.08*math.sin(x*math.tau/16);ny=.08*math.sin(y*math.tau/16);pixels.extend((.5+nx,.5+ny,math.sqrt(max(0,1-nx*nx-ny*ny)),1))
tex.pixels=pixels;tex.pack()
for m in [shirt,pants]:
 n=m.node_tree.nodes.new('ShaderNodeTexImage');n.image=tex;b=m.node_tree.nodes.new('ShaderNodeNormalMap');b.inputs['Strength'].default_value=.30;m.node_tree.links.new(n.outputs['Color'],b.inputs['Color']);m.node_tree.links.new(b.outputs['Normal'],m.node_tree.nodes.get('Principled BSDF').inputs['Normal'])
for o in col.objects:
 if o.type!='MESH' or not o.name.startswith('Finish /') or o.data.materials[0] not in [shirt,pants]:continue
 uv=o.data.uv_layers.new(name='Woven fabric coordinates')
 for p in o.data.polygons:
  for li in p.loop_indices:
   c=o.data.vertices[o.data.loops[li].vertex_index].co;uv.data[li].uv=(math.atan2(c.y+1.2,c.x)*8,c.z*10)
head=bpy.data.objects['Nikhil - FaceBuilder fitted complete head'];head.hide_render=False;head.hide_set(False)
for o in col.objects:
 if 'minimal canvas sneaker' in o.name:o.hide_render=False;o.hide_set(False)
print('CHARACTER_FINISH_READY',len(col.objects))
