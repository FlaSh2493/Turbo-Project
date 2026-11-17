import * as React from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { AfdsScope } from '@turbo-project/afds/scope'
import { Button, Modal, Popover } from '@turbo-project/afds/bricks'

/**
 * `<AfdsScope>` 는 children 을 `.afds` 루트로 감싸고 내부에 포털 타깃(`[data-afds-portal]`)을 심어,
 * 다른 디자인시스템과 공존하는 앱에서 AFDS 를 `.afds` 영역 안에만 가둘 수 있게 한다.
 *
 * - 스타일 격리: `import '@turbo-project/afds/styles/scoped'` 로 preflight 를 `.afds` 안에만 적용.
 * - 오버레이 격리: `<AfdsScope>` 하위 Drawer/Modal/Popover/Tooltip 은 자동으로 그 안의 포털 타깃으로 렌더.
 *
 * 자세한 도입 레시피는 `docs/scoped-coexistence.md` 참고.
 */
const meta = {
  title: 'AFDS / Scope / AfdsScope',
  component: AfdsScope,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
## AfdsScope — AFDS를 "전용 구역" 안에만 적용하기

이미 **다른 디자인시스템(Ant Design · MUI 등)으로 만든 화면**에 AFDS를 얹으면, AFDS의 전역 스타일
리셋이 화면 전체로 번져 기존 UI가 깨질 수 있습니다. \`<AfdsScope>\`는 AFDS를 **\`.afds\`라는 전용 구역 안에만**
가둬서 이 충돌을 막아 줍니다.

### 쓰는 법 (두 가지만)

\`\`\`tsx
// 1) 전역 스타일 대신 '스코프된 스타일'을 import
import '@turbo-project/afds/styles/scoped'

// 2) AFDS UI를 <AfdsScope>로 감싸기
<AfdsScope>
  <Chat />
</AfdsScope>
\`\`\`

이렇게 하면 AFDS의 리셋·디자인토큰·오버레이(모달/팝오버 등)가 모두 \`.afds\` 구역 **안에서만** 동작하고,
바깥 화면(host)은 건드리지 않습니다.

### 한 가지 규칙

\`.afds\` 안에는 **AFDS 컴포넌트만** 두세요. 다른 디자인시스템의 host 컴포넌트를 \`.afds\` 안에 넣으면 반대로 그 컴포넌트가
AFDS 리셋에 깨집니다(아래 *Antipattern* 스토리 참고). host는 \`.afds\` **밖**에 둡니다.

### 아래 스토리 읽는 법

Storybook 미리보기는 AFDS 스타일을 이미 전역으로 불러오기 때문에, 일반 스토리로는 "안/밖" 차이가 보이지
않습니다. 그래서 아래 데모들은 **각자 독립된 작은 화면(iframe)** 안에서 host 스타일과 AFDS 스타일을 직접 넣어
**문제 상황(❌)과 해결된 모습(✅)을 나란히** 재현합니다.
`,
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof AfdsScope>

export default meta
type Story = StoryObj<typeof meta>

// iframe 격리 데모용 CSS/마크업

/** 호스트(다른 디자인시스템) 기준 스타일 — UA 기본 + 약간의 호스트 규칙 */
const HOST_CSS = `
  body { font-family: system-ui, sans-serif; color: #1f2937; margin: 0; padding: 16px; background: #fff; }
  .grid { display: flex; gap: 16px; align-items: flex-start; flex-wrap: wrap; }
  .panel { flex: 1 1 260px; border: 1px dashed #94a3b8; border-radius: 8px; padding: 12px; }
  .tag { font: 600 12px/1.4 ui-monospace, monospace; color: #475569; margin-bottom: 10px; }
  .tag.bad { color: #b91c1c; }
  .tag.good { color: #15803d; }
  .box { width: 160px; padding: 16px; border: 3px solid #2563eb; background: #dbeafe; margin-top: 10px; }
  .host-btn { background: #2563eb; color: #fff; border: 1px solid #1d4ed8; padding: 8px 14px; border-radius: 6px; font-size: 14px; }
`

/**
 * AFDS preflight 대표 규칙(요지). 실제 플러그인은 컴파일된 Tailwind preflight 전체를 변환하지만,
 * 데모에서는 충돌이 드러나는 핵심 규칙만 옮겼다. scoped 버전은 scopeAfdsPreflight 와 동일하게 .afds 로 prefix 한다.
 */
const GLOBAL_PREFLIGHT = `
  *, ::before, ::after { box-sizing: border-box; margin: 0; padding: 0; border: 0 solid; }
  h1,h2,h3,h4,h5,h6 { font-size: inherit; font-weight: inherit; }
  ul, ol { list-style: none; }
  button { appearance: none; background: transparent; border: 0; padding: 0; font: inherit; color: inherit; cursor: pointer; }
`

const SCOPED_PREFLIGHT = `
  .afds *, .afds ::before, .afds ::after { box-sizing: border-box; margin: 0; padding: 0; border: 0 solid; }
  .afds h1, .afds h2, .afds h3, .afds h4, .afds h5, .afds h6 { font-size: inherit; font-weight: inherit; }
  .afds ul, .afds ol { list-style: none; }
  .afds button { appearance: none; background: transparent; border: 0; padding: 0; font: inherit; color: inherit; cursor: pointer; }
`

/** 충돌이 드러나는 다양한 요소 샘플: 타이포그래피 · 마진 · 리스트 · 버튼 · 박스모델 */
const sample = (tag: string, tagClass: string, wrapClass = '') => `
  <section class="panel ${wrapClass}">
    <div class="tag ${tagClass}">${tag}</div>
    <h1>제목 (h1)</h1>
    <p>문단 — 기본 마진과 줄간격이 있어야 합니다.</p>
    <ul><li>목록 항목 A</li><li>목록 항목 B</li></ul>
    <button class="host-btn">버튼</button>
    <div class="box">box-sizing (w:160 + pad/border)</div>
  </section>
`

function IsolationFrame({
  css,
  body,
  height = 380,
}: {
  css: string
  body: string
  height?: number
}) {
  const srcDoc = `<!doctype html><html><head><meta charset="utf-8"><style>${css}</style></head><body>${body}</body></html>`
  return (
    <iframe
      title="afds-isolation-demo"
      srcDoc={srcDoc}
      style={{ width: '100%', height, border: '1px solid #e5e7eb', borderRadius: 8 }}
    />
  )
}

// Stories

/**
 * ❌ 문제 상황 — 전역 스타일(`@turbo-project/afds/styles`)을 쓰면 이렇게 됩니다.
 *
 * AFDS의 리셋이 페이지 전체로 번져 **host 화면까지** 망가집니다: 제목이 작아지고, 목록의 점(•)이 사라지고,
 * 버튼이 납작해지고, 박스 크기가 달라집니다. 이게 `<AfdsScope>`가 필요한 이유입니다.
 */
export const PreflightLeak_Problem: Story = {
  args: { children: null },
  render: () => (
    <IsolationFrame
      css={HOST_CSS + GLOBAL_PREFLIGHT}
      body={`<div class="grid">${sample('호스트 영역 — 전역 AFDS preflight 가 새어 깨짐 😢', 'bad')}</div>`}
    />
  ),
}

/**
 * ✅ 해결된 모습 — `@turbo-project/afds/styles/scoped`를 쓰면 이렇게 됩니다.
 *
 * AFDS 리셋이 `.afds` 구역 안에서만 적용됩니다. **왼쪽(host)** 은 제목·점·버튼이 그대로 멀쩡하고,
 * **오른쪽(.afds)** 에만 AFDS 리셋이 적용됩니다.
 */
export const ScopedIsolation_Fixed: Story = {
  args: { children: null },
  render: () => (
    <IsolationFrame
      css={HOST_CSS + SCOPED_PREFLIGHT}
      body={`<div class="grid">${sample('호스트 영역 — 영향 없음 ✅', 'good')}${sample(
        '.afds 영역 — 여기에만 AFDS 리셋 적용 ✅',
        'good',
        'afds',
      )}</div>`}
    />
  ),
}

/**
 * 같은 화면을 위(❌ 문제 = 전역)와 아래(✅ 해결 = 스코프)로 비교합니다.
 * 제목 크기·간격·목록 점·버튼 모양이 어떻게 달라지는지 한눈에 볼 수 있습니다.
 */
export const SideBySide_Comparison: Story = {
  args: { children: null },
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <div
          style={{
            font: '600 13px/1.5 ui-monospace, monospace',
            color: '#b91c1c',
            marginBottom: 6,
          }}
        >
          ❌ 전역 styles — preflight 가 호스트로 누수
        </div>
        <IsolationFrame
          height={340}
          css={HOST_CSS + GLOBAL_PREFLIGHT}
          body={`<div class="grid">${sample('호스트', 'bad')}</div>`}
        />
      </div>
      <div>
        <div
          style={{
            font: '600 13px/1.5 ui-monospace, monospace',
            color: '#15803d',
            marginBottom: 6,
          }}
        >
          ✅ styles/scoped — 호스트 정상 + .afds 만 리셋
        </div>
        <IsolationFrame
          height={340}
          css={HOST_CSS + SCOPED_PREFLIGHT}
          body={`<div class="grid">${sample('호스트 (영향 없음)', 'good')}${sample(
            '.afds (리셋 적용)',
            'good',
            'afds',
          )}</div>`}
        />
      </div>
    </div>
  ),
}

/**
 * 스타일 리셋뿐 아니라 **디자인 토큰(간격·색·폰트 같은 CSS 변수)** 도 같은 방식으로 격리됩니다.
 *
 * 여기 host는 "간격" 값을 14px로 정해 뒀습니다. 전역 스타일을 쓰면 AFDS가 이 값을 덮어써 host 박스 간격이
 * 깨지지만(위 ❌), 스코프 스타일을 쓰면 host는 14px 그대로 유지되고 `.afds` 안에서만 AFDS 값(2px)이
 * 적용됩니다(아래 ✅).
 */
export const ThemeVar_Isolation: Story = {
  args: { children: null },
  render: () => {
    // host 가 --spacing 을 정의하고 box padding 에 사용
    const hostThemeCss = `
      body { font-family: system-ui, sans-serif; margin: 0; padding: 16px; }
      .tag { font: 600 12px/1.4 ui-monospace, monospace; margin-bottom: 10px; }
      .tag.bad { color: #b91c1c; } .tag.good { color: #15803d; }
      :root { --spacing: 14px; }
      .box { padding: var(--spacing); background: #dbeafe; border: 1px solid #60a5fa; border-radius: 6px; width: max-content; }
    `
    const leakCss = hostThemeCss + `:root, :host { --spacing: 2px; }` // 전역 AFDS theme 가 host 를 덮음
    const scopedCss = hostThemeCss + `.afds { --spacing: 2px; }` // .afds 로 가둠 → host 보존
    const box = (tag: string, cls: string, wrap = '') =>
      `<section class="${wrap}"><div class="tag ${cls}">${tag}</div><div class="box">padding = var(--spacing)</div></section>`
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <div
            style={{
              font: '600 13px/1.5 ui-monospace, monospace',
              color: '#b91c1c',
              marginBottom: 6,
            }}
          >
            ❌ 전역 styles — AFDS theme 가 host `--spacing` 을 14px→2px 로 덮음
          </div>
          <IsolationFrame height={150} css={leakCss} body={box('host box (padding 깨짐)', 'bad')} />
        </div>
        <div>
          <div
            style={{
              font: '600 13px/1.5 ui-monospace, monospace',
              color: '#15803d',
              marginBottom: 6,
            }}
          >
            ✅ styles/scoped — host box 는 14px 유지, .afds box 만 2px
          </div>
          <IsolationFrame
            height={170}
            css={scopedCss}
            body={box('host box (14px 유지)', 'good') + box('.afds box (2px)', 'good', 'afds')}
          />
        </div>
      </div>
    )
  },
}

/**
 * ⚠️ 이렇게 쓰면 안 돼요 — host 컴포넌트를 `.afds` 안에 넣지 마세요.
 *
 * `.afds`는 "그 안의 모든 것"에 AFDS 리셋을 적용합니다. 그래서 host 컴포넌트를 `.afds` 안에 넣으면, 이번엔
 * **반대로 그 컴포넌트(예: host 버튼)가 배경·테두리·여백을 잃고 깨집니다**. **왼쪽(.afds 안)** 은 깨지고,
 * **오른쪽(.afds 밖)** 은 정상입니다. → host는 항상 `.afds` **밖**에 두고, AFDS(챗 등)만 안에 두세요.
 */
export const Antipattern_HostInsideScope: Story = {
  args: { children: null },
  render: () => {
    const madCss = `
      body { font-family: system-ui, sans-serif; margin: 0; padding: 16px; }
      .lab { display: flex; gap: 24px; align-items: flex-start; flex-wrap: wrap; }
      .tag { font: 600 12px/1.4 ui-monospace, monospace; margin-bottom: 10px; }
      .tag.bad { color: #b91c1c; } .tag.good { color: #15803d; }
      /* 대표 host 컴포넌트(자체 클래스 스타일) */
      .host-card { display: inline-block; padding: 16px; border: 1px solid #cbd5e1; border-radius: 8px; background: #fff; }
      .host-card .title { margin-bottom: 8px; font-weight: 600; }
      .host-btn { padding: 8px 16px; border: 1px solid #1d4ed8; background: #2563eb; color: #fff; border-radius: 6px; font-size: 14px; }
    `
    // host CSS 먼저, scoped preflight 나중 → tie 는 AFDS 가 가져감(실제 import 순서 모사)
    const css = madCss + SCOPED_PREFLIGHT
    const hostComponent = `<div class="host-card"><div class="title">host 카드</div><button class="host-btn">host 버튼</button></div>`
    return (
      <IsolationFrame
        height={200}
        css={css}
        body={`<div class="lab">
          <section><div class="tag bad">❌ .afds 안에 중첩 — AFDS preflight 에 오염돼 깨짐</div><div class="afds">${hostComponent}</div></section>
          <section><div class="tag good">✅ .afds 밖(형제) — host 스타일 유지</div>${hostComponent}</section>
        </div>`}
      />
    )
  },
}

/**
 * 모달·팝오버처럼 "떠 있는 UI"도 `.afds` 안에 머뭅니다 (라이브 예제).
 *
 * 보통 이런 오버레이는 화면 맨 끝(`document.body`)으로 빠져나가 AFDS 스타일을 잃습니다. `<AfdsScope>` 안에서
 * 열면 `.afds` 안의 포털 자리로 렌더돼 스타일이 유지됩니다. (개발자도구로 보면 `.afds` 하위에 있습니다.)
 */
export const Overlay_PortalContainment: Story = {
  args: { children: null },
  render: function PortalContainmentDemo() {
    const [modalOpen, setModalOpen] = React.useState(false)
    return (
      <AfdsScope>
        <div
          className="bg-afds-bg-surface text-afds-text-primary rounded-afds-md border border-afds-border-default"
          style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: 16, maxWidth: 480 }}
        >
          <strong>.afds scope</strong>
          <p className="text-afds-text-secondary" style={{ margin: 0 }}>
            이 영역 안에서 연 오버레이는 <code>[data-afds-portal]</code> 하위로 포털되어 스코프
            스타일을 유지합니다.
          </p>
          <div style={{ display: 'flex', gap: 8 }}>
            <Button onClick={() => setModalOpen(true)}>모달 열기</Button>
            <Popover.Root>
              <Popover.Trigger render={<Button>팝오버 열기</Button>} />
              <Popover.Content>
                <div style={{ padding: 8 }}>스코프 안 팝오버</div>
              </Popover.Content>
            </Popover.Root>
          </div>

          <Modal.Root open={modalOpen} onOpenChange={setModalOpen} size="md">
            <Modal.Portal>
              <Modal.Overlay />
              <Modal.Content>
                <Modal.Header>
                  <Modal.Title>스코프 안 모달</Modal.Title>
                </Modal.Header>
                <Modal.Body>이 모달은 .afds 안의 포털 타깃에 렌더됩니다.</Modal.Body>
                <Modal.Footer>
                  <Modal.Close render={<Button>닫기</Button>} />
                </Modal.Footer>
              </Modal.Content>
            </Modal.Portal>
          </Modal.Root>
        </div>
      </AfdsScope>
    )
  },
}
