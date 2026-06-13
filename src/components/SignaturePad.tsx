import { useRef, useState, useEffect, useCallback } from 'react'
import { Eraser, Type, PenLine } from 'lucide-react'
import { Button } from './ui/Button'

type Mode = 'draw' | 'type'

interface SignaturePadProps {
  onSignature: (dataUrl: string) => void
  defaultName?: string
}

export function SignaturePad({ onSignature, defaultName = '' }: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [mode, setMode] = useState<Mode>('draw')
  const [typedName, setTypedName] = useState(defaultName)
  const [isDrawing, setIsDrawing] = useState(false)
  const [hasDrawn, setHasDrawn] = useState(false)

  const initCanvas = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * 2
    canvas.height = rect.height * 2
    ctx.scale(2, 2)
    ctx.strokeStyle = '#1e293b'
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, rect.width, rect.height)
  }, [])

  useEffect(() => {
    initCanvas()
    window.addEventListener('resize', initCanvas)
    return () => window.removeEventListener('resize', initCanvas)
  }, [initCanvas, mode])

  const getPos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current!
    const rect = canvas.getBoundingClientRect()
    if ('touches' in e) {
      return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top }
    }
    return { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }

  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault()
    const ctx = canvasRef.current?.getContext('2d')
    if (!ctx) return
    const { x, y } = getPos(e)
    ctx.beginPath()
    ctx.moveTo(x, y)
    setIsDrawing(true)
    setHasDrawn(true)
  }

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return
    e.preventDefault()
    const ctx = canvasRef.current?.getContext('2d')
    if (!ctx) return
    const { x, y } = getPos(e)
    ctx.lineTo(x, y)
    ctx.stroke()
  }

  const endDraw = () => setIsDrawing(false)

  const clearCanvas = () => {
    initCanvas()
    setHasDrawn(false)
  }

  const renderTypedSignature = (): string => {
    const canvas = document.createElement('canvas')
    canvas.width = 600
    canvas.height = 150
    const ctx = canvas.getContext('2d')!
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, 600, 150)
    ctx.fillStyle = '#1e293b'
    ctx.font = 'italic 36px "Georgia", serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(typedName, 300, 75)
    return canvas.toDataURL('image/png')
  }

  const handleApply = () => {
    if (mode === 'draw') {
      if (!hasDrawn) return
      onSignature(canvasRef.current!.toDataURL('image/png'))
    } else {
      if (!typedName.trim()) return
      onSignature(renderTypedSignature())
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setMode('draw')}
          className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
            mode === 'draw' ? 'bg-brand-100 text-brand-700' : 'bg-surface-100 text-surface-600 hover:bg-surface-200'
          }`}
        >
          <PenLine size={14} /> Draw
        </button>
        <button
          type="button"
          onClick={() => setMode('type')}
          className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
            mode === 'type' ? 'bg-brand-100 text-brand-700' : 'bg-surface-100 text-surface-600 hover:bg-surface-200'
          }`}
        >
          <Type size={14} /> Type
        </button>
      </div>

      {mode === 'draw' ? (
        <div className="relative">
          <canvas
            ref={canvasRef}
            className="w-full h-36 rounded-lg border-2 border-dashed border-surface-300 bg-white cursor-crosshair touch-none"
            onMouseDown={startDraw}
            onMouseMove={draw}
            onMouseUp={endDraw}
            onMouseLeave={endDraw}
            onTouchStart={startDraw}
            onTouchMove={draw}
            onTouchEnd={endDraw}
          />
          <p className="absolute bottom-2 left-3 text-xs text-surface-400 pointer-events-none">
            Sign above using mouse or touch
          </p>
          <button
            type="button"
            onClick={clearCanvas}
            className="absolute top-2 right-2 rounded-md bg-white/90 p-1.5 text-surface-400 hover:text-surface-600 shadow-sm"
          >
            <Eraser size={14} />
          </button>
        </div>
      ) : (
        <div>
          <input
            type="text"
            value={typedName}
            onChange={(e) => setTypedName(e.target.value)}
            placeholder="Type your full name"
            className="w-full rounded-lg border border-surface-200 px-4 py-3 text-2xl font-serif italic text-surface-800 text-center focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          />
          {typedName && (
            <div className="mt-3 rounded-lg border border-surface-200 bg-white p-4 text-center">
              <p className="text-3xl font-serif italic text-surface-800">{typedName}</p>
            </div>
          )}
        </div>
      )}

      <div className="flex justify-end">
        <Button
          onClick={handleApply}
          disabled={mode === 'draw' ? !hasDrawn : !typedName.trim()}
        >
          Apply Signature
        </Button>
      </div>
    </div>
  )
}

export function SignatureDisplay({ signature }: { signature: { name: string; signatureImage: string; signedAt: string } }) {
  return (
    <div className="rounded-lg border border-surface-200 bg-surface-50 p-4">
      <img src={signature.signatureImage} alt={`Signature of ${signature.name}`} className="h-16 object-contain" />
      <p className="mt-2 text-sm font-medium text-surface-800">{signature.name}</p>
      <p className="text-xs text-surface-400">
        Signed {new Date(signature.signedAt).toLocaleString()}
      </p>
    </div>
  )
}
