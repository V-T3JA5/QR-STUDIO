import { useRef, useState } from 'react';
import { ImagePlus, Trash2 } from 'lucide-react';
import type { LogoMode, LogoState } from '@/types/qr';
import { Range, Section, Segmented } from '@/components/ui';
import { fileToLogoDataUrl } from '@/utils/image';

export default function LogoUploader({ logo, onChange }: { logo: LogoState; onChange: (p: Partial<LogoState>) => void }) {
  const input = useRef<HTMLInputElement>(null);
  const [error, setError] = useState('');

  const pick = async (file: File | undefined) => {
    if (!file) return;
    setError('');
    try {
      onChange({ dataUrl: await fileToLogoDataUrl(file) });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'That image could not be used.');
    }
  };

  return (
    <Section title="Logo" hint="Independent of the style. Centre replaces the middle modules, Full fade sits faintly behind the whole code.">
      <Segmented<LogoMode>
        label="Logo mode"
        value={logo.mode}
        onChange={(mode) => onChange({ mode })}
        options={[{ value: 'none', label: 'None' }, { value: 'center', label: 'Centre' }, { value: 'fade', label: 'Full fade' }]}
      />
      {logo.mode !== 'none' && (
        <>
          <input ref={input} type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" className="sr-only" tabIndex={-1}
            onChange={(e) => { void pick(e.target.files?.[0]); e.target.value = ''; }} />
          <div className="flex items-center gap-3">
            {logo.dataUrl && (
              <img src={logo.dataUrl} alt="Your logo" className="h-14 w-14 rounded-md border border-border bg-surface object-contain p-1" />
            )}
            <button type="button" className="btn" onClick={() => input.current?.click()}>
              <ImagePlus className="h-4 w-4" aria-hidden="true" />
              {logo.dataUrl ? 'Replace image' : 'Choose image'}
            </button>
            {logo.dataUrl && (
              <button type="button" className="btn" onClick={() => onChange({ dataUrl: null })} aria-label="Remove logo image">
                <Trash2 className="h-4 w-4" aria-hidden="true" />
              </button>
            )}
          </div>
          {error && <p role="alert" className="text-sm font-medium">{error}</p>}
          {!logo.dataUrl && !error && <p className="text-sm text-ink-secondary">PNG, JPEG, WebP or SVG, up to 2 MB.</p>}
          {logo.mode === 'center' ? (
            <Range label="Logo size" value={Math.round(logo.scale * 100)} min={10} max={30} unit="%" onChange={(v) => onChange({ scale: v / 100 })} />
          ) : (
            <Range label="Logo opacity" value={Math.round(logo.opacity * 100)} min={8} max={50} unit="%" onChange={(v) => onChange({ opacity: v / 100 })} />
          )}
        </>
      )}
    </Section>
  );
}
