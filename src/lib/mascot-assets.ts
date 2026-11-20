// Single map of every mascot asset in /public.
// One file per job, one aspect ratio per file, so no two spots render the
// same art differently. Add an entry here before using a new PNG.

export type Box = [number, number, number, number] // measured content: x, y, w, h
export type MascotAsset = { file: string; w: number; h: number; aspect: number; box: Box }

const asset = (file: string, w: number, h: number, box: Box): MascotAsset => ({
  file,
  w,
  h,
  aspect: w / h,
  box,
})

export const MASCOT = {
  hero: asset("/mascot-hero.png", 4060, 4060, [68, 716, 3870, 2754]),
  quest: asset("/mascot-quest.png", 768, 768, [22, 48, 692, 674]),
  ai: asset("/mascot-ai.png", 768, 768, [18, 102, 732, 564]),
  insight: asset("/mascot-insight.png", 768, 768, [18, 102, 732, 564]),
  loading: asset("/mascot-loading.png", 768, 768, [50, 40, 668, 688]),
  success: asset("/mascot-success.png", 768, 768, [10, 84, 748, 612]),
  confirm: asset("/mascot-confirm.png", 3327, 3568, [200, 2, 3124, 3562]),
  sad: asset("/mascot-sad.png", 3563, 3352, [8, 146, 3364, 3202]),
  streak: asset("/mascot-streak.png", 768, 768, [10, 114, 746, 542]),
  levelup: asset("/mascot-levelup.png", 768, 768, [10, 84, 748, 612]),
  auth1: asset("/mascot-auth-1.png", 768, 768, [80, 104, 658, 562]),
  auth2: asset("/mascot-auth-2.png", 768, 768, [10, 84, 748, 612]),
  auth3: asset("/mascot-auth-3.png", 4060, 4060, [68, 716, 3870, 2754]),
  auth4: asset("/mascot-auth-4.png", 768, 768, [80, 104, 658, 562]),
  face1: asset("/momoface1.png", 2024, 1566, [2, 2, 2020, 1564]),
  face2: asset("/momoface2.png", 2024, 1566, [2, 2, 2020, 1564]),
  face3: asset("/momoface3.png", 2024, 1566, [2, 2, 2020, 1564]),
  face4: asset("/momoface4.png", 2024, 1566, [2, 2, 2020, 1564]),
  face5: asset("/momoface5.png", 2024, 1566, [2, 2, 2020, 1564]),
  face6: asset("/momoface6.png", 2024, 1566, [2, 2, 2020, 1564]),
  scene: asset("/welcomee.png", 4020, 2612, [202, 6, 3590, 2452]),
} as const

export type MascotKey = keyof typeof MASCOT

// momo.png.png is byte-identical to mascot-ai.png, so it is an alias, not a
// duplicate slot. Kept here so the file is accounted for.
export const MASCOT_ALIAS = { aiDuplicate: "/momo.png.png" }

export const MASCOT_LOTTIE = "/signature-pose.json"
export const MASCOT_FALLBACK = MASCOT.hero.file

export const MOOD_FILE: Record<"happy" | "wink" | "cool" | "sleepy" | "love", string> = {
  happy: MASCOT.face1.file,
  cool: MASCOT.face2.file,
  love: MASCOT.face3.file,
  sleepy: MASCOT.face4.file,
  wink: MASCOT.face6.file,
}

const ASPECT_BY_FILE: Record<string, number> = Object.fromEntries(
  Object.values(MASCOT).map((a) => [a.file, a.aspect]),
)

/** Entry for a key ("hero"), a raw path ("/mascot-hero.png") or anything else. */
export function mascotAsset(fileOrKey: string | undefined): MascotAsset {
  if (!fileOrKey) return MASCOT.hero
  if (fileOrKey in MASCOT) return MASCOT[fileOrKey as MascotKey]
  return Object.values(MASCOT).find((a) => a.file === fileOrKey) ?? MASCOT.hero
}

export function mascotAspect(file: string): number {
  return ASPECT_BY_FILE[file] ?? 1
}

export type Geometry = { left: number; top: number; width: number; height: number }

/**
 * Same maths as `mascotGeometry`, expressed in percentages of the slot.
 * The slot is given the drawing's own aspect ratio, so "contain" fills it
 * exactly and the art scales with its container instead of a fixed pixel size.
 */
export function mascotGeometryPercent(fileOrKey: string | undefined): Geometry {
  const entry = mascotAsset(fileOrKey)
  const [x, y, bw, bh] = entry.box
  return {
    left: (-x / bw) * 100,
    top: (-y / bh) * 100,
    width: (entry.w / bw) * 100,
    height: (entry.h / bh) * 100,
  }
}
export type Fit = "contain" | "cover"
export type Align = "center" | "top" | "bottom" | "left" | "right"

/**
 * Size and place the drawing so its *visible content* fills the slot.
 * contain = whole drawing inside the slot, never cropped.
 * cover   = drawing covers the slot, edges cropped.
 * `align` only matters on the axis that has slack (contain) or overflow (cover).
 */
export function mascotGeometry(
  fileOrKey: string | undefined,
  boxW: number,
  boxH: number,
  fit: Fit = "contain",
  align: Align = "center",
): Geometry {
  const entry = mascotAsset(fileOrKey)
  const [x, y, bw, bh] = entry.box
  const fw = bw / entry.w
  const fh = bh / entry.h
  const contentAspect = bw / bh
  const boxAspect = boxW / boxH

  const byWidth = fit === "contain" ? contentAspect >= boxAspect : contentAspect < boxAspect
  let width: number
  let height: number
  if (byWidth) {
    width = boxW / fw
    height = (width * entry.h) / entry.w
  } else {
    height = boxH / fh
    width = (height * entry.w) / entry.h
  }

  const slackX = boxW - fw * width
  const slackY = boxH - fh * height
  const placeX = align === "left" ? 0 : align === "right" ? slackX : slackX / 2
  const placeY = align === "top" ? 0 : align === "bottom" ? slackY : slackY / 2

  return {
    left: -x * (width / entry.w) + placeX,
    top: -y * (height / entry.h) + placeY,
    width,
    height,
  }
}
