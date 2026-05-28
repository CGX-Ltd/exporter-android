import { AnyOutputFile, OutputFileType } from "@supernovaio/sdk-exporters"

export function createTextFile(relativePath: string, fileName: string, content: string): AnyOutputFile {
  return {
    path: relativePath,
    name: fileName,
    type: OutputFileType.text,
    content,
  } as AnyOutputFile
}

/**
 * Returns a one-line XML comment header when showGeneratedFileDisclaimer is on,
 * otherwise an empty string. Pass exportConfiguration values directly to avoid
 * a circular import through index.ts.
 */
export function xmlFileHeader(showDisclaimer: boolean, disclaimer: string): string {
  if (!showDisclaimer) return ""
  return `<!-- ${disclaimer.split("\n")[0]} -->\n`
}

/**
 * Converts a Supernova letter-spacing percentage value to the dimensionless
 * Android em unit used by android:letterSpacing.
 * Supernova stores 1 % as the number 1; Android expects 0.1 for 1 %.
 */
export function letterSpacingToEm(measure: number): number {
  return measure / 10
}

/**
 * Converts a Supernova line-height percentage value to the multiplier used by
 * android:lineSpacingMultiplier. Supernova stores 120 % as the number 120;
 * Android expects 1.2.
 */
export function lineHeightToMultiplier(measure: number): number {
  return measure / 100
}
