import type { Preview } from '@storybook/react'
import { ModalContainer } from '@turbo-project/afds/bricks'
import '../styles.css'

/**
 * Storybook 브라우저 환경에서 발생하는 서드파티 라이브러리 경고를 억제한다.
 * 아래 두 경고는 우리 코드가 아닌 라이브러리 내부 구현 문제이며, 기능·렌더링에 영향이 없다.
 *
 * 1. act() 관련 경고
 *    - `@storybook/addon-interactions`는 play 함수 실행 시 내부적으로 `act()`를 호출한다.
 *    - `IS_REACT_ACT_ENVIRONMENT` 미설정 시 → "not configured to support act(...)"
 *    - `IS_REACT_ACT_ENVIRONMENT` 설정 시 → base-ui가 act() 밖에서 상태 업데이트하여 "not wrapped in act(...)"
 *    - 브라우저(Storybook)와 jsdom(Jest) 환경의 불일치로 발생하는 구조적 문제다.
 *
 * 2. validateDOMNesting 경고
 *    - Storybook Docs의 `SyntaxHighlighter`가 마크다운 코드블록을 렌더링할 때
 *      MDX 렌더러가 생성한 `<p>` 안에 `<div>`를 출력한다 (HTML spec 위반).
 *    - Storybook 내부 컴포넌트 버그로 외부에서 수정할 수 없다.
 */
const originalError = console.error.bind(console)
console.error = (...args: unknown[]) => {
  if (typeof args[0] === 'string' && args[0].includes('act(')) return
  if (typeof args[0] === 'string' && args[0].includes('validateDOMNesting')) return
  originalError(...args)
}

const preview: Preview = {
  decorators: [
    Story => (
      <>
        <ModalContainer />
        <div className="p-afds-24 font-afds-base">
          <Story />
        </div>
      </>
    ),
  ],
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    options: {
      storySort: {
        order: [
          '소개',
          'Foundation',
          'AFDS',
          [
            'Docs',
            'Headless',
            'Bricks',
            ['Action', 'Display', 'Feedback', 'Form', 'Layout', 'Navigation', 'Overlay'],
            'Primitives',
          ],
          'Compositions',
        ],
      },
    },
    docs: {
      toc: true,
      description: {
        component: 'AI Agent 친화적인 React 디자인 시스템',
      },
    },
  },
  tags: ['autodocs'],
}

export default preview
