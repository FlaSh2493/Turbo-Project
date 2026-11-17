---
name: pr-message
description: Generate PR description by analyzing branch changes. Trigger on "PR 메시지", "PR 생성", "풀리퀘", "pull request", "PR 작성", "머지 요청".
---

# PR Message

브랜치 변경사항을 분석하여 PR 메시지를 생성합니다.

## Input

- `$ARGUMENTS`: 비교할 베이스 브랜치 (기본값: `origin/main`)

## Template

```markdown
## {title}

### 📋 변경 요약

#### ✨ 신규 기능

- ...

#### 🔧 수정

- ...

#### ♻️ 리팩토링

- ...

#### 📝 문서 및 기타

- ...

### 📊 변경 범위

- **X개 파일** 변경
- **+X 줄** 추가 / **-X 줄** 삭제
```

## Workflow

### 1. Determine Base Branch (REQUIRED if no $ARGUMENTS)

**IMPORTANT**: `$ARGUMENTS`가 비어있거나 베이스 브랜치가 명시되지 않은 경우, 반드시 AskUserQuestion으로 물어보세요.

```yaml
questions:
  - question: '어떤 브랜치와 비교해서 PR을 만들까요?'
    header: '베이스 브랜치'
    options:
      - label: 'origin/main'
        description: '메인 브랜치 (기본, 스택 PR 이 아니면 항상 이것)'
    multiSelect: false
```

> **Note**: 사용자가 "Other"를 선택하면 직접 브랜치명을 입력받습니다.

### 2. Setup & Gather Data

```bash
git fetch origin
git log ${BASE}..HEAD --oneline
git diff ${BASE}..HEAD --stat
git branch --show-current
```

### 3. Handle Other Ambiguities with AskUserQuestion

**IMPORTANT**: 모호한 상황에서는 반드시 AskUserQuestion 도구를 사용하세요.

#### 3.1 PR 메시지 형식

```yaml
questions:
  - question: 'PR 메시지 형식을 어떻게 할까요?'
    header: 'PR 형식'
    options:
      - label: '변경 요약 중심'
        description: '기능/수정 사항을 카테고리별로 정리'
      - label: '커밋 목록 기반'
        description: '각 커밋을 bullet point로 나열'
      - label: '팀 템플릿 사용'
        description: '기존 팀 PR 템플릿이 있다면 그 형식을 따름'
    multiSelect: false
```

#### 3.2 포함할 내용

```yaml
questions:
  - question: 'PR 메시지에 어떤 내용을 포함할까요?'
    header: '포함 내용'
    options:
      - label: '변경 사항만'
        description: '무엇이 바뀌었는지만 기술'
      - label: '변경 + 테스트 계획'
        description: '변경 사항과 함께 테스트 방법 포함'
      - label: '변경 + 테스트 + 스크린샷'
        description: 'UI 변경이 있다면 스크린샷 섹션도 포함'
    multiSelect: false
```

#### 3.3 작성 언어

```yaml
questions:
  - question: 'PR 메시지 작성 언어는?'
    header: '언어'
    options:
      - label: '한국어'
        description: '전체 한국어로 작성'
      - label: '영어'
        description: '전체 영어로 작성'
      - label: '혼합 (제목 영어, 본문 한국어)'
        description: 'PR 제목은 영어, 설명은 한국어'
    multiSelect: false
```

### 4. Categorize

| Commit prefix    | Category        |
| ---------------- | --------------- |
| `feat:`          | ✨ 신규 기능    |
| `fix:`           | 🔧 수정         |
| `refactor:`      | ♻️ 리팩토링     |
| `test:`, `docs:` | 📝 문서 및 기타 |

### 5. Check Changeset & Ticket

- `packages/*` 변경이 없으면 changeset 은 불필요하다(versioning.md — `.github/`·루트만 만진 PR). `packages/*` 를 바꿨다면 `.changeset/*.md` 가 있는지 확인한다(`git diff ${BASE}..HEAD --stat -- .changeset`). 없으면 pre-push 와 `changeset-check` 가 막으므로 `pnpm changeset` 을 먼저 안내한다. 릴리스가 없는 변경이면 빈 changeset(`pnpm changeset add --empty`)을 쓴다.
- 티켓은 선택이다. 브랜치명·커밋·사용자 입력에 있을 때만 제목에 `[APT-XXXXX]` 로 붙인다.

### 6. Generate

Output the formatted PR message for user to copy.

### 7. Ask: Create PR Now?

PR 메시지 생성 후, 실제 PR 생성 여부를 물어봅니다.

```yaml
questions:
  - question: '이 메시지로 PR을 생성할까요?'
    header: 'PR 생성'
    options:
      - label: '예, PR 생성'
        description: 'gh CLI로 GitHub PR 생성'
      - label: '아니오, 메시지만 복사'
        description: 'PR 메시지만 확인하고 종료'
    multiSelect: false
```

### 8. Check gh CLI (if PR creation requested)

PR 생성을 선택한 경우, gh CLI 설치 및 인증 상태를 확인합니다.

```bash
# gh 설치 확인
which gh || echo "not installed"

# gh 인증 상태 확인
gh auth status
```

#### 8.1 gh CLI가 설치되지 않은 경우

설치 방법 안내:

```bash
# macOS (Homebrew)
brew install gh

# Ubuntu/Debian
sudo apt install gh

# Windows (winget)
winget install GitHub.cli
```

#### 8.2 gh 인증이 필요한 경우

로그인 안내:

```bash
gh auth login
```

옵션 선택 가이드:

1. **GitHub.com** 선택
2. **HTTPS** 선택
3. **Login with a web browser** 선택
4. 브라우저에서 인증 완료

#### 8.3 gh 준비 완료 확인

```yaml
questions:
  - question: 'gh CLI 준비가 완료되었나요?'
    header: 'gh 상태'
    options:
      - label: '예, 준비 완료'
        description: 'PR 생성 진행'
      - label: '아니오, 나중에'
        description: 'PR 메시지만 복사하고 종료'
    multiSelect: false
```

### 9. Create PR with gh CLI

```bash
# 현재 브랜치를 원격에 푸시 (필요한 경우)
git push -u origin $(git branch --show-current)

# PR 생성
gh pr create \
  --base ${BASE_BRANCH} \
  --title "${PR_TITLE}" \
  --body "$(cat <<'EOF'
${PR_BODY}
EOF
)"
```

#### PR 생성 성공 시

```
✅ PR이 생성되었습니다!
🔗 URL: https://github.com/{owner}/{repo}/pull/{number}
```

#### PR 생성 실패 시

에러 메시지 확인 후 해결 방법 안내:

- **Branch not pushed**: `git push -u origin {branch}` 실행
- **Authentication failed**: `gh auth login` 재실행
- **PR already exists**: 기존 PR URL 안내

## Rules

1. **모호하면 물어보기**: 추측하지 말고 AskUserQuestion 사용
2. **제목 70자 이내**: 간결하게
3. **티켓은 있을 때만**: `[APT-XXXXX]` 형식
4. **카테고리별 분류**: 변경 유형을 명확히
5. **PR 생성 전 확인**: 메시지 생성 후 PR 생성 여부 물어보기
6. **gh CLI 지원**: 설치/인증 안내까지 제공

## Example Output

```markdown
## 실험적 성과 리포트 기능 추가

### 📋 변경 요약

#### ✨ 신규 기능

- 실험적 성과 리포트 페이지 신규 추가 (`/experiments`)
- AnalysisReports API 연동

#### 🔧 수정

- PerformanceBadge 스토리 타입 오류 수정

### 📊 변경 범위

- **87개 파일** 변경
- **+7,343 줄** 추가 / **-1,326 줄** 삭제
```
