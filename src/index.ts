import { AnyOutputFile, PulsarContext, RemoteVersionIdentifier, Supernova } from "@supernovaio/sdk-exporters"
import { ExporterConfiguration } from "../config"
import { generateColorFiles } from "./files/colors"
import { generateDimenFile } from "./files/dimens"
import { generateRadiiFile } from "./files/radii"
import { collectFonts, generateTextStylesFile } from "./files/text-styles"
import { generateFontFiles } from "./files/fonts"

export const exportConfiguration = Pulsar.exportConfig<ExporterConfiguration>()

Pulsar.export(async (sdk: Supernova, context: PulsarContext): Promise<Array<AnyOutputFile>> => {
  const remoteVersionIdentifier: RemoteVersionIdentifier = {
    designSystemId: context.dsId,
    versionId: context.versionId,
  }

  let tokens = await sdk.tokens.getTokens(remoteVersionIdentifier)
  let tokenGroups = await sdk.tokens.getTokenGroups(remoteVersionIdentifier)

  // Filter to the selected brand when one is specified in the pipeline
  if (context.brandId) {
    const brands = await sdk.brands.getBrands(remoteVersionIdentifier)
    const brand = brands.find((b) => b.id === context.brandId || b.idInVersion === context.brandId)
    if (!brand) {
      throw new Error(`Unable to find brand ${context.brandId}.`)
    }
    tokens = tokens.filter((t) => t.brandId === brand.id)
    tokenGroups = tokenGroups.filter((g) => g.brandId === brand.id)
  }

  // Resolve the dark theme by name so we can generate res/values-night/
  const themes = await sdk.tokens.getTokenThemes(remoteVersionIdentifier)
  const darkTheme = themes.find((t) => t.name === "Dark")
  const darkTokens = darkTheme
    ? sdk.tokens.computeTokensByApplyingThemes(tokens, tokens, [darkTheme])
    : undefined

  // Collect fonts referenced by typography tokens (needed for font XML files)
  const fontsMap = collectFonts(tokens)

  const outputFiles: AnyOutputFile[] = [
    ...generateColorFiles(tokens, tokenGroups, darkTheme, darkTokens),
    generateDimenFile(tokens, tokenGroups),
    generateRadiiFile(tokens, tokenGroups),
    generateTextStylesFile(tokens, tokenGroups),
    ...generateFontFiles(fontsMap),
  ]

  return outputFiles
})
