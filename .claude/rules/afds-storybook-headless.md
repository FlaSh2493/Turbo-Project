---
paths:
  - 'packages/afds/src/headless/**/*.docs.mdx'
---

# AFDS Storybook — Headless 레이어

`src/headless/` 하위의 문서 파일에 적용되는 포맷 규칙이다.

헤드리스는 동작 예시 없이 **MDX docs 파일**로만 작성한다. `.stories.tsx` 파일을 만들지 않는다.

---

## 파일 규칙

- 파일명: `{name}.docs.mdx`
- 위치: `src/headless/{category}/{name}.docs.mdx`
- `.stories.tsx` 생성 금지

---

## 필수 구조 템플릿

```mdx
import { Meta } from '@storybook/blocks'

<Meta title="AFDS / Headless / {CategoryAndName}" />

# {HookName}

한 줄 설명.

**Import:**
\`\`\`tsx
import { hookName } from '@turbo-project/afds/headless'
\`\`\`

## 기본 사용법

\`\`\`tsx
// 최소 사용 예시
\`\`\`

## API

| 옵션/반환값 | 타입 | 설명 |
| ----------- | ---- | ---- |
| ...         | ...  | ...  |
```

description에는 아래 섹션이 반드시 포함되어야 한다:

1. **`**Import:**`** — import 경로 코드블록
2. **`## 기본 사용법`** — 최소 사용 예시
3. **`## API`** — 옵션·반환값 표

---

## title 네이밍 규칙

형식: `'AFDS / Headless / {CategoryAndName}'`

hook 이름 기준으로 작성한다. Category가 명확할 경우 생략 가능.
