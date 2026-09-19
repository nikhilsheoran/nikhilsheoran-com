"""Refine the open studio in Blender; save a separate source and web assets.
Run in Blender's console: exec(compile(open(PATH).read(), PATH, 'exec'))
Or: blender -b assets/blender/nikhil-studio.blend -t 4 --python scripts/refine-studio.py
"""
import bpy, math
from mathutils import Vector
# Open either source .blend from assets/blender before running this refinement.
ROOT = bpy.path.abspath("//../../").rstrip("/")
assert '02 - Desk chair and props' not in bpy.data.collections, 'Open nikhil-studio.blend before rebuilding; do not refine the detailed file twice.'
OUT = ROOT + '/assets/blender'
scene = bpy.context.scene

def v(p): return Vector((p[0], -p[2], p[1]))
def material(name, color, metal=0, rough=.5):
    m=bpy.data.materials.get(name) or bpy.data.materials.new(name)
    m.use_nodes=True; m.diffuse_color=(*color,1)
    bs=m.node_tree.nodes.get('Principled BSDF')
    bs.inputs['Base Color'].default_value=(*color,1)
    bs.inputs['Metallic'].default_value=metal; bs.inputs['Roughness'].default_value=rough
    return m
silver=material('Bead-blasted aluminum',(.53,.56,.59),.92,.38)
rubber=material('Rubber seals and feet',(.012,.014,.017),0,.84)
steel=material('Graphite powdercoat',(.065,.071,.067),.55,.5)
chrome=material('Satin steel',(.39,.43,.44),.88,.3)
fabric=material('Woven moss upholstery',(.15,.19,.17),0,.92)
thread=material('Upholstery seam',(.11,.14,.12),0,.96)
ceramic=material('Warm porcelain',(.79,.77,.68),0,.24)
coffee=material('Coffee surface',(.048,.021,.009),0,.13)
paper=material('Ivory paper edges',(.74,.72,.62),0,.85)
cover=material('Notebook linen',(.21,.25,.22),0,.87)
green=material('Ficus leaf',(.10,.21,.09),0,.52)
stem=material('Plant stems',(.095,.13,.035),0,.75)
soil=material('Potting soil',(.028,.020,.011),0,1)

# Native microstructure for the close-up review. GLB keeps PBR base properties.
for m,scale,strength in [(silver,1500,.035),(fabric,240,.15),(ceramic,370,.035)]:
    nodes=m.node_tree.nodes; links=m.node_tree.links; bs=nodes.get('Principled BSDF')
    noise=nodes.new('ShaderNodeTexNoise'); noise.inputs['Scale'].default_value=scale
    bump=nodes.new('ShaderNodeBump'); bump.inputs['Strength'].default_value=strength; bump.inputs['Distance'].default_value=.003
    links.new(noise.outputs['Fac'],bump.inputs['Height']); links.new(bump.outputs['Normal'],bs.inputs['Normal'])

furniture=[]
def register(o,name,mat,parent=None,asset=True):
    o.name=name
    if mat: o.data.materials.append(mat)
    if parent: o.parent=parent
    if asset: furniture.append(o)
    return o

def bevel(o,width=.005,segments=3):
    b=o.modifiers.new('Soft manufactured edge','BEVEL'); b.width=width; b.segments=segments
    o.modifiers.new('Weighted normals','WEIGHTED_NORMAL')

def box(name,loc,size,mat,r=.004,parent=None,asset=True):
    bpy.ops.mesh.primitive_cube_add(size=1,location=v(loc));o=bpy.context.object
    o.dimensions=(size[0],size[2],size[1]);bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    register(o,name,mat,parent,asset)
    if r: bevel(o,r)
    return o

def mesh(name,verts,faces,mat,parent=None,asset=True):
    data=bpy.data.meshes.new(name);data.from_pydata([v(p) for p in verts],[],faces);data.update()
    o=bpy.data.objects.new(name,data);scene.collection.objects.link(o);register(o,name,mat,parent,asset)
    return o

def tube(name,points,r,mat,parent=None,asset=True):
    data=bpy.data.curves.new(name,'CURVE');data.dimensions='3D';data.resolution_u=12
    data.bevel_depth=r;data.bevel_resolution=3
    spline=data.splines.new('POLY');spline.points.add(len(points)-1)
    for p,co in zip(spline.points,points): p.co=(*v(co),1)
    o=bpy.data.objects.new(name,data);scene.collection.objects.link(o);register(o,name,mat,parent,asset)
    # Mesh export preserves the exact tube without depending on curve importer support.
    bpy.ops.object.select_all(action='DESELECT');o.select_set(True);bpy.context.view_layer.objects.active=o
    bpy.ops.object.convert(target='MESH')
    return o

def lathe(name,loc,profile,mat,segments=64,asset=True,parent=None):
    verts=[];faces=[]
    for radius,y in profile:
        for j in range(segments):
            a=j/segments*math.tau;verts.append((loc[0]+radius*math.cos(a),loc[1]+y,loc[2]+radius*math.sin(a)))
    for k in range(len(profile)-1):
        for j in range(segments):
            n=(j+1)%segments;faces.append((k*segments+j,k*segments+n,(k+1)*segments+n,(k+1)*segments+j))
    o=mesh(name,verts,faces,mat,parent,asset)
    for p in o.data.polygons:p.use_smooth=True
    return o

def rounded_loop(w,h,r,cy=0,n=12):
    pts=[]
    for cx,yy,start in [(w/2-r,h/2-r,0),(-w/2+r,h/2-r,90),(-w/2+r,-h/2+r,180),(w/2-r,-h/2+r,270)]:
        for j in range(n):
            a=math.radians(start+j/n*90);pts.append((cx+r*math.cos(a),cy+yy+r*math.sin(a)))
    return pts

def ring(name,w,h,r,iw,ih,ir,inner_y,z,mat,parent):
    outer=rounded_loop(w,h,r);inner=rounded_loop(iw,ih,ir,inner_y)
    verts=[(x,y,z) for x,y in outer+inner];n=len(outer)
    faces=[(j,(j+1)%n,(j+1)%n+n,j+n) for j in range(n)]
    o=mesh(name,verts,faces,mat,parent,False)
    sol=o.modifiers.new('Precision bezel thickness','SOLIDIFY');sol.thickness=.004
    bevel(o,.0015,3);return o

# Replace the disconnected rails with a single machined frame and fine gasket.
lid=bpy.data.objects['Lid - screen anchor'];root=bpy.data.objects['MacBook assembly']
for name in ['Bezel left','Bezel right','Bezel top','Bezel chin']:
    if name in bpy.data.objects:bpy.data.objects.remove(bpy.data.objects[name],do_unlink=True)
ring('Continuous aluminum bezel',1.195,.785,.018,1.096,.69,.01,.018,.009,silver,lid)
ring('Display perimeter gasket',1.099,.693,.011,1.085,.679,.007,.018,.014,rubber,lid)
# Actual dished keycap tops with a rounded rectangle outline.
keymat=bpy.data.materials['Keyboard graphite']
for key in list(bpy.data.objects):
    if not (key.name.startswith('Key ') or key.name.startswith('Arrow ')):continue
    size=key.dimensions.copy(); key.modifiers.clear()
    width,depth=size.x,size.y;loops=[]
    for factor,z in [(1,-.004),(1,.002),(.88,.005),(.63,.0025),(.12,.0018)]:
        loops += [(x,z,y) for x,y in rounded_loop(width*factor,depth*factor,min(.006,width*.18)*factor,n=5)]
    n=20;faces=[]
    for k in range(4):
        faces += [(k*n+j,k*n+(j+1)%n,(k+1)*n+(j+1)%n,(k+1)*n+j) for j in range(n)]
    faces.append(tuple(range(4*n,5*n)));faces.append(tuple(reversed(range(n))))
    data=bpy.data.meshes.new('Dished cap topology');data.from_pydata([v(p) for p in loops],[],faces);data.update();key.data=data;key.data.materials.append(keymat)
    bevel(key,.0008,2)
# Recessed vent openings and underside fasteners are real geometry.
for i in range(30):
    box('Hinge exhaust vent %02d'%i,(-.48+i*.033,1.642,-.499),(.020,.009,.008),rubber,.002,asset=False).parent=root
    # Convert above world inputs into laptop-local coordinates after parenting.
    o=bpy.context.object;o.location-=root.location
for x,z in [(-.54,-.34),(.54,-.34),(-.54,.35),(.54,.35),(-.2,-.37),(.2,-.37)]:
    o=lathe('Underside screw',(x,-.025,z),[(0,0),(.007,0),(.007,.001),(0,.001)],chrome,20,False,root)
# More convincing cylinder hinge bearings.
for x in [-.46,.46]:
    tube('Hinge bearing',[(x-.055,.026,-.386),(x+.055,.026,-.386)],.018,chrome,root,False)

# Keep the live-screen geometry out of the web asset and export laptop at local origin.
original_location=root.location.copy();root.location=(0,0,0)
bpy.context.view_layer.update();bpy.ops.object.select_all(action='DESELECT')
for o in [root]+list(root.children_recursive):
    if not o.name.startswith('Display preview'):o.select_set(True)
bpy.ops.export_scene.gltf(filepath=ROOT+'/public/journey/macbook-air-2017.glb',export_format='GLB',use_selection=True,export_apply=True,export_yup=True)
root.location=original_location

# Rebuild the desk frame and dress the scene. Laptop anchors remain unchanged.
for o in list(bpy.data.objects):
    if o.name=='Solid walnut desk' or o.name.startswith('Steel leg'):bpy.data.objects.remove(o,do_unlink=True)
wood=bpy.data.materials['Walnut - Poly Haven CC0']; bs=wood.node_tree.nodes.get('Principled BSDF');bs.inputs['Roughness'].default_value=.6
normal=wood.node_tree.nodes.new('ShaderNodeTexImage');normal.image=bpy.data.images.load(ROOT+'/public/journey/nor_gl.jpg');normal.image.colorspace_settings.name='Non-Color'
normalmap=wood.node_tree.nodes.new('ShaderNodeNormalMap');normalmap.inputs['Strength'].default_value=.18
wood.node_tree.links.new(normal.outputs['Color'],normalmap.inputs['Color']);wood.node_tree.links.new(normalmap.outputs['Normal'],bs.inputs['Normal'])
box('Walnut desktop with eased edge',(0,1.53,-.08),(3.05,.12,1.5),wood,.018)
for x in [-1.30,1.30]:
    for z in [-.65,.49]:
        box('Welded upright',(x,.76,z),(.075,1.42,.075),steel,.007)
        box('Adjustable foot pad',(x,.035,z),(.096,.05,.096),rubber,.012)
        lathe('Foot leveler',(x,.06,z),[(.022,0),(.022,.07)],chrome,24)
        for y in [1.39,.15]:
            tube('Inset frame bolt',[(x-.039,y,z),(x+.039,y,z)],.009,chrome)
    box('Upper rail',(x,1.43,-.08),(.078,.065,1.22),steel,.006)
    box('Lower rail',(x,.17,-.08),(.078,.065,1.22),steel,.006)
box('Rear support rail',(0,1.40,-.65),(2.63,.07,.07),steel,.006)
box('Cable tray',(0,1.30,-.57),(1.4,.07,.18),steel,.014)
# Upholstery: contoured grid cushions, seam piping and underside shell.
def cushion(name,center,w,d,thickness,mat,vertical=False):
    verts=[];faces=[];n=24
    for layer in [0,1]:
        for iy in range(n+1):
            b=iy/n*2-1
            for ix in range(n+1):
                a=ix/n*2-1
                x=a*w/2*math.sqrt(1-.14*b*b);z=b*d/2*math.sqrt(1-.14*a*a)
                dome=(1-a*a)*(1-b*b)
                y=(.025+thickness*.7*dome) if layer else -.025
                if layer:y-=.009*math.exp(-((a/.7)**2+(b/.7)**2)*2)
                p=(x,y,z) if not vertical else (x,-z,y)
                verts.append(tuple(center[k]+p[k] for k in range(3)))
    stride=n+1;area=stride*stride
    for layer in [0,1]:
        for iy in range(n):
            for ix in range(n):
                a=layer*area+iy*stride+ix; f=(a,a+1,a+stride+1,a+stride)
                faces.append(f if layer else tuple(reversed(f)))
    perimeter=list(range(stride))+[j*stride+n for j in range(1,stride)]+[n*stride+j for j in range(n-1,-1,-1)]+[j*stride for j in range(n-1,0,-1)]
    for j,a in enumerate(perimeter):
        b=perimeter[(j+1)%len(perimeter)];faces.append((a,b,b+area,a+area))
    o=mesh(name,verts,faces,mat)
    for p in o.data.polygons:p.use_smooth=True
    points=[verts[area+i] for i in perimeter]+[verts[area+perimeter[0]]]
    tube(name+' stitched piping',points,.0035,thread)
    return o
cushion('Contoured seat',(0,.91,1.40),.84,.81,.065,fabric)
cushion('Contoured backrest',(0,1.39,1.82),.78,.76,.055,fabric,True)
box('Seat mechanism',(0,.83,1.43),(.36,.08,.30),steel,.025)
lathe('Gas lift',(0,.18,1.43),[(.056,0),(.056,.39),(.038,.39),(.038,.67)],chrome)
for side in [-1,1]:
    tube('Backrest support',[(side*.29,.84,1.49),(side*.3,1.02,1.8),(side*.28,1.61,1.87)],.027,steel)
    tube('Armrest support',[(side*.35,.86,1.36),(side*.48,1.17,1.36),(side*.48,1.22,1.18)],.021,steel)
    box('Padded armrest',(side*.48,1.235,1.28),(.095,.055,.43),fabric,.025)
for i in range(5):
    a=i*math.tau/5
    start=(math.sin(a)*.03,.25,1.43+math.cos(a)*.03)
    end=(math.sin(a)*.51,.11,1.43+math.cos(a)*.51)
    tube('Cast aluminum spoke',[start,((start[0]+end[0])*.55,.16,(start[2]+end[2])*.5),end],.036,chrome)
    for side in [-1,1]:
        bpy.ops.mesh.primitive_cylinder_add(vertices=32,radius=.065,depth=.033,location=v((end[0]+side*.028,.072,end[2])))
        o=bpy.context.object;o.rotation_euler.y=math.pi/2;register(o,'Dual caster wheel',rubber);bevel(o,.006)
    box('Caster fork',(end[0],.14,end[2]),(.05,.1,.055),steel,.012)
# Thick-walled mug with an actual interior, rolled lip and handle.
lathe('Porcelain mug',(-1.04,1.59,.15),[(.068,0),(.085,.008),(.092,.16),(.090,.19),(.085,.193),(.079,.188),(.078,.026),(.01,.023),(0,.023)],ceramic)
tube('Mug handle',[(-1.13-.085*math.sin(t),1.695+.07*math.cos(t),.15) for t in [j*math.pi/32 for j in range(33)]],.014,ceramic)
lathe('Coffee meniscus',(-1.04,1.758,.15),[(0,0),(.074,0),(.078,.003)],coffee)
# Notebook with separate covers, paper block, visible folio edges and elastic band.
for y in [1.606,1.65]:box('Linen notebook cover',(1.04,y,-.13),(.44,.008,.61),cover,.008)
box('Notebook paper block',(1.045,1.628,-.13),(.414,.034,.58),paper,.006)
for i in range(10):tube('Page edge',[(.849,1.612+i*.0032,.163),(1.25,1.612+i*.0032,.163)],.0007,thread)
box('Notebook elastic',(1.18,1.655,-.13),(.02,.003,.612),rubber,.001)
tube('Pencil',[(.89,1.672,-.33),(.95,1.672,.11)],.009,steel)
tube('Graphite tip',[(.95,1.672,.11),(.954,1.672,.139)],.003,rubber)
# Small plant: curved leaves with central veins rather than spheres.
lathe('Planter',(-1.18,1.59,-.57),[(.079,0),(.088,.005),(.116,.195),(.113,.211),(.102,.211),(.095,.03)],ceramic)
lathe('Soil',(-1.18,1.774,-.57),[(0,0),(.101,0)],soil)
for i in range(9):
    a=i*2.39996;h=.20+(i%4)*.055
    top=(-1.18+math.cos(a)*.12,1.79+h,-.57+math.sin(a)*.12)
    tube('Plant branch',[(-1.18,1.77,-.57),(-1.18+math.cos(a)*.04,1.85,-.57+math.sin(a)*.04),top],.003,stem)
    verts=[];faces=[]
    for j in range(13):
        t=j/12;w=math.sin(math.pi*t)*.046
        for side in [-1,0,1]:
            verts.append((top[0]+math.cos(a)*t*.15-math.sin(a)*w*side,top[1]+math.sin(t*math.pi)*.035-t*.07-abs(side)*.009,top[2]+math.sin(a)*t*.15+math.cos(a)*w*side))
    for j in range(12):
        for k in range(2):
            q=j*3+k;faces.append((q,q+1,q+4,q+3))
    o=mesh('Curved ficus leaf',verts,faces,green)
    for p in o.data.polygons:p.use_smooth=True
    solid=o.modifiers.new('Leaf thickness','SOLIDIFY');solid.thickness=.0008
    tube('Leaf midrib',[verts[j*3+1] for j in range(13)],.0006,stem)

# Correct the desk UVs: grain should use the complete image, not the cube's atlas island.
obj=bpy.data.objects['Walnut desktop with eased edge']
uv=obj.data.uv_layers.active
for face in obj.data.polygons:
    for li in face.loop_indices:
        co=obj.data.vertices[obj.data.loops[li].vertex_index].co
        if abs(face.normal.z)>.5: value=((co.x/3.05+.5)*1.4,co.y/1.5+.5)
        elif abs(face.normal.y)>.5:value=(co.x/3.05+.5,co.z*.5+.5)
        else:value=(co.y/1.5+.5,co.z*.5+.5)
        uv.data[li].uv=value
# A reusable tangent-space weave map exports faithfully to WebGL, unlike Blender-only noise.
image=bpy.data.images.new('Upholstery woven normal',width=128,height=128)
image.colorspace_settings.name='Non-Color'
pixels=[]
for y in range(128):
    for x in range(128):
        nx=math.sin(x*math.tau/8)*.18; ny=math.sin(y*math.tau/8)*.18
        if ((x//8)+(y//8))%2: nx*=.25
        else: ny*=.25
        pixels.extend((.5+nx,.5+ny,1,1))
image.pixels.foreach_set(pixels);image.pack()
mat=bpy.data.materials['Woven moss upholstery'];nodes=mat.node_tree.nodes;links=mat.node_tree.links
tex=nodes.new('ShaderNodeTexImage');tex.image=image
normal=nodes.new('ShaderNodeNormalMap');normal.inputs['Strength'].default_value=.32
links.new(tex.outputs['Color'],normal.inputs['Color']);links.new(normal.outputs['Normal'],nodes.get('Principled BSDF').inputs['Normal'])
for name in ['Contoured seat','Contoured backrest']:
    obj=bpy.data.objects[name];uv=obj.data.uv_layers.new(name='Fabric weave UV')
    for face in obj.data.polygons:
        for li in face.loop_indices:
            co=obj.data.vertices[obj.data.loops[li].vertex_index].co
            uv.data[li].uv=(co.x*7,(co.y if name=='Contoured seat' else co.z)*7)

# Organize editable sources and export the furniture independently of the live screen.
collection=bpy.data.collections.new('02 - Desk chair and props');scene.collection.children.link(collection)
for o in furniture:
    for c in list(o.users_collection):c.objects.unlink(o)
    collection.objects.link(o)
bpy.ops.object.select_all(action='DESELECT')
for o in furniture:o.select_set(True)
bpy.ops.export_scene.gltf(filepath=ROOT+'/public/journey/studio-furniture.glb',export_format='GLB',use_selection=True,export_apply=True,export_yup=True)
# Ground and a neutral camera background keep material review lighting meaningful.
if 'Studio ground - render only' not in bpy.data.objects:
    bpy.ops.mesh.primitive_plane_add(size=200,location=(0,0,-.025))
    ground=bpy.context.object;ground.name='Studio ground - render only'
    mat=bpy.data.materials.new('Studio ground');mat.diffuse_color=(.19,.225,.20,1);mat.use_nodes=True
    bs=mat.node_tree.nodes.get('Principled BSDF');bs.inputs['Base Color'].default_value=(.19,.225,.20,1);bs.inputs['Roughness'].default_value=.85
    ground.data.materials.append(mat)

# Save a useful overview viewport, with all editable models available in the Outliner.
scene.camera.location=v((4.4,3.75,5.3));scene.camera.rotation_euler=(v((0,1.20,.30))-scene.camera.location).to_track_quat('-Z','Y').to_euler();scene.camera.data.lens=48
scene.render.resolution_x=1400;scene.render.resolution_y=1000;scene.render.resolution_percentage=65
scene.cycles.samples=16;scene.render.threads_mode='FIXED';scene.render.threads=4
scene.render.filepath=OUT+'/studio-detailed-preview.png'
for screen in bpy.data.screens:
    for area in screen.areas:
        if area.type=='VIEW_3D':
            area.spaces.active.region_3d.view_distance=6
            area.spaces.active.region_3d.view_location=v((0,1.2,.25))
            area.spaces.active.overlay.show_overlays=False
            area.spaces.active.shading.color_type='MATERIAL'
bpy.ops.file.pack_all();bpy.ops.wm.save_as_mainfile(filepath=OUT+'/nikhil-studio-detailed.blend')
print('DETAILED_STUDIO_READY',len(furniture),'furniture objects')
