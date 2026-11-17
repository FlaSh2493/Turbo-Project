# 레이아웃 컴포넌트 개선 사항

## 개요

핵심 레이아웃 컴포넌트(`Stack`, `Flex`, `Grid`)를 정비하여 Tailwind CSS v4와의 통합을 개선하고 API 일관성을 높였습니다.

## 주요 변경 사항

### 1. CVA를 통한 안정적인 스페이싱

이전에는 `gap` 속성을 `gap-${gap}`과 같은 런타임 문자열 보간법으로 처리했습니다. 이 방식은 Tailwind 클래스가 미리 컴파일되지 않을 경우 스타일이 적용되지 않는 문제가 발생할 수 있습니다.

- **개선된 상태**: `gap`이 모든 레이아웃 컴포넌트의 공식 CVA variant로 포함되었습니다. 모든 간격 값(0, 0.5, 1, 1.5, ..., 24)이 해당 Tailwind 클래스에 명시적으로 매핑되었습니다.

### 2. 정렬(Alignment) 및 정렬 방식(Justification)

컴포넌트 간의 정렬 관련 Props가 표준화되었습니다:

- **Stack**: 이제 `align` 및 `justify` variant를 지원합니다.
- **Flex**: `direction`, `align`, `justify`, `wrap` variant를 지원합니다.
- **Grid**: `cols`, `rows`, `gap` variant를 지원합니다.

### 3. Tailwind v4 통합

컴포넌트들이 이제 런타임에 동적으로 클래스를 생성하지 않고, Tailwind v4의 클래스 기반 접근 방식에 더 잘 맞도록 설계되었습니다.

```tsx
// 개선된 Stack 사용 예시
<Stack direction="horizontal" gap={4} align="center" justify="between">
  <div>왼쪽</div>
  <div>오른쪽</div>
</Stack>

// 개선된 Grid 사용 예시
<Grid cols={3} gap={4}>
  <div>셀 1</div>
  <div>셀 2</div>
  <div>셀 3</div>
</Grid>
```

## 마이그레이션 가이드

API는 대부분 하위 호환성을 유지하지만, `gap` 및 `align` 사용 시 새로운 variant 정의와 일치하는지 확인하는 것을 권장합니다.

- `gap` Prop은 이제 명시적인 Tailwind 클래스로 매핑되는 `Spacing` 타입을 허용합니다.
- `direction` Prop은 이제 명시적인 variant를 사용합니다.
- 모든 레이아웃 컴포넌트에서 `align` 및 `justify` Prop이 더욱 일관되게 동작합니다.
