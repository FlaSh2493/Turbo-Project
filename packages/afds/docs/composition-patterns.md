# AFDS 컴포넌트 조합 패턴

에이전트와 개발자가 복잡한 UI를 구현할 때 참고하는 패턴 모음입니다.

---

## 패턴 1: 로그인 폼

**사용 컴포넌트(계획)**: `Card`, `Input`, `Label`, `Button`, `CheckBox`, `Typography`

이 패턴은 아직 AFDS 에 대응 컴포넌트가 없다. 특히 `Card` 계열과 `Label`은 현재 AFDS export 표면에 없으므로, 아래는 구현 예제가 아닌 로그인 폼의 계획 구조다.

| 영역        | 계획 역할                               |
| ----------- | --------------------------------------- |
| 카드 머리말 | 로그인 제목                             |
| 본문        | 이메일·비밀번호 입력과 로그인 유지 선택 |
| 바닥글      | 제출 버튼과 회원가입 안내               |

---

## 패턴 2: 데이터 테이블 + 페이지네이션

**사용 컴포넌트**: `Table`, `RoundBadge`, `Pagination`, `Spinner`

```tsx
import { Table } from '@turbo-project/afds'
import { RoundBadge } from '@turbo-project/afds'
import { Pagination } from '@turbo-project/afds'

function DataTable({ data, currentPage, totalPages, onPageChange }) {
  return (
    <div className="flex flex-col gap-4">
      <Table.Root>
        <Table.Header>
          <Table.Row>
            <Table.Head>이름</Table.Head>
            <Table.Head>상태</Table.Head>
            <Table.Head>날짜</Table.Head>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {data.map(row => (
            <Table.Row key={row.id}>
              <Table.Cell>{row.name}</Table.Cell>
              <Table.Cell>
                <RoundBadge.Root>
                  <RoundBadge.Content>{row.status}</RoundBadge.Content>
                </RoundBadge.Root>
              </Table.Cell>
              <Table.Cell className="text-fg-muted">{row.date}</Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table.Root>

      <Pagination.Root
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={onPageChange}
      >
        <Pagination.PrevTrigger />
        <Pagination.List>
          <Pagination.Items
            render={item =>
              item.type === 'page' ? (
                <Pagination.Item key={item.value} value={item.value} />
              ) : (
                <Pagination.Ellipsis key={`ellipsis-${item.index}`} />
              )
            }
          />
        </Pagination.List>
        <Pagination.NextTrigger />
      </Pagination.Root>
    </div>
  )
}
```

---

## 패턴 3: 확인 Dialog (위험 액션)

**사용 컴포넌트**: `Modal`, `Button`

> **Rule**: 파괴적 액션 Button은 반드시 Modal 확인 절차를 거쳐야 합니다.

```tsx
import { Modal } from '@turbo-project/afds'
import { Button } from '@turbo-project/afds'

function DeleteConfirmModal({ onDelete }) {
  return (
    <Modal.Root>
      <Modal.Trigger render={<Button variant="danger">삭제</Button>} />

      <Modal.Portal>
        <Modal.Overlay />
        <Modal.Content>
          <Modal.Header>
            <Modal.Title>정말 삭제하시겠습니까?</Modal.Title>
          </Modal.Header>
          <Modal.Body>이 작업은 되돌릴 수 없습니다. 데이터가 영구적으로 삭제됩니다.</Modal.Body>

          <Modal.Footer>
            <Modal.Close render={<Button variant="ghost">취소</Button>} />
            <Button variant="danger" onClick={onDelete}>
              삭제 확인
            </Button>
          </Modal.Footer>
        </Modal.Content>
      </Modal.Portal>
    </Modal.Root>
  )
}
```

---

## 패턴 4: 필터가 있는 탭 네비게이션

**사용 컴포넌트**: `Tab`, `Select`

```tsx
import { Tab } from '@turbo-project/afds'
import { Select } from '@turbo-project/afds'

function FilteredTabs() {
  const sortOptions = [
    { value: 'recent', label: '최신순' },
    { value: 'name', label: '이름순' },
  ]

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <Tab.Root defaultValue="all">
          <Tab.List>
            <Tab.Tab value="all">전체 (24)</Tab.Tab>
            <Tab.Tab value="active">활성 (18)</Tab.Tab>
            <Tab.Tab value="inactive">비활성</Tab.Tab>
          </Tab.List>

          <Tab.Panel value="all">전체 목록...</Tab.Panel>
          <Tab.Panel value="active">활성 목록...</Tab.Panel>
          <Tab.Panel value="inactive">비활성 목록...</Tab.Panel>
        </Tab.Root>

        <Select options={sortOptions}>
          <Select.Trigger placeholder="정렬" />
          <Select.Content>
            <Select.List>
              {sortOptions.map(option => (
                <Select.Item key={option.value} value={option.value}>
                  {option.label}
                </Select.Item>
              ))}
            </Select.List>
          </Select.Content>
        </Select>
      </div>
    </div>
  )
}
```

---

## 패턴 5: 카드 그리드 (사용자/상품 목록)

**사용 컴포넌트(계획)**: `Card`, `Avatar`, `RoundBadge`, `Button`, `Skeleton`

이 패턴은 아직 AFDS 에 대응 컴포넌트가 없다. `Card`와 `Skeleton`이 없으므로, 사용자·상품 카드를 그리드에 배치하고 로딩 중에는 동일한 밀도의 자리표시자를 보이는 구조만 계획으로 남긴다.

---

## 패턴 6: 설정 폼 (다양한 입력 타입)

**사용 컴포넌트(계획)**: `Switch`, `Slider`, `Select`, `Textarea`, `Button`, `Label`

이 패턴은 아직 AFDS 에 대응 컴포넌트가 없다. `Slider`, `Textarea`, `Label`이 없으므로, 알림 토글·볼륨 범위·언어 선택·자기소개 입력·제출 순서의 설정 폼 구조만 계획으로 남긴다.

### 대시보드 개요 (계획)

이 패턴은 아직 AFDS 에 대응 컴포넌트가 없다. `DataCard`와 `EmptyState`가 없으므로, 총 매출·신규 사용자·활성 세션을 세 칸에 배치하고 빈 결과에는 안내와 초기화 동작을 제공하는 구조만 계획으로 남긴다.

---

## 패턴 7: 복합 데이터 폼 (FormField 사용)

**사용 컴포넌트(계획)**: `FormField`, `Input`, `Select`, `Button`, `FormSection`

이 패턴은 아직 AFDS 에 대응 컴포넌트가 없다. `FormField`와 `FormSection`이 없으므로, 프로필 정보 아래에 사용자 이름과 역할 필드, 검증 메시지, 저장 동작을 두는 구조만 계획으로 남긴다.

---

## 패턴 8: 검색 결과 없음 (EmptyState)

**사용 컴포넌트(계획)**: `EmptyState`, `Button`

이 패턴은 아직 AFDS 에 대응 컴포넌트가 없다. `EmptyState`가 없으므로, 결과가 없을 때 제목·설명·필터 초기화 동작을 제공하고 그 외에는 결과 목록을 보이는 구조만 계획으로 남긴다.

---

## 주의사항

| 패턴                 | 주의사항                                   |
| -------------------- | ------------------------------------------ |
| `destructive` Button | 반드시 확인 Dialog와 함께 사용             |
| `icon only` Button   | `aria-label` prop 필수                     |
| `loading` 상태       | Skeleton 컴포넌트로 레이아웃 유지          |
| Form 제출            | `type="submit"` Button은 `<form>` 내부에만 |
| 모달 중첩            | Dialog 내부에 또 다른 Dialog 지양          |
