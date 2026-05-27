import { Token, TokenGroup } from "@supernovaio/sdk-exporters"
import { exportConfiguration } from "../index"

export function tokenFullPath(token: Token, tokenGroups: TokenGroup[]): string[] {
  const group = tokenGroups.find((g) => g.id === token.parentGroupId)
  if (!group || group.isRoot || (group as any).isNonVirtualRoot) {
    return [token.name]
  }

  if (exportConfiguration.stripGroupPrefix) {
    // Strip the ancestor path segments (group.path) but keep the immediate
    // parent group name so that e.g. "Color / Brand / 100" becomes "brand_100"
    // rather than just "_100".
    return [group.name, token.name]
  }

  return [...group.path, group.name, token.name]
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
