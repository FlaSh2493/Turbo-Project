---
when: '서버 데이터, 쿼리·뮤테이션 훅, fetcher를 다룰 때'
paths:
  - 'src/**'
---

# 서버 데이터와 에러 처리

## [DATA-HOOK] 컴포넌트는 도메인 훅만 부른다

- 컴포넌트나 effect 안에서 `fetch`나 요청 함수를 직접 부르지 않는다.
- 쿼리 키는 도메인의 키 팩토리로 만든다.
- mutation 뒤에는 관련 쿼리 키를 invalidate한다.

## [DATA-PREFETCH] 서버 prefetch

- 서버 prefetch 키와 클라이언트 훅 키는 같아야 한다. 다르면 hydrate되지 않고 다시 요청한다.
- 서버에서는 QueryClient를 요청마다 만든다. 모듈 싱글턴은 요청 사이에 데이터가 샌다.
- prefetch 실패로 page를 에러로 만들지 않는다. `fetchQuery`·`ensureQueryData`는 던지니 catch해서 비워 둔다. 다만 `redirect()`·`notFound()`는 Next.js가 예외로 흐름을 바꾸는 것이라, catch 안에서 `unstable_rethrow(error)`(`next/navigation`)로 다시 던진다.
- prefetch한 쿼리의 훅은 `staleTime`을 0보다 크게 준다. 0이면 hydrate 직후 한 번 더 요청한다.

## [DATA-ERROR-TEXT] 화면에 보이는 에러 문구

- 화면 에러 문구는 프론트가 쓴 문구와, API 계약이 사용자 노출용으로 명시한 필드에서만 가져온다.
- catch한 `Error.message`, HTTP 에러의 `message`·`statusText`는 화면에 넣지 않는다.

## [DATA-ERROR-SPLIT] 읽기 에러와 쓰기 에러를 나눈다

- 읽기 에러는 공통 장치(에러 바운더리 등)에 맡기고, 쓰기 에러는 호출한 곳에서 토스트나 필드 에러로 보여준다.
