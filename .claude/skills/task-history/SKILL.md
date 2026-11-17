---
name: task-history
description: Track project progress, learnings, and updates for spec-based development. Trigger on "작업 기록", "진행 상황", "task history", "/history", "학습 기록", "세션 마무리", "작업 정리".
---

# Task History

스펙 기반 개발의 진행 상황을 추적하고 학습 내용을 기록합니다.

## Input

- `$ARGUMENTS`: 서브 커맨드 (`help`, `update`, `view`, `session`, `learn`, `archive`)

## Subcommands

| Command   | Description                                        |
| --------- | -------------------------------------------------- |
| `help`    | 사용 가이드 표시 및 명령어 선택 (default)          |
| `update`  | 현재 세션의 작업 내역을 task-history.md에 업데이트 |
| `view`    | 현재 진행 상황 요약 표시                           |
| `session` | 새 세션 섹션 추가 (자동 아카이브 포함)             |
| `learn`   | 학습 내용만 추가                                   |
| `archive` | 오래된 세션을 월별 파일로 수동 아카이브            |

## File Structure (토큰 최적화)

```
docs/specs/{spec-name}/
├── task-history.md              # 최근 3개 세션 + 진행률 요약만 유지
├── task-history-archive/
│   ├── 2026-02.md              # 월별 아카이브
│   └── 2026-01.md
└── spec.md
```

**토큰 최적화 원칙**:

- task-history.md는 **최근 3개 세션**만 유지
- 4개 이상 세션 시 자동으로 월별 파일로 아카이브
- `view` 명령은 task-history.md만 읽음 (아카이브 파일 읽지 않음)

## Workflow

### 0. Handle `help` or No Arguments (FIRST STEP)

**IMPORTANT**: 인자가 없거나 `help`인 경우, 먼저 사용 가이드를 표시하고 AskUserQuestion으로 명령어를 선택받습니다.

#### 0.1 사용 가이드 표시

```markdown
## 📋 Task History 사용 가이드

스펙 기반 개발의 진행 상황을 추적하고 학습 내용을 기록합니다.

### 사용 가능한 명령어

| 명령어    | 설명               | 사용 상황                    |
| --------- | ------------------ | ---------------------------- |
| `view`    | 진행 상황 요약     | 현재 진행률과 다음 작업 확인 |
| `update`  | 세션 작업 업데이트 | 작업 완료 후 기록 추가       |
| `session` | 새 세션 시작       | 새로운 작업 세션 시작 시     |
| `learn`   | 학습 내용 추가     | 새로운 지식/패턴 발견 시     |
| `archive` | 수동 아카이브      | 오래된 세션 정리 시          |

### 파일 위치

`docs/specs/{spec-name}/task-history.md`

### 토큰 최적화

- 최근 3개 세션만 유지
- 오래된 세션은 자동으로 월별 아카이브
```

#### 0.2 명령어 선택 질문

```yaml
questions:
  - question: '어떤 작업을 하시겠습니까?'
    header: '명령어 선택'
    options:
      - label: '📊 진행 상황 보기 (view)'
        description: '현재 Phase별 완료율과 다음 작업 확인'
      - label: '📝 작업 내역 업데이트 (update)'
        description: '완료된 작업과 커밋을 task-history.md에 기록'
      - label: '🆕 새 세션 시작 (session)'
        description: '새로운 Session 섹션 추가 (자동 아카이브)'
      - label: '💡 학습 내용 추가 (learn)'
        description: '발견한 패턴, 버그, 도구 사용법 기록'
    multiSelect: false
```

---

### 1. Detect Spec Directory

```bash
# 최근 수정된 스펙 디렉토리 찾기
ls -lt docs/specs/*/spec.md | head -1
```

### 2. Gather Session Information

```bash
# 오늘의 커밋 내역
git log --oneline --since="00:00" --until="23:59"

# 변경된 파일 목록
git diff --name-only HEAD~5

# 현재 브랜치
git branch --show-current
```

### 3. Execute Subcommand

#### For `view` command:

**토큰 최적화**: task-history.md만 읽고 아카이브는 읽지 않음.

```markdown
## {Project} 진행 상황

### 진행률 요약

| Phase   | 상태      | 완료율 |
| ------- | --------- | ------ |
| Phase 1 | ✅ 완료   | 100%   |
| Phase 2 | 🔄 진행중 | 30%    |

### 현재 세션 완료 항목

- 항목 1 ✅
- 항목 2 ✅

### 다음 작업 (P0)

- 작업 1
- 작업 2
```

#### For `session` command:

**중요**: 새 세션 추가 전 자동 아카이브 체크를 수행합니다.

1. **세션 수 확인**: task-history.md에서 `## Session` 패턴 카운트
2. **3개 초과 시 자동 아카이브**:
   - 가장 오래된 세션을 월별 아카이브 파일로 이동
   - task-history.md에서 해당 세션 삭제
3. **새 세션 추가**

```bash
# 세션 수 확인
grep -c "^## Session" docs/specs/{spec-name}/task-history.md
```

자동 아카이브 실행 시 메시지:

```
📦 Session 1 (2026-02-01)을 task-history-archive/2026-02.md로 아카이브했습니다.
```

#### For `archive` command:

수동으로 오래된 세션을 아카이브합니다.

```yaml
questions:
  - question: '몇 개의 세션을 아카이브할까요?'
    header: '아카이브 범위'
    options:
      - label: '가장 오래된 1개'
        description: '가장 오래된 세션만 아카이브'
      - label: '최근 3개 제외 전부'
        description: '최근 3개만 남기고 나머지 아카이브'
      - label: '전체 아카이브'
        description: '모든 세션을 월별로 아카이브 (진행률만 유지)'
    multiSelect: false
```

#### For `update` command:

현재 세션의 **완료된 작업** 섹션을 업데이트합니다.

#### For `learn` command:

학습 내용만 추가합니다.

### 4. Archive Logic (자동/수동 공통)

```bash
# 아카이브 디렉토리 생성
mkdir -p docs/specs/{spec-name}/task-history-archive

# 월별 파일명 결정 (세션 날짜 기준)
# Session 1: 2026-02-01 → 2026-02.md
```

아카이브 파일 구조:

```markdown
# Task History Archive - 2026-02

이 파일은 자동 생성된 아카이브입니다.

---

## Session 1: 2026-02-01

(세션 내용 전체)

---

## Session 2: 2026-02-05

(세션 내용 전체)
```

### 5. Update Progress Summary

진행률 요약과 다음 작업은 **항상 task-history.md에 유지**됩니다.
아카이브되는 것은 완료된 세션의 상세 내역뿐입니다.

## Task History Structure (최적화 버전)

```markdown
# {Project} Task History

> 최근 3개 세션만 표시됩니다. 이전 기록: `task-history-archive/`

---

## Session 3: 2026-02-13 (현재)

### 완료된 작업

...

---

## Session 2: 2026-02-12

### 완료된 작업

...

---

## 다음 작업 (Upcoming)

| 우선순위 | 작업 | 상태 |
| -------- | ---- | ---- |

## 진행률 요약

| Phase | 상태 | 완료율 |
| ----- | ---- | ------ |

## 커밋 히스토리 (최근 10개)

| 커밋 | 메시지 | 날짜 |
| ---- | ------ | ---- |
```

## Rules

1. **인자 없으면 help**: 인자 없이 호출 시 사용 가이드 표시 후 명령어 선택
2. **세션 3개 제한**: task-history.md에는 최근 3개 세션만 유지
3. **자동 아카이브**: `session` 명령 시 4개 이상이면 자동 아카이브
4. **월별 그룹화**: 아카이브는 세션 날짜 기준 월별 파일로 저장
5. **진행률 유지**: 진행률 요약, 다음 작업은 항상 task-history.md에 유지
6. **커밋 히스토리 제한**: 최근 10개 커밋만 유지

## Example Usage

```bash
# 사용 가이드 및 명령어 선택
/task-history
/task-history help

# 직접 명령어 실행
/task-history view      # 진행 상황 확인 (토큰 효율적)
/task-history update    # 작업 내역 업데이트
/task-history session   # 새 세션 시작 (자동 아카이브)
/task-history learn     # 학습 내용 추가
/task-history archive   # 수동 아카이브
```

## Quick Reference

| 상황                  | 명령어                                  |
| --------------------- | --------------------------------------- |
| 오늘 뭐 했더라?       | `/task-history view`                    |
| 작업 끝났다, 기록하자 | `/task-history update`                  |
| 새 날/새 작업 시작    | `/task-history session`                 |
| 새로운 거 배웠다!     | `/task-history learn`                   |
| 파일이 너무 커졌다    | `/task-history archive`                 |
| 뭐가 있지?            | `/task-history` or `/task-history help` |
