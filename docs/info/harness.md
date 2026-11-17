# 하네스 — afds · afds-registry · CI

**누가(FE 개발자·PD) Claude 로 개발해도 설계 방향을 벗어나는 코드를 기계가 막는다 — 개선은 이 기준으로 줄 세운다.**

## 검사 → 파일 위치

| 검사                                            | 무엇을 막나                                                                                                                                                         | 파일                                                                                                                                   | CI 잡                                                    |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| 게이트 종합(fail-closed)                        | 부분 성공을 통과로 세지 않기 · 판정 불가 시 미통과                                                                                                                  | `.github/scripts/ci-gate.sh`                                                                                                           | `gate` (`ci.yml`)                                        |
| 경로 관련성 판정(fail-closed)                   | 관련 있는 변경을 조용히 건너뛰기                                                                                                                                    | `.github/scripts/ci-detect-changes.sh`                                                                                                 | `changes` (`ci.yml`)                                     |
| CI 스크립트 자체 회귀(셸 스위트 9개)            | 판정 스크립트가 조용히 틀려지는 것                                                                                                                                  | `.github/scripts/__tests__/*.test.sh`                                                                                                  | `scripts-test` (`ci.yml`)                                |
| 포맷(로컬 전용)                                 | 서식 불일치 — **CI 에서는 안 본다**(사용자 결정 2026-10-28, 훅이 고친다)                                                                                            | `lefthook.yml`(pre-commit `prettier --write` + `stage_fixed`)                                                                          | 없음(로컬 훅)                                            |
| knip(미사용 파일·export·의존성)                 | 새 미사용 지적·안 쓰는 ignoreDependencies — 한계는 §9                                                                                                               | `knip.json` · 루트 `package.json`(`knip`) · `lefthook.yml` 이 부르는 `oxlint` 는 `ignoreBinaries`                                      | `format` (`ci.yml`, Knip) + pre-push                     |
| 패키지 경계                                     | package.json 의 `@turbo-project/*` 의존이 허용 간선 밖(R3) · 소스의 패키지를 넘는 상대경로(R1) — R2·R4 는 pnpm 격리·`moduleResolution: bundler` 가 막아 두지 않았다 | `.github/scripts/check-package-boundaries.mjs`                                                                                         | `scripts-test` (경계 step) + pre-push                    |
| 비밀 스캔(gitleaks, always)                     | 새 비밀 커밋 — PR 이 들인 커밋만 본다                                                                                                                               | `.github/workflows/ci.yml`(`secret-scan` 잡 · 바이너리 sha256 고정)                                                                    | `secret-scan` (`ci.yml`)                                 |
| 문서 인용 축                                    | `docs/*`·`.claude/rules/*` 의 경로·줄인용이 소스와 어긋나는 것                                                                                                      | `packages/afds/scripts/verify-doc-citations.ts`                                                                                        | `format` (`ci.yml`, `--no-imports`)                      |
| 문서 import 진실성 축                           | 문서의 import 예시가 `dist` 표면과 어긋나는 것                                                                                                                      | 〃                                                                                                                                     | `afds-test` (`afds-test.yml`, Verify doc citations)      |
| afds 배포 표면 정합                             | 배포 tarball 진입점 도달 불가                                                                                                                                       | `packages/afds/scripts/verify-exports.ts`                                                                                              | `afds-test` (Build)                                      |
| afds 타입 게이트                                | `tsc --noEmit` 정합(내부 일관성)                                                                                                                                    | `packages/afds/tsconfig.json`                                                                                                          | `afds-test` (Type check)                                 |
| afds-registry 타입 게이트                       | 소비처 tsconfig 호환(`verbatimModuleSyntax`)                                                                                                                        | `packages/afds-registry/tsconfig.json`                                                                                                 | `afds-registry-test` (Type check)                        |
| afds oxlint+ESLint(경고는 래칫이 센다)          | 토큰·아키텍처 경계(대부분 oxlint, `no-restricted-syntax` 만 ESLint)                                                                                                 | `packages/afds/.oxlintrc.json` · `packages/afds/eslint.config.js`                                                                      | `afds-test` (Lint)                                       |
| afds-registry oxlint+ESLint(`--max-warnings 0`) | 토큰·아키텍처 경계(하드 게이트)                                                                                                                                     | `packages/afds-registry/.oxlintrc.json` · `packages/afds-registry/eslint.config.js`                                                    | `afds-registry-test` (Lint) + pre-commit                 |
| apps/storybook lint(`--max-warnings 0`)         | storybook 코드 위반 — **CI 에서는 안 본다**(pre-commit 으로 옮김, 사용자 결정 2026-10-28)                                                                           | `apps/storybook/package.json`(`lint`) · `lefthook.yml`                                                                                 | 없음(로컬 훅)                                            |
| Tailwind 임의 값 래칫                           | bricks·컴포지션의 임의 값(색·길이) 증가                                                                                                                             | `packages/afds-registry/src/lib/tailwind-arbitrary-values.ts` · `packages/afds-registry/src/__tests__/arbitrary-token-ratchet.test.ts` | `afds-registry-test` (Run tests)                         |
| afds lint 경고 래칫                             | afds oxlint·ESLint 경고(`파일::규칙`)의 증가·미반영 감소 — 오류는 0 이어야 한다                                                                                     | `packages/afds/scripts/lint-ratchet.ts` · `scripts/lib/lint-ratchet.ts` · `scripts/lint-ratchet.baseline.json`                         | `afds-test` (Lint)                                       |
| 타입 우회 래칫                                  | `as unknown as`·`as never`·`@ts-*`·`eslint-disable` 증가·미반영 감소                                                                                                | `packages/afds-registry/src/__tests__/type-bypass-ratchet.test.ts` · `type-bypass-ratchet.baseline.json`                               | `afds-registry-test` (Run tests)                         |
| Tailwind 기본 척도 경고(실패 없음)              | bricks·컴포지션의 기본 팔레트·spacing·radius 를 `::warning` 으로 알림                                                                                               | `packages/afds-registry/src/__tests__/default-scale-warnings.test.ts` · `default-scale-warnings.baseline.json`                         | `afds-registry-test` (Run tests)                         |
| registry.json ↔ compositions 정합               | 산출물 낡음                                                                                                                                                         | `packages/afds-registry`(`generate:registry`)                                                                                          | `afds-registry-test` (Registry ↔ compositions 정합 검증) |
| shadcn registry 규격                            | 생성기 자체가 규격 밖 출력                                                                                                                                          | 〃(`validate:registry`)                                                                                                                | `afds-registry-test` (레지스트리 규격 검사)              |
| 게이트 성격 vitest 이름 고정                    | 게이트 파일이 조용히 삭제되는 것                                                                                                                                    | `.github/scripts/__tests__/test-gates.test.sh`(`arbitrary-token-ratchet` · `lint-ratchet` 테스트도 이름으로 고정)                      | `scripts-test`                                           |
| 릴리스 등급·버전 정합                           | changeset 등급과 실제 버전 범프 불일치                                                                                                                              | `.github/scripts/changeset-grade.sh` · `.github/scripts/snapshot-versions.sh`                                                          | `release.yml`                                            |
| PR changeset 필수(원격)                         | 패키지 변경에 changeset 누락                                                                                                                                        | `.github/workflows/changeset-check.yml`(`pnpm changeset status`, 등급 판정 정본은 `.claude/rules/versioning.md`)                       | `changeset-check` (`changeset-check.yml`)                |
| push changeset 필수(로컬)                       | 〃                                                                                                                                                                  | `.github/scripts/check-changeset.sh`                                                                                                   | `lefthook.yml` pre-push(로컬 훅 — CI 잡 아님)            |
| main 직접 push 차단(로컬)                       | `main` 대상 push(삭제 포함) — changeset 검사보다 먼저                                                                                                               | `.github/scripts/block-main-push.sh`                                                                                                   | `lefthook.yml` pre-push(로컬 훅 — CI 잡 아님)            |
| Claude 권한 deny                                | Claude 가 `main` 대상 push(`+main` 포함) · `--force`/`-f` · `gh pr merge` 를 실행하는 것                                                                            | `.claude/settings.json`(`permissions.deny`)                                                                                            | Claude Code 권한(CI 잡 아님)                             |
| Claude 훅 우회 deny·ask(#258)                   | push `--no-verify`·`core.hooks`·`HUSKY=`·`LEFTHOOK=`·`LEFTHOOK_EXCLUDE=`·`lefthook uninstall` 는 deny, commit `--no-verify`·`-n` 은 ask                             | `.claude/settings.json`                                                                                                                | Claude Code 권한(CI 잡 아님)                             |
| CODEOWNERS                                      | 하네스 경로 변경 시 리뷰 자동 요청(ruleset 없어 강제 아님)                                                                                                          | `.github/CODEOWNERS`                                                                                                                   | GitHub 리뷰 요청(CI 잡 아님)                             |
| Chromatic UI 회귀                               | 시각 회귀(쿼터로 영구 pending)                                                                                                                                      | `chromatic.yml`                                                                                                                        | `UI Tests`(영구 pending)                                 |

**현재 `main` 필수 체크는 0개다**(ruleset 은 삭제·강제 push 금지만 강제한다) — 확인:
`gh api repos/FlaSh2493/turbo-project/branches/main/protection`(`404 Branch not protected`),
ruleset 은 `gh api repos/FlaSh2493/turbo-project/rules/branches/main`(`deletion`·`non_fast_forward`
둘뿐, 실측 2026-09-30).

**Claude 훅 우회 규칙은 [PR #258](#258) 로 적용돼 있다.** `deny` 는 push 의 `--no-verify`(2패턴)·`git -c`/`git config` 의 `core.hooks`·`*HUSKY=*`(husky 가 남은 옛 브랜치용)·`*LEFTHOOK=*`·`*LEFTHOOK_EXCLUDE=*`·`*lefthook uninstall*`, `ask` 는 commit 의 `--no-verify`·`-n`(앞붙임 포함 4패턴)이다. commit 쪽을 deny 가 아니라 ask 로 둔 것은 `composition-new` 디자이너 인계 경로 때문이다 — **대화형 세션에서는 사용자 승인을 받지만, 권한 확인을 건너뛰는 플래그로 띄운 세션에서는 막히지 않는다.** 글자 패턴이라 1차 방어일 뿐이고 실제 강제는 훅·CI 다 — 알려진 구멍은 #258 본문을 보라. 타입 우회 래칫은 bricks·컴포지션의 배포 코드(스토리·테스트 제외)만 `파일::종류` 로 센다.

**보호가 꺼져 있어 래칫 실패·CODEOWNERS 는 강제가 아니라 경고다** — 래칫 실패는 CI `gate` 를 빨갛게 할 뿐 머지를 막지 못하고, CODEOWNERS 는 리뷰를 요청만 한다. 서버 강제 절차는 §9 에 문서로만 둔다(적용은 보류).

이 저장소의 **기계 검사** 전체 목록과, 유지보수할 때 밟기 쉬운 함정을 정리한다.

## 훅 설치 · 훅/CI 분담

로컬 훅은 **lefthook 2.2.0**(`lefthook.yml`)이다. husky·lint-staged 는 걷어냈다(`.husky/`·`.lintstagedrc.json` 삭제).

### 훅 설치

`pnpm install` 의 `prepare` 가 `lefthook install` 을 돌린다. **husky 가 설치한 `core.hooksPath` 가 남아 있으면 lefthook 은 설치를 거절한다**(`prepare` 는 안내만 찍고 실패하지 않는다). 사람이 1회:

```bash
# 메인 클론(/Users/<user>/turbo-project)에서 — 이 설정은 모든 워크트리가 공유한다
git config --unset core.hooksPath
# 그 뒤 아무 워크트리에서
pnpm install
```

- **husky 가 남은 옛 브랜치에서 `pnpm install` 하면 `core.hooksPath` 가 다시 설정된다.** lefthook 은 그 설정이 있으면 설치를 거절하므로(2.2.0 `install` 이 rc=1) `pnpm install` 을 다시 돌리는 것만으로는 돌아오지 않는다. 옛 브랜치에서 돌아오면 **먼저** 메인 클론에서 위의 `git config --unset core.hooksPath` 를 다시 한 뒤 `pnpm install` 한다(사람 절차 — 에이전트는 deny).
- **설치 여부는 `prepare` 출력으로 알 수 없다** — 실패해도 안내만 찍고 성공한다. `pnpm exec lefthook version` 도 설치와 무관하다. 확인: `git config core.hooksPath` 가 아무것도 안 찍고, `grep -l lefthook "$(git rev-parse --git-common-dir)/hooks/pre-commit"` 이 파일을 찍으면 설치된 것이다(워크트리에서도 같다 — 훅은 공통 `.git/hooks` 에 있다. 임시 저장소 실측: 옛 설정이 있으면 파일이 안 생기고, 설정을 지우고 `install` 하면 생긴다).
- 에이전트는 이 절차를 실행하지 않는다(`.claude/settings.json` 이 `core.hooks` 변경을 deny). 설치 전에는 `pnpm exec lefthook run pre-commit` · `run pre-push` 로 훅을 수동 실행해 볼 수 있다(pre-push 는 stdin 으로 `refs/heads/x <sha> refs/heads/main <sha>` 를 흘려야 main 대상 판정이 된다).
- **pre-push 는 `run:` 잡이 아니라 `script:` 잡 하나(`.lefthook/pre-push/pre-push.sh`)다.** lefthook 2.2.0 은 `run:` 잡을 push 할 파일이 없으면 「no matching push files」로 건너뛴다 — 이미 push 한 브랜치(`HEAD == @{push}`)에서 `git push origin feat:main` 하면 가드 포함 전 잡이 skip 되고 rc=0 이 된다(독립 리뷰 실측). `script:` 잡은 건너뛰지 않는다. 잡에 `use_stdin: true` 가 필수다 — 빠지면 가드가 빈 입력을 받아 `main` 대상 push 도 조용히 통과한다(실측 2026-10-28). `pre-push-guard.test.sh` 가 배선과 행동을 단정한다.
- 훅 우회(`--no-verify`·`LEFTHOOK=0`·`LEFTHOOK_EXCLUDE`)는 Claude 에게 deny/ask 이지만 사람 터미널은 막지 못한다. **main 보호가 보류 중이라 훅을 건너뛰면 서버가 막지 못한다** — 그래서 판정이 걸린 검사는 CI 에도 남긴다.

### 훅/CI 분담

| 검사                                        | 훅                             | CI                                | 이유                                                       |
| ------------------------------------------- | ------------------------------ | --------------------------------- | ---------------------------------------------------------- |
| `gate`·`changes`                            | —                              | 유지                              | 판정 종합(fail-closed)                                     |
| changeset 필수                              | pre-push                       | 유지(`changeset-check`)           | 릴리스 계약                                                |
| 비밀 스캔(gitleaks)                         | pre-commit(설치돼 있으면)      | 유지(`secret-scan`)               | 훅은 건너뛸 수 있다                                        |
| build(+verify:exports)·vitest·registry 정합 | —                              | 유지                              | 빌드·계약·기준선 래칫                                      |
| `verify:docs`(+citations)·셸 스위트         | —                              | 유지                              | 문서↔코드 계약 · 판정 스크립트 회귀                        |
| afds lint 래칫                              | pre-push                       | 유지                              | 기준선 래칫                                                |
| knip·경계 검사                              | pre-push                       | 유지                              | 기준선·구조 계약                                           |
| check-types                                 | pre-push(pre-commit 에서 옮김) | 유지                              | d.ts 계약 — **훅만이면 건너뛰기 한 번에 main 에 들어간다** |
| afds-registry lint `--max-warnings 0`       | pre-commit                     | 유지                              | 기준 0 짜리 래칫                                           |
| storybook lint                              | pre-commit                     | **뺐다**                          | 3파일, 래칫 아님                                           |
| prettier 서식                               | pre-commit `--write`           | **뺐다**(`format:check` step)     | 서식 — 어긋나도 판정 영향 없음                             |
| react-doctor                                | 로컬 `pnpm doctor`             | **뺐다**(`react-doctor.yml` 삭제) | 판정 안 하는 자문 잡                                       |
| chromatic                                   | —                              | 현행 유지                         | 별건(쿼터)                                                 |

**`commit-msg` 훅은 두지 않는다**(사용자 결정 2026-10-28) — 최근 200커밋 중 7건이 `[docs] …`·`[#167] …` 형식이라 정규식 하나로 통과시킬 수 없다.

---

## 설계 원칙 두 개

**배선하지 않은 검증은 없는 검증이다.** 실제로 `verify-doc-citations.ts` 가 1,292줄 구현을 갖고도 호출처 0건이던 시기가 있었다. 검사를 만들면 CI 워크플로에 스텝으로 넣고, 그 스텝이 존재한다는 사실까지 `ci-structure` 가 고정한다.

**검사는 자기가 보호한다고 주장하는 것을 실제로 보호해야 한다.** 통과하는 검사가 아무것도 안 보는 경우가 이 저장소에서 반복해서 나왔다. 그래서 검사를 추가하면 **돌연변이를 심어 잡히는지** 확인하고, **어느 단정이 잡았는지**까지 본다. 대조군(정상 입력이 통과함)도 함께 돌린다.

---

## 한눈에

| 축                     | 무엇                                        | 규모                     | 실행 지점               |
| ---------------------- | ------------------------------------------- | ------------------------ | ----------------------- |
| CI 구조                | 워크플로 6개 · `ci.yml` 잡 7개(`gate` 포함) | —                        | `ci.yml`                |
| 셸 스위트              | CI 스크립트 자체의 회귀 검사                | 단정 272건(실행 기준)    | `scripts-test` 잡       |
| vitest (afds)          | 컴포넌트·훅·스크립트                        | 75파일 / 814테스트       | `afds-test` 잡          |
| vitest (afds-registry) | 컴포지션·레지스트리 생성                    | 31파일 / 386통과 + 6스킵 | `afds-registry-test` 잡 |
| 생성물 정합            | `registry.json` · manifest                  | —                        | 두 test 잡              |
| eslint                 | 토큰·아키텍처 경계                          | —                        | 두 test 잡              |
| 타입                   | `tsc --noEmit`                              | —                        | 두 test 잡              |

### 이 문서의 수치를 재현하는 명령

```bash
pnpm --filter @turbo-project/afds test:run              # 75파일 / 814테스트
pnpm --filter @turbo-project/afds-registry test:run    # 31파일 / 386통과 + 6스킵
bash .github/scripts/__tests__/run-all.sh           # 셸 스위트 9개 · 단정 272
python3 -c "import json;d=json.load(open('registry.json'));print(len(d['items']), sum(len(i['files']) for i in d['items']))"
```

**수치는 전부 실행 시점의 값이고, 이 문서의 값은 `3ca6315` 기준이다.** 수치를 적을 때는 **커밋 해시를 함께 적어라** — 릴리스 범프가 자동이라 `main` 이 하루에 여러 번 움직이고, 기준 시점이 없으면 어긋남을 「회귀」와 구분할 수 없다. 어긋나면 먼저 「무엇이 그 값을 바꿨는가」를 보라 — 코드가 늘어서 변한 것과 **세는 방식이 데이터에 의존해서 변한 것**은 다르다(아래 `ci-structure` 87 · `registry.json` 113 이 후자다).

**정본 스탬프는 위 한 줄뿐이다** — 절마다 「현재 기준」을 따로 적으면 어느 것이 정본인지 모른다. 아래는 **무엇이 언제 움직였는가**의 이력이다.

**PR #259(`06b04a7` 에서 측정)가 afds 값만 움직인다.** `74 → 75`파일 · `808 → 814`테스트(`lint-ratchet.test.ts` +6 · 파일 +1). 이 문서의 afds 테스트 수는 그 값이고, 나머지 수치는 아래 `3ca6315` 스탬프 그대로다.

**`3ca6315`(기본 척도 경고 기준 파일 · 주석 줄 제외)로 스탬프를 올린다.** afds-registry `384 → 386`
통과(탐지기 주석 줄 단위 테스트 +2, 파일 수 31 그대로). 기본 척도 경고 `114 → 111`건(bricks
`74 → 71` — 주석 줄 3건이 빠졌다), CI 출력의 `::warning` 줄 `114 → 0`(기준과 같으면 찍지 않는다).
셸 250 · afds 74/808 · `registry.json` 23/113 은 그대로다.

**`56f97e8`(PD 가드레일 — 기본 척도 경고 · main push 차단)로 스탬프를 올렸다.** 셸 `242 → 250`
(스위트 `pre-push-guard` 8 신설, 나머지 스위트는 그대로). afds-registry `30파일/373통과+6스킵 →
31파일/384통과+6스킵(390)` — **출발점이 문서의 372 가 아니라 373 이었다**(`adbb213` 실측, 문서가
이미 낡아 있었다 — 1 차이의 출처는 이 작업이 찾지 않았다). +11 은 `default-scale-warnings.test.ts`
1파일·1테스트와 `tailwind-arbitrary-values.test.ts` 탐지기 단위 테스트 10건이다. afds 74/808 ·
`registry.json` 23/113 은 그대로다.

**`67cdb72`(secret-scan 잡을 더한 커밋)로 스탬프를 올렸다** — 예고했던 이동을 재측정으로 확인했다.
셸 단정 `227 → 242`(`ci-structure` `76 → 87`: `ALWAYS_JOBS` 루프가 잡 하나에 8건씩 돌아 +8 · 스캔
내용 단정 +3, `assert_eq` 호출 지점 `55 → 58`; `mutation` `20 → 24`: secret-scan 돌연변이 4개).
vitest 축(afds 74파일/808테스트 · afds-registry 30파일/372통과+6스킵)과 `registry.json`(23/113)은 그대로다.

**`03cfd6c` 에서 스탬프를 올렸다(하네스 구멍 넷을 닫은 작업) — 그 커밋은 afds `rule-globs` 가
실패하는 상태라 재현 기준으로 부적합하다.** 그래서 `47686ef` 로 다시 스탬프한다 — 네 축을
재실측(`run-all.sh` · afds `test:run` · afds-registry `test`)해도 **값은 전부 그대로다.** afds 는 바로 아래 두 문단이 이미
예고한 `800 → 808` 을 이 갱신에서 확정했다 — 원인은 그 두 문단이 적은 대로 이 구간에 rebase 로
들어온 다른 브랜치 작업이고 이번 네 태스크가 새로 늘린 것이 아니다. afds-registry 는 토큰 임의 값
래칫(`arbitrary-token-ratchet.test.ts` · `tailwind-arbitrary-values.test.ts` 2파일)이 더해져
`28파일/355통과+6스킵 → 30파일/372통과+6스킵(378)` 이 됐다(전역 규약 12→13건, `src/lib/__test__/`
2→3파일 — 아래 §3 표). 셸 단정은 `225 → 227` 이다 — `ci-structure` 가 `test:run 기대 집합 ↔
실행 스텝` 교차 정합을 새로 얻어 `75 → 76`(`assert_eq` 호출 지점 `54 → 55`), `mutation` 이
`afds 의존 결합` 돌연변이를 얻어 `19 → 20`; `apps/storybook` lint 배선(#160 밖의 별건)은
`WF_PKG_EXPECT` 문자열 하나만 늘렸을 뿐 단정 개수를 움직이지 않았다. `registry.json` 23/113 은
그대로다.

**afds-registry 를 `9327b27` 기준으로 다시 쟀다**(§3 을 바로잡는 이 문서 수정 자체는 수를 움직이지
않는다) — 컴포지션 카테고리 작업(`taxonomy.ts`·`story-title.ts` 도입)이 `src/__tests__/`에
`taxonomy.test.ts`·`composition-story-titles.test.ts` 2파일을 더해 `26파일/326통과 → 28파일/355통과+6스킵`이
됐다. 셸 단정 225·`registry.json` 23/113 은 같이 확인했고 그대로다.

**같은 김에 afds 도 재보니 `800 → 808`로 낡아 있었다**(§3 의 afds 절 자체는 이 작업 범위 밖이라
고치지 않는다) — 이 구간에 rebase 로 들어온 다른 브랜치 작업(`scroll-area` 관련) 때문으로 보인다.
**afds 표·수치는 이 커밋에서 갱신하지 않았다** — 다음에 그 축을 다루는 사람이 `84b5082` 스탬프의
800 이 아니라 실측값을 다시 재라.

`7cb7228` → `f47b4a0` 에서 **네 값이 다 그대로다**(afds 800 · 셸 192 · 파일 74 ·
`DEFAULT_DOCS` 14). 그 사이에 소비처 대조 모드 철거(#234)가
들어갔는데 **검사 하나를 걷어냈어도 테스트 수가 줄지 않았다** — 그 모드를 물던 `it` 블록이
같은 수의 블록으로 재구성됐기 때문이다. **「기능을 걷어냈으니 수가 줄 것이다」는 예상이지
결과가 아니다.**

`e804d7d` → `7cb7228` 에서 **세 축이 움직였다.** 셸 단정 `174 → 192`(`ci-structure` +14 ·
`test-gates` +2 · `mutation` +2 — 검사를 더한 것이다), afds `765 → 800`(테스트 파일 2개 ·
`path-citation` 과 `orphan-jsdoc`), 그리고 **afds-registry 는 `327 → 326` 으로 줄었다.**

**감소는 조용한 삭제의 지문이므로 출처를 확인했다** — `17016e5`(#185)
가 `guard.test.ts` 에서 **돌 수 있는 호출 지점이 없던 헬퍼 하나**를 지웠다(이름은 그 PR 에 있다 — **지워진 심볼을 백틱으로 인용하면 게이트가 영구히 못 찾는다**).
`registry.json` 23/113 은 그대로다. **수가 줄었을 때 「무엇이 지웠는가」를 못 찾으면 그것이
회귀다** — §3 이 적는 대로 vitest 축은 파일을 지워도 조용하다.

afds 가 `758 → 765` 로 움직인 것은 `6a6b0f5`
(7테스트 1파일, #192 의 접미사 해소 픽스처)이고,
그 전은 `b91a886`(`747 → 758`, 같은 이슈의 선행사 픽스처)이며,
그 전 기준은 `cdecfab` 였고 그 커밋에서 vitest 두 축이 움직였다(afds `727 → 735` ·
afds-registry `319 → 327` 통과. #171 이 픽스처 16건을
더했다). 셸 단정 147 과 `registry.json` 23/113 은 **그대로**다.

`4683a43` → `e804d7d` 에서 **셸 축이** 움직였다(단정 `147 → 174`). 같은 구간에서 afds 는
`b91a886`·`6a6b0f5`(위) 때문에 움직였고, afds-registry 두 축과
`registry.json` 23/113 은 **그대로**다 — #170
이 셸 스위트를 하나 더했고(`test-gates` 23) `ci-structure` 에 단정 4건을 더했다. **테스트를
더한 것이 아니라 검사를 더한 것이므로** vitest 수가 그대로인 것이 정상이다.

그 전 기준은 **`9a6c2c8`** 이고 **`e914532`** 에서 다시 확인했다(네 값 모두 동일).
그중 셋(afds 69/727 · 셸 단정 147 · `registry.json` 23/113)은 그 전 판과도 **일치**했다.

**나머지 하나가 낡아 있었다** — 문서가 `c319d02` 에서 잰 `25파일 / 310통과` 를 그대로 들고 있었는데
`9a6c2c8` 실측은 `26파일 / 319통과` 다(#179 가
1파일 9테스트를 더했다). 기준 시점이 적혀 있지 않아 **어긋난 줄 아무도 몰랐다** — 이 규칙이 막으려는
상태가 이 문서 자신에 있었다.

---

## 1. CI 구조

```
ci.yml
├── changes        ci-detect-changes.sh 로 변경 패키지 판정
├── afds           needs.changes.outputs.afds == 'true'      → afds-test.yml
├── afds-registry       needs.changes.outputs.afds_registry == 'true'  → afds-registry-test.yml
├── scripts-test   .github/scripts/__tests__/run-all.sh      (조건 없음 — 항상 돈다)
├── format         knip · verify:docs:citations              (조건 없음 — 항상 돈다)
├── secret-scan    gitleaks git --log-opts=base..head          (조건 없음 — 항상 돈다)
└── gate           if: always() · ci-gate.sh 로 하위 결과 종합
```

**`ALWAYS_JOBS` 는 `changes` · `scripts-test` · `format` · `secret-scan` 넷이다**(`ci-structure.test.sh` 가 단정한다). **이력의 `.npmrc` 4건은 이미 폐기된 토큰 — 스캔은 PR 이 들인 커밋만 본다.** `format` 잡이 검사 둘(knip·인용 축)을 든 것은 §8 의 축 배치 규칙을 적용한 결과다 — 둘 다 입력이 저장소 전역이고 `pnpm install` 까지만 필요하다(빌드 불필요). 새 잡을 만들지 않고 셋업을 공유한다. **`verify:docs` 의 import 축은 `afds-test.yml` 에 남아 있다** — 그 축만 `dist` 를 요구하고, 그 축의 입력 변경은 afds 잡을 켠다.

**`packages/afds/*` 변경은 `afds` 뿐 아니라 `afds_registry` 도 켠다** — afds-registry 는
`@turbo-project/afds: workspace:*` 로 afds 에 의존하므로, afds 만 바꾼 PR 에서도 afds-registry 의
lint·정합·타입·테스트가 전부 돌아야 한다(§8-0 「누락된 적용」의 사례 — 의존 방향이 판정기에
반영되지 않았던 구멍을 닫았다). afds 축의 나머지 경로(`apps/storybook/*` · `.claude/rules/*` ·
`afds-test.yml` 자신)는 이전처럼 `afds` 만 켠다 — afds-registry vitest 가 그 경로들을 입력으로
읽지 않기 때문이다(실측 근거 있음, 그 입력이 바뀌면 이 판정도 함께 넓혀야 한다).

> **문서만 바꾼 PR 에서 `format` 이 게이트의 임계경로가 된다.** afds 잡이 도는 PR 에서는 `format` 이 그 아래라 벽시계 증가가 없고, afds 를 건너뛰는 PR 에서만 대기시간이 인용 축만큼 늘어난다. **그 PR 들이 정확히 이 검사가 검증해야 하는 변경**이므로 비용이 엉뚱한 곳에 얹히지 않는다 — 이건 비용이 아니라 성질이다.

**`gate` 가 fail-closed 다.** 판정할 수 없으면 실패한다 — `NEEDS_JSON` 이 비었거나 깨졌거나, 검사 0건이면 통과가 아니라 실패다. 그래서 `changes` 가 실패해 하위가 스킵되어도 초록이 되지 않는다.

**다른 워크플로**: `changeset-check.yml`(PR) · `chromatic.yml`(PR·dispatch) · `release.yml`(`main` push) ·
(`react-doctor.yml` 은 사용자 결정 2026-10-28 로 삭제 — 로컬 `pnpm doctor`).
저장소 전체 워크플로 파일은 **6개**다 — `ci.yml` · 그것이 호출하는 `afds-test.yml`·`afds-registry-test.yml` ·
그리고 위 셋.

### 각 test 워크플로가 도는 게이트

|     | afds-test                             | afds-registry-test                                   |
| --- | ------------------------------------- | ---------------------------------------------------- |
| 1   | Build (`+ verify:exports`)            | Build afds — 타입체크가 `dist/*.d.ts` 에 의존한다    |
| 2   | Type check                            | Registry ↔ compositions 정합                         |
| 3   | Lint                                  | `validate:registry` (`shadcn registry validate`)     |
| 4   | Lint (storybook)                      | Type check                                           |
| 5   | Run tests(afds·figma-token-bridge 만) | Lint                                                 |
| 6   | Verify doc citations                  | Run tests(afds-registry vitest 는 **여기서만** 돈다) |

**`Run tests` 는 `assert-script-owners.sh test:run packages/afds packages/afds-registry
packages/figma-token-bridge` 로 기대 집합(워크스페이스에서 `test:run` 을 가진 패키지 전체)을
먼저 확인한 뒤, afds·figma-token-bridge 만 `pnpm-run.sh` 로 실행한다.** afds-registry 는 위 판정
결합(`packages/afds/*` → `afds_registry=true`) 덕분에 afds-only PR 에서도 `afds-registry-test` 가 돌아
빠지지 않는다 — 예전에는 `afds-test.yml` 의 `pnpm -r --if-present test:run` 재귀 호출이 이걸
**우연히** 덮었고, 두 잡이 함께 켜지는 PR 에서 같은 vitest 가 약 62초 중복 실행됐다. 지금은
헬퍼 우회 예외가 없어(§2 표) 그 재귀 호출 자체가 막혀 있다.

**`pnpm --filter` 를 워크플로에서 직접 쓰지 않는다.** 전부 `.github/scripts/pnpm-run.sh <패키지경로> <스크립트>` 를 경유한다. 새 스크립트를 배선하면 `ci-structure.test.sh` 의 `WF_PKG_EXPECT`·`WF_SCRIPT_EXPECT` 에 **등록해야 한다** — 등록하지 않으면 스위트가 실패한다. 이건 실수를 잡기 위한 의도적 비용이다. `WF_PKG_EXPECT` 는 `apps/*` 도 훑는다(`apps/storybook:1` — 그 자기 lint 가 CI 에서 도는 유일한 자리다). **지금은 워크플로에 `pnpm -r`/`pnpm --filter` 직접 호출이 예외 없이 0건이다** — 헬퍼 우회 예외 목록이 비어 있어서, 예외를 들이려면 목록과 「죽은 예외」 검사를 함께 되살려야 한다. 새 불변식 `[test:run 기대 집합 ↔ 실행 스텝]` 도 같은 절에서 돈다 — `assert-script-owners.sh` 인자의 모든 패키지가 두 test 워크플로 중 한 곳에서 `pnpm-run.sh <pkg> test(:run)` 로 실행되는지 교차 대조한다(§2 `ci-structure` 표).

---

## 2. 셸 스위트 — CI 스크립트 자체의 회귀 검사

`.github/scripts/__tests__/run-all.sh` 의 `for suite in ...` 목록이 **정본**이고 순서대로 돈다. 이름으로 하드코딩돼 있어 스위트 파일을 지우면 `run-all.sh` 가 실패한다.

**그런데 목록에서 이름을 빼는 것은 그 스크립트가 막지 못한다** — 빠진 이름은 스크립트에 존재하지 않기 때문이다(실측, **가드 도입 전**: `mutation` 을 목록에서 빼니 「스위트 4개 실행 / 실패 0개」로 **통과**했다. 도입 후 같은 조작은 잡힌다 — 실측 `e804d7d`: 「5개 실행 / 실패 1개」). 그래서 `ci-structure` 가 이 목록과 디렉터리의 `*.test.sh` 집합을 **양방향 대조**한다. 남는 구멍은 하나다 — `ci-structure` 자신을 목록에서 빼는 것. **거기가 재귀의 종점이고 diff 가 방어다.**

| 스위트               | 단정 | 무엇을 지키나                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| -------------------- | ---- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ci-gate`            | 40   | 게이트 종합 로직 — 부분 성공을 통과로 세지 않기, 빈 값·깨진 JSON 에서 fail-closed                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `ci-detect`          | 21   | 변경 패키지 판정 — 판정 불가면 실행한다(fail-closed)                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| `ci-structure`       | 87   | **워크플로 YAML 의 구조** — 스텝 존재(스크립트 이름 기준), `if:`/`continue-on-error` 금지, `run` 본문에 `${{ }}` 금지, 잡 수준 `if` 허용 목록, **위 스위트 목록의 양방향 정합**, `test:run` 기대 집합 ↔ 실행 스텝 교차 정합                                                                                                                                                                                                                                                                               |
| `mutation`           | 24   | 위 스위트들에 실제로 돌연변이를 심어 **스위트가 잡는지** 확인                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `pnpm-run`           | 14   | `pnpm-run.sh` 헬퍼 — 실제 임시 워크스페이스를 만들어 검증                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| `release-guard`      | 31   | **릴리스 가드가 「다른 것을 재는 것」을 막는다** — `changeset-grade.sh`·`snapshot-versions.sh` 에 실제 파일을 만들어 먹여 등급 유무 판정을 고정한다                                                                                                                                                                                                                                                                                                                                                       |
| `test-gates`         | 25   | **게이트 성격의 vitest 파일을 이름으로 고정** — 글롭 수집이라 지워도 조용한 축을 덮는다(목록 크기는 §3) (#170)                                                                                                                                                                                                                                                                                                                                                                                            |
| `pre-push-guard`     | 16   | **`main` 직접 push 차단 훅** — `block-main-push.sh` 에 pre-push stdin 형태를 흘려 main 대상·삭제 push 차단, 다른 브랜치·빈 stdin 통과를 고정하고, `lefthook.yml` 이 `script:`·`use_stdin: true` 로 `.lefthook/pre-push/pre-push.sh` 를 부르고 스크립트가 가드를 changeset 검사보다 먼저 부르는지(배선), **실제 lefthook 으로 main 대상 stdin 을 흘려 rc 와 가드의 차단 문구까지 확인**(행동 — upstream 없음·이미 push 한 브랜치·원격보다 앞선 브랜치. lefthook 바이너리가 없는 CI 에서는 건너뜀) 단정한다 |
| `package-boundaries` | 11   | **패키지 경계 검사** — `check-package-boundaries.mjs` 에 위반·정상 픽스처를 먹여 R1·R3 판정과 소스 0건 시 실패(조용한 통과 방지)를 고정한다                                                                                                                                                                                                                                                                                                                                                               |

**수치는 실행 기준이고, 일부는 데이터 의존이다.** `ci-structure` 는 **`assert_eq` 호출 지점이 58곳**인데 **실행 단정이 87건**이다. **이 스위트는 `assert_eq` 만 쓰므로**(`assert_contains`·`assert_not_contains` 0곳) 실행이 호출 지점보다 많다는 것은 **어떤 호출이 여러 번 돈다**는 뜻이다(루프). 그래서 두 수를 **함께** 적어야 한다 — 어느 루프가 몇 번인지는 이 문서가 분해하지 않는다(분해하면 그 분해가 낡는다. 이전 판이 그렇게 낡았고 합계도 어긋나 있었다).

> **⚠️ 그 추론을 다른 스위트로 옮기지 마라 — 전제가 스위트마다 다르다.** 카운터를 올리는 것은
> `assert_*` 가 아니라 `lib.sh` 의 `ok`·`ng` 이고, **어느 함수든 그것을 직접 부를 수 있다.**
> 그래서 스위트마다 단정하는 심볼이 다르다(기준은 위 정본 스탬프):
>
> | 스위트         | `assert_*` 호출 지점 | 실행 단정                     |
> | -------------- | -------------------- | ----------------------------- |
> | `ci-structure` | 58                   | 87 — 위 추론이 성립한다       |
> | `pnpm-run`     | 14                   | 14 — 루프가 없다              |
> | `ci-detect`    | **0**                | **21** — 자기 헬퍼로 단정한다 |
> | `mutation`     | **0**                | **24** — 같다                 |
>
> **`ci-detect` 에 위 추론을 옮기면 「호출 0곳에 실행 21건」이므로 무한 루프라는 결론이 난다.**
> 이것이 §8 의 「**비교하는 두 값은 같은 방법으로 뽑아라**」의 사례다 — 두 수가 같은 것을 세는지
> 확인하기 전에는 그 차이가 무엇을 뜻하는지 알 수 없다.

**그 데이터 의존이 실제로 일어났다.** `ALWAYS_JOBS` 가 `"changes scripts-test"`(2개)에서 **`"changes scripts-test format"`(3개)**으로 늘었다. 단정을 새로 쓰지 않았는데 그 루프의 실행 수가 함께 늘었다 — 이 문서가 예고한 형태 그대로다.

**그러므로 이 문서의 73 이 어긋나는 것은 반드시 회귀가 아니다. 스위트 자신이 출력하는 수가 정본이고, 이 문서의 수는 기준 커밋과 함께 읽는 참고값이다.** 호출 지점 수와 실행 수를 **함께 적어야** 「검사가 늘었나 · 데이터가 늘었나」를 가릴 수 있다.

## 3. vitest

**⚠️ vitest 는 글롭 수집이라 테스트 파일을 지워도 조용하다** (#170). 위 §2 의 셸 스위트는 `run-all.sh` 가 이름으로 하드코딩해 삭제를 잡는데, **vitest 축은 정반대다** — 실측(`6bee992` · `e804d7d` 에서 재현): `rule-globs.test.ts` 를 지우면 afds `test:run` 이 **파일 수가 하나 줄고 exit 0** 이고 `verify:docs` 를 포함한 다른 검사도 전부 통과한다. §2 의 서술을 vitest 에 일반화하지 마라.

**게이트 성격의 일부만 §2 의 `test-gates` 가 이름으로 덮는다**(`7cb7228` 기준 18건 · afds 9 · afds-registry 9 — PR #259 가 afds 에 `lint-ratchet` 와 afds-registry 에 `arbitrary-token-ratchet` 을 더해 20건, 이 PR 이 `type-bypass-ratchet` 을 더해 21건). 그 목록의 파일은 지우면 셸 축에서 `EXIT=1` 이다(실측 `e804d7d`: 삭제 시 `test-gates` 가 실패하며 파일 이름을 지목하고, 같은 상태에서 afds `test:run` 은 여전히 exit 0). **목록 밖의 테스트 파일은 여전히 조용하다** — 그것이 의도다(개별 회귀 테스트는 지워도 그 하나만 잃는다). 선정 기준은 `test-gates.test.sh` 머리에 적혀 있고, **목록에 새 게이트를 적는 것을 강제하는 기계는 없다.**

### afds — 75파일 / 814테스트

| 위치                        | 파일                                                                                                                                                                  |
| --------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/bricks/**`             | 52                                                                                                                                                                    |
| `src/headless/**`           | 6                                                                                                                                                                     |
| `src/lib/**`                | 4                                                                                                                                                                     |
| `src/scope` · `src/postcss` | 각 2                                                                                                                                                                  |
| `scripts/__test__/`         | 9 — `lint-ratchet` · `rule-globs` · `tokens-manifest` · `eslint-globs` · `orphan-jsdoc` · `citation-drift` · `citation-antecedent` · `path-resolve` · `path-citation` |

`eslint-globs.test.ts` 는 같은 일을 **eslint `files` 글롭**에 한다 — 커버 글롭은 1건 이상 매칭해야 하고, 금지 글롭(`src/schemas/compositions/**`)은 0건이어야 한다.

`rule-globs.test.ts` 는 **`.claude/rules/*.md` 의 `paths` 글롭 자체를 검사한다** — 모든 글롭이 실재하는 파일을 1건 이상 매칭하는지, 컴포지션 트리를 커버해야 하는 규칙 6개가 모두 커버하는지. 두 단정은 서로를 대신하지 않는다(하나만 있으면 다른 형태가 조용히 통과한다).

**그 매처 자체도 픽스처로 고정한다** (#171). 실재 트리에는 dotfile · dot-디렉터리 · 심링크 · 파일 없는 디렉터리가 **하나도 없다**(측정: 커버 대상 3개 트리에서 각각 0건). 즉 판정이 옳아서 통과한 것이 아니라 **틀릴 입력이 없어서** 통과했고, 구현 형태가 유일한 보호막이었다. `matchedFileCount(pattern, root)` 가 검사 루트를 인자로 받고 임시 트리 8건을 직접 먹는다 — 기준은 `globSync` 실측이다(dot 제외 · 파일 심링크는 매칭 · 디렉터리만 있는 트리는 `[]`).

> **디렉터리 심링크가 파일로 세어지고 있었다.** `Dirent` 는 심링크에 대해 `isDirectory()` 도 `isFile()` 도 **둘 다 false** 다. 그래서 `else if` 분기로 흘러 확장자 없는 `<디렉터리>/**` 에서 **파일 1건**이 됐다 — 실재 파일이 0건이어도 글롭이 살아 있다고 판정하는 **거짓 통과**다. 반대로 `Dirent.isFile()` 만으로 거르는 단순한 수정은 `globSync` 가 세는 **파일 심링크를 놓친다**(그 방향도 픽스처가 잡는다). 실데이터 카운트는 리팩터 전후 동일하다(규칙 글롭 14건, 불일치 0건).

### afds-registry — 31파일 / 386통과 + 6스킵 (392)

| 위치                           | 파일 | 무엇                                                                                                                       |
| ------------------------------ | ---- | -------------------------------------------------------------------------------------------------------------------------- |
| `src/__tests__/`               | 14   | 레지스트리·컴포지션 전역 규약(13) · 기본 척도 경고(1)                                                                      |
| `src/lib/__test__/`            | 3    | `story-determinism` · `wrapping-contract` · `tailwind-arbitrary-values`(래칫 카운터·기본 척도 탐지기의 픽스처 단위 테스트) |
| `src/compositions/*/__test__/` | 13   | 컴포지션별 단위 테스트 (**11/23 만 보유**)                                                                                 |
| `src/compositions/__test__/`   | 1    |                                                                                                                            |

전역 규약 13건: `shadcn-registry-closure`(아이템의 `files[]` 만으로 전이 폐쇄가 닫히는가) · `registry-consistency` · `composition-stories`(스토리 존재 게이트) · `composition-tests`(테스트 존재 래칫) · `composition-files` · `derive-dependencies` · `docs-import-truth` · `guard` · `spec-description` · `transform` · `taxonomy`(허용 목록·spec frontmatter 검증) · `composition-story-titles`(스토리 title 이 registry categories 와 대조되는가) · `arbitrary-token-ratchet`(bricks·컴포지션의 Tailwind 임의 값(색·길이) 래칫 — 늘면 실패, 줄었는데 기준 미갱신이면 실패).

`arbitrary-token-ratchet.test.ts` 는 **래칫이지 하드 게이트가 아니다** — 기존 위반이 있어서다.
`packages/afds-registry/src/lib/tailwind-arbitrary-values.ts` 가 Tailwind `-[...]` 브래킷을 앵커
없이 세고(ESLint `no-restricted-syntax` 는 리터럴 **전체**가 hex 일 때만 잡아 `text-[#FF5733]
w-[137px]` 같은 혼합 문자열을 놓친다 — `.claude/rules/afds-component-tokens.md` 참고),
`packages/afds-registry/src/__tests__/arbitrary-token-ratchet.baseline.json` 의 파일별 건수와
**정확히 같아야** 통과한다(늘면 실패, 줄었는데 기준 미갱신이면 실패, 새 파일에 1건이라도
있으면 실패, 기준에 남은 사라진 파일도 실패). 실측 기준 합계(`a1bb979` 기준): afds
`src/bricks/**` 19파일/72건, afds-registry `src/compositions/**` 13파일/27건. **bricks 안의 순수
hex 리터럴은 지금 ESLint·이 래칫 어느 쪽도 막지 않는다** — `packages/afds/eslint.config.js`
가 `no-restricted-syntax` 를 `src/bricks/**` 에서 통째로 재정의해 공유 셀렉터가 안 닿고,
이 래칫은 Tailwind 브래킷 안의 색·길이만 본다(브래킷 밖 리터럴은 애초에 매칭 대상이 아니다).

`default-scale-warnings.test.ts` 는 **게이트가 아니다 — 실패시키지 않는다**(사용자 결정: 기본
척도는 막지 않고 알린다). 래칫과 같은 두 트리·같은 제외(`walkScannableFiles`)로
`findDefaultScaleClasses` 가 기본 팔레트(`text-red-500`)·spacing(`p-4`·`-mt-2`)·radius
(`rounded-lg`)를 찾는다(주석 줄 `//`·`/*`·`*` 는 건너뛴다). **`::warning file=…,line=…::` 은 파일별
건수가 `default-scale-warnings.baseline.json` 보다 늘어난 파일에만 찍고**(기준에 없는 새 파일은
기준 0), 그런 파일은 모든 위치를 찍는다. 나머지는 트리별 합계 한 줄뿐이다 — GitHub 는 스텝당
`warning` 주석을 10건까지만 보여 줘서, 기존 경고를 다 찍으면 PR 의 새 경고가 뒤로 밀려 안 보인다.
CI checkout 이 depth 1 이라 base 와 diff 할 수 없어 기준 파일로 대신한다. 건수가 기준보다 줄면
「기준을 낮추라」는 일반 줄을 찍는다(실패 아님). `process.stdout.write` 를 쓰는 것은 `console.log`
에 vitest 가 머리와 ANSI 코드를 붙여 줄 맨 앞이 `::` 가 아니게 되기 때문이다. 유일한 단정은
대조군(두 트리 모두 스캔 파일 > 0)이다. 실측(`3ca6315`): 경고 111건(bricks 71 · 컴포지션 40),
`pnpm --filter @turbo-project/afds-registry test` 출력에서 줄 맨 앞 `::warning` 0줄. 기준 0 인
컴포지션에 `text-gray-500 p-4 rounded-lg` 를 넣으면 정확히 3줄이 찍히고 스위트는 통과한다.
**한계**: 파일 단위 건수만 보므로 줄였다가 옛 건수까지 다시 늘린 파일은 기준을 낮추기 전까지
조용하다(테스트의 `ponytail:` 주석). 세지 않는 것(값 `0` · 분수 위치 `left-1/2` ·
`rounded-full`/`none` · AFDS 토큰 클래스)과 사각지대(`p-4!` · `bg-gray-100/[.5]` · `gap-px` ·
`white`/`black` · `w`/`h`/`size`)는 `.claude/rules/afds-component-tokens.md` 경계 노트가 정본이다. **`test-gates`
목록에 넣지 않았다** — 지워도 실패할 것이 없는 파일이라 게이트가 아니다.

`composition-stories` 의 **하위 순회 `isSkippedDir` 분기**도 픽스처로 고정한다(같은 이슈). 그 분기를 지우면 스토리를 `__test__/` 안에 두는 것만으로 게이트가 만족되는데 — 그 위치의 스토리는 수집·배포 대상이 아니므로 **없는 것과 같다** — 실재 트리에는 그런 컴포지션이 0건이라 **기존 단정은 전부 통과한다**. 실측: 그 분기를 제거하면 **새 픽스처 2건만** 실패한다. `compositionDirNames(root)` 쪽은 사정이 달라서, 같은 제거를 기존 단정(`모든 컴포지션에 *.stories.tsx 가 있다`)도 함께 잡는다 — 컴포지션 루트에는 `__test__/` 가 실재하기 때문이다.

---

## 4. 생성물 정합

두 산출물이 생성기에서 나온다.

| 산출물                                           | 생성기                             | 검사                                   |
| ------------------------------------------------ | ---------------------------------- | -------------------------------------- |
| `registry.json` (루트, 23 items / **113 files**) | `afds-registry: generate:registry` | 정합 검사 + `shadcn registry validate` |
| afds manifest                                    | `afds: generate:manifest`          | —                                      |

**`113` 은 데이터 의존이다** — 형제를 인라인하는 아이템이 있어 **같은 파일이 여러 부모에 중복 계수된다**(고유 파일은 86개다). 컴포지션 수가 그대로여도 형제 관계가 바뀌면 변한다. `ci-structure` 의 55 와 같은 종류다.

**생성기가 잘못된 값을 내보내는 경우**와 **산출물만 낡은 경우**는 서로 다른 검사에 잡힌다. 재생성 후 `git diff --exit-code` 로 멱등성을 본다.

**`registry.json` 에는 파일 `content` 가 없다.** `path`/`type`/`target` 만 담고 소비처가 GitHub 원본을 직접 읽는다. 그래서 **컴포지션 소스를 고쳐도 `registry.json` 은 안 바뀐다** — 조용한 실패가 아니라 정상이다.

---

## 5. oxlint + ESLint — 함정이 둘 있다

규칙 대부분은 oxlint(`.oxlintrc.json`)가 맡고, ESLint 는 oxlint 가 구현하지 않는 `no-restricted-syntax`(토큰 셀렉터) 등 잔여만 맡는다. 아래 함정은 ESLint 쪽 설정에 그대로 적용된다.

### ⚠️ 패키지 오버라이드가 공유 배열을 **대체**한다

`packages/afds/eslint.config.js:26-28` 이 `src/bricks/**` 에 대해 `no-restricted-syntax` 를 다시 정의한다. flat config 에서 같은 규칙명을 다시 쓰면 **옵션 배열이 통째로 대체**된다.

**결과**: 공유 설정(`packages/config/eslint-config/`)에 셀렉터를 추가해도 `src/bricks/**` 에는 닿지 않는다. 실측 — 어떤 셀렉터를 공유 설정에만 넣었을 때 bricks 에 위반 178건이 실재하는데 **0으로 보고됐다.**

**공유 설정에서 0으로 보고되는 것을 "위반 없음" 으로 읽지 마라.** 확장을 넣을 때는 `src/bricks` 안에 돌연변이를 심어 잡히는지가 완료 조건이다.

### ⚠️ 두 패키지의 경고 정책이 다르다

```
afds      lint-ratchet.ts (oxlint·ESLint JSON 병합) ← 경고는 기준선과 정확히 같아야 한다, 오류는 0
afds-registry  oxlint + eslint . --max-warnings 0 ← 하드 게이트
```

같은 규칙을 추가해도 **afds-registry 는 위반이 곧 CI 실패이고, afds 는 새 `파일::규칙` 키가 생기면 래칫이 실패한다**(기존 키의 경고만 허용된다). 규칙을 넓힐 때 이 비대칭을 먼저 확인하라.

---

## 6. 타입 게이트

`check-types` = `tsc --noEmit`. 두 패키지 모두.

### `isolatedModules` ≠ `verbatimModuleSyntax`

공유 설정은 `isolatedModules` 를 켜는데, 그건 **타입의 type-only import 를 요구하지 않는다**(타입 재수출만 막는다). 그래서 타입을 값 import 로 섞은 코드가 통과했다.

`packages/afds-registry/tsconfig.json` 에 `verbatimModuleSyntax: true` 를 켜서 **기존 `check-types` 가 그대로 게이트**가 되게 했다. 컴포지션은 소비처로 **복사**되므로 소비처의 컴파일러 설정을 상속한다 — `verbatimModuleSyntax` 는 Vite react-ts 템플릿 **기본값**이라, 여기서 통과하지 않으면 소비처에서 깨진다.

**두 패키지 모두 켜져 있다 — 다만 이유가 다르다.**

|                   | 왜 켰나                                                                                                                                           |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| **afds-registry** | **소비처 호환.** 컴포지션은 소스로 복사되어 소비처 tsconfig 를 그대로 상속한다. 여기서 통과하지 않으면 소비처에서 깨진다                          |
| **afds**          | **내부 일관성.** afds 는 npm 패키지로 배포되어 소비처가 `dist/*.d.ts` 를 소비하고 이 소스를 컴파일하지 않는다(스캐폴드 기본 `skipLibCheck: true`) |

**이 구분이 중요하다** — afds 쪽 위반은 소비처에 도달하지 않는다. 실측 근거: 컴포지션 23개를 스톡 Vite 스캐폴드에 전량 설치해 타입체크했을 때 **afds 관련 오류는 0건**이었다. 그래서 afds 는 급한 결함이 아니라 일관성 부채였고, 컴포지션(#178)을 먼저 닫고 afds(#182)를 뒤에 처리했다.

### 전제하는 소비처 설정

컴포지션 23개를 실제 Vite react-ts 스캐폴드에 전량 설치해(86파일 / 코드 61) 설정별로 측정한 결과다.

| 소비처 설정                                                       | 컴포지션 오류      | 판정                                                                                                                     |
| ----------------------------------------------------------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------------ |
| 스톡 Vite react-ts 템플릿                                         | **2** (base-input) | **우리 결함** — 게이트로 닫았다                                                                                          |
| `+ strict`                                                        | 추가 0             | 깨끗                                                                                                                     |
| `+ noUncheckedIndexedAccess`                                      | 추가 0             | 깨끗                                                                                                                     |
| `isolatedModules` · `jsx: preserve` · `erasableSyntaxOnly: false` | 추가 0             | 깨끗 (**`jsx: react` 는 다르다 — 아래**)                                                                                 |
| Next.js 기본값 조합                                               | **0**              | 깨끗                                                                                                                     |
| `+ exactOptionalPropertyTypes`                                    | **28** (17/23)     | **지원하지 않는다** — 오류 대상 타입이 거의 전부 afds 다. 컴포지션에서 고칠 수 없다                                      |
| `moduleResolution: node16` · `nodenext`                           | **66** (23/23)     | **지원하지 않는다** — 확장자 없는 상대 import 를 쓴다. **번들러 기반 해소(`bundler`)를 전제한다**                        |
| `jsx: react` (클래식 런타임)                                      | **174** (23/23)    | **지원하지 않는다** — 측정한 축 중 가장 크다(TS2686). React 17+ 에서 기본이 아니고 Vite·Next 둘 다 automatic/preserve 다 |

**`strict` 를 켜도 위반이 늘지 않는다**는 것이 중요하다 — 소비처의 가장 흔한 강화 설정이 무해하다.

뒤 두 줄은 **게이트로 걸지 않는다.** 고칠 자리가 컴포지션이 아니고(afds 타입 / 복사 배포의 보편 관행), 걸면 28·66건이 즉시 실패해 래칫 없이는 불가능하며 래칫을 두면 줄지 않는 상한이 남는다. **게이트가 막는 것과 문서가 알리는 것을 구분한다.**

⚠️ React 버전은 요인이 아니다 — React 18.3.1 로 내려도 같은 수치다. `skipLibCheck: false` 와 `moduleResolution: node10` 은 미측정이다.

### ⚠️ 소비처에서 `tsc --noEmit` 은 아무것도 검사하지 않을 수 있다

Vite react-ts 스캐폴드의 `tsconfig.json` 은 `{ "files": [], "references": [...] }` 인 솔루션 파일이다. `--noEmit` 은 `references` 를 따라가지 않으므로 **0개 파일을 검사하고 0을 반환한다.**

```
tsc --noEmit --listFiles | wc -l   →  0
tsc --noEmit                       →  EXIT=0     ← 통과가 아니다
tsc -b                             →  실제 결과
```

소비처 검증에서는 `tsc -b` 또는 `-p tsconfig.app.json` 을 쓰고, **검사한 파일 수를 함께 찍어라.**

---

### ⚠️ 런타임 하한을 시험하는 잡은 하나뿐이다

루트 `engines.node` 는 `>=22` 이고 `.npmrc` 의 `engine-strict=true` 가 그것을 설치 시점에 강제한다. 그 하한에서 실제로 `pnpm install` 을 하는 워크플로는 **`chromatic.yml`(Node 22) 하나뿐**이다(나머지는 전부 24). paths 필터가 없어 모든 PR 에서 돌기 때문에 하한이 매 PR 마다 시험된다.

**이 워크플로의 `node-version` 을 올리면 그 시험이 조용히 사라진다** — 「일관성」을 이유로 24 로 맞추는 변경이 그 형태다. 하한을 시험하는 곳이 여기 하나라는 것을 알고 바꿔라.

---

## 7. 로컬 실행 순서·측정 함정

CI 는 순서를 지켜 돌지만 로컬에서는 건너뛰기 쉽다. 아래 셋은 **회귀가 아닌데 실패로 보이는** 형태다 —
원인을 코드에서 찾기 전에 여기를 보라.

### ⚠️ 이 문서에 적힌 함정을 이 문서의 저자들이 밟은 횟수

| 함정                            | 누가·언제                                                                                               |
| ------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `jq has()` 경고                 | 이 문서 `:105-107` 에 적어 두고 **두 줄 아래 `:111` 에서** 어겼다                                       |
| Node 고정(`nvm`)                | §7 에 그 함정을 적은 PR 을 올린 **뒤에** 밟았다(커밋 재작성)                                            |
| Node 고정(`nvm`)                | 다른 레인이 `push` 에서 밟았다                                                                          |
| 워크트리 낡음                   | 「대상이 다르다」를 카탈로그한 **직후에** 밟았다                                                        |
| 분모 섞기                       | 「분모를 적어라」를 **지시하던 중에** 두 규칙 집합을 하나로 읽었다                                      |
| **관측 오독**                   | 이 갱신의 **스펙 자체**가 `cmp -s` 를 오독한 사실을 담고 있었다(아래 절)                                |
| **오류 메시지 오독**            | `zsh` 가 먹은 `:r` 을 **git 이 태그명을 망가뜨린 것**으로 진단했다 — 「관측 오독」 카탈로그를 쓰는 중에 |
| **앵커를 조이면 형태를 놓친다** | 그 교훈을 담은 PR(#227)을 **리뷰한 직후** 다음 측정에서 밟았다 — 아래 절                                |

**기록해 두는 것이 밟지 않게 해 주지 않는다.** 마지막 것이 가장 정확한 사례다 — **문서 자신의
주제를 그 문서의 스펙에서 어겼다.** 그래서 검사로 옮길 수 있는 것은 검사로 옮긴다. 옮길 수
없는 것은 **재측정 규율**로만 막힌다(§8).

### ⚠️ `verify:docs` 는 `afds build` 뒤에 돌려야 한다

`verify-doc-citations.ts` 는 정본 export 표면을 **`dist/*` 를 실제로 `import()` 해서** 얻는다.
`dist` 가 없으면 그 표면을 읽지 못한다. 격리 실측(`e914532`, `dist` 를 옮겼다 되돌렸다) — `dist` 없이
돌리면 `EXIT=1` 이고 **`★` 실패가 9건**, 서브패스마다 하나씩 나온다:

```
★ export 표면을 읽지 못했다 — 검사가 돌지 않았다: 빌드 산출물이 없다: ./dist/index.js (서브패스 '.') — 먼저 pnpm build
★ … ./dist/bricks/index.js (서브패스 './bricks') — 먼저 pnpm build
… (9건, 각 줄이 `먼저 pnpm build` 로 끝난다)

문서 0 / 펜스 0 / import문 0 / 게이트대상 0 / 이름 0 / 완료표기 0 — 실패 9
```

**도구가 스스로 `먼저 pnpm build` 라고 말한다** — 원인을 추측할 필요가 없다. `dist` 를 복원하면 같은
명령이 `EXIT=0` 이다.

> **`· 유래 … 읽을 수 없다` 줄을 실패 신호로 읽지 마라.** 그 줄은 **통과 실행에도 나온다**(실측:
> `EXIT=0` 실행에 2건, `★` 는 0건). `·` 는 정보이고 `★` 가 실패다. 실패를 셀 때는 `★` 와 마지막
> 요약 줄의 `실패 N` 을 보라.

**이 `EXIT=1` 은 문서 결함이 아니다.** CI 는 `afds-test.yml` 에서 Build 를 **게이트 첫 스텝**(설치
다음), Verify doc citations 를 **마지막 스텝**에 두어 순서를 강제한다.

### ⚠️ `commit`·`push` 는 **매번 같은 호출에서** Node 를 고정해야 한다

루트 `engines.node` 는 `>=22` 이고 lefthook pre-push 가 `turbo check-types` 를 돈다. 셸 기본 Node 가
그보다 낮으면 훅이 `ERR_PNPM_UNSUPPORTED_ENGINE` 으로 죽어 **커밋·push 가 `EXIT=1`** 이 된다.

셸이 새로 뜰 때마다 기본값으로 되돌아가므로 **`nvm use` 를 그 명령과 같은 호출에 넣어라** — 앞선
호출에서 한 것은 남지 않는다. 두 레인이 각각 밟았다(한쪽은 commit, 한쪽은 push — commit 은 통과하고
push 만 실패했다).

**이 `EXIT=1` 은 훅이 잡은 결함이 아니다.** 메시지에 `Expected version: >=22 / Got: v20` 이 있으면
Node 문제다.

### ⚠️ `wrapping-contract` 의 심볼 테스트는 부하에서 타임아웃한다 — 심볼 회귀로 오진하기 쉽다

`목록의 심볼을 AFDS 루트에서 실제로 꺼낼 수 있다` 는 `await import('../../index')` 로 **소스 배럴
전체를 동적 import** 하고 `timeout: 20_000` 이 붙어 있다(`src/index.ts` 가 배럴 6개를 재수출하고
그 아래 소스가 255파일이다 — 왜 2초가 걸리는지 세부 프로파일은 측정하지 않았다).

실측 — 아래 셋은 `9a6c2c8`(`e914532` 재측정 2179ms 로 같은 범위), 마지막 줄은 관측 시점이 다르다:

```
한가할 때        1970ms
빌드 2개 동시     3143ms
그 뒤 한가할 때   2206ms
관측된 실패      20,078ms  ← 한도 20,000 을 78ms 초과 (`b40a3eb` 에서 관측)
```

**실패 메시지가 심볼 이름을 가리키므로 심볼 회귀로 읽기 쉽다.** 먼저 **소요 시간**을 보라 —
20초에 가까우면 부하 문제이고 회귀가 아니다.

> **오진 기록.** 이 실패를 처음 만났을 때 나는 **`dist` 부분 재생성 때문이라고 진단했다**
> (`generate:manifest` 만 돌린 직후였고, 완전 재빌드 후 통과했다). 틀렸다 — **그 테스트는 `dist` 를
> 읽지 않는다.** `../../index` 는 소스이고 tsconfig `paths` 도 `"@turbo-project/afds": ["./src/index.ts"]`
> 로 소스를 가리킨다. 재현도 되지 않는다(`generate:manifest` 만 돌린 뒤 `test:run` → 69/69 통과,
> 소스에 export 를 추가하고 재빌드 없이 돌려도 EXIT=0). 재빌드가 고친 것이 아니라 **그때 부하가
> 낮아진 것**이었다. **종료코드가 바뀐 사실만으로 인과를 정하면 이렇게 틀린다** — 그것이 아래
> §8 측정 규율의 마지막 항목이다.

**이슈로 올리지 않았다.** 근거: 최근 `ci.yml` 실행 30건에 실패 0건이고, `afds-test` 는 스텝 9개가
**순차** 실행(matrix 없음)이라 20초를 만든 동시 실행 경쟁이 CI 에서는 성립하지 않는다. 한도를 올리면
진짜 느려짐을 가리므로 그것도 하지 않았다. **CI 에서 한 번이라도 나면 그때 등록한다.**

### ⚠️ `--reporter=basic` 은 vitest 4 에서 없어졌다 — 저장소가 깨진 것처럼 보인다

수치를 재려고 리포터를 갈아끼우면 이렇게 나온다(실측, 이 저장소 `vitest@4.0.16`):

```
⎯⎯⎯ Startup Error ⎯⎯⎯
Error: Failed to load custom Reporter from basic
  [cause]: Error: Failed to load url basic (resolved id: basic). Does the file exist?
 ERR_PNPM_RECURSIVE_EXEC_FIRST_FAIL  Command failed with exit code 1
```

**테스트가 하나도 돌지 않았는데 종료코드 1 이고**, 스택은 `vite`·`pnpm` 내부를 가리켜 의존성이
깨진 것처럼 읽힌다. 원인은 **내가 넘긴 플래그**다 — `basic` 은 vitest 3 에서 폐기되고 4 에서
제거됐다. `--reporter=default`(또는 `dot`)를 쓰라. 파이프로 `tail` 만 보면 `Startup Error` 첫 줄이
잘려 더 헷갈린다 — **실패를 만나면 `head` 로 먼저 보라.**

### ⚠️ `verify:docs` 에는 모드가 **하나뿐이다** — 소비처 대조 모드는 걷어냈다

**지금 강제하는 것**: 저장소 내부 경로·줄인용·파트·부재·드리프트·내용소실. **심볼은 강제하지 않고 「미검증」으로 집계**한다 — 소비처 심볼과 구분할 수단이 없기 때문이다.

**걷어낸 것**: `AFDS_CONSUMER_ROOT` 를 주면 심볼과 소비처 경로까지 강제하던 모드가 있었다(#234 · #209).

**근거는 「강제력이 0 이었다」다.** CI 가 그 변수를 설정한 적이 없다 — 워크플로 전체 grep 0건. 그 모드가 내던 실패 전수를 갈라 보니 **죽은 인용은 0건**이었고, 대조 가능한 13건은 **두 번째 모드를 두는 것이 아니라 지금 도는 검사의 탐색 공간을 넓히는 것이 같은 값을 게이트 안에서 준다**는 판정이 됐다(부류 분류는 소비자 레인 판정 — 이 문서가 재측정하지 않았다).

**잃은 것은 「소비처 경로·심볼 강제」이고, 손실이 아닌 이유는 그것이 CI 에서 한 번도 돌지 않았다는 것이다.** 로컬에서만 돌 수 있는 검사는 게이트가 아니다(§8 「검사가 실패할 수 있는지 확인해라」).

**그 자리를 무엇이 메우는가 — 「없어졌다」만 남기지 않는다.** 소비처가 실제로 받는 것의 정합은 **`verify:exports`** 가 진다. 그것은 작업 트리를 보지 않고 **`npm pack` 으로 실제 tarball 을 만들어 풀고 그 안에서 진입점을 `import()` 한다.** 실효 사례: 배포된 `./compositions` 엔트리가 `MODULE_NOT_FOUND` 여서 **컴포지션 23종이 npm 채널에서 도달 불가**였던 것을 그 검사가 잡았다(#106).

**차이가 요점이다** — 걷어낸 모드는 **소비처 저장소의 문서 인용**을 봤고, `verify:exports` 는 **소비처가 받는 패키지 자체**를 본다. 후자가 게이트 안에 있다.

**필요해지면 두 번째 모드를 다시 만들지 말고 지금 도는 검사의 탐색 공간을 넓혀라.**

#### 모드가 사라져도 남는 교훈 셋

**① 「같은 검사의 두 설정」처럼 보이는 것이 실은 분모가 다른 두 검사일 수 있다.** 그 모드는 강제 범위만 다른 것이 아니라 **세는 대상이 달랐다.** 실측(`7cb7228` · `base-ui-coverage-audit.md` 한 문서):

```
설정 없음   경로  99 · 줄인용 134 · 미검증 62
설정 있음   경로 125 · 줄인용 139 · 미검증 18
```

그래서 **「실패 N」이 두 설정 사이에서 대조되지 않았다** — 「N 이 줄었다」가 검사가 나아진 것인지 분모가 줄어든 것인지 가릴 수 없다. **어느 설정으로 쟀는지 함께 적어라**는 것이 이 문서가 반복하는 규율의 **구조적 판본**이다. 관련: #192.

**② 실패를 목록이 아니라 범주로 적어라.** 그 모드의 실패 53건(측정 `7cb7228`)을 갈라 보니 죽은 인용은 0건이고 전부 여덟 범주였다 — 외부 도구 문자열·오류코드 · 셸 변수와 tsconfig 옵션 · 환경변수와 npmrc 키 · 독자가 만들 설정 파일 · npm 서브패스 · 중괄호 자리표시자 · **축약된 파일명**(인용 위생 문제다) · **명령 조각과 오류 메시지**(추출기 결함이다). **항목이 늘어도 범주는 안 늘고, 범주 밖의 실패가 나오면 그것이 신호다.**

**③ 이 문서는 자기 검사 대상이다 — 백틱 인용을 하나 더하면 검사 대상이 하나 늘어난다.** 그래서 **범주를 설명하려고 그 범주의 식별자를 백틱으로 적으면 설명이 곧 검사 대상이 된다.** 실측: 위 범주를 백틱 예시와 함께 적었을 때 이 문서의 실패가 12 → 25 로 올랐고, 백틱을 걷으니 14 였다. **수치는 본문이 확정된 뒤 마지막에 한 번 재서 적어라** — 쓰는 중에 재면 자기가 만든 값을 센다. **편집하면서 배경으로 재면 도구가 중간 상태를 읽는다**(실측: 그렇게 나온 값이 최종값과 달랐다).

> **철거는 이 절을 지우는 것이 아니라 다시 쓰는 것이었다.** #236 이 고칠 자리 **여섯**을 미리 표로 세워 뒀고 그대로 처리했다. **`#235` 는 미리 과거형으로 바꾸지 않았다** — 그 시점에 여섯 다 참이었으므로 미리 바꾸면 그 문서가 그날 거짓이 된다. **없어진 것을 현재형으로 말하는 것과 아직 있는 것을 과거형으로 말하는 것은 같은 결함의 두 방향이다.**

### ⚠️ **머지가 삭제하는 파일을 인용하면 PR CI 는 통과하고 머지 순간 거짓이 된다**

**실측 — 이 문서가 `main` 을 한 번 붉혔다.** §9 의 빈 changeset 함정을 적으면서 **자기 changeset 파일명을 산문에 백틱으로** 인용했다. 머지 시 릴리스가 그 changeset 을 소진하고, **산문의 백틱은 경로 인용으로 추출되므로** 그 순간 실패가 됐다:

```
verify:docs EXIT=1
★ 경로 미확인: .changeset/<이 PR 의 changeset>
```

**PR 시점에는 파일이 있으므로 로컬·CI 어디서도 재현되지 않는다.** 앞선 두 사례는 코드 블록 안에 적혀 있어 추출되지 않았고 **세 번째만 산문이었다 — 형식이 갈린 것이 원인이다.** 코드 블록 안의 표기는 인용으로 추출되지 않는다.

**「지워진 것을 인용하면 게이트가 영구히 못 찾는다」와 같은 부류인데 시점이 다르다** — 삭제가 **머지 자체로** 일어난다. 그래서 처방도 다르다:

**머지 전에 「인용한 경로 중 이 머지가 삭제할 것이 있는가」를 따로 확인해라** — 특히 `.changeset/` 아래. `verify:docs` 가 통과한 것은 그 질문에 답하지 않는다.

> **⚠️ 그리고 이 규칙이 「없어진 것을 이름으로 부르지 마라」로 읽히면 안 된다.** 무엇을 걷어냈는지 **서술하려면 그 이름을 써야 한다** — 이 문서의 §7 이 걷어낸 환경변수를 백틱으로 부르는 것이 그렇다. 결함은 **이름을 부르는 것**이 아니라 **아직 있는 것처럼 부르는 것**이다. 과거형 서술은 남겨라.

### ⚠️ fail-closed 는 **측정을 오염시킨다** — 「전부 관련 있음」이 판정처럼 보인다

`ci-detect-changes.sh` 는 **판정할 수 없으면 전부 실행**으로 넘어진다(설계 원칙이고 옳다). 그런데 그 스크립트에 **입력을 잘못 주면** 같은 경로를 타서 **모든 축이 `true`** 로 나온다 — 그것이 「관련 있다고 판정했다」와 **출력이 구별되지 않는다.**

**실측: 두 레인이 독립적으로 같은 함정을 밟았다.** 하나는 파일 목록을 stdin 으로, 하나는 env 로 주려 했다 — 그 스크립트는 **git diff 를 읽는다.** 둘 다 「전부 관련 있음」을 받았고, **`.changeset/` 아래 파일까지 `true` 가 나오는 것이 이상함의 신호**였다(그 경로는 무관 목록에 있다). 정본 방법으로 바꾸니 값이 갈렸다.

**fail-closed 스크립트를 재려면 「무관으로 판정돼야 하는 입력」을 대조군으로 넣어라.** 그것이 `true` 로 나오면 판정이 아니라 **fail-closed 를 재고 있는 것**이다.

### ⚠️ 관측한 것이 관측하려던 것인가 — 오독 여섯 형태

전부 이 저장소 실측이다. **형태로 적는다** — 사례는 늘어나도 형태는 늘지 않는다.

| 형태                | 무엇이 일어나는가                                                                                                                                                                                                   |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **입력이 없다**     | 돌연변이를 심었는데 뒤 단계가 지웠다. `generate:registry` 는 `tsx … && prettier --write ../../registry.json` 로 포맷터를 체인한다 — 포맷만 건드린 돌연변이는 산출물에서 사라지고 `exit 0` 을 「안 잡는다」로 읽는다 |
| **출력이 잘린다**   | `head`/`tail` 로 자른 뒤 없는 것을 「0건」으로 읽는다. **실패를 만나면 `head` 로 먼저 보라**(위 리포터 절)                                                                                                          |
| **대상이 다르다**   | 브랜치에 **있는** 것 ≠ 브랜치가 **더한** 것(grep 만 하고 diff 를 안 본다) · 워크트리가 낡았다 · 워크플로만 보고 build 경유 배선을 놓친다                                                                            |
| **표현이 다르다**   | ANSI 이스케이프가 정규식을 비켜 간다 · 인용한 이름이 실제와 다르다                                                                                                                                                  |
| **분모가 다르다**   | 요약 줄까지 위반으로 센다 · 두 규칙 집합을 하나로 읽는다 · 발생 횟수와 서로 다른 문자열을 섞는다                                                                                                                    |
| **도구가 더한다**   | `eslint --rule` 은 기존 규칙을 **대체하지 않고 더한다**                                                                                                                                                             |
| **인자가 변형된다** | **셸이** 인자를 바꾼 뒤 도구가 **변형된 문자열로** 오류를 낸다 — 오류를 그대로 읽으면 도구·대상을 의심하고 원인을 못 본다(아래 절)                                                                                  |

**처방**: 종료코드를 1차 신호로 삼되 그것만 믿지 않는다 · 돌연변이는 심은 뒤 `md5`/`diff` 로
**심겼는지 먼저 확인**한다 · 출력을 자르지 않는다 · **수치에는 분모와 기준 커밋을 붙인다.**

### ⚠️ 측정 환경이 대상과 다르면 **대상의 결함으로 보인다**

넷 다 이 저장소 실측이다. 공통 형태는 **도구는 정상이고 대상도 정상인데 결과가 결함을 가리킨다**.

| 무엇이 달랐나                  | 무엇처럼 보였나                           | 무엇이 사실이었나                                          |
| ------------------------------ | ----------------------------------------- | ---------------------------------------------------------- |
| 워크트리가 낡음                | 대상 PR 이 파일을 안 고쳤다               | 고쳤고, 재는 트리가 그 커밋을 몰랐다                       |
| `PyYAML` 미설치                | 워크플로 검사가 통과                      | 검사가 애초에 돌지 않았다                                  |
| `/tmp` 에서 `prettier` 실행    | 포맷이 불안정하다(YAML 인용부호가 바뀐다) | 저장소 설정을 못 읽어 기본값으로 돌았다                    |
| `require.resolve('yaml')` 실패 | 파서가 아무 핀도 못 읽는다                | 스위트와 같은 `.pnpm` 경로를 주니 **7건**                  |
| 프로브 파일이 **미추적**       | 릴리스가 아무 파일도 안 바꾼다            | 실제로는 추적 파일 1건 삭제 — 그것이 가드를 통과시킨다(§9) |

**「대상이 잘못됐다」는 결론이 나오면 먼저 재는 쪽을 의심한다.** 넷 중 셋은 리뷰 레인이 작성
레인의 결함으로 보고할 뻔한 것이었다. 재현 명령에 **대상 커밋 해시와 설정 경로를 함께
적으면** 이 형태가 대부분 드러난다.

**★ 변종 — 도구가 기동조차 못했는데 「변화 없음」으로 읽힌다.** 실측: 빈 changeset 이 무범프인지
재려고 `node node_modules/.bin/changeset` 을 돌렸는데, 그 파일은 **셸 래퍼**라 `node` 가
`SyntaxError` 로 죽었다. 버전이 안 움직였으므로 출력은 「무범프 확인」과 **구별되지 않는다.**
적발한 것은 **대조군**이다 — `patch` changeset을 넣은 대조군도 같이 안 움직여서, 「측정이
없었다」가 드러났다.

**이것이 이 절의 가장 위험한 형태다 — 실패가 기대한 결과와 같은 모양이었다.** 대조군이 없으면
**틀린 결론을 근거와 함께** 보고한다.

### ⚠️ 대조군이 통과해도 **패턴 집합이 완전하다는 증명은 아니다**

**대조군이 통과하는데도 틀리는 유일한 경로**다. 사례가 둘이고 형태가 같다.

| 무엇을 셌나                         | 잔여 | 실제                                         | 대조군은 |
| ----------------------------------- | ---- | -------------------------------------------- | -------- |
| 개명 후 옛 이름 `grep` (#164)       | 0건  | 남아 있었다 — 텍스트가 **개명된 이름**이었다 | 통과했다 |
| 렌더 중 ref 쓰기 정규식 (#229 리뷰) | 0건  | **2건** — `fade-swap.tsx:42,50`              | 통과했다 |

둘째는 이렇게 틀렸다. 패턴을 **2칸 들여쓰기로 앵커**했는데 `fade-swap` 의 쓰기는 `if` 블록
안이라 4~6칸이다. 대조군으로는 그 커밋에서 **고쳐질 그 한 줄**을 잡았으니 「탐지기가 동작한다」는
증명됐다 — 그런데 그것이 증명한 것은 **동작**뿐이고 **범위**가 아니다.

**대조군은 「방법이 신호를 낼 수 있는가」를 증명한다. 「그 방법이 이 패턴의 모든 형태를
보는가」는 증명하지 않는다.** 후자는 **다른 도구로 같은 것을 세서** 교차 확인해야 한다 —
위 사례에서 실제로 적발한 것은 손으로 쓴 정규식이 아니라 `react-doctor` 였다.

**그리고 이 형태는 그 교훈을 담은 PR(#227 — 「앵커를 조이면 형태를 놓친다」)을 리뷰한
직후에 밟혔다.** 방금 읽은 교훈도 막아 주지 않는다.

### ⚠️ 신호가 없는 것과 호출자가 접는 것은 다르다

둘 다 「두 상태를 구분할 수 없다」로 보이지만 고칠 곳이 다르다.

|                     | 사례                                                                         | 고칠 곳                                                                                 |
| ------------------- | ---------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| **신호가 없다**     | `Dirent` 의 `isDirectory()`·`isFile()` 이 **심볼릭 링크에서 둘 다 false** 다 | 판정을 **더 얻어 와야 한다** — `statSync` 로 대상을 따라가 분류한다                     |
| **호출자가 접는다** | `cmp` 는 **동일 0 · 차이 1 · 부재 2** 로 이미 구분해 준다                    | **받는 쪽을 고친다** — 참/거짓으로만 쓰면 `if cmp -s A B` 에서 **부재가 차이로 읽힌다** |

`cmp` 쪽은 **신호가 있는데 버리는 것**이므로 도구를 바꿀 필요가 없다(다만 트리 비교는
`diff -rq` 가 읽기 쉽다). `Dirent` 쪽은 도구가 답을 갖고 있지 않아 **한 번 더 물어야 한다.**

> 이 구분 자체가 **위 「저자들이 밟은 횟수」의 여섯째**다. 이 갱신의 스펙이 `cmp` 를
> 「부재와 차이가 같은 종료코드」로 적었는데 실측은 1 과 2 다 — **기제가 반대**였다.

### ⚠️ 워크트리 저장소에서 `git checkout <branch>` 는 **자주 실패한다** — 이어진 명령이 이전 브랜치에서 돈다

`git checkout main` 은 **다른 워크트리가 그 브랜치를 잡고 있으면 실패한다.** 우리는 레인마다
워크트리를 쓰므로 **`main` 은 거의 항상 누군가 잡고 있다** — 드문 사고가 아니라 **기본 상태**다.

**실패를 확인하지 않고 다음 명령을 이으면 그것이 이전 브랜치에서 실행된다.** 이 세션에서 세 번
났고 **세 번 다 원격에 push 해 둔 덕에 살았다**:

```
checkout 실패 → reset --hard origin/main   작업 브랜치가 되돌아간다 (2회)
checkout 실패 → diff / grep                남의 브랜치 변경을 자기 것으로 읽는다 (1회)
```

**처방**: 브랜치를 **`origin/<name>` 에서 직접 만든다**(`git checkout -B x origin/main`) · `&&`
로 잇는다 · 실패하면 중단한다.

> **`||` 는 처방이 아니다.** `checkout A || checkout B` 는 대안이 성공하면 **실패가 삼켜진다** —
> 그 상태로 이어진 `diff` 가 엉뚱한 브랜치를 읽은 사례가 있다. 「종료코드를 봤으면 결과물도
> 봐라」의 특수형이고, **원인이 워크트리라는 것이 이 저장소에 특유하다.**

### ⚠️ `zsh` 는 `"$VAR:r..."` 의 `:r` 을 먹는다 — `git show <ref>:<path>` 가 그 위에 있다

zsh 는 **중괄호 없는 파라미터 확장에 히스토리 수정자**(`:r` `:h` `:t` `:e` `:a` `:A` `:l` `:u`)를
적용한다. `:r` 은 「확장자 제거」다. 그래서 이 저장소에서 가장 흔한 형태가 조용히 깨진다:

```
$ echo "$SHA:registry.json"        → 386e…afd0af**egistry.json**   ← `:r` 이 먹혔다
$ echo "${SHA}:registry.json"      → 386e…afd0af:registry.json     ← 정상
$ echo "$SHA:package.json"         → …af:package.json              ← `:p` 는 수정자가 아니라 무사하다
```

**증상이 원인을 가린다.** `git cat-file -e "$TAG:registry.json"` 은 이렇게 실패한다:

```
fatal: Not a valid object name @turbo-project/afds@1.0egistry.json
```

**없는 것은 내가 넘긴 것이 아니라 셸이 만든 것**이다. 태그 이름에 `@` 가 있어 git 이 망가뜨린
것으로 읽히지만(그 방향으로 오진한 사례가 있다) **SHA 로 바꿔도 같게 깨진다** — 원인은 ref 가
아니라 `:r` 이다. 그리고 **경로가 `r` 로 시작할 때만** 나타나므로 `package.json` 으로 시험하면
재현되지 않는다.

**이 저장소의 흔한 파일 이름 셋이 각각 다른 수정자에 걸린다**(실측):

```
$SHA:registry.json  → …afd0af**egistry.json**   `:r` 확장자 제거
$SHA:harness.md     → **.arness.md**            `:h` dirname  ← 이 문서 자신이다
$SHA:tokens.css     → …b13b09**okens.css**      `:t` basename
$SHA:package.json   → …b13b09:package.json      무사(`:p` 는 파라미터 수정자가 아니다)
```

**처방: 파라미터를 감싼다** — `git show "${ref}:registry.json"`. `refs/tags/` 정규화나 SHA
해소로는 고쳐지지 않는다.

> **재현 실패를 반증으로 쓰지 마라.** 이 함정은 **경로가 그 글자로 시작할 때만** 나타나므로
> `package.json` 으로 시험하면 「어? 되는데」가 나와 **틀린 진단이 강화된다.** 실제로 그렇게
> 강화됐다 — 한 레인이 「재현되지 않았다」고 보고했는데 그 시도는 **리터럴 작은따옴표**를 써서
> 파라미터 확장이 아예 없었다(수정자가 붙을 자리가 없다). **반증될 수 없는 방법이었다.**
> 재현 실패를 근거로 쓰기 전에 **내 재현 방법이 그 조건을 만족하는가**를 확인해라 — 「대조군은
> 방법이 동작함을 증명하고 단정이 무는지는 증명하지 않는다」의 **재현 쪽 짝**이다.

### ⚠️ diff 규모는 `merge-base` 기준으로만 적어라 — `A..B` 는 상대가 앞서가면 거짓이 된다

**이 저장소에서 세 레인이 각각 같은 착각을 했다.** 개인 실수가 아니므로 규칙으로 적는다.

`git diff origin/main..HEAD` 의 `..` 는 **두 끝점을 비교한다** — `origin/main` 이 내 분기 이후로 앞서갔으면 그 커밋들의 변경이 **역방향으로 섞여 들어온다.** GitHub 의 PR 화면은 그렇게 세지 않는다. PR 은 **merge-base 기준**이다. 그래서 「PR 은 1파일인데 로컬은 41파일」 같은 어긋남이 나온다.

실측(브랜치 `89f049a`, 분기점 `09809c7`, 그 사이 `origin/main` 이 `112322f` 까지 6커밋 전진):

```
git diff origin/main..89f049a  --shortstat   →  76 files changed, 718 insertions(+), 122 deletions(-)
git diff origin/main...89f049a --shortstat   →   2 files changed, 267 insertions(+),  12 deletions(-)
git diff $(git merge-base origin/main 89f049a)..89f049a  →  같은 2파일 (merge-base = 09809c7)
```

`two-dot` 에만 있는 74파일은 **내가 건드리지 않은 것들**이다 — `.nvmrc` · `apps/storybook/CHANGELOG.md` · `packages/afds/package.json` 처럼 그 6커밋이 바꾼 파일이 역방향으로 나타난다.

**쓸 것:** `git diff origin/main...HEAD`(**세 점**) 또는 `git diff $(git merge-base origin/main HEAD)..HEAD`. `--stat` 수치를 PR 본문·보고서에 옮길 때는 **어느 쪽으로 셌는지** 함께 적어라.

> **`fetch` 가 이 함정을 켠다 — 그래서 「갑자기 늘었다」로 보인다.** merge-base 는 `main` 이 앞서가도 **움직이지 않는다**(실측: `merge-base(09809c7, 89f049a)` = `merge-base(112322f, 89f049a)` = `09809c7`). 그래서 **세 점은 `fetch` 여부와 무관하게 2파일**이다. 뒤집히는 쪽은 두 점이다 — 로컬 `origin/main` 이 낡았을 때는 **우연히 맞고**(2파일), `fetch` 한 뒤에야 틀린다(76파일). 코드는 그대로인데 숫자가 커지므로 **내 변경이 커진 것으로 오독하게 된다.**

### ⚠️ 상한이 있는 도구는 상한에 닿는 순간 조용히 거짓말한다

`gh issue list` 의 기본 `--limit` 은 **30** 이다. 넘으면 잘라내고 **경고도 종료코드도 없다.**

실측(2026-09-02, `FlaSh2493/turbo-project`):

```
gh issue list --state closed --json number --jq length               →  30   ← 상한값
gh issue list --state closed --limit 200  --json number --jq length  →  37
gh issue list --state closed --limit 1000 --json number --jq length  →  37
gh api -X GET search/issues -f q='… is:issue is:closed' --jq .total_count  →  37
```

**가장 고약한 성질:** 참값이 상한보다 작으면 **정상으로 보인다.** 같은 시점에 **열린** 이슈는 기본 호출도 `--limit 200` 도 **둘 다 17** 이다(17 < 30). 그래서 「전에는 맞았는데」가 성립하고, 값이 상한에 도달하는 순간부터 조용히 틀린다.

**쓸 것:** 개수를 세는 호출에는 **항상 `--limit` 을 명시**하고, 가능하면 **다른 경로로 대조**하라(위에서는 `search/issues` 의 `total_count`). 「30」·「100」 처럼 **딱 떨어지는 값이 나오면 상한을 의심하라** — 세어진 수가 아니라 잘린 수일 수 있다.

---

## 8. 새 검사를 추가할 때

1. **무엇을 보호하는지 한 문장으로 쓴다.** 그 문장이 실제 단정과 다르면 검사가 거짓말한다.
2. **돌연변이를 심어 잡히는지 확인하고, 어느 단정이 잡았는지까지 본다.** 대조군도 함께.
3. **기존 위반 수를 먼저 센다.** 0건이면 하드 게이트, 있으면 래칫이 필요하다.
4. **래칫이면 면제 목록이 조용히 자라지 못하게 한다** — 목록에 항목을 더하는 것 자체가 실패해야 하고, 위반이 해소되면 목록에서 빠져야 통과해야 한다(단조 감소).
5. **CI 에 배선하고 `ci-structure` 에 등록한다.** 배선하지 않은 검증은 없는 검증이다.
6. **검사 대상 집합이 좁다는 사실도 검사한다.** 대상이 좁아지는 것을 아무도 안 보면 검사는 통과하면서 아무것도 지키지 않는다.

번호 목록 **맨 앞**에 넣는다:

0. **같은 개념이 이미 다른 자리에 있는지 먼저 찾아라.** 있으면 새 정책이 아니라 **누락된
   적용**이고, 그때는 **범위를 맞추는 것이 변경의 본체**다. 이 저장소에서 그 형태가 반복됐다 —
   공유 eslint 설정 ↔ 로컬 override · 셸 축 ↔ vitest 축(게이트 목록이 한쪽에만) · job 레벨
   `continue-on-error` ↔ 스텝 레벨 · 피호출 워크플로 가드 ↔ `ci.yml` 의 `ALWAYS_JOBS` ·
   **의존 방향(afds-registry → afds)이 관련성 판정기에 반영되지 않은 것**(afds 만 바꾼 PR 에서
   afds-registry 의 lint·정합·validate 가 안 돌던 구멍 — `pnpm -r --if-present test:run` 재귀 호출이
   vitest 만 우연히 절반 덮고 있었다).

### 픽스처를 쓸 때

**① 예상을 측정 전에 파일로 적고 실측을 나란히 붙여라.** 「틀릴 수 있는 자리」도 함께.
**맞은 것보다 틀린 것에서 더 배운다** — 규칙 문서 하나를 「dot-notation 예시가 있으니 2~5건
실패」로 봤는데 실측은 **0** 이었다(파트 인용 12건이 전부 통과했다). 「예시가 있다」와 「그 예시가
실패한다」는 다르다.

**② 돌연변이를 닫은 뒤 그 처방에 같은 돌연변이를 반대 방향으로 돌려라.** `[<>]`→`[<]` 생존을
한쪽 꺾쇠 입력으로 닫았더니 `[>]` 가 생존했다 — **처방이 재발을 만들었다.**

**③ 픽스처 결함 네 종류 — 넷 다 픽스처가 존재하고 통과하는 상태였다.**

|                           | 무엇                                                                                |
| ------------------------- | ----------------------------------------------------------------------------------- |
| 분기가 발동하지 않는 입력 | 후보를 2건으로 써서 「정확히 1건」 분기가 안 돌았다                                 |
| 다른 규칙에 가려진 입력   | 꺾쇠 입력만 써서 확장자 필터를 지워도 결과가 같았다                                 |
| 대표성 없는 대조군        | `<x>/<y>.ts` 류라 하이픈 과차단이 안 드러났다(실제 경로는 대부분 하이픈을 포함한다) |
| 한쪽만 고정하는 경계      | 짝 꺾쇠만 있어 `<` 만 봐도 다 걸렸다                                                |

**④ 판정에 결합하고 출력 문자열에 결합하지 마라.** 검사기 출력을 단정하면 메시지를 고칠
때마다 테스트가 깨진다. 판정 타입(`PathVerdict` 같은 것)에 결합하면 메시지 변경과 독립이다.

### 검사의 각 축을 어디에 두는가

**검사의 각 축을 자기 입력이 있는 곳에 둔다.** 조건부 잡에 둘 수 있는 축은 **자기 입력의 변경이 그 잡을 켜는** 축뿐이다.

**「검사 하나」 단위로 판단하면 이 판정을 할 수 없다** — `verify:docs` 가 그 예다. 두 축의 입력 결합이 정반대다:

| 축                     | 무엇 때문에 깨지나                                                                                     | 입력↔잡 결합 | 어디에 둬야 하나   |
| ---------------------- | ------------------------------------------------------------------------------------------------------ | ------------ | ------------------ |
| **문서 인용**          | **소스가 하나도 안 바뀌어도 깨진다** — 릴리스가 changeset 을 소진하면 인용 경로가 사라진다(위 §7 사고) | **없다**     | **무조건 실행**    |
| **문서 import 진실성** | afds 의 export 표면이 바뀌어야 깨진다 — 그 변경은 afds 잡을 켠다                                       | **있다**     | 조건부로 둬도 된다 |

두 축은 구현에서도 갈려 있다(실측 `f47b4a0`): import 축은 빌드 산출물을 실제로 `import()` 하므로 **`pnpm build` 를 요구**하고(`빌드 산출물이 없다 … 먼저 pnpm build`) **문서 목록과 무관하게 항상 전수로 돈다**. 인용 축은 산출물을 보지 않는다.

**⚠️ 구멍의 형태가 둘이다 — 「트리거가 문서를 제외한다」로 읽으면 절반만 맞다.** 실측: 이 사고를 처음 읽은 두 사람이 그렇게 읽었다.

| 문서                                                 | 어떤 잡이 켜지나                                              | 왜 검사가 안 도나          |
| ---------------------------------------------------- | ------------------------------------------------------------- | -------------------------- |
| `docs/info/harness.md`                               | **아무것도** — 관련성 판정이 `docs/*`·`*.md` 를 무관으로 본다 | 잡이 없다                  |
| `packages/afds-registry/README.md` · `docs/GUIDE.md` | **`afds-registry-test` 는 돈다**                              | **그 검사가 그 잡에 없다** |

**둘째 형태가 요점이다** — 잡은 돌고 있는데 검사가 다른 잡에 산다. 「트리거를 넓히면 된다」로 처방하면 그 셋 중 둘에 듣지 않는다.

**★ 그리고 이 결합이 「지연」과 「전가」를 가른다.** 결합이 있는 축은 **원인 변경이 자기 검사를 켜므로** 늦게 잡혀도 원인 PR 에서 잡힌다 — 지연이다. **결합이 없는 축은 원인 PR 이 아닌 남의 PR 에서 터지고, 잡는 사람은 원인을 모른다** — 전가다. 실측: 위 §7 사고를 잡은 사람은 **다른 PR 을 머지하려던 레인**이었고 실패를 자기 PR 의 문제로 보고 로그를 뒤졌다.

**그러므로 관련성 판정 스크립트의 「검사가 전수이므로 다음 PR 에서 잡힌다 — 유실이 아니라 지연이다」는 결합이 있을 때만 참이다.** 그 논거를 쓰는 자리마다 **그 축의 입력이 그 잡을 켜는가**를 먼저 답해라.

**★ 관련성 스크립트가 이미 그 원리를 한 경로에 적어 뒀다.** `.claude/rules/*` 를 afds 관련성에 넣은 주석이 **「`.claude/*` 를 무관으로 분류한 것이 맞았던 것은 그 경로를 읽는 검사가 없었을 때까지다」**라고 쓴다. **한 경로에 그 논리를 적용하고 나머지에 적용하지 않은 것**이 이 구멍이다 — 「누락된 적용」의 가장 순수한 형태다.

**이것은 「배선하지 않은 검증은 없는 검증이다」(§설계 원칙 · 위 항목 5)의 한 단계 아래다.** 배선은 돼 있다 — **입력이 자기 잡을 켜지 않는다.** 그 문장을 대신하지 않고 그 아래 단계로 붙인다.

**★ 실측 — 이 절을 쓴 PR 의 체크 목록에 그 구멍이 찍혀 있다.** 이 문서만 바꾼 PR 이라 인용 축이 사는 잡이 건너뛰었다:

```
gate pass · changes pass · format pass · scripts-test pass
afds       skipping     ← 인용 축이 이 잡에 있다
afds-registry   skipping
```

**즉 구멍을 문서화하는 변경이 그 구멍 안에 있었고, CI 는 그 변경이 바꾼 문서에 대해 아무것도 검증하지 않았다.** 「전부 초록」은 「문서가 맞다」는 뜻이 아니다 — **무엇이 돌았는지 보라.**

**문언은 판단으로 남기고, 기계로 지킬 수 있는 한 조각은 검사가 진다** — 「인용 축 스텝이 `if:` 없는 잡에 있는가」는 셸 스위트가 단정할 수 있다. 「기계화하지 않는다」로 끝내면 그 배치가 조용히 되돌아간다.

#### 잔여 — 「전부 닫았다」가 아니다

축을 쪼개도 남는 것이 있다. 실측(`f47b4a0`): **`verify:docs` 가 사는 잡을 켜지 않는** 문서 3건의 **afds import 문**은

```
docs/info/harness.md              0건
packages/afds-registry/README.md       0건   (import 4건은 vite·react 예시다 — 축의 분모가 다르다)
packages/afds-registry/docs/GUIDE.md   1건 — :93  ★ 잔여
```

**`GUIDE.md:93` 의 import 축은 여전히 자기 잡을 켜지 않는다.** 다만 그것은 **결합이 있는 축**이므로(afds export 표면이 바뀌어야 깨진다) 위 논거로 **지연이지 전가가 아니다** — 그래서 남긴다. **「전부 닫았다」로 쓰면 거짓이다.**

### 측정 규율

- **검사가 실패할 수 있는지 확인해라.** `warn` + 상한 없음은 검사가 아니다 — `packages/afds` 는
  `eslint .` 로 **경고 124건에 종료코드 0** 이었다(측정 `7cb7228`) — afds 는 지금 `lint-ratchet` 이 그 경고를 동결한다.
- **같은 대상을 두 자리에서 말하지 마라.** 다음 사람이 둘 중 하나만 읽는다. 이 문서 자신에도
  적용된다 — 새 절을 만들기 전에 그 대상을 이미 말하는 절이 있는지 봐라.
- **한 값이 낡았으면 같은 값을 인용한 다른 자리도 낡았다 — 그리고 같은 줄의 옆 값도 낡았다.**
  이 문서의 갱신에서 세 단계로 드러났다: ①한 행이 다른 절과 어긋났다 ②같은 값을 인용한 **다른
  자리**가 낡아 있었다 ③한 값을 고치면서 **같은 줄의 옆 값**을 놓쳤다. **그 값을 `grep` 해서
  전수를 보라** — 한 자리를 고친 것으로 끝났다고 보지 마라. 우연한 숫자 충돌이 섞이므로 문맥을
  함께 읽어야 한다.
- **같은 목록을 두 방법으로 세면 값이 갈린다 — 무엇이 항목인지 먼저 정해라.** 실측: 게이트 목록을
  `grep -c '\.test\.ts'` 로 세면 **19**, 항목 형식(`"경로|이유"`)으로 세면 **18** 이다. 차이는
  **「넣지 않은 이유」를 적은 주석 한 줄이 파일명을 담고 있기 때문**이다. 그 주석은 좋은 주석이므로
  지우지 말고, **세는 쪽이 항목만 세라.** §8 의 「비교하는 두 값은 같은 방법으로 뽑아라」와 같은 부류다.
- **`0건` 은 세 종류다** — ①찾았는데 없다(근거) ②검사 방법이 못 본다(근거 아님) ③검색 공간이 없다(아무것도 안 셌다). 셋 다 `0` 을 출력한다. 어느 쪽인지 밝혀라.
- **파이프 끝의 종료코드는 앞 명령 것이 아니다.** `cmd | grep` 의 `$?` 는 `grep` 것이다.
- **종료코드는 양방향으로 거짓말한다.** `0` 인데 아무 일도 안 한 경우와 `1` 인데 결과가 남은 경우가
  둘 다 있다. 전자는 위 §6 의 `tsc --noEmit` 0파일, 그리고 `packages/afds-registry/README.md` 가 표로
  정리한 `shadcn` 세 경우다. 후자는 다른 레인이 관측했다 — 커밋·push 가 둘 다 `EXIT=1` 인데 커밋이
  남아 있었고, 같은 브랜치에 다른 세션이 쓴 것으로 보인다. **`git` 메타데이터로는 어느 세션이
  만들었는지 판별할 수 없다**(author·committer 가 같다). 내가 격리한 것이 아니므로 기제는 미확인으로
  둔다. **종료코드를 봤으면 결과물도 봐라.**
- **비교하는 두 값은 같은 방법으로 뽑아라.**
- **diff 규모는 `merge-base` 기준으로만 적어라.** `git diff origin/main..HEAD` 는 상대가 앞서가면
  그 변경을 역방향으로 끌고 들어온다(위 §7 실측: 같은 브랜치가 76파일 vs 2파일). 세 점을 쓰라.
- **상한이 있는 도구는 상한에 닿는 순간 조용히 거짓말한다.** 딱 떨어지는 수(30·100)가 나오면
  잘린 수를 의심하고 `--limit` 을 명시해 다른 경로로 대조하라(위 §7 실측: 닫힌 이슈 30 vs 37).
- **대조군은 방법이 동작함을 증명하고, 패턴 집합이 완전함을 증명하지 않는다.**

---

## 9. 알려진 한계

|                             | 무엇                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| --------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| #167 (닫힘)                 | **대상은 넓혔다**(문서 2건 → 14건). 남은 한계는 **그 목록에 강제 장치가 없다**는 것이다 — 새 문서를 등재하지 않아도 아무것도 실패하지 않는다(위 §9 ① 의 실측 사례). 코드 주석은 여전히 대상 밖                                                                                                                                                                                                                                                      |
| #170                        | 게이트 목록은 `test-gates` 가 이름으로 덮었다. **남은 한계는 목록 자체다** — 새 게이트를 목록에 적는 것도, 항목을 빼는 것도 기계가 막지 못한다 (diff 가 방어)                                                                                                                                                                                                                                                                                       |
| #160 (①만 해소)             | **①(앵커 탓에 혼합 문자열을 놓치는 것)은 `arbitrary-token-ratchet.test.ts` 래칫이 막는다**(위 §3 afds-registry 절) — ESLint 셀렉터 자체는 손대지 않았다. **남은 한계**: bricks 안의 순수 hex 리터럴(브래킷 밖)은 ESLint·래칫 어느 쪽도 안 본다(`packages/afds/eslint.config.js` 가 `src/bricks/**` 에서 공유 셀렉터를 재정의해 대체하기 때문)                                                                                                       |
| (후속 — 조직 결정으로 보류) | **`main` 직접 push 차단은 로컬 두 겹뿐이다.** `lefthook.yml` pre-push 가드는 `git push --no-verify`(`release.yml` 이 쓰는 형태)와 훅 미설치 클론이 우회하고, `.claude/settings.json` deny 는 Claude 의 Bash 호출에만 적용된다 — 사람이 터미널에서 치는 명령, 그리고 `git -C . push origin main`·`/usr/bin/git push …`·`bash -c '…'` 처럼 규칙 접두와 모양이 다른 호출은 못 본다. 서버 강제는 ruleset(필수 PR) 이 필요하고 조직 결정으로 보류 중이다 |
| (후속 — 이슈 없음)          | **knip 의 `ignoreIssues` 는 낡은 항목이 조용히 통과한다** — 안 쓰는 `ignoreIssues` 항목은 config hint 가 나오지 않아 `--treat-config-hints-as-errors` 로도 exit 0 이다(W4 실측). 반면 낡은 `ignoreDependencies` 는 exit 1 이다. 이 비대칭 때문에 파일·종류 단위 예외는 스스로 낡았는지 알리지 못한다.                                                                                                                                               |
| (후속 — 이슈 없음)          | **knip `ignoreIssues` 의 파일 단위 `exports` 예외(40개)는 그 파일의 새 미사용 export 까지 덮는다**(재리뷰 실측: `labels.ts` 에 새 미사용 export 를 넣어도 exit 0). 심볼 단위 예외(`@public` 태그)는 후속                                                                                                                                                                                                                                            |
| (후속 — 이슈 없음)          | **기본 척도 경고의 PR 주석은 기준보다 늘어난 파일만 뜬다** — 기존 경고는 `default-scale-warnings.baseline.json` 에 묶여 찍히지 않는다. 한 PR 이 새 경고를 10건 넘게 만들면 GitHub 스텝당 주석 상한(10건) 때문에 뒤쪽은 로그에만 남는다 — `composition-new` 스킬은 `test` 출력에서 자기 경로를 찾게 한다. 줄였다가 옛 건수까지 다시 늘린 파일은 기준을 낮추기 전까지 조용하다                                                                        |
| #162                        | 컴포지션 테스트 보유 **11/23**                                                                                                                                                                                                                                                                                                                                                                                                                      |
| #192 (해소)                 | **한계가 아니라 제거됐다** — 소비처 대조 모드를 걷어냈다(#234). 남은 것은 **심볼을 강제하지 않는다**는 것이고 그것은 한계가 아니라 설계다(소비처 심볼과 구분할 수단이 없다) — 위 §7 참조                                                                                                                                                                                                                                                            |
| (후속 — 이슈 없음)          | `@turbo-project/figma-variables-exporter` 는 `test`(`vitest run`)만 있고 `test:run` 이 없다 — 그래서 이 패키지 테스트는 CI 어디서도 돌지 않고, `assert-script-owners.sh` 도 `test:run` 보유 패키지만 대조하므로 이 패키지를 보지 못한다(실측: `.github/` 전체에 `figma-variables-exporter` 인용 0건)                                                                                                                                                |
| (후속 — 이슈 없음)          | `secret-scan` 은 PR 이 `.gitleaks.toml`·`.gitleaksignore` 를 들여오면 그 설정으로 스캔 범위를 줄이거나 끌 수 있다 — 둘 다 `CODEOWNERS` 에 등록해 리뷰는 자동 요청되지만 ruleset 이 없어 강제(필수 리뷰)가 아니다. 커밋에 인라인 `gitleaks:allow` 주석을 넣는 것도 같은 효과이고, 이건 CODEOWNERS 로도 막지 못한다                                                                                                                                   |

**① 신뢰 경계 목록은 두 갈래이고 비용의 종류가 다르다.**

|                                 | 목록                                                                                                                              | 비용                                                                               |
| ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| **갱신을 강제하는 장치가 있다** | `fixtures` · `notPaths` · `expectAbsent` · `fixtureCites`                                                                         | 문서에서 사라지면 **「죽은 예외」로 실패**한다 → 비용은 **성장**이지 부패가 아니다 |
| **아무것도 덮지 않는다**        | `REF_PREFIXES` · `findByBasename` 루트 · `KNOWN_MISSING_TESTS` · `BASELINE_COMPOSITIONS` · 게이트 목록 · `run-all.sh` 스위트 목록 | **diff 가시성만이 방어**다 → **부패한다**                                          |

### main 보호를 켤 때 필요한 절차 (문서만 — 적용은 보류, 관리자가 직접)

보호가 없어 `gate` 가 빨개도·CODEOWNERS 가 있어도 머지된다. 켜려면 아래 순서다 — **`release.yml` 이 main 에 직접 push 하므로** 순서를 바꾸면 릴리스가 멈춘다.

1. **deploy key 등록**(release.yml 변경보다 먼저): `ssh-keygen -t ed25519 -N ''` → Settings → Deploy keys 에 공개키(**Allow write access**) → Actions secret `RELEASE_DEPLOY_KEY` 에 비밀키 → 로컬 키 삭제. secret 이 없으면 release.yml 의 checkout 이 실패한다.
2. **`release.yml` 재실행 가드**: deploy key push 는 `GITHUB_TOKEN` 이 아니라 재귀 방지가 걸리지 않아 범프 커밋 push 가 release.yml 을 다시 돌린다(`Publish to registry` 에 `if` 가 없다). job 에 `if: ${{ !startsWith(github.event.head_commit.message, 'chore(release):') }}` 를 두고 머리 주석의 「GITHUB_TOKEN 은 재실행을 안 일으킨다」 전제도 고친다.
3. **ruleset 을 `enforcement: evaluate` 로 생성**: 대상 `~DEFAULT_BRANCH`, `bypass_actors: [{actor_type: DeployKey, bypass_mode: always}]`, 규칙 `pull_request`(승인 수 0 · `require_code_owner_review: true`) + `required_status_checks`(`gate` · `changeset-check`, `integration_id` 15368). `UI Tests`(영구 pending)·`react-doctor`(자문)·`afds`(조건부 skip)는 걸지 않는다.
4. **흔적 없는 검증**: 빈 changeset 만 담은 PR 을 머지해 release.yml 의 push 가 Rules Insights 에 bypass 로 기록되고 재실행이 `if` 로 skip 되는지 본다. main 에는 직접 push 하지 않는다(evaluate 는 막지 않고 기록만 해 커밋이 남는다) — 같은 규칙을 `refs/heads/probe/ruleset-test` 에만 거는 사본을 `active` 로 두고 `git push --no-verify` 가 거부되는지 본 뒤 사본과 브랜치를 지운다.
5. **`active` 전환** 후 `gate` 실패 PR·`.claude/` 변경 PR 이 `BLOCKED`, 무관한 PR 이 `CLEAN` 인지 `gh pr view --json mergeStateStatus` 로 확인하고 더미 PR 은 머지하지 않고 닫는다. 결과로 위 「현재 main 필수 체크는 0개다」 문단을 고친다.
6. **되돌리는 법**: ruleset 을 `disabled`(`gh api -X PUT …/rulesets/<id> -f enforcement=disabled`) 또는 삭제. release.yml 변경을 되돌릴 때는 **ruleset 을 먼저** 끈다(아니면 `GITHUB_TOKEN` push 가 막힌다). CODEOWNER 가 둘뿐이라 한 명이 부재면 다른 쪽 하네스 PR 의 승인 길이 없다 — 그때는 잠시 `disabled` 로 두고 날짜·사유를 PR 본문과 이 문서에 적는다.

**미검증**: `승인 수 0 + code owner 필수` 가 소유 경로에서 실제로 승인을 요구하는지, DeployKey bypass 가 실제로 release push 를 통과시키는지, 재실행 가드가 skip 되는지는 이 레포에서 시험하지 않았다(4·5 단계가 그 시험이다).

> **⚠️ 이 문서의 함정 목록은 읽었다고 안 밟히지 않는다 — 하루에 세 번 밟혔다.** ①관련성
> 스크립트가 자기 주석에 적은 불변식을 나머지 경로에 적용하지 않았다 ②`jq has()` 경고를 두 줄
> 아래에서 어겼다 ③미추적 파일의 삭제가 `git diff` 에 안 나타난다는 것을 **그 항목을 쓴 절에서**
> 또 밟았다(릴리스 가드 검증 하네스). **그래서 검사로 옮길 수 있는 것은 검사로 옮긴다.**

**앞쪽에 항목을 더하는 비용은 거의 0 이고 뒤쪽은 비싸다.** 「목록을 늘리는 것은 비용이다」로
일괄 판단하지 마라 — 어느 갈래인지가 그 비용을 결정한다.

> **★ 실증 — 무방비 목록은 등재 작업을 한 다음 날 부패했다.** `DEFAULT_DOCS`(검증 대상 문서
> 목록)를 참조하는 검사가 `packages/afds/scripts/__test__/` 에 **없다**. 측정(`7cb7228`):
>
> ```
> .claude/rules/*.md   실재 11건 / 등재 8건   ← 해소됨(#262)
> 미등재                afds-composition-structure.md · code-comments.md · versioning.md
> ```
>
> **등재 작업(14건)을 한 다음 날 그 목록이 부패했다. 등재하는 작업 자체가 목록을 지키지 않는다.**
> 그리고 손실이 가설이 아니다 — `versioning.md` 는 `release.yml`·`package.json`·`registry.json`·
> `manifest.json` 네 경로를 인용하는데 아무것도 검증되지 않았고, **그 문서에 사실 오류가 실제로
> 있었다**(`__test__` 가 배포 범위 밖이라 적혔는데 안이다 — #233).
>
> **처방은 손으로 등재하는 것이 아니다.** `.claude/rules/*.md` 전수를 훑어 **등재되지 않은 것이
> 있으면 실패하는 검사**를 둔다. 의도적 제외는 그 검사의 예외 목록에 **근거와 함께** 적는다 —
> 그러면 「잊음」과 「제외」가 구분되고 죽은 예외 검사가 그 목록을 지킨다. **무방비 목록을 강제
> 장치가 있는 목록으로 바꾸는 것**이 이 부류의 유일한 처방이다.

**② 문서가 부재를 주장하면 `expectAbsent` 가 예외보다 강하다.** 「이 파일은 존재하지 않는다」는
서술을 만나면 `notPaths` 로 덮지 말고 등록하라 — **그 파일이 생기면 실패**하고 집계에서
**검증된 인용으로 센다.** 덮으면 「검사를 끄면서 통과한 것」이 된다.

**③ ★ 게이트가 정본으로 삼는 도구가 훼손의 원인이면 그 게이트는 훼손을 볼 수 없다.**

`format:check` 는 「**prettier 출력과 같은가**」를 묻는다. 그러므로 **prettier 가 만든 것은
정의상 통과한다.** 실측: 코드 스팬 안에 `**` 가 있으면 prettier 가 굵게 표시의 닫는 `**` 를
**이스케이프한다** — `적용된다.**` → `적용된다.\*\*`. 그 결과 굵게가 깨지는데
`prettier --check` 는 **`EXIT=0`** 이다.

```
> **텍스트(`경로/**`)…**  →  prettier 가 `\*\*` 로 이스케이프 →  --check EXIT=0
```

**증상은 둘이고 출처가 다르다** — 위 이스케이프는 내 실측이고, **블록쿼트 연속 줄의 `>` 가
사라지는 것**은 다른 레인의 관측이다(PR #225 의 A/B 실측). 내 최소 재현에서는 `>` 유실이
나오지 않았다 — 더 긴 다중 줄 문단이 필요한 것으로 보인다. **§9 논지는 두 증상 모두에서
성립한다.** 처방은 **코드 스팬에서 글롭 별표를 빼는 것**이고, 저장소 설정으로 `prettier --write`
를 재적용해 **되돌아가지 않음을 확인했다**(내 실측).

**「prettier 버그」로 읽지 마라** — 업스트림 수정을 기다리는 문제가 아니다. **게이트의 정본이
도구 자신일 때 그 도구의 출력은 언제나 「올바르다」**는 구조가 문제다. 이 저장소가 반복해 잡은
형태 중 **유일하게 고칠 수단이 없는 것**이다:

| 형태                                              | 처방                    |
| ------------------------------------------------- | ----------------------- |
| 배선 누락 — 검사가 CI 에 안 걸려 있다             | 배선한다                |
| 목록 낡음 — 정본 목록이 실재와 어긋난다           | 갱신 강제 장치를 붙인다 |
| 범위 비대칭 — 같은 가드가 한 자리에만 있다        | 범위를 맞춘다           |
| **정의상 한계 — 게이트의 정본이 훼손의 원인이다** | **없다**                |

**무엇이 이것을 잡았는지 적어 둔다 — 사람의 리뷰다.** 독립 리뷰가 「한글과 백틱이 붙어 있다 ·
prettier `EXIT=0` 이라 기계가 안 잡는다」로 지목했다. **이 한계에 대한 유일한 실효 방어**이므로
기록한다.

**④ 「나중에 X 가 처리한다」는 주석은 X 의 범위에 그 항목이 없으면 영구 주석이 된다.** 실측:
한 `notPaths` 항목 옆에 「#214 가 규칙으로 확장하면 이 항목을 지워야 한다」고 적었는데 **그
이슈의 항목에 그 형태가 없었다** — 빚 표시가 가리키는 곳에 그 빚이 없으면 「임시」 딱지만
영구히 남는다. **빚을 적을 때 가리키는 곳을 열어 확인하고, 없으면 거기에 먼저 적어라.**

그리고 위 ①의 두 갈래에 **세 번째 상태**가 있다 — **덮이지만 무의미해진 항목.** 죽은 예외
검사는 「문서에서 그 문자열이 사라졌는가」만 본다. 규칙이 그 항목을 대신하게 되면 문자열은
문서에 그대로 남아 **검사는 통과하고 항목은 잉여**가 된다. 규칙으로 옮길 때 **그 항목을 함께
지워라** — 기계가 알려 주지 않는다.

> **★ 실측 — 모드를 없애면 18건이 한꺼번에 그 상태가 된다.** 철거 PR 이 **완전 모드 전용 예외
> 18건**을 찾아 지웠다. 갈라낸 논리는 「CI 모드는 심볼과 범위 밖 경로를 강제하지 않으므로, 그
> 둘만 덮던 예외는 모드가 사라지면 아무것도 안 덮는다」다. 그리고 **죽은 예외 검사는 이것을 못
> 잡는다** — 문자열이 문서에 그대로 실재하기 때문이다. **검사 하나를 없앨 때 그 검사만 덮던
> 예외를 함께 찾아라**(출처 #234 —
> 이 문서가 재측정하지 않았다).

**⑤ 실효 기준(2026-09-03 사용자 방향).** 시스템으로 제어 가능한 것만 하네스에 남기고 나머지는
`.claude/rules` 로 옮긴다. 판단 기준 둘 — **①대조 대상을 우리가 통제하는가 ②실제로 빨간불을
낼 수 있는가.**

**⑥ 규칙 글롭을 넓힐 때 본문도 함께 봐라. 꺼진 규칙보다 틀린 규칙이 나쁘다.** `384d20e` 가
`.claude/rules` 의 `afds-component-structure.md` 와 `afds-component-tokens.md` 에
`packages/afds-registry/src/compositions/**` 를 더했는데 **본문은 `bricks` 전제**다. 컴포지션은
4파일 규약을 **23개 중 4개**만 따르고 `base-table` 은 디렉터리명과 다른 파일 접두(`table.*`)를
쓴다 — 지금 컴포지션 작업에 **「없는 파일을 만들라」는 규칙이 로드된다.** 글롭 검사
(`rule-globs.test.ts`)는 **경로가 살아 있는지만** 보고 본문이 그 트리에 맞는지는 보지 않는다.

### 버전 등급·머지 순서는 `.claude/rules/versioning.md` 가 정본이다

**여기서 되풀이하지 않는다**(§8 「같은 대상을 두 자리에서 말하지 마라」의 적용). 이 문서가
더할 것은 **기계 검사와의 접점** 하나뿐이다.

**⚠️ 검사 하나가 자기 문언과 다른 것을 재고 있었다 — 고쳤다.** 이 문서가 계속 잡아 온 형태의
릴리스 축 사례이고, **부작용이 거짓 커밋 메시지**라 역사에 남는다. **「검사가 다른 것을 재고
있다」의 가장 짧은 예다 — 커밋 메시지가 자기가 한 일을 잘못 말했다.**

```
옛 가드          if git diff --quiet; then
                   ::error:: changeset version 이 아무것도 바꾸지 않았다 —
                             대기 changeset 이 있었는데 범프가 없다.
문언이 말한 것    「범프가 일어났는가」
실제로 잰 것      「무엇이든 바뀌었는가」
```

**빈 changeset(`---\n---`)이 그 틈으로 지나갔다** — 자기 파일이 삭제되면서 diff 를 만들기
때문이다. 실측 넷:

```
e9eb408   .changeset/readme-followup.md 만 삭제 (7줄)      afds 1.1.1 → 1.1.1
7cb7228   .changeset/fade-swap-safety-net.md 만 삭제 (7줄)  afds 1.1.1 → 1.1.1
(이 문서)  .changeset/harness-update.md 만 삭제 (7줄)       afds 1.1.1 → 1.1.1
c42a780   .changeset/fullmode-doc-cleanup.md 만 삭제 (6줄)  afds 1.1.1 → 1.1.1
커밋 메시지  chore(release): 버전 범프 및 CHANGELOG 갱신     ← 두 절 다 거짓이다
```

**같은 날 네 번 일어났다** — 반복되는 형태이고 우연이 아니다. **세 번째는 이 문서의 갱신
자신이었다.** **자기가 기록한 함정의 사례가 되는 자리를 스스로 적어 둔다** — 그러지 않으면
다음 사람이 이 절을 읽으면서 그 커밋을 사례로 알아보지 못한다.

**파일명은 위 블록 안에만 적는다.** 산문에서 백틱으로 적으면 경로 인용으로 추출되는데, **릴리스가
그 파일을 소진하므로 머지 직후 「경로 미확인」으로 실패한다** — 실제로 그렇게 `main` 을 한 번
붉혔다. 코드 블록 안의 표기는 추출되지 않는다.

**고친 방법 — 두 조각이고, 하나만 바꾸면 정상 경로가 깨진다.**

`git diff` 를 **범프 전후 버전 비교**로 바꾸는 것이 옳은 측정이다. **그런데 그것만 바꾸면
의도적 무릴리스가 실패한다** — `changeset add --empty` 는 일급 기능이고, 빈 changeset 에서
버전이 안 움직이는 것은 **정상**이다. 그래서 같이 바꾼 것이 대기 개수다: 옛 코드는
`.changeset/*.md` 를 **파일로** 셌는데, 필요한 것은 **패키지를 선언한 changeset 의 수**다.
등급 있는 것이 0이면 범프를 기대하지 않고 **커밋 메시지도 「범프」라고 적지 않는다.**

**두 방향을 다 단정한다** — 등급이 있는데 안 올랐으면 실패, **없는데 올랐으면 그것도 실패**다
(등급 판정 자체가 틀렸다는 뜻이므로). 판정은 `changeset-grade.sh` 로 빼고 셸 스위트가 고정한다.

**실측 A/B — 같은 상태에서 옛 가드와 새 가드:**

```
빈 changeset 하나 · 버전 불변 · 변경은 그 파일 삭제뿐
  옛 가드   EXIT=0 · 커밋 메시지 「버전 범프 및 CHANGELOG 갱신」   ← 거짓
  새 가드   EXIT=0 · 커밋 메시지 「무릴리스 changeset 을 소진한다」  ← 같은 일을 하고 사실을 말한다
```

**같은 일을 하는데 메시지만 다르다** — 그것이 이 수정의 전부이고, **검사가 무엇을 재는지가
그 차이를 만든다.**

> **★ 범프 판정의 분모가 어느 선언을 읽는가.** 이 저장소는 워크스페이스를 **두 번 선언하고
> 서로 다르다**(실측 `f47b4a0`): `pnpm-workspace.yaml` 8건 · `package.json#workspaces` 5건.
> **changesets 는 후자를 읽는다** — `@manypkg/get-packages` 가 `workspaces` 필드를 보고
> **`tool: "yarn"`** 으로 판정한다(`packageManager` 가 `pnpm@10` 인데도). 그래서
> `packages/config/*` 를 선언한 changeset 은 `changeset status` 가 「not in the workspace」로
> 거절한다. **이 스크립트는 pnpm 선언을 읽어 상위집합이 되고, 검사는 두 선언의 포함관계를
> 단정한다** — 두 선언을 맞추거나 `workspaces` 필드를 지우면 집합이 바뀌는데 그 경우에도
> 포함관계는 유지된다. 초판은 `find … -maxdepth 2` 였고 **마침 5건과 같아서** 틀리지 않았다 —
> **「지금 틀리지 않았다」와 「틀릴 수 없다」는 다르다.** ※ 두 선언의 불일치 자체는 별건이다
> (`packages/config/*` 는 `private` 이 아니어서 워크스페이스에 들어가면 배포 후보가 된다).

**★ 그리고 이 함정은 격리 클론에서 재면 보이지 않는다.** 프로브로 만든 `.md` 는 **추적되지
않으므로** 삭제가 `git status` 에 안 잡혀 「변경 파일 0」으로 보인다. 실제 저장소에서는 추적
파일이라 **1건**이다. **버전 결론은 양쪽이 같고**(무범프) `e9eb408` 이 실증한다 — 갈리는 것은
**가드를 통과하는 이유**뿐인데, 그게 바로 이 항목의 내용이다. 아래 「측정 환경이 대상과 다르면」
의 한 형태다: **추적 여부가 환경이다.**

## 이 문서를 언제 만지는가

**기능 PR 은 이 파일을 만지지 않는다.** 브랜치에서 잰 수치는 **다른 PR 이 머지되는 순간
낡는다** — 한 축을 여러 PR 로 나누면 앞 PR 이 적은 수치가 뒤 PR 때문에 틀려진다. 실측: 한
PR 이 적은 `CI 경로 94 / 줄인용 121` 이 뒤 PR 이 머지되기도 **전에** `99 / 134` 가 됐다.
**앞 PR 의 저자가 틀린 것이 아니라 기준 시점이 옮겨간 것**이다.

수치 갱신은 **머지된 트리에서 전용 PR** 로 한다. 그리고 **수치마다 기준 커밋을 적어라** —
낡았을 때 「누가 틀렸나」가 아니라 「어느 시점 값인가」로 읽힌다.

> **충돌은 운이 좋은 경우다.** 두 브랜치가 같은 자리를 고쳐 충돌하면 사람이 본다. 우연히
> **같은 값으로 일치하면 조용히 잘못 머지된다.**

## 외부 검사에 대해

**`CodeRabbit` 체크가 `SUCCESS` 인 것은 리뷰됐다는 근거가 아니다.** rate limit 이면 아무것도 하지 않고 통과한다. `statusCheckRollup` 의 `description` 이 비어 있어 rollup 만으로는 구분할 수 없다.

```
gh pr checks <n>                        → "Review rate limited" 가 보인다
gh api repos/.../pulls/<n>/reviews      → commit_id 로 어느 커밋이 리뷰됐는지 확인
```

`UI Tests`(Chromatic)는 쿼터 문제로 영구 대기 상태다 — #131 · #103.
