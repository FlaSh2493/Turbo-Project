interface Props {
  type: 'success' | 'error'
  message: string
}

export default function StatusMessage({ type, message }: Props) {
  return (
    <div
      style={{
        padding: '8px 12px',
        borderRadius: '4px',
        fontSize: '11px',
        background:
          type === 'success'
            ? 'var(--figma-color-bg-success, #dcfce7)'
            : 'var(--figma-color-bg-danger, #fee2e2)',
        color:
          type === 'success'
            ? 'var(--figma-color-text-success, #166534)'
            : 'var(--figma-color-text-danger, #991b1b)',
      }}
    >
      {message}
    </div>
  )
}
