import type { ReactNode } from 'react'

/** like = 포함, unlike = 제외 */
export type ComplexFilterCondition = 'like' | 'unlike'

export interface ComplexFilterOption {
  /** 칩과 콜백에 쓰이는 값(고유해야 한다) */
  value: string
  /** 화면에 보이는 문구 */
  label: string
}

/** 입력한 텍스트로 칩을 만드는 필드 */
export interface ComplexFilterKeywordField {
  type: 'keyword'
  /** 필드 식별자. 칩의 `fieldKey` 가 이것을 가리킨다 */
  key: string
  /** 필드 메뉴·추천 행·칩 문구에 보이는 이름 */
  label: string
  /** 허용 연산자. 첫 항목이 추천 행·Enter 로 칩을 만들 때의 기본값이다 */
  conditions: ComplexFilterCondition[]
  /** false 면 입력 추천 행에서 빼고 이 필드의 칩만 그린다 @default true */
  suggest?: boolean
}

/** 옵션을 골라 칩을 만드는 필드 */
export interface ComplexFilterSelectField {
  type: 'select'
  /** 필드 식별자. 칩의 `fieldKey` 가 이것을 가리킨다 */
  key: string
  /** 필드 메뉴·칩 문구에 보이는 이름 */
  label: string
  /** 고를 수 있는 값 목록(표시 순서) */
  options: ComplexFilterOption[]
  /** false 면 하나만 고르고, 고르는 즉시 적용된다(푸터 없음) @default true */
  multiple?: boolean
}

export type ComplexFilterField = ComplexFilterKeywordField | ComplexFilterSelectField

interface ChipBase {
  /** 칩의 안정적인 식별자. 수정 팝오버가 이것으로 대상을 가리킨다 */
  id: string
  /** false 면 칩의 삭제 버튼과 백스페이스 삭제를 막는다 */
  deletable?: boolean
  /** false 면 칩을 눌러도 수정 팝오버가 열리지 않는다 */
  editable?: boolean
}

export interface ComplexFilterKeywordChip extends ChipBase {
  kind: 'keyword'
  /** 칩이 속한 키워드 필드의 `key` */
  fieldKey: string
  /** 포함(like)·제외(unlike) */
  condition: ComplexFilterCondition
  /** 입력한 텍스트 */
  value: string
}

export interface ComplexFilterSelectChip extends ChipBase {
  kind: 'select'
  /** 칩이 속한 선택 필드의 `key` */
  fieldKey: string
  /** 고른 옵션의 `value` 들 */
  values: string[]
}

/** 생성 순서를 가진 평면 목록의 원소 */
export type ComplexFilterChip = ComplexFilterKeywordChip | ComplexFilterSelectChip

/**
 * 모듈은 선택 UI 만 노출한다. 값의 의미 적용은 소비자 몫이다.
 * 운영센터(DA)와 같은 의미: 「하나라도 만족」은 **같은 필드·같은 연산자 키워드 묶음 내부**만 OR 이고, 서로 다른 필드·
 * 선택 칩과는 늘 AND 다. 제외(unlike)의 OR 은 묶음의 모든 제외 키워드에 걸린 행만 탈락시킨다
 */
export interface ComplexFilterMatchMode {
  /** 현재 고른 결합 방식의 `value` */
  value: string
  /** 고를 수 있는 결합 방식(예: 모든 조건 만족 / 하나라도 만족) */
  options: ComplexFilterOption[]
  /** 결합 방식을 골랐을 때 알린다 */
  onChange: (value: string) => void
  /** 드롭다운 트리거와 목록의 접근성 이름 */
  ariaLabel: string
}

/** 최근 검색 저장소. 모듈은 저장하지 않고 소비자가 주입한다(localStorage 등) */
export interface ComplexFilterRecentSearches {
  /** 최신순 목록. 개수 상한은 소비자 책임이다 */
  items: string[]
  /** 항목을 골라 입력에 채웠을 때 알린다(채우기는 모듈이 한다) */
  onSelect?: (item: string) => void
  /** 목록에서 항목을 지웠을 때 알린다 */
  onRemove: (item: string) => void
  /** 키워드 칩이 만들어질 때 값마다 호출한다 */
  onAdd: (item: string) => void
}

export interface ComplexFilterLabels {
  /** 입력칸 접근성 이름 */
  search: string
  /** 입력칸 플레이스홀더 */
  searchPlaceholder: string
  /** 「지우기」 버튼 문구 */
  clear: string
  /** 칩 삭제 버튼의 접근성 이름. 칩 문구를 받는다 */
  removeChip: (chipText: string) => string
  /** 연산자 문구. 예: 「포함」「제외」 */
  conditions: Record<ComplexFilterCondition, string>
  /** 키워드 칩 수정 팝오버 제목. 예: 「이름에」 */
  keywordTitle: (fieldLabel: string) => string
  /**
   * 키워드 문구 — 「{before} {값} {after}」 로 조합된다. 어순이 언어마다 달라
   * 앞·뒤를 함수로 받는다(ko: 「이름에 값 포함」, en: 「Name contains 값」). 빈 문자열이면 생략한다
   */
  keywordPhrase: {
    before: (fieldLabel: string, conditionLabel: string) => string
    after: (fieldLabel: string, conditionLabel: string) => string
  }
  /** 칩 수정·값 목록 팝업의 문구 */
  editor: {
    /** 취소 버튼 */
    cancel: string
    /** 적용 버튼 */
    apply: string
    /** 값이 비었을 때의 검증 문구 */
    emptyValue: string
    /** 입력 지움 버튼의 접근성 이름 */
    clearValue: string
  }
  /** 드롭다운 목록의 접근성 이름 */
  listbox: string
  /** 최근 검색 서브메뉴 문구 */
  recent: {
    /** 필드 메뉴 첫 항목·서브메뉴 접근성 이름 */
    title: string
    /** 목록이 비었을 때 */
    empty: string
    /** 행 삭제 버튼의 접근성 이름 */
    remove: (item: string) => string
  }
  /** 우측 접기/펼치기 버튼의 접근성 이름 */
  toggle: {
    /** 접힌 상태의 버튼 이름 */
    expand: string
    /** 펼친 상태의 버튼 이름 */
    collapse: string
  }
  /** 접힌 상태에서 칩이 가려졌을 때 표시하는 「…」 의 읽기 전용 설명(스크린리더) */
  hiddenChips: string
}

/** 문구 override — 바꿀 것만 준다. 객체형 문구는 한 단계 부분 병합, 함수형 문구는 통째로 교체한다 */
export type ComplexFilterLabelsOverride = {
  [K in keyof ComplexFilterLabels]?: ComplexFilterLabels[K] extends (...a: never[]) => unknown
    ? ComplexFilterLabels[K]
    : ComplexFilterLabels[K] extends string
      ? string
      : Partial<ComplexFilterLabels[K]>
}

export interface ComplexFilterRootProps {
  /** 키워드 필드는 추천 행으로, 선택 필드는 필드 메뉴로 나온다. 정의 순서가 곧 표시 순서다 */
  fields: ComplexFilterField[]
  /** 생성 순서를 가진 평면 칩 목록(controlled) */
  chips: ComplexFilterChip[]
  /** 생성·수정·삭제·적용 시 새 배열 전체를 알린다 */
  onChange: (chips: ComplexFilterChip[]) => void
  /** 「지우기」. 입력 중인 텍스트는 모듈이 직접 비운다 */
  onClear: () => void
  /** 지정하면 `ComplexFilter.MatchMode` 가 그려진다. 미지정이면 MatchMode 는 아무것도 그리지 않는다 */
  matchMode?: ComplexFilterMatchMode
  /** 지정하면 필드 메뉴 첫 항목에 「최근 검색 ›」 을 둔다. 미지정이면 숨긴다 */
  recentSearches?: ComplexFilterRecentSearches
  /** 접기/펼치기 제어값. 미지정이면 모듈이 상태를 가진다(기본 펼침) */
  expanded?: boolean
  /** 접기/펼치기 요청을 알린다 */
  onToggle?: (expanded: boolean) => void
  /** 칩 수 상한. 미지정=무제한. 넘는 키워드 칩은 만들지 않는다 */
  maxChips?: number
  /** 키워드 한 개의 최대 길이 @default 100 */
  maxLength?: number
  /** true 면 모든 상호작용을 막는다 @default false */
  disabled?: boolean
  /**
   * 팝업을 그릴 포털 대상. 미지정·null 은 AFDS 가 `<AfdsScope>` 컨텍스트 → body 순으로 찾는다.
   * 스코프 바깥에서 얻은 값(null)을 그대로 넘겨도 팝업이 사라지지 않는다
   */
  portalContainer?: HTMLElement | null
  /** 문구 부분 override. 기본은 영문이다 */
  labels?: ComplexFilterLabelsOverride
  /** 바 컨테이너에 병합할 클래스 */
  className?: string
  /** 없으면 기본 배치(`MatchMode` · `Input` · `Actions` + `CollapseToggle`)를 그린다 */
  children?: ReactNode
}

/** 파트가 컨텍스트로 읽는 Root 설정 — 문구가 모두 해소된 형태 */
export type ComplexFilterConfig = Omit<
  ComplexFilterRootProps,
  'labels' | 'children' | 'className'
> & {
  labels: ComplexFilterLabels
}

export interface ComplexFilterMatchModeProps {
  /** 컨테이너에 병합할 클래스 */
  className?: string
}

export interface ComplexFilterInputProps {
  /** 입력 앞에 놓을 칩. `undefined` 면 Root 의 `chips` 를 `ComplexFilter.Chip` 으로 그린다(`null` 은 칩 없음) */
  children?: ReactNode
  /** 컨테이너에 병합할 클래스 */
  className?: string
}

export interface ComplexFilterChipProps {
  /** 그릴 칩. Root 의 `chips` 에 있는 것이어야 하고, 정의에 없는 필드의 칩은 그리지 않는다 */
  chip: ComplexFilterChip
  /** 칩에 병합할 클래스 */
  className?: string
}

export interface ComplexFilterActionsProps {
  /** `undefined` 면 `ComplexFilter.CollapseToggle` 을 그린다 */
  children?: ReactNode
  /** 컨테이너에 병합할 클래스 */
  className?: string
}

export interface ComplexFilterCollapseToggleProps {
  /** 버튼에 병합할 클래스 */
  className?: string
}
