export function downloadPng(c: HTMLCanvasElement, name = 'qr-studio.png') {
  const a = document.createElement('a'); a.href = c.toDataURL('image/png'); a.download = name; a.click()
}
export async function copyPng(c: HTMLCanvasElement) {
  const blob = await new Promise<Blob | null>(r => c.toBlob(r, 'image/png'))
  if (!blob) throw new Error('no blob')
  await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])
}
