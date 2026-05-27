import { AnyOutputFile, Token, TokenGroup, TokenType } from "@supernovaio/sdk-exporters"
import type { ColorTokenValue } from "@supernovaio/sdk-exporters"
import { exportConfiguration } from "../index"
import type { ThemeTokenSet } from "../types"
import { createTextFile } from "../utils/file-helper"
import { tokenSnakeName } from "../utils/naming"
import { toAndroidColor } from "../utils/color"

// Android resource qualifier for the dark/night colour theme.
// Color themes (i.e. themes that override colour tokens) always write here;
// Android picks this directory automatically when the device is in dark mode.
const DARK_THEME_DIR = "res/values-night/"

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
  themedTokenSets: ThemeTokenSet[]
): AnyOutputFile[] {
  const files: AnyOutputFile[] = []

  const baseColorTokens = baseTokens.filter((t) => t.tokenType === TokenType.color)

  if (exportConfiguration.exportBaseValues) {
    files.push(createTextFile("res/values/", "exported_colors.xml", colorsXml(baseColorTokens, tokenGroups)))
  }

  // Iterate every theme and generate a night-mode colour file only for themes
  // whose overrides are exclusively colour tokens (i.e. the "Dark" theme).
  // Size themes that happen to also override a colour token are intentionally
  // excluded: they match `some` but not `every`, so they never write here.
  for (const { theme, tokens: themedTokens } of themedTokenSets) {
    const isColorTheme =
      theme.overriddenTokens.length > 0 &&
      theme.overriddenTokens.every((t) => t.tokenType === TokenType.color)
    if (!isColorTheme) continue

    let themedColorTokens = themedTokens.filter((t) => t.tokenType === TokenType.color)

    if (exportConfiguration.exportOnlyThemedTokens) {
      const overriddenIds = new Set<string>(theme.overriddenTokens.map((t) => t.id))
      themedColorTokens = themedColorTokens.filter((t) => overriddenIds.has(t.id))
    }

    if (themedColorTokens.length > 0) {
      files.push(createTextFile(DARK_THEME_DIR, "exported_colors.xml", colorsXml(themedColorTokens, tokenGroups)))
    }
  }

  return files
}
