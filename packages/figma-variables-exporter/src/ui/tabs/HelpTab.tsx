interface Step {
  number: number
  title: string
  description: string
  code?: string
}

const exportSteps: Step[] = [
  {
    number: 1,
    title: '컬렉션 선택',
    description: 'Export 탭에서 내보낼 Variable Collection을 선택하세요.',
  },
  {
    number: 2,
    title: 'Export 클릭',
    description: '[Export Selected] 버튼을 클릭하면 컬렉션별 JSON 파일이 다운로드됩니다.',
  },
  {
    number: 3,
    title: '토큰 생성',
    description:
      '다운로드된 파일을 packages/afds/tokens/json/ 에 복사한 후 아래 명령어를 실행하세요:',
    code: 'pnpm figma-token-bridge generate',
  },
]

const importSteps: Step[] = [
  {
    number: 1,
    title: 'DTCG JSON 파일 준비',
    description:
      '$value와 $type 필드를 가진 DTCG 형식의 JSON 파일을 준비하세요. 중첩 그룹과 alias 참조({color.primary.500} 형식)를 지원합니다.',
  },
  {
    number: 2,
    title: '파일 선택',
    description:
      'Import 탭에서 JSON 파일을 드래그하거나 클릭해서 선택하세요. 유효한 DTCG 파일이면 토큰 수가 미리보기로 표시됩니다.',
  },
  {
    number: 3,
    title: '옵션 설정',
    description:
      '대상 컬렉션명과 모드명을 입력하세요. 충돌 처리는 덮어쓰기(기존 값 교체) 또는 스킵(기존 값 유지) 중 선택합니다.',
  },
  {
    number: 4,
    title: '버전 히스토리 저장 여부 선택',
    description:
      'Import 버튼 클릭 시 버전 저장 여부를 묻습니다. [저장 후 Import]를 선택하면 Figma 버전 히스토리에 현재 상태가 저장되어 File › Show Version History에서 롤백할 수 있습니다.',
  },
  {
    number: 5,
    title: '결과 확인',
    description:
      '완료 후 추가 / 업데이트 / 스킵된 토큰 수가 표시됩니다. alias 참조 대상이 Figma에 없는 경우 해당 토큰은 스킵됩니다.',
  },
]

function StepList({ steps }: { steps: Step[] }) {
  return (
    <>
      {steps.map(step => (
        <div key={step.number} style={{ display: 'flex', gap: '10px' }}>
          <div
            style={{
              width: '20px',
              height: '20px',
              borderRadius: '50%',
              background: 'var(--figma-color-bg-brand, #18a0fb)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '10px',
              fontWeight: 700,
              flexShrink: 0,
            }}
          >
            {step.number}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div style={{ fontWeight: 600, fontSize: '11px' }}>{step.title}</div>
            <div
              style={{
                color: 'var(--figma-color-text-secondary, #888)',
                lineHeight: '1.5',
                fontSize: '11px',
              }}
            >
              {step.description}
            </div>
            {step.code && (
              <code
                style={{
                  background: 'var(--figma-color-bg-secondary, #f5f5f5)',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  fontSize: '10px',
                  fontFamily: 'monospace',
                }}
              >
                {step.code}
              </code>
            )}
          </div>
        </div>
      ))}
    </>
  )
}

export default function HelpTab() {
  return (
    <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ fontSize: '11px', fontWeight: 600 }}>Export 사용 방법</div>
      <StepList steps={exportSteps} />

      <div
        style={{ borderTop: '1px solid var(--figma-color-border, #e5e5e5)', paddingTop: '12px' }}
      >
        <div style={{ fontSize: '11px', fontWeight: 600, marginBottom: '12px' }}>
          Import 사용 방법
        </div>
        <StepList steps={importSteps} />
      </div>
    </div>
  )
}
