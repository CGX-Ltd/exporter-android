import { AnyOutputFile } from "@supernovaio/sdk-exporters"
import { createTextFile } from "../utils/file-helper"
import { toSnakeCase } from "../utils/naming"
import { FontInfo } from "./text-styles"

function fontStyle(subfamily: string): "normal" | "italic" {
  return /italic|oblique/i.test(subfamily) ? "italic" : "normal"
}

function fontWeight(subfamily: string): number {
  const s = subfamily.toLowerCase().trim()

  // Supernova sometimes stores the subfamily as a raw numeric weight ("400", "700", "900").
  // Parse those directly before trying keyword matching.
  const numeric = parseInt(s, 10)
  if (!isNaN(numeric) && s === String(numeric) && numeric >= 100 && numeric <= 900) {
    return numeric
  }

  if (s.includes("extralight") || s.includes("ultralight")) return 200
  if (s.includes("extrabold") || s.includes("ultrabold")) return 800
  if (s.includes("semibold") || s.includes("demibold")) return 600
  if (s.includes("thin")) return 100
  if (s.includes("light")) return 300
  if (s.includes("medium")) return 500
  if (s.includes("bold")) return 700
  if (s.includes("black") || s.includes("heavy")) return 900
  return 400
}

export function generateFontFiles(fontsMap: Map<string, FontInfo>): AnyOutputFile[] {
  // Group fonts by family
  const byFamily = new Map<string, FontInfo[]>()
  for (const font of fontsMap.values()) {
    const key = font.family.toLowerCase()
    if (!byFamily.has(key)) byFamily.set(key, [])
    byFamily.get(key)!.push(font)
  }

  const files: AnyOutputFile[] = []

  for (const fonts of byFamily.values()) {
    const familyName = toSnakeCase([fonts[0].family])
    const fontEntries = fonts
      .map((font) => {
        const subfamilyName = toSnakeCase([font.subfamily])
        const fontRef = `${familyName}_${subfamilyName}`
        const style = fontStyle(font.subfamily)
        const weight = fontWeight(font.subfamily)
        return `    <font\n        app:fontStyle="${style}"\n        app:fontWeight="${weight}"\n        app:font="@font/${fontRef}" />`
      })
      .join("\n\n")

    const content =
      `<?xml version="1.0" encoding="utf-8"?>\n` +
      `<font-family xmlns:app="http://schemas.android.com/apk/res-auto">\n\n` +
      `${fontEntries}\n\n` +
      `</font-family>`

    files.push(createTextFile("res/font/", `${familyName}.xml`, content))
  }

  return files
}
