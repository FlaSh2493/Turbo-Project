# Select

> 드롭다운 목록에서 단일 값을 선택하는 폼 컴포넌트

## Rules

1. `Select.Item`에 `value` prop 필수
2. `error` 상태 시 `aria-invalid="true"` 필수
3. `Select.List`는 `children`으로 아이템 마크업을 받는다
4. `<label>` 없으면 `aria-label` 필수
5. `name`을 지정하면 현재 값과 동기화되는 단일 hidden input이 렌더된다.
6. 다중 선택이 필요하면 `Select` 대신 `MultiSelect`를 사용한다.
7. `Select.Trigger`의 `render` prop은 **선택값이 있을 때만 호출**된다. 빈 상태는 `placeholder` prop으로 자동 렌더되므로 빈 분기를 작성하지 않는다.
8. `Select.List`/`Fallback`은 **self-gating하지 않는다**(마운트되면 항상 렌더). loading/빈 상태는 소비자가 외부 상태로 **조건부 마운트**해 결정한다 — `Fallback`은 빈/로딩 콘텐츠 공용 컨테이너다.
9. `Select.Search`는 **controlled 전용**(`value`/`onChange` 필수). 검색어 상태·디바운스·필터링은 소비자가 외부에서 직접 구현하고 필터된 결과를 `options`로 주입한다.
10. `Select.Item`의 children이 글자로만 되어 있으면 한 줄로 두고 넘치면 말줄임하며, 마우스를 올리면 `title`로 전체 이름을 보여준다. Item에 `title`을 주면(빈 문자열 포함) 그 값이 우선한다. 요소나 Fragment, 컴포넌트로 감싼 children은 그대로 렌더되므로 소비자가 `min-w-0 truncate`로 직접 자르고, 키보드로도 전체 이름이 보여야 하면 Tooltip을 단다.

## Examples

```tsx
<Select options={options} value={selected} onValueChange={setSelected}>
  <Select.Trigger placeholder="선택하세요" />
  <Select.Content>
    <Select.List>
      {options.map(o => (
        <Select.Item key={o.value} value={o.value}>
          {o.label}
        </Select.Item>
      ))}
    </Select.List>
  </Select.Content>
</Select>
```

Trigger 표시 텍스트를 커스텀할 때는 `render` prop을 사용한다 (선택값이 있을 때만 호출됨):

```tsx
<Select.Trigger
  placeholder="선택"
  render={({ selectedOption }) => `선택: ${selectedOption.label}`}
/>
```

Trigger 열림/닫힘 아이콘을 커스텀할 때는 `indicator` prop을 사용한다:

```tsx
<Select.Trigger placeholder="선택" indicator={<ChevronsUpDownIcon size={16} />} />
```

검색/로딩/빈 상태는 **소비자가 외부 상태로 직접 분기**한다 — `Search`는 controlled, `Fallback`/`List`는 self-gating하지 않으므로 조건부로 마운트한다:

```tsx
const [q, setQ] = useState('')
const results = options.filter(o => o.label.toLowerCase().includes(q.toLowerCase()))

<Select options={results} value={value} onValueChange={setValue}>
  <Select.Trigger placeholder="선택" />
  <Select.Content>
    <Select.Search value={q} onChange={setQ} />
    {isFetching ? (
      <Select.Fallback>
        <Spinner size="sm" fullscreen="static" />
      </Select.Fallback>
    ) : results.length === 0 ? (
      <Select.Fallback>No options</Select.Fallback>
    ) : (
      <Select.List>
        {results.map(o => (
          <Select.Item key={o.value} value={o.value}>
            {o.label}
          </Select.Item>
        ))}
      </Select.List>
    )}
  </Select.Content>
</Select>
```
