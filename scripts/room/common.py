"""Blender MCP modelling helpers. Coordinates use the website's Y-up half-metre units."""
import bpy, math, random
from mathutils import Vector
ROOT='/Users/nikhilsheoran/Documents/Projects/nikhilsheoran-com'
scene=bpy.context.scene
COL='09 - Designed living studio'
col=bpy.data.collections.get(COL)
if col is None:
    col=bpy.data.collections.new(COL);scene.collection.children.link(col)

def v(p):return Vector((p[0],-p[2],p[1]))
def shader(m):return next(n for n in m.node_tree.nodes if n.type=='BSDF_PRINCIPLED')
def mat(name,c,rough=.5,metal=0,emit=0):
    name='Studio / '+name
    m=bpy.data.materials.get(name)
    if m:return m
    m=bpy.data.materials.new(name);m.use_nodes=True
    p=shader(m);p.inputs['Base Color'].default_value=(*c,1);p.inputs['Roughness'].default_value=rough;p.inputs['Metallic'].default_value=metal
    m.diffuse_color=(*c,1)
    if emit:p.inputs['Emission Color'].default_value=(*c,1);p.inputs['Emission Strength'].default_value=emit
    return m

def reg(o,name,m):
    o.name='Studio / '+name
    for c in list(o.users_collection):c.objects.unlink(o)
    col.objects.link(o)
    if m:o.data.materials.append(m)
    return o

def box(name,loc,size,m,r=.02):
    bpy.ops.mesh.primitive_cube_add(size=1,location=v(loc));o=bpy.context.object
    o.dimensions=(size[0],size[2],size[1]);bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);reg(o,name,m)
    if r:
        b=o.modifiers.new('Soft edge','BEVEL');b.width=min(r,min(size)*.48);b.segments=5
        o.modifiers.new('Face normals','WEIGHTED_NORMAL')
    return o

def sphere(name,loc,size,m,seg=32,rings=20):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=seg,ring_count=rings,location=v(loc));o=bpy.context.object;o.scale=(size[0],size[2],size[1]);reg(o,name,m)
    for p in o.data.polygons:p.use_smooth=True
    return o

def cylinder(name,loc,radius,height,m,vertices=48):
    bpy.ops.mesh.primitive_cylinder_add(vertices=vertices,radius=radius,depth=height,location=v(loc));o=bpy.context.object;reg(o,name,m)
    b=o.modifiers.new('Machined lip','BEVEL');b.width=min(.018,height*.18);b.segments=3
    o.modifiers.new('Cylinder normals','WEIGHTED_NORMAL')
    for p in o.data.polygons:p.use_smooth=True
    return o

def tube(name,pts,r,m,closed=False):
    d=bpy.data.curves.new(name,'CURVE');d.dimensions='3D';d.bevel_depth=r;d.bevel_resolution=2
    sp=d.splines.new('POLY');sp.points.add(len(pts)-1)
    for p,co in zip(sp.points,pts):p.co=(*v(co),1)
    sp.use_cyclic_u=closed
    o=bpy.data.objects.new(name,d);col.objects.link(o)
    if m:d.materials.append(m)
    o.name='Studio / '+name
    return o

def mesh(name,vertices,faces,m,uvs=None):
    d=bpy.data.meshes.new(name);d.from_pydata([v(p) for p in vertices],[],faces);d.update();o=bpy.data.objects.new('Studio / '+name,d);col.objects.link(o)
    if m:d.materials.append(m)
    if uvs:
        uv=d.uv_layers.new(name='UVMap')
        for poly in d.polygons:
            for li in poly.loop_indices:uv.data[li].uv=uvs[d.loops[li].vertex_index]
    return o

def lathe(name,loc,profile,m,segments=64):
    verts=[];faces=[];uvs=[]
    for j,(r,y) in enumerate(profile):
        for i in range(segments+1):
            a=i/segments*math.tau;verts.append((loc[0]+r*math.cos(a),loc[1]+y,loc[2]+r*math.sin(a)));uvs.append((i/segments,j/(len(profile)-1)))
    for j in range(len(profile)-1):
        for i in range(segments):
            a=j*(segments+1)+i;faces.append((a,a+segments+1,a+segments+2,a+1))
    o=mesh(name,verts,faces,m,uvs)
    for p in o.data.polygons:p.use_smooth=True
    return o

def text(name,body,loc,size,m,rotation=(math.pi/2,0,0)):
    d=bpy.data.curves.new(name,'FONT');d.body=body;d.size=size;d.extrude=.0005;d.resolution_u=4
    d.align_x='CENTER';o=bpy.data.objects.new('Studio / '+name,d);col.objects.link(o);o.location=v(loc);o.rotation_euler=rotation;d.materials.append(m);return o

def ring(name,loc,rx,rz,y,r,m):
    return tube(name,[(loc[0]+rx*math.cos(i*math.tau/96),y,loc[2]+rz*math.sin(i*math.tau/96)) for i in range(96)],r,m,True)

def pillow(name,loc,size,m,seed=0):
    # Rounded upholstery with an intentionally soft, slightly asymmetric silhouette.
    o=box(name,loc,size,m,min(size)*.40)
    for mod in list(o.modifiers):
        bpy.context.view_layer.objects.active=o;bpy.ops.object.modifier_apply(modifier=mod.name)
    sub=o.modifiers.new('Upholstery smoothing','SUBSURF');sub.levels=1;sub.render_levels=1
    for p in o.data.polygons:p.use_smooth=True
    return o

ivory=mat('warm mineral plaster',(.74,.70,.62),.92)
chalk=mat('chalk porcelain',(.79,.77,.69),.38)
oat=mat('oat boucle',(.65,.57,.45),.93)
sage=mat('sage woven upholstery',(.24,.32,.23),.9)
clay=mat('rust linen',(.44,.16,.095),.9)
ink=mat('charcoal powdercoat',(.028,.034,.032),.48)
bronze=mat('champagne anodized metal',(.40,.29,.15),.3,.72)
chrome=mat('brushed aluminium',(.5,.52,.53),.28,.88)
oak=bpy.data.materials.get('Loft - pale oiled oak')
walnut=mat('smoked walnut',(.16,.075,.035),.52)
stone=mat('honed warm limestone',(.63,.56,.45),.75)
light=mat('warm opal light',(.95,.70,.39),.4,emit=2.2)
leafDark=mat('leaf deep green',(.035,.12,.038),.57)
leafLight=mat('leaf olive',(.13,.24,.072),.52)
stem=mat('plant stems',(.075,.11,.025),.85)
soil=mat('potting earth',(.035,.024,.014),1)
paper=mat('uncoated book paper',(.78,.75,.66),.94)
bookColors=[mat('book '+str(i),c,.8) for i,c in enumerate([(.52,.20,.11),(.15,.28,.27),(.72,.59,.25),(.65,.62,.54),(.085,.12,.15),(.40,.42,.52)])]
