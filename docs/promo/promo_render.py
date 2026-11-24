"""Sloe promo — low-poly night room. v2: warm rim + practical, safer framing.

blender -b -P promo_render_v2.py            # final 1080x1920
PREVIEW=1 blender -b -P promo_render_v2.py  # half res, fast, for iteration
SHOTS=a,c blender -b -P promo_render_v2.py  # subset
"""

import bpy, math, os, time
from mathutils import Vector

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "frames")
os.makedirs(OUT, exist_ok=True)
PREVIEW = os.environ.get("PREVIEW") == "1"
WANT = [s.strip() for s in os.environ.get("SHOTS", "a,b,c,d").split(",") if s.strip()]


def look_at(ob, target):
    d = Vector(target) - ob.location
    ob.rotation_euler = d.to_track_quat("-Z", "Y").to_euler()


def mat(name, color, rough=0.82, emit=None, emit_strength=1.0, sheen=0.0):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    b = m.node_tree.nodes["Principled BSDF"]
    b.inputs["Base Color"].default_value = (*color, 1.0)
    b.inputs["Roughness"].default_value = rough
    for k in ("Specular IOR Level", "Specular"):
        if k in b.inputs:
            b.inputs[k].default_value = 0.22
            break
    if "Sheen Weight" in b.inputs:
        b.inputs["Sheen Weight"].default_value = sheen
    if emit:
        b.inputs["Emission Color"].default_value = (*emit, 1.0)
        b.inputs["Emission Strength"].default_value = emit_strength
    return m


def finish(ob, material, bevel=0.008):
    if bevel and ob.type == "MESH":
        m = ob.modifiers.new("b", "BEVEL")
        m.width = bevel
        m.segments = 2
        m.limit_method = "ANGLE"
        m.angle_limit = math.radians(40)
        bpy.context.view_layer.objects.active = ob
        bpy.ops.object.modifier_apply(modifier=m.name)
    if material and ob.type == "MESH":
        ob.data.materials.append(material)
    if ob.type == "MESH":
        for p in ob.data.polygons:
            p.use_smooth = False
    return ob


def box(name, size, loc, rot=(0, 0, 0), material=None, bevel=0.008):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc, rotation=rot)
    ob = bpy.context.object
    ob.name = name
    ob.scale = size
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    return finish(ob, material, bevel)


def ico(name, r, loc, scale=(1, 1, 1), rot=(0, 0, 0), material=None, sub=1, bevel=0.0):
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=sub, radius=r, location=loc, rotation=rot)
    ob = bpy.context.object
    ob.name = name
    ob.scale = scale
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    return finish(ob, material, bevel)


def cyl(name, r, depth, loc, rot=(0, 0, 0), material=None, verts=10):
    bpy.ops.mesh.primitive_cylinder_add(vertices=verts, radius=r, depth=depth, location=loc, rotation=rot)
    ob = bpy.context.object
    ob.name = name
    return finish(ob, material, 0.006)


# ----------------------------------------------------------------------------- palette

SKIN = mat("skin", (0.937, 0.808, 0.741), 0.86, sheen=0.15)
BLUSH = mat("blush", (0.902, 0.643, 0.596), 0.9)
HAIR = mat("hair", (0.067, 0.071, 0.094), 0.66)
SHIRT = mat("shirt", (0.114, 0.161, 0.278), 0.9)
PANTS = mat("pants", (0.129, 0.141, 0.180), 0.92)
WOOD = mat("wood", (0.451, 0.314, 0.220), 0.68)
WOOD_D = mat("wood_dark", (0.286, 0.196, 0.145), 0.7)
WALL = mat("wall", (0.157, 0.204, 0.302), 0.95)
WALL_S = mat("wall_side", (0.118, 0.153, 0.235), 0.95)
LINEN = mat("linen", (0.949, 0.933, 0.902), 0.94)
BLANKET = mat("blanket", (0.322, 0.353, 0.451), 0.95)
LAMP = mat("lamp_emit", (1.0, 0.82, 0.58), 0.45, emit=(1.0, 0.70, 0.40), emit_strength=8.0)
MOON = mat("moon", (1.0, 0.96, 0.88), 0.5, emit=(0.98, 0.95, 0.86), emit_strength=2.2)
METAL = mat("metal", (0.075, 0.086, 0.118), 0.5)
SCREEN = mat("screen", (0.071, 0.094, 0.157), 0.3, emit=(0.24, 0.37, 0.70), emit_strength=1.6)
PHONE = mat("phone_screen", (0.094, 0.129, 0.220), 0.28, emit=(0.32, 0.46, 0.82), emit_strength=2.4)
PAPER = mat("paper", (0.937, 0.925, 0.894), 0.96)
INK = mat("ink", (0.071, 0.075, 0.102), 0.9)
STICKY = mat("sticky", (0.996, 0.878, 0.365), 0.95)
LEAF = mat("leaf", (0.208, 0.376, 0.263), 0.9)
POT = mat("pot", (0.529, 0.353, 0.278), 0.85)
GLINT = mat("glint", (1, 1, 1), 0.4, emit=(1, 1, 1), emit_strength=2.0)


def wipe():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)


# ----------------------------------------------------------------------------- set

def build_room():
    box("floor", (8, 8, 0.1), (0, 0, -0.05), material=mat("floor", (0.196, 0.165, 0.145), 0.9), bevel=0)
    box("back_wall", (8, 0.14, 3.4), (0, 1.7, 1.7), material=WALL, bevel=0)
    box("side_wall", (0.14, 8, 3.4), (-2.1, 0, 1.7), material=WALL_S, bevel=0)
    # ceiling + a wall behind the camera: without them the frame shows a black void
    box("ceiling", (8, 8, 0.12), (0, 0, 3.2), material=mat("ceil", (0.129, 0.145, 0.196), 0.95), bevel=0)
    box("rug", (2.2, 1.6, 0.02), (0.1, -1.55, 0.012), material=mat("rug", (0.235, 0.243, 0.318), 0.95), bevel=0)

    # window, back right: the warm key enters here
    box("win_recess", (1.5, 0.06, 1.9), (1.05, 1.60, 1.65), material=mat("win_dark", (0.043, 0.055, 0.086), 0.9), bevel=0)
    box("win_frame_t", (1.6, 0.10, 0.09), (1.05, 1.56, 2.62), material=WOOD_D, bevel=0.01)
    box("win_frame_b", (1.6, 0.10, 0.09), (1.05, 1.56, 0.72), material=WOOD_D, bevel=0.01)
    for x in (0.28, 1.82):
        box("win_side_%.2f" % x, (0.09, 0.10, 1.9), (x, 1.56, 1.65), material=WOOD_D, bevel=0.01)
    box("win_mullion", (0.05, 0.06, 1.9), (1.05, 1.54, 1.65), material=WOOD_D, bevel=0.006)
    ico("moon", 0.17, (0.72, 1.42, 2.20), sub=3, material=MOON)
    for i, (x, w, rz) in enumerate(((0.10, 0.16, 3), (0.22, 0.12, -2), (0.33, 0.10, 5), (0.42, 0.08, -3))):
        box(f"curtain{i}", (w, 0.06, 2.15), (x, 1.48 - i * 0.012, 1.52),
            rot=(0, math.radians(rz), math.radians(4)),
            material=mat(f"curt{i}", (0.180, 0.216, 0.310), 0.96), bevel=0.01)

    # bed
    box("bed_base", (2.1, 2.1, 0.40), (-0.95, 1.05, 0.20), material=WOOD_D, bevel=0.02)
    box("mattress", (2.0, 2.0, 0.26), (-0.95, 1.05, 0.53), material=LINEN, bevel=0.07)
    box("headboard", (2.1, 0.12, 0.85), (-0.95, 2.00, 0.62), material=WOOD_D, bevel=0.02)
    box("pillow", (0.66, 0.44, 0.19), (-1.42, 1.30, 0.73), rot=(0, math.radians(-7), math.radians(5)),
        material=LINEN, bevel=0.08)
    for i, (y, rz) in enumerate(((0.72, 2), (0.34, -3))):
        box(f"blanket{i}", (1.75, 0.62, 0.13), (-0.95, y, 0.68), rot=(0, 0, math.radians(rz)),
            material=BLANKET, bevel=0.05)

    # desk
    box("desk_top", (2.0, 0.78, 0.07), (0.10, -0.66, 0.74), material=WOOD, bevel=0.012)
    for x in (-0.82, 1.02):
        box("desk_leg_%.2f" % x, (0.08, 0.62, 0.74), (x, -0.66, 0.37), material=WOOD_D, bevel=0.008)

    # laptop, left of the desk so the torso stays readable
    box("laptop_base", (0.60, 0.40, 0.028), (-0.42, -0.60, 0.79), rot=(0, 0, math.radians(9)), material=METAL, bevel=0.008)
    box("laptop_lid", (0.60, 0.022, 0.40), (-0.42, -0.40, 0.99), rot=(math.radians(-14), 0, math.radians(9)),
        material=METAL, bevel=0.008)
    box("laptop_screen", (0.55, 0.004, 0.355), (-0.42, -0.392, 0.99), rot=(math.radians(-14), 0, math.radians(9)),
        material=SCREEN, bevel=0)

    # phone on the right
    box("phone", (0.21, 0.42, 0.022), (0.44, -0.80, 0.777), rot=(0, 0, math.radians(-11)), material=METAL, bevel=0.012)
    box("phone_screen", (0.193, 0.395, 0.004), (0.44, -0.80, 0.790), rot=(0, 0, math.radians(-11)), material=PHONE, bevel=0)

    # clutter
    cyl("mug", 0.062, 0.11, (0.94, -0.86, 0.82), material=PAPER)
    for i, (x, y, rz) in enumerate(((0.66, -0.44, 9), (0.74, -0.52, -5), (0.83, -0.40, 14))):
        box(f"sticky{i}", (0.12, 0.12, 0.004), (x, y, 0.778), rot=(0, 0, math.radians(rz)), material=STICKY, bevel=0)
    box("notebook", (0.30, 0.22, 0.014), (-0.02, -0.92, 0.762), rot=(0, 0, math.radians(-6)), material=PAPER, bevel=0.006)
    cyl("pot", 0.09, 0.13, (1.06, -0.30, 0.84), material=POT)
    for i, (rz, z) in enumerate(((0, 0.95), (40, 1.00), (-35, 1.02))):
        ico(f"leaf{i}", 0.10, (1.06, -0.30, z), scale=(0.55, 0.8, 1.0), rot=(0, 0, math.radians(rz)), material=LEAF)

    # lamp front-left, the warm practical
    cyl("lamp_base", 0.09, 0.03, (-0.92, -0.90, 0.775), material=METAL)
    box("lamp_arm", (0.035, 0.035, 0.46), (-0.92, -0.90, 0.99), material=METAL, bevel=0.004)
    bpy.ops.mesh.primitive_cone_add(vertices=10, radius1=0.115, radius2=0.055, depth=0.14,
                                    location=(-0.92, -0.95, 1.24), rotation=(math.radians(28), 0, 0))
    finish(bpy.context.object, LAMP, 0.004)


def build_girl():
    TORSO_Z, HEAD_Z, HY = 0.90, 1.34, -0.30

    box("torso", (0.44, 0.28, 0.44), (0.14, HY, TORSO_Z), rot=(0, math.radians(7), 0), material=SHIRT, bevel=0.06)
    box("hips", (0.40, 0.32, 0.22), (0.14, HY + 0.04, 0.64), material=PANTS, bevel=0.05)
    # chair: without it her seat reads as physically impossible
    box("chair_seat", (0.46, 0.44, 0.06), (0.14, HY + 0.10, 0.52), material=WOOD_D, bevel=0.02)
    box("chair_back", (0.46, 0.06, 0.42), (0.14, HY + 0.32, 0.74), rot=(math.radians(-6), 0, 0),
        material=WOOD_D, bevel=0.02)
    for cx in (-0.06, 0.34):
        box("chair_leg%.2f" % cx, (0.05, 0.05, 0.52), (cx, HY + 0.12, 0.26), material=WOOD_D, bevel=0.008)
    cyl("neck", 0.075, 0.10, (0.14, HY - 0.01, HEAD_Z - 0.29), material=SKIN)

    head = ico("head", 0.255, (0.14, HY - 0.02, HEAD_Z), scale=(1.0, 0.95, 1.05), sub=2, material=SKIN)
    for x in (-0.105, 0.105):
        ico("cheek%.3f" % x, 0.042, (0.14 + x, HY - 0.225, HEAD_Z - 0.045), scale=(1, 0.35, 0.8), sub=2, material=BLUSH)

    for x in (-0.093, 0.093):
        ico("eye%.3f" % x, 0.028, (0.14 + x, HY - 0.238, HEAD_Z - 0.005), scale=(1, 0.55, 1.05), sub=2, material=INK)
        ico("glint%.3f" % x, 0.009, (0.14 + x + 0.008, HY - 0.256, HEAD_Z + 0.012), sub=1, material=GLINT)
    ico("nose", 0.015, (0.14, HY - 0.252, HEAD_Z - 0.062), scale=(1, 1, 0.7), sub=1, material=SKIN)
    box("mouth", (0.052, 0.012, 0.011), (0.14, HY - 0.244, HEAD_Z - 0.118), material=INK, bevel=0.003)
    box("brow_l", (0.078, 0.013, 0.015), (0.047, HY - 0.240, HEAD_Z + 0.070), rot=(0, math.radians(9), 0),
        material=INK, bevel=0.003)
    box("brow_r", (0.078, 0.013, 0.015), (0.233, HY - 0.240, HEAD_Z + 0.070), rot=(0, math.radians(-9), 0),
        material=INK, bevel=0.003)

    # hair: clean cap + top mass + fringe slabs + side locks + ponytail
    ico("hair_cap", 0.272, (0.14, HY + 0.028, HEAD_Z + 0.030), scale=(1.05, 1.02, 1.0), sub=1, material=HAIR)
    ico("hair_top", 0.155, (0.14, HY + 0.02, HEAD_Z + 0.185), scale=(1.35, 1.2, 0.62), sub=1, material=HAIR)
    for i, (x, rz) in enumerate(((-0.10, 12), (0.0, -3), (0.10, -14))):
        box(f"fringe{i}", (0.11, 0.085, 0.20), (0.14 + x, HY - 0.185, HEAD_Z + 0.135),
            rot=(math.radians(12), 0, math.radians(rz)), material=HAIR, bevel=0.014)
    for x, rz in ((-0.215, 8), (0.215, -8)):
        box("lock%.3f" % x, (0.085, 0.10, 0.34), (0.14 + x, HY - 0.085, HEAD_Z - 0.09),
            rot=(math.radians(4), 0, math.radians(rz)), material=HAIR, bevel=0.016)
    for i in range(3):
        box(f"pony{i}", (0.15 - i * 0.028, 0.14 - i * 0.02, 0.19),
            (0.14 + 0.015 * i, HY + 0.30 + 0.02 * i, HEAD_Z - 0.06 - i * 0.15),
            rot=(math.radians(20 + i * 8), 0, math.radians(-4)), material=HAIR, bevel=0.02)

    for x in (-0.21, 0.21):
        side = 1 if x > 0 else -1
        # upper arm down from the shoulder, forearm flat on the desk: elbows bent
        box("uparm%.3f" % x, (0.10, 0.10, 0.26), (0.14 + x, HY - 0.16, 0.96),
            rot=(math.radians(22), 0, math.radians(-6 * side)), material=SHIRT, bevel=0.035)
        box("forearm%.3f" % x, (0.095, 0.30, 0.095), (0.14 + x, HY - 0.38, 0.83),
            rot=(math.radians(-4), 0, math.radians(-8 * side)), material=SHIRT, bevel=0.035)
        box("hand%.3f" % x, (0.095, 0.12, 0.06), (0.14 + x * 1.06, HY - 0.53, 0.80),
            rot=(math.radians(-3), 0, math.radians(-6 * side)), material=SKIN, bevel=0.028)
    return head


def build_lights():
    bpy.ops.object.light_add(type="AREA", location=(1.55, 1.35, 2.35))
    key = bpy.context.object
    key.data.energy = 420
    key.data.size = 1.3
    key.data.color = (1.0, 0.72, 0.44)
    look_at(key, (0.14, -0.30, 1.25))

    bpy.ops.object.light_add(type="POINT", location=(-0.90, -0.93, 1.16))
    pract = bpy.context.object
    pract.data.energy = 220
    pract.data.color = (1.0, 0.66, 0.34)
    pract.data.shadow_soft_size = 0.24

    # cool spill from the laptop screen, motivating the other side of her face
    bpy.ops.object.light_add(type="AREA", location=(-0.42, -0.50, 1.02))
    screen = bpy.context.object
    screen.data.energy = 22
    screen.data.size = 0.5
    screen.data.color = (0.52, 0.68, 1.0)
    look_at(screen, (0.14, -0.30, 1.28))

    # warm bounce off the desk, keeps the face from going cold
    bpy.ops.object.light_add(type="AREA", location=(0.30, -1.35, 1.05))
    bounce = bpy.context.object
    bounce.data.energy = 25
    bounce.data.size = 1.4
    bounce.data.color = (1.0, 0.80, 0.62)
    look_at(bounce, (0.14, -0.30, 1.20))

    bpy.ops.object.light_add(type="AREA", location=(0.0, -2.6, 1.4))
    fill = bpy.context.object
    fill.data.energy = 6
    fill.data.size = 4.0
    fill.data.color = (0.55, 0.68, 1.0)
    look_at(fill, (0.14, -0.4, 1.1))

    w = bpy.data.worlds.new("w")
    bpy.context.scene.world = w
    w.use_nodes = True
    bg = w.node_tree.nodes["Background"]
    bg.inputs["Color"].default_value = (0.018, 0.030, 0.085, 1)
    bg.inputs["Strength"].default_value = 0.07


def setup_render():
    sc = bpy.context.scene
    try:
        sc.render.engine = "BLENDER_EEVEE_NEXT"
    except TypeError:
        sc.render.engine = "BLENDER_EEVEE"
    try:
        sc.eevee.taa_render_samples = 24 if PREVIEW else 96
        sc.eevee.use_raytracing = True
    except AttributeError:
        pass
    sc.render.resolution_x = 1080
    sc.render.resolution_y = 1920
    sc.render.resolution_percentage = 50 if PREVIEW else 100
    sc.render.image_settings.file_format = "PNG"
    sc.view_settings.view_transform = "AgX"
    try:
        sc.view_settings.look = "AgX - Medium High Contrast"
    except TypeError:
        pass
    sc.view_settings.exposure = -0.30


def shoot(name, loc, target, lens=45, fstop=2.0, focus=None):
    bpy.ops.object.camera_add(location=loc)
    cam = bpy.context.object
    cam.data.lens = lens
    cam.data.dof.use_dof = True
    cam.data.dof.focus_object = focus
    cam.data.dof.aperture_fstop = fstop
    look_at(cam, target)
    bpy.context.scene.camera = cam
    bpy.context.scene.render.filepath = os.path.join(OUT, f"shot_{name}.png")
    t = time.time()
    bpy.ops.render.render(write_still=True)
    print("[render] %s %.1fs" % (name, time.time() - t))


def main():
    wipe()
    setup_render()
    build_room()
    head = build_girl()
    build_lights()

    if "a" in WANT:
        shoot("a", (1.15, -2.95, 1.50), (0.22, -0.40, 1.06), lens=40, fstop=2.2, focus=head)
    if "b" in WANT:
        shoot("b", (0.75, -1.62, 1.30), (0.14, -0.42, 1.06), lens=58, fstop=1.8, focus=head)
    if "c" in WANT:
        shoot("c", (0.03, -1.55, 1.02), (0.44, -0.80, 0.80), lens=68, fstop=1.5, focus=bpy.data.objects["phone"])
    if "d" in WANT:
        shoot("d", (1.75, -2.75, 1.58), (0.10, -0.35, 1.04), lens=40, fstop=2.6, focus=head)


if __name__ == "__main__":
    main()
