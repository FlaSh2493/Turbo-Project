import type { Meta, StoryObj } from '@storybook/react'
import {
  FadeSwap,
  Select,
  Spinner,
  Tooltip,
  type SelectTriggerRenderState,
} from '@turbo-project/afds/bricks'
import { type SelectOption } from '@turbo-project/afds/headless'
import { useMemo, useRef, useState } from 'react'
import { ChevronsUpDownIcon, UserIcon } from 'lucide-react'

/**
 *
 * 드롭다운에서 **단일 값**을 선택하는 컴포넌트입니다. Compound Component 패턴으로 구성되어
 * 검색·커스텀 트리거·커스텀 indicator 등을 유연하게 조합할 수 있습니다.
 *
 * 다중 선택이 필요하면 `MultiSelect`를 사용하세요.
 *
 *
 * ### 언제 사용하나요?
 * - 여러 옵션 중 하나만 선택해야 할 때
 * - 필터링이 필요한 경우
 * - 폼의 드롭다운 필드
 *
 * ### Compound Components 구조
 * ```tsx
 * <Select>
 *   <Select.Trigger />      // 열기 트리거
 *   <Select.Content>        // 드롭다운 컨테이너
 *     <Select.Search />     // 검색 입력 (선택)
 *     <Select.List>         // 옵션 목록
 *       <Select.Item />     // 단일 선택 아이템
 *     </Select.List>
 *   </Select.Content>
 * </Select>
 * ```
 *
 * ### 옵션 데이터 형식
 * ```tsx
 * const options = [
 *   { value: 'apple', label: '사과' },
 *   { value: 'banana', label: '바나나', disabled: true },
 * ]
 * ```
 */
const argTypes = {
  size: {
    control: { type: 'select' as const },
    options: ['sm', 'md'],
    description: 'Select 크기 (모든 sub-component에 컨텍스트로 전파)',
    table: {
      type: { summary: "'sm' | 'md'" },
      defaultValue: { summary: 'sm' },
      category: 'Select.Root',
    },
  },
}

const meta = {
  title: 'AFDS / Bricks / Form / Select',
  component: Select,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
Select는 Compound Component 패턴의 **단일 선택** 드롭다운입니다.

**Import:**
\`\`\`tsx
import { Select } from '@turbo-project/afds/bricks'
\`\`\`

### 기본 사용법
\`\`\`tsx
<Select options={options} value={value} onValueChange={setValue}>
  <Select.Trigger placeholder="선택하세요" />
  <Select.Content>
    <Select.List>
      {options.map(o => (
        <Select.Item key={o.value} value={o.value}>{o.label}</Select.Item>
      ))}
    </Select.List>
  </Select.Content>
</Select>
\`\`\`
        `,
      },
    },
  },
  tags: ['autodocs'],
  argTypes,
} satisfies Meta<typeof Select>

export default meta
type Story = StoryObj<typeof meta>

const defaultOptions = [
  { label: '옵션 1', value: '1' },
  { label: '옵션 2', value: '2' },
]

export const Default: Story = {
  args: { children: null, size: 'sm' },
  render: function DefaultSelect(args) {
    const [value, setValue] = useState('')
    return (
      <div className="w-[240px]">
        <Select {...args} options={defaultOptions} value={value} onValueChange={setValue}>
          <Select.Trigger placeholder="선택하세요" />
          <Select.Content>
            <Select.List>
              {defaultOptions.map(option => (
                <Select.Item key={option.value} value={option.value}>
                  {option.label}
                </Select.Item>
              ))}
            </Select.List>
          </Select.Content>
        </Select>
      </div>
    )
  },
}

export const Uncontrolled: Story = {
  args: { children: null },
  render: function UncontrolledSelect() {
    return (
      <div className="w-[240px]">
        <Select options={defaultOptions} defaultValue="1">
          <Select.Trigger placeholder="선택하세요" />
          <Select.Content>
            <Select.List>
              {defaultOptions.map(option => (
                <Select.Item key={option.value} value={option.value}>
                  {option.label}
                </Select.Item>
              ))}
            </Select.List>
          </Select.Content>
        </Select>
      </div>
    )
  },
}

export const SizesAndStates: Story = {
  args: { children: null },
  render: function SizesAndStatesExample() {
    const [v1, setV1] = useState('')
    const [v2, setV2] = useState('')
    const [v3, setV3] = useState('')

    return (
      <div className="flex flex-col gap-10 p-10">
        <div className="flex flex-col gap-4">
          <h3 className="text-lg font-bold">Sizes (md vs sm)</h3>
          <div className="flex gap-4 items-end">
            <div className="w-[200px]">
              <p className="text-xs mb-1">Medium (md)</p>
              <Select value={v1} onValueChange={setV1} size="md" options={defaultOptions}>
                <Select.Trigger placeholder="선택하세요" />
                <Select.Content>
                  <Select.List>
                    {defaultOptions.map(option => (
                      <Select.Item key={option.value} value={option.value}>
                        {option.label}
                      </Select.Item>
                    ))}
                  </Select.List>
                </Select.Content>
              </Select>
            </div>
            <div className="w-[200px]">
              <p className="text-xs mb-1">Small (sm)</p>
              <Select value={v2} onValueChange={setV2} size="sm" options={defaultOptions}>
                <Select.Trigger placeholder="선택하세요" />
                <Select.Content>
                  <Select.List>
                    {defaultOptions.map(option => (
                      <Select.Item key={option.value} value={option.value}>
                        {option.label}
                      </Select.Item>
                    ))}
                  </Select.List>
                </Select.Content>
              </Select>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <h3 className="text-lg font-bold">States</h3>
          <div className="flex gap-4 items-end">
            <div className="w-[200px]">
              <p className="text-xs mb-1">Error</p>
              <Select value={v3} onValueChange={setV3} options={defaultOptions}>
                <Select.Trigger error placeholder="에러 상태" />
                <Select.Content>
                  <Select.List>
                    {defaultOptions.map(option => (
                      <Select.Item key={option.value} value={option.value}>
                        {option.label}
                      </Select.Item>
                    ))}
                  </Select.List>
                </Select.Content>
              </Select>
            </div>
            <div className="w-[200px]">
              <p className="text-xs mb-1">Disabled</p>
              <Select value="" onValueChange={() => {}} options={[{ label: '옵션 1', value: '1' }]}>
                <Select.Trigger disabled placeholder="비활성 상태" />
                <Select.Content>
                  <Select.List>
                    {[{ label: '옵션 1', value: '1' }].map(option => (
                      <Select.Item key={option.value} value={option.value}>
                        {option.label}
                      </Select.Item>
                    ))}
                  </Select.List>
                </Select.Content>
              </Select>
            </div>
            <div className="w-[200px]">
              <p className="text-xs mb-1">ReadOnly</p>
              <Select value="1" onValueChange={() => {}} options={defaultOptions}>
                <Select.Trigger readOnly placeholder="읽기 전용" />
                <Select.Content>
                  <Select.List>
                    {defaultOptions.map(option => (
                      <Select.Item key={option.value} value={option.value}>
                        {option.label}
                      </Select.Item>
                    ))}
                  </Select.List>
                </Select.Content>
              </Select>
            </div>
          </div>
        </div>
      </div>
    )
  },
}

export const SearchOnly: Story = {
  args: { children: null },
  render: function SearchOnlyExample() {
    const [value, setValue] = useState('')
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
        <Select value={value} onValueChange={setValue} size="md" options={frameworkOptions}>
          <Select.Trigger placeholder="항목을 검색하고 선택하세요" />
          <Select.Content>
            <Select.Search value={q} onChange={setQ} />
            {results.length === 0 ? (
              <Select.Fallback>No results</Select.Fallback>
            ) : (
              <Select.List>
                {results.map(option => (
                  <Select.Item key={option.value} value={option.value}>
                    {option.label}
                  </Select.Item>
                ))}
              </Select.List>
            )}
          </Select.Content>
        </Select>
      </div>
    )
  },
}

export const TruncatedItems: Story = {
  args: { children: null },
  render: function TruncatedItemsExample() {
    const [textValue, setTextValue] = useState('')
    const [value, setValue] = useState('')

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
        <Select value={textValue} onValueChange={setTextValue} options={longOptions}>
          <Select.Trigger placeholder="항목 선택" />
          <Select.Content>
            <Select.List>
              {longOptions.map(option => (
                <Select.Item key={option.value} value={option.value}>
                  {option.label}
                </Select.Item>
              ))}
            </Select.List>
          </Select.Content>
        </Select>
        <p className="text-sm">요소 children: 직접 자르고 Tooltip 을 단다</p>
        <Select value={value} onValueChange={setValue} options={longOptions}>
          <Select.Trigger placeholder="항목 선택" />
          <Select.Content>
            <Select.List>
              {longOptions.map(option => (
                <Select.Item key={option.value} value={option.value}>
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
                </Select.Item>
              ))}
            </Select.List>
          </Select.Content>
        </Select>
        <p className="text-sm text-gray-500 break-all">선택된 값: {value}</p>
      </div>
    )
  },
}

export const ScrollableList: Story = {
  args: { children: null },
  render: function ScrollableListExample() {
    const [value, setValue] = useState('')

    const manyOptions = Array.from({ length: 20 }, (_, i) => ({
      label: `옵션 ${i + 1}`,
      value: String(i + 1),
    }))

    return (
      <div className="flex flex-col gap-4 w-[200px]">
        <h3 className="text-lg font-bold">Single (20개)</h3>
        <Select value={value} onValueChange={setValue} options={manyOptions}>
          <Select.Trigger placeholder="선택하세요" />
          <Select.Content>
            <Select.List>
              {manyOptions.map(option => (
                <Select.Item key={option.value} value={option.value}>
                  {option.label}
                </Select.Item>
              ))}
            </Select.List>
          </Select.Content>
        </Select>
      </div>
    )
  },
}

export const EmptyState: Story = {
  args: { children: null },
  render: function EmptyStateExample() {
    const [value, setValue] = useState('')
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
          <Select value={value} onValueChange={setValue} options={[]}>
            <Select.Trigger placeholder="선택하세요" />
            <Select.Content>
              <Select.Fallback>No options</Select.Fallback>
            </Select.Content>
          </Select>
        </div>

        <div className="flex flex-col gap-2">
          <p className="text-sm font-bold">검색 결과 없음 (검색해보세요)</p>
          <Select value={value} onValueChange={setValue} options={searchOptions}>
            <Select.Trigger placeholder="선택하세요" />
            <Select.Content>
              <Select.Search placeholder="검색" value={q} onChange={setQ} />
              {results.length === 0 ? (
                <Select.Fallback>No results</Select.Fallback>
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
        </div>
      </div>
    )
  },
}

export const Loading: Story = {
  args: { children: null },
  render: function LoadingExample() {
    const [value, setValue] = useState('')
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
        <Select
          value={value}
          onValueChange={setValue}
          options={options}
          onOpenChange={handleOpen}
          loading={loading}
        >
          <Select.Trigger placeholder="선택하세요" />
          <Select.Content>
            {loading ? (
              <Select.Fallback>
                <Spinner size="sm" fullscreen="static" />
              </Select.Fallback>
            ) : (
              <Select.List>
                {options.map(o => (
                  <Select.Item key={o.value} value={o.value}>
                    {o.label}
                  </Select.Item>
                ))}
              </Select.List>
            )}
          </Select.Content>
        </Select>
      </div>
    )
  },
}

/**
 * `Select.Content` 내부를 `FadeSwap`으로 감싸 상태 전환을 페이드로 잇는 예시.
 *
 * 핵심: FadeSwap의 자식은 **분기별로 정적인 element**여야 한다. 외부 `loading` 상태로
 * 분기마다 보여줄 콘텐츠(Spinner / Select.List)를 직접 둔다.
 */
export const LoadingFadeSwap: Story = {
  args: { children: null },
  render: function LoadingFadeSwapExample() {
    const [value, setValue] = useState('')
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
        <p className="text-sm font-bold">FadeSwap 전환 (열면 Spinner → 목록으로 페이드)</p>
        <Select value={value} onValueChange={setValue} options={options} onOpenChange={handleOpen}>
          <Select.Trigger placeholder="선택하세요" />
          <Select.Content>
            <FadeSwap duration={500} animateOnMount>
              {loading ? (
                <div key="loading" className="flex items-center justify-center py-4">
                  <Spinner size="sm" fullscreen="static" />
                </div>
              ) : (
                <Select.List key="ready">
                  {options.map(o => (
                    <Select.Item key={o.value} value={o.value}>
                      {o.label}
                    </Select.Item>
                  ))}
                </Select.List>
              )}
            </FadeSwap>
          </Select.Content>
        </Select>
      </div>
    )
  },
}

/**
 * 비동기(서버) 검색 — controlled `Search`로 검색어를 받아 외부 API 결과를 `options`로 주입한다.
 *
 * 소비자가 직접 챙겨야 하는 3가지(MultiSelect와 동일):
 * 1. **디바운스** — `Search`의 `onChange`는 매 입력마다 발화하므로 소비자가 디바운스해 fetch한다.
 * 2. **race-condition 가드** — 요청 id를 비교해 stale 응답을 버린다.
 * 3. **선택값 라벨 보존** — Trigger는 `options`에서 라벨을 resolve하므로, 검색 결과로 `options`를
 *    갈아끼울 때 선택된 옵션을 함께 머지해 둔다.
 *
 * 로딩/빈 상태는 외부 상태로 직접 분기한다 — `Fallback`/`List`는 self-gating하지 않는다.
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

    const [value, setValue] = useState('')
    const [selectedOption, setSelectedOption] = useState<SelectOption | null>(null)
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

    const handleSearchChange = (q: string) => {
      setQuery(q) // Search는 controlled
      if (timer.current) clearTimeout(timer.current) // (1) 디바운스
      timer.current = setTimeout(() => runSearch(q), 300)
    }

    const handleOpenChange = (open: boolean) => {
      if (open) runSearch('')
    }

    const handleValueChange = (next: string) => {
      setValue(next)
      setSelectedOption(results.find(o => o.value === next) ?? selectedOption) // (3) 라벨 보존
    }

    const optionsForRoot = useMemo(() => {
      const map = new Map<string, SelectOption>()
      if (selectedOption) map.set(selectedOption.value, selectedOption)
      results.forEach(o => map.set(o.value, o))
      return Array.from(map.values())
    }, [selectedOption, results])

    return (
      <div className="flex flex-col gap-2 w-[300px]">
        <h3 className="text-lg font-bold">비동기 검색 (서버 위임)</h3>
        <Select
          value={value}
          onValueChange={handleValueChange}
          options={optionsForRoot}
          onOpenChange={handleOpenChange}
        >
          <Select.Trigger placeholder="담당자 검색" />
          <Select.Content>
            <Select.Search
              className="mb-2.5"
              placeholder="이름 입력"
              value={query}
              onChange={handleSearchChange}
            />
            {/* 외부 직접 제어: 상태로 분기 (Fallback/List는 self-gating 안 함) */}
            {loading ? (
              <Select.Fallback>
                <Spinner size="sm" fullscreen="static" />
              </Select.Fallback>
            ) : results.length === 0 ? (
              <Select.Fallback>검색 결과 없음</Select.Fallback>
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
        <p className="text-sm">선택: {selectedOption?.label ?? '(none)'}</p>
      </div>
    )
  },
}

export const CustomItem: Story = {
  args: { children: null },
  render: function CustomItemExample() {
    const [value, setValue] = useState('')

    const userOptions = [
      { label: '김철수', value: 'user1', color: 'bg-blue-500' },
      { label: '이영희', value: 'user2', color: 'bg-green-500' },
      { label: '박민수', value: 'user3', color: 'bg-red-500' },
    ]

    return (
      <div className="flex flex-col gap-4 w-[300px]">
        <h3 className="text-lg font-bold">Custom Item Rendering</h3>
        <Select value={value} onValueChange={setValue} size="md" options={userOptions}>
          <Select.Trigger placeholder="사용자를 선택하세요" />
          <Select.Content>
            <Select.List>
              {userOptions.map(option => {
                const user = userOptions.find(o => o.value === option.value)
                if (!user) return null
                return (
                  <Select.Item key={option.value} value={option.value}>
                    <div className="flex items-center gap-2">
                      <div className={`w-6 h-6 rounded-full ${user.color}`} />
                      <span>{option.label}</span>
                    </div>
                  </Select.Item>
                )
              })}
            </Select.List>
          </Select.Content>
        </Select>
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
    const [value, setValue] = useState('')
    return (
      <div className="w-[240px]">
        <Select options={userOptions} value={value} onValueChange={setValue}>
          <Select.Trigger
            placeholder="담당자 선택"
            render={({ selectedOption }: SelectTriggerRenderState) => (
              <div className="flex min-w-0 flex-1 items-center gap-afds-spacing-8">
                <UserIcon size={16} className="h-4 w-4 shrink-0 text-afds-text-secondary" />
                <span className="min-w-0 truncate">담당자: {selectedOption.label}</span>
              </div>
            )}
          />
          <Select.Content>
            <Select.List>
              {userOptions.map(option => (
                <Select.Item key={option.value} value={option.value}>
                  {option.label}
                </Select.Item>
              ))}
            </Select.List>
          </Select.Content>
        </Select>
      </div>
    )
  },
}

export const CustomIndicator: Story = {
  args: { children: null },
  render: function CustomIndicatorExample() {
    const [value, setValue] = useState('')
    return (
      <div className="w-[240px]">
        <Select options={userOptions} value={value} onValueChange={setValue}>
          <Select.Trigger
            placeholder="담당자 선택"
            indicator={<ChevronsUpDownIcon size={16} className="h-full w-full" />}
          />
          <Select.Content>
            <Select.List>
              {userOptions.map(option => (
                <Select.Item key={option.value} value={option.value}>
                  {option.label}
                </Select.Item>
              ))}
            </Select.List>
          </Select.Content>
        </Select>
      </div>
    )
  },
}

/**
 * `name` prop을 지정하면 현재 값과 동기화되는 hidden input이 함께 렌더되어
 * 네이티브 `<form>` 제출과 `FormData`, RHF `register()`에 호환된다.
 */
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
          <span className="text-afds-14 text-afds-text-secondary">단일 선택</span>
          <Select name="fruit" options={defaultOptions} required>
            <Select.Trigger placeholder="과일을 선택하세요" />
            <Select.Content>
              <Select.List>
                {defaultOptions.map(option => (
                  <Select.Item key={option.value} value={option.value}>
                    {option.label}
                  </Select.Item>
                ))}
              </Select.List>
            </Select.Content>
          </Select>
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
