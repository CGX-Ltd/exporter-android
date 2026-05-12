import { AnyOutputFile, Token, TokenGroup, TokenTheme, TokenType } from "@supernovaio/sdk-exporters"
import type { ColorTokenValue } from "@supernovaio/sdk-exporters"
import { exportConfiguration } from "../index"
import { createTextFile } from "../utils/file-helper"
import { tokenSnakeName } from "../utils/naming"
import { toAndroidColor } from "../utils/color"

function disclaimer(): string {
  if (!exportConfiguration.showGeneratedFileDisclaimer) return ""
  return (
    exportConfiguration.disclaimer
      .split("\n")
      .map((line) => `    ${line}`)
      .join("\n")
      .trimStart()
  )
}

function renderColors(colorTokens: Token[], tokenGroups: TokenGroup[]): string {
  const lines: string[] = []
  for (const token of colorTokens) {
    if (exportConfiguration.showDescriptions && token.description?.trim()) {
      lines.push(`    <!-- ${token.description.trim()} -->`)
    }
    const name = tokenSnakeName(token, tokenGroups)
    const value = toAndroidColor((token as unknown as { value: ColorTokenValue }).value)
    lines.push(`    <color name="${name}">${value}</color>`)
  }
  return lines.join("\n")
}

function colorsXml(colorTokens: Token[], tokenGroups: TokenGroup[]): string {
  const body = renderColors(colorTokens, tokenGroups)
  const header = exportConfiguration.showGeneratedFileDisclaimer
    ? `<!--\n    ${disclaimer()}\n-->\n`
    : ""
  return `${header}<?xml version="1.0" encoding="utf-8"?>\n<resources>\n\n${body}\n\n</resources>`
}

export function generateColorFiles(
  baseTokens: Token[],
  tokenGroups: TokenGroup[],
  darkTheme: TokenTheme | undefined,
  darkTokens: Token[] | undefined
): AnyOutputFile[] {
  const files: AnyOutputFile[] = []

  const baseColorTokens = baseTokens.filter((t) => t.tokenType === TokenType.color)

  if (exportConfiguration.exportBaseValues) {
    files.push(createTextFile("res/values/", "exported_colors.xml", colorsXml(baseColorTokens, tokenGroups)))
  }

  if (darkTheme && darkTokens) {
    let darkColorTokens = darkTokens.filter((t) => t.tokenType === TokenType.color)

    if (exportConfiguration.exportOnlyThemedTokens) {
      const overriddenIds = new Set<string>(darkTheme.overriddenTokens.map((t) => t.id))
      darkColorTokens = darkColorTokens.filter((t) => overriddenIds.has(t.id))
    }

    if (darkColorTokens.length > 0) {
      files.push(createTextFile("res/values-night/", "exported_colors.xml", colorsXml(darkColorTokens, tokenGroups)))
    }
  }

  return files
}
