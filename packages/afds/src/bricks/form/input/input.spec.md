# Input

> 디자인 토큰이 적용된 입력 필드 dot-notation 합성 컴포넌트. Field + 선택적 Icon/ClearButton을 자유롭게 조합한다.

## Rules

1. `Input.Root`의 `state`와 `Input.Field`의 `state`는 같은 값으로 유지 (스타일 일관성)
2. controlled 사용 시 `Field`에 `value`/`onChange` 직접 전달
3. icon은 Field 앞, ClearButton은 Field 뒤에 배치 (시각 순서)

## Examples

```tsx
;<Input.Root size="sm" state="enabled">
  <Input.Field placeholder="입력" />
</Input.Root>

// 검색 필드 (icon + clear)
const [value, setValue] = useState('')
return (
  <Input.Root size="sm" state="enabled">
    <Input.Icon>
      <SearchIcon size={16} />
    </Input.Icon>
    <Input.Field value={value} onChange={e => setValue(e.target.value)} placeholder="검색" />
    {value && (
      <Input.ClearButton onClick={() => setValue('')}>
        <CircleXIcon size={16} className="h-4 w-4" />
      </Input.ClearButton>
    )}
  </Input.Root>
)
```
