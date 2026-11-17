# MultiSelect

> 드롭다운 목록에서 여러 값을 선택하는 폼 컴포넌트 (체크박스 기반, 토글 즉시 발화)

## Rules

1. `MultiSelect.Item`은 항상 체크박스 UI를 포함한다. 별도 `CheckboxItem` 없음.
2. 아이템 토글 시 `onValueChange`가 **즉시 호출**된다. 컴포넌트 내부에 임시 상태(pending)는 없다.
3. Confirm/Cancel UX가 필요하면 소비자가 외부에서 `useMultiSelectDraft`를 사용해 draft state를 관리한다. `MultiSelect.Footer`는 액션 버튼 레이아웃만 제공한다.
4. `name`을 지정하면 선택된 값마다 같은 `name`의 hidden input이 렌더되어 `FormData.getAll(name)`으로 배열을 받을 수 있다 (`<select multiple>`과 동일 직렬화).
5. `<label>` 없으면 `aria-label` 필수.
6. `MultiSelect.Trigger`의 `render` prop은 **선택값이 있을 때만 호출**된다. 빈 상태는 `placeholder` prop으로 자동 렌더되므로 빈 분기를 작성하지 않는다.
7. `MultiSelect.List`/`Fallback`은 **self-gating하지 않는다**(마운트되면 항상 렌더). loading/빈 상태는 소비자가 외부 상태로 **조건부 마운트**해 결정한다 — `Fallback`은 빈/로딩 콘텐츠 공용 컨테이너다.
8. `MultiSelect.Search`는 **controlled 전용**(`value`/`onChange` 필수). 검색어 상태·디바운스·필터링은 소비자가 외부에서 직접 구현하고 필터된 결과를 `options`로 주입한다.
9. `MultiSelect.Item`의 children이 글자로만 되어 있으면 한 줄로 두고 넘치면 말줄임하며, 마우스를 올리면 `title`로 전체 이름을 보여준다. Item에 `title`을 주면(빈 문자열 포함) 그 값이 우선한다. 요소나 Fragment, 컴포넌트로 감싼 children은 그대로 렌더되므로 소비자가 `min-w-0 truncate`로 직접 자르고, 키보드로도 전체 이름이 보여야 하면 Tooltip을 단다.

## Examples

```tsx
const [selected, setSelected] = useState<string[]>([])

<MultiSelect options={options} value={selected} onValueChange={setSelected}>
  <MultiSelect.Trigger placeholder="태그를 선택하세요" />
  <MultiSelect.Content>
    <MultiSelect.List>
      {options.map(o => (
        <MultiSelect.Item key={o.value} value={o.value}>
          {o.label}
        </MultiSelect.Item>
      ))}
    </MultiSelect.List>
  </MultiSelect.Content>
</MultiSelect>
```

Trigger 표시 텍스트를 커스텀할 때는 `render` prop을 사용한다 (선택값이 있을 때만 호출됨):

```tsx
<MultiSelect.Trigger
  placeholder="선택"
  render={({ selectedOptions: [first, ...rest] }) =>
    rest.length > 0 ? `${first.label} 외 ${rest.length}개` : first.label
  }
/>
```

Trigger 열림/닫힘 아이콘을 커스텀할 때는 `indicator` prop을 사용한다:

```tsx
<MultiSelect.Trigger placeholder="선택" indicator={<ChevronsUpDownIcon size={16} />} />
```

검색/로딩/빈 상태는 **소비자가 외부 상태로 직접 분기**한다 — `Search`는 controlled, `Fallback`/`List`는 self-gating하지 않으므로 조건부로 마운트한다:

```tsx
const [q, setQ] = useState('')
const results = options.filter(o => o.label.toLowerCase().includes(q.toLowerCase()))

<MultiSelect options={results} value={selected} onValueChange={setSelected}>
  <MultiSelect.Trigger placeholder="선택" />
  <MultiSelect.Content>
    <MultiSelect.Search value={q} onChange={setQ} />
    {isFetching ? (
      <MultiSelect.Fallback>
        <Spinner size="sm" fullscreen="static" />
      </MultiSelect.Fallback>
    ) : results.length === 0 ? (
      <MultiSelect.Fallback>No results</MultiSelect.Fallback>
    ) : (
      <MultiSelect.List>
        {results.map(o => (
          <MultiSelect.Item key={o.value} value={o.value}>
            {o.label}
          </MultiSelect.Item>
        ))}
      </MultiSelect.List>
    )}
  </MultiSelect.Content>
</MultiSelect>
```
