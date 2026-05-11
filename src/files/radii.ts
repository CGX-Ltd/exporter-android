import { AnyOutputFile, Token, TokenGroup, TokenType } from "@supernovaio/sdk-exporters"
import { exportConfiguration } from "../index"
import { createTextFile } from "../utils/file-helper"
import { tokenSnakeName } from "../utils/naming"

function renderRadii(tokens: Token[], tokenGroups: TokenGroup[]): string {
  const radiusTokens = tokens.filter((t) => t.tokenType === TokenType.radius)
  const lines: string[] = []
  for (const token of radiusTokens) {
    if (exportConfiguration.showDescriptions && token.description?.trim()) {
      lines.push(`    <!-- ${token.description.trim()} -->`)
    }
    const name = tokenSnakeName(token, tokenGroups)
    // Value shape mirrors the Pulsar template: radiusToken.value.radius.measure
    const measure = (token as any).value?.radius?.measure ?? (token as any).value?.measure ?? 0
    lines.push(`    <dimen name="${name}">${measure}dp</dimen>`)
  }
  return lines.join("\n")
}

export function generateRadiiFile(tokens: Token[], tokenGroups: TokenGroup[]): AnyOutputFile {
  const header = exportConfiguration.showGeneratedFileDisclaimer
    ? `<!-- ${exportConfiguration.disclaimer.split("\n")[0]} -->\n`
    : ""
  const body = renderRadii(tokens, tokenGroups)
  const content = `${header}<?xml version="1.0" encoding="utf-8"?>\n<resources>\n\n${body}\n\n</resources>`
  return createTextFile("res/values/", "exported_radii.xml", content)
}
