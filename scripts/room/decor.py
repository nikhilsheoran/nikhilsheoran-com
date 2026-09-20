random.seed(38)
# Real leaf meshes, branching stems and hollow, turned stoneware pots.
def plant(name,loc,height,spread,count=45):
    x,y,z=loc
    lathe(name+' planter',loc,[(0,0),(.35,0),(.43,.06),(.49,.68),(.47,.73),(.435,.73),(.41,.67),(.34,.09),(0,.09)],chalk)
    cylinder(name+' soil',(x,y+.67,z),.42,.025,soil)
    tube(name+' trunk',[(x,y+.67,z),(x+.05,y+height*.55,z+.04),(x-.08,y+height,z+.09)],.025,stem)
    for j in range(count):
        a=j*2.39996;h=.88+(height-.92)*(j/(count-1))
        extent=spread*(.44+.56*math.sin((j/(count-1)) * math.pi*.86))
        end=(x+math.cos(a)*extent,y+h-.11,z+math.sin(a)*extent)
        root=(x+.025*math.sin(h),y+h-.21,z+.03)
        tube(name+' branch',[root,((root[0]+end[0])*.5,y+h+.02,(root[2]+end[2])*.5),end],.010 if count>25 else .007,stem)
        length=.37+random.random()*.22;width=length*(.37+random.random()*.11)
        dx,dz=math.cos(a),math.sin(a)
        verts=[];uv=[];faces=[]
        for k in range(11):
            t=k/10;w=math.sin(math.pi*t)**.75*width
            for q in [-1,0,1]:
                verts.append((end[0]+dx*t*length-dz*w*q,end[1]+math.sin(t*math.pi)*.095-t*t*.13-abs(q)*.025,end[2]+dz*t*length+dx*w*q));uv.append((t,(q+1)/2))
        for k in range(10):
            for q in range(2):
                aa=k*3+q;faces.append((aa,aa+3,aa+4,aa+1))
        o=mesh(name+' leaf',verts,faces,leafLight if j%3 else leafDark,uv)
        for p in o.data.polygons:p.use_smooth=True
        tube(name+' leaf vein',[(end[0]+dx*t*length,end[1]+math.sin(t*math.pi)*.095-t*t*.13+.003,end[2]+dz*t*length) for t in [0,.25,.5,.75,1]],.0025,stem)
plant('window ficus',(8.64,0,6.65),3.95,.90,62)
plant('entry olive',(-8.90,0,-6.21),3.68,.75,65)
plant('library rubber tree',(8.92,0,-5.49),3.28,.65,48)
# Smaller sculptural plants and a trailing pothos in the shelving.
for x,y,z in [(9.1,2.23,2.97),(9.0,3.26,-2.45),(-2.5,1.80,-8.73)]:
 lathe('small ceramic planter',(x,y,z),[(0,0),(.14,0),(.18,.03),(.2,.25),(.19,.28),(.16,.28),(.15,.06),(0,.06)],clay if z<0 else chalk,48)
 cylinder('small plant soil',(x,y+.245,z),.165,.02,soil,24)
 for i in range(13):
  a=i*2.399;r=.16+(i%3)*.04
  o=sphere('small plant leaf',(x+math.cos(a)*r,y+.36+(i%4)*.075,z+math.sin(a)*r),(.055,.16,.035),leafLight,16,10);o.rotation_euler.x=math.sin(a)*.45;o.rotation_euler.y=math.cos(a)*.45
for k in range(3):
 pts=[(8.71-k*.04,3.48-t*.1,-2.54+math.sin(t*.7+k)*.1) for t in range(11)]
 tube('pothos hanging stem',pts,.007,stem)
 for j in range(1,10,2):sphere('pothos leaf',(pts[j][0]-.02,pts[j][1],pts[j][2]),(.065,.09,.032),leafLight,16,10)
# Book blocks with separate covers, page edges and readable spine typography.
titles=['CINEMA','DESIGN','WAYS OF SEEING','NYC','FORM','THE CREATIVE ACT','BUILD','OBJECTS','LIGHT','SYSTEMS','STORIES','IDEAS']
for g,(shelf,z0,n) in enumerate([(1.20,-2.9,7),(1.20,-.6,5),(1.20,2.4,4),(2.23,-1.25,6),(2.23,1.35,5),(3.26,-.15,7),(3.26,2.7,5)]):
 z=z0
 for j in range(n):
  h=.51+random.random()*.23;w=.10+random.random()*.06;c=bookColors[(g+j)%len(bookColors)]
  box('book cloth cover',(9.03,shelf+h/2,z),(.84,h,w),c,.004)
  box('book cut page block',(9.057,shelf+h/2,z),(.78,h-.032,w-.023),paper,.002)
  box('book bound spine',(8.60,shelf+h/2,z),(.029,h,w),c,.004)
  text('book spine title',titles[(g*3+j)%len(titles)],(8.582,shelf+h*.50,z),.041,paper,(0,-math.pi/2,0))
  for yy in [.065,h-.055]:box('book foil rule',(8.577,shelf+yy,z),(.004,.006,w*.75),bronze,.001)
  z+=w+.018
# Laid-open magazine on the coffee table with a printed graphic and fine page stack.
box('coffee table art book',(-6.18,.775,1.31),(.67,.085,.86),clay,.008)
box('art book page block',(-6.18,.776,1.31),(.64,.060,.82),paper,.003)
box('art book upper cover',(-6.18,.82,1.31),(.67,.012,.86),clay,.003)
text('art book title','CINEMA',(-6.18,.828,1.2),.085,paper,(0,0,0))
lathe('coffee cup',(-5.72,.73,1.12),[(0,0),(.09,0),(.105,.02),(.115,.18),(.107,.197),(.091,.197),(.081,.04),(0,.04)],chalk,48)
cylinder('coffee surface',(-5.72,.886,1.12),.089,.005,walnut,32)
tube('coffee cup handle',[(-5.61,.89,1.12),(-5.54,.9,1.12),(-5.51,.83,1.12),(-5.55,.77,1.12),(-5.62,.78,1.12)],.017,chalk)
lathe('fruit bowl',(-5.08,.565,2.35),[(0,0),(.16,0),(.31,.06),(.38,.17),(.37,.19),(.33,.15),(.18,.03),(0,.03)],stone,64)
for i in range(3):sphere('clementine',(-5.22+i*.13,.70+(i%2)*.05,2.34+(i%2)*.11),(.11,.105,.11),bookColors[0],24,14)
# A film camera with a layered lens, knurled focus rings, shutter and leatherette.
box('camera leatherette body',(8.99,2.49,.10),(.36,.32,.47),ink,.028)
box('camera metal top',(8.99,2.67,.10),(.37,.045,.47),chrome,.01)
box('camera viewfinder',(8.98,2.735,.10),(.20,.09,.19),ink,.012)
for x,r in [(8.76,.119),(8.69,.115),(8.64,.11)]:
 o=cylinder('camera lens barrel',(x,2.5,.10),r,.06,ink,48);o.rotation_euler.y=math.pi/2
for j in range(36):
 a=j*math.tau/36
 box('lens focus grip',(8.687,2.50+math.cos(a)*.117,.10+math.sin(a)*.117),(.052,.012,.014),chrome,.002)
o=cylinder('camera front glass',(8.604,2.5,.10),.082,.008,mat('optical glass',(.015,.06,.07),.12,.4),48);o.rotation_euler.y=math.pi/2
sphere('camera shutter release',(8.90,2.712,.245),(.025,.02,.025),chrome,20,12)
# Tiny friendly ceramic robot, a restrained personal detail.
pillow('ceramic robot body',(8.98,3.43,1.61),(.26,.33,.26),chalk)
pillow('ceramic robot head',(8.98,3.69,1.61),(.31,.23,.33),chalk)
for z in [1.53,1.69]:sphere('robot eye',(8.812,3.71,z),(.014,.032,.025),ink,16,8)
for z in [1.53,1.69]:box('robot foot',(8.90,3.285,z),(.19,.055,.105),bronze,.017)
# Bookshelf clock, made from small seven-segment bars, faces into the room.
box('clock shell',(9.0,1.39,.49),(.22,.34,.73),chalk,.028)
box('clock glass',(8.881,1.405,.49),(.011,.255,.64),ink,.005)
segments={'8':[0,1,2,3,4,5,6],'2':[0,1,3,4,6],'4':[1,2,5,6]}
for digit,z in [('8',.70),('2',.44),('4',.22)]:
 for seg in segments[digit]:
  yz=[(1.495,z),(1.448,z-.047),(1.365,z-.047),(1.318,z),(1.365,z+.047),(1.448,z+.047),(1.406,z)][seg]
  size=(.012,.015,.075) if seg in [0,3,6] else (.012,.064,.014)
  box('clock glowing segment',(8.868,yz[0],yz[1]),size,light,.005)
for y in [1.37,1.44]:sphere('clock colon',(8.865,y,.58),(.007,.009,.009),light,12,8)
# Original graphic prints: framed cotton paper, dimensional art, calm typography.
for x in [3.35,6.02]:
 box('gallery walnut frame',(x,3.46,-9.29),(2.24,2.65,.10),walnut,.024)
 box('gallery cotton mount',(x,3.46,-9.221),(2.10,2.51,.025),paper,.004)
box('first print sage field',(3.35,3.66,-9.201),(1.66,1.65,.008),sage,.0)
for i in range(7):
 x=2.65+i*.23;h=.25+.63*math.sin(i*.78)**2
 box('graphic city silhouette',(x,3.08+h/2,-9.19),(.16,h,.01),ivory,.0)
o=cylinder('print sunset',(3.64,3.98,-9.18),.32,.012,clay,64);o.rotation_euler.x=math.pi/2
text('first print caption','AFTER HOURS',(3.35,2.45,-9.178),.12,ink)
text('first print subcaption','NEW YORK   /   01',(3.35,2.30,-9.178),.055,ink)
for i in range(15):
 r=.16+i*.043
 pts=[(6.02+r*math.cos(a),3.66+r*math.sin(a),-9.181) for a in [j*math.tau/128 for j in range(129)]]
 tube('orbital graphic',pts,.008,clay if i<8 else sage)
text('second print caption','STAY CURIOUS',(6.02,2.45,-9.178),.12,ink)
text('second print subcaption','MAKE SOMETHING GOOD',(6.02,2.30,-9.178),.055,ink)
# Soft paper lantern over the lounge, with ribs visible in silhouette.
sphere('paper pendant shade',(-8.1,4.6,1.25),(.68,.53,.68),light,64,32)
for i in range(13):
 t=-.9+i*.15;rr=.68*math.sqrt(max(0,1-t*t));ring('lantern bamboo rib',(-8.1,0,1.25),rr,rr,4.6+t*.53,.0045,bronze)
tube('pendant flex',[(-8.1,5.12,1.25),(-8.1,6.55,1.25)],.009,ink)
# Kitchen details: upper shelf, mugs, wooden chopping boards and a gooseneck kettle.
box('kitchen upper shelf',(-4.22,3.2,-8.91),(4.90,.095,.67),oak,.016)
box('kitchen undershelf light',(-4.22,3.14,-8.60),(4.61,.018,.025),light,.005)
for i in range(5):
 lathe('kitchen cup',(-6.1+i*.27,3.25,-8.83),[(0,0),(.085,0),(.105,.18),(.10,.20),(.081,.20),(.067,.04),(0,.04)],chalk,32)
box('round edged chopping board',(-5.94,2.2,-9.11),(.53,.72,.045),walnut,.020)
lathe('pour over kettle',(-3.08,1.80,-8.83),[(0,0),(.19,0),(.21,.06),(.20,.25),(.12,.34),(0,.34)],chrome,48)
tube('kettle slender spout',[(-2.92,1.91,-8.83),(-2.73,2.02,-8.83),(-2.70,2.24,-8.83)],.025,chrome)
tube('kettle handle',[(-3.24,1.90,-8.83),(-3.39,1.92,-8.83),(-3.38,2.14,-8.83),(-3.22,2.17,-8.83)],.030,ink)
print('Plants, books, film objects, art and kitchen details complete')
