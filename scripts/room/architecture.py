# Retain the architectural shell, window, desk and working laptop; replace the blockout furniture.
for cname,prefixes in [
 ('05 - Manhattan apartment',('Sofa','Linen seat','Linen back','Seat stitched','Travertine coffee','Coffee table slab','Floating oak shelf','Shelf side','Book spine')),
 ('07 - Apartment finish details',('Soft lumbar','Folded linen','Reading side','Stoneware lamp','Linen lampshade','Coffee table monograph','Monograph page','Low ceramic','Gallery','Original contour'))]:
 for o in bpy.data.collections[cname].objects:
  if o.name.startswith(prefixes):o.hide_render=True;o.hide_set(True)
# A full back wall and finished joinery turn the former open stage into a home.
box('rear plaster wall',(0,3.3,-9.7),(20,6.6,.18),ivory,.01)
box('rear skirting',(0,.13,-9.57),(19.8,.26,.045),chalk,.008)
# A quiet olive recessed wall behind the lounge, with precise shadow gaps.
box('lounge wall inset',(-9.88,2.8,1.05),(.04,4.8,6.6),sage,.004)
for z in [-2.3,4.4]:box('lounge vertical reveal',(-9.84,2.8,z),(.025,4.8,.022),ink,.002)
# Timber wall battens behind the low media console, deliberately concentrated in one zone.
box('media recess shadow',(4.7,2.6,-9.52),(7.2,4.7,.04),walnut,.004)
for i in range(53):box('vertical walnut batten',(1.16+i*.135,2.6,-9.46),(.085,4.65,.075),oak,.01)
box('media top reveal',(4.7,4.98,-9.40),(7.3,.018,.1),ink,.003)
# Window seat has a recessed plinth and continuous seat cushion, with leather pull tabs.
box('window bench plinth',(2.8,.29,7.39),(6.8,.58,.94),oak,.035)
box('window bench toe recess',(2.8,.08,6.91),(6.4,.15,.035),ink,.01)
for i in range(3):
 x=.52+i*2.26
 pillow('window bench cushion',(x,.70,7.39),(2.2,.24,.91),oat)
 box('bench front seam',(x,.4,6.899),(2.15,.016,.018),bronze,.003)
box('bench concealed warm strip',(2.8,.20,6.90),(6.32,.017,.022),light,.005)
# Tiny high-level coves soften the boundaries of the room.
for x in [-9.72,9.72]:
 box('perimeter cornice',(x,6.31,-.7),(.28,.16,17.9),ivory,.013)
 box('cove diffuser',(x,6.40,-.7),(.13,.015,17.8),light,.002)
# A plausible apartment entrance, with architrave, recessed panels and metal hardware.
box('entry door frame',(-.05,2.28,-9.52),(2.15,4.56,.16),oak,.025)
box('entry door leaf',(-.05,2.25,-9.405),(1.93,4.34,.10),ivory,.018)
for x in [-.73,.61]:box('door panel stile',(x,2.25,-9.34),(.025,3.76,.02),chalk,.002)
for y in [.36,4.13]:box('door panel rail',(-.05,y,-9.34),(1.36,.025,.02),chalk,.002)
box('door lock plate',(.60,2.02,-9.31),(.10,.35,.035),bronze,.018)
tube('door lever',[(.60,2.10,-9.25),(.36,2.10,-9.25)],.028,bronze)
# Pale off-white floor and rug remain; give the rug a tailored edge rather than a hard slab.
rug=bpy.data.objects['Central wool rug'];rug.location.z=.015
for side in [-1,1]:
 for i in range(95):
  z=-1.37+i*.043
  tube('rug short fringe',[(side*2.53,.022,z),(side*2.62,.014,z+.004)],.0028,paper)
print('Architecture and built-ins complete')
