---
paths:
  - 'src/**/*.tsx'
---

# AFDS (`@turbo-project/afds`)

## [AFDS-NO-GUESS] 추측하지 않고 확인한다

학습 데이터에 없는 라이브러리라 props·variants·슬롯을 기억으로 쓰지 않는다.

1. `node_modules/@turbo-project/afds/dist/llms.txt`에서 컴포넌트와 정확한 이름을 찾는다.
2. 쓰는 컴포넌트마다 `dist/manifest/<name>.json`(헤드리스는 `headless__<group>__<name>.json`)의 `example`을 통째로 가져와 시작한다. 합성형은 `slots`로 파트를 맞춘다.
3. 타입 에러가 나면 manifest가 아니라 `.d.ts`가 기준이다.

## [AFDS-IMPORT] import는 서브패스로만

- 컴포넌트는 `@turbo-project/afds/bricks`, 헤드리스 훅은 `/headless`, 유틸 훅은 `/hooks`, `cn`은 `/lib/utils`에서 가져온다. 루트에서 가져오지 않는다.
- `bricks`는 이미 클라이언트로 빌드돼 있어서 import만으로 내 파일이 클라이언트가 되지 않는다.

## [AFDS-TOKEN] 토큰을 쓴다

- 색·타이포는 semantic 토큰을 먼저, 없으면 primitive를 쓴다. Tailwind 기본 팔레트는 쓰지 않는다. Tailwind 유틸은 레이아웃과 간격에 쓴다.
- 타이포는 `heading0~2`·`title1~4`·`body1~3`·`caption1~2`, 모션은 `--afds-duration-*`을 쓴다.

## [AFDS-REUSE] 있는 것을 쓴다

- afds 프리미티브는 직접 import한다. 감싸는 건 afds에 없는 조합·비즈니스 컴포넌트만 한다.

## [AFDS-VERSION] 버전

- 사용자가 요청할 때만 올린다. 올리면 스타일 로드 위치와 토큰 import가 새 스타일 진입점과 맞는지 본다.
