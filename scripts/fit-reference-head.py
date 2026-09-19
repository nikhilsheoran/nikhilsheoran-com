"""Local FaceBuilder fitting, using the official installed add-on and an active trial/license.
Run with Blender's background Python after preparing upright local PNG references.
Never uploads reference photos. The EULA/free trial was approved on 2026-09-20.
"""
import bpy,numpy as np
from pathlib import Path
WORK=Path(__file__).resolve().parent.parent/"assets/references/facebuilder-fit"
WORK.mkdir(parents=True,exist_ok=True)
bpy.ops.preferences.addon_enable(module='keentools')
bpy.context.preferences.addons['keentools'].preferences.license_accepted=True
from keentools.blender_independent_packages.pykeentools_loader import module
from keentools.utils.coords import custom_projection_matrix,xy_to_xz_rotation_matrix_3x3
p=module()
print('LICENSE',p.FaceBuilder.license_manager().perform_license_and_trial_check(),flush=True)
photos=[str(WORK/(name+'.png')) for name in ['IMG_6395','IMG_5905','IMG_4529']]
images=[];sizes=[]
for path in photos:
 im=bpy.data.images.load(path);w,h=im.size;a=np.empty(w*h*4,dtype=np.float32);im.pixels.foreach_get(a);images.append(a.reshape(h,w,4));sizes.append((w,h))
class Input(p.FaceBuilderCameraInputI):
 def projection(self,k):
  w,h=sizes[k-1];return custom_projection_matrix(w,h,50,36,.1,1000)
 def view(self,k):return np.eye(4)
 def image_size(self,k):return sizes[k-1]
inp=Input();fb=p.FaceBuilder(inp)
print('MODELS',fb.models_list(),flush=True)
fb.set_use_emotions(False)
for i,im in enumerate(images):
 k=i+1;fb.set_centered_geo_keyframe(k)
 faces=fb.detect_faces(im,1.0);print('FACES',len(faces),flush=True)
 print('POSE',fb.detect_face_pose(k,faces[0]),flush=True)
 pins=fb.add_preset_pins_and_solve(k);print('PINS',len(pins),flush=True)
open(str(WORK/'fitted-state.txt'),'w').write(fb.serialize())
ge=fb.applied_args_model();me=ge.mesh(0)
v=np.array([me.point(i) for i in range(me.points_count())])@xy_to_xz_rotation_matrix_3x3()
f=[[me.face_point(i,j) for j in range(me.face_size(i))] for i in range(me.faces_count())]
print('BOUNDS',v.min(0),v.max(0),'UV',me.uvs_count(),flush=True)
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
mesh=bpy.data.meshes.new('Photo fitted full head topology');mesh.from_pydata(v,[],f);mesh.update();ob=bpy.data.objects.new('Nikhil - FaceBuilder fitted complete head',mesh);bpy.context.collection.objects.link(ob)
uvs=np.array([me.uv(i) for i in range(me.uvs_count())],np.float32);mesh.uv_layers.new().data.foreach_set('uv',uvs.ravel())
for poly in mesh.polygons:poly.use_smooth=True
class Progress(p.ProgressCallback):
 def set_progress_and_check_abort(self,progress):return False
def loader(idx):
 k=idx+1;frame=p.texture_builder.FrameData();frame.geo=fb.applied_args_model_at(k);frame.image=images[idx];frame.model=fb.model_mat(k);frame.view=np.eye(4);frame.projection=inp.projection(k);return frame
texarr=p.texture_builder.build_texture(len(images),loader,Progress(),texture_h=2048,texture_w=2048,back_face_culling=True,equalize_brightness=True,equalize_colour=True,fill_face_texture=True)
print('TEXTURE',texarr.shape,flush=True)
tex=bpy.data.images.new('Nikhil fitted head albedo',width=texarr.shape[1],height=texarr.shape[0],alpha=True);tex.colorspace_settings.name='sRGB';tex.pixels.foreach_set(texarr.ravel());tex.pack()
mat=bpy.data.materials.new('Nikhil - multiview fitted skin');mat.use_nodes=True;nodes=mat.node_tree.nodes;pr=nodes.get('Principled BSDF');pr.inputs['Roughness'].default_value=.63;pr.inputs['Subsurface Weight'].default_value=.04;t=nodes.new('ShaderNodeTexImage');t.image=tex;mat.node_tree.links.new(t.outputs['Color'],pr.inputs['Base Color']);mesh.materials.append(mat)
ob.select_set(True);bpy.context.view_layer.objects.active=ob
bpy.ops.wm.save_as_mainfile(filepath=str(WORK/'fitted-head.blend'))
bpy.ops.export_scene.gltf(filepath=str(WORK/'fitted-head.glb'),export_format='GLB',use_selection=True,export_apply=True)
print('FIT_COMPLETE',flush=True)
