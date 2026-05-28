import { AnyOutputFile, Token, TokenGroup, TokenType } from "@supernovaio/sdk-exporters"
import type { ColorTokenValue } from "@supernovaio/sdk-exporters"
import { exportConfiguration } from "../index"
import { createTextFile, xmlFileHeader } from "../utils/file-helper"
import { tokenSnakeName } from "../utils/naming"
import { toAndroidColor } from "../utils/color"

/**
 * Converts normalised from/to coordinates into an Android gradient angle (degrees,
 * multiple of 45).  Android counts anticlockwise from 3 o'clock: 0 = left→right,
 * 90 = bottom→top, 180 = right→left, 270 = top→bottom.
 */
function toAndroidAngle(from: { x: number; y: number }, to: { x: number; y: number }): number {
  const dx = to.x - from.x
  const dy = to.y - from.y
  let degrees = Math.atan2(-dy, dx) * (180 / Math.PI)
  degrees = ((degrees % 360) + 360) % 360
  return Math.round(degrees / 45) * 45
}

function gradientXml(token: Token, tokenGroups: TokenGroup[]): string {
  const gradients = (token as any).value as Array<any>
  if (!Array.isArray(gradients) || gradients.length === 0) return ""

  // Take the first gradient definition (multi-gradient layering not supported in Views XML)
  const grad = gradients[0]
  const type: string = (grad.type ?? "Linear").toLowerCase()
  const stops: Array<{ position: number; color: ColorTokenValue }> = grad.stops ?? []
  if (stops.length === 0) return ""

  const stopLines = stops
    .map((s) => `        <item android:offset="${s.position}" android:color="${toAndroidColor(s.color)}"/>`)
    .join("\n")

  let gradientAttrs: string
  if (type === "radial") {
    gradientAttrs = `android:type="radial"\n        android:gradientRadius="100%"`
  } else {
    const angle = toAndroidAngle(
      grad.from ?? { x: 0, y: 0.5 },
      grad.to ?? { x: 1, y: 0.5 }
    )
    gradientAttrs = `android:type="linear"\n        android:angle="${angle}"`
  }

  const disclaimer = xmlFileHeader(exportConfiguration.showGeneratedFileDisclaimer, exportConfiguration.disclaimer)

  return `${disclaimer}<?xml version="1.0" encoding="utf-8"?>
<!-- Requires API 29+ for multi-stop gradient support -->
<shape xmlns:android="http://schemas.android.com/apk/res/android">
    <gradient
        ${gradientAttrs}>
${stopLines}
    </gradient>
</shape>`
}

export function generateGradientFiles(tokens: Token[], tokenGroups: TokenGroup[]): AnyOutputFile[] {
  return tokens
    .filter((t) => t.tokenType === TokenType.gradient)
    .flatMap((token) => {
      const content = gradientXml(token, tokenGroups)
      if (!content) return []
      const name = tokenSnakeName(token, tokenGroups)
      return [createTextFile("res/drawable/", `${name}.xml`, content)]
    })
}
