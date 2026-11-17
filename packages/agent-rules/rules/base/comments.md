---
paths:
  - 'src/**'
---

# 주석 규칙

## [COMMENT-INSTEAD] 주석 대신 코드로 보인다

- 주석으로 설명하고 싶어지면 이름을 고치거나, 함수로 뽑거나, 테스트로 보여준다.
- 변경의 배경은 커밋 본문, 설계 판단은 PR 본문이나 플랜에 쓴다.
- 주석 처리한 코드를 남기지 않는다.
- 기존 주석은 리팩터링 중에 손대지 않는다. 내용이 틀려졌을 때만 고치거나 지운다.

## [COMMENT-DIRECTIVE] 지시자 주석

- 기능성 지시자(`prettier-ignore`, `/// <reference />`, `@vitest-environment`, 커버리지 ignore)는 그냥 쓴다.
- `eslint-disable-next-line <규칙>`과 `@ts-expect-error`는 외부 라이브러리 타입 결함처럼 레포에서 고칠 수 없을 때만 한 줄 범위로 쓴다. `@ts-expect-error`는 같은 줄에 이유를 적는다.
- 파일 전체 `eslint-disable`, `@ts-ignore`, `react-hooks/exhaustive-deps` 끄기는 하지 않는다.

## [COMMENT-APPROVAL] 설명 주석은 승인받은 뒤에만

- 지우면 다음 사람이 반드시 코드를 깨뜨릴 숨은 제약(외부 시스템의 순서 제약, 특정 버그 우회)일 때만 쓴다. "비자명해서"는 사유가 아니다.
- 사용자에게 `<파일:라인> '<넣을 문장>'`을 보여주고 승인받은 뒤, 지우면 무엇이 깨지는지를 한두 줄로 쓴다.
- 서브에이전트에 위임할 때도 이 규칙을 프롬프트에 넣는다.
