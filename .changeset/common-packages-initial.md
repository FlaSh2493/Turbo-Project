---
'@turbo-project/agent-rules': minor
'@turbo-project/governance': minor
'@turbo-project/mutation': minor
---

공통 패키지 agent-rules·governance·mutation 을 이 레포에 들여온다. 첫 배포다.

- agent-rules: 레포 `AGENTS.md` 에 공통 규칙 블록을 넣고 `.agents/rules/common/` 을 쓴다(`init` · `check`)
- governance: PR 위험 등급(low/medium/high) 판정. CODEOWNERS·PR 템플릿을 처음 한 번 만든다(`init` · `judge` · `criteria`)
- mutation: Stryker 뮤테이션 테스트 공통 설정과 실행 명령(`init` · `run` · `check`)
