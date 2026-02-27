import { useEffect, useRef, useState, useCallback } from 'react'
import * as Y from 'yjs'
import { WebsocketProvider } from 'y-websocket'

const COLORS = ['#ffffff', '#a855f7', '#06b6d4', '#ec4899', '#22c55e', '#f59e0b', '#f87171', '#60a5fa', '#fb923c']
const BRUSH_SIZES = [2, 5, 10, 20]

function redrawCanvas(canvas, strokes) {
  const ctx = canvas.getContext('2d')
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  for (const stroke of strokes) {
    if (!stroke.points || stroke.points.length < 2) continue
    ctx.beginPath()
    ctx.strokeStyle = stroke.color || '#ffffff'
    ctx.lineWidth   = stroke.size  || 3
    ctx.lineCap     = 'round'
    ctx.lineJoin    = 'round'
    ctx.globalCompositeOperation = stroke.eraser ? 'destination-out' : 'source-over'
    ctx.moveTo(stroke.points[0].x, stroke.points[0].y)
    for (let i = 1; i < stroke.points.length; i++) {
      ctx.lineTo(stroke.points[i].x, stroke.points[i].y)
    }
    ctx.stroke()
  }
  ctx.globalCompositeOperation = 'source-over'
}

export default function Whiteboard({ roomName, username }) {
  const canvasRef   = useRef(null)
  const overlayRef  = useRef(null) // for in-progress stroke preview
  const ydocRef     = useRef(null)
  const providerRef = useRef(null)
  const strokesRef  = useRef(null) // Y.Array

  const [color, setColor]       = useState('#ffffff')
  const [brushSize, setBrush]   = useState(5)
  const [eraser, setEraser]     = useState(false)
  const [connected, setConn]    = useState(false)

  const drawing   = useRef(false)
  const curStroke = useRef([]) // points for the in-progress stroke

  // ── Yjs setup ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const ydoc    = new Y.Doc()
    const WS_URL  = import.meta.env.VITE_WS_URL || 'ws://localhost:4000'
    const provider = new WebsocketProvider(WS_URL, `${roomName}-whiteboard`, ydoc)
    const strokes = ydoc.getArray('strokes')
    ydocRef.current    = ydoc
    providerRef.current = provider
    strokesRef.current  = strokes

    provider.on('synced', () => setConn(true))
    setTimeout(() => setConn(true), 2000)

    const redraw = () => {
      const canvas = canvasRef.current
      if (canvas) redrawCanvas(canvas, strokes.toArray())
    }
    strokes.observe(redraw)

    return () => {
      strokes.unobserve(redraw)
      provider.destroy()
      ydoc.destroy()
    }
  }, [roomName])

  // ── Resize canvas to fill its container ───────────────────────────────────
  useEffect(() => {
    const resize = () => {
      [canvasRef, overlayRef].forEach(r => {
        if (!r.current) return
        const rect = r.current.parentElement.getBoundingClientRect()
        r.current.width  = rect.width
        r.current.height = rect.height
      })
      if (canvasRef.current && strokesRef.current) {
        redrawCanvas(canvasRef.current, strokesRef.current.toArray())
      }
    }
    resize()
    window.addEventListener('resize', resize)
    return () => window.removeEventListener('resize', resize)
  }, [])

  // ── Drawing helpers ────────────────────────────────────────────────────────
  const getPos = (e, canvas) => {
    const rect = canvas.getBoundingClientRect()
    const src  = e.touches ? e.touches[0] : e
    return { x: src.clientX - rect.left, y: src.clientY - rect.top }
  }

  const startDraw = useCallback((e) => {
    e.preventDefault()
    drawing.current = true
    const pos = getPos(e, overlayRef.current)
    curStroke.current = [pos]
  }, [])

  const draw = useCallback((e) => {
    e.preventDefault()
    if (!drawing.current) return
    const pos = getPos(e, overlayRef.current)
    curStroke.current.push(pos)

    // Preview on overlay canvas
    const ctx = overlayRef.current.getContext('2d')
    ctx.clearRect(0, 0, overlayRef.current.width, overlayRef.current.height)
    const pts = curStroke.current
    if (pts.length < 2) return
    ctx.beginPath()
    ctx.strokeStyle = eraser ? 'rgba(255,255,255,0.5)' : color
    ctx.lineWidth   = brushSize
    ctx.lineCap     = 'round'
    ctx.lineJoin    = 'round'
    ctx.globalCompositeOperation = 'source-over'
    ctx.moveTo(pts[0].x, pts[0].y)
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y)
    ctx.stroke()
  }, [color, brushSize, eraser])

  const endDraw = useCallback(() => {
    if (!drawing.current) return
    drawing.current = false

    const pts = curStroke.current
    if (pts.length >= 2 && strokesRef.current) {
      strokesRef.current.push([{ color, size: brushSize, eraser, points: pts, user: username }])
    }
    curStroke.current = []

    // Clear overlay
    const ctx = overlayRef.current.getContext('2d')
    ctx.clearRect(0, 0, overlayRef.current.width, overlayRef.current.height)
  }, [color, brushSize, eraser, username])

  const clearBoard = () => {
    if (strokesRef.current) strokesRef.current.delete(0, strokesRef.current.length)
  }

  const undo = () => {
    if (strokesRef.current?.length > 0) {
      strokesRef.current.delete(strokesRef.current.length - 1, 1)
    }
  }

  return (
    <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', background: '#050510', position: 'relative' }}>

      {/* ── Toolbar ─────────────────────────────────────────────────────── */}
      <div style={{
        flexShrink: 0, display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '10px',
        padding: '12px 18px',
        background: 'rgba(124,58,237,0.05)', borderBottom: '1px solid var(--border-dim)',
      }}>
        {/* Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginRight: '6px' }}>
          <div style={{
            width: '28px', height: '28px', borderRadius: '8px',
            background: 'linear-gradient(135deg, var(--violet-600), var(--violet-500))',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px',
            boxShadow: '0 0 16px rgba(124,58,237,0.3)',
          }}>🎨</div>
          <span style={{ color: '#fff', fontWeight: '700', fontSize: '14px' }}>Canvas</span>
        </div>

        {/* Divider */}
        <div style={{ width: '1px', height: '20px', background: 'var(--border-standard)', flexShrink: 0 }} />

        {/* Colors */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {COLORS.map(c => (
            <button
              key={c}
              onClick={() => { setColor(c); setEraser(false) }}
              style={{
                width: '18px', height: '18px', borderRadius: '50%',
                background: c, border: 'none', cursor: 'pointer',
                outline: (!eraser && color === c) ? `2px solid ${c}` : '2px solid transparent',
                outlineOffset: '2px',
                opacity: (!eraser && color === c) ? 1 : 0.6,
                transform: (!eraser && color === c) ? 'scale(1.15)' : 'scale(1)',
                transition: 'all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
              }}
            />
          ))}
        </div>

        {/* Divider */}
        <div style={{ width: '1px', height: '20px', background: 'var(--border-standard)', flexShrink: 0 }} />

        {/* Brush sizes */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {BRUSH_SIZES.map(s => (
            <button
              key={s}
              onClick={() => setBrush(s)}
              className="btn-premium btn-ghost"
              style={{
                width: '32px', height: '32px', padding: 0,
                borderColor: brushSize === s ? 'var(--violet-500)' : 'var(--border-dim)',
                background: brushSize === s ? 'rgba(124,58,237,0.1)' : 'rgba(255,255,255,0.03)',
              }}
            >
              <div style={{ width: `${Math.min(s/2 + 2, 8)}px`, height: `${Math.min(s/2 + 2, 8)}px`, borderRadius: '50%', background: brushSize === s ? 'var(--violet-400)' : '#94a3b8' }} />
            </button>
          ))}
        </div>

        {/* Tool buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={() => setEraser(v => !v)}
            className="btn-premium btn-ghost"
            style={{
              padding: '6px 12px',
              color: eraser ? 'var(--rose-500)' : '#94a3b8',
              borderColor: eraser ? 'rgba(244,63,94,0.3)' : 'var(--border-dim)',
              background: eraser ? 'rgba(244,63,94,0.08)' : 'rgba(255,255,255,0.03)',
            }}
          >
            <span>{eraser ? '🧼' : '✏️'}</span>
            <span style={{ fontSize: '13px' }}>Eraser</span>
          </button>

          <button
            onClick={undo}
            className="btn-premium btn-ghost"
            style={{ padding: '6px 14px' }}
          >
            <span>↩</span>
            <span style={{ fontSize: '13px' }}>Undo</span>
          </button>

          <button
            onClick={clearBoard}
            className="btn-premium"
            style={{
              padding: '6px 14px',
              background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
              color: '#f87171'
            }}
          >
             <span>🗑</span>
             <span style={{ fontSize: '13px' }}>Reset</span>
          </button>
        </div>

        {/* Connection pill */}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{
            width: '7px', height: '7px', borderRadius: '50%',
            background: connected ? '#4ade80' : '#facc15',
            boxShadow: connected ? '0 0 6px #4ade80' : '0 0 6px #facc15',
          }} />
          <span style={{ fontSize: '12px', color: 'rgba(226,232,240,0.4)' }}>
            {connected ? 'Synced' : 'Connecting...'}
          </span>
        </div>
      </div>

      {/* ── Canvas area ─────────────────────────────────────────────────── */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden', cursor: eraser ? 'cell' : 'crosshair' }}>
        {/* Base canvas — holds committed strokes */}
        <canvas
          ref={canvasRef}
          style={{ position: 'absolute', inset: 0, display: 'block' }}
        />
        {/* Overlay canvas — live preview while drawing */}
        <canvas
          ref={overlayRef}
          style={{ position: 'absolute', inset: 0, display: 'block', touchAction: 'none' }}
          onMouseDown={startDraw}
          onMouseMove={draw}
          onMouseUp={endDraw}
          onMouseLeave={endDraw}
          onTouchStart={startDraw}
          onTouchMove={draw}
          onTouchEnd={endDraw}
        />

        {/* Empty state hint */}
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          pointerEvents: 'none', gap: '8px',
          opacity: 0.12,
        }}>
          <span style={{ fontSize: '64px' }}>🎨</span>
          <p style={{ color: '#fff', fontSize: '16px', fontWeight: '700' }}>Start drawing — everyone sees it live</p>
        </div>
      </div>
    </div>
  )
}
