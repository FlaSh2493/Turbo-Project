# Figma Variables Exporter — Architecture

## Overview

This Figma plugin extracts design variables (colors, spacing, typography, etc.) from a Figma file and exports them as [Design Token Community Group (DTCG)](https://tr.designtokens.org/format/) compliant JSON.

## Component Diagram

```
┌─────────────────────────────────────────────────────┐
│                   Figma Editor                      │
│                                                     │
│  ┌──────────────┐        ┌──────────────────────┐   │
│  │  Plugin UI   │◄──────►│  Plugin Sandbox      │   │
│  │  (React/Vite)│  msg   │  (main.ts / esbuild) │   │
│  └──────────────┘        └──────────┬───────────┘   │
│                                     │               │
│                          figma.variables API        │
│                                     │               │
│                          ┌──────────▼───────────┐   │
│                          │  Figma Variables DB  │   │
│                          └──────────────────────┘   │
└─────────────────────────────────────────────────────┘

Plugin Sandbox
  └── collectVariables()     — reads all local variable collections
  └── transformer.ts         — converts Figma types → DTCG tokens
  └── postMessage(tokens)    — sends result to UI

UI (React)
  └── ExportTab             — trigger export, preview token tree
  └── HelpTab               — usage instructions
  └── downloadJson()        — saves tokens.json to disk
```

## Build Pipeline

| Target                                 | Tool         | Config                 |
| -------------------------------------- | ------------ | ---------------------- |
| Plugin sandbox (`dist/plugin/main.js`) | esbuild      | `tsconfig.plugin.json` |
| UI (`dist/ui/index.html`)              | Vite + React | `vite.config.ts`       |

## Data Flow

1. User clicks "Export" in the UI.
2. UI sends `{ type: 'EXPORT' }` message to the plugin sandbox.
3. Plugin sandbox calls `figma.variables.getLocalVariableCollections()`.
4. Each variable is transformed to a DTCG token via `transformer.ts`.
5. Plugin sandbox sends `{ type: 'TOKENS', data: <dtcg> }` back to UI.
6. UI renders a preview and offers a JSON download.
