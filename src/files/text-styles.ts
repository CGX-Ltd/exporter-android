import { AnyOutputFile, Token, TokenGroup, TokenType } from "@supernovaio/sdk-exporters"
import { exportConfiguration } from "../index"
import { createTextFile } from "../utils/file-helper"
import { tokenPascalName, toSnakeCase } from "../utils/naming"

export interface FontInfo {
  family: string
  subfamily: string
}

function fontStyle(subfamily: string): "normal" | "italic" {
  return /italic|oblique/i.test(subfamily) ? "italic" : "normal"
}

function fontWeight(subfamily: string): number {
  const s = subfamily.toLowerCase()
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

export function collectFonts(tokens: Token[]): Map<string, FontInfo> {
  const fontsMap = new Map<string, FontInfo>()
  for (const token of tokens) {
    if (token.tokenType !== TokenType.typography) continue
    const font = (token as any).value?.font
    if (!font?.family || !font?.subfamily) continue
    const key = `${toSnakeCase([font.family])}_${toSnakeCase([font.subfamily])}`
    if (!fontsMap.has(key)) {
      fontsMap.set(key, { family: font.family, subfamily: font.subfamily })
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

    const value = (token as any).value
    const font = value?.font
    const fontSize = value?.fontSize?.measure
    const letterSpacing = value?.letterSpacing?.measure

    const styleName = tokenPascalName(token, tokenGroups)
    lines.push(`    <style name="${styleName}">`)

    if (fontSize !== undefined) {
      lines.push(`        <item name="android:textSize">${fontSize}sp</item>`)
    }
    if (letterSpacing !== undefined) {
      lines.push(`        <item name="android:letterSpacing">${letterSpacing}</item>`)
    }
    if (font?.family && font?.subfamily) {
      const familySnake = toSnakeCase([font.family])
      const subfamilySnake = toSnakeCase([font.subfamily])
      lines.push(`        <item name="android:fontFamily">@font/${familySnake}_${subfamilySnake}</item>`)

      const style = fontStyle(font.subfamily)
      const weight = fontWeight(font.subfamily)
      const textStyle = style === "italic" ? "italic" : "normal"
      lines.push(`        <item name="android:textStyle">${textStyle}</item>`)
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
