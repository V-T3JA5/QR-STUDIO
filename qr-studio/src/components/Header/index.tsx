import { ArrowUp, History, QrCode } from 'lucide-react';
import type { ThemeMode } from '@/types/qr';
import type { Phase } from '@/hooks/useHeroScroll';
import ThemeToggle from '@/components/ThemeToggle';

interface Props {
  phase: Phase;
  introAvailable: boolean;
  recentCount: number;
  theme: ThemeMode;
  onTheme: (m: ThemeMode) => void;
  onRecents: () => void;
  onIntro: () => void;
}

export default function Header({ phase, introAvailable, recentCount, theme, onTheme, onRecents, onIntro }: Props) {
  const inWorkspace = phase === 'workspace';
  return (
    <header
      className={`fixed inset-x-0 top-0 z-40 flex h-14 items-center justify-between px-4 transition-colors duration-300 sm:px-8 ${
        inWorkspace ? 'border-b border-border bg-canvas' : 'border-b border-transparent'
      }`}
    >
      <p className={`flex items-center gap-2 font-display text-lg transition-opacity duration-300 ${inWorkspace ? 'opacity-100' : 'opacity-0'}`} aria-hidden={!inWorkspace}>
        <QrCode className="h-5 w-5" strokeWidth={1.5} aria-hidden="true" />
        QR Studio
      </p>
      <div className="flex items-center gap-2">
        {introAvailable && inWorkspace && (
          <button type="button" className="btn" onClick={onIntro}>
            <ArrowUp className="h-4 w-4" aria-hidden="true" />
            Intro
          </button>
        )}
        <button type="button" className="btn" onClick={onRecents} aria-label={`Recent codes, ${recentCount} saved`}>
          <History className="h-4 w-4" aria-hidden="true" />
          <span className="hidden sm:inline">Recent</span>
          {recentCount > 0 && <span className="rounded-sm bg-active-fill px-1.5 text-xs text-active-text">{recentCount}</span>}
        </button>
        <ThemeToggle mode={theme} onChange={onTheme} />
      </div>
    </header>
  );
}
