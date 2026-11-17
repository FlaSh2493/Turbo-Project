# 다른 디자인시스템과 공존하기 (`.afds` 스코프 격리)

AFDS를 **Ant Design·MUI·Radix 등 다른 디자인시스템을 이미 쓰는 앱**(예: Module Federation remote)에 넣으면, AFDS의 Tailwind v4 **preflight(전역 reset)** 가 페이지 전체로 번져 기존 화면이 깨질 수 있다. 또 Drawer/Modal/Popover/Tooltip 같은 오버레이는 기본적으로 `document.body`로 포털되어 `.afds` 스코프 밖으로 빠져나가 토큰/preflight를 잃는다.

이 문서는 AFDS를 **`.afds` 영역 안에만 가두는 opt-in 메커니즘**을 설명한다.

> 이 기능은 전부 **선택(opt-in)** 이다. 기존처럼 단독으로 AFDS만 쓰는 프로젝트는 `@turbo-project/afds/styles`(전역)와 `document.body` 포털 동작이 그대로이고 **아무것도 바뀌지 않는다.**

---

## 🔎 증상별 빠른 진단 (문제 발생 시 여기부터)

| 증상                                                               | 빠른 해결                                                                                   | 자세히 (아래 섹션)                    |
| ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------- | ------------------------------------- |
| host 화면 전체가 깨짐 — 제목 작아짐·마진/불릿 사라짐·버튼 납작     | 전역 `@turbo-project/afds/styles` 대신 `@turbo-project/afds/styles/scoped` + `<AfdsScope>`  | **빠른 시작**                         |
| 모달·팝오버·드로어가 `.afds` 밖(body)으로 나가 스타일을 잃음       | `<AfdsScope>`로 감싸면 자동으로 스코프 안 포털됨                                            | **AfdsScope 와 오버레이 포털**        |
| `.afds` 안 AFDS 컴포넌트가 스타일이 안 먹음(미스타일)              | 컴포넌트를 `<AfdsScope>` **안**에 둘 것 · 전역 entry와 `styles/scoped` **동시 import 금지** | **theme 변수·토큰 스코프 정책**       |
| host 컴포넌트가 `.afds` 안에서 깨짐                                | host 컴포넌트는 `.afds` **밖(형제)** 에 둔다                                                | **올바른 배치 (안티패턴)**            |
| Tailwind host 에서 간격·색·폰트가 미묘하게 다름                    | 유틸리티 class 이름 충돌 가능(대개 무해, 리터럴 커스터마이즈/`!important`만 위험)           | **보장/비보장 › 유틸리티 class 이름** |
| 빌드 실패 `"@layer base" not found` 또는 `bare :root/:host (leak)` | Tailwind 출력 구조 변화/스코핑 누락을 빌드 가드가 막은 것 — 메시지 따라 plugin/build 점검   | **theme 변수·토큰 스코프 정책**       |
| 명령형 모달 `container={null}` 이 기대와 다름                      | 명령형 `ModalContainer`는 `null`→body, 선언형 오버레이는 `null`→미렌더(서로 다름)           | **AfdsScope 와 오버레이 포털**        |
| 커스텀 스코프 셀렉터(`.afds` 아님)를 쓰고 싶음                     | `@turbo-project/afds/postcss` 의 `scopeAfdsPreflight({ scope })`                            | **커스텀 스코프**                     |

---

## 빠른 시작 (zero-config, 권장)

전역 스타일 대신 **스코프된 스타일**을 한 줄로 import 하고, AFDS UI를 `<AfdsScope>`로 감싼다.

```ts
// Before — preflight 가 전역으로 번져 호스트가 깨짐
import '@turbo-project/afds/styles'

// After — preflight 가 .afds 안에서만 적용됨
import '@turbo-project/afds/styles/scoped'
```

```tsx
import { AfdsScope } from '@turbo-project/afds/scope'
import { Drawer, Modal } from '@turbo-project/afds/bricks'

function ChatPanel() {
  return (
    <AfdsScope>
      {/* 이 안의 AFDS 컴포넌트는 .afds 스코프 스타일을 받는다 */}
      <Drawer.Root open={open} onOpenChange={setOpen}>
        {/* 오버레이도 AfdsScope 안의 포털 타깃으로 렌더 → 스타일 유지 */}
        ...
      </Drawer.Root>
    </AfdsScope>
  )
}
```

`@turbo-project/afds/styles/scoped`는 `dist/styles/index.css`에서 **preflight(`@layer base`)와 theme 변수(`:root,:host`)를 `.afds`로 가둔** 사전 빌드 산출물이다. 유틸리티 class 셀렉터(`.text-sm` 등)는 전역으로 남지만, 참조하는 변수가 `.afds` 아래에만 있어 `.afds` 안에서만 적용된다(아래 **"theme 변수·토큰 스코프 정책"** 섹션 참고).

`<AfdsScope>`는 children을 `.afds` 루트로 감싸고 내부에 포털 타깃(`[data-afds-portal]`)을 심는다. 그 안의 오버레이는 자동으로 이 타깃으로 포털된다.

---

## `<AfdsScope>` 와 오버레이 포털

`<AfdsScope>` 하위의 오버레이는 `useAfdsPortalContainer()` 컨텍스트를 통해 자동으로 `.afds` 안에서 렌더된다. 컨테이너 해석 우선순위는:

```text
명시 container prop  >  <AfdsScope> 컨텍스트  >  document.body(기본)
```

- 오버레이에 `container`로 element/ref를 직접 넘기면 그 값이 최우선이다.
- `container`를 **생략**하면 `<AfdsScope>` 컨텍스트(있으면) → `document.body` 순으로 해석된다.
- `container={null}`의 의미는 하위 포털 구현을 따른다:
  - **명령형 `ModalContainer`**: `null` → `document.body`(스코프 opt-out).
  - **선언형 오버레이(base-ui)**: `null` → base-ui 규칙상 **포털 노드 없음(미렌더)** — "body opt-out"이 아니다. 스코프 안에서 body로 빼려면 `container={document.body}`처럼 element를 명시한다.

오버레이별 `container` 표면:

| 오버레이       | container 전달 방법                  | 비고                                            |
| -------------- | ------------------------------------ | ----------------------------------------------- |
| Drawer         | `<Drawer.Root container={...}>`      | Portal 미노출이라 Root prop이 유일 경로 ([#82]) |
| Modal (선언형) | `<Modal.Portal container={...}>`     |                                                 |
| Modal (명령형) | `<ModalContainer container={...} />` | 아래 한계 참고                                  |
| Popover        | `<Popover.Content container={...}>`  | 내부 Portal로 forward ([#85])                   |
| Tooltip        | `<Tooltip.Portal container={...}>`   |                                                 |

대부분은 `container`를 직접 넘길 필요 없이 `<AfdsScope>`로 감싸기만 하면 된다. 수동으로 넘기려면 훅을 쓴다:

```tsx
import { useAfdsPortalContainer } from '@turbo-project/afds/hooks'

const container = useAfdsPortalContainer() // HTMLElement | null
<Modal.Portal container={container}>...</Modal.Portal>
```

### 명령형 Modal(`ModalContainer`)의 한계

명령형 모달은 전역 싱글톤 `ModalContainer` 하나가 렌더한다. 따라서 `<ModalContainer />`를 `<AfdsScope>` 하위에 두면 명령형 모달도 그 스코프 안에 렌더되지만, **스코프 지원은 `ModalContainer`가 렌더된 그 하나의 `<AfdsScope>`로 한정**된다. 한 페이지에 여러 `.afds` island가 있고 명령형 모달을 각각 스코프하고 싶다면 선언형 `Modal`을 쓴다.

---

## 커스텀 스코프 (`./postcss` 플러그인)

`.afds`가 아닌 다른 스코프 셀렉터를 쓰거나, 소비자 빌드 파이프라인에서 직접 스코핑하려면 PostCSS 플러그인을 쓴다.

```js
import { scopeAfdsPreflight } from '@turbo-project/afds/postcss'

// postcss 파이프라인
postcss([scopeAfdsPreflight({ scope: '.my-scope' })])
```

> **`postcss`는 이 서브패스(`@turbo-project/afds/postcss`)의 암묵적 peer 의존성이다.** 플러그인은 `postcss`를 런타임 import 하지 않지만(타입만 사용), 소비자 빌드에서 플러그인을 실행하려면 `postcss`가 필요하다. Tailwind/webpack을 쓰는 소비자는 이미 보유하고 있다.

플러그인은 `@layer base` 안의 규칙 셀렉터만 변환한다: 루트성(`html`/`:host`/`:root`/`body`) → `scope`, 그 외 → `scope <selector>`. `@theme`/유틸리티/`:root` 토큰 레이어는 건드리지 않는다.

### webpack 예시 (3갈래 .css 규칙)

소비자가 `styles/scoped`(사전 산출물) 대신 AFDS 번들 CSS를 직접 후처리할 때만 필요하다.

```js
{
  test: /\.css$/,
  oneOf: [
    // (a) 소비자가 .afds 안에서 직접 저작하는 Tailwind 엔트리
    { test: /tailwind\.afds\.css$/, use: [emit, 'css-loader', 'postcss-loader'] },
    // (b) AFDS 번들: preflight 만 .afds 로 스코프
    {
      include: /[\\/]@turbo-project[\\/]afds[\\/]/,
      use: [
        emit,
        'css-loader',
        {
          loader: 'postcss-loader',
          options: { postcssOptions: { config: false, plugins: [scopeAfdsPreflight()] } },
        },
      ],
    },
    // (c) host 의 일반 .css: 미적용
    { use: [emit, 'css-loader'] },
  ],
}
```

---

## theme 변수·토큰 스코프 정책 (`styles/scoped`)

`styles/scoped`는 preflight(`@layer base`)뿐 아니라 **theme 변수(`@layer theme`의 `:root,:host` + 토큰 `:root`)도 `.afds`로 스코프**한다.

- Tailwind v4는 `@theme`로 기본 theme 변수(`--spacing`/`--text-*`/`--radius-*`/`--color-*`/`--font-*` 등)를 `:root,:host`에 전역 선언한다. AFDS 컴포넌트가 이 중 다수(`.text-sm`→`--text-sm`, `.rounded-md`→`--radius-md` 등)를 실제로 쓰므로 **생성 자체를 막을 순 없다**(막으면 AFDS가 깨짐).
- 대신 scoped 산출물에서 그 선언을 `.afds`로 옮긴다. AFDS 유틸리티 class(전역)는 그대로 두되, 참조하는 변수가 `.afds` 아래에만 있어 **`.afds` 안에서만 해석**된다. AFDS 컴포넌트·오버레이는 항상 `<AfdsScope>`(`.afds`) 내부에 렌더되므로(오버레이는 `[data-afds-portal]`=`.afds` 자식) 정상 동작하고, **host `:root`에는 AFDS theme 변수가 새지 않는다**.
- `--afds-*` 토큰도 같은 이유로 `.afds`로 옮긴다(자체 충돌은 없지만 scoped 산출물의 bare `:root` 선언을 0으로 만들어 정책을 단순·일관화).
- 전역 entry(`@turbo-project/afds/styles` = `index.css`)는 **불변** — 단독 사용 시 기존처럼 `:root`에 전역 선언된다. 그래서 한 페이지에 전역 entry와 `styles/scoped`를 **동시 import 하면 안 된다**(전역이 scoped 격리를 무효화).

> ⚠️ scoped 모드 전제: AFDS 컴포넌트는 반드시 `<AfdsScope>` 안에 있어야 theme 변수가 해석된다(밖이면 미스타일).

---

## 보장 / 비보장 (Tailwind v4 host 포함)

이 도구가 직접 푸는 것은 **AFDS → host** 방향이다.

**보장 (AFDS → host):**

- AFDS preflight(`@layer base`)가 `.afds`로 스코프되어 host 전역 요소(`*`/`html`/`body`)를 리셋하지 않는다.
- AFDS theme 변수(Tailwind 기본 `--spacing`/`--text-*`/`--color-*` + `--afds-*`)가 host `:root`로 누수되지 않는다(scoped 산출물에 bare `:root`/`:host` 0건 — 빌드 가드로 강제). Tailwind v4 host의 동명 변수도 덮지 않는다.

**비보장 (host → AFDS, 잔여 리스크):**

- host의 전역 reset이 `.afds` 안으로 흘러드는 방향은 직접 풀지 않는다. 다만:
  - preflight: `.afds <selector>` descendant 스코프가 specificity를 한 단계 높여 host의 element-level 전역 reset(`*`, `html`)을 **대부분 덮는다**.
  - theme 변수: AFDS 변수가 `.afds`(host `:root`보다 가까운 조상)에 선언되므로, `.afds` 내부 요소는 host `:root` 동명 변수보다 **AFDS 값을 우선 해석**한다 → 일반적인 host `:root` 변수 유입도 상당 부분 차단된다.
- 위 두 가지는 **부수 효과이지 보장이 아니다.** host의 높은 specificity·`!important`·unlayered reset은 잔여 위험으로 남아 시각 확인이 필요하다.

### 유틸리티 class 이름 (Tailwind host 와 공존 시)

host 가 이미 Tailwind 를 쓰면 `.text-sm`/`.flex`/`.rounded-md` 같은 **유틸리티 class 가 두 스타일시트에 공존**한다. 그러나 Tailwind 유틸은 변수 기반(`.text-sm { font-size: var(--text-sm) }`)이라, **host 요소는 host 의 `:root` 값으로**, **`.afds` 안 요소는 `.afds` 값으로** 각자 해석된다 → 기본 설정이면 규칙이 동일해 사실상 무해(중복일 뿐).

- **잔여 리스크**: host 가 유틸리티를 변수가 아닌 **리터럴 값**으로 커스터마이즈했거나 `!important` 를 쓰고 로드 순서가 겹치면, AFDS 동명 유틸이 host 요소에 영향을 줄 수 있다.
- **에스컬레이션(필요해질 때)**: 유틸리티까지 `.afds` 안으로 가두려면 `@layer utilities` 셀렉터를 **`:where(.afds)` 로 스코프**한다. `:where` 는 명시도 0이라 AFDS 내부 override·`data-slot` 탈출구를 해치지 않는다(반면 `.afds` 단순 prefix 는 명시도를 올려 탈출구를 약화시키므로 쓰지 않는다). 단 반응형 유틸(`@layer utilities` 내부 `@media`)까지 처리 + 회귀 검증이 필요하므로 별도 작업이다. 현재는 변수 indirection 으로 대체로 무해해 **도입 보류**.

---

## 올바른 배치 — host 컴포넌트는 `.afds` 밖에 (안티패턴 주의)

`.afds` 격리는 **AFDS → host 단방향**이다. 그래서 `<AfdsScope>` 안에는 **AFDS 컴포넌트만** 둔다.
Ant Design 등 host 컴포넌트를 `.afds` 안에 **중첩하면**, AFDS preflight 의 descendant 셀렉터(`.afds *`,
`.afds button` 등)가 그 컴포넌트에도 적용되고 specificity(`.afds button` 0,1,1 > host class 0,1,0)로
host 클래스를 이겨 **배경·테두리·패딩·appearance 가 깨진다.**

```tsx
// ❌ host 컴포넌트를 .afds 안에 중첩 — AFDS preflight 에 오염됨
<AfdsScope>
  <MadDeButton />   {/* 배경/테두리/패딩/appearance 손실 */}
  <Chat />
</AfdsScope>

// ✅ host 는 .afds 밖(형제), AFDS(챗 등)만 .afds 안
<div className="host-layout">
  <MadDeButton />
  <AfdsScope>
    <Chat />
  </AfdsScope>
</div>
```

Storybook `AFDS / Scope / AfdsScope` 의 **Antipattern_HostInsideScope** 스토리가 이 차이(안=깨짐 / 밖=정상)를 시연한다.

---

## 관련

- GitHub: [#83] (스코프 격리 도구 1급 제공), [#82] (Drawer 포털 container), [#85] (Popover.Content 포털 container)

[#82]: #82
[#83]: #83
[#85]: #85
