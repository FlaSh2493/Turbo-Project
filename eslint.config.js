import { defineConfig } from 'eslint/config'
import { tsLintConfig } from '@turbo-project/eslint-config'

export default defineConfig([...tsLintConfig])
