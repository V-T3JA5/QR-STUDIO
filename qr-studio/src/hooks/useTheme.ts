import { useCallback, useEffect, useState } from 'react';
import type { ThemeMode } from '@/types/qr';
import { readJSON, writeJSON } from '@/utils/storage';
import { useMediaQuery } from './useMediaQuery';

const KEY = 'qrstudio:theme';

export function useTheme() {
  const [mode, setModeState] = useState<ThemeMode>(() => readJSON<ThemeMode>(KEY, 'system'));
  const systemDark = useMediaQuery('(prefers-color-scheme: dark)');
  const resolved: 'light' | 'dark' = mode === 'system' ? (systemDark ? 'dark' : 'light') : mode;

  useEffect(() => {
    document.documentElement.classList.toggle('dark', resolved === 'dark');
  }, [resolved]);

  const setMode = useCallback((m: ThemeMode) => {
    setModeState(m);
    writeJSON(KEY, m);
  }, []);

  return { mode, setMode, resolved };
}
