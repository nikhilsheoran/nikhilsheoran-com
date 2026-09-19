"""Convert the user-provided legacy Air into a static, calibrated browser asset.
Run with Blender --background --factory-startup --disable-autoexec SOURCE --python THIS.
Source license and provenance: assets/source-models/MacBook Air/BLENDSWAP_LICENSE.txt.
This is a local prototype; resolve source license ambiguity before public distribution.
"""
import bpy, math, json
import numpy as np
from pathlib import Path
from mathutils import Vector, Matrix
ROOT=Path(__file__).resolve().parents[1]
SOURCE=ROOT/'assets/source-models/MacBook Air'
OUT=ROOT/'assets/blender'
scene=bpy.context.scene
scene.unit_settings.system='METRIC';scene.unit_settings.scale_length=.5
# Two scene units per metre. Published case width/depth, derived 13.3 inch 16:10 display.
S=.002; X=325/324
DW=13.3*25.4*16/math.sqrt(356); DH=DW*10/16
TILT=-.35
# Old file uses mm, origin on the right hinge, front facing -Y.
# Keep the old model intact on disk; bake corrected coordinates into this derivative.
parts=[]
lidnames={'desktop','dorso','guarnizione','schermo'}
for o in list(bpy.data.objects):
 if o.type!='MESH':bpy.data.objects.remove(o,do_unlink=True);continue
 if o.name=='desktop':bpy.data.objects.remove(o,do_unlink=True);continue
 old=o.matrix_world.copy()
 for v in o.data.vertices:
  p=old@v.co
  # Match the active display aperture to the published diagonal and aspect.
  if o.name in lidnames:
   x=p.x+162
   if abs(x)<150: x=x*DW/286
   else:x*=X
   z=p.z
   if 19.9<=z<=208.1:z=114+(z-114)*DH/188
   p.x=x
   p.z=z
   # Rotate around the actual hinge, not the center of the display.
   pivot=Vector((0,-3.5,-5))
   p=pivot+Matrix.Rotation(TILT,3,'X')@(p-pivot)
  else:p.x=(p.x+162)*X
  # Center case depth, place rubber feet on local floor.
  v.co=(p.x*S,(p.y+113.5)*S,(p.z+14.1669502258)*S)
 o.matrix_world=Matrix.Identity(4)
 o.name='Air / '+o.name
 parts.append(o)
 # Original topology already includes bevels. Retain flat machined surfaces.
 o.data.update()

# Upgrade Blender 2.63 material masks to glTF-compatible PBR image maps.
def mat(name,c,metal=0,rough=.5):
 m=bpy.data.materials.new(name);m.use_nodes=True
 p=m.node_tree.nodes.get('Principled BSDF')
 p.inputs['Base Color'].default_value=(*c,1);p.inputs['Metallic'].default_value=metal;p.inputs['Roughness'].default_value=rough
 return m
silver=mat('Air - anodized silver',(.63,.65,.67),.68,.4)
black=mat('Air - black polymer',(.009,.011,.013),0,.49)
rubber=mat('Air - rubber feet and seal',(.016,.017,.019),0,.78)
steel=mat('Air - hinge metal',(.3,.32,.34),.9,.26)
def maskmat(name,file,dark,light,metal=0,rough=.4,emission=False):
 source=bpy.data.images.load(str(SOURCE/file),check_existing=False)
 w,h=source.size
 data=np.empty(w*h*4,dtype=np.float32);source.pixels.foreach_get(data);data=data.reshape((h,w,4))
 mask=1-data[:,:,:3].mean(axis=2)
 def image(name,rgb):
  im=bpy.data.images.new(name,width=w,height=h,alpha=True)
  pixels=np.ones((h,w,4),dtype=np.float32);pixels[:,:,:3]=rgb
  im.pixels.foreach_set(pixels.ravel());im.pack();return im
 rgb=np.array(light)[None,None,:]*(1-mask[:,:,None])+np.array(dark)[None,None,:]*mask[:,:,None]
 m=mat(name,light,metal,rough);n=m.node_tree.nodes;l=m.node_tree.links;p=n.get('Principled BSDF')
 tex=n.new('ShaderNodeTexImage');tex.image=image(name+' color',rgb);l.new(tex.outputs['Color'],p.inputs['Base Color'])
 if emission:
  e=n.new('ShaderNodeTexImage');e.image=image(name+' emission',np.repeat(mask[:,:,None],3,axis=2))
  l.new(e.outputs['Color'],p.inputs['Emission Color']);p.inputs['Emission Strength'].default_value=2.2
 return m
keys=maskmat('Air - backlit key legends','TASTIERA_map.png',(.82,.84,.86),(.009,.011,.013),0,.46)
body=maskmat('Air - body and port markings','PORTE.png',(.035,.038,.043),(.63,.65,.67),.68,.4)
bezel=maskmat('Air - silver display bezel','LOGO.png',(.03,.033,.035),(.63,.65,.67),.68,.4)
back=maskmat('Air - illuminated Apple inlay','MELA.png',(.9,.94,1),(.63,.65,.67),.68,.4,True)
for o in parts:
 key=o.name.split(' / ')[1]
 m={'CORPO':body,'dorso':back,'schermo':bezel,'tastiera':keys,'AUDIO':black,'dentelli':black,'fondo.001':rubber,'guarnizione':rubber,'cerniera.001':steel,'RICCARDO PAVONE':steel}.get(key,silver)
 o.data.materials.clear();o.data.materials.append(m)
 for p in o.data.polygons:p.material_index=0
# Camera lens, absent from the legacy diffuse texture.
pivot=Vector((0,-3.5,-5));p=pivot+Matrix.Rotation(TILT,3,'X')@(Vector((0,1.1,211))-pivot)
bpy.ops.mesh.primitive_uv_sphere_add(segments=24,ring_count=12,radius=1)
lens=bpy.context.object;lens.name='Air / FaceTime camera lens'
lens.location=(p.x*S,(p.y+113.5)*S,(p.z+14.1669502258)*S)
lens.scale=(.0025,.00045,.0025);lens.rotation_euler.x=TILT
lens.data.materials.append(mat('Air - optical glass',(.004,.009,.013),.25,.13));parts.append(lens)
# Geometry-derived anchor of the corrected visible display. Front surface faces -Y.
pivot=Vector((0,-3.5,-5));p=pivot+Matrix.Rotation(TILT,3,'X')@(Vector((0,1.49,114))-pivot)
center=[0,(p.z+14.1669502258)*S,-(p.y+113.5)*S]
meta={'width':.650,'depth':.454,'screenWidth':DW*S,'screenHeight':DH*S,'screenLocalPosition':center,'screenTilt':TILT,'metresPerUnit':.5,'source':'Riccardo Pavone, user-provided BlendSwap archive; see source license'}
(ROOT/'lib/journey/air-model.json').write_text(json.dumps(meta,indent=2)+'\n')
bpy.ops.object.select_all(action='DESELECT')
for o in parts:o.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(ROOT/'public/journey/macbook-air-calibrated.glb'),export_format='GLB',use_selection=True,export_apply=True,export_yup=True)
# Preserve an editable modern source alongside the untouched downloaded file.
for im in list(bpy.data.images):
 if im.source=='FILE' and not im.packed_file and not Path(bpy.path.abspath(im.filepath)).exists():bpy.data.images.remove(im)
bpy.ops.file.pack_all();bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'macbook-air-calibrated.blend'))
print('CALIBRATED',json.dumps(meta))
