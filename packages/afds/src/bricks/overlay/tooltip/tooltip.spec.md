# Tooltip

> base-ui Tooltip 합성 컴포넌트를 그대로 노출하는 dot-notation API. 스타일이 적용된 Popup·Arrow·Close 파트를 자유롭게 조합한다.

## Rules

1. `Tooltip.Provider`로 감싸는 것을 권장 (지연 공유)
2. `Tooltip.Trigger`에는 `render={<Button>}` 형태로 외부 컴포넌트를 전달
3. `Tooltip.Popup`은 반드시 `Tooltip.Positioner` 안에 배치
4. 시각 변경 — `className` override (`twMerge` 보장)

## Examples

```tsx
<Tooltip.Provider>
  <Tooltip.Root>
    <Tooltip.Trigger render={<Button>호버</Button>} />
    <Tooltip.Portal>
      <Tooltip.Positioner side="top" sideOffset={8}>
        <Tooltip.Popup size="md">
          툴팁 텍스트
          <Tooltip.Arrow />
        </Tooltip.Popup>
      </Tooltip.Positioner>
    </Tooltip.Portal>
  </Tooltip.Root>
</Tooltip.Provider>
```
