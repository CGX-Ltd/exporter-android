import type { ColorTokenValue } from "@supernovaio/sdk-exporters"

export function toAndroidColor(colorValue: ColorTokenValue): string {
  const r = colorValue.color.r  // 0–255
  const g = colorValue.color.g  // 0–255
  const b = colorValue.color.b  // 0–255
  // opacity.measure is a raw 0–1 value (RawUnit); default to 1 (fully opaque)
  const opacity = colorValue.opacity?.measure ?? 1
  const a = Math.round(Math.min(1, Math.max(0, opacity)) * 255)

  const toH = (n: number) => Math.round(n).toString(16).padStart(2, "0")

  // Only prepend the alpha byte when the colour is not fully opaque, keeping
  // existing opaque colours as the shorter #RRGGBB form.
  return a < 255
    ? `#${toH(a)}${toH(r)}${toH(g)}${toH(b)}`
    : `#${toH(r)}${toH(g)}${toH(b)}`
}
