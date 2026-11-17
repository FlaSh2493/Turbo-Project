---
name: tech-spec
description: Generate technical specification documents for new components. Trigger on "테크스펙", "tech spec", "스펙 문서", "설계 문서", "구현 계획", "컴포넌트 설계", "feature spec".
---

# Tech Spec

컴포넌트 개발을 위한 테크스펙 문서를 생성합니다.

## Input

- `$ARGUMENTS`: 컴포넌트 이름 (예: `DimensionSummary`)

## Output Files

```
docs/specs/$ARGUMENTS/
├── $ARGUMENTS.spec.md      # 요구사항 명세 (무엇을)
└── $ARGUMENTS.prompt.md    # 구현 가이드 (어떻게)
```

## Workflow

### 0. Ask: Use /vague for Requirement Clarification? (FIRST STEP)

**IMPORTANT**: 작업 시작 전, 반드시 요구사항 명확화 필요 여부를 먼저 물어보세요.

```yaml
questions:
  - question: '요구사항이 모호하거나 불명확한가요? /vague 스킬로 먼저 명확히 정리할 수 있습니다.'
    header: '요구사항 분석'
    options:
      - label: '예, /vague로 요구사항 명확히 하기'
        description: '모호한 요구사항을 구체적인 스펙으로 변환 (권장)'
      - label: '아니오, 바로 진행'
        description: '이미 요구사항이 명확하므로 바로 테크스펙 작성'
    multiSelect: false
```

#### If User Selects "/vague로 요구사항 명확히 하기":

1. **요구사항 입력 요청**:

   ```
   "어떤 기능/컴포넌트를 만들고 싶으신가요? 현재 알고 있는 요구사항을 자유롭게 입력해주세요."
   ```

2. **Skill tool로 /vague 호출**:

   ```
   Skill(skill: "clarify:vague", args: "{사용자가 입력한 요구사항}")
   ```

3. **/vague 결과 활용**:
   - /vague가 반환한 **Clarified Requirement**를 이후 단계에서 활용
   - Goal, Scope, Constraints, Success Criteria를 spec.md에 반영

4. **이후 Workflow 1단계부터 계속 진행** (명확화된 요구사항 기반)

---

### 1. Gather Additional Details with AskUserQuestion

/vague를 거쳤거나 건너뛴 후, 추가적인 기술 세부사항을 수집합니다.

#### 1.1 주요 기능

```yaml
questions:
  - question: '이 컴포넌트의 주요 기능은 무엇인가요?'
    header: '주요 기능'
    options:
      - label: '데이터 시각화'
        description: '차트, 그래프 등 데이터 표시'
      - label: '데이터 입력/편집'
        description: '폼, 입력 필드 등'
      - label: '정보 표시'
        description: '카드, 리스트 등 정보 나열'
      - label: '네비게이션'
        description: '탭, 메뉴 등 화면 전환'
    multiSelect: true
```

#### 1.2 데이터 소스

```yaml
questions:
  - question: '데이터를 어디서 가져오나요?'
    header: '데이터 소스'
    options:
      - label: 'API 호출'
        description: 'React Query로 서버 데이터 fetch'
      - label: 'Props로 전달'
        description: '부모 컴포넌트에서 데이터 전달'
      - label: 'Context'
        description: '전역 상태에서 데이터 참조'
      - label: '로컬 상태만'
        description: '외부 데이터 없이 내부 상태만 사용'
    multiSelect: false
```

#### 1.3 상태 관리

```yaml
questions:
  - question: '어떤 상태들을 관리해야 하나요?'
    header: '상태 관리'
    options:
      - label: '로딩 상태'
        description: '데이터 로딩 중 스켈레톤/스피너 표시'
      - label: '에러 상태'
        description: '에러 발생 시 에러 메시지 표시'
      - label: '빈 데이터 상태'
        description: '데이터가 없을 때 Empty 상태 표시'
      - label: '선택/활성 상태'
        description: '사용자 선택에 따른 하이라이트'
    multiSelect: true
```

#### 1.4 참고 컴포넌트

```yaml
questions:
  - question: '참고할 기존 컴포넌트가 있나요?'
    header: '참고 컴포넌트'
    options:
      - label: 'MetricSummaryComments'
        description: 'AI 분석 결과 표시 컴포넌트'
      - label: 'MetricCommentCards'
        description: '카드 형태 메트릭 표시'
      - label: '없음 - 새로 설계'
        description: '기존 패턴 없이 새로 설계'
    multiSelect: false
```

### 2. Analyze Patterns

Find similar components:

```bash
find src/pages -name "*.tsx" -path "*/components/*"
```

### 3. Generate spec.md

**/vague 결과가 있다면 해당 내용을 개요와 기능 요구사항에 반영합니다.**

````markdown
# $ARGUMENTS 요구사항 명세

## 개요

{/vague의 Goal 또는 사용자 답변에서 추출}

## 기능 요구사항

{/vague의 Scope 또는 AskUserQuestion 결과 반영}

- [ ] 요구사항 1
- [ ] 요구사항 2

## 제약사항

{/vague의 Constraints 반영}

## 성공 기준

{/vague의 Success Criteria 반영}

## Props 인터페이스

```typescript
interface ${ARGUMENTS}Props {
  data: DataType
  onAction?: () => void
}
```
````

## UI/UX 스펙

| 상태      | 표시          |
| --------- | ------------- |
| 로딩      | Skeleton      |
| 에러      | Error message |
| 빈 데이터 | Empty state   |

## 데이터 스펙

- API: `GET /api/...`
- Response: `ApiResponse`

````

### 4. Generate prompt.md

```markdown
# $ARGUMENTS 구현 가이드

## 파일 구조
````

src/pages/{feature}/components/$ARGUMENTS/
├── index.tsx
├── types.ts
├── utils.ts
├── components/
└── **tests**/

```

## 구현 단계
1. types.ts - 타입 정의
2. utils.ts - 변환 함수 (translateFn 패턴)
3. components/ - 서브 컴포넌트
4. index.tsx - 메인 컴포넌트
5. __tests__/ - 테스트 코드

## 참고 메모리
- `ai-component-transform-patterns`
- `translation-key-structure`
```

### 5. Save

Create directory and write files:

```bash
mkdir -p docs/specs/$ARGUMENTS
```

## Rules

1. **먼저 /vague 사용 여부 확인**: 모호한 요구사항은 명확화 먼저
2. **요구사항은 질문으로 수집**: 추측하지 말고 AskUserQuestion 사용
3. **기존 패턴 참고**: 프로젝트 컨벤션 따르기
4. **점진적 구체화**: 대략적 → 상세하게
5. **/vague 결과 활용**: 명확화된 Goal, Scope, Constraints를 문서에 반영
