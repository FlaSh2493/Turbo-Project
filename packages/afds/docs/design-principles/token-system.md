# Token System Principles

AFDS 의 모든 스타일 값은 토큰을 통해 참조한다. 하드코딩(`#hex`, `12px`)은 금지다.

이 문서는 **구현된 것만** 기술한다. 계획 단계의 구조는 [`docs/token-improvement-plan.md`](../token-improvement-plan.md) 에 있다.

---

## 1. 토큰 계층 (구현 기준)

```text
tokens/json/*.tokens.json                     ← 편집 대상 (단일 진실의 원천)
        │  pnpm --filter afds generate:tokens  (figma-token-bridge / Style Dictionary v5)
        ▼
:root  { --afds-color-brand-500: #556af9; }         ← 원시 CSS 변수
@theme { --color-afds-bg-brand: var(--afds-color-bg-brand); }  ← Tailwind 유틸 생성
        ▼
컴포넌트: className="bg-afds-bg-brand text-afds-text-primary"
```

**Primitive → Semantic 2계층**이다. 여기에 유틸리티를 공급하는 부가 레이어(custom·effects·motion)가 붙는다.

| 레이어    | 파일                  | 파이프라인 tier | 내용                                                                 |
| --------- | --------------------- | --------------- | -------------------------------------------------------------------- |
| Primitive | `tokens.css`          | `primitive`     | 팔레트·spacing·radius·typography 원시값 + `@theme`                   |
| Semantic  | `tokens.semantic.css` | `semantic`      | 역할 기반 별칭(`bg`·`text`·`border`·`icon`·`divider`·`interaction`)  |
| Custom    | `tokens.custom.css`   | `custom`        | shadow·duration 변수 + typography 유틸(`heading1` 등)                |
| Effects   | `tokens.effects.css`  | `effects`       | AI 그라디언트 유틸 3종                                               |
| Motion    | `tokens.motion.css`   | — (수동 관리)   | `@keyframes` (shimmer · progress-shimmer · spinner-dash · breathing) |

tier 정의는 `token-bridge.config.ts` 에 있다. `motion` 은 tier 가 아니라 직접 편집하는 파일이다.

> **컴포넌트 토큰(Tier 3, `--cmp-*`) 은 구현되지 않았다.** 코드·토큰 어디에도 존재하지 않으므로
> 규범으로 삼지 말 것. 도입 검토는 `docs/token-improvement-plan.md` 를 참조한다.

---

## 2. 네이밍 — CSS 변수 ≠ Tailwind 클래스

두 이름은 다르다. 이것이 가장 흔한 혼동 지점이다.

- **원시 변수**: `--afds-{카테고리}-{이름}` — `:root` 에 선언. `var()` 로 직접 참조할 때 쓴다.
- **`@theme` 변수**: `--{Tailwind 네임스페이스}-afds-{이름}` — 유틸리티 클래스를 만든다.
- **클래스**: `@theme` 변수명에서 네임스페이스 접두사를 뗀 뒤 Tailwind 유틸 접두사를 붙인다.

### 검증된 매핑

아래는 `src/styles/index.css` 를 Tailwind v4.1.18 로 컴파일해 산출물에 존재함을 확인한 것이다.

| `@theme` 변수                            | 클래스                                    | 비고                         |
| ---------------------------------------- | ----------------------------------------- | ---------------------------- |
| `--color-afds-bg-surface`                | `bg-afds-bg-surface`                      |                              |
| `--color-afds-text-primary`              | `text-afds-text-primary`                  |                              |
| `--color-afds-border-default`            | `border-afds-border-default`              |                              |
| `--color-afds-border-focus`              | `ring-afds-border-focus`                  | 포커스 링                    |
| `--color-afds-icon-brand`                | `fill-afds-icon-brand`                    | SVG — `stroke-*` 도 동일     |
| `--color-afds-interaction-hover-overlay` | `bg-afds-interaction-hover-overlay`       |                              |
| `--color-afds-brand-500`                 | `bg-afds-brand-500`                       | Primitive 팔레트 — 사용 지양 |
| `--spacing-afds-spacing-8`               | `p-afds-spacing-8` · `gap-afds-spacing-8` | `px-`·`py-`·`m-` 등 동일     |
| `--radius-afds-md`                       | `rounded-afds-md`                         |                              |
| `--text-afds-s-16`                       | `text-afds-s-16`                          | font-size                    |
| `--leading-afds-h-24`                    | `leading-afds-h-24`                       | line-height                  |
| `--font-weight-afds-bold`                | `font-afds-bold`                          | `-medium` 도 존재            |
| `--shadow-afds-1`                        | `shadow-afds-1`                           | `-2` 도 존재                 |

`@utility` 로 직접 정의된 클래스는 이름 그대로 쓴다 — `heading0`~`heading2` · `title1`~`title4` ·
`body1`~`body3` · `caption1`~`caption2` (custom), `text-gradient-ai` · `bg-gradient-ai` ·
`border-gradient-ai` (effects).

### 유틸리티가 생성되지 않는 변수

`@theme` 에 있어도 Tailwind 네임스페이스가 아니면 클래스가 만들어지지 않는다. **`var()` 로 참조한다.**

| 변수                        | 클래스 없음                       | 사용법                                      |
| --------------------------- | --------------------------------- | ------------------------------------------- |
| `--font-family-afds-base`   | `font-afds-base` 는 생성되지 않음 | `font-family: var(--font-family-afds-base)` |
| `--animation-100` ~ `-5000` | duration 유틸 없음                | `transition-duration: var(--animation-200)` |

---

## 3. 실제 스케일

- **Spacing** — 4 · 8 · 10 · 14 · 20 · 24 · 30 · 34 · 40 · 44 · 50 · 60 (px). 이름이 곧 px 값이다.
  연속 스케일이 아니므로 임의의 값(`p-afds-spacing-12`)은 존재하지 않는다.
- **Radius** — `sm` 5px · `md` 10px · `lg` 20px · `pill` 999px.
- **Font size** — `s-10` · `s-12` · `s-14` · `s-16` · `s-18` · `s-20` · `s-24` · `s-36`.
- **Line height** — `h-12` · `h-16` · `h-24` · `h-26` · `h-28` · `h-36` · `h-52`.
- **Font weight** — `medium` · `bold`.

최신 목록은 항상 `tokens/tokens.css` 의 `@theme` 블록을 직접 읽어 확인한다.

---

## 4. 사용 가이드라인

1. **하드코딩 금지** — `color: #556af9` 대신 `bg-afds-bg-brand`.
   Tailwind 기본 팔레트(`text-red-500`)와 arbitrary value(`p-[12px]`)도 금지다.
2. **Semantic 우선** — 컴포넌트는 역할 토큰을 쓴다.
   `bg-afds-bg-surface` ⭕ / `bg-afds-gray-100` ❌ (팔레트 직접 참조)
3. **의미에 맞게** — 파란색이라고 `brand-500` 을 쓰지 말고, 에러면 `text-afds-text-error` 계열을 쓴다.
4. **클래스는 리터럴로** — Tailwind JIT 는 텍스트 추출만 하므로 `` `p-afds-spacing-${n}` `` 은
   CSS 가 생성되지 않는다. 매핑 객체·CVA·조건 분기를 쓴다(README §3.4).
5. **토큰에 없는 값** — 임의로 하드코딩하지 않고 확인 후 JSON 소스에 추가하고 재생성한다.

세부 규칙과 금지 패턴은 `.claude/rules/afds-component-tokens.md` 에 있다.

---

## 5. 외부 프로젝트 커스터마이징

Primitive 원시 변수를 재정의하면 그것을 참조하는 Semantic 토큰에 자동 반영된다.

```css
/* 소비 프로젝트의 global.css */
@import '@turbo-project/afds/tokens.css';
@import '@turbo-project/afds/tokens.semantic.css';

:root {
  /* brand-500 을 참조하는 semantic 토큰에 전파된다 —
     bg-selected · bg-brand-subtle · border-brand-subtle · text-brand-subtle · icon-brand-subtle */
  --afds-color-brand-500: #7c3aed;

  /* bg-brand · text-brand · icon-brand 는 brand-700 을 참조하므로 별도로 바꿔야 한다 */
  --afds-color-brand-700: #4c1d95;
}
```

엔트리 선택(사전 컴파일 `styles` vs 토큰 원본 `tokens`)은 `README.md §1.2` 를 참조한다.

> 스코프를 좁히려면 `:root` 대신 임의 셀렉터에 선언한다 — `.my-section { --afds-color-brand-500: … }`.

---

## 6. 다크 모드

**지원하지 않는다.** 배포되는 CSS 에 `.dark` 셀렉터나 `@custom-variant dark` 배선이 없고,
파이프라인에 `dark` tier 가 없으며 `figma-export.json` 의 `$themes` 는 빈 배열이다.
지원 계획도 없다(2026-08-27 확인). 상세는 `README.md §3.1`.
