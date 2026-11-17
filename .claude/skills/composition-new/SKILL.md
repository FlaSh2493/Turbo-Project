---
name: composition-new
description: Figma·레퍼런스 URL·캡처 이미지로 afds-registry 컴포지션을 새로 등록한다 — 환경 점검 · 파일 5종 생성 · 검사 · Storybook 확인 · PR. 디자이너용. Trigger on "/composition-new", "컴포지션 등록", "새 컴포지션".
---

# Composition New

디자이너가 레퍼런스(Figma 시안 · 레퍼런스 URL · 캡처 이미지)로 `packages/afds-registry/src/compositions/` 에 새 컴포지션을 등록하도록 돕는다.
**디자이너는 레퍼런스와 같은지만 판정한다.** 파일·검사·git·PR 은 이 스킬이 한다.

## 지켜야 할 것

- **새 컴포지션 하나만 만든다.** 기존 컴포지션·AFDS·`packages/afds-registry/src/compositions/index.ts` 는 건드리지 않는다.
- **PR 을 승인하거나 머지하지 않는다.** main 머지가 곧 배포다. 승인은 리뷰어(no1flash · gorillaKim)가 한다.
- **검사를 통과시키려고 하네스 파일을 고치지 않는다** — 래칫 기준 JSON(`packages/afds-registry/src/__tests__/*.baseline.json`) · `packages/afds-registry/taxonomy.json`(2단계의 분류 **추가** 외) · `.claude/rules/**` · oxlint/eslint/tsconfig/vitest 설정 · `.github/**` · `lefthook.yml` · `.claude/settings.json`. 그런 수정이 필요해 보이면 멈추고 「개발자에게 넘김」.
- **main 에 직접 push 하지 않는다.** push 는 3단계에서 만든 작업 브랜치에서만 한다(`git push -u origin HEAD`).
- **디자이너에게 개발 용어로 묻지 않는다.** 실패는 스킬이 고치고, 못 고치면 「개발자에게 넘김」(맨 아래)으로 끝낸다.
- 모든 명령은 **저장소 루트**에서 실행한다.

## 1. 환경 점검

먼저 디자이너 브라우저에 안내 페이지를 연다 — `open .claude/skills/composition-new/onboarding.html`(Linux 는 `xdg-open`). 「처음이면 이 안내를 먼저 훑어보세요 — 언제든 다시 열 수 있습니다」 라고 알리고 **기다리지 않고** 이어 간다. 페이지와 이 문서가 다르면 이 문서가 맞다 — 흐름을 바꾸면 `onboarding.html` 도 함께 고친다.

아래를 차례로 실행한다. 고칠 수 있는 것은 고치고, 못 고치는 것은 안내 문구를 보여 준 뒤 **멈춘다.**

| 확인          | 명령                                                       | 실패 시                                                                                                                                                                                                                                                                                                   |
| ------------- | ---------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Node 22 이상  | `node -v`                                                  | `ls ~/.nvm/versions/node` 에 `v22.*` 가 있으면(여럿이면 가장 높은 버전) **이후 모든 명령 앞에** `export PATH=~/.nvm/versions/node/<그 버전>/bin:$PATH &&` 를 붙인다(`nvm use` 는 셸 함수라 도구 호출 사이에 유지되지 않는다). 없으면 「Node 22 설치가 필요합니다 — 개발자에게 도움을 요청하세요」 로 멈춤 |
| pnpm          | `pnpm -v`                                                  | 실패하면 `corepack enable pnpm`(저장소 `package.json` 이 `packageManager: pnpm@10.24.0` 을 선언한다) 후 재확인한다. 그래도 실패하면 「pnpm 설치가 필요합니다 — 개발자에게 도움을 요청하세요」 로 멈춤                                                                                                     |
| GitHub CLI    | `gh --version`                                             | 없으면 「gh 설치가 필요합니다 — 개발자에게 도움을 요청하세요」 로 멈춤                                                                                                                                                                                                                                    |
| GitHub 로그인 | `gh auth status`                                           | 디자이너에게 `! gh auth login` 을 입력하도록 안내하고 멈춤                                                                                                                                                                                                                                                |
| Figma MCP     | 레퍼런스가 **Figma 링크일 때만** 필요 — 2단계에서 확인한다 | ToolSearch 로 Figma MCP 도구(`get_design_context` 등)를 먼저 찾아본다. 그래도 없으면 「Claude Code 에 Figma 연결이 필요합니다」 로 멈춤. 레퍼런스 URL·캡처 이미지면 없어도 진행                                                                                                                           |

**작업 트리가 깨끗해야 한다**(`git status --short` 출력이 비어 있음). 변경이 있으면 디자이너에게 보여 주고 **멈춘다** — 그대로 진행하면 그 변경이 새 브랜치로 섞여 들어간다.

**시작 브랜치 이름을 기록해 둔다**(`git branch --show-current`) — 「개발자에게 넘김」 에서 돌아갈 때 쓴다. 비어 있으면 detached HEAD 이므로 그때는 현재 커밋도 같이 적어 둔다(`git rev-parse HEAD`); 돌아갈 때 `git switch --detach <기록한 커밋>` 을 쓴다.

그다음 `git fetch origin main` 으로 최신 main 을 받아 둔다. 로컬 `main` 브랜치는 건드리지 않는다 — 3단계 뒤에서 `origin/main` 에서 바로 분기한다.

## 2. 입력 받기

한 번에 하나씩 묻는다.

1. **레퍼런스** — 셋 중 하나
   - Figma 노드 링크(`node-id=` 가 붙은 것이어야 한다 — 없으면 노드 링크를 다시 받는다)
   - 레퍼런스 URL(다른 서비스 화면 등)
   - 캡처 이미지(디자이너가 대화에 붙여 넣은 것)

   받은 **직후** Figma 링크인지 본다. **Figma 링크일 때만** 여기서 Figma MCP 연결을 확인한다(1단계 표 참고) — ToolSearch 로 찾아도 없으면 「Claude Code 에 Figma 연결이 필요합니다」 로 멈춘다. 레퍼런스 URL·캡처 이미지면 이 확인 없이 다음으로 넘어간다.

2. **이름** — 영어 소문자와 `-` 만(kebab-case). 예: `status-badge-card`. 스킬이 제안하고 디자이너가 확정한다
3. **도메인·기능** — 개발 용어 없이 두 질문을 순서대로 한다.
   - 「어느 서비스용인가요? 여러 서비스에서 같이 쓰면 공통(Common)」
   - 「어떤 종류인가요?」 — `packages/afds-registry/taxonomy.json` 의 `categories` 를 아래 쉬운 풀이로 보여주고 고르게 한다(이 풀이는 taxonomy.json 이 아니라 이 문서에만 있다):
     - `form` = 입력
     - `overlay` = 떠 있는 창
     - `display` = 보여주기
     - `navigation` = 이동
     - `layout` = 배치
     - `feedback` = 상태 알림

   고른 답은 **소문자 slug** 그대로 spec frontmatter 에 쓴다(`domain: common`, `category: overlay`).
   스토리 title 은 표시 이름을 쓴다 — `displayName()` 이 만드는 `Compositions / Common / Overlay / <Name>`(5단계 참고).

   둘 중 맞는 것이 없으면 디자이너와 새 kebab-case slug 를 정해 `taxonomy.json` 에 한 줄 추가한다 —
   새 서비스면 `domains`, 새 종류면 `categories` — PR 본문에 「새 분류 추가」 라고 적는다.
   `.claude/skills/composition-new/onboarding.html` 의 서비스 칩·종류 카드 목록에도 같이 추가한다.

4. **한 줄 설명** — 무엇을 하는 컴포넌트인가
5. **사용 규칙** — 언제 쓰고 언제 쓰지 않는가(1~3줄)

이름이 **최신 main 에 이미 있는지** 본다 — 로컬 트리는 오래됐을 수 있으므로 `origin/main` 을 직접 확인한다:

```bash
git cat-file -e "origin/main:packages/afds-registry/src/compositions/<name>" 2>/dev/null && echo 있음 || echo 없음
```

`있음` 이면 다른 이름을 받는다.

## 3. 중복 확인

`origin/main` 기준으로 본다(로컬 트리는 오래됐을 수 있다):

```bash
git show origin/main:registry.json
git ls-tree -r -d --name-only origin/main packages/afds/src/bricks | awk -F/ 'NF==6'
```

두 번째 명령의 출력은 `packages/afds/src/bricks/<카테고리>/<brick>` 경로다 — 마지막 부분이 brick 이름이다.

`items[].name`·`description` 과 bricks 이름 중 레퍼런스와 비슷한 것이 있으면 이름과 Storybook 위치(컴포지션은 `items[].categories` 로 만든 `Compositions / <Domain> / <Category> / <이름>`, brick 은 `AFDS / Bricks / …`)를 보여 주고 「이 기존 것을 쓰시겠어요, 아니면 새로 만들까요?」 라고 묻는다.
디자이너가 「기존 것을 쓰겠다」 고 하면 여기서 끝낸다 — 아직 브랜치를 만들지 않았으므로 지울 것도 없다.

계속하기로 하면 **최신 main 에서 작업 브랜치를 분기한다.** 이후 모든 파일은 이 브랜치에서 만든다.

분기 전에 같은 이름이 로컬뿐 아니라 **원격에도** 없는지 함께 본다 — 원격에만 있으면 분기 자체는 그냥 성공하고 나중에 push 에서야 어긋난다: `git ls-remote --exit-code --heads origin "$(gh api user --jq .login)/composition-<name>"`(exit 0 이면 원격에 이미 있다).

```bash
git switch -c "$(gh api user --jq .login)/composition-<name>" origin/main
```

로컬이든 원격이든 같은 이름이 이미 있으면(분기 자체가 실패하거나 위 원격 확인이 exit 0) `-2`, `-3` … 을 붙인 이름(`.../composition-<name>-2`)으로 바꿔 **원격 확인과 분기를 둘 다 다시** 한다 — 둘 다 통과하는 이름이 나올 때까지 반복한다.

**분기 직후 항상** 의존성과 AFDS 를 최신 main 기준으로 맞춘다(합쳐 약 20초) — 분기 전 로컬 상태로 두면 6단계 검사가 낡은 의존성·AFDS 로 돈다:

```bash
pnpm install --frozen-lockfile
pnpm --filter @turbo-project/afds build
```

둘 중 하나라도 실패하면 「개발자에게 넘김」 — 요약에 실패한 명령과 오류 출력을 적는다.

## 4. 시안 읽기

레퍼런스 종류별로 본다.

- **Figma 링크** — 먼저 Figma 가이드를 읽는다. Figma MCP 의 `get_design_context` 는 도구 설명에서 호출 전에 design-to-code 가이드를 읽으라고 요구한다. `figma-design-to-code` 스킬(목록에 `figma:figma-design-to-code` 로 보일 수 있다)이 있으면 그것을 로드하고, 없으면 MCP 리소스 `skill://figma/figma-design-to-code/SKILL.md` 를 읽는다. 둘 다 없으면 이 문단을 건너뛴다. 그다음 `get_design_context` 로 노드를 읽는다(스크린샷이 필요하면 `get_screenshot`).
- **레퍼런스 URL** — 브라우저 도구(Playwright 등)가 있으면 그 URL 을 열어 스크린샷을 찍어 본다. 브라우저 도구가 없으면 디자이너에게 캡처 이미지를 받아 아래 절차로 본다.
- **캡처 이미지** — 이미지를 직접 본다.

시안을 이루는 요소마다 쓸 AFDS 컴포넌트를 정한다 — `packages/afds/src/bricks/` 와 `headless/` 에서 찾는다.
**Figma 가 주는 코드를 그대로 쓰지 않는다.** 색·간격은 AFDS 토큰으로 옮긴다(`.claude/rules/afds-component-tokens.md`).
레퍼런스 URL·캡처 이미지에는 토큰 값이 없다 — 색·간격·모서리는 **가장 가까운 AFDS 토큰**으로 정한다.

AFDS 에 없는 기초 요소가 필요하면(새 버튼 모양 등) 「개발자에게 넘김」 으로 끝낸다 — 컴포지션은 AFDS 를 조합할 뿐 기초 요소를 만들지 않는다.

정한 매핑을 디자이너에게 한 표로 보여 준다. **레퍼런스와 정확히 같은 것이 AFDS·`lucide-react` 에 없어 가장 가까운 것으로 대체한 요소**(아이콘·색 등 — 레퍼런스 URL·캡처 이미지의 토큰 대체 포함)는 표에 「대체」 로 표시하고, 무엇을 무엇으로 바꿨는지 디자이너에게 따로 묻는다 — 「괜찮다」 를 받아야 넘어간다. 디자이너가 원래 것이 꼭 필요하다고 하면 「개발자에게 넘김」.

## 5. 파일 만들기

**먼저 읽는다:** `.claude/rules/afds-composition-structure.md` · `.claude/rules/afds-storybook-compositions.md` · `.claude/rules/afds-component-tokens.md` · `packages/afds-registry/docs/GUIDE.md` 「2. 파일 작성 규칙」. GUIDE 의 상대 경로 import 안내는 따르지 않는다 — 실제 컴포지션은 서브패스를 쓴다(아래 표).

**틀은 `packages/afds-registry/src/compositions/base-tooltip/` 이다.** 그 파일들의 구조를 본뜬다.
`<Name>` 은 이름의 PascalCase(`status-badge-card` → `StatusBadgeCard`).

| 파일                       | 내용                                                                                                                                                                                                                                                           |
| -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `<name>.tsx`               | 컴포넌트. 첫 줄 `'use client'`. AFDS 는 **서브패스**로(`@turbo-project/afds/bricks`, `cn` 은 `@turbo-project/afds/lib/utils`). 타입은 `import type`                                                                                                            |
| `index.ts`                 | `export { <Name> } from './<name>'` · `export type { <Name>Props } from './<name>'`                                                                                                                                                                            |
| `<name>.spec.md`           | 맨 앞 `---\ndomain: <도메인>\ncategory: <기능>\n---`(2단계에서 정한 값, 둘 다 필수) → `# <Name>` → 빈 줄 → `> <한 줄 설명>`(**이 인용이 없으면 생성이 실패한다**) → `## Rules`(디자이너의 사용 규칙) → `## Examples`(tsx 예시 1개). 실제로 있는 prop 만 적는다 |
| `<name>.stories.tsx`       | `title: 'Compositions / <Domain> / <Category> / <Name>'`(도메인·기능의 표시 이름). `Default` 스토리 필수. 시안의 상태(기본·비활성·긴 텍스트 등)마다 스토리 1개                                                                                                 |
| `__test__/<name>.test.tsx` | **필수.** vitest + Testing Library. 최소: 기본 렌더 1개 · 주요 prop 1개 · 상호작용이 있으면 그 동작 1개                                                                                                                                                        |

## 6. 검사

```bash
pnpm exec prettier --write packages/afds-registry/src/compositions/<name>
pnpm --filter @turbo-project/afds-registry generate:registry
pnpm --filter @turbo-project/afds-registry validate:registry
pnpm --filter @turbo-project/afds-registry test
pnpm --filter @turbo-project/afds-registry check-types
pnpm --filter @turbo-project/afds-registry lint
```

한 줄씩 차례로 실행하고, 실패한 줄에서 멈춘다.

전부 합쳐 약 30초다. 실패하면 **원인을 읽고 고친 뒤 처음부터 다시** 돌린다.
**같은 실패가 3번 반복되면** 「개발자에게 넘김」.

- `test`·`check-types` 가 수십 건 한꺼번에 실패하면 먼저 3단계 뒤의 AFDS 빌드가 됐는지 의심한다.
- 새 컴포지션과 무관한 파일에서 실패하면 고치지 말고 「개발자에게 넘김」.
- 토큰 래칫(`arbitrary-token-ratchet`)이 실패하면 해법은 **그 값을 AFDS 토큰으로 바꾸는 것뿐이다** — 기준 파일을 올리는 것은 개발자 몫이다. 맞는 토큰이 없으면 「개발자에게 넘김」.
- `test` 출력의 `::warning file=packages/afds-registry/src/compositions/<name>/…` 줄(Tailwind 기본 색·간격·모서리)은 실패가 아니어도 PR 전에 AFDS 토큰으로 바꾼다. 맞는 토큰이 없으면 무시하지 말고 PR 본문 「확인」 에 그 클래스와 이유를 적는다.

## 7. Storybook 확인

`pnpm storybook` 을 **백그라운드로** 띄우고 출력에 `Local:` 이 보일 때까지 기다린다. **그 줄에 나온 주소를 쓴다** — 포트가 6007 이 아닐 수 있다.
디자이너에게 URL 을 준다:

`<Local: 의 주소>/?path=/story/compositions-<도메인>-<기능>-<name 에서 - 를 뺀 것>--default`

(예: `status-badge-card`(도메인 common · 기능 overlay) → `compositions-common-overlay-statusbadgecard--default`)

디자이너에게 묻기 **전에 스킬이 먼저** 브라우저로 스토리를 열어 본다(Playwright 등 브라우저 도구가 있으면) — 레퍼런스(Figma 스크린샷·URL 스크린샷·캡처 이미지)와 나란히 비교한다. 콘솔 에러가 없는 것만으로는 부족하다 — 아이콘·글자·테두리가 **보이는지**, 색이 레퍼런스와 같은 계열인지 스크린샷으로 확인한다. 검사 5개가 통과해도 스타일이 빠질 수 있다(리허설에서 아이콘이 흰색으로 사라진 적이 있다).

「레퍼런스와 같은가요? 다른 곳이 있으면 알려 주세요」 라고 묻는다.
피드백을 받으면 고치고 **6단계부터 다시.** Storybook 은 재시작하지 않아도 반영된다.
디자이너가 OK 하면 Storybook 을 끈다 — 띄운 프로세스와 그 자식까지 끝내고, 포트가 비었는지 확인한다.

## 8. 제출

1. changeset 파일 `.changeset/composition-<name>.md`:

   ```markdown
   ---
   '@turbo-project/afds-registry': minor
   ---

   `<name>` 컴포지션을 추가한다 — <한 줄 설명>.
   ```

2. 임시 폴더를 만든다: `mktemp -d` 로 저장소 밖에 폴더 하나를 만들고 출력된 경로를 그대로 기억해 둔다(셸 변수가 아니라 리터럴 경로로 이후 명령에 쓴다) — 저장소 안에 두면 다음 실행의 깨끗한 트리 확인에서 멈춘다. 그 폴더에 커밋 메시지와 PR 본문을 **Write 도구로** 파일로 쓴다 — 셸 heredoc 을 쓰지 않는다(목록 안 들여쓰기 때문에 종료 줄을 못 찾는다).

   `<임시 폴더>/commit-msg.txt` (커밋 메시지):

   ```
   feat(afds-registry): <name> 컴포지션을 추가한다

   ## 변경 내용
   - <한 줄 설명>
   - 레퍼런스: <Figma 링크 | 레퍼런스 URL | 캡처 이미지>
   ```

   `<임시 폴더>/pr-body.md` (PR 본문):

   ```markdown
   ## 무엇

   `<name>` 컴포지션 추가 — <한 줄 설명>

   ## 레퍼런스

   <Figma 링크 | 레퍼런스 URL | 캡처 이미지 기반 — 이미지는 이 PR 댓글에 첨부>

   ## 확인

   - Storybook: `<스토리 id>`
   - 검사 5종 통과 · 디자이너 시안 판정 OK
   - 레퍼런스와 다르게 「대체」 한 것: <목록 또는 없음>
   - 남긴 Tailwind 기본 척도 경고: <클래스와 이유 또는 없음>
   ```

   캡처 이미지 기반이면 레퍼런스 자리에 「캡처 이미지 기반」 이라고만 적는다 — **이미지를 저장소에 커밋하지 않는다.**

3. 디자이너에게 **제출 전 한 번만** 확인받는다: 「이 내용으로 제출할까요?」 라고 물으며 커밋 메시지·PR 제목·본문 요약을 보여 준다.
4. 확인되면 커밋 → push → PR 생성을 이어서 한다. 커밋 대상은 새 컴포지션 디렉터리 · `registry.json` · changeset 파일 · 분류 변경이 있으면 `taxonomy.json`이다.

   ```bash
   git add packages/afds-registry/src/compositions/<name> registry.json .changeset/composition-<name>.md packages/afds-registry/taxonomy.json
   git commit -F <임시 폴더>/commit-msg.txt
   git push -u origin HEAD
   gh pr create --base main --reviewer no1flash,gorillaKim \
     --title "feat(afds-registry): <name> 컴포지션을 추가한다" --body-file <임시 폴더>/pr-body.md
   ```

   커밋 훅은 바뀐 파일만 검사해 몇 초면 끝나고, push 훅(타입 검사·lint 래칫 등)이 약 30초 걸린다 — 멈춘 것이 아니다.

5. 디자이너에게 PR 링크를 준다. 캡처 이미지 기반이면 PR 을 연 뒤 「PR 댓글에 그 이미지를 붙여 주세요」 라고 안내한다. 「리뷰어가 승인하면 머지되고 곧바로 배포됩니다」 라고 알린다.
6. 다른 PR 과 `registry.json` 이 충돌하면 `generate:registry` 를 다시 돌려 커밋한다 — 개발자 몫이다.

## 개발자에게 넘김

막히면 여기로 온다. 그때까지 만든 것을 버리지 않는다. **`--no-verify` 는 이 절 안에서만 쓴다.**

**컴포지션 디렉터리에 아직 파일이 없을 때**: 커밋·push·PR 을 하지 않는다. 지금 브랜치가 작업 브랜치이고(`git branch --show-current` 가 `<login>/composition-<name>`) 커밋이 0개면(`test "$(git rev-list --count origin/main..HEAD)" -eq 0`) 1단계에서 기록해 둔 시작 브랜치로 돌아가(`git switch <기록한 시작 브랜치>`; 기록이 비어 있었으면 `git switch --detach <기록한 커밋>`) 작업 브랜치를 지운다(`git branch -D <작업 브랜치>`). 아직 분기 전이면 지울 것이 없다. 디자이너에게 **개발자에게 전달할 요약**을 준다: 레퍼런스(링크 또는 「캡처 이미지」) · 이름 · 막힌 단계와 이유.

**파일이 있을 때**(5단계 이후):

1. changeset 을 8단계 1처럼 만든다.
2. 임시 폴더를 만든다: `mktemp -d` 로 저장소 밖에 폴더 하나를 만들고 출력된 경로를 그대로 기억해 둔다(셸 변수가 아니라 리터럴 경로로 이후 명령에 쓴다). 그 폴더에 `commit-msg.txt` 를 **Write 도구로** 써 둔다 — 셸 heredoc 을 쓰지 않는다(목록 안 들여쓰기 때문에 종료 줄을 못 찾는다). 내용: `wip(afds-registry): <name> 컴포지션 — 개발자 확인 필요`
3. 커밋한다. 대상은 새 컴포지션 디렉터리 · `registry.json` · changeset 파일 · 분류 변경이 있으면 `taxonomy.json`이다. **`--no-verify` 는 이 경로에서만 허용되는 유일한 예외다** — 커밋 훅이 같은 실패로 커밋을 막고, 진짜 실패는 draft PR 의 CI 가 보여 준다.

   커밋 때 권한 확인 창이 뜨면 사용자에게 승인해 달라고 안내한다(`.claude/settings.json` 의 ask 규칙, 이 경로만의 예외).

   ```bash
   git add packages/afds-registry/src/compositions/<name> registry.json .changeset/composition-<name>.md packages/afds-registry/taxonomy.json
   git commit --no-verify -F <임시 폴더>/commit-msg.txt
   ```

4. push: `git push -u origin HEAD`
5. draft PR 을 연다 — 비대화형에서는 `--title`·`--body-file` 없이 부르면 `must provide --title and --body` 로 실패한다. 같은 임시 폴더에 `pr-body.md` 를 **Write 도구로** 써 둔다 — 첫 줄은 `막힌 곳: <단계> — <실패한 명령과 오류 요약>`, 그다음 `레퍼런스: <Figma 링크 | 레퍼런스 URL | 캡처 이미지 기반>` 줄.

   ```bash
   gh pr create --draft --base main --reviewer no1flash,gorillaKim --title "wip(afds-registry): <name> 컴포지션 — 개발자 확인 필요" --body-file <임시 폴더>/pr-body.md
   ```

6. 디자이너에게 「여기까지 올려 두었고 개발자가 이어 받습니다」 와 PR 링크를 준다.
