/**
 * 레지스트리·설정 스키마.
 *
 * 필드 이름은 가능한 한 shadcn registry-item 관례에 맞춘다 — 장기 방향이
 * shadcn 레지스트리 프로토콜 이행이므로, 지금 만드는 필드가 그때 그대로 옮겨가야 한다.
 * - `dependencies`: npm 의존성. shadcn 과 같이 `name@range` 표기를 허용한다.
 * - `meta`: shadcn 이 정의한 자유 형식 메타 슬롯. 표준에 없는 필드는 여기 둔다.
 * - `compositionDeps`: shadcn 의 `registryDependencies` 에 대응한다. 이번 변경에서는
 *   개명하지 않았다(별건). 이행 시 이름만 바꾸면 된다.
 */

export interface ComponentMeta {
  /**
   * **레지스트리를 생성한 시점의 AFDS 버전.** 컴포지션이 작성된 버전이 아니다.
   *
   * 예전 이름은 `afdsVersion` 이었고 주석은 "이 컴포지션이 작성된 기준 AFDS 버전" 이라고
   * 적혀 있었는데 코드는 생성 시점의 `afds.version` 을 23개 전부에 같은 값으로 박고 있었다.
   * 실측으로 확인했다 — 컴포지션 소스를 그대로 둔 채 AFDS 버전만 바꾸니 23개가 전부 따라
   * 바뀌었다. 이름이 약속하는 것과 값이 달랐던 것이므로 **값이 아니라 이름을 고쳤다.**
   * 작성/승인 기준 버전은 `Component.approvedAtAfdsVersion` 이 담는다.
   */
  registryAfdsVersion: string
  /** 컴포지션 디렉터리 기준 상대경로의 스펙 문서 목록. */
  specFiles: string[]
}

export interface Component {
  name: string
  /**
   * 한 줄 설명. `*.spec.md` 의 인용 블록에서 **기계 도출**한다(손으로 쓰지 않는다).
   * 필드명은 shadcn registry-item 의 `description` 을 그대로 쓴다.
   */
  description: string
  /** `@turbo-project/afds` 는 bare, 서드파티는 `name@range`. */
  dependencies: string[]
  /** 정본 spec frontmatter 에서 도출 — `[domain, category]`. */
  categories: string[]
  dirName?: string
  compositionDeps?: string[]
  meta?: ComponentMeta
}

export interface Registry {
  name: string
  version: string
  /** 레지스트리를 생성한 시점의 AFDS 버전. */
  afdsVersion?: string
  components: Component[]
}
