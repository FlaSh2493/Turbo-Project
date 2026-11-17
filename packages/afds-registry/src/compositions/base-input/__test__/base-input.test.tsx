import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BaseInput } from '../base-input'

describe('BaseInput', () => {
  describe('렌더링', () => {
    it('input 요소를 렌더링한다', () => {
      render(<BaseInput />)
      expect(screen.getByRole('textbox')).toBeInTheDocument()
    })

    it('placeholder가 표시된다', () => {
      render(<BaseInput placeholder="검색어를 입력하세요" />)
      expect(screen.getByPlaceholderText('검색어를 입력하세요')).toBeInTheDocument()
    })

    it('기본 placeholder인 "Placeholder"가 표시된다', () => {
      render(<BaseInput />)
      expect(screen.getByPlaceholderText('Placeholder')).toBeInTheDocument()
    })

    it('defaultValue로 초기값이 설정된다', () => {
      render(<BaseInput defaultValue="초기값" />)
      expect(screen.getByRole('textbox')).toHaveValue('초기값')
    })
  })

  describe('상호작용', () => {
    it('타이핑 시 onChange가 문자열 값으로 호출된다', async () => {
      const user = userEvent.setup()
      const handleChange = vi.fn()
      render(<BaseInput onChange={handleChange} />)

      await user.type(screen.getByRole('textbox'), '안녕')
      expect(handleChange).toHaveBeenCalled()
      // onChange is called with string value
      expect(handleChange).toHaveBeenCalledWith(expect.any(String))
    })

    it('값이 있을 때 clear 버튼이 표시된다', async () => {
      const user = userEvent.setup()
      render(<BaseInput />)

      await user.type(screen.getByRole('textbox'), '텍스트')
      expect(screen.getByRole('button')).toBeInTheDocument()
    })

    it('clear 버튼 클릭 시 값이 초기화된다', async () => {
      const user = userEvent.setup()
      render(<BaseInput defaultValue="지울 텍스트" />)

      const clearButton = screen.getByRole('button')
      await user.click(clearButton)

      expect(screen.getByRole('textbox')).toHaveValue('')
    })

    it('clear 버튼 클릭 시 onClear가 호출된다', async () => {
      const user = userEvent.setup()
      const handleClear = vi.fn()
      render(<BaseInput defaultValue="지울 텍스트" onClear={handleClear} />)

      await user.click(screen.getByRole('button'))
      expect(handleClear).toHaveBeenCalledTimes(1)
    })

    it('clearable=false이면 clear 버튼이 표시되지 않는다', async () => {
      const user = userEvent.setup()
      render(<BaseInput clearable={false} />)

      await user.type(screen.getByRole('textbox'), '텍스트')
      expect(screen.queryByRole('button')).not.toBeInTheDocument()
    })
  })

  describe('Props 변형', () => {
    it('disabled일 때 입력이 불가능하다', () => {
      render(<BaseInput disabled />)
      expect(screen.getByRole('textbox')).toBeDisabled()
    })

    it('disabled일 때 clear 버튼이 표시되지 않는다', () => {
      render(<BaseInput disabled value="텍스트" />)
      expect(screen.queryByRole('button')).not.toBeInTheDocument()
    })

    it('readOnly일 때 입력 필드가 읽기 전용으로 설정된다', () => {
      render(<BaseInput readOnly defaultValue="읽기 전용" />)
      expect(screen.getByRole('textbox')).toHaveAttribute('readonly')
    })

    it('error prop이 전달된다', () => {
      render(<BaseInput error="에러 메시지" />)
      // error message is shown as placeholder
      expect(screen.getByPlaceholderText('에러 메시지')).toBeInTheDocument()
    })

    it('size="sm" prop이 허용된다', () => {
      render(<BaseInput size="sm" />)
      expect(screen.getByRole('textbox')).toBeInTheDocument()
    })

    it('size="md" prop이 허용된다', () => {
      render(<BaseInput size="md" />)
      expect(screen.getByRole('textbox')).toBeInTheDocument()
    })

    it('size="sm" prop이 허용된다', () => {
      render(<BaseInput size="sm" />)
      expect(screen.getByRole('textbox')).toBeInTheDocument()
    })

    it('제어 모드에서 value prop이 반영된다', () => {
      render(<BaseInput value="제어값" onChange={() => {}} />)
      expect(screen.getByRole('textbox')).toHaveValue('제어값')
    })
  })

  describe('접근성', () => {
    it('role="textbox"가 존재한다', () => {
      render(<BaseInput />)
      expect(screen.getByRole('textbox')).toBeInTheDocument()
    })

    it('disabled 상태가 접근성에 반영된다', () => {
      render(<BaseInput disabled />)
      expect(screen.getByRole('textbox')).toBeDisabled()
    })
  })
})
