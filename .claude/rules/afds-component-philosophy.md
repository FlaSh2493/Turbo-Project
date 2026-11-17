---
paths:
  - 'packages/afds/src/**/*.{ts,tsx,md}'
  - 'packages/afds-registry/src/compositions/**/*.{ts,tsx,md}'
---

# AFDS 컴포넌트 설계 철학

AFDS 컴포넌트를 새로 만들거나 유지보수할 때 벗어나지 말아야 할
설계 원칙과 판단 기준을 정의한다.

---

## 기술 스택 및 피어 의존성

AFDS 컴포넌트는 **base-ui**와 **Tailwind CSS**를 기반으로 구축된다.

소비자(consumer) 프로젝트는 아래 패키지를 **직접 설치**해야 한다 — AFDS는 이를 번들에 포함하지 않는다.

| 패키지               | 역할                           | 버전 기준                                  |
| -------------------- | ------------------------------ | ------------------------------------------ |
| `react`, `react-dom` | UI 렌더링                      | AFDS 패키지의 `peerDependencies` 명시 버전 |
| `tailwindcss`        | 유틸리티 클래스 기반 스타일링  | AFDS 패키지의 `peerDependencies` 명시 버전 |
| `@base-ui/react`     | Headless Primitive 동작/접근성 | AFDS 패키지의 `peerDependencies` 명시 버전 |
| `lucide-react`       | 기본 아이콘                    | AFDS 패키지의 `peerDependencies` 명시 버전 |

**규칙:**

- 새 peerDependency 추가 시 `package.json`의 `peerDependencies` 항목과 이 문서를 **동시에 업데이트**한다
- 소비자가 요구 버전을 충족하지 못할 경우 경고가 표시되도록 `peerDependenciesMeta`를 함께 명시한다

---

## 핵심 아키텍처: 3-레이어 구조

```text
Headless layer      (src/headless/)
  └── 접근성 · 동작 · 상태만 담당, 스타일 없음

Bricks layer     (src/bricks/{category}/)
  └── Headless 또는 base-ui Primitive를 감싸고 CVA 스타일 적용

Composition layer   (별도 패키지 @turbo-project/afds-registry, src/compositions/)
  └── 여러 Component를 조합한 도메인 단위 (npm entry가 아니라 표준 `shadcn add` 로 소비자 코드베이스에 복사-소유됨)
```

> 용어 — "Primitive"는 base-ui 원형(`Primitive.X`)을 가리키는 용어로만 사용한다. AFDS 자체 레이어는 **Headless**로 부른다.

**규칙:**

- 컴포넌트는 Headless를 직접 구현하지 않고 **반드시 Headless 또는 base-ui Primitive를 조합**한다
- 새 컴포넌트 추가 전, 기존 Headless 재활용 가능 여부를 먼저 검토한다
- **의존 방향**: `headless ← bricks ← compositions` (역방향 import 금지)
- compositions는 이 패키지(afds)에 없다 — `packages/afds-registry/src/compositions/`에 있으며, 패키지 entry가 아니라 표준 `shadcn add FlaSh2493/turbo-project/<name>#<ref>` 로 소비자 코드베이스에 소스가 복사된다

---

## 레이어 선택 기준

신규 UI를 어느 레이어에 배치할지 판단 기준:

| 레이어           | 디렉토리                                                 | 책임                                      | 언제 만드는가                                                 |
| ---------------- | -------------------------------------------------------- | ----------------------------------------- | ------------------------------------------------------------- |
| **Headless**     | `src/headless/`                                          | 접근성·동작·상태만 (스타일 없음)          | base-ui로 부족한 동작 로직을 추출해 재사용하고 싶을 때        |
| **Bricks**       | `src/bricks/`                                            | Headless / base-ui를 감싼 시각화 컴포넌트 | 디자인 시스템 단위 컴포넌트 (Button, Badge, Input 등)         |
| **Compositions** | `packages/afds-registry/src/compositions/` (별도 패키지) | 여러 Component를 조합한 도메인 단위       | 동일 조합이 3곳 이상 반복되고, CLI 복사-소유 배포로 충분할 때 |

- compositions는 패키지 entry로 배포되지 않는다 — 표준 `shadcn add` 로 소비자 코드베이스에 소스를 복사한다. 승인 정본은 제거됐다 — 게이트는 PR 리뷰와 CI(컴포지션 디렉터리 ↔ `registry.json` 이름 대조)다
- 같은 레이어 안에서도 횡단 의존을 최소화한다

---

## 합성(Compound) 컴포넌트 설계 — dot-notation

복수 sub-part로 구성되는 컴포넌트는 dot-notation으로 노출한다 (`Component.Root`, `Component.Item` 등). base-ui Primitive 합성을 그대로 외부에 드러내는 것이 기본이며, 소비자가 sub-part 단위로 조립·커스터마이즈한다.

**규칙:**

- 외부에 export되는 모든 sub-part는 독립된 컴포넌트로 취급한다 — 각자 `data-slot`, `forwardRef`, `className` 병합을 갖춘다
- sub-part의 props 표면은 base-ui Primitive props를 그대로 통과(`ComponentProps<typeof Primitive.X>`)하거나, AFDS 전용 prop(예: `variant`, `mode`)을 명시적으로 합성한다
- sub-part 각각이 **독립된 의미(semantics)**를 가져야 한다 — 단순 div 래퍼는 sub-part가 아닌 내부 구현
- `## 무엇을 컴포넌트로 만들 것인가` 기준은 sub-part에도 적용 — 단순 레이아웃 div는 노출하지 않는다
- sub-part 추가·제거·이름 변경 시 `.tsx` export를 갱신한다 (spec.md 갱신 디테일은 [afds-component-structure.md](./afds-component-structure.md) 참조)
- 자세한 합성 패턴(`render` · `Trigger` · `Indicator` 등)은 [afds-component-patterns.md](./afds-component-patterns.md) 참조

---

## 접근성 (Accessibility)

- 모든 인터랙티브 요소에 `aria-*` 속성 명시
  - `aria-busy` — loading 상태
  - `aria-disabled` — disabled 상태
  - `aria-label` — icon-only 요소에 필수
- `data-slot` 속성으로 내부 요소에 디버깅/테스트/스타일 타겟 식별자 부여 (일부 컴포넌트는 `data-variant`/`data-size`도 노출)
- 접근성을 후처리로 추가하지 않고 **초기 설계 단계부터 포함**한다

---

## Semantic HTML

- 의미에 맞는 HTML 요소 사용 (`<button>`, `<a>`, `<input>` 등)
- `as` prop 또는 `asChild` 패턴으로 폴리모픽 지원 — div로 모든 걸 대체하지 않는다

---

## 컴포넌트 자체가 Semantic 단위다

AFDS 컴포넌트는 단순 스타일 래퍼가 아니라 **의미(semantics)를 갖는 독립 단위**로 설계된다.

- 컴포넌트 이름 자체가 UI의 역할과 의도를 표현해야 한다 (`Button`, `Callout`, `Badge` 등)
- 내부 구현(HTML 태그, Headless/Primitive 조합)이 바뀌어도 **외부 인터페이스(props, semantics)는 안정적**으로 유지한다
- 소비자는 컴포넌트를 "어떻게 생겼는가"가 아닌 "무엇인가"로 선택한다
- 내부 구조 식별은 `data-slot`으로 한다 (컴포넌트 이름을 담는 `data-component` 속성은 현재 사용하지 않는다)

```tsx
// ✅ 의미 중심 사용
<Button variant="destructive">삭제</Button>

// ❌ 스타일 중심 사용 (컴포넌트를 만들지 않음)
<div className="bg-red-500 px-4 py-2 rounded">삭제</div>
```

---

## Props 설계 원칙

| 원칙                         | 좋은 예                 | 나쁜 예                   |
| ---------------------------- | ----------------------- | ------------------------- |
| boolean은 상태 표현          | `disabled`, `loading`   | `isDisabled`, `isLoading` |
| variant는 디자인 명세와 일치 | `variant="destructive"` | `variant="red"`           |
| className 항상 허용          | `className?: string`    | className 없음            |

> Zod는 컴포넌트 props 런타임 검증에 사용하지 않는다. `src/schemas/*.schema.ts`는 매니페스트(`dist/manifest.json`) 생성을 위한 빌드타임 메타데이터 정의 전용이다.

상세 명명 규칙: [prop-naming-conventions.md](../../packages/afds/docs/prop-naming-conventions.md)

---

## 스타일 커스터마이징 지원

AFDS 컴포넌트는 사전 정의된 `variant`/`size` prop으로 대부분의 디자인 요구를 충족해야 한다.
단, 부득이한 경우 소비자가 스타일을 덮어쓸 수 있는 **탈출구(escape hatch)** 를 반드시 제공한다.

### 제공 방법 (우선순위 순)

#### 1. `className` prop — 최우선 탈출구

모든 컴포넌트는 `className`을 최상위 DOM 요소에 병합한다.
내부 CVA 클래스보다 소비자 클래스가 나중에 오도록 `cn()` 순서를 유지한다.

```tsx
// ✅ 올바른 병합 순서
<button className={cn(buttonVariants({ variant, size }), className)} />
```

#### 2. `data-slot` 속성 — 내부 요소 CSS 타겟팅

복합 컴포넌트(여러 내부 요소를 가진)는 각 내부 요소에 `data-slot` 속성을 부여한다.
소비자는 CSS로 특정 슬롯만 선택해 스타일을 덮어쓸 수 있다.

```tsx
// 컴포넌트 내부
<div data-slot="root" className={...}>
  <span data-slot="icon" />
  <span data-slot="label">{children}</span>
</div>

// 소비자 CSS (Tailwind arbitrary variant 활용)
<Badge className="[&_[data-slot=icon]]:text-red-500" />
```

#### 3. `style` prop — 최후 수단, 제한적 허용

레이아웃 관련 동적 값(너비, 최대 높이 등 JS 계산 필요한 경우)에만 허용한다.
색상·타이포그래피 등 토큰으로 커버 가능한 값에는 절대 사용하지 않는다.

### 금지 사항

- `className`을 받지 않는 컴포넌트 — 소비자 커스터마이징 불가 상태로 배포 금지
- `!important` 또는 `style` prop으로 토큰 색상 강제 덮어쓰기
- 내부 구현 상세(특정 클래스명)에 의존하는 커스터마이징을 권장하는 문서 작성

---

## 스타일링 원칙

- **토큰 기반** — 임의 색상값 하드코딩 금지 (토큰 없으면 먼저 추가 요청)
- **인라인 style prop 금지** — 모든 스타일은 Tailwind 클래스로
- **반응형 고려** — 컴포넌트 자체는 너비 고정하지 않음, 부모가 제어
- **다크모드 미지원** — 배포 CSS 에 `.dark` 배선이 없고 파이프라인에 `dark` tier 도 없다. 다크 대응 요청을 받으면 구현하지 말고 미지원임을 알린다 (`packages/afds/README.md` §3.1)
- **세부 토큰 규칙** — [afds-component-tokens.md](./afds-component-tokens.md) 참조

---

## 무엇을 컴포넌트로 만들 것인가

**컴포넌트로 만들 때:**

- 동일 UI 패턴이 3곳 이상에서 반복될 때
- 접근성 처리가 비자명할 때 (복잡한 ARIA 패턴)
- variants/sizes 조합이 명확히 정의될 때

**컴포넌트로 만들지 말 것:**

- 단순 레이아웃 wrapper (CSS만으로 충분)
- 특정 페이지/도메인에만 쓰이는 일회성 UI

---

## 컴포넌트 유지보수 시 판단 기준

1. **Breaking change 최소화** — props 삭제보다 deprecated 처리 우선
2. **spec.md가 진실의 원천** — 코드보다 spec 먼저 수정, 코드가 spec을 따름
3. **variant 추가 ≠ 기능 추가** — variant는 시각적 표현 차이만, 동작 차이는 별도 prop
4. **토큰 변경 전파** — 토큰명이 바뀌면 `tokens.semantic.css` → `.style.ts` 순서로 추적
