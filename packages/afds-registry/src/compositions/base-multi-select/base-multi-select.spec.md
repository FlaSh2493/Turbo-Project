---
domain: common
category: form
---

# BaseMultiSelect

> `MultiSelect`를 감싼 간편 래퍼. 옵션 배열만 전달하면 즉시 사용 가능하다.

## Rules

1. Footer 없이(`hasFooter={false}`) 쓰면 외부 트리거로 commit 처리를 직접 해야 한다
2. 옵션 라벨이 잘리면 자동으로 `OverflowTooltip`이 적용된다
3. 컴파운드 구성(커스텀 옵션 렌더 등)이 필요하면 `MultiSelect`를 직접 사용한다

## Examples

```tsx
<BaseMultiSelect
  value={values}
  onValueChange={setValues}
  options={options}
  hasSearch
  placeholder="태그 선택"
/>
```
