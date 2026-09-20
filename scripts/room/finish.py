"""Portable surface detail and an intimate room footprint; no procedural-only export shaders."""
from mathutils import Matrix
# Keep the central desk, rug, laptop and camera rail unchanged. Bring perimeter furnishings in.
if not scene.get('designed_room_compacted'):
    compact=Matrix.Diagonal((.86,.86,1,1))
    for cname in ['05 - Manhattan apartment','07 - Apartment finish details',COL]:
        for o in bpy.data.collections[cname].objects:
            if o.hide_render or o.parent or o.name.startswith(('BITS','Rubik','Studio / rug','Central wool')):continue
            o.matrix_world=compact @ o.matrix_world
    scene['designed_room_compacted']=True
# Microgeometry is encoded in standard tangent normal textures that also work in glTF.
N=256
random.seed(92)
def surface_maps(kind):
    height=[];rough=[]
    for y in range(N):
        for x in range(N):
            u=x/N*math.tau;w=y/N*math.tau
            if kind=='fabric':
                warp=math.sin(u*32+.3*math.sin(w*16));weft=math.sin(w*32+.3*math.sin(u*16))
                h=.42*warp+.42*weft+.1*math.sin(u*64+w*32)+random.random()*.1
                r=.84+random.random()*.12
            elif kind=='plaster':
                h=random.random()*.22+.12*math.sin(u*7+math.sin(w*9))+.09*math.cos(w*11+u*5)
                r=.84+random.random()*.13
            elif kind=='stone':
                h=.08*math.sin(u*6+1.7*math.sin(w*5))+.04*math.sin(w*17+u*3)+random.random()*.03
                if random.random()<.035:h-=random.random()*.6
                r=.53+random.random()*.25
            else:
                h=.18*math.sin(u*52+math.sin(w*2)*1.9)+.05*math.sin(u*91+w)+random.random()*.04
                r=.37+random.random()*.16
            height.append(h);rough.extend((r,r,r,1))
    normals=[]
    strength={'fabric':.65,'plaster':.3,'stone':.35,'wood':.28}[kind]
    for y in range(N):
        for x in range(N):
            dx=(height[y*N+(x-1)%N]-height[y*N+(x+1)%N])*strength
            dy=(height[((y-1)%N)*N+x]-height[((y+1)%N)*N+x])*strength
            d=math.sqrt(dx*dx+dy*dy+1)
            normals.extend((.5+dx/d*.5,.5+dy/d*.5,.5+.5/d,1))
    result=[]
    for suffix,pixels in [('normal',normals),('roughness',rough)]:
        im=bpy.data.images.get('Studio '+kind+' '+suffix)
        if im is None:im=bpy.data.images.new('Studio '+kind+' '+suffix,N,N,alpha=True)
        im.colorspace_settings.name='Non-Color';im.pixels.foreach_set(pixels);im.pack();result.append(im)
    return result
textures={k:surface_maps(k) for k in ['fabric','plaster','stone','wood']}
material_kinds={oat:'fabric',sage:'fabric',clay:'fabric',ivory:'plaster',stone:'stone',walnut:'wood'}
for m,k in material_kinds.items():
    nodes=m.node_tree.nodes;links=m.node_tree.links;p=shader(m)
    for node in list(nodes):
        if node.label.startswith('Portable surface'):nodes.remove(node)
    nm=nodes.new('ShaderNodeNormalMap');nm.label='Portable surface normal';nm.space='TANGENT';nm.inputs['Strength'].default_value=.65
    ni=nodes.new('ShaderNodeTexImage');ni.image=textures[k][0];ni.label='Portable surface normal texture'
    ri=nodes.new('ShaderNodeTexImage');ri.image=textures[k][1];ri.label='Portable surface roughness'
    links.new(ni.outputs['Color'],nm.inputs['Color']);links.new(nm.outputs['Normal'],p.inputs['Normal']);links.new(ri.outputs['Color'],p.inputs['Roughness'])
    if k=='fabric':p.inputs['Sheen Weight'].default_value=.16;p.inputs['Sheen Roughness'].default_value=.82
# World-density UVs on upholstery and wall panels prevent oversized threads on big furniture.
for o in col.objects:
    if o.type!='MESH' or not any(m in material_kinds for m in o.data.materials):continue
    if o.name.startswith(('Studio / lounge throw','Studio / draped')):continue
    uv=o.data.uv_layers.active or o.data.uv_layers.new(name='UVMap')
    for poly in o.data.polygons:
        n=poly.normal
        # Dominant absolute normal, including inward-facing surfaces.
        axis=0 if abs(n.x)>max(abs(n.y),abs(n.z)) else (1 if abs(n.y)>abs(n.z) else 2)
        axes=[a for a in range(3) if a!=axis]
        for li in poly.loop_indices:
            co=o.matrix_world @ o.data.vertices[o.data.loops[li].vertex_index].co
            uv.data[li].uv=(co[axes[0]]*2,co[axes[1]]*2)
# Lighting for the editable Cycles source, matching the runtime's window and warm practicals.
for name,pos,power,color,radius in [
 ('Studio / lounge lamp glow',(-6.966,1.48,4.0),24,(1,.74,.46),.23),
 ('Studio / paper lantern glow',(-6.966,4.58,1.075),52,(1,.83,.61),.7),
 ('Studio / shelf warm spill',(7.48,3.55,.3),30,(1,.81,.57),.45)]:
    o=bpy.data.objects.get(name)
    if o is None:
        d=bpy.data.lights.new(name,'POINT');o=bpy.data.objects.new(name,d);col.objects.link(o)
    o.location=v(pos);o.data.energy=power;o.data.color=color;o.data.shadow_soft_size=radius
print('Portable materials, smaller footprint, practical lights complete')
print('Lights',[(o.name,o.data.type,o.data.energy) for o in scene.objects if o.type=='LIGHT'])
