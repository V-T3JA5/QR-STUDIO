import { useCallback, useRef, useState } from 'react';
import { useTheme } from '@/hooks/useTheme';
import { useQR } from '@/hooks/useQR';
import { useRecentQR } from '@/hooks/useRecentQR';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { useHeroScroll } from '@/hooks/useHeroScroll';
import Header from '@/components/Header';
import Hero from '@/components/Hero';
import QRTypeSelector from '@/components/QRTypeSelector';
import ContentForm from '@/components/ContentForm';
import StyleSelector from '@/components/StyleSelector';
import CustomizationPanel from '@/components/CustomizationPanel';
import LogoUploader from '@/components/LogoUploader';
import QRPreview from '@/components/QRPreview';
import ReliabilityScore from '@/components/ReliabilityScore';
import ExportPanel from '@/components/ExportPanel';
import RecentsOverlay from '@/components/RecentsOverlay';
import { Section } from '@/components/ui';
import type { RecentEntry } from '@/types/qr';

export default function App() {
  const theme = useTheme();
  const qr = useQR();
  const recent = useRecentQR();
  const [drawer, setDrawer] = useState(false);

  // The intro is desktop only; below 1024px the workspace loads directly.
  const desktop = useMediaQuery('(min-width: 1024px)');
  const heroRef = useRef<HTMLElement>(null);
  const modelRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const workspaceRef = useRef<HTMLElement>(null);
  const { phase, goForward, goBack } = useHeroScroll({ enabled: desktop, hero: heroRef, model: modelRef, content: contentRef, workspace: workspaceRef });

  const { state, analysis } = qr;
  const save = useCallback(() => {
    if (analysis.valid) recent.add(state);
  }, [analysis.valid, recent, state]);
  const reuse = (e: RecentEntry) => {
    qr.rehydrate(e.state);
    setDrawer(false);
  };

  return (
    <>
      <Header
        phase={phase}
        introAvailable={desktop}
        recentCount={recent.recents.length}
        theme={theme.mode}
        onTheme={theme.setMode}
        onRecents={() => setDrawer(true)}
        onIntro={goBack}
      />

      {desktop && <Hero ref={heroRef} contentRef={contentRef} modelRef={modelRef} active={phase !== 'workspace'} onStart={goForward} />}

      <main ref={workspaceRef} tabIndex={-1} aria-label="QR code workspace" className="fixed inset-0 z-20 overflow-y-auto overscroll-contain bg-canvas pt-14 outline-none">
        <div className="mx-auto max-w-6xl px-5 pb-24 pt-8 sm:px-8 lg:px-10">
          <h2 className="font-display text-3xl font-light sm:text-4xl">Make a code</h2>

          <div className="mt-8 grid grid-cols-1 gap-y-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,24rem)] lg:gap-x-14">
            <section className="space-y-5 lg:col-start-1 lg:row-start-1" aria-label="Content">
              <QRTypeSelector value={state.type} onChange={qr.setType} />
              <ContentForm type={state.type} content={state.content} errors={analysis.errors} onChange={qr.setContent} />
            </section>

            <aside className="space-y-5 lg:sticky lg:top-6 lg:col-start-2 lg:row-span-3 lg:row-start-1 lg:max-h-[calc(100vh-5.5rem)] lg:self-start lg:overflow-y-auto lg:pb-1" aria-label="Preview and export">
              <QRPreview state={state} analysis={analysis} />
              <ReliabilityScore reliability={analysis.reliability} />
              <ExportPanel state={state} analysis={analysis} onSave={save} />
            </aside>

            <div className="lg:col-start-1 lg:row-start-2">
              <Section title="Style" hint="Pick a starting point. Everything is adjustable afterwards.">
                <StyleSelector value={state.presetId} onSelect={qr.selectPreset} />
              </Section>
            </div>

            <div className="space-y-8 lg:col-start-1 lg:row-start-3">
              <CustomizationPanel state={state} onUpdate={qr.update} onParam={qr.setParam} onBrand={qr.setBrand} onApplyBrand={qr.applyBrand} />
              <LogoUploader logo={state.logo} onChange={qr.setLogo} />
            </div>
          </div>
        </div>
      </main>

      <RecentsOverlay
        open={drawer}
        recents={recent.recents}
        onClose={() => setDrawer(false)}
        onReuse={reuse}
        onRemove={recent.remove}
        onClear={recent.clear}
      />
    </>
  );
}
