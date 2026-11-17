---
paths:
  - 'packages/afds/src/bricks/**'
---

# AFDS 컴포넌트 파일 구조 규칙

AFDS(`packages/afds/src/bricks/`) 내 컴포넌트를 생성하거나 유지보수할 때
지켜야 하는 파일 구조와 각 파일의 포맷 기준을 정의한다.

> **컴포지션에는 적용하지 마라** — `afds-composition-structure.md` 가 따로 있다.
> 아래 「4파일 필수」가 컴포지션에서는 거짓이다(`.style.ts` 를 가진 것이 4/23).
> 단 `spec.md` 절은 컴포지션도 그대로 따른다.

---

## 필수 파일 구조

`packages/afds/src/bricks/{component-name}/` 디렉토리 아래 5개 파일이 **필수**다.

```
{component}/
├── index.ts                 # 배럴 — 패키지 공개 표면의 한 고리다 (아래 이유)
├── {component}.tsx          # React 컴포넌트 (Props 인터페이스 + JSDoc 포함 — props의 source of truth)
├── {component}.style.ts     # CVA 스타일 정의 (variants/sizes의 source of truth)
├── {component}.spec.md      # 코드로 알 수 없는 사람의 의도만 (요약·Rules·Examples)
├── {component}.stories.tsx  # Storybook 스토리
└── __test__/                # 단위 테스트 (권장)
```

**`index.ts` 가 필수인 이유** — 전부 있어서가 아니라 **공개 표면이 그것을 통과하기** 때문이다:

```
src/index.ts        export * from './bricks'
bricks/{category}/index.ts   export * from './button'   ← 디렉터리를 가리킨다
bricks/{category}/{name}/index.ts   export { Button } from './button'
```

카테고리 배럴의 `export * from './{name}'` 은 **그 디렉터리의 `index.ts` 로 해소된다.** 없으면
그 고리가 끊겨 패키지 공개 표면에서 빠지고 `verify:exports` 가 막는다.

### 각 파일의 역할

| 파일           | 역할                                                                                                      |
| -------------- | --------------------------------------------------------------------------------------------------------- |
| `.tsx`         | 컴포넌트 로직 + `forwardRef` + `data-slot` + ARIA + **Props 인터페이스 JSDoc(필드 설명의 single source)** |
| `.style.ts`    | CVA variants/sizes/defaults 정의 — 스타일 + variants enum의 single source                                 |
| `.spec.md`     | 코드로 표현 못 하는 것만 — 한 줄 요약·런타임 제약·사용 예시                                               |
| `.stories.tsx` | variant/size/상태별 Storybook 스토리, `argTypes` 명세                                                     |
| `__test__/`    | 유닛 테스트 (필수는 아니나 강력 권장)                                                                     |

---

## 단일 source 규칙

정보가 어디에 사는지 결정한다 — 중복 금지.

| 정보                                      | Single source                             |
| ----------------------------------------- | ----------------------------------------- |
| 컴포넌트 한 줄 설명                       | `*.spec.md` H1 직후 blockquote            |
| 런타임 제약·조합 금지                     | `*.spec.md` `## Rules`                    |
| 의도된 사용 패턴                          | `*.spec.md` `## Examples`                 |
| 타입·default·required·enum 값             | `.tsx` Props 인터페이스 + `.style.ts` CVA |
| 필드별 사람용 설명 (각 enum 값 의미 포함) | `.tsx` Props 인터페이스 JSDoc             |
| DOM 구조·`data-slot`·`aria-*`             | `.tsx` 자체                               |
| 합성 sub-part 목록 (`Accordion.Root` 등)  | `.tsx` export                             |

원칙: **코드로 알 수 있으면 spec.md에 적지 않는다.**

---

## spec.md 포맷

모든 컴포넌트(단일·합성 무관) 동일 포맷. 아래 네 가지만 적는다.

````markdown
# {ComponentName}

> {컴포넌트 한 줄 요약 — manifest.summary 및 llms.txt 진입 설명으로 사용}

## Rules

1. {런타임 제약 1 — 부모 요소·조합 금지 등 타입 시스템 밖 조건}
2. {런타임 제약 2}

## Examples

```tsx
<{ComponentName} ... />
```
````

### 섹션별 기준

| 섹션                 |  필수 여부  | 설명                                                                                                                          |
| -------------------- | :---------: | ----------------------------------------------------------------------------------------------------------------------------- |
| H1 + blockquote 요약 |     ✅      | H1 직후 blockquote 한 줄. generator가 `summary`로 추출                                                                        |
| `## Rules`           | 있으면 필수 | 오용 방지·필수 조합·런타임 제약 — 숫자 목록. 제약이 없으면 섹션 통째로 생략                                                   |
| `## Examples`        |     ✅      | 의도된 사용 패턴 최소 1개. 공개 `data-slot` 커스터마이징도 여기서 보여줌. generator가 코드 펜스 블록을 `examples` 배열로 추출 |

### 적지 않는 것

`Import` / `Status` / `Props 표` / `Variants` / `Sizes` / `Slots` / `Events` / `ARIA` / `구성`(합성) / `Props` 링크 — 전부 코드가 source. spec.md에 표·목록·링크로 중복 기술하지 않는다.

이유: 에이전트는 **spec.md를 직접 읽지 않고 `dist/manifest/{name}.json`을 진입점**으로 읽는다. 코드 디테일이 필요하면 같은 폴더의 `.tsx`를 직접 본다.

---

## 합성(Compound) 컴포넌트

dot-notation sub-part(`Component.Root`, `Component.Item` …)는 `.tsx`의 export가 진실의 원천이다. 별도 `## 구성` 섹션을 spec.md에 두지 않는다. sub-part 합성 방식은 `## Examples`에서 자연스럽게 드러나도록 작성한다.

```tsx
// accordion.tsx
export const AccordionRoot = ...
export const AccordionItem = ...
export const Accordion = { Root: AccordionRoot, Item: AccordionItem, ... }
```

---

## CVA 스타일 패턴

모든 컴포넌트 스타일은 `class-variance-authority`의 `cva`를 통해 관리한다.

```ts
import { cva } from 'class-variance-authority'

export const componentVariants = cva(
  [
    /* base classes */
  ],
  {
    variants: {
      variant: {
        /* ... */
      },
      size: {
        /* ... */
      },
    },
    defaultVariants: { variant: 'default', size: 'md' },
  },
)
```

**금지 사항:**

- 인라인 `style` prop 사용 금지 — 모든 스타일은 Tailwind 클래스로
- `cva` 외부 조건부 클래스는 `cn()`(`src/lib` — `cn`은 `lib/utils`, `slot`/`mergeRefs`는 `lib/slot`)으로만 병합하며, 완성된 클래스 문자열만 넘긴다

---

## Props 타입 JSDoc 규칙

`.tsx` 컴포넌트의 Props 타입(`interface` 또는 `type`)의 **모든 필드에 JSDoc 주석을 반드시 작성**한다. 이 JSDoc이 **필드 설명의 single source** — IDE hover, 코드 리뷰, Storybook autodocs(`argTypes` description)가 모두 이 한 곳을 읽는다.

```tsx
export interface SpinnerProps {
  /**
   * 스피너 크기
   * @default 'sm'
   */
  size?: 'xs' | 'sm' | 'md' | 'lg'

  /**
   * 전체화면 오버레이 모드
   * - `container`: 부모 요소 기준 absolute (부모에 `position: relative` 필요)
   * - `viewport`: 화면 전체 fixed
   * @default 'container'
   */
  fullscreen?: 'container' | 'viewport'

  /**
   * 클릭 시 호출되는 핸들러
   */
  onClick?: (e: MouseEvent) => void
}
```

**작성 기준:**

- 각 필드 위에 `/** ... */` 블록을 둔다. `//` 라인 주석은 금지.
- 기본값이 있으면 `@default` 태그로 명시한다.
- deprecated 필드는 `@deprecated {대체 안내}` 로 표기한다.
- **enum 타입의 각 값 의미는 같은 JSDoc 본문에 `- \`value\`: 설명` 형태로 포함**한다. (별도 Variants 표를 spec.md에 만들지 않는다.)
- 사용자가 읽을 한국어 설명으로 작성한다.

---

## Manifest 산출물

`pnpm --filter afds generate:manifest` 실행 시 컴포넌트별 `dist/manifest/{name}.json`이 생성된다. 에이전트는 이 파일을 진입점으로 읽는다.

각 manifest는 5개 필드만 가진다:

| 필드       | source                               |
| ---------- | ------------------------------------ |
| `name`     | 컴포넌트 폴더명                      |
| `summary`  | spec.md H1 직후 blockquote           |
| `rules`    | spec.md `## Rules` 숫자 목록         |
| `examples` | spec.md `## Examples` 코드 펜스 블록 |
| `slots`    | `.tsx`의 `data-slot="..."` 속성 값   |

**Props·variants·sizes·defaults·parts는 manifest에 포함되지 않는다.** 에이전트가 prop 상세를 알아야 할 때는 같은 폴더의 `.tsx` Props 인터페이스 + JSDoc을 읽는다.

이유:

- props·variants·defaults는 examples에서 자연 노출됨 (`<Spinner size="md" fullscreen="container" />`)
- 타입·enum의 source는 `.tsx` + `.style.ts` 코드 자체
- manifest 중복 기재는 동기화 부담만 만들고 토큰 낭비

---

## 새 컴포넌트 추가 체크리스트

- [ ] 기존 Headless 재사용 가능한지 검토 (`src/headless/`)
- [ ] 4개 필수 파일 생성 + `index.ts` export
- [ ] 모든 variants/sizes에 Storybook 스토리 존재
- [ ] 접근성(ARIA) 속성 명시
- [ ] 사용된 모든 색상이 토큰 기반인지 확인 (`afds-component-tokens.md` 참조)
- [ ] Tailwind 기본 팔레트(`text-red-500`, `p-4`, `rounded-lg` 등) 사용 없음
- [ ] `style` prop에 색상·간격·radius 값 없음 (JS 계산 레이아웃 값만 허용)
- [ ] 동적 색상/간격/radius prop은 CVA `variants`/`compoundVariants`에 완성된 클래스로 매핑 (런타임 문자열 조립 헬퍼 없음)
- [ ] 동적 토큰 조합 시 템플릿 리터럴 직접 사용 없음 (`` `text-afds-${color}` `` 패턴 금지)
- [ ] Props 타입의 **모든 필드에 JSDoc 작성** — 기본값은 `@default`, enum 각 값 의미는 본문에 포함
- [ ] `spec.md` 작성: 요약 blockquote · Rules · Examples (세 가지만)
- [ ] `pnpm --filter afds generate:manifest` 실행 — `dist/manifest/{name}.json` 정상 생성 확인

## 기존 컴포넌트 수정 시

- variant 추가 → `.style.ts` CVA · `.tsx` Props 타입(`type` enum 값 추가) · `.tsx` JSDoc(새 값 의미 추가) · `stories.tsx` 동시 업데이트
- 토큰명 변경 → `.style.ts` 전체 검토 (토큰 클래스 기준: `afds-component-tokens.md` 참조)
- props 추가/제거 → `.tsx` Props 인터페이스 + JSDoc 수정, 필요 시 `spec.md` Rules·Examples 갱신
- sub-part 추가/제거 → `.tsx` export 수정, `spec.md` Examples 동기화
- `__test__/` 디렉토리가 존재하면 변경 사항에 맞게 **테스트 파일도 반드시 동시 업데이트**한다
