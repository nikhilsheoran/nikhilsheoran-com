"""Continuous trouser legs replace the incomplete cut regions of the original pose."""
import bpy,math
from mathutils import Vector
col=bpy.data.collections['06 - Seated reference likeness'];mat=bpy.data.materials['Finish / warm stone cotton twill']
for o in col.objects:
 if o.name.startswith('Finish / seated stone trousers'):o.hide_render=True;o.hide_set(True)
for sign in [-1,1]:
 keys=[(sign*.21,-1.20,1.13,.205,.17),(sign*.26,-.95,1.09,.20,.17),(sign*.40,-.55,1.02,.18,.17),(sign*.46,-.43,.92,.153,.145),(sign*.465,-.435,.68,.135,.14),(sign*.465,-.445,.43,.12,.12),(sign*.465,-.44,.22,.113,.11)]
 vs=[];N=48;R=70
 def at(t):
  i=min(len(keys)-2,int(t*(len(keys)-1)));f=t*(len(keys)-1)-i
  a,b,c,d=[Vector(keys[max(0,min(len(keys)-1,j))][:3]) for j in [i-1,i,i+1,i+2]]
  p=.5*((2*b)+(-a+c)*f+(2*a-5*b+4*c-d)*f*f+(-a+3*b-3*c+d)*f*f*f)
  return p,keys[i][3]*(1-f)+keys[i+1][3]*f,keys[i][4]*(1-f)+keys[i+1][4]*f
 for j in range(R):
  t=j/(R-1);p,rx,ry=at(t);tangent=(at(min(1,t+.01))[0]-at(max(0,t-.01))[0]).normalized();u=Vector((1,0,0));u=(u-tangent*u.dot(tangent)).normalized();v=tangent.cross(u)
  for i in range(N):
   a=i*math.tau/N;fold=.0035*math.sin(a*7+t*25)+.003*math.sin(t*65+a*2)*math.sin(math.pi*t);vs.append(p+u*((rx+fold)*math.cos(a))+v*((ry+fold)*math.sin(a)))
 fs=[(j*N+i,j*N+(i+1)%N,(j+1)*N+(i+1)%N,(j+1)*N+i) for j in range(R-1) for i in range(N)]
 me=bpy.data.meshes.new('Continuous seated trouser leg');me.from_pydata(vs,[],fs);me.update();o=bpy.data.objects.new('Finish / continuous trouser leg '+str(sign),me);col.objects.link(o);me.materials.append(mat)
 for p in me.polygons:p.use_smooth=True
 uv=me.uv_layers.new()
 for p in me.polygons:
  for li in p.loop_indices:
   idx=me.loops[li].vertex_index;uv.data[li].uv=((idx%N)/N*16,(idx//N)/(R-1)*25)
 o.modifiers.new('Twill thickness','SOLIDIFY').thickness=.006
# Preserve a real hand cross-section instead of flattening all finger vertices to one plane.
body=bpy.data.objects['Nikhil - anatomical body and clothing'];inv=body.matrix_world.inverted()
# Match vertices by index to the original after topology edits is unsafe; restored body is
# already posed. Gently give flattened distal hands depth from their existing normals.
for ve in body.data.vertices:
 p=body.matrix_world@ve.co
 if p.y>-.20:
  p.z+=.012*(body.matrix_world.to_3x3()@ve.normal).z;ve.co=inv@p
for o in col.objects:
 if o.name.startswith('Finish /') or o==body or o.name=='Nikhil - FaceBuilder fitted complete head' or 'minimal canvas sneaker' in o.name:
  if not o.name.startswith(('Finish / seated stone trousers','Finish / forehead fringe')):o.hide_render=False;o.hide_set(False)
print('CONTINUOUS_TROUSERS_READY')
