import { useState, useCallback } from 'react'
import type { QRDesign } from '@/types/qr'
import { loadRecents, addRecent, deleteRecent } from '@/utils/storage'

export function useRecentQR() {
  const [recents, setRecents] = useState<QRDesign[]>(() => loadRecents())

  const save = useCallback((design: QRDesign) => {
    setRecents(addRecent(design))
  }, [])

  const remove = useCallback((id: string) => {
    setRecents(deleteRecent(id))
  }, [])

  return { recents, save, remove }
}
