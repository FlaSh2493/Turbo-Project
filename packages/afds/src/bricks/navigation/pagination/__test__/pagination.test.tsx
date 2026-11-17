import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Pagination } from '../pagination'

function renderBasic(props: {
  currentPage: number
  totalPages: number
  onPageChange: (n: number) => void
  pageRange?: number
}) {
  return render(
    <Pagination.Root {...props}>
      <Pagination.PrevTrigger />
      <Pagination.List>
        <Pagination.Items
          render={item =>
            item.type === 'page' ? (
              <Pagination.Item key={item.value} value={item.value} />
            ) : (
              <Pagination.Ellipsis key={`e-${item.index}`} />
            )
          }
        />
      </Pagination.List>
      <Pagination.NextTrigger />
    </Pagination.Root>,
  )
}

describe('Pagination', () => {
  const onPageChange = vi.fn()

  beforeEach(() => {
    onPageChange.mockClear()
  })

  it('renders sequential page numbers', () => {
    renderBasic({ currentPage: 1, totalPages: 10, onPageChange })
    expect(screen.getByLabelText('Page 1')).toBeInTheDocument()
    expect(screen.getByLabelText('Page 2')).toBeInTheDocument()
    expect(screen.getByLabelText('Page 3')).toBeInTheDocument()
  })

  it('marks current page as active', () => {
    renderBasic({ currentPage: 2, totalPages: 10, onPageChange })
    expect(screen.getByLabelText('Page 2')).toHaveAttribute('aria-current', 'page')
  })

  it('calls onPageChange when clicking a page number', async () => {
    const user = userEvent.setup()
    renderBasic({ currentPage: 1, totalPages: 10, onPageChange })
    await user.click(screen.getByLabelText('Page 3'))
    expect(onPageChange).toHaveBeenCalledWith(3)
  })

  it('disables previous button on first page', () => {
    renderBasic({ currentPage: 1, totalPages: 10, onPageChange })
    expect(screen.getByLabelText('Previous page')).toBeDisabled()
  })

  it('disables next button on last page', () => {
    renderBasic({ currentPage: 10, totalPages: 10, onPageChange })
    expect(screen.getByLabelText('Next page')).toBeDisabled()
  })

  it('navigates to next page when clicking next button', async () => {
    const user = userEvent.setup()
    renderBasic({ currentPage: 5, totalPages: 10, onPageChange })
    await user.click(screen.getByLabelText('Next page'))
    expect(onPageChange).toHaveBeenCalledWith(6)
  })

  it('navigates to previous page when clicking previous button', async () => {
    const user = userEvent.setup()
    renderBasic({ currentPage: 5, totalPages: 10, onPageChange })
    await user.click(screen.getByLabelText('Previous page'))
    expect(onPageChange).toHaveBeenCalledWith(4)
  })

  it('shows ellipsis when total pages exceed range', () => {
    renderBasic({ currentPage: 1, totalPages: 20, onPageChange })
    expect(screen.getAllByText('···').length).toBeGreaterThan(0)
  })

  it('respects custom pageRange prop', () => {
    renderBasic({ currentPage: 5, totalPages: 20, onPageChange, pageRange: 7 })
    expect(screen.getByLabelText('Page 2')).toBeInTheDocument()
    expect(screen.getByLabelText('Page 8')).toBeInTheDocument()
  })

  it('throws when a part is rendered outside Root', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    try {
      expect(() => render(<Pagination.Item value={1} />)).toThrow(
        /Pagination\.Item.*Pagination\.Root/,
      )
    } finally {
      spy.mockRestore()
    }
  })
})
