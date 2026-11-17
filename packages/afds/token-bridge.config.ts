import { defineConfig } from 'figma-token-bridge'

export default defineConfig({
  namespace: 'afds',

  tiers: {
    primitive: {
      source: 'tokens/json/primitive.tokens.json',
      output: 'tokens/tokens.css',
      tailwind: true,
    },
    semantic: {
      source: 'tokens/json/semantic.tokens.json',
      output: 'tokens/tokens.semantic.css',
      tailwind: true,
    },
    custom: {
      source: 'tokens/json/custom.tokens.json',
      output: 'tokens/tokens.custom.css',
      tailwind: true,
    },
    effects: {
      source: 'tokens/json/effects.tokens.json',
      output: 'tokens/tokens.effects.css',
      tailwind: true,
    },
  },

  typescript: {
    zodOutput: 'src/schemas/tokens.schema.ts',
  },
})
