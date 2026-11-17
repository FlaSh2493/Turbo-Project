# @turbo-project/figma-variables-exporter

A Figma plugin that exports local design variables as [DTCG](https://tr.designtokens.org/format/)-compliant JSON tokens.

## Installation

### Prerequisites

- [Node.js](https://nodejs.org/) 20+
- [pnpm](https://pnpm.io/) 10+

### Install dependencies

```bash
pnpm install
```

## Local Development

### 1. Build the plugin sandbox

```bash
pnpm dev
```

This watches `src/plugin/main.ts` and rebuilds to `dist/plugin/main.js` on changes.

### 2. Build the UI (separate terminal)

```bash
pnpm --filter @turbo-project/figma-variables-exporter exec vite build --watch
```

### 3. Load plugin in Figma

1. Open Figma Desktop.
2. Go to **Menu → Plugins → Development → Import plugin from manifest…**
3. Select `packages/figma-variables-exporter/manifest.json`.
4. The plugin will appear under **Plugins → Development → Figma Variables Exporter**.

## Build (production)

```bash
pnpm build
```

Outputs:

- `dist/plugin/main.js` — plugin sandbox bundle
- `dist/ui/index.html` — UI bundle

## Testing

```bash
pnpm test
```

## Package Structure

```
figma-variables-exporter/
├── src/
│   ├── plugin/        # Figma plugin sandbox code (no DOM access)
│   │   └── main.ts
│   └── ui/            # React UI (runs in Figma iframe)
│       ├── index.html
│       ├── main.tsx
│       └── App.tsx
├── tests/             # Vitest unit tests
├── scripts/
│   └── build.mjs      # esbuild script for plugin sandbox
├── docs/
│   ├── architecture.md
│   └── dtcg-mapping.md
└── manifest.json
```
