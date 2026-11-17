# Table

> AFDS 기본 스타일(셀 높이·구분선·헤더 배경·행 hover)이 적용된 시맨틱 HTML 테이블 컴포넌트

## Rules

1. 데이터 표시 목적에만 사용 — 레이아웃 목적 금지
2. 기본 시각 스타일은 AFDS 토큰 기반으로 자동 적용 — 추가 className은 override 목적으로만 사용
3. 행 높이는 `size` prop으로 제어 (sm/md/lg), 임의값 사용 지양

## Examples

```tsx
<Table.Root aria-label="사용자 목록">
  <Table.Header>
    <Table.Row>
      <Table.Head>이름</Table.Head>
      <Table.Head>이메일</Table.Head>
    </Table.Row>
  </Table.Header>
  <Table.Body>
    <Table.Row>
      <Table.Cell>홍길동</Table.Cell>
      <Table.Cell>hong@example.com</Table.Cell>
    </Table.Row>
  </Table.Body>
</Table.Root>
```
