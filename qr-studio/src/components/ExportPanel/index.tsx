import { useEffect, useRef, useState } from 'react';
import { Check, Copy, Download, History } from 'lucide-react';
import type { QRState } from '@/types/qr';
import { exportSvgString, type Analysis } from '@/qr/pipeline';
import { downloadSvg, svgSupported, svgUnsupportedReason } from '@/qr/exportSvg';
import { copyText, downloadBlob, svgToPngBlob } from '@/utils/exportPng';

interface Props {
  state: QRState;
  analysis: Analysis;
  onSave: () => void;
}

export default function ExportPanel({ state, analysis, onSave }: Props) {
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);
  const timer = useRef<number>();
  useEffect(() => () => window.clearTimeout(timer.current), []);

  const ready = !!analysis.matrix && !!analysis.svg;
  const svgOk = svgSupported(state.presetId);
  const name = `qr-${state.type}`;
  const say = (msg: string) => {
    setStatus(msg);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setStatus(''), 2600);
  };

  const png = async () => {
    if (!analysis.matrix) return;
    setBusy(true);
    try {
      downloadBlob(await svgToPngBlob(exportSvgString(state, analysis.matrix), state.size), `${name}.png`);
      onSave();
      say('PNG downloaded.');
    } catch (e) {
      say(e instanceof Error ? e.message : 'PNG export failed.');
    } finally {
      setBusy(false);
    }
  };
  const svg = () => {
    if (!analysis.matrix) return;
    downloadSvg(exportSvgString(state, analysis.matrix), `${name}.svg`);
    onSave();
    say('SVG downloaded.');
  };
  const copy = async () => {
    const ok = await copyText(analysis.payload);
    if (ok) onSave();
    say(ok ? 'Payload copied.' : 'Copy failed. Select the text and copy it manually.');
  };

  return (
    <section aria-labelledby="exp-h" className="rounded-lg border border-border bg-surface p-5">
      <h2 id="exp-h" className="font-display text-xl">Export</h2>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <button type="button" className="btn btn-solid" disabled={!ready || busy} onClick={png}>
          <Download className="h-4 w-4" aria-hidden="true" />
          PNG
        </button>
        <button type="button" className="btn" disabled={!ready || !svgOk} onClick={svg} aria-describedby={svgOk ? undefined : 'svg-why'}>
          <Download className="h-4 w-4" aria-hidden="true" />
          SVG
        </button>
        <button type="button" className="btn" disabled={!ready} onClick={copy}>
          {status === 'Payload copied.' ? <Check className="h-4 w-4" aria-hidden="true" /> : <Copy className="h-4 w-4" aria-hidden="true" />}
          Copy payload
        </button>
        <button type="button" className="btn" disabled={!ready} onClick={() => { onSave(); say('Saved to recent codes.'); }}>
          <History className="h-4 w-4" aria-hidden="true" />
          Save
        </button>
      </div>
      {!svgOk && <p id="svg-why" className="mt-3 text-sm text-ink-secondary">{svgUnsupportedReason(state.presetId)}</p>}
      <p className="mt-3 min-h-5 text-sm text-ink-secondary" role="status" aria-live="polite">
        {status || (ready ? `PNG exports at ${state.size} × ${state.size} px.` : '')}
      </p>
    </section>
  );
}
