---
paths:
  - 'packages/afds-registry/src/compositions/**'
---

# 컴포지션 파일 구조 규칙

`packages/afds-registry/src/compositions/{name}/` 의 구조. **bricks 와 다르다** —
`afds-component-structure.md` 를 컴포지션에 적용하지 마라.

## 실제 구조 (실측 `8798fed` · 23개)

```
{name}/
├── index.ts             # 23/23 — 배럴. 레지스트리·소비처 진입점이라 필수다
├── {name}.tsx           # 22/23
├── {name}.spec.md       # 22/23
├── {name}.stories.tsx   # 22/23
├── {name}.style.ts      #  4/23 — 선택이다. 아래 참조
└── __test__/            # 11/23 — 보유를 늘리는 중이다 (#162)
```

**`{name}.style.ts` 는 필수가 아니다.** 19/23 이 스타일을 `{name}.tsx` 안 `className`
문자열로 둔다. CVA 를 쓰는 것은 4개뿐이다(`radio-card` · `check-box-card` ·
`period-filter` · `popconfirm`). **bricks 는 35/39 가 `.style.ts` 를 갖는다** — 그 비율을
컴포지션에 요구하지 마라.

**예외 하나**: `base-table/` 은 디렉터리명이 아니라 `table.*` 로 파일을 짓는다
(`table.tsx` · `table.style.ts` · `table.spec.md` · `table.context.ts` · `table-utils.ts`).
한 컴포지션이 여러 컴포넌트를 담는 경우다 — 새로 만들 때 흉내 내지 말고, 고칠 때 이름을
바꾸지도 마라(레지스트리 `files[].target` 이 그 이름을 쓴다).

## spec.md

**맨 앞에 frontmatter 가 온다** — `domain`·`category` **둘 다 필수**(기본값 없음, 공통
컴포지션도 `domain: common` 을 적는다). 값은 `packages/afds-registry/taxonomy.json` 목록에서
고른다(`src/lib/taxonomy.ts` 의 `resolveSpecCategories` 가 생성 시점에 대조해 `registry.json` 의
`categories: [domain, category]` 를 만든다).

```markdown
---
domain: common
category: overlay
---
```

그 뒤 본문 **형식은 bricks 와 같다** — `afds-component-structure.md` 의 `spec.md` 절을 그대로
따른다(`# 이름` · `> 한 줄 요약` · `## Rules` · `## Examples`).

## import 표면

컴포지션은 **AFDS 서브패스**만 쓴다. 루트 배럴(`from '@turbo-project/afds'`)은 금지이고
`build-registry.ts` 가 생성 단계에서 막는다(치환 시 exit 1).

실측 분포: `@turbo-project/afds/bricks` 34 · `/lib/utils` 16 · `/headless` 7 · `/schemas` 1 ·
`/lib/compose-event-handlers` 1.

`cn()` 은 `@turbo-project/afds/lib/utils` 에서 가져온다 — afds 의 `src/lib` 경로가 아니다.

## 왜 이 파일이 따로 있나

`afds-component-structure.md` 는 「`packages/afds/src/bricks/{name}/` 아래 4파일 필수」로
쓰였고 그 문장은 컴포지션에 **거짓**이다(`.style.ts` 4/23). 한동안 그 문서의 `paths` 에
컴포지션이 들어 있어 **없는 파일을 만들라는 규칙이 로드되고 있었다.** 글롭은 규칙이
**닿는지**만 보장하고 **맞는지**는 보장하지 않는다 — 그 자리를 이 파일이 대신한다.
