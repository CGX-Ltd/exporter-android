import { AnyOutputFile, PulsarContext, RemoteVersionIdentifier, Supernova } from "@supernovaio/sdk-exporters"
import { ExporterConfiguration } from "../config"
import { ThemeTokenSet } from "./types"
import { generateColorFiles } from "./files/colors"
import { generateDimenFiles } from "./files/dimens"
import { generateRadiiFile } from "./files/radii"
import { generateTextStylesFile } from "./files/text-styles"

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

  // Fetch all themes and pre-compute each theme's full token set once.
  // Generators inspect `theme.overriddenTokens` to decide whether a theme is
  // relevant to them (e.g. color themes vs. size themes).
  const themes = await sdk.tokens.getTokenThemes(remoteVersionIdentifier)
  const themedTokenSets: ThemeTokenSet[] = themes.map((theme) => ({
    theme,
    tokens: sdk.tokens.computeTokensByApplyingThemes(tokens, tokens, [theme]),
  }))

  const outputFiles: AnyOutputFile[] = [
    ...generateColorFiles(tokens, tokenGroups, themedTokenSets),
    ...generateDimenFiles(tokens, tokenGroups, themedTokenSets),
    generateRadiiFile(tokens, tokenGroups),
    generateTextStylesFile(tokens, tokenGroups),
  ]

  return outputFiles
})
