"""Sloe promo v3 — warm yellow key, deep navy ambience, cleaner hair, natural pose.

blender -b -P promo_render_v3.py
PREVIEW=1 / SHOTS=a,b blender -b -P promo_render_v3.py
"""

import bpy, math, os, time
from mathutils import Vector

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "frames3")
os.makedirs(OUT, exist_ok=True)
PREVIEW = os.environ.get("PREVIEW") == "1"
WANT = [s.strip() for s in os.environ.get("SHOTS", "a,b,c,d").split(",") if s.strip()]


def look_at(ob, target):
    ob.rotation_euler = (Vector(target) - ob.location).to_track_quat("-Z", "Y").to_euler()


def mat(name, color, rough=0.82, emit=None, emit_strength=1.0, sheen=0.0):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    b = m.node_tree.nodes["Principled BSDF"]
    b.inputs["Base Color"].default_value = (*color, 1.0)
    b.inputs["Roughness"].default_value = rough
    for k in ("Specular IOR Level", "Specular"):
        if k in b.inputs:
            b.inputs[k].default_value = 0.2
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
    if material:
        ob.data.materials.append(material)
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


def cyl(name, r, depth, loc, rot=(0, 0, 0), material=None, verts=12):
    bpy.ops.mesh.primitive_cylinder_add(vertices=verts, radius=r, depth=depth, location=loc, rotation=rot)
    ob = bpy.context.object
    ob.name = name
    return finish(ob, material, 0.005)


# ----------------------------------------------------------------- palette
SKIN = mat("skin", (0.949, 0.816, 0.741), 0.87, sheen=0.18)
BLUSH = mat("blush", (0.898, 0.612, 0.560), 0.9)
HAIR = mat("hair", (0.070, 0.062, 0.082), 0.62)
SHIRT = mat("shirt", (0.129, 0.153, 0.259), 0.9, sheen=0.1)
PANTS = mat("pants", (0.110, 0.118, 0.153), 0.92)
WOOD = mat("wood", (0.475, 0.318, 0.208), 0.66)
WOOD_D = mat("wood_dark", (0.278, 0.184, 0.129), 0.7)
WALL = mat("wall", (0.075, 0.106, 0.196), 0.95)      # deep navy
WALL_S = mat("wall_side", (0.055, 0.080, 0.153), 0.95)
CEIL = mat("ceil", (0.043, 0.059, 0.110), 0.96)
LINEN = mat("linen", (0.937, 0.918, 0.878), 0.94)
BLANKET = mat("blanket", (0.278, 0.302, 0.396), 0.95)
LAMP = mat("lamp_emit", (1.0, 0.78, 0.42), 0.45, emit=(1.0, 0.66, 0.26), emit_strength=9.0)
MOON = mat("moon", (1.0, 0.95, 0.85), 0.5, emit=(0.98, 0.94, 0.84), emit_strength=2.0)
METAL = mat("metal", (0.070, 0.078, 0.110), 0.5)
SCREEN = mat("screen", (0.070, 0.090, 0.160), 0.32, emit=(0.26, 0.40, 0.72), emit_strength=1.5)
SCREEN_ROW = mat("screen_row", (0.5, 0.6, 0.8), 0.4, emit=(0.62, 0.72, 0.92), emit_strength=0.9)
PHONE = mat("phone_screen", (0.086, 0.118, 0.210), 0.3, emit=(0.30, 0.44, 0.80), emit_strength=2.2)
PAPER = mat("paper", (0.937, 0.922, 0.886), 0.96)
INK = mat("ink", (0.062, 0.066, 0.094), 0.9)
STICKY = mat("sticky", (0.996, 0.870, 0.341), 0.95)
LEAF = mat("leaf", (0.196, 0.353, 0.243), 0.9)
POT = mat("pot", (0.510, 0.333, 0.259), 0.85)
GLINT = mat("glint", (1, 1, 1), 0.4, emit=(1, 1, 1), emit_strength=1.8)


def wipe():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)


# ----------------------------------------------------------------- room
def build_room():
    box("floor", (8, 8, 0.1), (0, 0, -0.05), material=mat("floor", (0.176, 0.145, 0.125), 0.9), bevel=0)
    box("back_wall", (8, 0.14, 3.4), (0, 1.7, 1.7), material=WALL, bevel=0)
    box("side_wall", (0.14, 8, 3.4), (-2.1, 0, 1.7), material=WALL_S, bevel=0)
    box("ceiling", (8, 8, 0.12), (0, 0, 3.2), material=CEIL, bevel=0)
    box("rug", (2.2, 1.6, 0.02), (0.1, -1.55, 0.012), material=mat("rug", (0.216, 0.227, 0.310), 0.95), bevel=0)

    box("win_recess", (1.5, 0.06, 1.9), (1.05, 1.60, 1.65), material=mat("win_dark", (0.035, 0.048, 0.086), 0.9), bevel=0)
    box("win_frame_t", (1.6, 0.10, 0.09), (1.05, 1.56, 2.62), material=WOOD_D, bevel=0.01)
    box("win_frame_b", (1.6, 0.10, 0.09), (1.05, 1.56, 0.72), material=WOOD_D, bevel=0.01)
    for x in (0.28, 1.82):
        box("win_side_%.2f" % x, (0.09, 0.10, 1.9), (x, 1.56, 1.65), material=WOOD_D, bevel=0.01)
    box("win_mullion", (0.05, 0.06, 1.9), (1.05, 1.54, 1.65), material=WOOD_D, bevel=0.006)
    ico("moon", 0.17, (0.72, 1.42, 2.20), sub=3, material=MOON)
    # curtain: thin fabric folds hanging from a rod, not slabs
    cyl("curtain_rod", 0.012, 0.62, (0.28, 1.50, 2.63), rot=(0, math.radians(90), 0), material=WOOD_D)
    for i in range(6):
        x = 0.055 + i * 0.075
        box(f"curtain{i}", (0.018, 0.075, 2.05), (x, 1.47 + (i % 2) * 0.018, 1.60),
            rot=(0, math.radians(3 - i), math.radians(2 if i % 2 else -2)),
            material=mat(f"curt{i}", (0.133, 0.161, 0.255), 0.96), bevel=0.006)

    box("bed_base", (2.1, 2.1, 0.40), (-0.95, 1.05, 0.20), material=WOOD_D, bevel=0.02)
    box("mattress", (2.0, 2.0, 0.26), (-0.95, 1.05, 0.53), material=LINEN, bevel=0.07)
    box("headboard", (2.1, 0.12, 0.85), (-0.95, 2.00, 0.62), material=WOOD_D, bevel=0.02)
    box("pillow", (0.66, 0.44, 0.19), (-1.42, 1.30, 0.73), rot=(0, math.radians(-7), math.radians(5)),
        material=LINEN, bevel=0.08)
    for i, (y, rz) in enumerate(((0.72, 2), (0.34, -3))):
        box(f"blanket{i}", (1.75, 0.62, 0.13), (-0.95, y, 0.68), rot=(0, 0, math.radians(rz)),
            material=BLANKET, bevel=0.05)

    box("desk_top", (2.0, 0.78, 0.07), (0.10, -0.66, 0.74), material=WOOD, bevel=0.012)
    for x in (-0.82, 1.02):
        box("desk_leg_%.2f" % x, (0.08, 0.62, 0.74), (x, -0.66, 0.37), material=WOOD_D, bevel=0.008)

    # laptop
    box("laptop_base", (0.60, 0.40, 0.028), (-0.42, -0.60, 0.79), rot=(0, 0, math.radians(9)), material=METAL, bevel=0.008)
    box("laptop_lid", (0.60, 0.022, 0.40), (-0.42, -0.40, 0.99), rot=(math.radians(-14), 0, math.radians(9)),
        material=METAL, bevel=0.008)
    box("laptop_screen", (0.55, 0.004, 0.355), (-0.42, -0.392, 0.99), rot=(math.radians(-14), 0, math.radians(9)),
        material=SCREEN, bevel=0)
    # spreadsheet rows so the screen is not a blank slab
    for i in range(7):
        box(f"row{i}", (0.44 - (i % 3) * 0.05, 0.002, 0.012),
            (-0.44, -0.386, 1.115 - i * 0.037), rot=(math.radians(-14), 0, math.radians(9)),
            material=SCREEN_ROW, bevel=0)
    box("row_hdr", (0.49, 0.002, 0.026), (-0.42, -0.386, 1.16), rot=(math.radians(-14), 0, math.radians(9)),
        material=SCREEN_ROW, bevel=0)

    box("phone", (0.21, 0.42, 0.022), (0.44, -0.80, 0.777), rot=(0, 0, math.radians(-11)), material=METAL, bevel=0.012)
    box("phone_screen", (0.193, 0.395, 0.004), (0.44, -0.80, 0.790), rot=(0, 0, math.radians(-11)), material=PHONE, bevel=0)

    cyl("mug", 0.062, 0.11, (0.94, -0.86, 0.82), material=PAPER)
    for i, (x, y, rz) in enumerate(((0.66, -0.44, 9), (0.74, -0.52, -5), (0.83, -0.40, 14))):
        box(f"sticky{i}", (0.12, 0.12, 0.004), (x, y, 0.778), rot=(0, 0, math.radians(rz)), material=STICKY, bevel=0)
    box("notebook", (0.30, 0.22, 0.014), (-0.02, -0.92, 0.762), rot=(0, 0, math.radians(-6)), material=PAPER, bevel=0.006)
    cyl("pot", 0.09, 0.13, (1.06, -0.30, 0.84), material=POT)
    for i, (rz, z) in enumerate(((0, 0.95), (40, 1.00), (-35, 1.02))):
        ico(f"leaf{i}", 0.10, (1.06, -0.30, z), scale=(0.55, 0.8, 1.0), rot=(0, 0, math.radians(rz)), material=LEAF)

    cyl("lamp_base", 0.09, 0.03, (-0.92, -0.90, 0.775), material=METAL)
    box("lamp_arm", (0.035, 0.035, 0.46), (-0.92, -0.90, 0.99), material=METAL, bevel=0.004)
    bpy.ops.mesh.primitive_cone_add(vertices=10, radius1=0.115, radius2=0.055, depth=0.14,
                                    location=(-0.92, -0.95, 1.24), rotation=(math.radians(28), 0, 0))
    finish(bpy.context.object, LAMP, 0.004)


# ----------------------------------------------------------------- character
def build_girl():
    """Seated, leaning in toward the laptop; shoulders slope, elbows on the desk."""
    HX, HY, HZ = 0.14, -0.30, 1.30
    lean = math.radians(11)

    ico("hips", 0.20, (0.14, HY + 0.06, 0.66), scale=(1.0, 0.85, 0.62), sub=2, material=PANTS)
    ico("torso", 0.30, (0.14, HY - 0.05, 0.88), scale=(0.72, 0.62, 0.82), rot=(lean, 0, math.radians(3)),
        sub=2, material=SHIRT)
    # sloped shoulder caps so the silhouette is not a box
    for sx in (-0.17, 0.17):
        ico("shoulder%.3f" % sx, 0.095, (0.14 + sx, HY - 0.08, 1.05),
            scale=(1.0, 0.9, 0.75), sub=2, material=SHIRT)
    cyl("neck", 0.072, 0.11, (HX, HY - 0.10, HZ - 0.30), material=SKIN)

    # head: tilted down a touch, the way someone reads a screen
    head = ico("head", 0.252, (HX, HY - 0.11, HZ), scale=(1.0, 0.95, 1.05), rot=(math.radians(-6), 0, 0),
               sub=2, material=SKIN)
    for x in (-0.104, 0.104):
        ico("cheek%.3f" % x, 0.040, (HX + x, HY - 0.315, HZ - 0.050), scale=(1, 0.35, 0.8), sub=2, material=BLUSH)
    for x in (-0.092, 0.092):
        ico("eye%.3f" % x, 0.029, (HX + x, HY - 0.328, HZ - 0.012), scale=(1, 0.55, 1.05), sub=2, material=INK)
        ico("glint%.3f" % x, 0.008, (HX + x + 0.008, HY - 0.346, HZ + 0.005), sub=1, material=GLINT)
    ico("nose", 0.014, (HX, HY - 0.342, HZ - 0.068), scale=(1, 1, 0.7), sub=1, material=SKIN)
    box("mouth", (0.050, 0.012, 0.010), (HX, HY - 0.334, HZ - 0.122), material=INK, bevel=0.003)
    box("brow_l", (0.076, 0.013, 0.014), (HX - 0.092, HY - 0.330, HZ + 0.062), rot=(0, math.radians(10), 0),
        material=INK, bevel=0.003)
    box("brow_r", (0.076, 0.013, 0.014), (HX + 0.092, HY - 0.330, HZ + 0.062), rot=(0, math.radians(-10), 0),
        material=INK, bevel=0.003)

    # ---- hair: one bob silhouette. Cap + parted fringe + two side locks + low tail.
    ico("hair_cap", 0.272, (HX, HY - 0.075, HZ + 0.030), scale=(1.03, 1.02, 1.03), sub=1, material=HAIR)
    # back mass: the bob, slightly narrower than the cap so it reads as a shape
    ico("hair_back", 0.245, (HX, HY + 0.030, HZ - 0.060), scale=(0.98, 0.92, 0.86), sub=1, material=HAIR)
    # fringe: three soft slabs, parted left of centre, all sweeping the same way
    fringe = [(-0.080, -0.218, 0.112, 0.16, 14), (0.020, -0.232, 0.096, 0.15, -3), (0.112, -0.216, 0.082, 0.13, -17)]
    for i, (dx, dy, dz, w, rz) in enumerate(fringe):
        box(f"fringe{i}", (w, 0.075, 0.215), (HX + dx, HY + dy, HZ + dz),
            rot=(math.radians(14), 0, math.radians(rz)), material=HAIR, bevel=0.034)
    # side locks frame the face and stop above the jaw
    for i, sx in enumerate((-0.208, 0.208)):
        box(f"lock{i}", (0.075, 0.115, 0.30), (HX + sx, HY - 0.155, HZ - 0.085),
            rot=(math.radians(3), 0, math.radians(6 if sx > 0 else -6)), material=HAIR, bevel=0.02)
    # low ponytail, two segments, hanging behind the shoulder
    for i in range(2):
        box(f"pony{i}", (0.145 - i * 0.03, 0.13 - i * 0.02, 0.20),
            (HX + 0.02, HY + 0.175 + i * 0.02, HZ - 0.30 - i * 0.17),
            rot=(math.radians(14 + i * 10), 0, math.radians(-5)), material=HAIR, bevel=0.022)

    # ---- arms: elbows on the desk, forearms angled in toward the keyboard
    for x, sgn in ((-0.20, -1), (0.20, 1)):
        cyl("uparm%.3f" % x, 0.052, 0.30, (HX + x, HY + 0.01, 0.94),
            rot=(math.radians(26), 0, math.radians(-7 * sgn)), material=SHIRT)
        cyl("forearm%.3f" % x, 0.048, 0.30, (HX + x * 0.95, HY - 0.245, 0.806),
            rot=(math.radians(84), 0, math.radians(-16 * sgn)), material=SHIRT)
        # hand + three stubby fingers, so it stops reading as a marshmallow
        box("palm%.3f" % x, (0.085, 0.10, 0.055), (HX + x * 0.92, HY - 0.40, 0.79),
            rot=(math.radians(-4), 0, math.radians(-16 * sgn)), material=SKIN, bevel=0.022)
        for f in range(3):
            box("finger%.3f_%d" % (x, f), (0.022, 0.055, 0.028),
                (HX + x * 0.92 - 0.026 + f * 0.026, HY - 0.462, 0.782),
                rot=(math.radians(-6), 0, math.radians(-16 * sgn)), material=SKIN, bevel=0.008)
    return head


def build_lights():
    # warm key from the window, behind her right shoulder: rim + pool
    bpy.ops.object.light_add(type="AREA", location=(1.50, 1.25, 2.30))
    key = bpy.context.object
    key.data.energy = 380
    key.data.size = 1.4
    key.data.color = (1.0, 0.72, 0.36)
    look_at(key, (0.14, -0.30, 1.25))

    # lamp: the warm practical, inside the frame this time
    bpy.ops.object.light_add(type="POINT", location=(-0.86, -1.02, 1.10))
    pract = bpy.context.object
    pract.data.energy = 340
    pract.data.color = (1.0, 0.56, 0.18)
    pract.data.shadow_soft_size = 0.30

    # navy wall wash: keeps the ambience blue instead of crushing to black
    bpy.ops.object.light_add(type="AREA", location=(0.60, -2.2, 1.75))
    wash = bpy.context.object
    wash.data.energy = 60
    wash.data.size = 3.2
    wash.data.color = (0.30, 0.44, 0.95)
    look_at(wash, (0.20, 1.2, 1.55))

    # cool screen spill keeps the shadow side from going muddy
    bpy.ops.object.light_add(type="AREA", location=(-0.42, -0.50, 1.02))
    screen = bpy.context.object
    screen.data.energy = 16
    screen.data.size = 0.5
    screen.data.color = (0.45, 0.62, 1.0)
    look_at(screen, (0.14, -0.32, 1.28))

    bpy.ops.object.light_add(type="AREA", location=(0.10, -1.45, 1.02))
    bounce = bpy.context.object
    bounce.data.energy = 22
    bounce.data.size = 1.2
    bounce.data.color = (1.0, 0.76, 0.52)
    look_at(bounce, (0.14, -0.32, 1.20))

    w = bpy.data.worlds.new("w")
    bpy.context.scene.world = w
    w.use_nodes = True
    bg = w.node_tree.nodes["Background"]
    bg.inputs["Color"].default_value = (0.020, 0.036, 0.094, 1)   # navy ambience
    bg.inputs["Strength"].default_value = 0.16


def setup_render():
    sc = bpy.context.scene
    try:
        sc.render.engine = "BLENDER_EEVEE_NEXT"
    except TypeError:
        sc.render.engine = "BLENDER_EEVEE"
    try:
        sc.eevee.taa_render_samples = 20 if PREVIEW else 96
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
    sc.view_settings.exposure = 0.25


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
        shoot("a", (1.12, -2.92, 1.48), (0.20, -0.40, 1.06), lens=40, fstop=2.2, focus=head)
    if "b" in WANT:
        shoot("b", (0.78, -1.66, 1.30), (0.14, -0.42, 1.12), lens=58, fstop=1.8, focus=head)
    if "c" in WANT:
        shoot("c", (0.02, -1.54, 1.02), (0.44, -0.80, 0.80), lens=68, fstop=1.5, focus=bpy.data.objects["phone"])
    if "d" in WANT:
        shoot("d", (1.70, -2.72, 1.56), (0.12, -0.34, 1.04), lens=40, fstop=2.6, focus=head)


if __name__ == "__main__":
    main()
