import { isSelectField } from './chips'
import type { ComplexFilterField, ComplexFilterSelectField } from './types'

export type MenuRow = { type: 'recent' } | { type: 'field'; field: ComplexFilterSelectField }

/** 입력이 비었을 때의 필드 메뉴 행. 최근 검색(지정할 때만)이 맨 앞이고 선택 필드가 정의 순서로 뒤따른다 */
export const buildMenuRows = (fields: ComplexFilterField[], hasRecent: boolean): MenuRow[] => [
  ...(hasRecent ? [{ type: 'recent' } as const] : []),
  ...fields.filter(isSelectField).map(field => ({ type: 'field', field }) as const),
]
