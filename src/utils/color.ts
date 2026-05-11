import type { ColorTokenValue } from "@supernovaio/sdk-exporters"

export function toAndroidColor(colorValue: ColorTokenValue): string {
  const r = colorValue.color.r  // 0–255
  const g = colorValue.color.g  // 0–255
  const b = colorValue.color.b  // 0–255
  const toH = (n: number) => Math.round(n).toString(16).padStart(2, "0")
  return `#${toH(r)}${toH(g)}${toH(b)}`
}
