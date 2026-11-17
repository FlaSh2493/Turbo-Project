---
name: commit-with-format
description: Generate and execute commits with project-standard message format. Trigger on "ㅋㅁ", "커밋", "commit", "커밋 메시지", "커밋해줘", "변경사항 커밋", "작업 내역 커밋".
---

# Commit With Format

프로젝트 컨벤션에 맞는 커밋 메시지를 생성하고 커밋합니다.

## Input

- `$ARGUMENTS`: 선택. 커밋 scope 나 티켓 힌트. 없으면 변경 파일에서 정한다.

## Format

이 저장소의 실제 관례(`git log` 로 확인):

```
{type}({scope}): {~한다 로 끝나는 한국어 서술}
```

- `scope`: 바뀐 영역 — 패키지명(`afds`, `afds-registry`, `afds-registry`), `harness`, `claude`, `release` 등. 최근 `git log --oneline -20` 으로 맞춘다.
- 본문은 필요할 때만 쓴다(왜 바꿨는지). 티켓 번호는 브랜치·사용자가 주면 선택적으로 본문에 적는다.
- Co-Authored-By 등 attribution 줄은 하네스 안내를 따르고 이 스킬에서 하드코딩하지 않는다.

## Types

| Type       | When to use                         |
| ---------- | ----------------------------------- |
| `feat`     | 새로운 기능                         |
| `fix`      | 버그 수정                           |
| `refactor` | 코드 리팩토링                       |
| `test`     | 테스트 코드                         |
| `docs`     | 문서화                              |
| `chore`    | 기타(하네스·claude 설정·release 등) |

## Workflow

### 1. Gather Information

```bash
git status
git diff --staged
git diff
git log --oneline -20
```

### 2. Decide Scope

변경 파일 경로에서 scope 를 정하고, `git log` 의 최근 scope 표기와 맞춘다.

### 3. Handle Ambiguity with AskUserQuestion

**IMPORTANT**: 모호한 상황에서는 반드시 AskUserQuestion 도구를 사용하여 사용자에게 확인하세요.

#### 3.1 커밋 범위가 불명확한 경우

변경 파일이 여러 개이고 논리적으로 분리 가능할 때:

```yaml
questions:
  - question: '어떤 파일들을 이 커밋에 포함할까요?'
    header: '커밋 범위'
    options:
      - label: '모든 변경사항'
        description: '현재 변경된 모든 파일을 하나의 커밋으로'
      - label: '스테이징된 파일만'
        description: 'git add로 추가한 파일만 커밋'
      - label: '논리적으로 분리'
        description: '관련 파일끼리 여러 커밋으로 나눔'
    multiSelect: false
```

#### 3.2 Type 선택이 애매한 경우

예: 리팩토링하면서 버그도 수정한 경우

```yaml
questions:
  - question: '이 변경의 주요 목적은 무엇인가요?'
    header: '커밋 타입'
    options:
      - label: 'feat - 새 기능'
        description: '새로운 기능이나 동작 추가'
      - label: 'fix - 버그 수정'
        description: '기존 버그나 오류 수정'
      - label: 'refactor - 리팩토링'
        description: '동작 변경 없이 코드 구조 개선'
      - label: 'test - 테스트'
        description: '테스트 코드 추가/수정'
    multiSelect: false
```

#### 3.3 복합 변경사항 처리

여러 종류의 변경이 섞여있을 때:

```yaml
questions:
  - question: '이 변경사항들을 어떻게 커밋할까요?'
    header: '커밋 전략'
    options:
      - label: '하나의 커밋으로 통합'
        description: '모든 변경을 하나의 feat/fix 커밋으로'
      - label: '타입별로 분리'
        description: 'feat, test, docs 등 타입별 여러 커밋'
      - label: '기능별로 분리'
        description: '논리적 기능 단위로 여러 커밋'
    multiSelect: false
```

#### 3.4 커밋 메시지 확인

최종 커밋 전 확인:

```yaml
questions:
  - question: '이 커밋 메시지로 진행할까요?'
    header: '최종 확인'
    options:
      - label: '확인, 커밋 진행'
        description: '현재 메시지로 커밋 실행'
      - label: 'subject 수정'
        description: '커밋 제목을 다시 작성'
      - label: '취소'
        description: '커밋하지 않고 종료'
    multiSelect: false
```

### 4. Categorize Changes

| File pattern                                                                | Type              |
| --------------------------------------------------------------------------- | ----------------- |
| `packages/afds/src/bricks/**`, `packages/afds-registry/src/compositions/**` | feat/fix/refactor |
| `**/__tests__/**`                                                           | test              |
| `*.stories.tsx`, `*.md`                                                     | docs              |
| `.changeset/**`, `.github/**`, `.claude/**`                                 | chore             |

### 5. Execute

사용자 확인 후:

```bash
git add [files]
git commit -m "{message}"
```

**훅이 실패하면** 출력된 원인(lint·타입·테스트)을 고치고 다시 add → commit 한다. `--no-verify`·`-n`·`HUSKY`·`LEFTHOOK`·`LEFTHOOK_EXCLUDE` 끄기·`lefthook uninstall` 로 우회하지 않는다. 고칠 수 없으면 멈추고 사용자에게 보고한다.

## Rules

1. **모호하면 물어보기**: 추측하지 말고 AskUserQuestion 사용
2. **한 커밋 = 한 논리적 변경**: 관련 없는 변경은 분리 제안
3. **subject는 간결하게**: `~한다` 로 끝나는 한 줄
4. **커밋 전 확인 필수**: 최종 메시지 사용자 승인 후 실행

## Example

```
feat(afds-registry): complex-filter 키워드 필드에 suggest 옵션을 더한다
chore(claude): 훅 우회 변형을 Claude 권한 deny 에 추가한다
```
