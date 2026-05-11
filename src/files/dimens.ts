import { AnyOutputFile, Token, TokenGroup, TokenType } from "@supernovaio/sdk-exporters"
import { exportConfiguration } from "../index"
import { createTextFile } from "../utils/file-helper"
import { tokenSnakeName } from "../utils/naming"

// The Pulsar template used a single "Measure" type that aggregates all numeric
// measurement tokens. In the TypeScript SDK these are separate types — include
// all of them so the output matches the previous behaviour.
// These are the SDK types that map to Android <dimen> resources.
// TokenType.radius is excluded here — it goes to exported_radii.xml instead.
const MEASURE_TYPES = new Set<TokenType>([
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

export function generateDimenFile(tokens: Token[], tokenGroups: TokenGroup[]): AnyOutputFile {
  const header = exportConfiguration.showGeneratedFileDisclaimer
    ? `<!-- ${exportConfiguration.disclaimer.split("\n")[0]} -->\n`
    : ""
  const body = renderDimens(tokens, tokenGroups)
  const content = `${header}<?xml version="1.0" encoding="utf-8"?>\n<resources>\n\n${body}\n\n</resources>`
  return createTextFile("res/values/", "exported_dimens.xml", content)
}
