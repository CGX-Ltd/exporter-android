import { AnyOutputFile, Token, TokenGroup, TokenType } from "@supernovaio/sdk-exporters"
import type { ColorTokenValue } from "@supernovaio/sdk-exporters"
import { exportConfiguration } from "../index"
import { createTextFile, xmlFileHeader } from "../utils/file-helper"
import { tokenSnakeName } from "../utils/naming"
import { toAndroidColor } from "../utils/color"

function renderShadows(tokens: Token[], tokenGroups: TokenGroup[]): string {
  const shadowTokens = tokens.filter((t) => t.tokenType === TokenType.shadow)
  const lines: string[] = []

  for (const token of shadowTokens) {
    const layers = (token as any).value as Array<any>
    if (!Array.isArray(layers) || layers.length === 0) continue

    if (exportConfiguration.showDescriptions && token.description?.trim()) {
      lines.push(`    <!-- ${token.description.trim()} -->`)
    }

    const name = tokenSnakeName(token, tokenGroups)

    layers.forEach((layer, i) => {
      const idx = i + 1
      const color = toAndroidColor(layer.color as ColorTokenValue)
      lines.push(`    <color name="${name}_${idx}_color">${color}</color>`)
      lines.push(`    <dimen name="${name}_${idx}_x">${layer.x ?? 0}dp</dimen>`)
      lines.push(`    <dimen name="${name}_${idx}_y">${layer.y ?? 0}dp</dimen>`)
      lines.push(`    <dimen name="${name}_${idx}_blur">${layer.radius ?? 0}dp</dimen>`)
    })

    lines.push("")
  }

  return lines.join("\n").trimEnd()
}

export function generateShadowsFile(tokens: Token[], tokenGroups: TokenGroup[]): AnyOutputFile {
  const header = xmlFileHeader(exportConfiguration.showGeneratedFileDisclaimer, exportConfiguration.disclaimer)
  const body = renderShadows(tokens, tokenGroups)
  const content = `${header}<?xml version="1.0" encoding="utf-8"?>\n<resources>\n\n${body}\n\n</resources>`
  return createTextFile("res/values/", "exported_shadows.xml", content)
}
