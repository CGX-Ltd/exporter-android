import { AnyOutputFile, Token, TokenGroup, TokenType } from "@supernovaio/sdk-exporters"
import { exportConfiguration } from "../index"
import type { ThemeTokenSet } from "../types"
import { createTextFile } from "../utils/file-helper"
import { tokenSnakeName } from "../utils/naming"

// The Pulsar template used a single "Measure" type that aggregates all numeric
// measurement tokens. In the TypeScript SDK these are separate types — include
// all of them so the output matches the previous behaviour.
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

function renderDimens(tokens: Token[], tokenGroups: TokenGroup[]): string {
  const measureTokens = tokens.filter((t) => MEASURE_TYPES.has(t.tokenType))
  const lines: string[] = []
  for (const token of measureTokens) {
    if (exportConfiguration.showDescriptions && token.description?.trim()) {
      lines.push(`    <!-- ${token.description.trim()} -->`)
    }
    const name = tokenSnakeName(token, tokenGroups)
    const measure = (token as any).value?.measure ?? 0
    lines.push(`    <dimen name="${name}">${measure}dp</dimen>`)
  }
  return lines.join("\n")
}

function dimenXml(tokens: Token[], tokenGroups: TokenGroup[]): string {
  const header = exportConfiguration.showGeneratedFileDisclaimer
    ? `<!-- ${exportConfiguration.disclaimer.split("\n")[0]} -->\n`
    : ""
  const body = renderDimens(tokens, tokenGroups)
  return `${header}<?xml version="1.0" encoding="utf-8"?>\n<resources>\n\n${body}\n\n</resources>`
}

/**
 * Maps a known size-theme name (case-insensitive) to its Android
 * width-qualified resource directory.  Themes not present in this map
 * are intentionally omitted from the export.
 */
const SIZE_THEME_DIR: Readonly<Record<string, string>> = {
  xsmall: "res/values-w480dp/",
  small:  "res/values-w768dp/",
  medium: "res/values-w992dp/",
  large:  "res/values-w1400dp/",
}

export function generateDimenFiles(
  baseTokens: Token[],
  tokenGroups: TokenGroup[],
  themedTokenSets: ThemeTokenSet[]
): AnyOutputFile[] {
  const files: AnyOutputFile[] = []

  // Base dimensions always go into the default values/ directory.
  files.push(createTextFile("res/values/", "exported_dimens.xml", dimenXml(baseTokens, tokenGroups)))

  // Generate a themed dimen file only for known size themes.
  // Colour-only themes (e.g. "Dark") are skipped because they have no
  // dimension overrides. Unrecognised size names are omitted entirely.
  for (const { theme, tokens: themedTokens } of themedTokenSets) {
    const dir = SIZE_THEME_DIR[theme.name.toLowerCase()]
    if (!dir) continue

    // Only include tokens whose values actually differ in this theme.
    const overriddenIds = new Set<string>(theme.overriddenTokens.map((t) => t.id))
    const themedDimenTokens = themedTokens.filter(
      (t) => MEASURE_TYPES.has(t.tokenType) && overriddenIds.has(t.id)
    )

    if (themedDimenTokens.length > 0) {
      files.push(createTextFile(dir, "exported_dimens.xml", dimenXml(themedDimenTokens, tokenGroups)))
    }
  }

  return files
}
