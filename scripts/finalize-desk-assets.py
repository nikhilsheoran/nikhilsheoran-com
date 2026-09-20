"""Retain the Blender logo tint that its glTF exporter omits from MixRGB nodes."""
import json,struct
from pathlib import Path
path=Path(__file__).resolve().parents[1]/'public/journey/macbook-air-calibrated.glb'
blob=path.read_bytes()
length=struct.unpack_from('<I',blob,12)[0]
data=json.loads(blob[20:20+length])
logo=next(m for m in data['materials'] if 'illuminated Apple' in m.get('name',''))
logo['emissiveFactor']=[1,.42,.62]
encoded=json.dumps(data,separators=(',',':')).encode()
encoded+=b' '*((-len(encoded))%4)
tail=blob[20+length:]
path.write_bytes(struct.pack('<4sII',b'glTF',2,20+len(encoded)+len(tail))+struct.pack('<I4s',len(encoded),b'JSON')+encoded+tail)
print('Applied pink emission factor without modifying textures or geometry.')
