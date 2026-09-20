# Upholstered, low-slung sofa along the west wall. Actual welt seams, shadow gaps and feet.
box('sofa recessed base',(-8.35,.27,1.05),(2.46,.30,4.82),walnut,.09)
for x in [-9.22,-7.47]:
 for z in [-.91,3.01]:cylinder('sofa low foot',(x,.10,z),.085,.20,ink,24)
for j in range(3):
 z=-.48+j*1.53
 pillow('deep sofa seat',(-8.20,.69,z),(2.27,.53,1.48),oat)
 pillow('rounded sofa back',(-9.24,1.25,z),(.48,1.37,1.51),oat)
 # A rounded stitch line follows each seat, inset from the outer silhouette.
 pts=[]
 for cx,cz,a0 in [(-9.12,z-.56,math.pi),(-7.29,z-.56,math.pi*1.5),(-7.29,z+.56,0),(-9.12,z+.56,math.pi*.5)]:
  for i in range(9):
   a=a0+i*math.pi/16;pts.append((cx+.08*math.cos(a),.82,cz+.08*math.sin(a)))
 tube('cushion tailored piping',pts,.007,paper,True)
for z in [-1.50,3.60]:pillow('rounded sofa arm',(-8.38,.88,z),(2.55,1.12,.38),oat)
p=pillow('sage lounge pillow',(-8.81,1.29,-.58),(.32,.75,.80),sage);p.rotation_euler.y=-.18
p=pillow('rust lounge pillow',(-8.76,1.31,2.82),(.32,.70,.78),clay);p.rotation_euler.y=-.14
p=pillow('small oat pillow',(-8.72,1.05,1.53),(.34,.44,.84),chalk);p.rotation_euler.y=-.15
# A continuous draped blanket follows the seat and drops over its front lip.
verts=[];faces=[];uv=[];nx=38;nz=24
for j in range(nz+1):
 for i in range(nx+1):
  t=i/nx;z=2.15+j/nz*.93
  x=-8.80+t*1.66
  drop=max(0,(t-.76)/.24)
  y=.995-.58*drop*drop+.022*math.sin(j/nz*math.tau*5+t*2)
  verts.append((x,y,z));uv.append((t*2,j/nz*2))
for j in range(nz):
 for i in range(nx):
  a=j*(nx+1)+i;faces.append((a,a+1,a+nx+2,a+nx+1))
o=mesh('soft draped linen throw',verts,faces,sage,uv)
for p in o.data.polygons:p.use_smooth=True
for j in range(24):tube('throw fringe',[(-7.14,.415,2.15+j*.04),(-7.12,.31,2.154+j*.04)],.004,sage)
# Soft, sculptural limestone tables. Rounded rims and a recessed plinth.
lathe('main limestone coffee table',(-6.11,0,1.40),[(0,.08),(.55,.08),(.59,.12),(.61,.52),(.86,.55),(.91,.60),(.91,.69),(.87,.73),(0,.73)],stone)
lathe('small walnut nesting table',(-5.10,0,2.35),[(0,.04),(.32,.04),(.36,.12),(.36,.44),(.53,.46),(.57,.50),(.54,.56),(0,.56)],walnut)
# Mushroom side lamp and slim chrome table: playful without visual clutter.
lathe('sofa side table',(-8.10,0,4.65),[(0,.04),(.48,.04),(.5,.09),(.08,.11),(.055,1.16),(.50,1.18),(.51,1.23),(0,1.23)],chrome)
lathe('terracotta lamp base',(-8.10,1.24,4.65),[(0,0),(.16,0),(.17,.035),(.12,.40),(.075,.48),(0,.48)],clay)
lathe('opal mushroom shade',(-8.10,1.61,4.65),[(0,.35),(.12,.34),(.27,.28),(.39,.17),(.43,.06),(.43,0),(.39,-.015),(0,-.015)],light)
# Rounded reading chair at the window; dark continuous legs and warm upholstery.
for x in [6.65,7.83]:
 tube('reading chair tubular frame',[(x,.10,5.40),(x,.80,5.55),(x,1.70,6.56)],.042,chrome)
 tube('reading chair rear foot',[(x,.86,5.75),(x,.10,6.84)],.042,chrome)
pillow('reading chair seat',(7.24,.86,5.99),(1.42,.34,1.38),sage)
p=pillow('reading chair back',(7.24,1.55,6.54),(1.45,1.20,.28),sage);p.rotation_euler.x=-.18
for x in [6.53,7.95]:tube('reading chair arm',[(x,1.15,5.41),(x,1.19,6.40)],.067,walnut)
# Bookcase system on the east wall: closed lower storage, open shelves above.
box('library recessed back',(9.77,2.22,.35),(.065,4.32,7.30),ivory,.012)
for j in range(4):
 z=-2.4+j*1.82
 box('library lower cabinet',(9.15,.55,z),(1.12,1.05,1.78),oak,.02)
 box('library cabinet front',(8.573,.56,z),(.045,.95,1.68),sage,.013)
 box('library recessed pull',(8.543,.97,z),(.021,.022,1.31),ink,.003)
for y in [1.15,2.18,3.21,4.24]:box('library floating shelf',(9.15,y,.33),(1.24,.085,7.36),oak,.014)
for z in [-3.40,-1.54,.31,2.16,4.04]:box('library slim upright',(9.55,2.71,z),(.38,3.03,.065),walnut,.01)
for y in [2.125,3.155,4.185]:box('library light ribbon',(8.96,y,.35),(.026,.018,7.15),light,.003)
# Media credenza with four flush fronts and turned feet.
box('record cabinet carcass',(4.76,.73,-8.93),(6.88,1.10,1.16),oak,.035)
for x in [1.60,7.91]:
 for z in [-9.30,-8.55]:cylinder('record cabinet foot',(x,.16,z),.045,.32,bronze,24)
for j in range(4):
 x=2.17+j*1.72
 box('record cabinet door',(x,.73,-8.329),(1.67,1.0,.036),walnut,.008)
 for k in range(13):box('cabinet oak rib',(x-.76+k*.127,.73,-8.30),(.025,.91,.018),oak,.008)
 cylinder('cabinet small knob',(x+.63,.81,-8.26),.025,.035,bronze,20).rotation_euler.x=math.pi/2
# Turntable: plinth, layered platter, record grooves, tonearm and tactile knobs.
box('turntable plinth',(3.80,1.39,-8.87),(1.18,.16,.83),walnut,.027)
box('turntable aluminium top',(3.80,1.485,-8.87),(1.11,.025,.77),chrome,.01)
cylinder('turntable platter',(3.65,1.515,-8.88),.34,.04,ink)
cylinder('vinyl record',(3.65,1.539,-8.88),.324,.006,ink)
for i in range(15):ring('record groove',(3.65,0,-8.88),.14+i*.011,.14+i*.011,1.543,.0009,chrome)
cylinder('record paper label',(3.65,1.546,-8.88),.095,.005,clay)
cylinder('record spindle',(3.65,1.57,-8.88),.009,.04,chrome,16)
tube('turntable tonearm',[(4.18,1.60,-9.12),(4.19,1.61,-8.93),(3.99,1.61,-8.66)],.013,chrome)
box('tonearm cartridge',(3.98,1.59,-8.64),(.055,.035,.08),ink,.005)
cylinder('turntable speed knob',(3.37,1.54,-8.58),.035,.042,chrome,24)
sphere('turntable amber LED',(4.26,1.50,-8.58),(.009,.005,.009),light,16,8)
# Hi-fi speakers with inset drivers and brushed rings face the room.
for x in [2.07,7.40]:
 box('walnut bookshelf speaker',(x,1.88,-8.90),(.64,1.1,.68),walnut,.022)
 box('speaker inset baffle',(x,1.88,-8.54),(.57,1.025,.025),ink,.015)
 for y,r in [(1.66,.206),(2.18,.072)]:
  o=cylinder('speaker driver',(x,y,-8.506),r,.016,ink,48);o.rotation_euler.x=math.pi/2
  sphere('speaker dust cap',(x,y,-8.485),(r*.36,r*.36,.055),ink)
  tube('speaker driver surround',[(x+r*math.cos(i*math.tau/64),y+r*math.sin(i*math.tau/64),-8.49) for i in range(64)],.014,chrome,True)
print('Detailed seating, bookcase and hi-fi complete')
