# @turbo-project/agent-rules

팀 레포가 같이 쓰는 에이전트 지침입니다. `init`을 돌리면 아래 파일을 만들거나 고칩니다.

## 만드는 파일

| 파일 | 내용 |
| --- | --- |
| `AGENTS.md` | 없을 때만 만듭니다. 빈칸이 있는 견본입니다 |
| `.agents/rules/common/*.md` | 공통 규칙 파일입니다. `react`면 `fsd`, `next`면 `nextjs`처럼 의존성으로 고릅니다. 돌릴 때마다 다시 쓰고, 버전에 없는 파일은 지웁니다 |
| `.claude/rules/agent-rules` | `.agents/rules/`를 가리키는 심볼릭 링크입니다. Claude Code가 규칙 파일의 `paths`에 맞는 파일을 다룰 때 그 규칙을 자동으로 읽습니다. 같은 이름이 다른 것으로 있으면 덮지 않고 알립니다 |

## 다른 파일에 더하거나 고치는 것

| 파일 | 하는 일 |
| --- | --- |
| `AGENTS.md` | 맨 위에 `<!-- BEGIN:agent-rules -->` 블록을 넣습니다. 다시 돌리면 블록 안만 새로 씁니다 |
| `package.json` | `agents:init`, `agents:check` 스크립트를 넣습니다 |
| `.prettierignore` | `AGENTS.md`, `.agents/rules/common/` 줄을 더합니다 |

블록과 `common/` 말고는 건드리지 않습니다. 레포 규칙은 `AGENTS.md`의 `# 레포 규칙`과 `.agents/rules/custom/`에 씁니다.

## 규칙이 읽히는 길

- `AGENTS.md`는 세션마다 읽힙니다. 언제 무엇을 할지(플랜을 쓸지, QA 시나리오를 쓸지)는 블록 본문에 둡니다. 판단을 링크 너머에 두지 않습니다.
- 블록의 공통 파일 목록은 "언제 읽는지"와 함께 링크합니다. 문구는 규칙 파일 frontmatter의 `when`에서 가져오고, 사본에서는 `when`을 뺍니다. 같은 이름의 `custom/` 파일은 함께 읽습니다.
- Claude Code는 `.claude/rules/agent-rules` 링크로 `paths`에 맞는 규칙을 자동으로 읽습니다. 다른 에이전트는 블록의 링크를 따라갑니다.
- `check`는 `AGENTS.md`의 `.agents/rules/` 링크가 가리키는 파일이 있는지도 봅니다. 견본의 `[예: …]` 줄은 보지 않습니다.

## 플랜

플랜은 Claude Code 플랜 모드로 쓰고 Claude Code 기본 위치(`~/.claude/plans/`)에 그대로 둡니다. 레포에 커밋하지 않습니다. 작업하던 세션에서는 대화에 플랜이 있고, 새 세션에서는 사용자가 준 경로나 티켓 키, 기능 이름으로 그 폴더를 찾습니다. 규칙은 `plan.md`의 `[PLAN-FIND]`에 있습니다.

## 사람이 돌릴 명령어

| 언제 | 명령어 |
| --- | --- |
| 처음 | `pnpm add -D -E @turbo-project/agent-rules` → `pnpm exec agent-rules init` |
| 버전을 올릴 때 | `package.json`의 `@turbo-project/agent-rules` 버전을 바꾸고 `pnpm i` → `pnpm agents:init` |
| 커밋하기 전 | `pnpm agents:check` |


## init 뒤에 채울 것

`init`이 만든 `AGENTS.md`는 빈칸(`[예: …]`)이 있는 견본입니다. 사람이 직접 채우거나 에이전트에게 시킵니다. 에이전트에게 시키면 레포를 조사해 채우고, 레포만 봐서는 알 수 없는 칸(큰 변경으로 보는 영역, 확인받을 작업, `main`으로 PR을 열 수 있는 브랜치)은 묻습니다.

| 섹션 | 채울 칸 |
| --- | --- |
| 맨 위 | 레포 이름, 한 줄 설명 |
| `## 이 레포` | 스택, 패키지 매니저와 Node, 설치, env, 요구사항 출처와 우선순위, 큰 변경으로 보는 영역, 위치 표. 있으면 로컬 실행에 필요한 외부 의존, 출처가 다른 레포에 있으면 읽는 법, 확인받을 작업 |
| `## 규칙 파일` | 있으면 `.agents/rules/custom/` 파일 링크 |
| `## 명령` | 검증 명령, 반복 확인, 파일 단위 테스트, 린트가 도는 곳, 앱 띄우기, 확인할 화면 폭. 있으면 대상 판별과 사전 빌드, react-doctor, PR에서만 도는 검사, 분기 화면을 바꿔 보는 법 |
| `## 브랜치와 배포` | 보호 브랜치·새 브랜치 이름·PR base, `main`으로 PR을 열 수 있는 브랜치, 커밋 scope 기준, 커밋 메시지 훅, 배포. 있으면 함께 깨지는 곳 |
| `## 예외` | 공통 규칙과 다르게 할 것. 없으면 "없다." |

기존 AGENTS.md나 CLAUDE.md가 있으면 그 안의 레포 지식을 위 칸이나 `.agents/rules/custom/`으로 옮깁니다. 해당 없는 "있으면" 칸은 줄을 지우고, 다 채우면 견본 주석도 지웁니다. `rg -n '\[(사람 · )?예:|\[선택\]' AGENTS.md`가 아무것도 찾지 않고 `pnpm agents:check`가 통과하면 끝입니다.
