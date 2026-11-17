import type { Meta, StoryObj } from '@storybook/react'
import { Menu } from '@base-ui/react'
import {
  Button,
  MultiSelect,
  Spinner,
  Tooltip,
  type MultiSelectTriggerRenderState,
} from '@turbo-project/afds/bricks'
import {
  useMultiSelectContext,
  useMultiSelectDraft,
  type SelectOption,
} from '@turbo-project/afds/headless'
import { CheckIcon, ChevronsUpDownIcon, UserIcon } from 'lucide-react'
import { useMemo, useRef, useState } from 'react'

/**
 *
 * 드롭다운에서 **여러 값**을 선택하는 컴포넌트입니다. 각 아이템에 체크박스가 함께 렌더되며,
 * 토글 즉시 `onValueChange`가 발화됩니다.
 *
 * 단일 선택만 필요하면 `Select`를 사용하세요.
 *
 * ### 동작 모델
 * - 아이템 토글 → 즉시 `onValueChange(next)` 발화 (내부 임시 상태 없음)
 * - `MultiSelect.Footer`는 **선택적** layout-only 슬롯(상태 관리 없음). Confirm UX가 필요할 때만 `useMultiSelectDraft`와 함께 children에 직접 조립한다.
 *
 * ### Compound Components 구조
 * ```tsx
 * <MultiSelect>
 *   <MultiSelect.Trigger />
 *   <MultiSelect.Content>
 *     <MultiSelect.Search />
 *     <MultiSelect.List>
 *       <MultiSelect.Item />
 *     </MultiSelect.List>
 *     <MultiSelect.Footer />
 *   </MultiSelect.Content>
 * </MultiSelect>
 * ```
 */
const argTypes = {
  size: {
    control: { type: 'select' as const },
    options: ['sm', 'md'],
    description: 'MultiSelect 크기 (모든 sub-component에 컨텍스트로 전파)',
    table: {
      type: { summary: "'sm' | 'md'" },
      defaultValue: { summary: 'sm' },
      category: 'MultiSelect.Root',
    },
  },
}

const meta = {
  title: 'AFDS / Bricks / Form / MultiSelect',
  component: MultiSelect,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
MultiSelect는 Compound Component 패턴의 **다중 선택** 드롭다운입니다.

**Import:**
\`\`\`tsx
import { MultiSelect } from '@turbo-project/afds/bricks'
\`\`\`

### 기본 사용법 (즉시 적용)
\`\`\`tsx
<MultiSelect options={options} value={values} onValueChange={setValues}>
  <MultiSelect.Trigger placeholder="선택하세요" />
  <MultiSelect.Content>
    <MultiSelect.List>
      {options.map(o => (
        <MultiSelect.Item key={o.value} value={o.value}>{o.label}</MultiSelect.Item>
      ))}
    </MultiSelect.List>
  </MultiSelect.Content>
</MultiSelect>
\`\`\`
        `,
      },
    },
  },
  tags: ['autodocs'],
  argTypes,
} satisfies Meta<typeof MultiSelect>

export default meta
type Story = StoryObj<typeof meta>

const fruitOptions = [
  { label: '사과', value: 'apple' },
  { label: '바나나', value: 'banana' },
  { label: '오렌지', value: 'orange' },
  { label: '포도', value: 'grape' },
  { label: '수박', value: 'watermelon' },
  { label: '멜론', value: 'melon' },
  { label: '키위', value: 'kiwi' },
]

const defaultOptions = [
  { label: '옵션 1', value: '1' },
  { label: '옵션 2', value: '2' },
]

export const Default: Story = {
  args: { children: null, size: 'sm' },
  render: function DefaultMultiSelect(args) {
    const [values, setValues] = useState<string[]>([])
    return (
      <div className="w-[300px]">
        <MultiSelect {...args} options={defaultOptions} value={values} onValueChange={setValues}>
          <MultiSelect.Trigger placeholder="선택하세요" />
          <MultiSelect.Content>
            <MultiSelect.List>
              {defaultOptions.map(option => (
                <MultiSelect.Item key={option.value} value={option.value}>
                  {option.label}
                </MultiSelect.Item>
              ))}
            </MultiSelect.List>
          </MultiSelect.Content>
        </MultiSelect>
      </div>
    )
  },
}

export const Uncontrolled: Story = {
  args: { children: null },
  render: function UncontrolledMultiSelect() {
    return (
      <div className="w-[300px]">
        <MultiSelect options={defaultOptions} defaultValue={['1']}>
          <MultiSelect.Trigger placeholder="선택하세요" />
          <MultiSelect.Content>
            <MultiSelect.List>
              {defaultOptions.map(option => (
                <MultiSelect.Item key={option.value} value={option.value}>
                  {option.label}
                </MultiSelect.Item>
              ))}
            </MultiSelect.List>
          </MultiSelect.Content>
        </MultiSelect>
      </div>
    )
  },
}

export const SearchOnly: Story = {
  args: { children: null },
  render: function SearchOnlyExample() {
    const [values, setValues] = useState<string[]>([])
    const [q, setQ] = useState('')

    const frameworkOptions = [
      { label: 'React', value: 'react' },
      { label: 'Vue', value: 'vue' },
      { label: 'Svelte', value: 'svelte' },
      { label: 'Next.js', value: 'nextjs' },
    ]
    const results = frameworkOptions.filter(o =>
      o.label.toLowerCase().includes(q.trim().toLowerCase()),
    )

    return (
      <div className="flex flex-col gap-4 w-[300px]">
        <h3 className="text-lg font-bold">Search Included</h3>
        <MultiSelect value={values} onValueChange={setValues} size="md" options={frameworkOptions}>
          <MultiSelect.Trigger placeholder="항목을 검색하고 선택하세요" />
          <MultiSelect.Content>
            <MultiSelect.Search value={q} onChange={setQ} />
            {results.length === 0 ? (
              <MultiSelect.Fallback>No results</MultiSelect.Fallback>
            ) : (
              <MultiSelect.List>
                {results.map(option => (
                  <MultiSelect.Item key={option.value} value={option.value}>
                    {option.label}
                  </MultiSelect.Item>
                ))}
              </MultiSelect.List>
            )}
          </MultiSelect.Content>
        </MultiSelect>
      </div>
    )
  },
}

export const TruncatedItems: Story = {
  args: { children: null },
  render: function TruncatedItemsExample() {
    const [textValues, setTextValues] = useState<string[]>([])
    const [values, setValues] = useState<string[]>([])

    const longOptions = [
      { label: '아주 긴 옵션 텍스트가 들어가서 잘릴 수 있는 첫 번째 항목', value: 'opt1' },
      { label: '두 번째로 긴 캠페인 이름: 2024 여름 시즌 프로모션 이벤트', value: 'opt2' },
      { label: '세 번째 항목 - 브랜드 인지도 향상을 위한 디스플레이 광고 캠페인', value: 'opt3' },
      { label: '짧은 항목', value: 'opt4' },
      { label: '다섯 번째: 리타게팅 전환 최적화 캠페인 (Q4 2024)', value: 'opt5' },
    ]

    return (
      <div className="flex flex-col gap-4 w-[220px]">
        <h3 className="text-lg font-bold">Truncated Items</h3>
        <p className="text-sm">글자 children: 한 줄 말줄임, 전체 이름은 title</p>
        <MultiSelect value={textValues} onValueChange={setTextValues} options={longOptions}>
          <MultiSelect.Trigger placeholder="항목 선택" />
          <MultiSelect.Content>
            <MultiSelect.List>
              {longOptions.map(option => (
                <MultiSelect.Item key={option.value} value={option.value}>
                  {option.label}
                </MultiSelect.Item>
              ))}
            </MultiSelect.List>
          </MultiSelect.Content>
        </MultiSelect>
        <p className="text-sm">요소 children: 직접 자르고 Tooltip 을 단다</p>
        <MultiSelect value={values} onValueChange={setValues} options={longOptions}>
          <MultiSelect.Trigger placeholder="항목 선택" />
          <MultiSelect.Content>
            <MultiSelect.List>
              {longOptions.map(option => (
                <MultiSelect.Item key={option.value} value={option.value}>
                  {/* `OverflowTooltip`(오버플로 감지) 은 컴포지션이라 afds-registry 로 이전됐다 —
                      bricks 스토리는 bricks 만으로 조합한다. 항상 뜨는 Tooltip 이라 감지
                      동작 자체는 보여주지 못하지만, 잘린 텍스트 + 툴팁 패턴은 동일하다. */}
                  <Tooltip.Root>
                    <Tooltip.Trigger
                      render={<span className="min-w-0 flex-1 truncate">{option.label}</span>}
                    />
                    <Tooltip.Portal>
                      <Tooltip.Positioner side="top">
                        <Tooltip.Popup size="md">{option.label}</Tooltip.Popup>
                      </Tooltip.Positioner>
                    </Tooltip.Portal>
                  </Tooltip.Root>
                </MultiSelect.Item>
              ))}
            </MultiSelect.List>
          </MultiSelect.Content>
        </MultiSelect>
        <p className="text-sm text-gray-500 break-all">선택된 값: {values.join(', ')}</p>
      </div>
    )
  },
}

export const ScrollableList: Story = {
  args: { children: null },
  render: function ScrollableListExample() {
    const [values, setValues] = useState<string[]>([])

    const manyOptions = Array.from({ length: 20 }, (_, i) => ({
      label: `옵션 ${i + 1}`,
      value: String(i + 1),
    }))

    return (
      <div className="flex flex-col gap-4 w-[200px]">
        <h3 className="text-lg font-bold">Multi (20개)</h3>
        <MultiSelect value={values} onValueChange={setValues} options={manyOptions}>
          <MultiSelect.Trigger placeholder="선택하세요" />
          <MultiSelect.Content>
            <MultiSelect.List>
              {manyOptions.map(option => (
                <MultiSelect.Item key={option.value} value={option.value}>
                  {option.label}
                </MultiSelect.Item>
              ))}
            </MultiSelect.List>
          </MultiSelect.Content>
        </MultiSelect>
      </div>
    )
  },
}

export const EmptyState: Story = {
  args: { children: null },
  render: function EmptyStateExample() {
    const [values, setValues] = useState<string[]>([])
    const [q, setQ] = useState('')

    const searchOptions = [
      { label: 'React', value: 'react' },
      { label: 'Vue', value: 'vue' },
    ]
    const results = searchOptions.filter(o =>
      o.label.toLowerCase().includes(q.trim().toLowerCase()),
    )

    return (
      <div className="flex flex-col gap-8 w-[300px]">
        <div className="flex flex-col gap-2">
          <p className="text-sm font-bold">옵션 없음</p>
          <MultiSelect value={values} onValueChange={setValues} options={[]}>
            <MultiSelect.Trigger placeholder="선택하세요" />
            <MultiSelect.Content>
              <MultiSelect.Fallback>No options</MultiSelect.Fallback>
            </MultiSelect.Content>
          </MultiSelect>
        </div>

        <div className="flex flex-col gap-2">
          <p className="text-sm font-bold">검색 결과 없음 (검색해보세요)</p>
          <MultiSelect value={values} onValueChange={setValues} options={searchOptions}>
            <MultiSelect.Trigger placeholder="선택하세요" />
            <MultiSelect.Content>
              <MultiSelect.Search placeholder="검색" value={q} onChange={setQ} />
              {results.length === 0 ? (
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
        </div>
      </div>
    )
  },
}

export const Loading: Story = {
  args: { children: null },
  render: function LoadingExample() {
    const [values, setValues] = useState<string[]>([])
    const [loading, setLoading] = useState(false)
    const options = [
      { label: 'React', value: 'react' },
      { label: 'Vue', value: 'vue' },
      { label: 'Svelte', value: 'svelte' },
    ]

    const handleOpen = (open: boolean) => {
      if (!open) return
      setLoading(true)
      setTimeout(() => setLoading(false), 1500)
    }

    return (
      <div className="flex flex-col gap-2 w-[300px]">
        <p className="text-sm font-bold">비동기 로딩 (열면 1.5초간 Spinner, 이후 목록)</p>
        <MultiSelect
          value={values}
          onValueChange={setValues}
          options={options}
          onOpenChange={handleOpen}
          loading={loading}
        >
          <MultiSelect.Trigger placeholder="선택하세요" />
          <MultiSelect.Content>
            {loading ? (
              <MultiSelect.Fallback>
                <Spinner size="sm" fullscreen="static" />
              </MultiSelect.Fallback>
            ) : (
              <MultiSelect.List>
                {options.map(o => (
                  <MultiSelect.Item key={o.value} value={o.value}>
                    {o.label}
                  </MultiSelect.Item>
                ))}
              </MultiSelect.List>
            )}
          </MultiSelect.Content>
        </MultiSelect>
      </div>
    )
  },
}

export const CustomItem: Story = {
  args: { children: null },
  render: function CustomItemExample() {
    const [values, setValues] = useState<string[]>([])

    const userOptions = [
      { label: '김철수', value: 'user1', color: 'bg-blue-500' },
      { label: '이영희', value: 'user2', color: 'bg-green-500' },
      { label: '박민수', value: 'user3', color: 'bg-red-500' },
    ]

    return (
      <div className="flex flex-col gap-4 w-[300px]">
        <h3 className="text-lg font-bold">Custom Item Rendering</h3>
        <MultiSelect value={values} onValueChange={setValues} size="md" options={userOptions}>
          <MultiSelect.Trigger placeholder="사용자를 선택하세요" />
          <MultiSelect.Content>
            <MultiSelect.List>
              {userOptions.map(option => {
                const user = userOptions.find(o => o.value === option.value)
                if (!user) return null
                return (
                  <MultiSelect.Item key={option.value} value={option.value}>
                    <div className="flex items-center gap-2">
                      <div className={`w-6 h-6 rounded-full ${user.color}`} />
                      <span>{option.label}</span>
                    </div>
                  </MultiSelect.Item>
                )
              })}
            </MultiSelect.List>
          </MultiSelect.Content>
        </MultiSelect>
      </div>
    )
  },
}

/**
 * 선택 인디케이터를 커스텀하는 item. `MultiSelect.Item`은 체크박스를 내장하지만, 다른 선택 표시가
 * 필요하면 `MultiSelect.Item`을 안 쓰고 직접 조립한다. `useMultiSelectContext().options`에서
 * `selected` 플래그를 읽고, `onItemSelect`만 있으면 된다 (base-ui `Menu.Item`으로 키보드
 * 내비·하이라이트는 그대로 유지).
 */
function CheckRightItem({ option }: { option: SelectOption }) {
  const { onItemSelect } = useMultiSelectContext()
  return (
    <Menu.Item
      closeOnClick={false}
      onClick={() => onItemSelect(option.value)}
      data-selected={option.selected}
      className={`flex cursor-pointer items-center justify-between gap-2 rounded-afds-sm px-2.5 py-2 outline-none select-none data-[highlighted]:bg-afds-bg-surface-sunken ${
        option.selected ? 'text-afds-text-brand-subtle' : 'text-afds-text-primary'
      }`}
    >
      <span className="min-w-0 truncate">{option.label}</span>
      {option.selected ? <CheckIcon size={16} className="h-4 w-4 shrink-0" /> : null}
    </Menu.Item>
  )
}

function CheckRightItems() {
  const { options } = useMultiSelectContext()
  return (
    <>
      {options.map(option => (
        <CheckRightItem key={option.value} option={option} />
      ))}
    </>
  )
}

export const CustomSelectionIndicator: Story = {
  args: { children: null },
  render: function CustomSelectionIndicatorExample() {
    const [values, setValues] = useState<string[]>(['banana'])
    return (
      <div className="flex flex-col gap-4 w-[300px]">
        <h3 className="text-lg font-bold">선택 인디케이터 커스텀 (체크 아이콘)</h3>
        <MultiSelect value={values} onValueChange={setValues} options={fruitOptions}>
          <MultiSelect.Trigger placeholder="과일들을 선택하세요" />
          <MultiSelect.Content>
            <MultiSelect.List>
              <CheckRightItems />
            </MultiSelect.List>
          </MultiSelect.Content>
        </MultiSelect>
      </div>
    )
  },
}

/**
 * 검색 + 토글 즉시 적용 + 선택값 표시 — MultiSelect 전용 예시.
 */
export const WithSearch: Story = {
  args: { children: null },
  render: function WithSearchExample() {
    const [values, setValues] = useState<string[]>(['apple'])
    const [q, setQ] = useState('')
    const results = fruitOptions.filter(o => o.label.toLowerCase().includes(q.trim().toLowerCase()))

    return (
      <div className="flex flex-col gap-4 w-[350px]">
        <h3 className="text-lg font-bold">검색 + 토글 즉시 적용</h3>
        <MultiSelect value={values} onValueChange={setValues} size="sm" options={fruitOptions}>
          <MultiSelect.Trigger placeholder="과일들을 선택하세요" />
          <MultiSelect.Content>
            <MultiSelect.Search className="mb-2.5" value={q} onChange={setQ} />
            {results.length === 0 ? (
              <MultiSelect.Fallback>No results</MultiSelect.Fallback>
            ) : (
              <MultiSelect.List>
                {results.map(option => (
                  <MultiSelect.Item key={option.value} value={option.value}>
                    {option.label}
                  </MultiSelect.Item>
                ))}
              </MultiSelect.List>
            )}
          </MultiSelect.Content>
        </MultiSelect>
        <p className="text-sm">선택된 값들: {values.join(', ') || '(none)'}</p>
      </div>
    )
  },
}

/**
 * 비동기(서버) 검색 — controlled `Search`로 검색어를 받아 API 결과를 `options`로 주입한다.
 *
 * 소비자가 직접 챙겨야 하는 3가지:
 * 1. **디바운스** — `Search`의 `onChange`는 매 입력마다 발화하므로 소비자가 디바운스해 fetch한다.
 * 2. **race-condition 가드** — 응답 순서 역전 대비로 요청 id를 비교해 stale 응답을 버린다.
 * 3. **선택값 라벨 보존** — Trigger는 `options`에서 라벨을 resolve하므로, 검색 결과로 `options`를
 *    갈아끼울 때 이미 선택된 옵션을 함께 머지해 둔다.
 *
 * 로딩/빈 상태는 **외부 상태로 직접 분기**한다 — `Fallback`/`List`는 self-gating하지 않으므로
 * 소비자가 조건부로 마운트한다.
 */
export const AsyncSearch: Story = {
  args: { children: null },
  render: function AsyncSearchExample() {
    const directory: SelectOption[] = [
      { label: '김지수', value: 'jisoo' },
      { label: '이준혁', value: 'junhyuk' },
      { label: '박소연', value: 'soyeon' },
      { label: '최민준', value: 'minjun' },
      { label: '정하윤', value: 'hayoon' },
      { label: '강도현', value: 'dohyun' },
    ]
    // 서버 호출 흉내 (600ms 지연 + label 부분일치)
    const fakeFetch = (q: string) =>
      new Promise<SelectOption[]>(resolve => {
        setTimeout(() => resolve(directory.filter(o => o.label.includes(q.trim()))), 600)
      })

    const [values, setValues] = useState<string[]>([])
    const [selectedOptions, setSelectedOptions] = useState<SelectOption[]>([])
    const [results, setResults] = useState<SelectOption[]>([])
    const [loading, setLoading] = useState(false)
    const [query, setQuery] = useState('')

    const reqId = useRef(0)
    const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

    const runSearch = (q: string) => {
      const id = ++reqId.current
      setLoading(true)
      fakeFetch(q).then(res => {
        if (id !== reqId.current) return // (2) stale 응답 폐기
        setResults(res)
        setLoading(false)
      })
    }

    // (1) 디바운스 — Search는 controlled, 디바운스 후 fetch 트리거
    const handleSearchChange = (q: string) => {
      setQuery(q)
      if (timer.current) clearTimeout(timer.current)
      timer.current = setTimeout(() => runSearch(q), 300)
    }

    const handleOpenChange = (open: boolean) => {
      if (open) runSearch('') // 열릴 때 초기 목록
    }

    // (3) 선택값 라벨 보존 — 선택 시점의 옵션 데이터를 누적
    const handleValueChange = (next: string[]) => {
      setValues(next)
      setSelectedOptions(prev => {
        const known = new Map(prev.map(o => [o.value, o]))
        results.forEach(o => known.set(o.value, o))
        return next.map(v => known.get(v)).filter((o): o is SelectOption => Boolean(o))
      })
    }

    // Trigger가 라벨을 resolve할 수 있도록 선택 옵션 + 현재 결과를 머지해 전달
    const optionsForRoot = useMemo(() => {
      const map = new Map<string, SelectOption>()
      selectedOptions.forEach(o => map.set(o.value, o))
      results.forEach(o => map.set(o.value, o))
      return Array.from(map.values())
    }, [selectedOptions, results])

    return (
      <div className="flex w-[320px] flex-col gap-2">
        <h3 className="text-lg font-bold">비동기 검색 (서버 위임)</h3>
        <MultiSelect
          value={values}
          onValueChange={handleValueChange}
          options={optionsForRoot}
          onOpenChange={handleOpenChange}
        >
          <MultiSelect.Trigger placeholder="담당자 검색" />
          <MultiSelect.Content>
            <MultiSelect.Search
              className="mb-2.5"
              placeholder="이름 입력"
              value={query}
              onChange={handleSearchChange}
            />
            {/* 외부 직접 제어: 상태로 분기 (Fallback/List는 self-gating 안 함) */}
            {loading ? (
              <MultiSelect.Fallback>
                <Spinner size="sm" fullscreen="static" />
              </MultiSelect.Fallback>
            ) : results.length === 0 ? (
              <MultiSelect.Fallback>검색 결과 없음</MultiSelect.Fallback>
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
        <p className="text-sm">선택: {selectedOptions.map(o => o.label).join(', ') || '(none)'}</p>
      </div>
    )
  },
}

/**
 * Confirm/Cancel UX가 필요할 때 `useMultiSelectDraft` hook을 외부에서 호출해
 * MultiSelect의 controlled props에 wire합니다. Footer는 layout-only이므로 children에
 * Reset/Cancel/Confirm 버튼을 소비자가 직접 조립합니다.
 *
 * Hook이 펜딩(draft) 흐름을 흡수:
 * - 드롭다운이 열릴 때 펜딩 = committed 스냅샷
 * - 토글은 펜딩에만 반영
 * - `draft.confirm()`: 펜딩 → committed commit + 닫기
 * - `draft.cancel()` / 외부 클릭 / Esc: 펜딩 폐기 + 닫기
 * - `draft.reset()`: 펜딩 = [] (드롭다운 유지)
 */
export const WithConfirmPattern: Story = {
  args: { children: null },
  render: function WithConfirmPatternExample() {
    const [committed, setCommitted] = useState<string[]>([])
    const [open, setOpen] = useState(false)

    const draft = useMultiSelectDraft({
      committed,
      setCommitted,
      isOpen: open,
      setOpen,
    })

    return (
      <div className="flex flex-col gap-4 w-[350px]">
        <h3 className="text-lg font-bold">Confirm 패턴 (useMultiSelectDraft)</h3>
        <MultiSelect
          open={open}
          onOpenChange={setOpen}
          value={draft.value}
          onValueChange={draft.setValue}
          options={fruitOptions}
        >
          <MultiSelect.Trigger placeholder="과일들을 선택하세요" />
          <MultiSelect.Content>
            <MultiSelect.List>
              {fruitOptions.map(option => (
                <MultiSelect.Item key={option.value} value={option.value}>
                  {option.label}
                </MultiSelect.Item>
              ))}
            </MultiSelect.List>
            <MultiSelect.Footer>
              <Button variant="ghost" size="sm" onClick={draft.reset}>
                초기화
              </Button>
              <div className="ml-auto flex items-center gap-1">
                <Button variant="line" size="sm" onClick={draft.cancel}>
                  취소
                </Button>
                <Button variant="line" size="sm" onClick={draft.confirm} disabled={!draft.isDirty}>
                  확인
                </Button>
              </div>
            </MultiSelect.Footer>
          </MultiSelect.Content>
        </MultiSelect>
        <div className="text-sm">
          <p>확정된 값: {committed.join(', ') || '(none)'}</p>
          <p>편집 중 (draft): {draft.value.join(', ') || '(none)'}</p>
        </div>
      </div>
    )
  },
}

export const SizesAndStates: Story = {
  args: { children: null },
  render: function SizesAndStatesExample() {
    const [v1, setV1] = useState<string[]>([])
    const [v2, setV2] = useState<string[]>([])
    const [v3, setV3] = useState<string[]>([])

    return (
      <div className="flex flex-col gap-10 p-10">
        <div className="flex flex-col gap-4">
          <h3 className="text-lg font-bold">Sizes (md vs sm)</h3>
          <div className="flex gap-4 items-end">
            <div className="w-[220px]">
              <p className="text-xs mb-1">Medium (md)</p>
              <MultiSelect value={v1} onValueChange={setV1} size="md" options={defaultOptions}>
                <MultiSelect.Trigger placeholder="선택하세요" />
                <MultiSelect.Content>
                  <MultiSelect.List>
                    {defaultOptions.map(option => (
                      <MultiSelect.Item key={option.value} value={option.value}>
                        {option.label}
                      </MultiSelect.Item>
                    ))}
                  </MultiSelect.List>
                </MultiSelect.Content>
              </MultiSelect>
            </div>
            <div className="w-[220px]">
              <p className="text-xs mb-1">Small (sm)</p>
              <MultiSelect value={v2} onValueChange={setV2} size="sm" options={defaultOptions}>
                <MultiSelect.Trigger placeholder="선택하세요" />
                <MultiSelect.Content>
                  <MultiSelect.List>
                    {defaultOptions.map(option => (
                      <MultiSelect.Item key={option.value} value={option.value}>
                        {option.label}
                      </MultiSelect.Item>
                    ))}
                  </MultiSelect.List>
                </MultiSelect.Content>
              </MultiSelect>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <h3 className="text-lg font-bold">States</h3>
          <div className="flex gap-4 items-end">
            <div className="w-[220px]">
              <p className="text-xs mb-1">Error</p>
              <MultiSelect value={v3} onValueChange={setV3} options={defaultOptions}>
                <MultiSelect.Trigger error placeholder="에러 상태" />
                <MultiSelect.Content>
                  <MultiSelect.List>
                    {defaultOptions.map(option => (
                      <MultiSelect.Item key={option.value} value={option.value}>
                        {option.label}
                      </MultiSelect.Item>
                    ))}
                  </MultiSelect.List>
                </MultiSelect.Content>
              </MultiSelect>
            </div>
            <div className="w-[220px]">
              <p className="text-xs mb-1">Disabled</p>
              <MultiSelect value={[]} onValueChange={() => {}} options={defaultOptions}>
                <MultiSelect.Trigger disabled placeholder="비활성 상태" />
                <MultiSelect.Content>
                  <MultiSelect.List>
                    {defaultOptions.map(option => (
                      <MultiSelect.Item key={option.value} value={option.value}>
                        {option.label}
                      </MultiSelect.Item>
                    ))}
                  </MultiSelect.List>
                </MultiSelect.Content>
              </MultiSelect>
            </div>
            <div className="w-[220px]">
              <p className="text-xs mb-1">ReadOnly</p>
              <MultiSelect value={['1']} onValueChange={() => {}} options={defaultOptions}>
                <MultiSelect.Trigger readOnly placeholder="읽기 전용" />
                <MultiSelect.Content>
                  <MultiSelect.List>
                    {defaultOptions.map(option => (
                      <MultiSelect.Item key={option.value} value={option.value}>
                        {option.label}
                      </MultiSelect.Item>
                    ))}
                  </MultiSelect.List>
                </MultiSelect.Content>
              </MultiSelect>
            </div>
          </div>
        </div>
      </div>
    )
  },
}

const userOptions = [
  { value: 'alice', label: '김지수' },
  { value: 'bob', label: '이준혁' },
  { value: 'carol', label: '박소연' },
]

export const CustomLayout: Story = {
  args: { children: null },
  render: function CustomLayoutExample() {
    const [values, setValues] = useState<string[]>([])
    return (
      <div className="w-[240px]">
        <MultiSelect options={userOptions} value={values} onValueChange={setValues}>
          <MultiSelect.Trigger
            placeholder="담당자 선택"
            render={({ selectedOptions }: MultiSelectTriggerRenderState) => {
              const [first, ...rest] = selectedOptions
              const label = rest.length > 0 ? `${first.label} 외 ${rest.length}명` : first.label
              return (
                <div className="flex min-w-0 flex-1 items-center gap-afds-spacing-8">
                  <UserIcon size={16} className="h-4 w-4 shrink-0 text-afds-text-secondary" />
                  <span className="min-w-0 truncate">담당자: {label}</span>
                </div>
              )
            }}
          />
          <MultiSelect.Content>
            <MultiSelect.List>
              {userOptions.map(option => (
                <MultiSelect.Item key={option.value} value={option.value}>
                  {option.label}
                </MultiSelect.Item>
              ))}
            </MultiSelect.List>
          </MultiSelect.Content>
        </MultiSelect>
      </div>
    )
  },
}

export const CustomIndicator: Story = {
  args: { children: null },
  render: function CustomIndicatorExample() {
    const [values, setValues] = useState<string[]>([])
    return (
      <div className="w-[240px]">
        <MultiSelect options={userOptions} value={values} onValueChange={setValues}>
          <MultiSelect.Trigger
            placeholder="담당자 선택"
            indicator={<ChevronsUpDownIcon size={16} className="h-full w-full" />}
          />
          <MultiSelect.Content>
            <MultiSelect.List>
              {userOptions.map(option => (
                <MultiSelect.Item key={option.value} value={option.value}>
                  {option.label}
                </MultiSelect.Item>
              ))}
            </MultiSelect.List>
          </MultiSelect.Content>
        </MultiSelect>
      </div>
    )
  },
}

export const FormSubmit: Story = {
  args: { children: null },
  render: function FormSubmitExample() {
    const [submitted, setSubmitted] = useState<[string, FormDataEntryValue][]>([])
    return (
      <form
        className="flex w-[320px] flex-col gap-afds-spacing-16"
        onSubmit={event => {
          event.preventDefault()
          const data = new FormData(event.currentTarget)
          setSubmitted(Array.from(data.entries()))
        }}
      >
        <label className="flex flex-col gap-afds-spacing-4">
          <span className="text-afds-14 text-afds-text-secondary">다중 선택</span>
          <MultiSelect name="tags" options={defaultOptions}>
            <MultiSelect.Trigger placeholder="태그를 선택하세요" />
            <MultiSelect.Content>
              <MultiSelect.List>
                {defaultOptions.map(option => (
                  <MultiSelect.Item key={option.value} value={option.value}>
                    {option.label}
                  </MultiSelect.Item>
                ))}
              </MultiSelect.List>
            </MultiSelect.Content>
          </MultiSelect>
        </label>

        <button
          type="submit"
          className="rounded-afds-md bg-afds-bg-brand px-afds-spacing-16 py-afds-spacing-8 text-afds-text-inverse"
        >
          제출
        </button>

        {submitted.length > 0 && (
          <pre className="rounded-afds-sm bg-afds-bg-surface p-afds-spacing-12 text-afds-12 text-afds-text-primary">
            {JSON.stringify(submitted, null, 2)}
          </pre>
        )}
      </form>
    )
  },
}
