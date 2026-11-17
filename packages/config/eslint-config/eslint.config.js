import { defineConfig } from 'eslint/config'
import globals from 'globals'
import tseslint from 'typescript-eslint'
import unusedImports from 'eslint-plugin-unused-imports'
// import tailwindPlugin from 'eslint-plugin-tailwindcss' // Disabled due to Tailwind v4 incompatibility
import importPlugin from 'eslint-plugin-import'

const agenticSyntaxRule = [
  'warn',
  {
    selector: "JSXAttribute[name.name='style']",
    message: '⚠️ Agentic Rule: Avoid inline styles. Use Tailwind CSS classes or CVA variants.',
  },
  {
    selector: 'Literal[value=/^#[0-9a-fA-F]{3,6}$/]',
    message:
      "⚠️ Agentic Rule: Avoid hardcoded hex colors. Use semantic tokens (e.g., 'bg-background').",
  },
  {
    selector: 'TemplateElement[value.raw=/^#[0-9a-fA-F]{3,6}$/]',
    message: '⚠️ Agentic Rule: Avoid hardcoded hex colors in templates. Use semantic tokens.',
  },
]

/**
 * oxlint 가 못 하는 규칙만 남긴 ESLint 설정 — afds·afds-registry·storybook 용. 나머지 규칙은 각 패키지의
 * `.oxlintrc.json` 이 맡는다(`no-restricted-syntax` 는 oxlint 미구현).
 *
 * 규칙 이름이 들어간 `eslint-disable` 주석이 "정의 없음" 오류를 내지 않도록 플러그인은
 * 그대로 등록해 둔다. 미사용 지시문 보고는 기본 꺼 둔다 — afds 만 래칫 쪽 분담에 맞춰 켠다(afds `eslint.config.js`).
 */
export const tsLintConfig = defineConfig([
  {
    files: ['**/*.{ts,mts,cts,tsx}'],
    extends: [tseslint.configs.base],
    plugins: { 'unused-imports': unusedImports, import: importPlugin },
    languageOptions: { globals: globals.browser },
    linterOptions: { reportUnusedDisableDirectives: 'off' },
    rules: { 'no-restricted-syntax': agenticSyntaxRule },
  },
])
