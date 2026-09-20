"""Branching, varied leaf clusters instead of evenly spaced procedural tiers."""
from mathutils import Matrix
random.seed(41)
for o in list(col.objects):
    if o.name.startswith(('Studio / window ficus','Studio / entry olive','Studio / library rubber tree')):bpy.data.objects.remove(o,do_unlink=True)
leafA=mat('ficus leaf forest',(.025,.105,.018),.43)
leafB=mat('ficus leaf sunlit',(.085,.19,.028),.49)
bark=mat('living bark',(.11,.065,.031),.94)
before=set(col.objects)
def leaf(name,origin,az,pitch,roll,length,width,m):
    direction=Vector((math.cos(az)*math.cos(pitch),math.sin(pitch),math.sin(az)*math.cos(pitch)))
    across=Vector((-math.sin(az),0,math.cos(az)))
    normal=across.cross(direction).normalized()
    across=across*math.cos(roll)+normal*math.sin(roll)
    normal=across.cross(direction).normalized()
    pts=[];faces=[];uv=[];base=Vector(origin)
    for j in range(13):
        t=j/12
        w=math.sin(math.pi*t)**.72*width*(1+.05*math.sin(t*17))
        for q in [-1,-.5,0,.5,1]:
            p=base+direction*(t*length)+across*(q*w)+normal*(math.sin(t*math.pi)*.055-abs(q)*w*.25-t*t*.045)
            pts.append(tuple(p));uv.append((t,(q+1)/2))
    for j in range(12):
        for k in range(4):
            a=j*5+k;faces.append((a,a+1,a+6,a+5))
    o=mesh(name+' blade',pts,faces,m,uv)
    for p in o.data.polygons:p.use_smooth=True
    tube(name+' midrib',[tuple(base+direction*(t*length)+normal*(math.sin(t*math.pi)*.055-t*t*.045+.002)) for t in [0,.2,.4,.6,.8,1]],.0018,stem)
def tree(name,loc,h,spread,slender=False):
    x,y,z=loc
    lathe(name+' planter',loc,[(0,0),(.35,0),(.43,.06),(.49,.68),(.47,.73),(.435,.73),(.41,.67),(.34,.09),(0,.09)],chalk)
    cylinder(name+' soil',(x,y+.67,z),.42,.025,soil)
    for arm in range(3):
        a=arm*2.2+.4;tx=math.cos(a)*.27;tz=math.sin(a)*.27;top=h*(.87+random.random()*.13)
        tube(name+' curved trunk',[(x,y+.67,z),(x+tx*.16,y+top*.42,z+tz*.12),(x+tx*.6,y+top*.73,z+tz*.76),(x+tx,y+top,z+tz)],.020 if arm==0 else .014,bark)
        for j in range(10):
            t=.41+j*.054+random.random()*.04;yy=y+top*t
            root=Vector((x+tx*t,yy,z+tz*t))
            az=a+j*2.37+random.uniform(-.6,.6);reach=spread*random.uniform(.42,1.0)*(1.3-t*.6)
            end=root+Vector((math.cos(az)*reach,random.uniform(.07,.30),math.sin(az)*reach))
            mid=root.lerp(end,.62)+Vector((0,.08,0))
            tube(name+' fine branch',[tuple(root),tuple(mid),tuple(end)],.006,bark)
            for k in range(5 if slender else 4):
                pos=mid.lerp(end,.25+k*.22)
                la=az+(-1 if k%2 else 1)*random.uniform(.3,1.35)
                length=random.uniform(.26,.43) if slender else random.uniform(.39,.62)
                width=length*(.15 if slender else random.uniform(.28,.36))
                leaf(name,tuple(pos),la,random.uniform(-.42,.72),random.uniform(-.85,.85),length,width,leafA if random.random()<.64 else leafB)
tree('window ficus',(8.64,0,6.65),3.95,.83)
tree('entry olive',(-8.9,0,-6.21),3.68,.77,True)
tree('library rubber tree',(8.92,0,-5.49),3.28,.67)
compact=Matrix.Diagonal((.86,.86,1,1))
for o in set(col.objects)-before:o.matrix_world=compact @ o.matrix_world
print('Organic multi-branch foliage complete')
