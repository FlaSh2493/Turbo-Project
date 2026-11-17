---
paths:
  - 'src/app/**'
  - 'src/proxy.ts'
  - 'src/middleware.ts'
---

# Next.js App Router

## [NEXT-RENDER] 렌더링

- 요청마다 다른 데이터를 서버에서 읽는 page가 빌드 때 정적으로 굳지 않았는지 `build` 출력에서 그 route가 `ƒ`인지로 확인한다.
- `ƒ`는 route를 요청마다 렌더링한다는 뜻이지 데이터 캐시가 꺼졌다는 뜻은 아니다. 요청마다 최신이어야 하는 데이터는 그 요청의 캐시 설정(`fetch`의 `cache` 등)도 본다.

## [NEXT-BOUNDARY] 서버와 클라이언트 경계

- `page.tsx`와 `layout.tsx`는 Server Component로 두고, 상호작용 부분만 하위 Client Component로 뗀다.
- `'use client'` 파일이 import하는 모듈은 모두 클라이언트 번들에 들어간다. 서버 컴포넌트는 `children`으로 넘겨 끼운다.

## [NEXT-SERVER-ONLY] 서버 전용 모듈

- 서버에서만 도는 모듈에는 `import 'server-only'`를 건다.
- 서버 전용 모듈은 클라이언트가 import하는 배럴에 올리지 않는다.

## [NEXT-PROXY] proxy와 page의 역할

- 인증·권한에 따른 redirect는 proxy(Next.js 15 이하는 `middleware.ts`)에서, 페이지 데이터에 따른 분기는 page나 layout에서 한다.
- proxy 인증은 첫 거름망일 뿐이다. Route Handler와 Server Function, 그리고 Server Component가 데이터를 직접 읽는 곳에서도 세션과 리소스별 권한을 다시 확인한다.
