# Le bureau, étape 1 : volumes et cadrage (docs/monde/bureau.md).
# Formes simples aux vraies dimensions et aux bonnes places, la caméra du plan principal et une lumière d'approche,
# pour valider la composition contre la référence avant de modéliser quoi que ce soit.
# Dans Blender : exec(open('/Users/amandindardenne/Desktop/Portfolio/tools/blender/bureau/00_volumes.py').read())
# Relancer le script reconstruit tout : la collection « volumes » est vidée d'abord.
# Repère : origine au centre du sol, X à droite, Y vers le fond (la caméra regarde vers +Y), Z en haut, en mètres.

import bpy
import math
import random
from mathutils import Vector

random.seed(7)


# ---- helpers ------------------------------------------------------------------------------------------------
def collection(name, parent=None):
    c = bpy.data.collections.get(name) or bpy.data.collections.new(name)
    p = parent or bpy.context.scene.collection
    if c.name not in [k.name for k in p.children]:
        p.children.link(c)
    return c


def clear(c):
    for o in list(c.all_objects):
        bpy.data.objects.remove(o, do_unlink=True)


def material(name, color, rough=0.6, metal=0.0, emit=None, strength=0.0, alpha=1.0, transmission=0.0):
    m = bpy.data.materials.get(name) or bpy.data.materials.new(name)
    m.use_nodes = True
    b = m.node_tree.nodes.get('Principled BSDF')
    b.inputs['Base Color'].default_value = (*color, 1)
    b.inputs['Roughness'].default_value = rough
    b.inputs['Metallic'].default_value = metal
    b.inputs['Alpha'].default_value = alpha
    b.inputs['Transmission Weight'].default_value = transmission
    if emit:
        b.inputs['Emission Color'].default_value = (*emit, 1)
        b.inputs['Emission Strength'].default_value = strength
    if alpha < 1:
        m.surface_render_method = 'BLENDED'
    return m


def put(o, col, mat=None):
    for c in o.users_collection:
        c.objects.unlink(o)
    col.objects.link(o)
    if mat:
        o.data.materials.clear()
        o.data.materials.append(mat)
    return o


def box(name, size, loc, col, mat, rot=(0, 0, 0)):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc, rotation=[math.radians(a) for a in rot])
    o = bpy.context.object
    o.name = name
    o.scale = size
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    return put(o, col, mat)


def cyl(name, r, depth, loc, col, mat, rot=(0, 0, 0), verts=24):
    bpy.ops.mesh.primitive_cylinder_add(vertices=verts, radius=r, depth=depth, location=loc,
                                        rotation=[math.radians(a) for a in rot])
    o = bpy.context.object
    o.name = name
    return put(o, col, mat)


def rod(name, a, b, r, col, mat):
    """A cylinder from point a to point b."""
    a, b = Vector(a), Vector(b)
    d = b - a
    bpy.ops.mesh.primitive_cylinder_add(vertices=12, radius=r, depth=d.length, location=(a + b) / 2)
    o = bpy.context.object
    o.name = name
    o.rotation_mode = 'QUATERNION'
    o.rotation_quaternion = d.to_track_quat('Z', 'Y')
    return put(o, col, mat)


def leaf(name, base, direction, length, width, col, mat):
    """A leaf mass: a flat ellipsoid starting at base, pointing along direction."""
    d = Vector(direction).normalized()
    bpy.ops.mesh.primitive_uv_sphere_add(segments=16, ring_count=8, radius=0.5, location=Vector(base) + d * length / 2)
    o = bpy.context.object
    o.name = name
    o.scale = (width, length, 0.03)
    o.rotation_mode = 'QUATERNION'
    o.rotation_quaternion = d.to_track_quat('Y', 'Z')
    return put(o, col, mat)


def plant(name, base, leaves, col, mat, pot=None):
    """leaves: (direction, length, width) from a point a little above the base."""
    for i, (direction, length, width) in enumerate(leaves):
        leaf(f'{name}.leaf.{i}', (base[0], base[1], base[2] + 0.25), direction, length, width, col, mat)
    if pot:
        cyl(f'{name}.pot', pot[0], pot[1], (base[0], base[1], pot[1] / 2), col, M['pot'])


def look_at(o, target):
    d = Vector(target) - o.location
    o.rotation_mode = 'XYZ'
    o.rotation_euler = d.to_track_quat('-Z', 'Y').to_euler()


# ---- scene settings -----------------------------------------------------------------------------------------
scene = bpy.context.scene
scene.unit_settings.system = 'METRIC'
scene.unit_settings.scale_length = 1.0
scene.render.engine = 'BLENDER_EEVEE_NEXT'
scene.render.resolution_x, scene.render.resolution_y = 1920, 1080
scene.view_settings.view_transform = 'AgX'
looks = [i.identifier for i in scene.view_settings.bl_rna.properties['look'].enum_items]
scene.view_settings.look = next((l for l in looks if 'Medium High' in l), 'None')

# the default scene's objects go
for n in ('Cube', 'Light', 'Camera'):
    if n in bpy.data.objects:
        bpy.data.objects.remove(bpy.data.objects[n], do_unlink=True)

V = collection('volumes')
clear(V)
parts = {n: collection(f'volumes.{n}', V) for n in ('piece', 'mobilier', 'objets', 'plantes', 'dehors', 'lumieres')}

M = {
    'sol': material('v.sol', (0.30, 0.30, 0.29), rough=0.25),
    'beton': material('v.beton', (0.04, 0.04, 0.04), rough=0.9),
    'mur': material('v.mur', (0.30, 0.30, 0.29), rough=0.9),
    'acier': material('v.acier', (0.02, 0.02, 0.02), rough=0.5, metal=1.0),
    'verre': material('v.verre', (0.6, 0.7, 0.8), rough=0.05, alpha=0.08),
    'plateau': material('v.plateau', (0.80, 0.79, 0.76), rough=0.4),
    'metal': material('v.metal', (0.45, 0.45, 0.45), rough=0.4, metal=0.8),
    'caisson': material('v.caisson', (0.55, 0.55, 0.53), rough=0.5),
    'beige': material('v.beige', (0.72, 0.65, 0.50), rough=0.5),
    'ecran': material('v.ecran', (0.0, 0.0, 0.0), rough=0.2, emit=(0.70, 0.88, 1.0), strength=4.0),
    'noir': material('v.noir', (0.03, 0.03, 0.035), rough=0.6),
    'verre_noir': material('v.verre_noir', (0.01, 0.01, 0.012), rough=0.1),
    'chaise': material('v.chaise', (0.30, 0.31, 0.33), rough=0.7),
    'maille': material('v.maille', (0.30, 0.31, 0.33), rough=0.7, alpha=0.7),
    'blanc': material('v.blanc', (0.78, 0.77, 0.74), rough=0.5),
    'carton': material('v.carton', (0.45, 0.32, 0.18), rough=0.8),
    'livres': material('v.livres', (0.30, 0.24, 0.18), rough=0.8),
    'liege': material('v.liege', (0.45, 0.33, 0.20), rough=0.9),
    'orange': material('v.orange', (0.9, 0.45, 0.08), rough=0.6),
    'pot': material('v.pot', (0.25, 0.20, 0.17), rough=0.9),
    'feuille': material('v.feuille', (0.08, 0.20, 0.07), rough=0.6),
    'feuille_fond': material('v.feuille_fond', (0.02, 0.05, 0.06), rough=0.7),
    'terrasse': material('v.terrasse', (0.05, 0.05, 0.05), rough=0.9),
}

# ---- the room: floor, left wall with the stairwell door, pillars, the glass house -----------------------------
P = parts['piece']
W, D0, D1, H = 7.0, -3.6, 3.5, 3.2      # width, front and back of the room, height
box('sol', (W, D1 - D0, 0.1), (0, (D0 + D1) / 2, -0.05), P, M['sol'])
box('mur.avant', (0.1, -1.45 - D0, H), (-3.55, (D0 - 1.45) / 2, H / 2), P, M['mur'])
box('mur.fond', (0.1, 4.05, H), (-3.55, 1.475, H / 2), P, M['mur'])
box('mur.linteau', (0.1, 0.9, 1.1), (-3.55, -1.0, 2.65), P, M['mur'])
box('porte.escalier', (0.05, 0.9, 2.1), (-3.52, -1.0, 1.05), P, M['acier'])
for sx in (-1, 1):
    box(f'pilier.{"g" if sx < 0 else "d"}', (0.4, 0.4, H), (sx * 1.0, 2.4, H / 2), P, M['beton'])
# glass: back, right and roof, on a black steel grid (bars 6 cm)
box('verre.fond', (W, 0.01, H), (0, D1, H / 2), P, M['verre'])
box('verre.droite', (0.01, D1 - D0, H), (W / 2, (D0 + D1) / 2, H / 2), P, M['verre'])
box('verre.toit', (W, D1 - D0, 0.01), (0, (D0 + D1) / 2, H), P, M['verre'])
for i in range(7):
    x = -W / 2 + i * W / 6
    box(f'structure.fond.montant.{i}', (0.06, 0.06, H), (x, D1, H / 2), P, M['acier'])
    box(f'structure.toit.y.{i}', (0.06, D1 - D0, 0.06), (x, (D0 + D1) / 2, H), P, M['acier'])
for z in (0.03, 1.2, 2.4):
    box(f'structure.fond.traverse.{z}', (W, 0.06, 0.06), (0, D1, z), P, M['acier'])
    box(f'structure.droite.traverse.{z}', (0.06, D1 - D0, 0.06), (W / 2, (D0 + D1) / 2, z), P, M['acier'])
for i in range(6):
    y = D0 + i * 1.2
    box(f'structure.droite.montant.{i}', (0.06, 0.06, H), (W / 2, y, H / 2), P, M['acier'])
    box(f'structure.toit.x.{i}', (W, 0.06, 0.06), (0, y, H), P, M['acier'])
box('porte.toit', (0.04, 1.0, 2.1), (W / 2 - 0.03, 2.0, 1.05), P, M['acier'])

# ---- furniture ------------------------------------------------------------------------------------------------
F = parts['mobilier']
TOP = 0.74
box('bureau.plateau', (1.8, 0.75, 0.025), (0, 1.225, TOP - 0.0125), F, M['plateau'])
for sx in (-1, 1):
    for y in (0.90, 1.55):
        box(f'bureau.pied.{sx}.{y}', (0.04, 0.04, TOP - 0.025), (sx * 0.86, y, (TOP - 0.025) / 2), F, M['metal'])
    box(f'bureau.patin.{sx}', (0.05, 0.72, 0.03), (sx * 0.86, 1.225, 0.015), F, M['metal'])
box('bureau.traverse', (1.68, 0.03, 0.06), (0, 1.56, TOP - 0.06), F, M['metal'])
box('caisson', (0.42, 0.6, 0.66), (0.66, 1.25, 0.33), F, M['caisson'])
box('tour', (0.38, 0.5, 0.8), (1.25, 1.3, 0.4), F, M['blanc'])
box('carton.1', (0.42, 0.36, 0.25), (1.25, 1.3, 0.925), F, M['carton'], rot=(0, 0, 4))
box('carton.2', (0.32, 0.28, 0.2), (1.23, 1.28, 1.15), F, M['carton'], rot=(0, 0, -7))

# the chair, empty, pushed back and turned (its back faces the camera)
chair = bpy.data.objects.new('chaise', None)
F.objects.link(chair)
chair.location = (-0.1, 0.5, 0)
chair.rotation_euler = (0, 0, math.radians(-10))
seat = [
    box('chaise.assise', (0.5, 0.48, 0.08), (0, 0, 0.48), F, M['chaise']),
    box('chaise.dossier', (0.46, 0.05, 0.6), (0, -0.25, 0.84), F, M['maille'], rot=(-8, 0, 0)),
    box('chaise.appui_tete', (0.3, 0.06, 0.14), (0, -0.29, 1.22), F, M['chaise'], rot=(-8, 0, 0)),
    cyl('chaise.verin', 0.025, 0.36, (0, 0, 0.26), F, M['metal']),
]
for i in range(5):
    a = i * 2 * math.pi / 5
    seat.append(box(f'chaise.branche.{i}', (0.33, 0.045, 0.03), (math.cos(a) * 0.16, math.sin(a) * 0.16, 0.07), F,
                    M['chaise'], rot=(0, 0, math.degrees(a))))
    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.03, location=(math.cos(a) * 0.32, math.sin(a) * 0.32, 0.03))
    seat.append(put(bpy.context.object, F, M['chaise']))
    seat[-1].name = f'chaise.roulette.{i}'
for o in seat:
    o.parent = chair

# ---- objects on and around the desk --------------------------------------------------------------------------
O = parts['objets']
MAC = 0.42
mac = box('mac', (0.25, 0.28, 0.35), (MAC, 1.30, TOP + 0.175), O, M['beige'])
box('mac.ecran', (0.18, 0.004, 0.135), (MAC, 1.30 - 0.142, TOP + 0.225), O, M['ecran'])
box('mac.clavier', (0.33, 0.15, 0.03), (MAC - 0.05, 1.0, TOP + 0.015), O, M['beige'], rot=(0, 0, 4))
box('mac.souris', (0.06, 0.10, 0.035), (MAC + 0.2, 1.0, TOP + 0.0175), O, M['beige'])
box('ecran.grand', (0.6, 0.025, 0.35), (-0.22, 1.42, TOP + 0.295), O, M['verre_noir'], rot=(0, 0, 8))
box('ecran.grand.pied', (0.04, 0.04, 0.14), (-0.22, 1.45, TOP + 0.07), O, M['noir'])
box('ecran.grand.socle', (0.22, 0.18, 0.01), (-0.22, 1.45, TOP + 0.005), O, M['noir'])
# architect lamp: clamp, two arms, head
box('lampe.pince', (0.05, 0.07, 0.08), (-0.82, 1.58, TOP + 0.01), O, M['noir'])
J0, J1, J2 = (-0.84, 1.58, TOP + 0.05), (-0.86, 1.50, 1.30), (-0.66, 1.36, 1.22)
rod('lampe.bras.1', J0, J1, 0.012, O, M['noir'])
rod('lampe.bras.2', J1, J2, 0.012, O, M['noir'])
bpy.ops.mesh.primitive_cone_add(vertices=24, radius1=0.08, radius2=0.03, depth=0.15, location=(-0.62, 1.34, 1.15))
head = put(bpy.context.object, O, M['noir'])
head.name = 'lampe.tete'
look_at(head, (-0.30, 1.2, TOP))   # the wide end, the cone's -Z, opens towards the desk
box('livres', (0.26, 0.2, 0.12), (-0.62, 1.32, TOP + 0.06), O, M['livres'], rot=(0, 0, -5))
box('livres.boite', (0.18, 0.14, 0.10), (-0.62, 1.32, TOP + 0.17), O, M['carton'], rot=(0, 0, 6))
cyl('tasse', 0.04, 0.10, (0.70, 1.05, TOP + 0.05), O, M['blanc'])
box('telephone', (0.2, 0.22, 0.08), (0.72, 1.40, TOP + 0.04), O, M['beige'], rot=(0, 0, -10))
box('postit', (0.08, 0.08, 0.03), (0.62, 1.22, TOP + 0.015), O, M['orange'])
box('enceinte', (0.10, 0.10, 0.15), (0.84, 1.50, TOP + 0.075), O, M['blanc'])
box('liege', (0.4, 0.02, 0.55), (-1.0, 2.19, 1.35), O, M['liege'])
# floor fan, facing the camera a little
fan = cyl('ventilateur', 0.2, 0.12, (-0.72, 0.80, 0.30), O, M['blanc'], rot=(90, 0, -12), verts=32)
box('ventilateur.pied', (0.22, 0.18, 0.04), (-0.72, 0.80, 0.02), O, M['blanc'], rot=(0, 0, -12))
box('ventilateur.cou', (0.04, 0.04, 0.1), (-0.72, 0.80, 0.07), O, M['blanc'])

# ---- plants: leaf masses where the plan puts them ----------------------------------------------------------
G = parts['plantes']
# foreground, close to the camera and at its height: they frame the picture on both sides, like the reference
def bush(name, base, n, zs, reach, length, width, mat=None):
    for i in range(n):
        z = random.uniform(*zs)
        d = Vector(reach) + Vector((random.uniform(-0.3, 0.3), random.uniform(-0.3, 0.3), random.uniform(-0.3, 0.25)))
        leaf(f'{name}.leaf.{i}', (base[0] + random.uniform(-0.1, 0.1), base[1] + random.uniform(-0.1, 0.1), z), d,
             random.uniform(*length), random.uniform(*width), G, mat or M['feuille'])
    cyl(f'{name}.pot', 0.24, 0.4, (base[0], base[1], 0.2), G, M['pot'])


bush('plante.monstera', (-1.0, -1.9), 14, (0.1, 1.05), (1, 0.1, 0.15), (0.45, 0.8), (0.35, 0.55))
bush('plante.premier.g', (-0.6, -2.6), 6, (0.3, 0.8), (1, 0.2, 0.05), (0.3, 0.55), (0.25, 0.4))
bush('plante.bas.g', (-1.3, -1.0), 8, (0.1, 0.8), (1, -0.2, 0.25), (0.5, 0.8), (0.3, 0.5))
bush('plante.alocasia', (1.3, -1.95), 14, (0.1, 1.1), (-1, 0.1, 0.15), (0.45, 0.8), (0.4, 0.6))
bush('plante.premier.d', (0.8, -2.65), 6, (0.3, 0.8), (-1, 0.2, 0.05), (0.3, 0.55), (0.25, 0.4))
bush('plante.philodendron', (1.5, -1.0), 8, (0.1, 0.9), (-1, -0.2, 0.25), (0.5, 0.8), (0.3, 0.5))
# mid-distance masses on both sides, half in focus, like the reference's
bush('plante.massif.g', (-0.95, -0.9), 16, (0.1, 1.25), (0.6, 0.1, 0.3), (0.4, 0.75), (0.3, 0.5))
bush('plante.massif.d', (1.05, -0.8), 16, (0.1, 1.25), (-0.6, 0.1, 0.3), (0.4, 0.75), (0.3, 0.5))
plant('plante.strelitzia', (-1.15, -1.55, 0), [
    ((0.15, 0.1, 1.0), 1.7, 0.32), ((0.35, 0.15, 1.0), 1.6, 0.3), ((0.0, 0.2, 1.0), 1.5, 0.3), ((0.45, 0.0, 0.8), 1.3, 0.3)],
    G, M['feuille'], pot=(0.22, 0.45))
for i, (x, y) in enumerate([(-1.7, -0.2), (1.9, 0.4), (-2.3, 0.9)]):
    leaves = [((random.uniform(-0.5, 0.5), random.uniform(-0.3, 0.3), random.uniform(0.7, 1.0)),
               random.uniform(0.6, 1.0), random.uniform(0.3, 0.45)) for _ in range(5)]
    plant(f'plante.cote.{i}', (x, y, 0), leaves, G, M['feuille'], pot=(0.22, 0.4))
# behind the desk, along the glass
for i, (x, y) in enumerate([(-2.8, 2.9), (-2.0, 3.1), (-1.5, 2.8), (1.6, 3.0), (2.3, 2.7), (2.9, 3.1), (0.2, 3.2), (-0.6, 3.0)]):
    n = random.randint(4, 7)
    leaves = [((random.uniform(-0.6, 0.6), random.uniform(-0.3, 0.3), random.uniform(0.6, 1.0)),
               random.uniform(0.5, 1.1), random.uniform(0.25, 0.45)) for _ in range(n)]
    plant(f'plante.fond.{i}', (x, y, 0), leaves, G, M['feuille_fond'], pot=(0.2, 0.35))
# pothos hanging from the roof above the desk
for i in range(7):
    leaf(f'plante.pothos.{i}', (-0.2 + i * 0.12, 1.4 + random.uniform(-0.2, 0.2), 3.15), (random.uniform(-0.2, 0.2), 0, -1),
         random.uniform(0.6, 1.2), 0.1, G, M['feuille'])
plant('plante.bureau', (-0.08, 1.5, TOP), [((0.3, 0, 1), 0.18, 0.1), ((-0.3, 0.1, 1), 0.16, 0.1), ((0, -0.3, 1), 0.15, 0.1)], G, M['feuille'])

# ---- outside: a terrace with palms against the night sky ----------------------------------------------------
E = parts['dehors']
box('terrasse', (30, 20, 0.1), (0, 12, -0.06), E, M['terrasse'])
for i, (x, y, hgt) in enumerate([(-2.6, 5.0, 4.2), (2.6, 5.6, 4.8), (0.6, 7.5, 5.2), (-4.5, 8.0, 4.6), (4.8, 7.0, 4.0)]):
    rod(f'palmier.{i}.tronc', (x, y, 0), (x + 0.2, y, hgt), 0.12, E, M['feuille_fond'])
    for k in range(8):
        a = k * 2 * math.pi / 8 + random.uniform(-0.2, 0.2)
        leaf(f'palmier.{i}.palme.{k}', (x + 0.2, y, hgt), (math.cos(a), math.sin(a), random.uniform(-0.5, 0.1)),
             random.uniform(1.6, 2.2), 0.35, E, M['feuille_fond'])

# ---- light, roughly: lamp, soft light above the desk, the Mac screen, night sky, cold back light ------------------
L = parts['lumieres']


def light(name, kind, loc, power, color, target=None, **kw):
    d = bpy.data.lights.new(name, kind)
    d.energy = power
    d.color = color
    for k, v in kw.items():
        setattr(d, k, v)
    o = bpy.data.objects.new(name, d)
    L.objects.link(o)
    o.location = loc
    if target:
        look_at(o, target)
    return o


light('lumiere.lampe', 'SPOT', (-0.61, 1.34, 1.11), 120, (1.0, 0.80, 0.62), (-0.30, 1.2, TOP),
      spot_size=math.radians(75), spot_blend=0.25, shadow_soft_size=0.02)
# a soft spot rather than an area light, so the light stays on the desk: the island of the reference
light('lumiere.dessus', 'SPOT', (0.1, 1.0, 2.5), 450, (1.0, 0.93, 0.85), (0.1, 1.0, 0), spot_size=math.radians(62),
      spot_blend=1.0, shadow_soft_size=0.5)
# the foliage stays readable: a weak fill from the camera side, and cold moonlight from above on the left
light('lumiere.remplissage', 'AREA', (0.1, -4.5, 1.4), 60, (0.85, 0.92, 1.0), (0.1, 0, 0.8), size=4.0, size_y=2.0, shape='RECTANGLE')
moon = light('lumiere.lune', 'SUN', (-3, -2, 6), 0.08, (0.55, 0.70, 1.0), (0, 1, 0), angle=math.radians(2))
light('lumiere.ecran.mac', 'AREA', (MAC, 1.15, TOP + 0.225), 4, (0.70, 0.88, 1.0), (MAC, 0.4, TOP), size=0.18, size_y=0.14, shape='RECTANGLE')
box('ciel.fond', (60, 0.1, 25), (0, 16, 8), E, material('v.ciel', (0, 0, 0), emit=(0.06, 0.10, 0.25), strength=0.12))

world = scene.world or bpy.data.worlds.new('World')
scene.world = world
world.use_nodes = True
bg = world.node_tree.nodes.get('Background')
bg.inputs['Color'].default_value = (0.004, 0.007, 0.018, 1)
bg.inputs['Strength'].default_value = 0.1

# ---- the camera of the main shot -----------------------------------------------------------------------------
C = collection('cams')
cam = bpy.data.objects.get('camera')
if not cam:
    cam = bpy.data.objects.new('camera', bpy.data.cameras.new('camera'))
    C.objects.link(cam)
cam.location = (0.10, -3.30, 0.95)
look_at(cam, (0.05, 1.20, 0.80))
cam.data.lens = 40
cam.data.sensor_width = 36
cam.data.sensor_fit = 'HORIZONTAL'
cam.data.dof.use_dof = True
cam.data.dof.focus_distance = (mac.location - cam.location).length
cam.data.dof.aperture_fstop = 2.8
cam.data.clip_start = 0.05
scene.camera = cam
mark = bpy.data.objects.get('cam.stop.desk') or bpy.data.objects.new('cam.stop.desk', None)
if mark.name not in C.objects:
    C.objects.link(mark)
mark.location, mark.rotation_euler = cam.location.copy(), cam.rotation_euler.copy()

print('volumes:', len(V.all_objects), 'objets')
