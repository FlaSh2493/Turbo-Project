const { mergeConfig } = require('vite')
const path = require('node:path')

/** @type { import('@storybook/react-vite').StorybookConfig } */
const config = {
  stories: [
    '../stories/**/*.mdx',
    '../stories/**/*.stories.@(js|jsx|mjs|ts|tsx)',
    '../../../packages/afds/src/**/*.mdx',
    '../../../packages/afds/src/**/*.stories.@(js|jsx|mjs|ts|tsx)',
    '../../../packages/afds/tokens/stories/**/*.mdx',
    '../../../packages/afds/tokens/stories/**/*.stories.@(js|jsx|mjs|ts|tsx)',
    '../../../packages/afds/docs/**/*.mdx',
    // 컴포지션은 afds-registry 로 이전됐다 — afds src/** 글롭이 더는 이 스토리들을 찾지 못한다.
    '../../../packages/afds-registry/src/**/*.stories.@(js|jsx|mjs|ts|tsx)',
  ],
  addons: [
    '@storybook/addon-links',
    '@storybook/addon-essentials',
    '@storybook/addon-interactions',
  ],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  docs: {},
  typescript: {
    reactDocgen: 'react-docgen-typescript',
  },
  viteFinal: async config => {
    const { default: tailwindcss } = await import('@tailwindcss/vite')
    const isSource = process.env.STORYBOOK_SOURCE === 'true'
    const afdsRoot = path.resolve(__dirname, '../../../packages/afds')
    return mergeConfig(config, {
      plugins: [tailwindcss()],
      resolve: {
        alias: [
          // CSS @import는 exports 필드를 따르지 않으므로 직접 alias 필요.
          //
          // **정규식(정확 매칭)이어야 한다.** 문자열 find 는 prefix 매칭이다 —
          // vite 의 alias 매처가 `importee.startsWith(pattern + '/')` 로 끝나므로
          // 문자열 '@turbo-project/afds/styles' 는 '@turbo-project/afds/styles/scoped' 까지
          // 삼키고, 문자열 치환이라 `<afdsRoot>/tokens/index.css/scoped` 라는 존재하지
          // 않는 경로가 된다(실측: ENOTDIR: not a directory).
          // /styles/scoped 는 alias 를 타지 않고 package exports 로 해소돼야 한다
          // (→ dist/styles/scoped.css). 아래 source 모드 alias 들도 같은 이유로 정규식이다.
          {
            find: /^@turbo-project\/afds\/styles$/,
            replacement: path.join(afdsRoot, 'tokens/index.css'),
          },
          // source 모드: @turbo-project/afds 서브패스를 TS 소스로 직접 alias
          // conditions: ['source'] 전역 설정 대신 여기서 명시해 서드파티(react-aria 등)에 영향 없게 함
          ...(isSource
            ? [
                {
                  find: /^@turbo-project\/afds$/,
                  replacement: path.join(afdsRoot, 'src/index.ts'),
                },
                {
                  find: /^@turbo-project\/afds\/bricks$/,
                  replacement: path.join(afdsRoot, 'src/bricks/index.ts'),
                },
                {
                  find: /^@turbo-project\/afds\/hooks$/,
                  replacement: path.join(afdsRoot, 'src/hooks/index.ts'),
                },
                {
                  find: /^@turbo-project\/afds\/headless$/,
                  replacement: path.join(afdsRoot, 'src/headless/index.ts'),
                },
                {
                  find: /^@turbo-project\/afds\/schemas$/,
                  replacement: path.join(afdsRoot, 'src/schemas/index.ts'),
                },
                {
                  find: /^@turbo-project\/afds\/scope$/,
                  replacement: path.join(afdsRoot, 'src/scope/index.ts'),
                },
                // 컴포지션(afds-registry 로 이전)이 쓰는 두 서브패스 — root 별칭과 같은 이유로
                // source 모드에서 dist 대신 살아있는 소스를 읽게 한다.
                {
                  find: /^@turbo-project\/afds\/lib\/utils$/,
                  replacement: path.join(afdsRoot, 'src/lib/utils.ts'),
                },
                {
                  find: /^@turbo-project\/afds\/lib\/compose-event-handlers$/,
                  replacement: path.join(afdsRoot, 'src/lib/compose-event-handlers.ts'),
                },
              ]
            : []),
        ],
        modules: [path.resolve(__dirname, '../node_modules'), 'node_modules'],
      },
    })
  },
}

module.exports = config
