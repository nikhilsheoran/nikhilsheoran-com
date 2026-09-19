"""Rebuild the editable studio and web laptop. Run: blender -b --python scripts/build-studio.py
Dimensions in scene units (laptop width 1.2). X/Y/Z inputs below match Three.js.
The person is deliberately a reference marker until proper likeness references exist.
"""
import bpy, math, pathlib, sys
from mathutils import Vector
ROOT = pathlib.Path(__file__).resolve().parents[1]
OUT = ROOT / 'assets/blender'
OUT.mkdir(exist_ok=True, parents=True)
bpy.ops.object.select_all(action='SELECT'); bpy.ops.object.delete(use_global=False)
scene=bpy.context.scene
scene.unit_settings.system='METRIC'
# 1.2 scene units corresponds to Apple's 32.5 cm width.
scene.unit_settings.scale_length=.325/1.2

def v(p): return (p[0],-p[2],p[1])
def mat(name,c,metal=0,rough=.5):
 m=bpy.data.materials.new(name); m.diffuse_color=(*c,1); m.use_nodes=True
 bs=m.node_tree.nodes.get('Principled BSDF'); bs.inputs['Base Color'].default_value=(*c,1)
 bs.inputs['Metallic'].default_value=metal; bs.inputs['Roughness'].default_value=rough
 return m
silver=mat('Bead-blasted aluminum',(.64,.67,.69),1,.29)
edge=mat('Polished chamfer',(.72,.75,.77),1,.2)
black=mat('Keyboard graphite',(.012,.015,.018),.08,.48)
rubber=mat('Rubber seals and feet',(.018,.021,.023),0,.8)
white=mat('Key legends',(.82,.85,.83),0,.45)
track=mat('Trackpad etched aluminum',(.51,.55,.57),.65,.4)
ink=mat('Bezel printing',(.055,.06,.065),.1,.6)
parts=[]
def box(name,loc,size,material,bevel=.003,parent=None,asset=True):
 bpy.ops.mesh.primitive_cube_add(size=1,location=v(loc)); o=bpy.context.object; o.name=name
 o.dimensions=(size[0],size[2],size[1]); bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
 o.data.materials.append(material)
 if bevel:
  mod=o.modifiers.new('Machined edge','BEVEL'); mod.width=bevel; mod.segments=3
  mod=o.modifiers.new('Weighted surface normals','WEIGHTED_NORMAL')
 if parent: o.parent=parent
 if asset: parts.append(o)
 return o

def label(text,loc,size,material,parent=None,vertical=False):
 curve=bpy.data.curves.new('Printed '+text,'FONT'); curve.body=text; curve.size=size
 curve.align_x='CENTER'; curve.align_y='CENTER'; curve.resolution_u=3
 o=bpy.data.objects.new('Legend '+text,curve); scene.collection.objects.link(o); o.location=v(loc)
 if vertical: o.rotation_euler.x=math.pi/2
 if parent: o.parent=parent
 o.data.materials.append(material)
 bpy.context.view_layer.objects.active=o; o.select_set(True); bpy.ops.object.convert(target='MESH'); o.select_set(False)
 parts.append(o); return o
# Wedge lower shell: thin front edge, deeper rear. Top remains planar for keys.
verts=[v((x,y,z)) for x,y,z in [(-.6,.019,-.405),(.6,.019,-.405),(.6,.019,.433),(-.6,.019,.433),(-.6,-.025,-.405),(.6,-.025,-.405),(.6,.004,.433),(-.6,.004,.433)]]
mesh=bpy.data.meshes.new('Wedge topology'); mesh.from_pydata(verts,[],[(0,3,2,1),(4,5,6,7),(0,1,5,4),(1,2,6,5),(2,3,7,6),(3,0,4,7)]); mesh.update()
o=bpy.data.objects.new('Tapered unibody',mesh);scene.collection.objects.link(o);o.data.materials.append(silver);parts.append(o)
mod=o.modifiers.new('Continuous bevel','BEVEL');mod.width=.008;mod.segments=5
o.modifiers.new('Weighted normals','WEIGHTED_NORMAL')
box('Keyboard recess',(0,.020,-.105),(1.04,.004,.407),rubber,.014)
# Variable-width US ANSI layout. The four arrow keys form an inverted T.
rows=[
 [('esc',1)]+[(f'F{i}',1) for i in range(1,13)]+[('power',1)],
 [(x,1) for x in ['`','1','2','3','4','5','6','7','8','9','0','-','=']]+[('delete',1.5)],
 [('tab',1.5)]+[(x,1) for x in 'QWERTYUIOP']+[('[',1),(']',1),('\\',1)],
 [('caps',1.8)]+[(x,1) for x in 'ASDFGHJKL']+[(';',1),("'",1),('return',1.8)],
 [('shift',2.2)]+[(x,1) for x in 'ZXCVBNM']+[(',',1),('.',1),('/',1),('shift',2.2)],
 [('fn',1),('ctrl',1),('opt',1),('cmd',1.25),('',5.2),('cmd',1.25),('opt',1),('left',.9),('up/down',.9),('right',.9)]
]
for r,row in enumerate(rows):
 unit=1.01/sum(w for _,w in row); x=-.505
 z=-.272+r*.062
 for title,w in row:
  width=w*unit-.009; center=x+w*unit/2; x+=w*unit
  depth=.035 if r==0 else .050
  if title=='up/down':
   for dz,t in [(-.013,'^'),(.014,'v')]:
    box('Arrow '+t,(center,.027,z+dz),(width,.010,.023),black,.004)
    label(t,(center,.0326,z+dz),.013,white)
  else:
   box('Key '+title,(center,.027,z),(width,.010,depth),black,.005)
   if title: label(title,(center,.0326,z),.014 if len(title)>1 else .025,white)
box('Trackpad seam',(0,.0207,.235),(.43,.002,.25),ink,.012)
box('Glass trackpad',(0,.022,.235),(.422,.003,.242),track,.011)
box('Front opening',(0,.017,.432),(.16,.006,.004),track,.002)
box('Hinge barrel',(0,.026,-.386),(1.04,.037,.04),black,.015)
for x in [-.53,.53]:
 for z in [-.34,.35]: box('Rubber foot',(x,-.026 if z<0 else -.001,z),(.09,.01,.064),rubber,.022)
# Recesses: left MagSafe / USB / audio; right USB / Thunderbolt / SDXC.
for side,ports in [(-1,[('MagSafe',-.31,.06,.012),('USB',-.16,.065,.017),('Audio',-.055,.02,.016)]),(1,[('USB',-.25,.065,.017),('Thunderbolt',-.13,.035,.015),('SDXC',.0,.085,.008)])]:
 for name,z,width,height in ports:
  box(name+' port',(side*.6001,-.003,z),(.002,height,width),rubber,.003)
  if name=='USB':box('USB contact tongue',(side*.6013,-.003,z),(.002,.003,width*.74),track,.001)
# Lid coordinates exactly match the live-screen projection in lib/journey/story.ts.
lid=bpy.data.objects.new('Lid - screen anchor',None);scene.collection.objects.link(lid)
lid.location=v((0,.38,-.395));lid.rotation_euler.x=-.35;parts.append(lid)
box('Lid aluminum back',(0,0,-.007),(1.2,.79,.025),silver,.014,lid)
# Four rails leave a true opening for the DOM screen.
box('Bezel left',(-.575,0,.008),(.05,.77,.021),silver,.008,lid)
box('Bezel right',(.575,0,.008),(.05,.77,.021),silver,.008,lid)
box('Bezel top',(0,.374,.008),(1.12,.041,.021),silver,.008,lid)
box('Bezel chin',(0,-.36,.008),(1.12,.061,.021),silver,.008,lid)
label('MacBook Air',(0,-.355,.021),.018,ink,lid,True)
box('Camera lens',(0,.369,.021),(.011,.009,.003),black,.004,lid)
# Export only the asset; dynamic display and glowing logo stay in the web scene.
bpy.ops.object.select_all(action='DESELECT')
for o in parts: o.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(ROOT/'public/journey/macbook-air-2017.glb'),export_format='GLB',use_selection=True,export_apply=True,export_yup=True)
# Set dressing in the editable source, keeping the laptop collection as a replaceable asset.
root=bpy.data.objects.new('MacBook assembly',None);scene.collection.objects.link(root)
for o in parts:
 if not o.parent:o.parent=root
root.location=v((0,1.63,-.13))
wood=mat('Walnut - Poly Haven CC0',(.5,.35,.2),0,.55)
nodes=wood.node_tree.nodes;links=wood.node_tree.links;bs=nodes.get('Principled BSDF')
tex=nodes.new('ShaderNodeTexImage');tex.image=bpy.data.images.load(str(ROOT/'public/journey/diffuse.jpg'));links.new(tex.outputs['Color'],bs.inputs['Base Color'])
rough=nodes.new('ShaderNodeTexImage');rough.image=bpy.data.images.load(str(ROOT/'public/journey/roughness.jpg'));rough.image.colorspace_settings.name='Non-Color';links.new(rough.outputs['Color'],bs.inputs['Roughness'])
box('Solid walnut desk',(0,1.53,-.08),(3.05,.12,1.5),wood,.025,asset=False)
steel=mat('Powder coated steel',(.035,.046,.041),.7,.42)
for x in [-1.3,1.3]:
 for z in [-.67,.5]:box('Steel leg',(x,.75,z),(.065,1.47,.065),steel,.008,asset=False)
# A clear marker rather than an invented anatomical likeness.
ref=bpy.data.objects.new('PERSON - needs front, profile, three-quarter and seated references',None);scene.collection.objects.link(ref);ref.location=v((0,1.3,1.33));ref.empty_display_size=.4
# Real image preview only for the Blender render. Web keeps the interactive iframe.
screenmat=mat('Display preview',(.08,.1,.1),0,.18)
bs=screenmat.node_tree.nodes.get('Principled BSDF');tex=screenmat.node_tree.nodes.new('ShaderNodeTexImage');tex.image=bpy.data.images.load(str(ROOT/'public/wallpapers/Sonoma.jpeg'))
screenmat.node_tree.links.new(tex.outputs['Color'],bs.inputs['Base Color']);screenmat.node_tree.links.new(tex.outputs['Color'],bs.inputs['Emission Color']);bs.inputs['Emission Strength'].default_value=.35
preview=box('Display preview - replace with live DOM',(0,.018,.019),(1.085,.679,.001),screenmat,0,lid,False)
# Camera and broad studio lights. This is an art-review render, not a claim of a finished scene.
world=scene.world;world.use_nodes=True;nodes=world.node_tree.nodes;nodes.clear();env=nodes.new('ShaderNodeTexEnvironment');env.image=bpy.data.images.load(str(ROOT/'public/journey/studio_small_09_1k.hdr'));bg=nodes.new('ShaderNodeBackground');bg.inputs['Strength'].default_value=.4;out=nodes.new('ShaderNodeOutputWorld');world.node_tree.links.new(env.outputs['Color'],bg.inputs['Color']);world.node_tree.links.new(bg.outputs[0],out.inputs[0])
def area(name,loc,energy,size,target):
 data=bpy.data.lights.new(name,'AREA');data.energy=energy;data.shape='DISK';data.size=size
 o=bpy.data.objects.new(name,data);scene.collection.objects.link(o);o.location=v(loc);o.rotation_euler=(Vector(v(target))-o.location).to_track_quat('-Z','Y').to_euler()
area('Large softbox',(-2,4,2),220,3,(0,1.5,0));area('Rim strip',(2,3,-2),130,2,(0,1.8,0))
bpy.ops.object.camera_add(location=v((1.35,2.7,2.0)));camera=bpy.context.object;camera.name='Laptop detail camera';camera.rotation_euler=(Vector(v((0,1.92,-.2)))-camera.location).to_track_quat('-Z','Y').to_euler();camera.data.lens=52;scene.camera=camera
scene.render.engine='CYCLES';scene.cycles.samples=48;scene.cycles.use_denoising=True
scene.render.resolution_x=1600;scene.render.resolution_y=1100;scene.render.resolution_percentage=100
scene.render.image_settings.file_format='PNG';scene.render.filepath=str(OUT/'studio-preview.png')
bpy.ops.file.pack_all();bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'nikhil-studio.blend'))
if "--render" in sys.argv:
 scene.render.threads_mode="FIXED"; scene.render.threads=4
 bpy.ops.render.render(write_still=True)
print('STUDIO_READY',len(parts),'laptop parts')
