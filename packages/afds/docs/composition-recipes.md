# 에이전트 전용 컴포넌트 조립 레시피 (Agent-First Composition Recipes)

이 문서는 AI 에이전트가 AFDS 컴포넌트를 사용하여 UI를 생성하거나 수정할 때 반드시 준수해야 하는 **논리적 조립 규칙**과 **데이터 속성 활용법**을 정의합니다.

---

## 🤖 에이전트를 위한 핵심 원칙

1.  **데이터 속성 기반 인식**: 모든 컴포넌트는 `data-component`와 `data-slot` 속성을 가집니다. 코드를 분석할 때 클래스명(`className`)보다 이 속성들을 우선하여 컴포넌트의 정체를 파악하세요.
2.  **복합 컴포넌트(Compound) 패턴**: `Dialog`, `Select`, `Tabs` 등은 반드시 `Root`, `Trigger`, `Content` 등 지정된 서브 컴포넌트의 조합으로 구성해야 합니다.
3.  **Props 정의 참조**: Props의 타입·기본값·enum 값은 각 컴포넌트 `.tsx`의 Props 인터페이스(JSDoc 포함)와 `.style.ts`의 CVA 정의를 기준으로 판단하세요.

---

## 🍱 주요 조립 레시피

### 1. 오버레이 패턴 (Dialog, Drawer, Popover)

모든 오버레이 컴포넌트는 다음과 같은 계층 구조를 가집니다.

- **규칙**: `Root` 내부에 `Trigger`와 `Content`가 위치해야 하며, `Content` 내부에는 `Title`과 `Description`을 포함하는 것이 권장됩니다.

```tsx
// ✅ 올바른 조립 예시
<Dialog>
  <Dialog.Trigger>Open Dialog</Dialog.Trigger>
  <Dialog.Content>
    <Dialog.Title>Title</Dialog.Title>
    <Dialog.Description>Description</Dialog.Description>
    <Dialog.Close iconOnly />
  </Dialog.Content>
</Dialog>
```

- **에이전트 팁**: `render` prop을 사용하여 `Trigger`나 `Close` 내부의 `Button` 스타일을 AFDS 표준으로 유지하세요. (예: `<Modal.Close render={<Button>닫기</Button>} />`)

### 2. 선택 입력 패턴 (Select, Combobox)

- **규칙**: `Select`는 단순 선택에, `Combobox`는 검색이 필요한 대량의 목록 선택에 사용하세요.
- **구조**: `Trigger` 내부에는 `Value`를 표시하고, `Content` 내부에는 `Item`들을 배치합니다.

```tsx
// ✅ 올바른 Select 조립
<Select value={value} onValueChange={setValue}>
  <Select.Trigger placeholder="선택하세요..." />
  <Select.Content>
    <Select.Group>
      <Select.GroupLabel>카테고리</Select.GroupLabel>
      <Select.Item value="1">옵션 1</Select.Item>
      <Select.Item value="2">옵션 2</Select.Item>
    </Select.Group>
  </Select.Content>
</Select>
```

### 3. 상태 피드백 패턴 (Loading & Error)

- **규칙**: 데이터 로딩 중에는 `Skeleton` 또는 `Spinner`를 사용하고, 에러 시에는 `Alert`를 상단에 배치합니다.

```tsx
// ✅ 로딩 중 (Skeleton 활용)
{
  isLoading ? (
    <Stack gap={2}>
      <Skeleton className="h-4 w-[250px]" />
      <Skeleton className="h-4 w-[200px]" />
    </Stack>
  ) : (
    <Text>{data.content}</Text>
  )
}

// ✅ 에러 발생 시 (Alert 활용)
{
  error && (
    <Alert variant="destructive">
      <Alert.Title>에러 발생</Alert.Title>
      <Alert.Description>{error.message}</Alert.Description>
    </Alert>
  )
}
```

### 4. 기초 부품 조립 패턴 (Bricks)

- **Collapsible**: 상세 정보 토글, 사이드바 섹션 등 단순 개폐 로직에 사용합니다.
- **NumberField**: 수량, 금액 등 정밀한 숫자 입력이 필요한 경우에 사용합니다.
- **Separator**: 레이아웃 구획을 명확히 하고 시각적 구분자를 추가할 때 사용합니다.
- **VisuallyHidden**: 아이콘 버튼의 텍스트 레이블 등 시각적으로는 숨기되 접근성이 필요한 경우에 사용합니다.
- **FocusTrap**: 다이얼로그나 팝오버 내부에서 포커스 이동을 제어하여 접근성을 보장할 때 사용합니다.

```tsx
// ✅ NumberField 조립 예시
<NumberField defaultValue={10} min={0} max={100}>
  <NumberField.Group>
    <NumberField.Input />
    <NumberField.Stepper>
      <NumberField.Increment />
      <NumberField.Decrement />
    </NumberField.Stepper>
  </NumberField.Group>
</NumberField>

// ✅ VisuallyHidden 조립 예시
<IconButton aria-label="닫기">
  <VisuallyHidden>닫기</VisuallyHidden>
  <XIcon />
</IconButton>
```

---

## 🔍 데이터 속성 가이드

에이전트는 UI를 수정할 때 다음 속성을 사용하여 타겟 요소를 정확히 찾아야 합니다.

| 속성             | 설명                        | 예시                                |
| :--------------- | :-------------------------- | :---------------------------------- |
| `data-component` | 최상위 컴포넌트 유형        | `Dialog`, `Select`, `Button`        |
| `data-slot`      | 컴포넌트 내부의 특정 역할   | `dialog-content`, `select-trigger`  |
| `data-variant`   | 적용된 시각적 변형(Variant) | `default`, `outline`, `destructive` |
| `data-size`      | 적용된 크기 변형            | `sm`, `md`, `lg`                    |

---

## 🚫 금지 사항 (Anti-Patterns)

1.  **프리미티브 직접 노출 금지**: `DialogPrimitive` 등을 직접 사용하지 마세요. 반드시 `afds`에서 제공하는 스타일링된 컴포넌트(`Dialog`)를 사용하세요.
2.  **임의 클래스 남용 금지**: 레이아웃 간격 조정은 가급적 `Stack`, `Flex`, `Grid`의 `gap` 속성을 사용하고, `className`을 통한 수동 마진(`mt-4` 등) 추가를 지양하세요.
3.  **접근성 누락 금지**: 아이콘만 있는 버튼(`IconButton`) 등은 반드시 `aria-label` 속성을 포함해야 합니다.
