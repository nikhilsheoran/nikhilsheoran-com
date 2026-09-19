"""Refine the live apartment set: off-white floor, finished joinery and desk cube.
Run after build-nyc-loft.py through Blender MCP. Half-metre scene units.
"""
import bpy,math,random
from mathutils import Vector
ROOT=bpy.path.abspath('//../../').rstrip('/');scene=bpy.context.scene
name='07 - Apartment finish details'
if name in bpy.data.collections:
 for o in list(bpy.data.collections[name].objects):bpy.data.objects.remove(o,do_unlink=True)
 col=bpy.data.collections[name]
else:col=bpy.data.collections.new(name);scene.collection.children.link(col)
parts=[]
def v(p):return Vector((p[0],-p[2],p[1]))
def shader(m):return next(n for n in m.node_tree.nodes if n.type=='BSDF_PRINCIPLED')
def mat(name,c,rough=.5,metal=0):
 m=bpy.data.materials.new(name);m.use_nodes=True;p=shader(m);p.inputs['Base Color'].default_value=(*c,1);p.inputs['Roughness'].default_value=rough;p.inputs['Metallic'].default_value=metal;return m
def register(o,name,m):
 o.name=name
 for c in list(o.users_collection):c.objects.unlink(o)
 col.objects.link(o)
 if m:o.data.materials.append(m)
 parts.append(o);return o
def box(name,loc,size,m,r=.015):
 bpy.ops.mesh.primitive_cube_add(size=1,location=v(loc));o=bpy.context.object;o.dimensions=(size[0],size[2],size[1]);bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);register(o,name,m)
 if r:
  b=o.modifiers.new('Manufactured edge','BEVEL');b.width=r;b.segments=3;o.modifiers.new('Weighted normals','WEIGHTED_NORMAL')
 return o
def sphere(name,loc,scale,m):
 bpy.ops.mesh.primitive_uv_sphere_add(segments=32,ring_count=16,location=v(loc));o=bpy.context.object;o.scale=(scale[0],scale[2],scale[1]);register(o,name,m)
 for p in o.data.polygons:p.use_smooth=True
 return o
def tube(name,points,r,m):
 d=bpy.data.curves.new(name,'CURVE');d.dimensions='3D';d.bevel_depth=r;d.bevel_resolution=3;s=d.splines.new('POLY');s.points.add(len(points)-1)
 for p,co in zip(s.points,points):p.co=(*v(co),1)
 o=bpy.data.objects.new(name,d);scene.collection.objects.link(o);register(o,name,m);return o
ivory=mat('Finish - warm off white mineral floor',(.73,.71,.665),.8)
rug=mat('Finish - undyed ivory wool',(.66,.645,.605),.97)
ceramic=mat('Finish - glazed warm porcelain',(.71,.7,.66),.23)
plaster=bpy.data.materials['Loft - chalk plaster'];oak=bpy.data.materials['Loft - pale oiled oak'];dark=bpy.data.materials['Loft - warm charcoal'];linen=bpy.data.materials['Loft - ivory linen'];bronze=bpy.data.materials['Loft - aged bronze']
steel=mat('Finish - brushed stainless',(.37,.4,.42),.32,.85);glass=mat('Finish - smoked appliance glass',(.009,.013,.015),.18,.15)
# Replace the plank field with one seamless floor, preserving earlier source geometry hidden.
old=bpy.data.collections['05 - Manhattan apartment']
for o in old.objects:
 if any(k in o.name for k in ['Oak floor plank','Nearby rooftop building','Roof parapet','Distant facade window']):o.hide_render=True;o.hide_set(True)
box('Seamless off white floor',(0,-.075,-.8),(20,.1,18.2),ivory,.008)
o=bpy.data.objects['Central wool rug'];o.data.materials.clear();o.data.materials.append(rug)
# Fine woven texture in a portable normal map, independent of render engine.
im=bpy.data.images.new('Wool weave normal',width=128,height=128);pix=[]
for y in range(128):
 for x in range(128):pix.extend((.5+.065*math.sin(x*math.pi/2),.5+.065*math.sin(y*math.pi/2),.99,1))
im.pixels=pix;im.pack();im.colorspace_settings.name='Non-Color';n=rug.node_tree.nodes;t=n.new('ShaderNodeTexImage');t.image=im;normal=n.new('ShaderNodeNormalMap');normal.inputs['Strength'].default_value=.25;rug.node_tree.links.new(t.outputs['Color'],normal.inputs['Color']);rug.node_tree.links.new(normal.outputs['Normal'],shader(rug).inputs['Normal'])
# Architectural finish: skirting, panel reveals, sockets, ceiling and curtain tracks.
for x in [-9.94,9.94]:
 box('Painted skirting',(x,.12,-.7),(.065,.24,17.8),ivory,.008)
 for z in [-7,-2,3,7]:
  box('Wall double socket',(x*.997,.6,z),(.04,.17,.27),ceramic,.012)
  for dz in [-.06,.06]:box('Socket recess',(x*.994,.6,z+dz),(.042,.045,.045),dark,.006)
box('Off white ceiling',(0,6.65,-.7),(20,.1,18.2),plaster,.01)
for x in [-8,-4,0,4,8]:
 box('Ceiling light recess',(x,6.58,-5),(.48,.015,.48),dark,.025)
 lightmat=mat('Finish - ceiling diffuser '+str(x),(.8,.77,.69),.55);shader(lightmat).inputs['Emission Color'].default_value=(1,.88,.7,1);shader(lightmat).inputs['Emission Strength'].default_value=.6
 box('Ceiling diffuser',(x,6.565,-5),(.35,.02,.35),lightmat,.03)
# Linen curtains with actual folds, hems and rail; stay at window edges.
for side in [-1,1]:
 verts=[];faces=[];nx=80;ny=24
 for j in range(ny+1):
  y=.10+j*6.18/ny
  for i in range(nx+1):
   x=side*9.0+(i/nx-.5)*1.8;z=7.96+.105*math.sin(i/nx*math.pi*16)*( .85+.15*j/ny)
   verts.append(v((x,y,z)))
 for j in range(ny):
  for i in range(nx):a=j*(nx+1)+i;faces.append((a,a+1,a+nx+2,a+nx+1))
 d=bpy.data.meshes.new('Curtain folds');d.from_pydata(verts,[],faces);d.update();o=bpy.data.objects.new('Full height linen curtain',d);scene.collection.objects.link(o);register(o,'Full height linen curtain',linen)
 for p in d.polygons:p.use_smooth=True
 solid=o.modifiers.new('Linen thickness','SOLIDIFY');solid.thickness=.004
 tube('Curtain top rail',[(side*9-.98,6.38,7.95),(side*9+.98,6.38,7.95)],.017,bronze)
# Frame hardware and rubber weather seals make the glazing read as construction.
for x in [-9.8,-6.55,-3.3,0,3.3,6.55,9.8]:
 box('Window seal',(x+.05,3.55,8.19),(.011,5.55,.018),dark,.001)
 for y in [1.05,3.2,6.05]:sphere('Window frame fixing',(x,y,8.12),(.009,.009,.006),steel)
for x in [-6.55,6.55]:tube('Window latch',[(x+.12,2.4,8.07),(x+.12,2.57,8.07),(x+.16,2.60,8.07)],.015,steel)
# Finished kitchen: tiled backsplash, sink, curved faucet, induction hob and oven.
for row in range(4):
 for j in range(20):box('Kitchen backsplash tile',(-6.51+j*.244,1.91+row*.25,-9.2),(.237,.244,.025),ceramic,.007)
box('Sink dark well',(-5.65,1.794,-8.58),(1.0,.015,.69),dark,.08)
box('Sink brushed inset',(-5.65,1.803,-8.58),(.82,.011,.52),steel,.065)
tube('Gooseneck kitchen faucet',[(-5.65,1.81,-8.93),(-5.65,2.22,-8.93),(-5.65,2.35,-8.87),(-5.65,2.37,-8.68),(-5.65,2.27,-8.61)],.027,steel)
sphere('Mixer handle',(-5.42,1.91,-8.91),(.025,.13,.025),steel)
box('Induction ceramic hob',(-3.25,1.794,-8.57),(1.05,.025,.85),glass,.035)
for x in [-3.49,-3.01]:
 for z in [-8.8,-8.36]:
  points=[(x+math.cos(i*math.tau/64)*.155,1.811,z+math.sin(i*math.tau/64)*.155) for i in range(65)];tube('Induction ring',points,.0025,steel)
box('Inset oven surround',(-3.6,.85,-7.985),(1.01,.89,.026),steel,.025)
box('Oven smoked glass',(-3.6,.81,-7.96),(.87,.64,.018),glass,.023)
tube('Oven pull',[(-4,1.22,-7.9),(-3.2,1.22,-7.9)],.02,steel)
box('Integrated refrigerator',(-7.55,1.95,-8.55),(1.45,3.9,1.3),ceramic,.055)
box('Fridge door reveal',(-7.55,1.4,-7.88),(1.34,.014,.012),dark,.001)
tube('Fridge recessed pull',[(-6.94,1.68,-7.86),(-6.94,2.88,-7.86)],.016,steel)
# Coffee corner and restrained kitchen props.
box('Espresso machine body',(-4.67,2.09,-8.74),(.52,.57,.4),steel,.04)
box('Espresso machine dark face',(-4.67,2.08,-8.51),(.45,.43,.04),glass,.015)
box('Espresso drip tray',(-4.67,1.825,-8.43),(.45,.045,.29),steel,.007)
for x in [-4.76,-4.56]:sphere('Ceramic espresso cup',(x,1.91,-8.42),(.07,.08,.07),ceramic)
# Sofa fabric details, extra cushions and folded throw.
for i in range(3):
 x=-7.98+i*1.4
 cushion=box('Soft lumbar cushion',(x,1.36,2.12),(.85,.52,.28),linen,.12);cushion.rotation_euler.x=.16
for j in range(5):box('Folded linen throw',(-7.9,1.08,.58),(.9,.035,1.1),rug,.017)
# Side table with ceramic lamp, shade, book and glass.
box('Reading side table',(-8.9,.68,1.4),(.8,1.36,.8),oak,.035)
sphere('Stoneware lamp base',(-8.9,1.65,1.4),(.16,.27,.16),ceramic)
bpy.ops.mesh.primitive_cone_add(vertices=64,radius1=.33,radius2=.24,depth=.45,location=v((-8.9,2.04,1.4)));register(bpy.context.object,'Linen lampshade',linen)
box('Coffee table monograph',(-4.55,.68,1.4),(.63,.09,.82),dark,.007)
box('Monograph page block',(-4.55,.68,1.4),(.61,.068,.80),ivory,.003)
sphere('Low ceramic bowl',(-4.5,.79,.63),(.24,.08,.24),ceramic)
# Minimal original print pair on side wall, with inset mat and picture moulding.
ink=mat('Finish - print charcoal',(.048,.06,.052),.91)
for z in [-4.8,-2.0]:
 box('Gallery oak picture frame',(9.90,3.18,z),(.13,1.88,1.48),oak,.015)
 box('Gallery cotton mount',(9.817,3.18,z),(.012,1.74,1.34),ivory,.001)
 for k in range(9):tube('Original contour print',[(9.806,2.6+k*.12,z-.4),(9.806,2.66+k*.11,z-.12),(9.806,2.8+k*.10,z+.2),(9.806,2.73+k*.09,z+.4)],.004,ink)
# Physical 57 mm cube, scrambled by legal face turns. Each sticker remains on a cubie.
black=mat('Cube - matte black ABS',(.012,.014,.015),.35)
colors=[mat('Cube - '+n,c,.33) for n,c in [('white',(.82,.82,.78)),('yellow',(.92,.7,.018)),('red',(.63,.018,.014)),('orange',(.94,.18,.008)),('blue',(.012,.13,.65)),('green',(.014,.45,.085))]]
root=bpy.data.objects.new('Scrambled 57 mm Rubik cube',None);col.objects.link(root);root.location=v((-.84,1.662,-.16));root.rotation_euler.z=.31
cubies=[];step=.038
for ix in [-1,0,1]:
 for iy in [-1,0,1]:
  for iz in [-1,0,1]:
   if ix==iy==iz==0:continue
   bpy.ops.mesh.primitive_cube_add(size=.036,location=(ix*step,iy*step,iz*step));o=bpy.context.object;register(o,'Rubik cubie',black);o.parent=root;b=o.modifiers.new('Cubie bevel','BEVEL');b.width=.002;b.segments=3;cube=[o]
   for axis,c in enumerate([ix,iy,iz]):
    if abs(c)!=1:continue
    co=[ix*step,iy*step,iz*step];co[axis]+=c*.0186
    bpy.ops.mesh.primitive_cube_add(size=1,location=co);st=bpy.context.object;sizes=[.031,.031,.031];sizes[axis]=.0012;st.dimensions=sizes;bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);register(st,'Rubik colored tile',colors[axis*2+(c<0)]);st.parent=root;b=st.modifiers.new('Sticker corner radius','BEVEL');b.width=.0017;b.segments=3;cube.append(st)
   cubies.append(cube)
from mathutils import Matrix
for axis,layer,turn in [(0,1,1),(1,-1,-1),(2,1,1),(0,-1,1),(2,-1,-1),(1,1,1),(0,1,-1),(2,1,1)]:
 rot=Matrix.Rotation(turn*math.pi/2,4,'XYZ'[axis])
 for cube in cubies:
  if round(cube[0].location[axis]/step)==layer:
   for o in cube:o.location=rot.to_3x3()@o.location;o.rotation_euler=(rot.to_3x3()@o.rotation_euler.to_matrix()).to_euler()
# Keep the emissive logo sharp: moderate emission with a very small browser halo.
for m in bpy.data.materials:
 if m.name.startswith('Air - illuminated Apple'):shader(m).inputs['Emission Strength'].default_value=2.6
# Export just visible architecture; source keeps earlier hidden construction recoverable.
for o in parts:
 if o.type=='CURVE':
  bpy.ops.object.select_all(action='DESELECT');o.select_set(True);bpy.context.view_layer.objects.active=o;bpy.ops.object.convert(target='MESH')
def export(objects,path):
 bpy.ops.object.select_all(action='DESELECT')
 for o in objects:
  if not o.hide_render:o.hide_set(False);o.select_set(True)
 bpy.ops.export_scene.gltf(filepath=ROOT+'/public/journey/'+path,export_format='GLB',use_selection=True,export_apply=True,export_yup=True,export_meshopt_compression_enable=(path=='nyc-apartment.glb'),export_meshopt_extension='EXT_meshopt_compression')
export(list(old.objects)+list(col.objects),'nyc-apartment.glb')
air=bpy.data.objects['Calibrated Air - 325 x 227 mm'];loc=air.location.copy();air.location=(0,0,0);export([air]+list(air.children_recursive),'macbook-air-calibrated.glb');air.location=loc
bpy.ops.wm.save_as_mainfile(filepath=ROOT+'/assets/blender/nikhil-nyc-studio.blend')
print('APARTMENT_REFINED',len(parts))
