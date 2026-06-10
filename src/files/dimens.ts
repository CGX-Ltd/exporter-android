import { AnyOutputFile, Token, TokenGroup, TokenType } from "@supernovaio/sdk-exporters"
import { exportConfiguration } from "../index"
import type { ThemeTokenSet } from "../types"
import { createTextFile, letterSpacingToEm, lineHeightToMultiplier, xmlFileHeader } from "../utils/file-helper"
import { tokenSnakeName } from "../utils/naming"

// TokenType.radius is excluded here — it goes to exported_radii.xml instead.
export const MEASURE_TYPES = new Set<TokenType>([
  TokenType.dimension,
  TokenType.size,
  TokenType.space,
  TokenType.opacity,
  TokenType.fontSize,
  TokenType.lineHeight,
  TokenType.letterSpacing,
  TokenType.paragraphSpacing,
  TokenType.borderWidth,
])

/** Output file name (without .xml) for each dimension token type. */
const TYPE_FILE_NAME: Readonly<Partial<Record<TokenType, string>>> = {
  [TokenType.dimension]:        "exported_dimens",
  [TokenType.size]:             "exported_size",
  [TokenType.space]:            "exported_spacing",
  [TokenType.opacity]:          "exported_opacity",
  [TokenType.fontSize]:         "exported_font_size",
  [TokenType.lineHeight]:       "exported_line_height",
  [TokenType.letterSpacing]:    "exported_letter_spacing",
  [TokenType.paragraphSpacing]: "exported_paragraph_spacing",
  [TokenType.borderWidth]:      "exported_border_width",
}

function renderDimens(tokens: Token[], tokenGroups: TokenGroup[], tokenById: Map<string, Token>): string {
  const lines: string[] = []
  for (const token of tokens) {
    if (exportConfiguration.showDescriptions && token.description?.trim()) {
      lines.push(`    <!-- ${token.description.trim()} -->`)
    }
    const name = tokenSnakeName(token, tokenGroups)

    const refId = (token as any).value?.referencedTokenId
    if (exportConfiguration.useReferences && refId) {
      const refToken = tokenById.get(refId)
      if (refToken) {
        const refName = tokenSnakeName(refToken, tokenGroups)
        lines.push(`    <dimen name="${name}">@dimen/${refName}</dimen>`)
        continue
      }
    }

    const measure = (token as any).value?.measure ?? 0
    // Letter spacing: percentage ÷ 10 → em units, no suffix.
    // Line height: percentage ÷ 100 → multiplier float, no suffix.
    // Opacity: already a 0–1 fraction, no suffix.
    // Font size: sp. Everything else: dp.
    const dimenValue = token.tokenType === TokenType.letterSpacing
      ? String(letterSpacingToEm(measure))
      : token.tokenType === TokenType.lineHeight
        ? String(lineHeightToMultiplier(measure))
        : token.tokenType === TokenType.opacity
          ? String(measure)
          : token.tokenType === TokenType.fontSize
            ? `${measure}sp`
            : `${measure}dp`
    lines.push(`    <dimen name="${name}">${dimenValue}</dimen>`)
  }
  return lines.join("\n")
}

function dimenXml(tokens: Token[], tokenGroups: TokenGroup[], tokenById: Map<string, Token>): string {
  const header = xmlFileHeader(exportConfiguration.showGeneratedFileDisclaimer, exportConfiguration.disclaimer)
  const body = renderDimens(tokens, tokenGroups, tokenById)
  return `${header}<?xml version="1.0" encoding="utf-8"?>\n<resources>\n\n${body}\n\n</resources>`
}

/**
 * Emit one file per dimension token type into `dir`.
 * If `overriddenIds` is provided only tokens in that set are included
 * (used for size-theme override files).
 */
function filesForDir(
  dir: string,
  tokens: Token[],
  tokenGroups: TokenGroup[],
  overriddenIds?: Set<string>
): AnyOutputFile[] {
  const files: AnyOutputFile[] = []
  // Build a lookup map once for all reference resolutions within this directory.
  const tokenById = new Map<string, Token>(tokens.map((t) => [t.id, t]))

  for (const [type, fileName] of Object.entries(TYPE_FILE_NAME) as Array<[TokenType, string]>) {
    let typeTokens = tokens.filter((t) => t.tokenType === type)

    if (overriddenIds) {
      typeTokens = typeTokens.filter((t) => overriddenIds.has(t.id))
    }

    if (typeTokens.length > 0) {
      files.push(createTextFile(dir, `${fileName}.xml`, dimenXml(typeTokens, tokenGroups, tokenById)))
    }
  }

  return files
}

/**
 * Maps a known size-theme name (case-insensitive) to its Android
 * width-qualified resource directory.  Themes not present in this map
 * are intentionally omitted from the export.
 */
export const SIZE_THEME_DIR: Readonly<Record<string, string>> = {
  xsmall: "res/values-w480dp/",
  small:  "res/values-w768dp/",
  medium: "res/values-w992dp/",
  large:  "res/values-w1400dp/",
}

/** Returns true when a themed token's value is identical to its base counterpart. */
function tokenValueMatchesBase(themedToken: Token, baseToken: Token): boolean {
  const themedRef = (themedToken as any).value?.referencedTokenId
  const baseRef = (baseToken as any).value?.referencedTokenId
  if (themedRef !== undefined || baseRef !== undefined) {
    return themedRef === baseRef
  }
  const themedMeasure = (themedToken as any).value?.measure ?? 0
  const baseMeasure = (baseToken as any).value?.measure ?? 0
  return themedMeasure === baseMeasure
}

export function generateDimenFiles(
  baseTokens: Token[],
  tokenGroups: TokenGroup[],
  themedTokenSets: ThemeTokenSet[]
): AnyOutputFile[] {
  const files: AnyOutputFile[] = [
    ...filesForDir("res/values/", baseTokens, tokenGroups),
  ]

  const baseTokenById = new Map<string, Token>(baseTokens.map((t) => [t.id, t]))

  // Generate per-type files for each known size theme (overrides only).
  // Colour-only themes (e.g. "Dark") and unrecognised theme names are skipped.
  for (const { theme, tokens: themedTokens } of themedTokenSets) {
    const dir = SIZE_THEME_DIR[theme.name.toLowerCase()]
    if (!dir) continue

    const themedTokenById = new Map<string, Token>(themedTokens.map((t) => [t.id, t]))
    const overriddenIds = new Set<string>(
      theme.overriddenTokens
        .map((t) => t.id)
        .filter((id) => {
          const base = baseTokenById.get(id)
          const themed = themedTokenById.get(id)
          if (!base || !themed) return true
          return !tokenValueMatchesBase(themed, base)
        })
    )

    files.push(...filesForDir(dir, themedTokens, tokenGroups, overriddenIds))
  }

  return files
}
