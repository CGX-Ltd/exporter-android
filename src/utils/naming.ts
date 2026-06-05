import { Token, TokenGroup } from "@supernovaio/sdk-exporters"

export function tokenFullPath(token: Token, tokenGroups: TokenGroup[]): string[] {
  const group = tokenGroups.find((g) => g.id === token.parentGroupId)
  if (!group || group.isRoot) {
    return [token.name]
  }

  const parts = [...group.path, group.name, token.name]

  // Strip leading segments that reappear later in the path — these are redundant
  // category wrappers from the design token hierarchy (e.g. ["Spacing", "Core", "Spacing", "0"]
  // becomes ["Core", "Spacing", "0"]). Comparison is normalised to match snake_case output.
  const normalise = (s: string) =>
    s
      .replace(/([a-z])([A-Z])/g, "$1_$2")
      .replace(/[\s\-]+/g, "_")
      .toLowerCase()

  while (parts.length > 1 && parts.slice(1).map(normalise).includes(normalise(parts[0]))) {
    parts.shift()
  }

  return parts
}

export function toSnakeCase(parts: string[]): string {
  const joined = parts.join(" ")
  const result = joined
    .replace(/([a-z])([A-Z])/g, "$1_$2")
    .replace(/[\s\-]+/g, "_")
    .toLowerCase()
  return /^\d/.test(result) ? `_${result}` : result
}

export function toPascalCase(parts: string[]): string {
  return parts
    .join(" ")
    .split(/[\s_\-]+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join("")
}

export function tokenSnakeName(token: Token, tokenGroups: TokenGroup[]): string {
  return toSnakeCase(tokenFullPath(token, tokenGroups))
}

export function tokenPascalName(token: Token, tokenGroups: TokenGroup[]): string {
  return toPascalCase(tokenFullPath(token, tokenGroups))
}
