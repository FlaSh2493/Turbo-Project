// react-doctor 설정. 문서: https://react.doctor/docs/configuration/config-files
// 이 파일은 tsconfig include 밖이다 — react-doctor 자체 로더가 읽는다.
export default {
  // 사내 코드 프라이버시 — score API·공유 URL·크래시 리포트 차단.
  noScore: true,
  // Socket.dev 공급망 스캔 비활성. pnpm 하드닝은 별건이다.
  supplyChain: { enabled: false },
  ignore: {
    // 빌드 산출물과 테스트. `__test__`(단수)는 afds 의 규약이다.
    files: [
      '**/dist/**',
      '**/build/**',
      '**/storybook-static/**',
      '**/__test__/**',
      '**/__tests__/**',
      '**/*.test.*',
      '**/*.spec.*',
    ],
  },
  // 규칙 억제를 미리 넣지 않는다 — 무엇이 오탐인지 아직 재지 않았다.
  // 첫 실행 결과를 보고 건별 근거와 함께 추가한다.
}
