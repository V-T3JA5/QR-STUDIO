import { useQR } from '@/hooks/useQR'
import { useRecentQR } from '@/hooks/useRecentQR'
import { useTheme } from '@/hooks/useTheme'
import { Header } from '@/components/Header/Header'
import { QRTypeSelector } from '@/components/QRTypeSelector/QRTypeSelector'
import { ContentForm, defaultContentFor } from '@/components/ContentForm/ContentForm'
import { StyleSelector } from '@/components/StyleSelector/StyleSelector'
import { CustomizationPanel } from '@/components/CustomizationPanel/CustomizationPanel'
import { LogoUploader } from '@/components/LogoUploader/LogoUploader'
import { QRPreview } from '@/components/QRPreview/QRPreview'
import { ReliabilityScore } from '@/components/ReliabilityScore/ReliabilityScore'
import { ExportPanel } from '@/components/ExportPanel/ExportPanel'
import { RecentQR } from '@/components/RecentQR/RecentQR'

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <h3 className="text-sm font-semibold mb-3 text-neutral-700 dark:text-neutral-200">{children}</h3>
}

export default function App() {
  const qr = useQR()
  const { recents, save, remove } = useRecentQR()
  const { theme, setTheme } = useTheme()

  return (
    <div className="min-h-screen px-4 py-6 md:px-8 md:py-8 max-w-6xl mx-auto">
      <Header theme={theme} onThemeChange={setTheme} />

      <div className="grid md:grid-cols-2 gap-6">
        {/* ── EDITOR ── */}
        <div className="panel p-5 space-y-6">
          <div>
            <SectionLabel>Content</SectionLabel>
            <QRTypeSelector
              active={qr.content.type}
              onChange={(type) => qr.setContent(defaultContentFor(type))}
            />
            <div className="mt-4">
              <ContentForm content={qr.content} validation={qr.validation} onChange={qr.setContent} />
            </div>
          </div>

          <div>
            <SectionLabel>Style</SectionLabel>
            <StyleSelector activeId={qr.presetId} onSelect={qr.applyPreset} />
          </div>

          <div>
            <SectionLabel>Customize</SectionLabel>
            <CustomizationPanel
              presetId={qr.presetId}
              size={qr.size}
              onSizeChange={qr.setSize}
              foreground={qr.foreground}
              onForegroundChange={qr.setForeground}
              background={qr.background}
              onBackgroundChange={qr.setBackground}
              errorCorrection={qr.errorCorrection}
              onErrorCorrectionChange={qr.setErrorCorrection}
              errorCorrectionLocked={qr.logo.mode !== 'none'}
              margin={qr.margin}
              onMarginChange={qr.setMargin}
              presetParams={qr.presetParams}
              onPresetParamsChange={qr.setPresetParams}
            />
          </div>

          <div>
            <SectionLabel>Logo</SectionLabel>
            <LogoUploader logo={qr.logo} onChange={qr.setLogo} />
          </div>
        </div>

        {/* ── PREVIEW ── */}
        <div className="space-y-4">
          <QRPreview canvas={qr.canvas} isValid={qr.validation.valid} />
          <ReliabilityScore report={qr.reliability} />
          <ExportPanel
            canvas={qr.canvas}
            renderConfig={qr.renderConfig}
            payload={qr.payload}
            onSaveToRecents={() => save(qr.toDesign())}
          />
        </div>
      </div>

      {/* ── RECENT ── */}
      <div className="mt-8">
        <SectionLabel>Recent QR codes</SectionLabel>
        <RecentQR recents={recents} onReuse={qr.loadDesign} onDelete={remove} />
      </div>
    </div>
  )
}
