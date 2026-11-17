import { tsLintConfig } from '@turbo-project/eslint-config'

/**
 * afds-registry 린트 설정.
 *
 * 이 패키지에는 `lint` 스크립트가 없었고, 루트 `lint` 는 `turbo lint` 라 **패키지에 스크립트가
 * 없으면 대상에서 조용히 빠진다.** 그래서 CLI·레지스트리 가드 코드가 한 번도 린트를 받지
 * 않았다 — "검사가 없다" 와 "검사가 통과했다" 가 구분되지 않던 자리다.
 *
 * 규칙은 공유 설정(`@turbo-project/eslint-config`)을 그대로 쓴다. 경고를 0 으로 만들기 위해
 * 규칙을 끄지 않는다 — 위반 수를 드러내는 것이 이 설정의 목적이다.
 *
 * `package.json` 의 `lint` 스크립트는 `--max-warnings 0` 이다(#125/#138 의 래칫).
 *
 * 컴포지션이 afds 에서 이전되며(upstream #143) 그 소스에 있던 기존 토큰 경고 17건
 * (하드코딩 hex·inline style, 스토리의 의도된 예시 포함)이 그대로 딸려 와 한때 이 래칫을
 * 뺀 적이 있다 — afds 처럼 위반을 경고로만 남기는 관용을 적용했었다. 그런데 독립 리뷰
 * (upstream #143, M5)가 그건 **다른 문제를 다른 문제로 덮은 것**이라고 지적했다 — afds
 * 는 애초에 이 래칫을 채택한 적이 없고(139건이 남아 있어 아직 못 채택한다), afds-registry 는
 * #125/#138 로 이미 이 래칫을 세운 패키지였다. 그래서 관용을 넓히는 대신 17건을 실제로
 * 고쳤다(hex → Tailwind 색상 클래스, inline style → className, 미사용 제네릭 → `_` 접두).
 * 규칙 자체는 하나도 끈 적이 없다 — 위반 수를 드러내는 것이 이 설정의 목적이다.
 */
export default [
  ...tsLintConfig,
  {
    ignores: ['dist/**', 'node_modules/**', 'coverage/**'],
  },
]
