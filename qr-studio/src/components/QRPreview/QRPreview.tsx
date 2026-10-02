import { useEffect, useRef } from 'react'
import anime from 'animejs'

interface Props {
  canvas: HTMLCanvasElement | null
  isValid: boolean
}

export function QRPreview({ canvas, isValid }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const prevCanvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container || !canvas) return

    container.innerHTML = ''
    canvas.style.width = '100%'
    canvas.style.height = '100%'
    canvas.style.borderRadius = '16px'
    container.appendChild(canvas)

    // Only animate on genuine visual changes, not the first mount.
    if (prevCanvasRef.current) {
      anime({
        targets: canvas,
        opacity: [0, 1],
        scale: [0.98, 1],
        duration: 220,
        easing: 'easeOutQuad',
      })
    }
    prevCanvasRef.current = canvas
  }, [canvas])

  return (
    <div className="panel p-6 flex flex-col items-center justify-center min-h-[320px]">
      {isValid && canvas ? (
        <div
          ref={containerRef}
          className="w-full max-w-[360px] aspect-square"
          aria-label="QR code preview"
        />
      ) : (
        <div className="text-center text-neutral-400 text-sm max-w-[280px]">
          {isValid ? 'Rendering…' : 'Fill in the required fields to see your QR code.'}
        </div>
      )}
    </div>
  )
}
