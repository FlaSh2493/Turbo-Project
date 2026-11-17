import { useState } from 'react'
import ExportTab from './tabs/ExportTab'
import ImportTab from './tabs/ImportTab'
import HelpTab from './tabs/HelpTab'

type Tab = 'export' | 'import' | 'help'

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('export')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '560px' }}>
      {/* Tab bar */}
      <div
        style={{
          display: 'flex',
          borderBottom: '1px solid var(--figma-color-border, #e5e5e5)',
          padding: '0 12px',
        }}
      >
        {(['export', 'import', 'help'] as Tab[]).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              background: 'none',
              border: 'none',
              borderBottom:
                activeTab === tab
                  ? '2px solid var(--figma-color-text, #1e1e1e)'
                  : '2px solid transparent',
              padding: '8px 12px',
              cursor: 'pointer',
              fontSize: '11px',
              fontWeight: activeTab === tab ? 600 : 400,
              color: 'var(--figma-color-text, #1e1e1e)',
              textTransform: 'capitalize',
            }}
          >
            {tab === 'export' ? 'Export' : tab === 'import' ? 'Import' : 'Help'}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        {activeTab === 'export' ? (
          <ExportTab />
        ) : activeTab === 'import' ? (
          <ImportTab />
        ) : (
          <HelpTab />
        )}
      </div>
    </div>
  )
}
