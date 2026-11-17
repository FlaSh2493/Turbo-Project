import type { Meta, StoryObj } from '@storybook/react'
import { createColumnHelper } from '@tanstack/react-table'
import { SearchIcon } from 'lucide-react'
import { useTable } from './hooks/use-table'
import { BaseTable, type ColumnMeta } from '.'

/**
 *
 * TanStack Table 기반의 데이터 테이블 컴포넌트입니다.
 * `useTable` Hook과 `createColumnHelper`를 함께 사용합니다.
 *
 *
 * ### 기본 사용법
 * ```tsx
 * import { BaseTable, type ColumnMeta } from '@FlaSh2493/turbo-project-design'
 * import { useTable } from '@FlaSh2493/turbo-project-design'
 * import { createColumnHelper } from '@tanstack/react-table'
 *
 * const ch = createColumnHelper<MyRow>()
 *
 * const columns = [
 *   ch.accessor('name', {
 *     header: '이름',
 *     meta: { align: 'left', width: '120px' } satisfies ColumnMeta,
 *   }),
 * ]
 *
 * const table = useTable({ data, columns })
 *
 * <BaseTable.Root table={table}>
 *   <BaseTable.Header />
 *   <BaseTable.Body />
 * </BaseTable.Root>
 * ```
 *
 * ### ColumnMeta 커스텀 props
 * | prop | 타입 | 설명 |
 * |---|---|---|
 * | `align` | `'left' \| 'center' \| 'right'` | 헤더·셀 정렬 |
 * | `width` | `string` | 열 고정 너비 |
 * | `minWidth` | `string` | 열 최소 너비 |
 * | `maxWidth` | `string` | 열 최대 너비 |
 * | `style` | `React.CSSProperties` | 열에 직접 적용할 인라인 스타일 |
 */

// 공통 타입 & 데이터

interface User {
  id: string
  name: string
  role: string
  team: string
  status: '활성' | '비활성'
  joinDate: string
}

const USERS: User[] = [
  {
    id: '1',
    name: '김지수',
    role: '프론트엔드',
    team: '플랫폼',
    status: '활성',
    joinDate: '2022-03-15',
  },
  { id: '2', name: '박준혁', role: '백엔드', team: '광고', status: '활성', joinDate: '2021-11-02' },
  {
    id: '3',
    name: '이소연',
    role: '디자이너',
    team: '플랫폼',
    status: '비활성',
    joinDate: '2023-01-20',
  },
  {
    id: '4',
    name: '최민준',
    role: '프론트엔드',
    team: '데이터',
    status: '활성',
    joinDate: '2020-08-11',
  },
  { id: '5', name: '정하은', role: 'PM', team: '광고', status: '활성', joinDate: '2022-07-04' },
]

const ch = createColumnHelper<User>()

const baseColumns = [
  ch.accessor('name', {
    header: '이름',
    meta: { align: 'left', width: '120px' } satisfies ColumnMeta,
  }),
  ch.accessor('role', {
    header: '직군',
    meta: { align: 'left', width: '140px' } satisfies ColumnMeta,
  }),
  ch.accessor('team', {
    header: '팀',
    meta: { align: 'center', width: '120px' } satisfies ColumnMeta,
  }),
  ch.accessor('status', {
    header: '상태',
    meta: { align: 'center', width: '100px' } satisfies ColumnMeta,
  }),
  ch.accessor('joinDate', {
    header: '입사일',
    meta: { align: 'center', width: '130px' } satisfies ColumnMeta,
  }),
]

const meta = {
  title: 'Compositions / Common / Display / BaseTable',
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
TanStack Table 기반의 데이터 테이블 컴포넌트입니다. \`useTable\` + \`createColumnHelper\`와 함께 사용합니다.

**Import:**
\`\`\`tsx
import { BaseTable, type ColumnMeta } from '.'
import { useTable } from './hooks/use-table'
import { createColumnHelper } from '@tanstack/react-table'
\`\`\`
        `,
      },
    },
  },
  decorators: [
    Story => (
      <div className="w-[700px]">
        <Story />
      </div>
    ),
  ],
  tags: ['autodocs'],
} satisfies Meta

export default meta
type Story = StoryObj

// 기본

/** 가장 기본적인 데이터 테이블입니다. */
export const Default: Story = {
  parameters: {
    controls: { disable: true },
    docs: {
      description: {
        story: `
\`\`\`tsx
const ch = createColumnHelper<User>()

const columns = [
  ch.accessor('name', {
    header: '이름',
    meta: { align: 'left', width: '120px' } satisfies ColumnMeta,
  }),
  ch.accessor('role', {
    header: '직군',
    meta: { align: 'left', width: '140px' } satisfies ColumnMeta,
  }),
  ch.accessor('joinDate', {
    header: '입사일',
    meta: { align: 'center', width: '130px' } satisfies ColumnMeta,
  }),
]

const table = useTable({ data, columns })

<BaseTable.Root table={table}>
  <BaseTable.Header />
  <BaseTable.Body />
</BaseTable.Root>
\`\`\`
        `,
      },
    },
  },
  render: () => {
    const table = useTable({ data: USERS, columns: baseColumns })
    return (
      <BaseTable.Root table={table}>
        <BaseTable.Header />
        <BaseTable.Body />
      </BaseTable.Root>
    )
  },
}

// Size

export const AllSizes: Story = {
  parameters: {
    controls: { disable: true },
    docs: {
      description: {
        story: `
\`BaseTable.Root\`의 \`size\` prop으로 행 높이를 결정합니다 (\`sm\` 40 / \`md\` 60 / \`lg\` 80, 기본 \`md\`).
내부 \`Table.Head\` / \`Table.Cell\`이 Context로 size를 자동 전파받습니다.

\`\`\`tsx
<BaseTable.Root table={table} size="sm">
  <BaseTable.Header />
  <BaseTable.Body />
</BaseTable.Root>
\`\`\`
        `,
      },
    },
  },
  render: function AllSizesStory() {
    const table = useTable({ data: USERS, columns: baseColumns })
    return (
      <div className="flex flex-col gap-8">
        {(['sm', 'md', 'lg'] as const).map(size => (
          <div key={size}>
            <div className="mb-2 text-afds-text-secondary body3">size = {size}</div>
            <BaseTable.Root table={table} size={size}>
              <BaseTable.Header />
              <BaseTable.Body />
            </BaseTable.Root>
          </div>
        ))}
      </div>
    )
  },
}

// Layout (폭 분배)

export const LayoutFillVsAuto: Story = {
  parameters: {
    controls: { disable: true },
    docs: {
      description: {
        story: `
\`BaseTable.Root\`의 \`layout\` prop으로 컬럼 폭 분배 방식을 결정합니다.

- \`'fill'\` (기본): 컬럼 너비 합이 컨테이너보다 작으면 남은 공간을 비례 분배해 **전체 폭을 채웁니다**.
- \`'auto'\`: 컬럼 너비 합만큼만 차지합니다. 남는 공간은 그대로 비워둡니다.

두 모드 모두 컬럼 합이 컨테이너를 초과하면 가로 스크롤이 활성화됩니다.
\`pinned\` 컬럼은 sticky 오프셋 정확도를 위해 두 모드 모두 고정 너비를 유지합니다.

\`\`\`tsx
<BaseTable.Root table={table} layout="fill">  {/* 기본: 전체 채움 */}
<BaseTable.Root table={table} layout="auto">  {/* 컬럼 합만큼만 */}
\`\`\`
        `,
      },
    },
  },
  render: function LayoutFillVsAutoStory() {
    const table = useTable({ data: USERS, columns: baseColumns })
    return (
      <div className="flex flex-col gap-8">
        <div>
          <div className="mb-2 text-afds-text-secondary body3">
            layout = &quot;fill&quot; (기본)
          </div>
          <BaseTable.Root table={table} layout="fill">
            <BaseTable.Header />
            <BaseTable.Body />
          </BaseTable.Root>
        </div>
        <div>
          <div className="mb-2 text-afds-text-secondary body3">layout = &quot;auto&quot;</div>
          <BaseTable.Root table={table} layout="auto">
            <BaseTable.Header />
            <BaseTable.Body />
          </BaseTable.Root>
        </div>
      </div>
    )
  },
}

// ColumnMeta 커스텀 props

export const WithColumnMeta: Story = {
  parameters: {
    controls: { disable: true },
    docs: {
      description: {
        story: `
\`ch.accessor\`의 \`meta\` 옵션으로 열별 정렬·너비·인라인 스타일을 지정합니다.

\`\`\`tsx
const ch = createColumnHelper<User>()

const columns = [
  // 고정 너비
  ch.accessor('id', {
    header: 'ID',
    meta: { align: 'center', width: '60px' } satisfies ColumnMeta,
  }),
  // 최소·최대 너비만 지정 (유동 너비)
  ch.accessor('name', {
    header: '이름',
    meta: { align: 'left', minWidth: '100px', maxWidth: '200px' } satisfies ColumnMeta,
  }),
  // right 정렬
  ch.accessor('team', {
    header: '팀',
    meta: { align: 'right', width: '120px' } satisfies ColumnMeta,
  }),
  // 열 배경색 직접 지정
  ch.accessor('status', {
    header: '상태',
    meta: {
      align: 'center',
      width: '100px',
      style: { background: '#fef9c3' },
    } satisfies ColumnMeta,
  }),
]
\`\`\`
        `,
      },
    },
  },
  render: () => {
    const columns = [
      ch.accessor('id', {
        header: 'ID',
        meta: { align: 'center', width: '60px' } satisfies ColumnMeta,
      }),
      ch.accessor('name', {
        header: '이름 (left)',
        meta: { align: 'left', minWidth: '100px', maxWidth: '200px' } satisfies ColumnMeta,
      }),
      ch.accessor('role', {
        header: '직군 (center)',
        meta: { align: 'center', width: '140px' } satisfies ColumnMeta,
      }),
      ch.accessor('team', {
        header: '팀 (right)',
        meta: { align: 'right', width: '120px' } satisfies ColumnMeta,
      }),
      ch.accessor('status', {
        header: '상태 (style)',
        meta: {
          align: 'center',
          width: '100px',
          style: { background: 'lemonchiffon' },
        } satisfies ColumnMeta,
      }),
    ]
    const table = useTable({ data: USERS, columns })
    return (
      <BaseTable.Root table={table}>
        <BaseTable.Header />
        <BaseTable.Body />
      </BaseTable.Root>
    )
  },
}

// 정렬

export const WithSorting: Story = {
  parameters: {
    controls: { disable: true },
    docs: {
      description: {
        story: `
\`useTable\`에 \`enableSorting: true\`를 전달하고, 열마다 \`enableSorting\`으로 개별 제어합니다.

\`\`\`tsx
const columns = [
  ch.accessor('name', {
    header: '이름',
    enableSorting: true,
    meta: { align: 'left', width: '120px' } satisfies ColumnMeta,
  }),
  ch.accessor('role', {
    header: '직군',
    enableSorting: false,
    meta: { align: 'left', width: '140px' } satisfies ColumnMeta,
  }),
]

const table = useTable({ data, columns, enableSorting: true })
\`\`\`
        `,
      },
    },
  },
  render: () => {
    const columns = [
      ch.accessor('name', {
        header: '이름',
        enableSorting: true,
        meta: { align: 'left', width: '120px' } satisfies ColumnMeta,
      }),
      ch.accessor('role', {
        header: '직군',
        enableSorting: false,
        meta: { align: 'left', width: '140px' } satisfies ColumnMeta,
      }),
      ch.accessor('team', {
        header: '팀',
        enableSorting: false,
        meta: { align: 'center', width: '120px' } satisfies ColumnMeta,
      }),
      ch.accessor('status', {
        header: '상태',
        enableSorting: false,
        meta: { align: 'center', width: '100px' } satisfies ColumnMeta,
      }),
      ch.accessor('joinDate', {
        header: '입사일',
        enableSorting: true,
        meta: { align: 'center', width: '130px' } satisfies ColumnMeta,
      }),
    ]
    const table = useTable({ data: USERS, columns, enableSorting: true })
    return (
      <BaseTable.Root table={table}>
        <BaseTable.Header />
        <BaseTable.Body />
      </BaseTable.Root>
    )
  },
}

// 빈 상태

export const WithEmptyState: Story = {
  parameters: {
    controls: { disable: true },
    docs: {
      description: {
        story: `
데이터가 없을 때 \`BaseTable.Body\` 대신 \`BaseTable.Fallback\`을 조건부로 렌더링합니다.

\`\`\`tsx
<BaseTable.Root table={table}>
  <BaseTable.Header />
  {table.getRowModel().rows.length === 0 ? (
    <BaseTable.Fallback>조회된 데이터가 없습니다.</BaseTable.Fallback>
  ) : (
    <BaseTable.Body />
  )}
</BaseTable.Root>
\`\`\`
        `,
      },
    },
  },
  render: function WithEmptyStateExample() {
    const table = useTable({ data: [], columns: baseColumns })
    const isEmpty = table.getRowModel().rows.length === 0
    return (
      <BaseTable.Root table={table} className="h-[360px]">
        <BaseTable.Header />
        {isEmpty ? (
          <BaseTable.Fallback>
            <div className="flex flex-col items-center gap-2">
              <SearchIcon />
              조회된 데이터가 없습니다.
            </div>
          </BaseTable.Fallback>
        ) : (
          <BaseTable.Body />
        )}
      </BaseTable.Root>
    )
  },
}

// 행 선택

export const WithRowSelection: Story = {
  parameters: {
    controls: { disable: true },
    docs: {
      description: {
        story: `
\`ch.display\`로 체크박스 열을 추가하고, \`useTable\`에 \`enableRowSelection: true\`를 전달합니다.

\`\`\`tsx
const columns = [
  ch.display({
    id: 'select',
    header: ({ table }) => (
      <input
        type="checkbox"
        checked={table.getIsAllRowsSelected()}
        onChange={table.getToggleAllRowsSelectedHandler()}
      />
    ),
    cell: ({ row }) => (
      <input
        type="checkbox"
        checked={row.getIsSelected()}
        onChange={row.getToggleSelectedHandler()}
      />
    ),
    meta: { align: 'center', width: '48px' } satisfies ColumnMeta,
  }),
  ch.accessor('name', {
    header: '이름',
    meta: { align: 'left', width: '120px' } satisfies ColumnMeta,
  }),
  // ...
]

const table = useTable({ data, columns, enableRowSelection: true })
\`\`\`
        `,
      },
    },
  },
  render: () => {
    const columns = [
      ch.display({
        id: 'select',
        header: ({ table }) => (
          <input
            type="checkbox"
            checked={table.getIsAllRowsSelected()}
            onChange={table.getToggleAllRowsSelectedHandler()}
          />
        ),
        cell: ({ row }) => (
          <input
            type="checkbox"
            checked={row.getIsSelected()}
            onChange={row.getToggleSelectedHandler()}
          />
        ),
        meta: { align: 'center', width: '48px' } satisfies ColumnMeta,
      }),
      ...baseColumns,
    ]
    const table = useTable({ data: USERS, columns, enableRowSelection: true })
    return (
      <BaseTable.Root table={table}>
        <BaseTable.Header />
        <BaseTable.Body />
      </BaseTable.Root>
    )
  },
}

// 열 고정 (Column Pinning)

export const WithColumnPinning: Story = {
  parameters: {
    controls: { disable: true },
    docs: {
      description: {
        story: `
\`useTable\`의 \`initialColumnPinning\`에 고정할 열의 \`accessorKey\`를 배열로 지정합니다.

\`\`\`tsx
const table = useTable({
  data,
  columns,
  initialColumnPinning: {
    left: ['name'],   // 좌측 고정
    right: ['joinDate'], // 우측 고정
  },
})
\`\`\`
        `,
      },
    },
  },
  render: () => {
    const columns = [
      ch.accessor('name', {
        header: '이름',
        meta: { align: 'left', width: '120px' } satisfies ColumnMeta,
      }),
      ch.accessor('role', {
        header: '직군',
        meta: { align: 'left', width: '140px' } satisfies ColumnMeta,
      }),
      ch.accessor('team', {
        header: '팀',
        meta: { align: 'center', width: '140px' } satisfies ColumnMeta,
      }),
      ch.accessor('status', {
        header: '상태',
        meta: { align: 'center', width: '140px' } satisfies ColumnMeta,
      }),
      ch.accessor('joinDate', {
        header: '입사일',
        meta: { align: 'center', width: '130px' } satisfies ColumnMeta,
      }),
      ch.accessor('id', {
        header: 'ID',
        meta: { align: 'center', width: '80px' } satisfies ColumnMeta,
      }),
    ]
    const data: User[] = Array.from({ length: 30 }, (_, i) => ({
      id: String(i + 1),
      name: `유저 ${i + 1}`,
      role: ['프론트엔드', '백엔드', '디자이너', 'PM'][i % 4],
      team: ['플랫폼', '광고', '데이터'][i % 3],
      status: i % 5 === 0 ? '비활성' : '활성',
      joinDate: `202${i % 5}-0${(i % 9) + 1}-${String((i % 28) + 1).padStart(2, '0')}`,
    }))
    const table = useTable({
      data,
      columns,
      initialColumnPinning: { left: ['name'], right: ['joinDate'] },
    })
    return (
      <BaseTable.Root table={table} className="h-[360px]">
        <BaseTable.Header />
        <BaseTable.Body />
      </BaseTable.Root>
    )
  },
}

// 가로 스크롤

export const HorizontalScroll: Story = {
  parameters: {
    controls: { disable: true },
    docs: {
      description: {
        story: `
열 너비 합이 컨테이너를 초과하면 자동으로 가로 스크롤이 활성화됩니다.
스크롤 위치에 따라 양끝에 그림자가 표시됩니다.

\`\`\`tsx
interface WideRow { id: string; col1: string; col2: string /* ... */ }

const wch = createColumnHelper<WideRow>()

const columns = [
  wch.accessor('id', {
    header: 'ID',
    meta: { align: 'center', width: '60px' } satisfies ColumnMeta,
  }),
  wch.accessor('col1', {
    header: '컬럼 1',
    meta: { align: 'center', width: '140px' } satisfies ColumnMeta,
  }),
  // ... 열이 많을수록 가로 스크롤 발생
]

// 컨테이너에 너비 제약을 주면 스크롤 활성화
<div style={{ width: 500 }}>
  <BaseTable.Root table={table}>
    <BaseTable.Header />
    <BaseTable.Body />
  </BaseTable.Root>
</div>
\`\`\`
        `,
      },
    },
  },
  render: () => {
    interface WideRow {
      id: string
      c1: string
      c2: string
      c3: string
      c4: string
      c5: string
      c6: string
      c7: string
      c8: string
    }
    const wch = createColumnHelper<WideRow>()
    const data: WideRow[] = Array.from({ length: 5 }, (_, i) => ({
      id: String(i + 1),
      c1: `값 ${i + 1}-1`,
      c2: `값 ${i + 1}-2`,
      c3: `값 ${i + 1}-3`,
      c4: `값 ${i + 1}-4`,
      c5: `값 ${i + 1}-5`,
      c6: `값 ${i + 1}-6`,
      c7: `값 ${i + 1}-7`,
      c8: `값 ${i + 1}-8`,
    }))
    const columns = [
      wch.accessor('id', {
        header: 'ID',
        meta: { align: 'center', width: '60px' } satisfies ColumnMeta,
      }),
      ...(['c1', 'c2', 'c3', 'c4', 'c5', 'c6', 'c7', 'c8'] as const).map((key, i) =>
        wch.accessor(key, {
          header: `컬럼 ${i + 1}`,
          meta: { align: 'center', width: '140px' } satisfies ColumnMeta,
        }),
      ),
    ]
    const table = useTable({ data, columns })
    return (
      <BaseTable.Root table={table}>
        <BaseTable.Header />
        <BaseTable.Body />
      </BaseTable.Root>
    )
  },
}

// 세로 스크롤

export const VerticalScroll: Story = {
  parameters: {
    controls: { disable: true },
    docs: {
      description: {
        story: `
\`BaseTable.Root\`에 \`className\`으로 높이를 제한하면 세로 스크롤이 활성화됩니다.
헤더는 \`sticky top-0\`으로 항상 상단에 고정됩니다.

\`\`\`tsx
<BaseTable.Root table={table} className="h-[360px]">
  <BaseTable.Header />
  <BaseTable.Body />
</BaseTable.Root>
\`\`\`
        `,
      },
    },
  },
  render: () => {
    const data: User[] = Array.from({ length: 30 }, (_, i) => ({
      id: String(i + 1),
      name: `유저 ${i + 1}`,
      role: ['프론트엔드', '백엔드', '디자이너', 'PM'][i % 4],
      team: ['플랫폼', '광고', '데이터'][i % 3],
      status: i % 5 === 0 ? '비활성' : '활성',
      joinDate: `202${i % 5}-0${(i % 9) + 1}-${String((i % 28) + 1).padStart(2, '0')}`,
    }))
    const table = useTable({ data, columns: baseColumns })
    return (
      <BaseTable.Root table={table} className="h-[360px]">
        <BaseTable.Header />
        <BaseTable.Body />
      </BaseTable.Root>
    )
  },
}

// 커스텀 Cell 렌더링

export const WithCustomCell: Story = {
  parameters: {
    controls: { disable: true },
    docs: {
      description: {
        story: `
\`ch.accessor\`의 \`cell\` 함수로 셀 내용을 자유롭게 렌더링합니다.
\`getValue()\`로 값을 읽고, \`row.original\`로 전체 행 데이터에 접근합니다.

\`\`\`tsx
const columns = [
  ch.accessor('name', {
    header: '이름',
    meta: { align: 'left', width: '140px' } satisfies ColumnMeta,
    cell: ({ getValue, row }) => (
      <div>
        <div style={{ fontWeight: 600 }}>{getValue()}</div>
        <div style={{ fontSize: 12, color: '#9ca3af' }}>{row.original.role}</div>
      </div>
    ),
  }),
  ch.accessor('status', {
    header: '상태',
    meta: { align: 'center', width: '90px' } satisfies ColumnMeta,
    cell: ({ getValue }) => {
      const value = getValue()
      return (
        <span style={{
          padding: '2px 8px',
          borderRadius: 9999,
          fontSize: 12,
          background: value === '활성' ? '#dcfce7' : '#f3f4f6',
          color: value === '활성' ? '#16a34a' : '#6b7280',
        }}>
          {value}
        </span>
      )
    },
  }),
  ch.display({
    id: 'actions',
    header: '액션',
    meta: { align: 'center', width: '80px' } satisfies ColumnMeta,
    cell: ({ row }) => (
      <button onClick={() => alert(row.original.name)}>
        상세
      </button>
    ),
  }),
]
\`\`\`
        `,
      },
    },
  },
  render: () => {
    const columns = [
      ch.accessor('name', {
        header: '이름',
        meta: { align: 'left', width: '140px' } satisfies ColumnMeta,
        cell: ({ getValue, row }) => (
          <div>
            <div className="font-semibold text-sm">{getValue()}</div>
            <div className="text-xs text-afds-text-secondary">{row.original.role}</div>
          </div>
        ),
      }),
      ch.accessor('team', {
        header: '팀',
        meta: { align: 'center', width: '100px' } satisfies ColumnMeta,
      }),
      ch.accessor('status', {
        header: '상태',
        meta: { align: 'center', width: '90px' } satisfies ColumnMeta,
        cell: ({ getValue }) => {
          const value = getValue()
          const isActive = value === '활성'
          return (
            <span
              className={`inline-block px-afds-8 py-0.5 rounded-full text-xs font-medium ${
                isActive ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'
              }`}
            >
              {value}
            </span>
          )
        },
      }),
      ch.accessor('joinDate', {
        header: '입사일',
        meta: { align: 'center', width: '130px' } satisfies ColumnMeta,
        cell: ({ getValue }) => {
          const [year, month, day] = getValue().split('-')
          return (
            <span className="text-afds-text-secondary text-[13px]">
              {year}년 {month}월 {day}일
            </span>
          )
        },
      }),
      ch.display({
        id: 'actions',
        header: '액션',
        meta: { align: 'center', width: '80px' } satisfies ColumnMeta,
        cell: ({ row }) => (
          <button
            onClick={() => alert(`${row.original.name} 상세보기`)}
            className="px-afds-10 py-afds-4 text-xs rounded-md border border-afds-border-default cursor-pointer bg-afds-bg-surface"
          >
            상세
          </button>
        ),
      }),
    ]
    const table = useTable({ data: USERS, columns })
    return (
      <BaseTable.Root table={table}>
        <BaseTable.Header />
        <BaseTable.Body />
      </BaseTable.Root>
    )
  },
}

// 커스텀 className

export const WithCustomClassNames: Story = {
  parameters: {
    controls: { disable: true },
    docs: {
      description: {
        story: `
각 서브컴포넌트의 className prop으로 스타일을 세밀하게 커스텀합니다.

\`\`\`tsx
<BaseTable.Root
  table={table}
  tableClassName="text-sm"
>
  <BaseTable.Header
    headClassName="bg-blue-50 text-blue-700"
  />
  <BaseTable.Body<User>
    rowClassName={(row) =>
      row.original.status === '비활성' ? 'bg-afds-gray-100 opacity-50' : ''
    }
    cellClassName={(cell) =>
      cell.column.id === 'status' ? 'font-semibold' : ''
    }
  />
</BaseTable.Root>
\`\`\`
        `,
      },
    },
  },
  render: () => {
    const table = useTable({ data: USERS, columns: baseColumns })
    return (
      <BaseTable.Root table={table} tableClassName="text-sm">
        <BaseTable.Header headClassName="bg-blue-50 text-blue-700" />
        <BaseTable.Body<User>
          rowClassName={row =>
            row.original.status === '비활성' ? 'bg-afds-gray-100 opacity-50' : ''
          }
          cellClassName={cell => (cell.column.id === 'status' ? 'font-semibold' : '')}
        />
      </BaseTable.Root>
    )
  },
}

// 보더 적용

export const WithBorders: Story = {
  parameters: {
    controls: { disable: true },
    docs: {
      description: {
        story: `
격자 형태의 보더를 적용하려면 **셀에는 \`border-r border-b\`만**, **외곽은 \`Root\`의 기본 border**가 담당하도록
방향을 분리합니다. \`base-table\`은 sticky 헤더·column pinning을 위해 \`border-separate\`로 동작하므로,
\`border\` 4면을 모두 셀에 주면 보더가 겹쳐 두 줄로 보이는 문제를 방지하기 위함입니다.

\`\`\`tsx
<BaseTable.Root table={table}>
  <BaseTable.Header
    headClassName="border-r border-b border-afds-border-default"
  />
  <BaseTable.Body
    cellClassName="border-r border-b border-afds-border-default"
  />
</BaseTable.Root>
\`\`\`
        `,
      },
    },
  },
  render: () => {
    const table = useTable({ data: USERS, columns: baseColumns })
    return (
      <BaseTable.Root table={table}>
        <BaseTable.Header headClassName="border-r border-b border-afds-border-default" />
        <BaseTable.Body cellClassName="border-r border-b border-afds-border-default" />
      </BaseTable.Root>
    )
  },
}

// 행 스타일 커스텀

export const WithConditionalRowStyle: Story = {
  parameters: {
    controls: { disable: true },
    docs: {
      description: {
        story: `
\`BaseTable.Body\`의 \`rowClassName\`에 함수를 전달해 행마다 조건부 스타일을 적용합니다.

\`\`\`tsx
<BaseTable.Body<User>
  rowClassName={(row) =>
    row.original.status === '비활성' ? 'opacity-40' : ''
  }
/>
\`\`\`
        `,
      },
    },
  },
  render: () => {
    const table = useTable({ data: USERS, columns: baseColumns })
    return (
      <BaseTable.Root table={table}>
        <BaseTable.Header />
        <BaseTable.Body<User>
          rowClassName={row => (row.original.status === '비활성' ? 'opacity-40' : '')}
        />
      </BaseTable.Root>
    )
  },
}
