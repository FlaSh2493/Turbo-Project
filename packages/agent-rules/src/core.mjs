import { existsSync, readdirSync, readFileSync } from "node:fs";
import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { parse as parseYaml } from "yaml";

export const PACKAGE_ROOT = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "..",
);
export const RULES_DIR = join(PACKAGE_ROOT, "rules");
export const PACKAGE_NAME = "@turbo-project/agent-rules";
export const VERSION = JSON.parse(
  readFileSync(join(PACKAGE_ROOT, "package.json"), "utf8"),
).version;

export const AGENTS_FILE = "AGENTS.md";
export const RULES_OUT = ".agents/rules";
export const COMMON_OUT = `${RULES_OUT}/common`;
export const CUSTOM_OUT = `${RULES_OUT}/custom`;
export const BEGIN = "<!-- BEGIN:agent-rules -->";
export const END = "<!-- END:agent-rules -->";
export const FILE_NOTE = `<!-- ${PACKAGE_NAME}가 복사한 파일이다. 고치지 않는다. 이 레포에서 바꾸거나 끄려면 AGENTS.md의 ## 예외에 쓴다. -->`;

const BLOCK = new RegExp(`${BEGIN}[\\s\\S]*?${END}`);
const HEADING = /^## (🔒 )?\[([A-Z][A-Z0-9-]*)\] (.+)$/;

export function parseRuleFile(text, source = "") {
  let frontmatter = null;
  let body = text;
  if (body.startsWith("---\n")) {
    const end = body.indexOf("\n---\n", 4);
    if (end < 0) throw new Error(`${source}: frontmatter가 닫히지 않았습니다`);
    frontmatter = body.slice(0, end + 5);
    body = body.slice(end + 5);
  }
  const head = [];
  const sections = [];
  let current = null;
  let inCode = false;
  for (const line of body.split("\n")) {
    if (line.startsWith("```")) inCode = !inCode;
    if (!inCode && line.startsWith("## ")) {
      const match = line.match(HEADING);
      if (!match)
        throw new Error(
          `${source}: 규칙 제목은 "## [ID] 제목" 형식이어야 합니다: ${line}`,
        );
      current = {
        id: match[2],
        locked: Boolean(match[1]),
        title: match[3],
        lines: [line],
      };
      sections.push(current);
    } else if (current) current.lines.push(line);
    else head.push(line);
  }
  return {
    frontmatter,
    head: head.join("\n").trim(),
    sections: sections.map(({ lines, ...rest }) => ({
      ...rest,
      text: lines.join("\n").trim(),
    })),
  };
}

const isBundle = (path) => existsSync(join(path, "AGENTS.md"));

export function listPresets(dir = RULES_DIR, prefix = "") {
  const presets = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const name = prefix ? `${prefix}/${entry.name}` : entry.name;
    const path = join(dir, entry.name);
    if (entry.isDirectory())
      presets.push(...(isBundle(path) ? [name] : listPresets(path, name)));
    else if (prefix && entry.name.endsWith(".md") && !isBundle(dir))
      presets.push(name.slice(0, -3));
  }
  return presets.sort();
}

export function loadPreset(name, rulesDir = RULES_DIR) {
  const dir = join(rulesDir, name);
  const single = `${dir}.md`;
  const read = (path, source) =>
    parseRuleFile(readFileSync(path, "utf8"), source);
  if (existsSync(dir) && isBundle(dir)) {
    const files = readdirSync(dir)
      .filter((file) => file.endsWith(".md") && file !== "AGENTS.md")
      .sort();
    return {
      name,
      agents: read(join(dir, "AGENTS.md"), `${name}/AGENTS.md`),
      files: files.map((file) => ({
        name: basename(file, ".md"),
        ...read(join(dir, file), `${name}/${file}`),
      })),
    };
  }
  if (!existsSync(single)) return null;
  return {
    name,
    agents: null,
    files: [{ name: basename(name), ...read(single, `${name}.md`) }],
  };
}

const readJson = (path) => JSON.parse(readFileSync(path, "utf8"));

export function workspacePatterns(root) {
  const path = join(root, "pnpm-workspace.yaml");
  if (!existsSync(path)) return [];
  const patterns = parseYaml(readFileSync(path, "utf8"))?.packages ?? [];
  return patterns.filter((pattern) => !pattern.startsWith("!"));
}

function workspaceDirs(root) {
  return workspacePatterns(root).flatMap((pattern) => {
    const parent = pattern.replace(/\/\*{1,2}$/, "");
    if (parent === pattern) return [pattern];
    if (!existsSync(join(root, parent))) return [];
    return readdirSync(join(root, parent), { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => `${parent}/${entry.name}`);
  });
}

function dependencyNames(root) {
  const names = new Set();
  for (const dir of [".", ...workspaceDirs(root)]) {
    const path = join(root, dir, "package.json");
    if (!existsSync(path)) continue;
    const pkg = readJson(path);
    for (const field of ["dependencies", "devDependencies", "peerDependencies"])
      for (const name of Object.keys(pkg[field] ?? {})) names.add(name);
  }
  return names;
}

export const STACK_PRESETS = [
  { preset: "frontend/fsd", dependency: "react" },
  { preset: "frontend/data-layer", dependency: "@tanstack/react-query" },
  { preset: "frontend/nextjs", dependency: "next" },
  { preset: "frontend/afds", dependency: "@turbo-project/afds" },
];

export function detectPresets(root) {
  const names = dependencyNames(root);
  return [
    "base",
    ...STACK_PRESETS.filter(({ dependency }) => names.has(dependency)).map(
      ({ preset }) => preset,
    ),
  ];
}

export function pathsFor(frontmatter, root) {
  if (!frontmatter) return "";
  const patterns = workspacePatterns(root);
  if (patterns.length === 0 || existsSync(join(root, "src")))
    return frontmatter;
  return frontmatter.replace(/^(\s*- )'src\/(.*)'$/gm, (_, indent, rest) =>
    patterns.map((pattern) => `${indent}'${pattern}/src/${rest}'`).join("\n"),
  );
}

export const withoutBlock = (text) => text.replace(BLOCK, "");
export const blockOf = (text) => text.match(BLOCK)?.[0] ?? null;

export function readExceptions(agentsText) {
  const lines = withoutBlock(agentsText).split("\n");
  const start = lines.findIndex((line) => /^##\s+예외\s*$/.test(line));
  if (start < 0) return [];
  const entries = [];
  for (const line of lines.slice(start + 1)) {
    if (/^#{1,2}\s/.test(line)) break;
    const match = line.match(/^- \[([A-Z][A-Z0-9-]*)\]\s*(.*)$/);
    if (match) entries.push({ id: match[1], text: match[2] });
  }
  return entries;
}

export function ruleIndex(presets) {
  const index = new Map();
  for (const preset of presets)
    for (const file of [
      ...(preset.agents ? [preset.agents] : []),
      ...preset.files,
    ])
      for (const section of file.sections) index.set(section.id, section);
  return index;
}

const joinBlocks = (...blocks) =>
  blocks.filter((block) => block && block.trim()).join("\n\n");

const PRECEDENCE = `# 지침 우선순위

규칙이 부딪히면 위의 것을 따른다.

1. 이 파일의 \`## 예외\`
2. 레포 규칙: 이 블록 밖의 내용과 \`${CUSTOM_OUT}/\`
3. 공통 규칙: 이 블록과 \`${COMMON_OUT}/\`

🔒가 붙은 공통 규칙은 예외로도 바꾸거나 끄지 않는다. 규칙 제목의 \`[ID]\`로 규칙을 가리킨다.`;

export function generate(root, rulesDir = RULES_DIR) {
  const agentsPath = join(root, AGENTS_FILE);
  const agentsText = existsSync(agentsPath)
    ? readFileSync(agentsPath, "utf8")
    : "";
  const presets = detectPresets(root).map((name) => loadPreset(name, rulesDir));
  const exceptions = readExceptions(agentsText);

  const files = new Map();
  const links = [];
  const common = [];
  for (const preset of presets) {
    if (preset.agents)
      common.push(
        joinBlocks(
          preset.agents.head,
          ...preset.agents.sections.map((s) => s.text),
        ),
      );
    for (const file of preset.files) {
      const path = `${COMMON_OUT}/${file.name}.md`;
      files.set(
        path,
        `${pathsFor(file.frontmatter, root)}${FILE_NOTE}\n\n${joinBlocks(file.head, ...file.sections.map((s) => s.text))}\n`,
      );
      links.push(`- [${file.name}](${path})`);
    }
  }

  const block = [
    BEGIN,
    `<!-- ${PACKAGE_NAME}@${VERSION}가 관리하는 블록이다. 블록 안은 고치지 않는다. agent-rules init이 다시 쓴다. -->`,
    "",
    PRECEDENCE,
    "",
    `# 공통 규칙\n\n${joinBlocks(...common)}`,
    "",
    `공통 규칙 파일:\n\n${links.join("\n")}`,
    "",
    END,
  ]
    .join("\n")
    .replace(/\n{3,}/g, "\n\n");
  return { files, block, presets, exceptions, agentsText };
}

export function insertBlock(text, block) {
  if (blockOf(text)) return text.replace(BLOCK, block);
  const lines = text.split("\n");
  const title = lines.findIndex((line) => /^# /.test(line));
  const at = title < 0 ? 0 : title + 1;
  const rest = lines.slice(at).join("\n").trim();
  const head = lines.slice(0, at).join("\n").trim();
  const repoHeading = /^# 레포 규칙\s*$/m.test(rest) ? "" : "# 레포 규칙";
  return `${joinBlocks(head, block, repoHeading, rest)}\n`;
}

export const markdownIn = (root, dir) =>
  existsSync(join(root, dir))
    ? readdirSync(join(root, dir), { withFileTypes: true })
        .filter((entry) => entry.isFile() && entry.name.endsWith(".md"))
        .map((entry) => `${dir}/${entry.name}`)
    : [];

export function validate(root, generated) {
  if (!generated.agentsText)
    return [`${AGENTS_FILE}가 없습니다. \`pnpm exec agent-rules init\`을 돌리세요.`];
  if (!blockOf(generated.agentsText))
    return [
      `${AGENTS_FILE}에 agent-rules 블록이 없습니다. \`pnpm exec agent-rules init\`을 돌리세요.`,
    ];
  const errors = [];
  const index = ruleIndex(generated.presets);
  for (const { id } of generated.exceptions) {
    const rule = index.get(id);
    if (!rule) errors.push(`${AGENTS_FILE} 예외: "${id}"는 없는 규칙입니다`);
    else if (rule.locked)
      errors.push(
        `${AGENTS_FILE} 예외: "${id}"는 🔒 규칙이라 바꾸거나 끌 수 없습니다`,
      );
  }
  return errors;
}
