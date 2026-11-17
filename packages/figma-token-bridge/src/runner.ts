import StyleDictionary from 'style-dictionary'
import { compositeToCssString } from './transforms.js'
import { tailwindIntegrated } from './formats.js'
import path from 'node:path'

/**
 * figma-token-bridge 스타일 딕셔너리 기반 통합 엔진 (SD v5)
 */
export async function runTokenBridge(config: any, configDir: string) {
  const namespace = config.namespace ?? 'afds'

  // 커스텀 트랜스포머/포맷터 등록
  StyleDictionary.registerTransform(compositeToCssString)
  StyleDictionary.registerFormat(tailwindIntegrated)

  const tiers = ['primitive', 'semantic', 'dark', 'custom', 'effects'] as const

  for (const tier of tiers) {
    const tierConfig = config.tiers[tier]
    if (!tierConfig) continue

    const sourcePath = path.resolve(configDir, tierConfig.source)
    const includePaths = []
    if (tier !== 'primitive' && config.tiers.primitive) {
      includePaths.push(path.resolve(configDir, config.tiers.primitive.source))
    }
    if (tier === 'dark' && config.tiers.semantic) {
      includePaths.push(path.resolve(configDir, config.tiers.semantic.source))
    }
    if (tier === 'custom' && config.tiers.semantic) {
      includePaths.push(path.resolve(configDir, config.tiers.semantic.source))
    }
    if (tier === 'effects' && config.tiers.semantic) {
      includePaths.push(path.resolve(configDir, config.tiers.semantic.source))
    }

    const sd = new StyleDictionary({
      source: [sourcePath],
      include: includePaths,
      platforms: {
        css: {
          prefix: namespace,
          // name/kebab을 사용하여 --afds-color-gray-500 형태 유지
          transforms: ['name/kebab', 'afds/composite/css'],
          buildPath: configDir + path.sep,
          options: {
            tier,
            namespace,
            selector: tierConfig.selector ?? (tier === 'dark' ? '.dark' : ':root'),
            tailwind: tierConfig.tailwind,
            outputReferences: true,
          },
          files: [
            {
              destination: tierConfig.output,
              format: 'afds/css/tailwind-integrated',
            },
          ],
        },
      },
    })

    console.log(`[SD] Processing ${tier} tier...`)
    await sd.buildAllPlatforms()
  }
}
