import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    // src/compositions 는 afds-registry 로 이전된 AFDS 컴포지션 — React 컴포넌트라 jsdom 이
    // 필요하다. jsdom 은 Node API 위에 DOM 전역만 얹으므로 기존 CLI/레지스트리 테스트
    // (순수 Node 로직)도 그대로 통과한다 — 패키지 전체를 이 환경 하나로 통일한다.
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
  },
})
