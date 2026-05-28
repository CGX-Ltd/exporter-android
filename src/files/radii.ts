import { AnyOutputFile, Token, TokenGroup, TokenType } from "@supernovaio/sdk-exporters"
import { exportConfiguration } from "../index"
import { createTextFile, xmlFileHeader } from "../utils/file-helper"
import { tokenSnakeName } from "../utils/naming"

function renderRadii(tokens: Token[], tokenGroups: TokenGroup[], tokenById: Map<string, Token>): string {
  const radiusTokens = tokens.filter((t) => t.tokenType === TokenType.radius)
  const lines: string[] = []
  for (const token of radiusTokens) {
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

    // Value shape mirrors the Pulsar template: radiusToken.value.radius.{measure,unit}
    const radius = (token as any).value?.radius ?? (token as any).value
    const measure = radius?.measure ?? 0
    const unit = radius?.unit ?? "Pixels"
    const dimen = unit === "Percent" ? `${measure}%` : `${measure}dp`
    lines.push(`    <dimen name="${name}">${dimen}</dimen>`)
  }
  return lines.join("\n")
}

export function generateRadiiFile(tokens: Token[], tokenGroups: TokenGroup[]): AnyOutputFile {
  const tokenById = new Map<string, Token>(tokens.map((t) => [t.id, t]))
  const header = xmlFileHeader(exportConfiguration.showGeneratedFileDisclaimer, exportConfiguration.disclaimer)
  const body = renderRadii(tokens, tokenGroups, tokenById)
  const content = `${header}<?xml version="1.0" encoding="utf-8"?>\n<resources>\n\n${body}\n\n</resources>`
  return createTextFile("res/values/", "exported_radii.xml", content)
}
