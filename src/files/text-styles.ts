import { AnyOutputFile, Token, TokenGroup, TokenType } from "@supernovaio/sdk-exporters"
import type { TypographyTokenValue } from "@supernovaio/sdk-exporters"
import { exportConfiguration } from "../index"
import { createTextFile } from "../utils/file-helper"
import { tokenPascalName, toSnakeCase } from "../utils/naming"

export interface FontInfo {
  family: string
  /** Weight/style name as it appears in Supernova, e.g. "Regular", "Bold Italic" */
  subfamily: string
}

function fontStyle(subfamily: string): "normal" | "italic" {
  return /italic|oblique/i.test(subfamily) ? "italic" : "normal"
}

/**
 * Walk all typography tokens and collect the unique (family, subfamily) pairs
 * needed to generate Android font XML files.
 *
 * The SDK's TypographyTokenValue shape is:
 *   value.fontFamily.text  – e.g. "Helvetica Now Display"
 *   value.fontWeight.text  – e.g. "Regular", "Bold", "Light Italic"
 */
export function collectFonts(tokens: Token[]): Map<string, FontInfo> {
  const fontsMap = new Map<string, FontInfo>()
  for (const token of tokens) {
    if (token.tokenType !== TokenType.typography) continue
    const value = (token as unknown as { value: TypographyTokenValue }).value
    const family = value?.fontFamily?.text
    const subfamily = value?.fontWeight?.text
    if (!family || !subfamily) continue
    const key = `${toSnakeCase([family])}_${toSnakeCase([subfamily])}`
    if (!fontsMap.has(key)) {
      fontsMap.set(key, { family, subfamily })
    }
  }
  return fontsMap
}

function renderTextStyles(tokens: Token[], tokenGroups: TokenGroup[]): string {
  const typographyTokens = tokens.filter((t) => t.tokenType === TokenType.typography)
  const lines: string[] = []

  for (const token of typographyTokens) {
    if (exportConfiguration.showDescriptions && token.description?.trim()) {
      lines.push(`    <!-- ${token.description.trim()} -->`)
    }

    const value = (token as unknown as { value: TypographyTokenValue }).value

    // fontFamily.text → "Helvetica Now Display"
    // fontWeight.text → "Regular" / "Bold" / "Light Italic" …
    const family = value?.fontFamily?.text
    const subfamily = value?.fontWeight?.text
    const fontSize = value?.fontSize?.measure
    const letterSpacing = value?.letterSpacing?.measure

    const styleName = tokenPascalName(token, tokenGroups)
    lines.push(`    <style name="${styleName}">`)

    if (fontSize !== undefined) {
      lines.push(`        <item name="android:textSize">${fontSize}sp</item>`)
    }
    if (letterSpacing !== undefined) {
      // Supernova stores letter spacing as a percentage value (e.g. 1 = 1%, -0.5 = -0.5%).
      // Android's android:letterSpacing attribute is in em units, so divide by 10.
      lines.push(`        <item name="android:letterSpacing">${letterSpacing / 10}</item>`)
    }
    if (family && subfamily) {
      const familySnake = toSnakeCase([family])
      const subfamilySnake = toSnakeCase([subfamily])
      lines.push(`        <item name="android:fontFamily">@font/${familySnake}_${subfamilySnake}</item>`)
      lines.push(`        <item name="android:textStyle">${fontStyle(subfamily)}</item>`)
    }

    lines.push(`    </style>`)
  }

  return lines.join("\n")
}

export function generateTextStylesFile(tokens: Token[], tokenGroups: TokenGroup[]): AnyOutputFile {
  const header = exportConfiguration.showGeneratedFileDisclaimer
    ? `<!-- ${exportConfiguration.disclaimer.split("\n")[0]} -->\n`
    : ""
  const body = renderTextStyles(tokens, tokenGroups)
  const content = `${header}<?xml version="1.0" encoding="utf-8"?>\n<resources>\n\n${body}\n\n</resources>`
  return createTextFile("res/values/", "exported_text_styles.xml", content)
}
