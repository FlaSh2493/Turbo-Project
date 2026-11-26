# @turbo-project/governance

사람 리뷰 대신 머지 게이트로 머지 여부를 정합니다. 로컬에서 별도 Claude 세션이 "테스트 없음"과 "동등 변이"를 판정해 PR 본문 `## 검증`에 남기고, CI의 `governance gate`가 Claude 없이 그 판정과 검사 우회를 확인합니다. 기준은 [criteria.md](criteria.md)입니다.

## 만드는 파일

없을 때만 만들고, 그 뒤로는 레포가 고칩니다.

| 파일 | 내용 |
| --- | --- |
| `.github/pull_request_template.md` | PR 본문 양식. 플랜에서 옮길 섹션과 `## 검증` 자리 |

## 다른 파일에 더하거나 고치는 것

| 파일 | 하는 일 |
| --- | --- |
| `AGENTS.md` | `<!-- BEGIN:governance -->` 블록(`## PR`)을 넣습니다. 다시 돌리면 블록 안만 새로 씁니다 |
| pre-push 훅 | `pnpm exec governance judge \|\| true` 한 줄을 넣습니다. husky면 `.husky/pre-push`, lefthook이면 `lefthook.yml`, simple-git-hooks면 `package.json`, 셋 다 없으면 `.git/hooks/pre-push`입니다 |
| `package.json` | 훅 도구가 없을 때만 `prepare`에 `governance hook \|\| true`를 더합니다 |

## 명령어

| 언제 | 명령어 |
| --- | --- |
| 처음 | `pnpm add -D -E @turbo-project/governance` → `pnpm exec governance init` |
| PR을 열 때 | `pnpm exec governance judge --create <gh pr create 인자>` (예: `--draft --base develop --title "..." --body-file body.md`) |
| base를 바꾼 뒤, 웹에서 PR을 연 뒤 | `pnpm exec governance judge` (push할 때는 훅이 돌립니다) |
| CI 머지 게이트 | `pnpm exec governance gate` |
| 버전을 올릴 때 | `package.json`의 `@turbo-project/governance` 버전을 바꾸고 `pnpm i` → `pnpm exec governance init` |

판정은 `claude` CLI로 돌고, 없으면 판정 실패로 끝납니다.

## judge가 하는 일

1. main으로 가는 PR이면 출처 브랜치를 확인합니다.
2. 승격·백포트, revert PR이면 판정하지 않고 통과로 적습니다.
3. 새 `claude -p` 프로세스가 동작이 바뀌었는데 테스트가 없는지 판정합니다.
4. 레포에 `test:mutation` 스크립트가 있으면 `reports/mutation/`의 리포트가 지금 커밋에서 돌린 것인지 보고, 살아남은 변이마다 동등 변이인지 같은 방식으로 판정합니다. 리포트가 없거나 오래됐으면 실패입니다.
5. PR 본문 맨 위에 판정 결과 한 줄을, `## 수락 기준` 앞에 `## 검증`을 커밋 SHA와 함께 넣습니다. 수락 기준이 없으면 `## 검증`은 맨 끝에 붙습니다. 실패면 `--create`는 PR을 만들지 않고, 열린 PR이면 본문을 고친 뒤 실패로 끝납니다.

판정 결과는 커밋과 입력이 같으면 `.git/governance/`에 저장한 것을 다시 씁니다.

## gate가 하는 일

| 확인 | 실패하면 |
| --- | --- |
| `## 검증`이 PR head 커밋에서 판정됐고 통과다 | 로컬에서 `governance judge`를 다시 돌립니다 |
| 이번 diff가 `.skip`, `.only`, `.todo`, `xit`, `eslint-disable`, `@ts-ignore`, `@ts-nocheck`, `Stryker disable`을 새로 넣지 않았다 | 지우고 원인을 고칩니다 |

뮤테이션 테스트는 CI에서 다시 돌리지 않습니다. 같은 커밋이면 결과가 같아서, 로컬에서 돌린 결과로 judge가 판정한 것을 `## 검증`으로 확인합니다.

결과는 체크 요약(`GITHUB_STEP_SUMMARY`)에 조건별로 남습니다. merge queue(`merge_group`)에서는 검사 우회만 봅니다.

## 머지 게이트 워크플로 예시

레포의 `merge-gate` 잡에 레포 CI 다음으로 넣습니다. `## 검증`을 PR head 커밋과 비교하므로 head를 체크아웃합니다.

```yaml
  gate:
    if: github.event_name == 'pull_request'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v7.0.1
        with:
          ref: ${{ github.event.pull_request.head.sha }}
          fetch-depth: 0
          persist-credentials: false
      - uses: pnpm/action-setup@v6.1.1
      - uses: actions/setup-node@v7
        with:
          node-version: 24
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm exec governance gate
```

PR 본문을 고쳐도 다시 돌도록 워크플로 트리거에 `pull_request`의 `edited`를 더합니다.

## init 뒤에 할 것

- 처음 적용한 PR을 머지한 뒤 보호 브랜치에 ruleset을 겁니다: PR 필수, 필수 검사 `merge-gate`, 필요 승인 수 0, Code Owner 승인 끔.
- 예전 버전이 만든 `.github/CODEOWNERS`, `.github/FEATURE_OWNERS`, `risk:*` 라벨은 더 쓰지 않습니다. 레포에서 지웁니다.
