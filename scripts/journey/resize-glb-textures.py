"""Write a copy of a .glb with its textures scaled down, leaving the geometry bytes untouched.

  python3 scripts/journey/resize-glb-textures.py <in.glb> <out.glb> <scale or max side in px>

A value below 8 is a scale (0.5 halves every texture); otherwise it is the longest side allowed.
Used for the phone version of the baked room and to cut the laptop's oversized maps. Works on
meshopt-compressed files: every byte range, including the compressed ones, keeps its bytes and only
moves to a new offset.
"""
import io, json, struct, sys
from PIL import Image
src, out, arg = sys.argv[1], sys.argv[2], float(sys.argv[3])
b = open(src, "rb").read(); jl = struct.unpack("<I", b[12:16])[0]; j = json.loads(b[20:20 + jl]); bin0 = 20 + jl + 8
image_views = {im["bufferView"]: im for im in j.get("images", []) if "bufferView" in im}
parts = []; cursor = 0
def place(data):
    global cursor
    pad = (-cursor) % 4; parts.append(b"\0" * pad + data); offset = cursor + pad; cursor = offset + len(data); return offset
before = after = 0
for i, view in enumerate(j["bufferViews"]):
    ext = view.get("extensions", {}).get("EXT_meshopt_compression")
    target = ext if ext is not None else view                     # a compressed view keeps its bytes in the extension's range
    if target.get("buffer", 0) != 0: continue
    data = b[bin0 + target.get("byteOffset", 0): bin0 + target.get("byteOffset", 0) + target["byteLength"]]
    if i in image_views:
        im = Image.open(io.BytesIO(data)); w, h = im.size
        k = arg if arg < 8 else min(1.0, arg / max(w, h))
        if k < 1:
            small = im.resize((max(1, round(w * k)), max(1, round(h * k))), Image.LANCZOS); buf = io.BytesIO()
            mime = image_views[i].get("mimeType", "image/png")
            if mime == "image/webp": small.save(buf, "WEBP", quality=88, method=6)
            elif mime == "image/jpeg": small.convert("RGB").save(buf, "JPEG", quality=88)
            else: small.save(buf, "PNG", optimize=True)
            before += len(data); data = buf.getvalue(); after += len(data)
            print(f"  {image_views[i].get('name', i)}: {w}x{h} -> {small.size[0]}x{small.size[1]}")
    target["byteOffset"] = place(data); target["byteLength"] = len(data)
blob = b"".join(parts); blob += b"\0" * ((-len(blob)) % 4); j["buffers"][0]["byteLength"] = len(blob)
js = json.dumps(j, separators=(",", ":")).encode(); js += b" " * ((-len(js)) % 4)
open(out, "wb").write(b"glTF" + struct.pack("<II", 2, 12 + 8 + len(js) + 8 + len(blob)) + struct.pack("<I", len(js)) + b"JSON" + js + struct.pack("<I", len(blob)) + b"BIN\0" + blob)
print(f"{out}: {len(b) / 1e6:.1f} MB -> {(28 + len(js) + len(blob)) / 1e6:.1f} MB")
