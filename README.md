# Turbo Project — Agentic Front System

> Design System — AI 에이전트 친화적인 프론트엔드 디자인 시스템 모노레포

## 요구 환경

**Node 22 이상이 필요하다.** `.nvmrc` 가 선언된 하한(`engines.node: ">=22"`)과 같은 22 를 가리킨다 — nvm 사용자는:

```bash
nvm use          # .nvmrc 를 읽는다
```

`.npmrc` 의 `engine-strict=true` 때문에 **하한 미달이면 `pnpm` 이 설치·스크립트 실행을 거부한다.**
git 훅도 `pnpm` 을 호출하므로 커밋·push 가 막힌다:

```
ERR_PNPM_UNSUPPORTED_ENGINE  Unsupported environment
Expected version: >=22
Got: v20.20.0
```

**출력의 끝만 보면**(`tail`·`grep`·요약) `pre-commit` 훅 실패 메시지 만 남으므로
원인이 사라진다 — **로그를 처음부터 읽어라.**

## 📦 패키지 구조

```
turbo-project/
├── apps/
│   └── storybook/                 # 컴포넌트 문서 및 시각적 테스트 (스토리는 각 패키지에 colocate)
│
├── packages/
│   ├── afds/                      # @turbo-project/afds — Agent Friendly Design System
│   │   ├── src/
│   │   │   ├── bricks/            # 기초 컴포넌트 (action · display · feedback · form · layout · navigation · overlay · animation)
│   │   │   ├── headless/          # 상태 로직 훅
│   │   │   ├── hooks/ · lib/      # 공용 훅 · 유틸 (mergeProps · composeEventHandlers · Slot)
│   │   │   ├── scope/ · postcss/  # 다른 디자인시스템과 공존하기 위한 `.afds` 스코프 격리
│   │   │   └── schemas/           # Zod Props 스키마 (에이전트용)
│   │   ├── tokens/                # 디자인 토큰 (DTCG JSON → CSS)
│   │   └── scripts/               # 빌드 · manifest/llms.txt 생성 · 문서 인용 검증
│   │
│   ├── afds-registry/             # @turbo-project/afds-registry — 컴포지션 레지스트리 (shadcn 으로 소스 복사)
│   ├── figma-token-bridge/        # Figma Variables(DTCG) → CSS + TypeScript 토큰 변환
│   ├── figma-variables-exporter/  # Figma Variables 를 DTCG JSON 으로 내보내는 Figma 플러그인
│   │
│   └── config/
│       ├── eslint-config/         # @turbo-project/eslint-config
│       ├── prettier-config/       # @turbo-project/prettier-config
│       └── tsconfig/              # @turbo-project/tsconfig
│
└── registry.json                  # afds-registry 색인 (기계 생성)
```

## 🚀 빠른 시작

```bash
pnpm install
pnpm storybook
```

### 디자인 시스템 사용

```bash
pnpm add @turbo-project/afds react react-dom @base-ui/react tailwindcss lucide-react
```

```css
/* global.css */
@import 'tailwindcss';
@import 'tw-animate-css';

@source '../../node_modules/@turbo-project/afds/dist/**/*.js';

@import '@turbo-project/afds/tokens.css';
@import '@turbo-project/afds/tokens.semantic.css';
@import '@turbo-project/afds/tokens.custom.css';
@import '@turbo-project/afds/tokens.motion.css';
@import '@turbo-project/afds/tokens.effects.css';
```

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

자세한 내용은 [packages/afds/README.md](./packages/afds/README.md) 를 본다.

### 컴포지션 받기 (afds-registry)

컴포지션은 npm 으로 배포하지 않고 표준 `shadcn` CLI 로 소스를 복사해 소유한다.

```bash
npx shadcn@4.19.1 add FlaSh2493/turbo-project/date-picker#main
```

자세한 내용은 [packages/afds-registry/README.md](./packages/afds-registry/README.md) 를 본다.

## 🤖 AI 에이전트 지원

| 리소스          | 경로                                  | 용도                       |
| --------------- | ------------------------------------- | -------------------------- |
| **LLM 문서**    | `@turbo-project/afds/llms.txt`        | 진입점 문서 (빌드 시 생성) |
| **JSON 스키마** | `@turbo-project/afds/manifest.json`   | Props · 슬롯 · 메타데이터  |
| **Zod 스키마**  | `@turbo-project/afds/schemas`         | 런타임 Props 검증          |
| **작업 지침**   | [CLAUDE.md](./CLAUDE.md) · `.claude/` | 레이어 · 구조 · 토큰 규칙  |

## 🛠 개발 명령어

```bash
pnpm build                                    # 전체 빌드
pnpm storybook                                # Storybook 개발 서버
pnpm --filter @turbo-project/afds test        # afds 테스트
pnpm --filter @turbo-project/afds-registry test
pnpm check-types                              # 타입 체크
pnpm lint                                     # 린트
pnpm format                                   # 포맷팅
pnpm changeset                                # 변경 기록 (패키지 변경 시 필수 — pre-push 훅이 검사)
```

## 📄 라이선스

MIT License © FlaSh2493
