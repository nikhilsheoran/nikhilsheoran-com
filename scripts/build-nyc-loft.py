"""Build the airy apartment set in the live Blender studio via MCP.
Two scene units per metre. Existing desk/camera anchors are preserved.
"""
import bpy,math,random
from mathutils import Vector
ROOT=bpy.path.abspath('//../../').rstrip('/')
scene=bpy.context.scene
assert '05 - Manhattan apartment' not in bpy.data.collections,'Already built; open the calibrated source before rebuilding.'
collection=bpy.data.collections.new('05 - Manhattan apartment');scene.collection.children.link(collection)
parts=[]
def v(p):return Vector((p[0],-p[2],p[1]))
def mat(name,c,rough=.6,metal=0):
 m=bpy.data.materials.new(name);m.use_nodes=True;m.diffuse_color=(*c,1)
 p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=(*c,1);p.inputs['Roughness'].default_value=rough;p.inputs['Metallic'].default_value=metal
 return m
plaster=mat('Loft - chalk plaster',(.77,.745,.685),.88)
stone=mat('Loft - honed travertine',(.58,.55,.47),.72)
linen=mat('Loft - ivory linen',(.67,.65,.58),.93)
charcoal=mat('Loft - warm charcoal',(.032,.035,.032),.57)
bronze=mat('Loft - aged bronze',(.28,.19,.09),.4,.7)
rug=mat('Loft - woven wool',(.52,.49,.42),.97)
bookmats=[mat('Loft - book '+str(i),c,.86) for i,c in enumerate([(.42,.31,.21),(.55,.56,.48),(.16,.23,.23),(.66,.60,.47),(.28,.25,.22)])]
# Fine procedural oak texture, embedded in glTF rather than a Blender-only shader.
w,h=512,128;pixels=[]
for y in range(h):
 for x in range(w):
  grain=math.sin(y*.53+math.sin(x*.022)*.42+math.sin(x*.063)*.12)*.022+math.sin(y*2.13+math.sin(x*.037))*.008
  pores=max(0,math.sin(y*5.1+math.sin(x*.09))-.9)*.07
  pixels.extend((.69+grain-pores,.53+grain-pores,.34+grain-pores,1))
im=bpy.data.images.new('Quarter sawn pale oak grain',width=w,height=h);im.pixels=pixels;im.pack()
oak=mat('Loft - pale oiled oak',(.69,.53,.34),.62)
n=oak.node_tree.nodes;t=n.new('ShaderNodeTexImage');t.image=im;oak.node_tree.links.new(t.outputs['Color'],n.get('Principled BSDF').inputs['Base Color'])
# Lighter desk, calmer matte finish, no dark high-contrast normal map.
desk=bpy.data.objects['Walnut desktop with eased edge'];desk.data.materials.clear();desk.data.materials.append(oak)
for o in bpy.data.collections['02 - Desk chair and props'].objects:
 if any(s in o.name for s in ['Welded','Upper rail','Lower rail','Rear support','Cable tray']):
  o.data.materials.clear();o.data.materials.append(charcoal)
# The desk plant obstructed the sitter; move it to the window ledge as one cluster.
plant_words=['Planter','Soil','Ficus','Plant stem','Plant branch','Leaf','leaf']
for o in bpy.data.collections['02 - Desk chair and props'].objects:
 if any(s in o.name for s in plant_words):o.location+=v((-3.7,-.82,7.55))
def register(o,name,m):
 o.name=name
 for c in list(o.users_collection):c.objects.unlink(o)
 collection.objects.link(o)
 if m:o.data.materials.append(m)
 parts.append(o);return o
def box(name,loc,size,m,r=.02):
 bpy.ops.mesh.primitive_cube_add(size=1,location=v(loc));o=bpy.context.object;o.dimensions=(size[0],size[2],size[1]);bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
 register(o,name,m)
 if r:
  b=o.modifiers.new('Rounded construction edge','BEVEL');b.width=r;b.segments=3;o.modifiers.new('Weighted surface normals','WEIGHTED_NORMAL')
 return o
def tube(name,points,r,m):
 d=bpy.data.curves.new(name,'CURVE');d.dimensions='3D';d.bevel_depth=r;d.bevel_resolution=3
 s=d.splines.new('POLY');s.points.add(len(points)-1)
 for p,co in zip(s.points,points):p.co=(*v(co),1)
 o=bpy.data.objects.new(name,d);scene.collection.objects.link(o);register(o,name,m)
 bpy.ops.object.select_all(action='DESELECT');o.select_set(True);bpy.context.view_layer.objects.active=o;bpy.ops.object.convert(target='MESH');return o
def plane(name,verts,m,uv=None):
 d=bpy.data.meshes.new(name);d.from_pydata([v(p) for p in verts],[],[(0,1,2,3)]);d.update()
 o=bpy.data.objects.new(name,d);scene.collection.objects.link(o);register(o,name,m)
 layer=d.uv_layers.new()
 for i,coord in enumerate(uv or [(0,0),(1,0),(1,1),(0,1)]):layer.data[i].uv=coord
 return o
# BITS mark centered on the notebook cover, texture remains attached to the cover.
logo=mat('BITS Pilani printed cover',(.9,.88,.8),.84);n=logo.node_tree.nodes;l=logo.node_tree.links;p=n.get('Principled BSDF')
t=n.new('ShaderNodeTexImage');t.image=bpy.data.images.load(ROOT+'/public/journey/bits-pilani-logo.png');l.new(t.outputs['Color'],p.inputs['Base Color']);l.new(t.outputs['Alpha'],p.inputs['Alpha']);logo.surface_render_method='DITHERED'
plane('BITS Pilani diary mark',[(.9,1.656,-.083),(1.18,1.656,-.083),(1.18,1.656,-.177),(.9,1.656,-.177)],logo)
# Plank floor and a low, soft rug around the central desk.
random.seed(27)
for row in range(32):
 for col in range(5):
  x=-9.69+row*.625;z=-8.0+col*3.6
  box('Oak floor plank', (x,-.075,z),(.619,.10,3.592),oak,.003)
box('Central wool rug',(0,-.006,.7),(5.1,.025,4.3),rug,.12)
# Window wall: split piers, sill and thin blackened-steel frames. Open front/roof
# keeps orbit navigation readable instead of trapping the camera behind walls.
box('Window lower plinth',(0,.37,8.25),(20,.74,.32),plaster,.01)
box('Window head',(0,6.4,8.25),(20,.5,.32),plaster,.01)
box('Deep oak window sill',(0,.77,8.1),(20,.09,.65),oak,.012)
for x in [-9.8,-6.55,-3.3,0,3.3,6.55,9.8]:
 box('Slender steel mullion',(x,3.6,8.22),(.06,5.55,.12),charcoal,.005)
for y in [.85,4.55,6.35]:box('Window horizontal rail',(0,y,8.22),(19.65,.055,.12),charcoal,.005)
# Inward-facing cutaway walls, plus skirting and slim reveal details.
plaster.use_backface_culling=True
plane('West plaster wall',[(-10,0,-9.8),(-10,0,8.4),(-10,6.6,8.4),(-10,6.6,-9.8)],plaster)
plane('East plaster wall',[(10,0,8.4),(10,0,-9.8),(10,6.6,-9.8),(10,6.6,8.4)],plaster)
for x in [-9.95,9.95]:box('Oak skirting',(x,.15,-.5),(.05,.3,18),oak,.008)
# Low linen sofa off the orbit's central reading corridor.
box('Sofa oak platform',(-6.65,.33,1.4),(2.6,.18,4.5),oak,.05)
for z in [-.03,1.4,2.83]:
 box('Linen seat cushion',(-6.6,.61,z),(2.38,.43,1.4),linen,.18)
 box('Linen back cushion',(-7.57,1.15,z),(.42,1.02,1.42),linen,.16)
for z in [-.87,3.67]:box('Sofa arm',(-6.7,.87,z),(2.65,1.0,.27),linen,.12)
# Cushion piping follows the upholstery instead of floating UI-like shapes.
for z in [-.03,1.4,2.83]:
 tube('Seat stitched welt',[(-7.64,.72,z-.64),(-5.53,.72,z-.64),(-5.53,.72,z+.64),(-7.64,.72,z+.64),(-7.64,.72,z-.64)],.006,rug)
box('Travertine coffee table',(-4.6,.59,1.65),(1.4,.13,2.05),stone,.16)
for z in [1.03,2.27]:box('Coffee table slab leg',(-4.6,.3,z),(1.02,.55,.15),stone,.02)
# Restrained shelf wall: a few books, substantial empty space.
for y in [.44,1.35,2.26,3.17]:box('Floating oak shelf',(8.7,y,.6),(1.65,.08,6),oak,.014)
for z in [-2.45,3.65]:box('Shelf side upright',(9.35,1.77,z),(.12,3.5,.1),charcoal,.008)
for group in range(6):
 y=.51+(group%3)*.91;z=-1.8+(group//3)*3.5
 for j in range(5):
  height=.40+random.random()*.17
  box('Book spine',(8.65,y+height/2,z+j*.12),(.62,height,.09),bookmats[(j+group)%5],.003)
# Simple kitchen wall opposite the window leaves a generous clear central floor.
for x in [-6,-4.8,-3.6,-2.4]:
 box('Flush kitchen cabinet',(x,.85,-8.6),(1.18,1.68,1.15),oak,.012)
 box('Cabinet shadow pull',(x,1.62,-7.998),(1.0,.018,.012),charcoal,.002)
box('Stone kitchen counter',(-4.2,1.73,-8.6),(4.86,.1,1.24),stone,.02)
# Distant skyline backplate plus nearby roof masses gives actual parallax.
sky=mat('Manhattan photographic backdrop',(.7,.75,.8),1);n=sky.node_tree.nodes;p=n.get('Principled BSDF');t=n.new('ShaderNodeTexImage');t.image=bpy.data.images.load(ROOT+'/public/journey/manhattan-view.png');sky.node_tree.links.new(t.outputs['Color'],p.inputs['Base Color']);sky.node_tree.links.new(t.outputs['Color'],p.inputs['Emission Color']);p.inputs['Emission Strength'].default_value=.7
plane('Manhattan skyline',[(33,-3,32),(-33,-3,32),(-33,19,32),(33,19,32)],sky)
facade=mat('Distant warm stone',(.43,.43,.40),.9)
window=mat('Distant blue glass',(.24,.32,.35),.32,.35)
for i in range(9):
 x=-15+i*3.7;height=3.0+random.random()*3.4;z=20+random.random()*4
 box('Nearby rooftop building',(x,height/2-3,z),(2.7,height,2.8),facade,.02)
 box('Roof parapet',(x,height-2.95,z),(2.85,.14,2.94),stone,.02)
 for floor in range(int(height/.65)):
  for col in range(4):box('Distant facade window',(x-1.02+col*.68,floor*.65-2.7,z-1.405),(.34,.42,.012),window,.002)
# The logo is the only strong emitter, so the browser's HDR bloom is selective.
for m in bpy.data.materials:
 if m.name.startswith('Air - illuminated Apple'):
  m.node_tree.nodes.get('Principled BSDF').inputs['Emission Strength'].default_value=5.5
# Native lighting uses the same daylight direction as the web scene.
for name,loc,energy,size,target in [('Window daylight',(-3,5.5,7.5),650,7,(0,1.4,0)),('Soft room bounce',(1,4,-4),180,5,(0,1.5,0))]:
 d=bpy.data.lights.new(name,'AREA');d.energy=energy;d.shape='DISK';d.size=size;o=bpy.data.objects.new(name,d);scene.collection.objects.link(o);o.location=v(loc);o.rotation_euler=(v(target)-o.location).to_track_quat('-Z','Y').to_euler()
# Remove the previous infinite green studio ground from native renders.
for o in bpy.data.objects:
 if ('floor' in o.name.lower() or o.name=='Studio ground - render only') and o not in parts:o.hide_render=True
# Export material-batched assets separately; no source photos go into these files.
def export(objects,path):
 bpy.ops.object.select_all(action='DESELECT')
 for o in objects:o.hide_set(False);o.select_set(True)
 bpy.ops.export_scene.gltf(filepath=ROOT+'/public/journey/'+path,export_format='GLB',use_selection=True,export_apply=True,export_yup=True)
export(parts,'nyc-apartment.glb')
export(list(bpy.data.collections['02 - Desk chair and props'].objects),'studio-furniture.glb')
air=bpy.data.objects['Calibrated Air - 325 x 227 mm'];pos=air.location.copy();air.location=(0,0,0);export([air]+list(air.children_recursive),'macbook-air-calibrated.glb');air.location=pos
scene.camera.location=v((-5,4.1,-6.4));scene.camera.rotation_euler=(v((0,1.8,1.4))-scene.camera.location).to_track_quat('-Z','Y').to_euler();scene.camera.data.lens=28
bpy.ops.wm.save_as_mainfile(filepath=ROOT+'/assets/blender/nikhil-nyc-studio.blend')
print('APARTMENT_READY',len(parts))
