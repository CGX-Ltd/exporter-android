import { Token, TokenTheme } from "@supernovaio/sdk-exporters"

/**
 * A theme paired with its fully-computed token set (base tokens with the
 * theme's overrides applied via `computeTokensByApplyingThemes`).
 */
export interface ThemeTokenSet {
  theme: TokenTheme
  tokens: Token[]
}
