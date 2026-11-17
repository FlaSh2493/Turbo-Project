---
name: update-component-docs
description: Update tests and Storybook for a modified component. Trigger on "테스트 업데이트", "스토리북 업데이트", "update tests", "update storybook", "컴포넌트 문서화", "테스트 코드 작성", "스토리 작성".
---

# Update Component Docs

수정된 컴포넌트의 테스트 코드와 스토리북을 업데이트합니다.

## Input

- `$ARGUMENTS`: 컴포넌트 경로 (예: `src/pages/overview/components/ai/MetricSummaryComments`)

## Workflow

### 1. Analyze Component

Read and analyze from `$ARGUMENTS`:

- `index.tsx` - Props interface, state management
- `types.ts` - Type definitions
- Existing `__tests__/` folder
- Related Storybook files

### 2. Handle Ambiguity with AskUserQuestion

**IMPORTANT**: 모호한 상황에서는 반드시 AskUserQuestion 도구를 사용하세요.

#### 2.1 업데이트 범위가 불명확한 경우

```yaml
questions:
  - question: '어떤 문서를 업데이트할까요?'
    header: '업데이트 범위'
    options:
      - label: '테스트만'
        description: '__tests__/ 폴더의 테스트 파일만 업데이트'
      - label: '스토리북만'
        description: '*.stories.tsx 파일만 업데이트'
      - label: '둘 다'
        description: '테스트와 스토리북 모두 업데이트'
    multiSelect: false
```

#### 2.2 테스트 케이스 범위

```yaml
questions:
  - question: '어떤 테스트 케이스를 포함할까요?'
    header: '테스트 범위'
    options:
      - label: '기본 렌더링만'
        description: '컴포넌트가 렌더링되는지만 확인'
      - label: 'Props 변형 포함'
        description: '다양한 Props 조합 테스트 추가'
      - label: '전체 커버리지'
        description: '로딩/에러/빈데이터/인터랙션 모두 포함'
    multiSelect: false
```

#### 2.3 스토리북 스토리 구성

```yaml
questions:
  - question: '스토리북에 어떤 스토리를 포함할까요?'
    header: '스토리 구성'
    options:
      - label: 'Default만'
        description: '기본 상태 스토리 하나만'
      - label: '주요 상태들'
        description: 'Default, Loading, Empty, Error'
      - label: '전체 변형'
        description: '모든 Props 조합의 스토리'
    multiSelect: false
```

### 3. Update Tests

**Location**: `$ARGUMENTS/__tests__/`

```typescript
import { renderWithProviders } from '@/tests/utils'

describe('ComponentName', () => {
  it('renders correctly', () => {
    renderWithProviders(<Component {...mockProps} />)
    expect(screen.getByText('expected')).toBeInTheDocument()
  })
})
```

**Required test cases**:

- Default rendering
- Props variations
- Loading/Error states (if applicable)
- Empty data state
- User interactions

### 4. Update Storybook

**Location**: `src/stories/pages/[feature]/components/[Component].stories.tsx`

```typescript
import { withProviders } from '@/stories/utils'

const meta: Meta<typeof Component> = {
  title: 'Pages/Feature/ComponentName',
  component: Component,
  decorators: [withProviders({ useIntl: true, useReactQuery: true })],
}

export const Default: Story = {
  args: {
    /* default props */
  },
}
export const Loading: Story = { args: { isLoading: true } }
export const Empty: Story = { args: { data: [] } }
```

### 5. Verify

Run tests to ensure they pass:

```bash
npm test -- --testPathPattern="ComponentName"
```

## Rules

1. **모호하면 물어보기**: 추측하지 말고 AskUserQuestion 사용
2. **Tests in `__tests__/`**: 테스트는 반드시 `__tests__/` 폴더에
3. **Use helpers**: `renderWithProviders`, `withProviders` 사용
4. **Number formatting**: IntlProvider에서 숫자는 `1,234` 형식
5. **Reference memories**: MSW는 `msw-storybook-guide` 참고
