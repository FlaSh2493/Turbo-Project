# @turbo-project/afds

**Agent Friendly Design System (AFDS)**

Base UI + Tailwind CSS v4 기반의 디자인 시스템입니다.

---

## 1. 시작하기

### 1.1 설치

```bash
pnpm add @turbo-project/afds

# peer dependencies 필수 설치
pnpm add react react-dom @base-ui/react tailwindcss
```

### 1.2 스타일 적용

앱 진입점 CSS 파일에 한 번만 추가합니다.

```css
/* src/styles/global.css */
@import 'tailwindcss';
@import 'tw-animate-css';

@source '../../node_modules/@turbo-project/afds/dist/**/*.js';

@import '@turbo-project/afds/tokens.css';
@import '@turbo-project/afds/tokens.semantic.css';
@import '@turbo-project/afds/tokens.custom.css';
@import '@turbo-project/afds/tokens.motion.css';
@import '@turbo-project/afds/tokens.effects.css';
```

- `@source`는 AFDS의 빌드 산출물(`dist/**/*.js`)을 Tailwind JIT 스캔 대상에 포함시켜, AFDS 컴포넌트가 쓰는 유틸리티 클래스가 누락 없이 생성되게 합니다. CSS 파일 기준 상대경로이므로 진입점 위치에 맞게 `../../` 깊이를 조정하세요.
- 다섯 개 `tokens.*.css`는 primitive·semantic·custom·motion·effects 디자인 토큰을 CSS 변수로 등록합니다.

> `@import '@turbo-project/afds/styles';` 한 줄로도 동일한 내용(`tailwindcss`·`tw-animate-css`·`@source`·tokens)을 한 번에 가져올 수 있지만 **권장하지 않습니다.** 이 경우 `@source`가 패키지 내부 경로로 고정되어 있어, 번들러가 AFDS 소스를 직접 스캔하지 못하는 환경에서는 유틸리티 클래스가 누락될 수 있습니다. 위의 명시적 방식을 사용하세요.

#### 소비 방식별 CSS 엔트리 선택

| 소비 방식                                 | 엔트리                                                        | 비고                                    |
| ----------------------------------------- | ------------------------------------------------------------- | --------------------------------------- |
| 패키지 컴포넌트만 사용                    | 위 1.2 명시적 조립 (권장) · 또는 `@turbo-project/afds/styles` | `styles` 는 사전 컴파일 CSS             |
| copy-owned 소스를 자기 Tailwind 로 컴파일 | `@turbo-project/afds/tokens`                                  | 토큰 원본 조립 파일(`tokens/index.css`) |

`@turbo-project/afds/tokens` 는 `tailwindcss`·`tw-animate-css`·토큰 5개 파일을 순서대로 조립합니다.
`@source` 가 들어 있지만 **AFDS 패키지 자신의 `src` 만** 스캔하므로, copy-owned 소스의 클래스는
소비자 CSS 에서 설치 디렉터리를 직접 지정해야 생성됩니다.

```css
/* copy-owned 소비자의 global.css */
@import '@turbo-project/afds/tokens';
@source './**/*.{ts,tsx}'; /* 자기 소스 — 반드시 직접 선언 */
```

> **preflight 주의** — `tokens` 는 `@import 'tailwindcss'` 로 전역 preflight(reset)를 포함합니다.
> 위 1.2 의 명시적 조립도 마찬가지입니다. 기존 화면에 preflight 가 번지면 안 되는 경우에는
> §1.5 의 `styles/scoped` 를 쓰거나, `tailwindcss` 전체 대신 `tailwindcss/theme.css`(layer theme)와
> `tailwindcss/utilities.css`(layer utilities)만 import 하고 토큰 파일을 개별로 조립하세요.
>
> **폰트** — Pretendard 웹폰트 CDN 은 `@turbo-project/afds/tokens/fonts` 로 분리되어 있습니다(선택).
> 이 엔트리는 폰트를 **로드만** 합니다. AFDS CSS 는 어디에서도 `font-family` 를 적용하지 않으므로
> (`--afds-typography-font-family-base` 는 선언만 되어 있고 이를 참조하는 규칙이 없습니다),
> 실제로 Pretendard 를 쓰려면 소비자가 직접 적용해야 합니다 — 가장 간단한 방법은 자기 `@theme` 에서
> Tailwind 의 기본 sans 를 덮는 것입니다:
>
> ```css
> @import '@turbo-project/afds/tokens/fonts';
> @import '@turbo-project/afds/tokens';
> @theme {
>   --font-sans: Pretendard, ui-sans-serif, system-ui, sans-serif;
> }
> ```

### 1.3 기본 사용

**ESM**

```tsx
import { Button, Input } from '@turbo-project/afds'

export default function App() {
  return (
    <>
      <Input placeholder="입력" />
      <Button variant="fill">확인</Button>
    </>
  )
}
```

`package.json`의 `exports` 필드가 자동으로 `.js`와 TypeScript 타입을 라우팅합니다.

> AFDS는 **ESM 전용** 패키지입니다 (`"type": "module"`). CJS(`require`)는 지원하지 않습니다.

### 1.4 TypeScript 설정

`tsconfig.json`에 `moduleResolution: "bundler"` 또는 `"node16"` 이상을 설정하면 subpath exports 타입이 자동으로 인식됩니다.

```json
{
  "compilerOptions": {
    "moduleResolution": "bundler"
  }
}
```

---

### 1.5 다른 디자인시스템과 공존 (`.afds` 스코프 격리)

**언제 필요한가** — 이미 **Ant Design·MUI·Radix 등 다른 디자인시스템으로 만든 화면**에 AFDS를 얹을 때(예: Module Federation remote, 기존 앱에 챗봇 위젯 추가). 전역 `@turbo-project/afds/styles`를 쓰면 AFDS의 Tailwind preflight(전역 reset)가 페이지 전체로 번져 기존 화면이 깨지고, 오버레이는 `document.body`로 빠져나가 스타일을 잃습니다.

**셋업 (2단계)** — 전역 스타일 대신 스코프된 스타일을 쓰고, AFDS UI를 `<AfdsScope>`로 감쌉니다.

```ts
// ① 전역 styles 대신 scoped styles
import '@turbo-project/afds/styles/scoped'
```

```tsx
// ② AFDS UI를 <AfdsScope>로 감싸기
import { AfdsScope } from '@turbo-project/afds/scope'
;<AfdsScope>
  <Chat /> {/* 이 안의 AFDS·오버레이만 .afds 스코프 스타일을 받음 */}
</AfdsScope>
```

→ preflight·디자인토큰·오버레이가 모두 `.afds` 안에서만 동작하고, 바깥 host 화면은 건드리지 않습니다.

**주의 (자주 겪는 문제):**

- host 컴포넌트는 `<AfdsScope>` **밖**에 둡니다. `.afds` 안에 넣으면 이번엔 AFDS preflight가 그 컴포넌트를 깨뜨립니다(배경·테두리·여백 손실).
- 전역 `styles`와 `styles/scoped`를 **한 페이지에 동시 import 하지 않습니다**(전역이 scoped 격리를 무효화).
- host가 이미 Tailwind를 쓰면 유틸리티 class(`text-sm` 등)가 겹칠 수 있으나 변수 기반이라 대개 무해합니다(상세는 가이드 참고).

**더 보기** — 전체 가이드·문제 해결: [`docs/scoped-coexistence.md`](./docs/scoped-coexistence.md) · 시각 예시: Storybook `AFDS / Scope / AfdsScope`. 임의 스코프 셀렉터가 필요하면 `@turbo-project/afds/postcss`의 `scopeAfdsPreflight({ scope })`를 씁니다.

---

## 2. Import 전략

### 2.1 Subpath Imports

```tsx
import { Button } from '@turbo-project/afds' // 기본 (전체)
import { Flex } from '@turbo-project/afds/bricks' // 단일 컴포넌트만
import { useToast } from '@turbo-project/afds/headless' // 상태 훅만
```

| Subpath                                          | 설명                                                          |
| ------------------------------------------------ | ------------------------------------------------------------- |
| `@turbo-project/afds`                            | Button, Input 등 스타일 포함 전체 컴포넌트                    |
| `@turbo-project/afds/bricks`                     | 토큰·스타일이 적용된 단일 컴포넌트                            |
| `@turbo-project/afds/headless`                   | 상태/로직 훅 (useToast 등)                                    |
| `@turbo-project/afds/hooks`                      | 범용 유틸 훅                                                  |
| `@turbo-project/afds/lib/utils`                  | `cn` (className 병합) — **컴포지션 소스가 쓰는 경로**         |
| `@turbo-project/afds/lib/compose-event-handlers` | `composeEventHandlers`                                        |
| `@turbo-project/afds/schemas`                    | 토큰 타입·zod 스키마                                          |
| `@turbo-project/afds/scope`                      | 스코프 격리 유틸                                              |
| `@turbo-project/afds/styles`                     | 사전 컴파일 전체 CSS (Tailwind · tw-animate-css · 토큰)       |
| `@turbo-project/afds/tokens`                     | 토큰 원본 조립 CSS (copy-owned 소비자용) · `tokens/index.css` |
| `@turbo-project/afds/tokens/fonts`               | Pretendard CDN (선택) · `tokens/fonts.css`                    |

정본은 `packages/afds/package.json` 의 `exports` 입니다 — 위 표에 없는 서브패스도 있습니다
(`./styles/scoped` · `./postcss` · `./manifest.json` · `./llms.txt` · `./tokens.css` 등 토큰 CSS 변형).

### 2.2 컴포지션 — 표준 shadcn CLI 로 복사

컴포지션(`DatePicker`·`BaseTable` 등)은 **afds 패키지가 아니라 `afds-registry` 소스에서 나옵니다.**
`@turbo-project/afds/compositions` 번들 import 채널은 더 이상 없습니다 — 컴포지션은 소스가
`packages/afds-registry/src/compositions/` 로 이전됐고, 유일한 전달 방법은 소스 코드를 프로젝트로
복사하는 것입니다. 표준 `shadcn` CLI 가 이 저장소를 직접 읽어 복사합니다(자체 CLI 는 제거됐습니다).

```bash
# 코드 복사 — 프로젝트 맥락에 맞게 고쳐 쓴다
npx shadcn@4.19.1 add FlaSh2493/turbo-project/date-picker#main
```

저장소가 비공개라면 저장소 읽기 자격증명(`gh auth login` 또는 `GH_TOKEN`/`GITHUB_TOKEN`)이
필요합니다 — 없으면 컴포지션 소스를 받지 못합니다. 의존성 설치가 실패하면
**파일도 남지 않습니다** — CLI 가 의존성 설치를 **파일 쓰기보다 먼저** 하므로 거기서 멈추면
`src/components` 디렉터리 자체가 생기지 않습니다(실측). 복사된 코드는 afds 의
전이 의존성을 쓸 수 없으므로, CLI 가 레지스트리 아이템의 `dependencies` 를 소비처에 설치합니다.
설치 시점의 기준 AFDS 버전은 레지스트리 아이템의 `docs` 로 안내되고(설치 직후 출력), 이후 독립적으로 진화합니다.
원본과 비교하려면 `npx shadcn@4.19.1 add FlaSh2493/turbo-project/<이름>#<ref> --diff` 를 씁니다.
**경로 없이 실행하면 처음 5개 파일만 보여줍니다**(CLI 가 `Showing 5 of N files.` 로 알려줍니다).
나머지는 `--diff <파일경로>` 로 하나씩 봐야 합니다.

> 참고: 루트 entry(`@turbo-project/afds`)는 컴포지션을 노출하지 않습니다 — 이제 afds 자체에
> 컴포지션 소스가 없으므로 노출할 것도 없습니다. `0.5.1` 에서 내린 "소비자 관점 비노출"
> 결정과 결과적으로 같은 상태입니다.

### 2.3 Tree-shaking 동작 원리

named import를 사용하면 번들러가 사용된 컴포넌트만 자동으로 포함합니다.

```tsx
// 번들에는 Button 관련 코드만 포함됨
import { Button } from '@turbo-project/afds'
```

`tsup bundle: false` 설정으로 컴포넌트별 개별 파일이 출력되어 있습니다.
CSS 파일(`sideEffects: ["./tokens/*.css"]`)은 tree-shaking되지 않습니다.

### 2.4 Tree-shaking 비활성화

전체 패키지를 번들에 포함해야 할 때 (전역 등록, Module Federation 등).

**Vite**

```ts
// vite.config.ts

// 방법 1 — namespace import (가장 간단)
import * as AFDS from '@turbo-project/afds'

// 방법 2 — 개발 서버 pre-bundle
export default defineConfig({
  optimizeDeps: {
    include: ['@turbo-project/afds'],
  },
})

// 방법 3 — 프로덕션 빌드에서 AFDS만 tree-shaking 제외
export default defineConfig({
  build: {
    rollupOptions: {
      treeshake: {
        moduleSideEffects: id => id.includes('@turbo-project/afds'),
      },
    },
  },
})

// SSR / Next.js — SSR 빌드 시 번들에 포함
export default defineConfig({
  ssr: {
    noExternal: ['@turbo-project/afds'],
  },
})
```

**Webpack**

```js
// webpack.config.js

// 방법 1 — package.json sideEffects 선언 무시
module.exports = {
  optimization: {
    sideEffects: false,
  },
}

// 방법 2 — used exports 최적화 비활성화
module.exports = {
  optimization: {
    usedExports: false,
  },
}

// 방법 3 — CSS side effects 명시적 보존
module.exports = {
  module: {
    rules: [
      {
        test: /\.css$/,
        include: /node_modules\/@turbo-project\/afds/,
        use: ['style-loader', 'css-loader'],
        sideEffects: true,
      },
    ],
  },
}

// 방법 4 — ProvidePlugin으로 전역 등록
const webpack = require('webpack')

module.exports = {
  plugins: [
    new webpack.ProvidePlugin({
      Button: ['@turbo-project/afds', 'Button'],
      Input: ['@turbo-project/afds', 'Input'],
    }),
  ],
}
```

### 2.5 Module Federation

Host와 Remote 간 AFDS를 공유하여 중복 번들을 방지합니다.

**권장 컨벤션**: subpath import + trailing slash prefix shared

```js
// host/webpack.config.js (Remote도 동일하게 설정)
const { ModuleFederationPlugin } = require('webpack').container

module.exports = {
  plugins: [
    new ModuleFederationPlugin({
      name: 'host',
      shared: {
        react: { singleton: true, requiredVersion: '^18.0.0' },
        'react-dom': { singleton: true, requiredVersion: '^18.0.0' },
        '@base-ui/react': { singleton: true },
        '@turbo-project/afds': {
          singleton: true,
          requiredVersion: '^0.1.0',
        },
        '@turbo-project/afds/': {
          // ← trailing slash. subpath import도 shared scope로 묶음
          singleton: true,
          requiredVersion: '^0.1.0',
        },
      },
    }),
  ],
}
```

```tsx
// 소비 측 — subpath로 import
import { Button, Flex } from '@turbo-project/afds/bricks'
import { useToast } from '@turbo-project/afds/headless'
```

**왜 이렇게 쓰나**

- AFDS는 federation 환경에서 트리쉐이킹이 동작하지 않으므로, root barrel(`@turbo-project/afds`)을 import하면 **components·headless·schemas·hooks·lib 전체가 shared chunk로 로드**됩니다.
- subpath import는 해당 영역의 chunk만 로드되어 초기 평가/네트워크 비용이 크게 줄어듭니다 (e.g. `hooks`만 쓰는 remote는 수십 KB 수준).
- trailing slash(`'@turbo-project/afds/'`)는 webpack 5의 prefix sharing 문법으로, 모든 subpath specifier를 한 번에 shared scope로 잡습니다. subpath마다 일일이 나열할 필요 없습니다.

**주의: root barrel과 subpath를 섞지 마세요**

```tsx
// ❌ 위험 — 같은 코드베이스에서 혼용
import { Button } from '@turbo-project/afds' //          → shared key: '@turbo-project/afds'
import { Flex } from '@turbo-project/afds/bricks' // → shared key: '@turbo-project/afds/bricks'
```

두 import는 **서로 다른 shared key**로 해석되어 AFDS 인스턴스가 갈라집니다. emotion CacheProvider, React Context(Theme/Locale)가 두 인스턴스로 분리되어 스타일 누락·Context Provider 단절이 발생합니다. **팀 규약으로 둘 중 하나만 사용**하세요(권장은 subpath).

ESLint로 강제하려면:

```js
// .eslintrc
'no-restricted-imports': ['error', {
  paths: [{
    name: '@turbo-project/afds',
    message: 'Use subpath imports (e.g. @turbo-project/afds/bricks) for Module Federation.',
  }],
}]
```

CSS는 각 앱에서 직접 import합니다 (shared 불가).

```css
/* 각 앱의 entry CSS */
@import '@turbo-project/afds/styles';
```

---

## 3. 스타일링

### 3.1 다크 모드 — 지원하지 않습니다

`<html class="dark">` 를 붙여도 아무 일도 일어나지 않습니다. **배선이 없습니다.**

- 배포되는 어떤 CSS 에도 `.dark` 셀렉터나 `@custom-variant dark` 가 없습니다.
- 토큰 파이프라인(`token-bridge.config.ts`)의 tier 는
  `primitive` · `semantic` · `custom` · `effects` 넷뿐이고 `dark` tier 가 없습니다.
- `figma-export.json` 의 `$themes` 는 빈 배열입니다 — Figma 에 모드가 정의된 적이 없습니다.

지원 계획도 없습니다(2026-08-27 확인). 다크 모드가 필요하면 토큰 소스에 dark 모드를 정의하고
파이프라인 tier·`.dark` 배선·시각 회귀 검증까지 새로 만들어야 합니다.

### 3.2 className override

```tsx
<Button className="w-full rounded-full">전체 너비 버튼</Button>
```

### 3.3 CSS 변수 override

```css
.my-section {
  --afds-color-brand-500: #7c3aed;
}
```

### 3.4 Tailwind 동적 클래스 제약

Tailwind 4 JIT 스캐너는 소스를 **정규식 기반 텍스트 추출**로만 분석합니다. JS 표현식을 평가하지 않으므로 **변수 부분이 클래스명에 들어가는 형태로는 사용할 수 없습니다.**

**안티패턴 ❌**

```tsx
// 템플릿 리터럴 — `${gap}`이 어떤 값이 될지 추론 불가
className={`gap-afds-${gap}`}

// 문자열 concat — 동일
className={'gap-afds-' + gap}

// 동적 조합 함수 — 결과 클래스명이 빌드 타임에 존재하지 않음
const cls = (size: string) => `p-${size}`
```

런타임엔 동작하지만 빌드 타임에 CSS가 생성되지 않아 **스타일이 적용되지 않습니다.** `@source`/`@theme` 지시어가 있어도 마찬가지 — 완성된 클래스 문자열이 코드 어디에도 리터럴로 존재해야 Tailwind가 CSS를 emit합니다.

**올바른 패턴 ✅**

```tsx
// 1. 매핑 객체 — 클래스명이 리터럴로 박힘
const GAP_CLASS = {
  'spacing-4': 'gap-afds-spacing-4',
  'spacing-60': 'gap-afds-spacing-60',
} as const
className={GAP_CLASS[gap]}

// 2. 조건 분기 — 각 가지가 리터럴
className={cn(
  size === 'sm' && 'p-afds-spacing-4',
  size === 'md' && 'p-afds-spacing-8',
)}

// 3. CVA — 내부적으로 정적 매핑
const variants = cva('', {
  variants: { size: { sm: 'p-afds-spacing-4', md: 'p-afds-spacing-8' } },
})

// 4. data-attribute + Tailwind variant — 클래스 자체는 정적
<div data-size={size} className="data-[size=sm]:p-afds-spacing-4 data-[size=md]:p-afds-spacing-8" />

// 5. inline style — Tailwind 우회 (토큰 CSS 변수 직접 참조)
<div style={{ gap: `var(--spacing-afds-spacing-${gap})` }} />
```

### 3.5 SVG 에서 토큰 쓰기

SVG 도형의 색은 토큰으로 지정할 수 있습니다. hex 를 직접 쓸 이유가 없습니다.

```tsx
// 1. Tailwind 유틸 — fill-* / stroke-* (권장)
<text className="fill-afds-text-secondary">라벨</text>
<path className="stroke-afds-border-default" />

// 2. CSS 변수 직접 참조 — SVG presentation attribute
<circle fill="var(--afds-color-icon-brand)" />
```

- `fill-*`·`stroke-*` 는 Tailwind v4 가 `@theme` 의 `--color-*` 네임스페이스에서 생성하므로,
  `bg-*`·`text-*` 와 **같은 토큰 이름**을 씁니다(`bg-afds-bg-surface` ↔ `fill-afds-bg-surface`).
  AFDS 내부에서도 사용 중입니다 — `src/bricks/feedback/spinner/spinner.tsx` 의
  `stroke-afds-gray-200` · `stroke-afds-gray-500`.
- 유틸 클래스는 **소비자 자신의 Tailwind 빌드**가 토큰 `@theme` 를 가지고 있고 그 소스를
  스캔할 때 생성됩니다(§1.2). 사전 컴파일된 `styles` 만 쓰는 경우, 소비자 코드에 새로 등장한
  클래스는 번들에 없습니다.
- 방법 2 는 **CSS 변수만 있으면 되고 Tailwind 가 필요 없습니다.** 클래스명을 정적으로 만들 수
  없는 경우(§3.4 의 동적 클래스 제약)나 외부 SVG 에셋에 색을 주입할 때 씁니다.
  `style={{ fill: … }}` 은 쓰지 않습니다 — 색을 인라인 `style` 로 넣는 것은 AFDS 규칙 위반이며,
  presentation attribute 로 같은 결과를 얻습니다.
- 두 방법 모두 실측 확인했습니다(Tailwind v4.1.18 컴파일 · Chrome 131 computed style).

---

## 4. 개발 (기여자용)

### 4.1 Storybook 모드

| 모드      | 명령어                 | 소스                          |
| --------- | ---------------------- | ----------------------------- |
| 소스 모드 | `pnpm storybook`       | `src/` (TypeScript 직접 실행) |
| 빌드 모드 | `pnpm storybook-built` | `dist/` (빌드 아티팩트)       |

**소스 모드** (`STORYBOOK_SOURCE=true`)

- Vite가 `"source"` export condition으로 `./src/` 경로를 직접 해석
- 컴파일 없이 TypeScript 즉시 실행, HMR 즉각 반영
- 컴포넌트 개발 중 빠른 피드백에 적합

**빌드 모드**

- `./dist/` 빌드 아티팩트 기준으로 동작 (`pnpm --filter @turbo-project/afds build` 선행 필요)
- 실제 소비자가 사용하는 결과물과 동일한 환경
- 빌드·번들 설정 검증에 적합

### 4.2 생성 파이프라인

사람이 쓰는 **진실의 원천(SoT)** 은 사실상 3개다: **Figma 토큰**, **`{name}.spec.md`(intent)**, **`{name}.tsx`(Props · slots)**. 다른 모든 산출물은 여기서 자동 파생된다.

> spec.md가 코드보다 먼저다 — 동작/규칙 변경은 spec.md를 먼저 갱신하고 `.tsx`가 spec.md를 따라간다. ([.claude/rules/afds-component-philosophy.md](../../.claude/rules/afds-component-philosophy.md))

```text
Figma Tokens (외부)
    │ figma-token-bridge
    ▼
src/schemas/tokens.schema.ts                  ← 토큰 union 타입

    ┌──────────────────────────────────────────────────────────┐
    │  src/bricks/{cat}/{name}/   (사람이 작성)            │
    │    ├─ {name}.spec.md   ← summary · rules · examples (SoT) │
    │    ├─ {name}.tsx       ← Props 타입 · data-slot          │
    │    └─ {name}.style.ts  ← CVA variants                    │
    └──────────────────────────────────────────────────────────┘
         │                              │
         │ generate-schemas.ts          │
         │ (ts-morph로 .tsx Props 추출, │
         │  tokens.schema 참조)         │
         ▼                              │
src/schemas/{name}.schema.ts            │
  + src/schemas/index.ts                │
         │ ← .schema.override.ts 있으면 그걸로 대체
         │                              │
         └──────────────┬───────────────┘
                        │ generate-manifest.ts
                        │ (+ src/headless/, src/hooks/, src/lib/ 도 스캔)
                        ▼
         dist/manifest/{name}.json
           ├─ summary    ← spec.md blockquote
           ├─ rules      ← spec.md ## Rules
           ├─ examples   ← spec.md ## Examples
           ├─ slots      ← .tsx data-slot
           └─ schemaPath → src/schemas/{name}.schema.ts
         dist/manifest/use-{name}.json   (headless 훅)
         dist/manifest/{utility}.json    (hooks / lib)
         dist/manifest/tokens.{semantic,primitive,custom}.json
         dist/manifest.json              (전체 인덱스)
         dist/llms.txt                   (manifest 평문 요약)

         tsup build (스키마와 독립)
                        ▼
         dist/*.js, *.d.ts
```

**`.schema.override.ts`**: 자동 추출이 불가능한 Props(혼합 union 등)는 sibling `<name>.schema.override.ts`를 작성하면 `<name>.schema.ts`가 override를 re-export합니다.

**언제 재실행하나**

| 변경 내용                                | 재실행                                   |
| ---------------------------------------- | ---------------------------------------- |
| Figma 토큰 변경                          | figma-token-bridge → schemas → manifest  |
| 컴포넌트 Props 타입 변경 / 추가          | `generate:schemas` → `generate:manifest` |
| spec.md / slots / headless / hooks / lib | `generate:manifest`                      |
| 배포용 산출물 갱신                       | `build` (위 단계를 포함)                 |

### 4.3 폴더 레이어

| 레이어       | 책임                                 |
| ------------ | ------------------------------------ |
| `headless`   | Base UI 기반 상태/로직 훅 (스타일 X) |
| `components` | 토큰·스타일이 적용된 단일 컴포넌트   |

의존 방향은 `bricks → headless` 단방향이며 역방향 import는 금지합니다. 여러 컴포넌트를
조합한 복합 컴포넌트(`compositions`)는 이 패키지에 없습니다 — `packages/afds-registry/src/compositions/`
로 이전됐고, 소비처에는 `afds-registry` CLI 로만 전달됩니다(§2.2).

### 4.4 신규 컴포넌트 추가

- [docs/creating-components.md](docs/creating-components.md) — 생성 절차
- [docs/composition-patterns.md](docs/composition-patterns.md) · [docs/composition-recipes.md](docs/composition-recipes.md) — 컴포지션 패턴
- [docs/prop-naming-conventions.md](docs/prop-naming-conventions.md) — prop 네이밍
- [docs/storybook-guidelines.md](docs/storybook-guidelines.md) — Storybook 작성

### 4.5 작성 규칙

- [.claude/rules/afds-component-structure.md](../../.claude/rules/afds-component-structure.md) — 파일/폴더 구조
- [.claude/rules/afds-component-tokens.md](../../.claude/rules/afds-component-tokens.md) — 토큰 사용
- [.claude/rules/afds-storybook-headless.md](../../.claude/rules/afds-storybook-headless.md) · [components](../../.claude/rules/afds-storybook-components.md) · [compositions](../../.claude/rules/afds-storybook-compositions.md) · [patterns](../../.claude/rules/afds-storybook-patterns.md) — Storybook 규칙

---

## 5. 릴리스

이 패키지는 [Changesets](https://github.com/changesets/changesets)로 버전을 관리합니다.

### 변경사항 기록 (PR 작업 시)

```bash
pnpm changeset
# 변경 타입 선택 (patch / minor / major) 후 요약 입력
# .changeset/*.md 파일이 생성되면 커밋에 포함
```

| 타입    | 언제                 |
| ------- | -------------------- |
| `patch` | 버그 수정, 내부 개선 |
| `minor` | 하위 호환 신규 기능  |
| `major` | Breaking change      |

### 배포 흐름

1. 기능 PR에 changeset 파일 포함 → main 머지
2. `chore: version packages` PR 자동 생성 (버전 범프 + CHANGELOG 포함)
3. 해당 PR 머지 → GitHub Package Registry 자동 publish

---

## 6. For AI Agents

| 리소스            | 경로                                          | 용도                        |
| ----------------- | --------------------------------------------- | --------------------------- |
| 컴포넌트 목록     | `dist/llms.txt`                               | 평문 컴포넌트 가이드        |
| 구조화 메타데이터 | `dist/manifest.json`                          | variants, props, slots JSON |
| 컴포넌트 스펙     | `src/bricks/<category>/<name>/<name>.spec.md` | 사용 규칙, variants 표      |
