export type ExporterConfiguration = {
  /** Show the token description as an XML comment above every exported token. */
  showDescriptions: boolean
  /** Add a disclaimer comment at the top of every generated file. */
  showGeneratedFileDisclaimer: boolean
  /** Text of the auto-generated file disclaimer. */
  disclaimer: string
  /** Dark theme file will only include tokens whose value differs from the base. */
  exportOnlyThemedTokens: boolean
  /** Generate the base (light) colour file at res/values/. */
  exportBaseValues: boolean
  /**
   * When true, strips the leading group-path prefix from every exported name
   * so only the token's own name is used.
   * When false (default), the full parent-group hierarchy is prepended,
   * e.g. "typography_heading_heading_01".
   */
  stripGroupPrefix: boolean
}
