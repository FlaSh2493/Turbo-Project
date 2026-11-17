# ModalContainer

> 모달 스토어에 등록된 모달 목록을 `document.body`에 포털로 렌더링하는 전역 컨테이너 컴포넌트

## Rules

1. 앱 루트 레이아웃에 **전역으로 단 1번만** 렌더링한다
2. SSR 환경에서는 `document === undefined` 이면 렌더링하지 않으므로 서버 렌더링 시 안전하다
3. `ModalContainer` 없이 `modal.open()`으로 모달을 열면 화면에 표시되지 않는다

## Examples

```tsx
// app/layout.tsx
import { ModalContainer } from '@turbo-project/afds'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <ModalContainer />
      </body>
    </html>
  )
}
```
