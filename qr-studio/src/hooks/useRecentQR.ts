import { useCallback, useState } from 'react';
import type { QRState, RecentEntry } from '@/types/qr';
import { readJSON, writeJSON } from '@/utils/storage';

const KEY = 'qrstudio:recents';
const CAP = 10;

const sig = (s: QRState): string => JSON.stringify(s);

/** Persist, shedding weight if the browser quota is hit: first logo images on older entries, then the oldest entries. */
function persist(list: RecentEntry[]): RecentEntry[] {
  let current = list;
  if (writeJSON(KEY, current)) return current;
  current = current.map((e, i) => (i === 0 ? e : { ...e, state: { ...e.state, logo: { ...e.state.logo, dataUrl: null, mode: 'none' as const } } }));
  while (current.length > 1) {
    if (writeJSON(KEY, current)) return current;
    current = current.slice(0, -1);
  }
  writeJSON(KEY, current);
  return current;
}

export function useRecentQR() {
  const [recents, setRecents] = useState<RecentEntry[]>(() => {
    const stored = readJSON<RecentEntry[]>(KEY, []);
    return Array.isArray(stored) ? stored.slice(0, CAP) : [];
  });

  const add = useCallback((state: QRState) => {
    setRecents((prev) => {
      const s = sig(state);
      const rest = prev.filter((e) => sig(e.state) !== s);
      const entry: RecentEntry = { id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, savedAt: Date.now(), state };
      return persist([entry, ...rest].slice(0, CAP));
    });
  }, []);

  const remove = useCallback((id: string) => {
    setRecents((prev) => persist(prev.filter((e) => e.id !== id)));
  }, []);

  const clear = useCallback(() => {
    writeJSON(KEY, []);
    setRecents([]);
  }, []);

  return { recents, add, remove, clear };
}
