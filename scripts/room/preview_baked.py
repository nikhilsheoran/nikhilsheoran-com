"""Render the exported baked GLB the way the website should: unlit, x exposureScale, AgX.

    blender -b --factory-startup --python scripts/room/preview_baked.py -- [glb] [out-prefix]

Defaults: public/journey/studio-baked.glb -> assets/_local/bake-cache/preview-{start,overview,desk}.png
Compare with assets/blender/review-cycles-*.png (the Cycles ground truth).
If the importer cannot decode meshopt, the pre-gltfpack GLB in the bake cache is used instead
(same textures, float geometry).
"""
import bpy, sys, os, json, math
from mathutils import Vector

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
glb = argv[0] if argv else os.path.join(ROOT, 'public', 'journey', 'studio-baked.glb')
prefix = argv[1] if len(argv) > 1 else os.path.join(ROOT, 'assets', '_local', 'bake-cache', 'preview')
meta = json.load(open(os.path.join(ROOT, 'public', 'journey', 'studio-baked.json')))
scale = meta['exposureScale']

bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene
try:
    bpy.ops.import_scene.gltf(filepath=glb)
except Exception as e:  # meshopt not decodable by this importer
    print('import failed (%s); using unpacked export' % e)
    bpy.ops.import_scene.gltf(filepath=os.path.join(ROOT, 'assets', '_local', 'bake-cache', 'studio-baked-unpacked.glb'))

# unlit: emission = baseColor texture * exposureScale (alpha-tested where the glTF says MASK)
for m in bpy.data.materials:
    if not m.use_nodes:
        continue
    nt = m.node_tree
    tex = next((n for n in nt.nodes if n.type == 'TEX_IMAGE'), None)
    out = next((n for n in nt.nodes if n.type == 'OUTPUT_MATERIAL'), None)
    if tex is None or out is None:
        continue
    em = nt.nodes.new('ShaderNodeEmission'); em.inputs['Strength'].default_value = scale
    nt.links.new(tex.outputs['Color'], em.inputs['Color'])
    mask = 'foliage' in m.name
    if mask:
        tr = nt.nodes.new('ShaderNodeBsdfTransparent'); mix = nt.nodes.new('ShaderNodeMixShader')
        gt = nt.nodes.new('ShaderNodeMath'); gt.operation = 'GREATER_THAN'; gt.inputs[1].default_value = 0.5
        nt.links.new(tex.outputs['Alpha'], gt.inputs[0]); nt.links.new(gt.outputs[0], mix.inputs[0])
        nt.links.new(tr.outputs[0], mix.inputs[1]); nt.links.new(em.outputs[0], mix.inputs[2])
        nt.links.new(mix.outputs[0], out.inputs['Surface'])
    else:
        nt.links.new(em.outputs[0], out.inputs['Surface'])
    tex.interpolation = 'Linear'

world = bpy.data.worlds.new('black'); sc.world = world
sc.render.engine = 'CYCLES'
sc.cycles.samples = 16; sc.cycles.max_bounces = 0; sc.cycles.use_denoising = False
sc.view_settings.view_transform = 'AgX'; sc.view_settings.look = 'None'; sc.view_settings.exposure = 0
sc.render.resolution_x, sc.render.resolution_y = 1600, 1000


def blender(p):   # three (x, y, z) -> Blender (x, -z, y)
    return Vector((p[0], -p[2], p[1]))


cams = {
    'start': (blender((-4.23, 3.2, -6.26)), blender((0, 2.48, -0.44)), 40),
    'overview': (Vector((-5.3, 5.9, 4.1)), None, None),
    'desk': (blender((0.0, 1.9, 0.9)), blender((0, 1.75, -0.44)), 40),
}
cd = bpy.data.cameras.new('cam'); cam = bpy.data.objects.new('cam', cd); sc.collection.objects.link(cam)
sc.camera = cam
cd.sensor_fit = 'VERTICAL'; cd.clip_start = 0.02; cd.clip_end = 300
for name, (pos, at, fov) in cams.items():
    cam.location = pos
    if at is None:   # the saved 'Apartment overview camera': rotation (1.3336, 0, -2.5201), 26 mm lens
        cam.rotation_euler = (1.3336446, 0.0, -2.5200660); cd.sensor_fit = 'AUTO'; cd.lens = 26; cd.sensor_width = 36
    else:
        cam.rotation_euler = (at - pos).to_track_quat('-Z', 'Y').to_euler()
        cd.sensor_fit = 'VERTICAL'; cd.angle_y = math.radians(fov)
    sc.render.filepath = '%s-%s.png' % (prefix, name)
    bpy.ops.render.render(write_still=True)
    print('wrote', sc.render.filepath)
