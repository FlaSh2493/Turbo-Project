# Figma Variable → DTCG Token Type Mapping

[Design Token Community Group (DTCG) Format spec](https://tr.designtokens.org/format/)

## Resolved Type Mapping

| Figma `resolvedType` | DTCG `$type` | Notes                               |
| -------------------- | ------------ | ----------------------------------- |
| `COLOR`              | `color`      | Hex string `#rrggbb` or `#rrggbbaa` |
| `FLOAT`              | `number`     | Raw numeric value                   |
| `STRING`             | `string`     | Plain string value                  |
| `BOOLEAN`            | `boolean`    | `true` / `false`                    |

## Variable Value Mapping

| Figma value shape        | DTCG `$value` shape                         |
| ------------------------ | ------------------------------------------- |
| `{ r, g, b, a }` (COLOR) | `"#rrggbbaa"` hex string                    |
| `number` (FLOAT)         | `number`                                    |
| `string` (STRING)        | `string`                                    |
| `boolean` (BOOLEAN)      | `boolean`                                   |
| `VariableAlias { id }`   | `"{collection.group.name}"` alias reference |

## Collection → Group Structure

Figma variable collections map to top-level DTCG groups:

```
Collection: "Primitives"
  Group: "Color"
    Variable: "Red/500"  →  { "$type": "color", "$value": "#ef4444" }

→ DTCG output:
{
  "Primitives": {
    "Color": {
      "Red": {
        "500": { "$type": "color", "$value": "#ef4444" }
      }
    }
  }
}
```

Slash `/` in variable names is treated as a nesting separator.

## Mode Handling

When a collection has multiple modes, the exported JSON includes a top-level `$modes` key:

```json
{
  "$modes": ["light", "dark"],
  "Color": {
    "Background": {
      "$type": "color",
      "$value": { "light": "#ffffff", "dark": "#0a0a0a" }
    }
  }
}
```

Single-mode collections omit the `$modes` key and use plain `$value`.
