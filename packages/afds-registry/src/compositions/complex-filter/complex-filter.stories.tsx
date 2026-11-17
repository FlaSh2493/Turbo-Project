import type { Meta, StoryObj } from '@storybook/react'
import { expect, userEvent, waitFor, within } from '@storybook/test'
import { useState, type ComponentType } from 'react'
import {
  ComplexFilter,
  type ComplexFilterChip,
  type ComplexFilterField,
  type ComplexFilterLabels,
  type ComplexFilterRootProps,
} from '.'

/**
 * # ComplexFilter
 *
 * 입력 하나와 칩으로 이뤄진 검색 필터 바. 입력하면 키워드 추천이, 빈 입력을 누르면 필드 메뉴가 열리고 고른 결과가 칩으로 쌓인다.
 * `ComplexFilter.Root` 가 상태(controlled)와 문구를 받고, 하위 파트(`MatchMode` · `Input` · `Chip` · `Actions` · `CollapseToggle`)로 배치를 조립한다.
 * 문구는 영문 기본값이며 `labels` 로 부분 override 한다.
 *
 * **Import:**
 * ```tsx
 * import { ComplexFilter } from '.'
 * ```
 *
 * ### 기본 사용법
 * ```tsx
 * const [chips, setChips] = useState<ComplexFilterChip[]>([])
 *
 * <ComplexFilter.Root
 *   fields={fields}
 *   chips={chips}
 *   onChange={setChips}
 *   onClear={() => setChips([])}
 * />
 * ```
 *
 * ### 직접 조립
 * ```tsx
 * <ComplexFilter.Root fields={fields} chips={chips} onChange={setChips} onClear={clear} matchMode={matchMode}>
 *   <ComplexFilter.MatchMode />
 *   <ComplexFilter.Input>
 *     {chips.map(chip => <ComplexFilter.Chip key={chip.id} chip={chip} />)}
 *   </ComplexFilter.Input>
 *   <ComplexFilter.Actions>
 *     <ComplexFilter.CollapseToggle />
 *   </ComplexFilter.Actions>
 * </ComplexFilter.Root>
 * ```
 *
 * ### 베스트 프랙티스
 * - 칩은 `Input` 의 children 으로 넣고 Root 의 `chips` 에 있는 것이어야 한다
 * - 결합 방식(AND/OR)의 의미 적용과 최근 검색 저장은 소비자가 한다
 */
// WHY: Root 의 필수 prop 을 스토리마다 args 로 채우지 않으므로 component 만 Partial 로 좁혀 autodocs props 표에 쓴다
const meta: Meta<Partial<ComplexFilterRootProps>> = {
  title: 'Compositions / Common / Form / ComplexFilter',
  component: ComplexFilter.Root as unknown as ComponentType<Partial<ComplexFilterRootProps>>,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
}

export default meta
type Story = StoryObj<Partial<ComplexFilterRootProps>>

// 스토리 공용 예시 데이터. 레포 비즈니스(action-management·i18n 훅)에 기대지 않는 일반 광고 도메인이라
// afds-registry 로 옮겨도 그대로 쓸 수 있다. 값은 읽기 쉬운 한국어 라벨이고 키는 영문이다.

const NAME_FIELD: ComplexFilterField = {
  type: 'keyword',
  key: 'name',
  label: '이름',
  conditions: ['like', 'unlike'],
}

const ID_FIELD: ComplexFilterField = {
  type: 'keyword',
  key: 'id',
  label: 'ID',
  conditions: ['like'],
}

const MEDIA_FIELD: ComplexFilterField = {
  type: 'select',
  key: 'media',
  label: '매체',
  options: [
    { value: 'GOOGLE_ADS', label: 'Google DA' },
    { value: 'NAVER_SA', label: 'Naver SA' },
    { value: 'FACEBOOK', label: 'Meta' },
    { value: 'KAKAO', label: 'Kakao' },
  ],
}

const LEVEL_FIELD: ComplexFilterField = {
  type: 'select',
  key: 'level',
  label: '계위',
  options: [
    { value: 'campaign', label: '캠페인' },
    { value: 'adGroup', label: '광고 그룹' },
  ],
}

const STATUS_FIELD: ComplexFilterField = {
  type: 'select',
  key: 'status',
  label: '상태',
  multiple: false,
  options: [
    { value: 'pending', label: '적용예정' },
    { value: 'done', label: '실행 완료' },
    { value: 'failed', label: '실패' },
  ],
}

const FIELDS: ComplexFilterField[] = [NAME_FIELD, ID_FIELD, MEDIA_FIELD, LEVEL_FIELD, STATUS_FIELD]

const LABELS: ComplexFilterLabels = {
  search: '검색',
  searchPlaceholder: '검색 및 필터링',
  clear: '지우기',
  removeChip: text => `${text} 삭제`,
  conditions: { like: '포함', unlike: '제외' },
  keywordTitle: field => `${field}에`,
  keywordPhrase: {
    before: field => `${field}에`,
    after: (_field, condition) => condition,
  },
  editor: {
    cancel: '취소',
    apply: '적용',
    emptyValue: '값을 입력해 주세요',
    clearValue: '입력 지우기',
  },
  listbox: '필터 목록',
  recent: {
    title: '최근 검색',
    empty: '검색 기록 없음',
    remove: item => `${item} 삭제`,
  },
  toggle: { expand: '필터 펼치기', collapse: '필터 접기' },
  hiddenChips: '가려진 칩이 더 있음',
}

const MATCH_MODE_OPTIONS = [
  { value: 'all', label: '모든 조건 만족' },
  { value: 'or', label: '하나라도 만족' },
]

interface ChipFlags {
  deletable?: boolean
  editable?: boolean
}

const selectChip = (
  id: string,
  fieldKey: string,
  values: string[],
  flags: ChipFlags = {},
): ComplexFilterChip => ({ id, kind: 'select', fieldKey, values, ...flags })

const keywordChip = (
  id: string,
  value: string,
  flags: ChipFlags & { fieldKey?: string; condition?: 'like' | 'unlike' } = {},
): ComplexFilterChip => {
  const { fieldKey = 'name', condition = 'like', ...rest } = flags
  return { id, kind: 'keyword', fieldKey, condition, value, ...rest }
}

const WITH_CHIPS: ComplexFilterChip[] = [
  keywordChip('k1', 'ㅇㅇㅇㅇㅇ'),
  { id: 's1', kind: 'select', fieldKey: 'status', values: ['pending'] },
  {
    id: 's2',
    kind: 'select',
    fieldKey: 'media',
    values: ['GOOGLE_ADS', 'KAKAO'],
  },
]

/** 옵션이 많고 라벨이 긴 선택 필드 — 목록 스크롤과 말줄임 확인용 */
const MANY_OPTIONS_FIELD: ComplexFilterField = {
  type: 'select',
  key: 'adGroup',
  label: '광고그룹',
  options: Array.from({ length: 30 }, (_, index) => ({
    value: `group-${index + 1}`,
    label:
      index % 5 === 0
        ? `광고그룹 ${index + 1} — 아주 긴 이름의 광고그룹 라벨이 이렇게 길게 이어집니다`
        : `광고그룹 ${index + 1}`,
  })),
}

const RECENT_ITEMS = ['여름 프로모션', '브랜드 검색', '리타게팅 30일']

const LABELS_EN: ComplexFilterLabels = {
  search: 'Search',
  searchPlaceholder: 'Search and filter',
  clear: 'Clear',
  removeChip: text => `Remove ${text}`,
  conditions: { like: 'contains', unlike: 'excludes' },
  keywordTitle: field => field,
  keywordPhrase: {
    before: (field, condition) => `${field} ${condition}`,
    after: () => '',
  },
  editor: {
    cancel: 'Cancel',
    apply: 'Apply',
    emptyValue: 'Enter a value',
    clearValue: 'Clear input',
  },
  listbox: 'Filter list',
  recent: {
    title: 'Recent searches',
    empty: 'No search history',
    remove: item => `Remove ${item}`,
  },
  toggle: { expand: 'Expand filters', collapse: 'Collapse filters' },
  hiddenChips: 'More filters are hidden',
}

const FIELDS_EN: ComplexFilterField[] = [
  { ...NAME_FIELD, label: 'Name' },
  { ...MEDIA_FIELD, label: 'Media' },
  {
    ...STATUS_FIELD,
    label: 'Status',
    options: [
      { value: 'pending', label: 'Scheduled' },
      { value: 'done', label: 'Completed' },
      { value: 'failed', label: 'Failed' },
    ],
  },
]

const MATCH_MODE_OPTIONS_EN = [
  { value: 'all', label: 'Match all conditions' },
  { value: 'or', label: 'Match any condition' },
]

interface FilterHarnessProps extends Partial<
  Pick<
    ComplexFilterRootProps,
    'expanded' | 'maxChips' | 'maxLength' | 'disabled' | 'labels' | 'onToggle' | 'portalContainer'
  >
> {
  fields: ComplexFilterField[]
  initial?: ComplexFilterChip[]
  /** 지정하면 좌측 결합 방식 드롭다운을 그린다 */
  matchOptions?: typeof MATCH_MODE_OPTIONS
  /** 지정하면 필드 메뉴 첫 항목에 「최근 검색」을 둔다(빈 배열이면 「검색 기록 없음」) */
  recent?: string[]
  /** 매치모드 트리거·팝업의 접근성 이름 */
  matchAriaLabel?: string
  /** false 면 현재 value 를 보여 주는 JSON 패널을 숨긴다 */
  showJson?: boolean
}

/**
 * 스토리 공용 래퍼 — controlled 상태를 직접 들고 있어 실제로 칩을 바꿔 볼 수 있고,
 * 하단 패널에 지금의 `chips`(과 결합 방식)를 JSON 으로 보여 준다
 */
function FilterHarness({
  fields,
  initial = [],
  matchOptions,
  recent,
  showJson = true,
  matchAriaLabel = '조건 결합 방식',
  labels = LABELS,
  ...rest
}: FilterHarnessProps) {
  const [chips, setChips] = useState(initial)
  const [mode, setMode] = useState('all')
  const [recentItems, setRecentItems] = useState(recent ?? [])

  return (
    <div className="flex w-full max-w-[1340px] flex-col gap-[12px]">
      <ComplexFilter.Root
        {...rest}
        fields={fields}
        chips={chips}
        onChange={setChips}
        onClear={() => setChips([])}
        labels={labels}
        matchMode={
          matchOptions && {
            value: mode,
            options: matchOptions,
            onChange: setMode,
            ariaLabel: matchAriaLabel,
          }
        }
        recentSearches={
          recent && {
            items: recentItems,
            onAdd: item => setRecentItems(prev => [item, ...prev.filter(v => v !== item)]),
            onRemove: item => setRecentItems(prev => prev.filter(v => v !== item)),
          }
        }
      />
      {showJson && (
        <pre
          // WHY: 스크롤되는 영역은 키보드로 닿아야 한다(axe scrollable-region-focusable)
          tabIndex={0}
          className="max-h-[160px] overflow-auto rounded-afds-sm bg-afds-bg-surface-sunken p-[12px] text-[12px] leading-[18px] text-afds-text-secondary"
          data-testid="harness-json"
        >
          {JSON.stringify(
            matchOptions ? { mode, chips } : { chips },
            (key, value) => (key === 'id' ? undefined : value),
            2,
          )}
        </pre>
      )}
    </div>
  )
}

/** 스토리 설명(한 줄 의도 + 화면에서 바뀌는 것)과 Docs 탭에 보여 줄 설정 코드 */
const docs = (story: string, code: string) => ({
  docs: {
    description: { story },
    source: { code, language: 'tsx', type: 'code' },
  },
})

interface PlaygroundArgs {
  disabled: boolean
  maxChips: number
  maxLength: number
  withMatchMode: boolean
  withRecent: boolean
  expanded: 'uncontrolled' | 'expanded' | 'collapsed'
}

function PlaygroundBar({
  expanded: initialExpanded,
  ...rest
}: Omit<PlaygroundArgs, 'expanded'> & { expanded: boolean | undefined }) {
  // WHY: expanded 를 고정으로만 넘기면 onToggle 이 없어 입력 포커스 자동 펼침과 ⌃ 버튼이 먹지 않는다. 컨트롤이 정한 값을 초기값으로 두고 이후는 상태를 따른다
  const [expanded, setExpanded] = useState(initialExpanded)
  return (
    <FilterHarness
      {...rest}
      fields={[NAME_FIELD, ID_FIELD, MEDIA_FIELD, STATUS_FIELD]}
      initial={[
        keywordChip('k1', '여름 프로모션'),
        selectChip('s1', 'media', ['GOOGLE_ADS', 'KAKAO']),
      ]}
      matchOptions={rest.withMatchMode ? MATCH_MODE_OPTIONS : undefined}
      recent={rest.withRecent ? RECENT_ITEMS : undefined}
      expanded={expanded}
      onToggle={setExpanded}
    />
  )
}

// 1. Default — 반드시 첫 번째

export const Default: StoryObj<PlaygroundArgs> = {
  name: 'Playground',
  parameters: docs(
    '아래 Controls 로 선택 props 를 바꿔 가며 화면이 어떻게 달라지는지 본다. 하단 JSON 은 지금의 `chips` 값이다.',
    `<ComplexFilter.Root
  fields={fields}
  chips={chips}
  onChange={setChips}
  onClear={() => setChips([])}
  matchMode={withMatchMode ? { value, options, onChange, ariaLabel } : undefined}
  recentSearches={withRecent ? { items, onAdd, onRemove } : undefined}
  expanded={expanded}      // 미지정이면 모듈이 상태를 가진다
  maxChips={maxChips}
  maxLength={maxLength}
  disabled={disabled}
  labels={labels}
/>`,
  ),
  argTypes: {
    disabled: { control: 'boolean', description: '모든 상호작용을 막는다' },
    maxChips: {
      control: { type: 'number', min: 1, max: 50 },
      description: '칩 수 상한(넘는 키워드 칩은 만들지 않는다)',
    },
    maxLength: {
      control: { type: 'number', min: 1, max: 100 },
      description: '키워드 한 개의 최대 길이',
    },
    withMatchMode: {
      control: 'boolean',
      description: '`matchMode` 를 넘기면 좌측 「모든 조건 만족」이 생긴다',
    },
    withRecent: {
      control: 'boolean',
      description: '`recentSearches` 를 넘기면 필드 메뉴 첫 항목에 「최근 검색」이 생긴다',
    },
    expanded: {
      control: 'inline-radio',
      options: ['uncontrolled', 'expanded', 'collapsed'],
      description: '접기 상태. uncontrolled 는 모듈이 상태를 가진다',
    },
  },
  args: {
    disabled: false,
    maxChips: 50,
    maxLength: 100,
    withMatchMode: true,
    withRecent: true,
    expanded: 'uncontrolled',
  },
  render: ({ expanded, ...rest }) => (
    <PlaygroundBar
      {...rest}
      key={expanded}
      expanded={expanded === 'uncontrolled' ? undefined : expanded === 'expanded'}
    />
  ),
}

export const KeywordOneCondition: Story = {
  name: '키워드 필드 — 연산자 1개',
  parameters: docs(
    '`conditions` 가 1개면 칩 수정 팝오버에 토글이 없고 제목 뒤에 연산자(「포함」)가 붙는다. 칩을 눌러 확인한다.',
    `{ type: 'keyword', key: 'id', label: 'ID', conditions: ['like'] }`,
  ),
  render: () => (
    <FilterHarness
      fields={[ID_FIELD]}
      initial={[keywordChip('k1', '194005', { fieldKey: 'id' })]}
    />
  ),
}

export const KeywordTwoConditions: Story = {
  name: '키워드 필드 — 연산자 2개',
  parameters: docs(
    "`conditions: ['like', 'unlike']` 면 칩 수정에 「포함 | 제외」 토글이 생긴다. 첫 항목(포함)이 추천 행·Enter 로 만들 때의 기본 연산자다.",
    `{ type: 'keyword', key: 'name', label: '이름', conditions: ['like', 'unlike'] }`,
  ),
  render: () => (
    <FilterHarness
      fields={[NAME_FIELD]}
      initial={[keywordChip('k1', '여름 프로모션', { condition: 'unlike' })]}
    />
  ),
}

export const SelectMultiple: Story = {
  name: '선택 필드 — 다중(multiple)',
  parameters: docs(
    '기본값(`multiple: true`). 입력칸 클릭 → 「매체 ›」 → 체크 목록 + 취소/적용 푸터. 적용 전에는 칩이 바뀌지 않는다.',
    `{ type: 'select', key: 'media', label: '매체', options: [{ value: 'KAKAO', label: 'Kakao' }, /* … */] }`,
  ),
  render: () => <FilterHarness fields={[MEDIA_FIELD]} />,
}

export const SelectSingle: Story = {
  name: '선택 필드 — 단일(multiple: false)',
  parameters: docs(
    '`multiple: false` 면 푸터 없이 항목을 고르는 즉시 적용되고 닫힌다. 칩 값은 하나다.',
    `{ type: 'select', key: 'status', label: '상태', multiple: false, options: [/* … */] }`,
  ),
  render: () => <FilterHarness fields={[STATUS_FIELD]} />,
}

export const SelectManyOptions: Story = {
  name: '선택 필드 — 옵션이 많고 라벨이 긴 경우',
  parameters: docs(
    '옵션이 많으면 서브메뉴 목록이 스크롤되고, 긴 라벨은 말줄임으로 잘린다. 칩은 선택값을 「, 」로 이어 붙이고 최대 폭에서 잘린다.',
    `{ type: 'select', key: 'adGroup', label: '광고그룹', options: Array.from({ length: 30 }, …) }`,
  ),
  render: () => (
    <FilterHarness
      fields={[MANY_OPTIONS_FIELD]}
      initial={[selectChip('s1', 'adGroup', ['group-1', 'group-2', 'group-6'])]}
    />
  ),
  // 칩 수정 팝업도 가용 높이로 제한되고 목록만 스크롤한다 — 취소·적용 푸터가 화면 밖으로 밀리지 않는다
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByTestId('complex-filter-chip-edit'))
    const apply = await within(document.body).findByTestId('complex-filter-apply')
    await waitFor(() =>
      expect(apply.getBoundingClientRect().bottom).toBeLessThanOrEqual(window.innerHeight),
    )
  },
}

export const KeywordFieldsOnly: Story = {
  name: '조합 — 키워드 필드만',
  parameters: docs(
    '선택 필드가 없으면 입력칸을 비운 채 눌러도 필드 메뉴가 열리지 않는다(메뉴 행이 0개). 글자를 입력하면 추천 행만 나온다.',
    `<ComplexFilter.Root fields={[nameField, idField]} … />`,
  ),
  render: () => <FilterHarness fields={[NAME_FIELD, ID_FIELD]} />,
}

export const SelectFieldsOnly: Story = {
  name: '조합 — 선택 필드만',
  parameters: docs(
    '키워드 필드가 없으면 글자를 입력해도 추천 행이 없다(Enter 로 칩을 만들 수 없다). 필드 메뉴로만 칩을 만든다.',
    `<ComplexFilter.Root fields={[mediaField, statusField]} … />`,
  ),
  render: () => <FilterHarness fields={[MEDIA_FIELD, STATUS_FIELD]} />,
}

const CHIP_FIELDS = [NAME_FIELD, ID_FIELD, MEDIA_FIELD]

export const FixedChip: Story = {
  name: '고정 칩 (deletable: false)',
  parameters: docs(
    '`deletable: false` 칩은 X 버튼이 없고 Backspace·「지우기」로도 지워지지 않는다. 필수 조건을 고정할 때 쓴다(지우기 뒤 재주입은 소비자 몫).',
    `{ id: 'k1', kind: 'keyword', fieldKey: 'name', condition: 'like', value: '필수 조건', deletable: false }`,
  ),
  render: () => (
    <FilterHarness
      fields={CHIP_FIELDS}
      initial={[
        keywordChip('k1', '필수 조건', { deletable: false }),
        keywordChip('k2', '삭제 가능'),
      ]}
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.queryByRole('button', { name: '이름에 필수 조건 포함 삭제' })).toBeNull()
    await expect(canvas.getByRole('button', { name: '이름에 삭제 가능 포함 삭제' })).toBeVisible()
  },
}

export const NonEditableChip: Story = {
  name: '수정 불가 칩 (editable: false)',
  parameters: docs(
    '`editable: false` 칩은 눌러도 수정 팝오버가 열리지 않는다(삭제는 가능). 위 칩은 수정 불가, 아래 칩은 눌러서 수정할 수 있다.',
    `{ id: 'k1', kind: 'keyword', fieldKey: 'name', condition: 'like', value: '수정 불가', editable: false }`,
  ),
  render: () => (
    <FilterHarness
      fields={CHIP_FIELDS}
      initial={[
        keywordChip('k1', '수정 불가', { editable: false }),
        keywordChip('k2', '수정 가능'),
      ]}
    />
  ),
}

export const LongValues: Story = {
  name: '긴 값 말줄임',
  parameters: docs(
    '칩은 최대 폭(250px)에서 값이 말줄임으로 잘린다. 수정 팝오버를 열면 전체 값을 볼 수 있다.',
    `{ id: 'k1', kind: 'keyword', fieldKey: 'name', condition: 'like', value: '아주 길고 긴 캠페인 이름 …' }`,
  ),
  render: () => (
    <FilterHarness
      fields={CHIP_FIELDS}
      initial={[
        keywordChip(
          'k1',
          '아주 길고 긴 캠페인 이름이 계속 이어지는 경우에는 칩이 잘려야 합니다 — 수정 팝오버에서 전체를 본다',
        ),
        selectChip('s1', 'media', ['GOOGLE_ADS', 'NAVER_SA', 'FACEBOOK', 'KAKAO']),
      ]}
    />
  ),
}

export const ManyChipsWrapped: Story = {
  name: '칩이 많아 줄바꿈',
  parameters: docs(
    '칩은 생성 순서대로 쌓이고 한 줄을 넘으면 줄바꿈된다(바 높이가 늘어난다). 둘째 줄 칩도 수정 팝오버가 그 칩 좌측에 맞춰 열린다. 접기(⌃)로 첫 줄만 볼 수 있다.',
    `chips = [ …키워드·선택 칩 10개 ]`,
  ),
  render: () => (
    <FilterHarness
      fields={CHIP_FIELDS}
      initial={[
        selectChip('s1', 'media', ['GOOGLE_ADS', 'KAKAO']),
        ...Array.from({ length: 9 }, (_, index) =>
          keywordChip(`k${index}`, `줄바꿈을 만드는 키워드 ${index + 1}`),
        ),
      ]}
    />
  ),
}

export const MaxChipsReached: Story = {
  name: '칩 수 상한 (maxChips)',
  parameters: docs(
    '`maxChips` 에 닿으면 키워드 칩을 더 만들지 않는다(입력은 비워지고 칩은 그대로). 아래는 `maxChips={3}` 에 칩이 3개인 상태 — 입력해 Enter 를 눌러 본다.',
    `<ComplexFilter.Root maxChips={3} … />`,
  ),
  render: () => (
    <FilterHarness
      fields={CHIP_FIELDS}
      maxChips={3}
      initial={[keywordChip('k1', '하나'), keywordChip('k2', '둘'), keywordChip('k3', '셋')]}
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.type(canvas.getByRole('combobox'), '넷{Enter}')
    await expect(canvas.getAllByTestId('complex-filter-chip')).toHaveLength(3)
  },
}

const EXTRA_FIELDS = [NAME_FIELD, ID_FIELD, MEDIA_FIELD, STATUS_FIELD]
const SOME_CHIPS = [
  keywordChip('k1', '여름 프로모션'),
  selectChip('s1', 'media', ['GOOGLE_ADS', 'KAKAO']),
]

export const MatchModeTwoOptions: Story = {
  name: '결합 방식 — 옵션 2개 (AND / OR)',
  parameters: docs(
    '`matchMode` 를 넘기면 좌측에 「모든 조건 만족 ⌄」이 생긴다. 모듈은 선택 UI 만 노출하고 의미(같은 필드·연산자 묶음 내부 OR)는 소비자가 적용한다. 하단 JSON 의 `mode` 로 선택값을 본다.',
    `matchMode={{
  value: mode,                       // 'all' | 'or' — 값은 소비자 정의
  options: [{ value: 'all', label: '모든 조건 만족' }, { value: 'or', label: '하나라도 만족' }],
  onChange: setMode,
  ariaLabel: '조건 결합 방식',
}}`,
  ),
  render: () => (
    <FilterHarness fields={EXTRA_FIELDS} initial={SOME_CHIPS} matchOptions={MATCH_MODE_OPTIONS} />
  ),
}

export const MatchModeSingleOption: Story = {
  name: '결합 방식 — 옵션 1개(고정)',
  parameters: docs(
    'OR 이 미결인 화면처럼 옵션을 1개만 넘기면 사실상 고정 표시다. 드롭다운은 열리지만 고를 수 있는 항목이 하나뿐이다.',
    `matchMode={{ value: 'all', options: [{ value: 'all', label: '모든 조건 만족' }], onChange, ariaLabel }}`,
  ),
  render: () => (
    <FilterHarness
      fields={EXTRA_FIELDS}
      initial={SOME_CHIPS}
      matchOptions={[MATCH_MODE_OPTIONS[0]!]}
    />
  ),
}

export const RecentSearchesWithItems: Story = {
  name: '최근 검색 — 항목 있음',
  parameters: docs(
    '`recentSearches` 를 넘기면 필드 메뉴 첫 항목에 「최근 검색 ›」이 생긴다. 항목을 고르면 입력에 채워져 추천 모드가 되고(바로 칩이 되지 않는다) 행 우측 ✕ 또는 Delete 키로 지운다. 키워드 칩을 만들 때마다 `onAdd` 가 불린다. 저장소는 소비자 몫이다.',
    `recentSearches={{ items, onAdd, onRemove, onSelect /* 선택 */ }}`,
  ),
  render: () => <FilterHarness fields={EXTRA_FIELDS} recent={RECENT_ITEMS} />,
}

export const RecentSearchesEmpty: Story = {
  name: '최근 검색 — 항목 없음',
  parameters: docs(
    '항목이 비어 있으면 서브메뉴에 `labels.recent.empty`(「검색 기록 없음」)가 나온다. `recentSearches` 자체를 넘기지 않으면 메뉴 항목이 아예 숨는다.',
    `recentSearches={{ items: [], onAdd, onRemove }}`,
  ),
  render: () => <FilterHarness fields={EXTRA_FIELDS} recent={[]} />,
}

function ControlledExpanded() {
  const [expanded, setExpanded] = useState(false)
  return (
    <div className="flex flex-col gap-[8px]">
      <p className="text-[12px] text-afds-text-secondary">
        expanded = {String(expanded)} (바깥 상태가 결정한다)
      </p>
      <FilterHarness
        fields={EXTRA_FIELDS}
        expanded={expanded}
        onToggle={setExpanded}
        initial={[
          ...SOME_CHIPS,
          ...Array.from({ length: 6 }, (_, index) =>
            keywordChip(`k${index + 2}`, `넘치는 키워드 ${index + 1}`),
          ),
        ]}
      />
    </div>
  )
}

export const CollapseControlled: Story = {
  name: '접기 — 제어(expanded + onToggle)',
  parameters: docs(
    '`expanded` 와 `onToggle` 을 넘기면 바깥 상태가 접힘을 결정한다. 접히면 높이 44px 로 첫 줄만 보이고 칩이 가려지면 지우기 왼쪽에 가로 말줄임 「…」 가 뜬다. 입력에 포커스하면 `onToggle(true)` 로 자동 펼침을 요청한다.',
    `const [expanded, setExpanded] = useState(false)
<ComplexFilter.Root expanded={expanded} onToggle={setExpanded} … />`,
  ),
  render: () => <ControlledExpanded />,
}

export const CollapseUncontrolled: Story = {
  name: '접기 — 비제어(기본)',
  parameters: docs(
    '`expanded` 를 넘기지 않으면 모듈이 상태를 가진다(기본 펼침). 우측 ⌃ 버튼(`aria-expanded`)으로 접고 펼친다.',
    `<ComplexFilter.Root … />   // expanded 미지정`,
  ),
  render: () => (
    <FilterHarness
      fields={EXTRA_FIELDS}
      initial={Array.from({ length: 9 }, (_, index) =>
        keywordChip(`k${index}`, `키워드 ${index + 1}`),
      )}
    />
  ),
}

export const DisabledBar: Story = {
  name: '비활성 (disabled)',
  parameters: docs(
    '`disabled` 면 입력·칩 수정·삭제·지우기·접기·결합 방식이 모두 막힌다. 칩은 읽기 전용으로 보인다.',
    `<ComplexFilter.Root disabled … />`,
  ),
  render: () => (
    <FilterHarness
      fields={EXTRA_FIELDS}
      initial={SOME_CHIPS}
      matchOptions={MATCH_MODE_OPTIONS}
      disabled
    />
  ),
}

export const EnglishLabels: Story = {
  name: '현지화 — 영어 labels',
  parameters: docs(
    '모든 문구는 `labels` 로 받는다. `keywordPhrase` 는 값 앞뒤를 따로 받아 어순을 맞춘다 — 한국어 「이름에 값 포함」, 영어 「Name contains 값」. 연산자 문구(`conditions`)와 편집 팝오버·접근성 이름도 함께 바뀐다.',
    `labels={{
  conditions: { like: 'contains', unlike: 'excludes' },
  keywordPhrase: {
    before: (field, condition) => \`\${field} \${condition}\`,   // "Name contains"
    after: () => '',
  },
  /* …나머지 문구 */
}}`,
  ),
  render: () => (
    <FilterHarness
      fields={FIELDS_EN}
      labels={LABELS_EN}
      matchOptions={MATCH_MODE_OPTIONS_EN}
      matchAriaLabel="Condition match mode"
      recent={['summer promo']}
      initial={[
        keywordChip('k1', 'summer promo'),
        keywordChip('k2', 'test', { condition: 'unlike' }),
      ]}
    />
  ),
}

interface ControlledProps {
  initial?: ComplexFilterChip[]
  portalContainer?: HTMLElement | null
  recent?: string[]
  expanded?: boolean
  disabled?: boolean
}

function Controlled({ initial, ...rest }: ControlledProps) {
  return (
    <FilterHarness
      {...rest}
      fields={FIELDS}
      initial={initial}
      matchOptions={MATCH_MODE_OPTIONS}
      showJson={false}
    />
  )
}

const body = () => within(document.body)

// WHY: 팝업은 진입 트랜지션(opacity 0 → 1) 동안 존재하지만 보이지 않는다. 요소가 생기자마자 단정하면 가짜로 실패한다
const expectVisible = (find: () => Promise<HTMLElement>) =>
  waitFor(async () => expect(await find()).toBeVisible())

// WHY: 테스트의 Popover 대역은 배치를 계산하지 않는다(정렬 props 전달만 단정). 실제 좌측 정렬은 레이아웃이 있는 이 play 가
// `getBoundingClientRect` 로 확인하지만 CI 에서는 스토리북을 돌리지 않는다 — 로컬 스토리북에서 확인한다. 허용 오차는 서브픽셀 반올림용 1px 이다
const TOLERANCE = 1
const popupOf = (inner: HTMLElement) => inner.closest<HTMLElement>('[data-slot="popover-content"]')!
const rectOf = (element: Element) => element.getBoundingClientRect()
const expectNear = (actual: () => number, expected: () => number, tolerance = TOLERANCE) =>
  waitFor(() => expect(Math.abs(actual() - expected())).toBeLessThanOrEqual(tolerance))

export const Interactive: Story = { render: () => <Controlled /> }

export const WithChips: Story = {
  render: () => <Controlled initial={WITH_CHIPS} />,
}

export const FieldMenuOpen: Story = {
  render: () => <Controlled />,
  play: async ({ canvasElement }) => {
    const input = within(canvasElement).getByRole('combobox')
    await userEvent.click(input)
    const row = await body().findByTestId('complex-filter-field-media')
    const card = popupOf(row)
    // 카드 좌측은 입력 좌측 −10px(항목이 입력과 정렬), 항목은 34 높이(카드 폭 160)
    await expectNear(
      () => rectOf(card).left,
      () => rectOf(input).left - 10,
    )
    await expectNear(
      () => rectOf(row).left,
      () => rectOf(input).left,
    )
    await expect(Math.round(rectOf(row).height)).toBe(34)
  },
}

export const SearchSuggestions: Story = {
  render: () => <Controlled />,
  play: async ({ canvasElement }) => {
    await userEvent.type(within(canvasElement).getByRole('combobox'), '국민 마그네슘')
    await expect(await body().findAllByRole('option')).toHaveLength(2)
  },
}

export const SearchSuggestionsLongValue: Story = {
  render: () => <Controlled />,
  parameters: {
    docs: {
      description: {
        story:
          '긴 값을 입력해도 추천 행은 한 줄이다. 값만 말줄임되고 「이름에」·「포함」은 줄바꿈되지 않는다.',
      },
    },
  },
  play: async ({ canvasElement }) => {
    await userEvent.type(
      within(canvasElement).getByRole('combobox'),
      'ㅂ,ㅈ,ㄷ,ㄱ,ㅅ,ㅛ,1,2,5,2,3,5,1',
    )
    const rows = await body().findAllByTestId(/^complex-filter-suggestion-/)
    await expect(rows.length).toBeGreaterThan(0)
    await expectNear(
      () => rectOf(popupOf(rows[0]!)).width,
      () => 160,
    )
    for (const row of rows) {
      await expect(Math.abs(rectOf(row).height - 34)).toBeLessThan(1)
      for (const span of row.querySelectorAll('span > span')) {
        if (!span.closest('[title]')) await expect(span.getClientRects()).toHaveLength(1)
      }
    }
  },
}

export const SubMenuMulti: Story = {
  render: () => <Controlled initial={[WITH_CHIPS[2]!]} />,
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole('combobox'))
    const row = await body().findByTestId('complex-filter-field-media')
    await userEvent.click(row)
    const apply = await body().findByTestId('complex-filter-apply')
    await expectVisible(() => body().findByTestId('complex-filter-apply'))
    // 서브메뉴 상단 = 열린 행 상단, 좌측 = 부모 카드 오른쪽 + 8
    const parent = popupOf(row)
    const sub = popupOf(apply)
    await expectNear(
      () => rectOf(sub).top,
      () => rectOf(row).top,
    )
    await expectNear(
      () => rectOf(sub).left,
      () => rectOf(parent).right + 8,
    )
    // 서브메뉴는 폭 180 이고 필드 제목이 없다(운영센터와 같음). 이름은 listbox aria-label 이 전한다
    await expectNear(
      () => rectOf(sub).width,
      () => 180,
    )
    await expect(within(sub).queryByText('매체')).toBeNull()
    await expect(within(sub).getByRole('listbox', { name: '매체' })).toBeVisible()
    // 부모 하이라이트는 서브메뉴를 연 행에 고정
    await expect(row).toHaveAttribute('data-active', 'true')
    // 다중 선택 목록이 포커스를 쥔 채 다른 행을 눌러도 메뉴가 닫히지 않고 그 행의 서브메뉴로 전환된다
    // (언마운트되는 목록에서 포커스가 body 로 떨어지면 이탈로 오판해 전체가 닫히던 실브라우저 회귀)
    await userEvent.click(await body().findByTestId('complex-filter-field-status'))
    await expectVisible(() => body().findByTestId('complex-filter-option-status-done'))
    // 부모 필드 메뉴 카드를 눌러도 서브메뉴가 유지되고, Esc 는 필드 메뉴까지 전체를 닫는다(운영센터 실측)
    await userEvent.click(await body().findByTestId('complex-filter-field-media'))
    await expectVisible(() => body().findByTestId('complex-filter-apply'))
    // 시작 칩(Google DA·Kakao)에 없는 Meta 를 토글해 두고
    await userEvent.click(await body().findByTestId('complex-filter-option-media-FACEBOOK'))
    await userEvent.click(popupOf(await body().findByTestId('complex-filter-field-media')))
    await expect(await body().findByTestId('complex-filter-option-media-FACEBOOK')).toHaveAttribute(
      'aria-selected',
      'true',
    )
    await userEvent.keyboard('{Escape}')
    await waitFor(() => expect(body().queryByRole('listbox')).toBeNull())
  },
}

/** Cmd+Enter(맥)·Ctrl+Enter(윈도우·리눅스)로 「적용」을 누른 것과 같이 저장한다 */
export const SaveShortcut: Story = {
  render: () => <Controlled />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('combobox'))
    await userEvent.click(await body().findByTestId('complex-filter-field-media'))
    await expectVisible(() => body().findByTestId('complex-filter-apply'))
    // 목록에서 일반 Enter 는 토글이다 — 아직 칩은 없다
    await userEvent.keyboard('{Enter}')
    await expect(canvas.queryAllByTestId('complex-filter-chip')).toHaveLength(0)
    // Cmd+Enter 가 「적용」과 같이 칩을 만든다
    await userEvent.keyboard('{Meta>}{Enter}{/Meta}')
    await waitFor(() => expect(canvas.getAllByTestId('complex-filter-chip')).toHaveLength(1))
  },
}

export const SubMenuSingle: Story = {
  render: () => <Controlled />,
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole('combobox'))
    const row = await body().findByTestId('complex-filter-field-status')
    await userEvent.click(row)
    const option = await body().findByTestId('complex-filter-option-status-done')
    await expectVisible(() => body().findByTestId('complex-filter-option-status-done'))
    const parent = popupOf(row)
    const sub = popupOf(option)
    await expectNear(
      () => rectOf(sub).top,
      () => rectOf(row).top,
    )
    await expectNear(
      () => rectOf(sub).left,
      () => rectOf(parent).right + 8,
    )
    // 서브메뉴가 열린 채 다른 행을 누르면 그 행의 서브메뉴로 전환된다
    await userEvent.click(await body().findByTestId('complex-filter-field-media'))
    await expectVisible(() => body().findByTestId('complex-filter-apply'))
    await expect(body().queryByTestId('complex-filter-option-status-done')).toBeNull()
    await expect(await body().findByTestId('complex-filter-field-media')).toHaveAttribute(
      'data-active',
      'true',
    )
  },
}

export const KeywordEditOpen: Story = {
  render: () => <Controlled initial={[keywordChip('k1', 'ㅇㅇㅇ')]} />,
  play: async ({ canvasElement }) => {
    const chip = within(canvasElement).getByTestId('complex-filter-chip')
    await userEvent.click(within(chip).getByTestId('complex-filter-chip-edit'))
    const toggle = await body().findByTestId('complex-filter-condition-unlike')
    await expectVisible(() => body().findByTestId('complex-filter-condition-unlike'))
    // 팝오버 좌측 끝 = 그 칩의 좌측 끝
    await expectNear(
      () => rectOf(popupOf(toggle)).left,
      () => rectOf(chip).left,
    )
  },
}

export const KeywordEditSingleCondition: Story = {
  render: () => <Controlled initial={[keywordChip('k1', '1234', { fieldKey: 'id' })]} />,
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByTestId('complex-filter-chip-edit'))
    await expectVisible(() => body().findByText('ID에 포함'))
    await expect(body().queryByTestId('complex-filter-condition-like')).toBeNull()
  },
}

export const SelectEditOpen: Story = {
  render: () => <Controlled initial={[WITH_CHIPS[2]!]} />,
  play: async ({ canvasElement }) => {
    const chip = within(canvasElement).getByTestId('complex-filter-chip')
    await userEvent.click(within(chip).getByTestId('complex-filter-chip-edit'))
    const cancel = await body().findByTestId('complex-filter-cancel')
    await expectVisible(() => body().findByTestId('complex-filter-cancel'))
    await expectNear(
      () => rectOf(popupOf(cancel)).left,
      () => rectOf(chip).left,
    )
  },
}

export const RecentSearches: Story = {
  render: () => <Controlled recent={['마그네슘', '나이키 브랜드']} />,
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole('combobox'))
    await userEvent.click(await body().findByTestId('complex-filter-recent'))
    await expect(await body().findAllByTestId('complex-filter-recent-item')).toHaveLength(2)
  },
}

export const Collapsed: Story = {
  render: () => (
    <Controlled
      expanded={false}
      initial={[
        ...WITH_CHIPS,
        keywordChip('k2', '아주 긴 키워드 값 하나'),
        keywordChip('k3', '또 다른 긴 키워드 값'),
        keywordChip('k4', '세 번째로 긴 키워드 값'),
        keywordChip('k5', '네 번째로 긴 키워드 값'),
        keywordChip('k6', '다섯 번째로 긴 키워드 값'),
      ]}
    />
  ),
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByTestId('complex-filter-bar')).toHaveAttribute(
      'data-expanded',
      'false',
    )
    const canvas = within(canvasElement)
    const hidden = canvas.getByTestId('complex-filter-overflow')
    await expect(hidden).toBeVisible()
    // 우측 그룹 순서: … → 지우기 → ⌃, 모두 첫 줄 높이선(바 위 5px, 높이 34 안)
    const clear = canvas.getByTestId('complex-filter-clear')
    const toggle = canvas.getByTestId('complex-filter-toggle')
    await expect(rectOf(hidden).right).toBeLessThanOrEqual(rectOf(clear).left)
    await expect(rectOf(clear).right).toBeLessThanOrEqual(rectOf(toggle).left)
    const bar = canvas.getByTestId('complex-filter-bar')
    for (const item of [hidden, clear, toggle]) {
      const top = rectOf(item).top - rectOf(bar).top
      await expect(top).toBeGreaterThanOrEqual(5 - TOLERANCE)
      await expect(rectOf(item).bottom - rectOf(bar).top).toBeLessThanOrEqual(39 + TOLERANCE)
    }
  },
}

const MANY_CHIPS = [
  ...WITH_CHIPS,
  ...Array.from({ length: 7 }, (_, index) =>
    keywordChip(`w${index}`, `줄바꿈을 만드는 긴 키워드 ${index + 1}`),
  ),
]

/** 칩이 둘째 줄로 넘어간 상태 — 수정 팝오버 정렬이 줄바꿈과 무관해야 한다 */
export const Wrapped: Story = {
  render: () => <Controlled initial={MANY_CHIPS} />,
  play: async ({ canvasElement }) => {
    const chips = within(canvasElement).getAllByTestId('complex-filter-chip')
    const last = chips[chips.length - 1]!
    await expect(rectOf(last).top).toBeGreaterThan(rectOf(chips[0]!).top)
    await userEvent.click(within(last).getByTestId('complex-filter-chip-edit'))
    const toggle = await body().findByTestId('complex-filter-condition-unlike')
    await expectVisible(() => body().findByTestId('complex-filter-condition-unlike'))
    await expectNear(
      () => rectOf(popupOf(toggle)).left,
      () => rectOf(last).left,
    )
    await expectActionsPinned(canvasElement)
  },
}

// WHY: 칩이 몇 줄로 늘어도 우측 그룹(지우기·접기)은 한 줄일 때의 위치(바 위 5px, 높이 34)에 고정돼야 한다.
// 바 한가운데로 따라 내려가거나 칩과 겹치면 안 된다
const expectActionsPinned = async (canvasElement: HTMLElement) => {
  const canvas = within(canvasElement)
  const bar = canvas.getByTestId('complex-filter-bar')
  const actions = canvas.getByTestId('complex-filter-actions')
  await expectNear(
    () => rectOf(actions).top - rectOf(bar).top,
    () => 4,
  )
  await expectNear(
    () => rectOf(actions).height,
    () => 34,
  )
  // 좌측 결합 방식 트리거도 같은 첫 줄 높이선에 있다(바 높이 가운데로 내려가지 않는다)
  const match = canvas.getByTestId('complex-filter-match-mode')
  await expectNear(
    () => rectOf(match).top + rectOf(match).height / 2,
    () => rectOf(actions).top + rectOf(actions).height / 2,
  )
  for (const chip of canvas.getAllByTestId('complex-filter-chip')) {
    await expect(rectOf(chip).right).toBeLessThanOrEqual(rectOf(actions).left + TOLERANCE)
  }
}

const narrow = (widthClass: string): Story => ({
  render: () => (
    <div className={widthClass}>
      <Controlled initial={MANY_CHIPS} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const chips = within(canvasElement).getAllByTestId('complex-filter-chip')
    await expect(rectOf(chips[chips.length - 1]!).top).toBeGreaterThan(rectOf(chips[0]!).top)
    await expectActionsPinned(canvasElement)
  },
})

export const WrappedNarrow600: Story = narrow('w-[600px]')
export const WrappedNarrow390: Story = narrow('w-[390px]')

export const MatchModeOpen: Story = {
  render: () => <Controlled initial={WITH_CHIPS} />,
  play: async ({ canvasElement }) => {
    const trigger = within(canvasElement).getByTestId('complex-filter-match-mode')
    // WHY: 웹폰트가 늦게 도착하면 트리거 폭이 열린 뒤에 바뀌어 폭·라벨 위치 단정이 흔들린다
    await document.fonts.ready
    await userEvent.click(trigger)
    const item = await body().findByTestId('complex-filter-match-or')
    await expectVisible(() => body().findByTestId('complex-filter-match-or'))
    const card = popupOf(item)
    // 카드 좌측 = 트리거 좌측, 트리거 아래 5px
    await expectNear(
      () => rectOf(card).left,
      () => rectOf(trigger).left,
    )
    await expectNear(
      () => rectOf(card).top - rectOf(trigger).bottom,
      () => 5,
    )
    // 시안 고정 폭 130
    await expectNear(
      () => rectOf(card).width,
      () => 130,
    )
    // 항목 라벨 시작선 = 카드 좌측 + 20(카드 패딩 10 + 행 좌우 패딩 10)
    const label = (element: Element) => element.querySelector('span')!
    await expectNear(
      () => rectOf(label(item)).left - rectOf(card).left,
      () => 20,
      2,
    )
    // 트리거 라벨은 바 좌측 +14(시안 위치)에 남는다 — 박스를 당긴 -ml-afds-spacing-14 가 사라지면 깨진다
    const bar = canvasElement.querySelector('[data-testid="complex-filter-bar"]')!
    await expectNear(
      () => rectOf(label(trigger)).left - rectOf(bar).left,
      () => 14,
    )
    // 카드 모서리 5(다른 카드와 통일, 시안 8 은 토큰 오차), 항목은 포커스 링(outline) 없이 배경으로만 표시
    await expect(getComputedStyle(card).borderRadius).toBe('5px')
    const first = body().getByTestId('complex-filter-match-all')
    await expect(getComputedStyle(first).outlineStyle).toBe('none')
    // 키보드 포커스 항목은 배경(focus-visible)으로 구분된다. 호버와 겹쳐 두 행이 칠해지지 않게 focus 가 아닌 focus-visible 만 쓴다 —
    // 실제 포인터 위치의 호버를 피하려 두 번째 항목으로 확인한다
    const second = body().getByTestId('complex-filter-match-or')
    await userEvent.keyboard('{Shift}')
    second.focus()
    await expect(second.matches(':focus-visible')).toBe(true)
    await expect(getComputedStyle(second).backgroundColor).not.toBe('rgba(0, 0, 0, 0)')
  },
}

export const Disabled: Story = {
  render: () => <Controlled initial={WITH_CHIPS} disabled />,
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('combobox')).toBeDisabled()
  },
}

// WHY: 스코프 바깥에서 useAfdsPortalContainer() 를 부르면 null 이 온다(APT-15536 실제 페이지 회귀).
// null 을 그대로 넘겨도 입력·칩 수정·매치모드 팝업이 모두 떠야 한다
export const NullPortalContainer: Story = {
  render: () => <Controlled initial={[keywordChip('k1', 'ㅇㅇㅇ')]} portalContainer={null} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.type(canvas.getByRole('combobox'), '값')
    await expect(await body().findAllByRole('option')).toHaveLength(2)
    await userEvent.keyboard('{Escape}')
    await userEvent.click(canvas.getByTestId('complex-filter-chip-edit'))
    await expectVisible(() => body().findByTestId('complex-filter-keyword-editor'))
    await userEvent.keyboard('{Escape}')
    await userEvent.click(canvas.getByTestId('complex-filter-match-mode'))
    await expectVisible(() => body().findByTestId('complex-filter-match-all'))
  },
}
