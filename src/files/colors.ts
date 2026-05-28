import { AnyOutputFile, Token, TokenGroup, TokenType } from "@supernovaio/sdk-exporters"
import type { ColorTokenValue } from "@supernovaio/sdk-exporters"
import { exportConfiguration } from "../index"
import type { ThemeTokenSet } from "../types"
import { createTextFile, xmlFileHeader } from "../utils/file-helper"
import { tokenSnakeName } from "../utils/naming"
import { toAndroidColor } from "../utils/color"
import { SIZE_THEME_DIR } from "./dimens"

// Android resource qualifier for the dark/night colour theme.
// Color themes (i.e. themes that override colour tokens) always write here;
// Android picks this directory automatically when the device is in dark mode.
const DARK_THEME_DIR = "res/values-night/"

function renderColors(
  colorTokens: Token[],
  tokenGroups: TokenGroup[],
  tokenById: Map<string, Token>
): string {
  const lines: string[] = []
  for (const token of colorTokens) {
    if (exportConfiguration.showDescriptions && token.description?.trim()) {
      lines.push(`    <!-- ${token.description.trim()} -->`)
    }
    const name = tokenSnakeName(token, tokenGroups)
    const colorValue = (token as unknown as { value: ColorTokenValue }).value

    const refId = colorValue?.referencedTokenId
    if (exportConfiguration.useReferences && refId) {
      const refToken = tokenById.get(refId)
      if (refToken) {
        const refName = tokenSnakeName(refToken, tokenGroups)
        lines.push(`    <color name="${name}">@color/${refName}</color>`)
        continue
      }
    }

    lines.push(`    <color name="${name}">${toAndroidColor(colorValue)}</color>`)
  }
  return lines.join("\n")
}

function colorsXml(colorTokens: Token[], tokenGroups: TokenGroup[], tokenById: Map<string, Token>): string {
  const header = xmlFileHeader(exportConfiguration.showGeneratedFileDisclaimer, exportConfiguration.disclaimer)
  const body = renderColors(colorTokens, tokenGroups, tokenById)
  return `${header}<?xml version="1.0" encoding="utf-8"?>\n<resources>\n\n${body}\n\n</resources>`
}

export function generateColorFiles(
  baseTokens: Token[],
  tokenGroups: TokenGroup[],
  themedTokenSets: ThemeTokenSet[]
): AnyOutputFile[] {
  const files: AnyOutputFile[] = []
  const tokenById = new Map<string, Token>(baseTokens.map((t) => [t.id, t]))

  const baseColorTokens = baseTokens.filter((t) => t.tokenType === TokenType.color)

  if (exportConfiguration.exportBaseValues) {
    files.push(createTextFile("res/values/", "exported_colors.xml", colorsXml(baseColorTokens, tokenGroups, tokenById)))
  }

  // Iterate every theme and generate a night-mode colour file for the first
  // theme that: (a) is not a known size theme, and (b) overrides at least one
  // colour token. Android only supports a single values-night directory, so
  // we stop after the first match to prevent duplicate-path errors.
  let darkThemeWritten = false
  for (const { theme, tokens: themedTokens } of themedTokenSets) {
    const isSizeTheme = !!SIZE_THEME_DIR[theme.name.toLowerCase()]
    const hasColorOverrides = theme.overriddenTokens.some((t) => t.tokenType === TokenType.color)
    if (isSizeTheme || !hasColorOverrides || darkThemeWritten) continue

    // Build a lookup map from the themed token set for reference resolution
    // within the dark-mode file.
    const themedTokenById = new Map<string, Token>(themedTokens.map((t) => [t.id, t]))

    let themedColorTokens = themedTokens.filter((t) => t.tokenType === TokenType.color)

    if (exportConfiguration.exportOnlyThemedTokens) {
      const overriddenIds = new Set<string>(theme.overriddenTokens.map((t) => t.id))
      themedColorTokens = themedColorTokens.filter((t) => overriddenIds.has(t.id))
    }

    if (themedColorTokens.length > 0) {
      files.push(createTextFile(DARK_THEME_DIR, "exported_colors.xml", colorsXml(themedColorTokens, tokenGroups, themedTokenById)))
      darkThemeWritten = true
    }
  }

  return files
}
