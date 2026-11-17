import { tsLintConfig } from '@turbo-project/eslint-config'

/**
 * AFDS 디자인 토큰 가드레일
 *
 * 목적: Tailwind 기본 유틸 하드코딩 · style prop 토큰 우회 · 템플릿 리터럴 토큰 조합 방지
 * 위반 시 warn 레벨 경고 — 코드 리뷰에서 확인
 * 상세 규칙: .claude/rules/afds-component-tokens.md
 */
const afdsSchemaGuardrails = {
  files: ['src/schemas/compositions/**/*.{ts,tsx}'],
  rules: {
    'no-restricted-syntax': [
      'error',
      {
        selector: 'Program',
        message:
          '🚫 Architecture Violation: src/schemas/compositions/ 에 스키마를 생성할 수 없습니다. Compositions는 자체 디렉토리(src/compositions/) 안에서 인라인 타입으로 관리합니다.',
      },
    ],
  },
}

const afdsTokenGuardrails = {
  // 죽은 `src/primitives/**` 글롭 제거(G4) — 실재 디렉토리는 `src/bricks/**`.
  files: ['src/bricks/**/*.{ts,tsx}'],
  rules: {
    'no-restricted-syntax': [
      // 기존 위반 5건(src/bricks)이 남아 있어 warn 유지 — 신규 유입만 차단.
      // P1-5 토큰 위반 스윕(#1098) 완료 후 error로 승격한다.
      'warn',
      // ❌ 동적 토큰에 템플릿 리터럴 직접 조합 — `text-afds-${x}`, `p-afds-${x}` 패턴
      // `> Identifier`만 잡으면 `${tokens[size]}`(MemberExpression)·`${getToken(x)}`(CallExpression)이
      // 빠져나간다. 단 `:not(TemplateElement)`로 전부 잡으면 완성된 클래스를 내보내는
      // 삼항(`${on ? 'bg-afds-bg-selected' : 'bg-afds-bg-surface'}`)까지 오탐하므로,
      // **조각 조립이 되는 노드 타입만** 열거한다.
      {
        selector:
          'TemplateLiteral:has(TemplateElement[value.raw=/afds-/]) > :matches(Identifier, MemberExpression, CallExpression)',
        message:
          '[AFDS] 동적 토큰은 CVA variants/compoundVariants의 완성된 클래스로 매핑하세요. 템플릿 리터럴 직접 조합(`text-afds-${x}`)은 Tailwind JIT가 스캔하지 못해 금지됩니다.',
      },
      // ❌ style prop에 color/background/padding/margin/borderRadius 값 직접 지정
      {
        selector:
          'JSXAttribute[name.name="style"] > JSXExpressionContainer > ObjectExpression > Property[key.name=/^(color|background|backgroundColor|padding|paddingTop|paddingRight|paddingBottom|paddingLeft|margin|marginTop|marginRight|marginBottom|marginLeft|borderRadius|gap|fontSize|lineHeight|fontWeight|fontFamily)$/]',
        message:
          '[AFDS] style prop에 색상·간격·타이포그래피 값 사용 금지. Tailwind 클래스(afds 토큰)로 대체하세요. 예외: width/height/maxHeight 등 JS 계산이 필요한 레이아웃 값만 style 허용.',
      },
    ],
  },
}

export default [
  ...tsLintConfig,
  // 미사용 지시문은 `no-restricted-syntax` 몫만 ESLint 가 보고한다 — 나머지는 `scripts/lint-ratchet.ts` 가 걸러낸다.
  { linterOptions: { reportUnusedDisableDirectives: 'warn' } },
  afdsSchemaGuardrails,
  afdsTokenGuardrails,
  {
    ignores: ['dist/**', 'node_modules/**', 'coverage/**', 'tokens/*.css', 'docs/**/*.md'],
  },
]
