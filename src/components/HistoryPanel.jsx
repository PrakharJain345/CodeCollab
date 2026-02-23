import { useEffect, useRef, useState } from 'react'

export default function HistoryPanel({ snapshots, currentIdx, onRestore, onClose }) {
  const listRef = useRef(null)
  const [preview, setPreview]     = useState(null) // index being hovered/focused
  const [restoring, setRestoring] = useState(false)

  // Auto-scroll to newest snapshot
  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight
    }
  }, [snapshots.length])

  const fmtTime = (ts) => {
    const d = new Date(ts)
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  }

  const handleRestore = async (idx) => {
    setRestoring(true)
    await onRestore(idx)
    setTimeout(() => setRestoring(false), 600)
  }

  const displayed = preview !== null ? preview : currentIdx
  const snap      = snapshots[displayed]

  return (
    <div style={{
      width: '300px', flexShrink: 0, display: 'flex', flexDirection: 'column',
      background: '#0c0c1e', borderLeft: '1px solid rgba(255,255,255,0.06)',
    }}>

      {/* ── Header ──────────────────────────────────────────────────── */}
      <div style={{
        flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px 16px',
        background: 'rgba(34,197,94,0.07)', borderBottom: '1px solid rgba(34,197,94,0.18)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '28px', height: '28px', borderRadius: '8px',
            background: 'linear-gradient(135deg, #14532d, #22c55e)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px',
            boxShadow: '0 0 12px rgba(34,197,94,0.4)',
          }}>📜</div>
          <span style={{ color: '#fff', fontWeight: '700', fontSize: '14px' }}>Code History</span>
        </div>
        <span style={{ fontSize: '12px', color: 'rgba(226,232,240,0.3)' }}>
          {snapshots.length} snapshot{snapshots.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* ── Slider ──────────────────────────────────────────────────── */}
      {snapshots.length > 1 && (
        <div style={{
          flexShrink: 0, padding: '12px 16px',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
          display: 'flex', flexDirection: 'column', gap: '6px',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'rgba(226,232,240,0.35)' }}>
            <span>{fmtTime(snapshots[0].timestamp)}</span>
            <span style={{ color: '#22c55e', fontWeight: '700' }}>← Scrub →</span>
            <span>{fmtTime(snapshots[snapshots.length - 1].timestamp)}</span>
          </div>
          <input
            type="range"
            min={0}
            max={snapshots.length - 1}
            value={preview !== null ? preview : currentIdx}
            onChange={e => setPreview(Number(e.target.value))}
            onMouseUp={e => handleRestore(Number(e.target.value))}
            onTouchEnd={e => handleRestore(Number(e.target.value))}
            style={{ width: '100%', accentColor: '#22c55e', cursor: 'pointer' }}
          />
        </div>
      )}

      {/* ── Preview pane ────────────────────────────────────────────── */}
      {snap && (
        <div style={{
          flexShrink: 0, padding: '10px 14px', borderBottom: '1px solid rgba(255,255,255,0.05)',
          background: 'rgba(34,197,94,0.04)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{
                width: '8px', height: '8px', borderRadius: '50%',
                background: snap.author === 'Me' ? '#22c55e' : '#06b6d4',
              }} />
              <span style={{ fontSize: '12px', fontWeight: '700', color: '#e2e8f0' }}>{snap.author}</span>
            </div>
            <span style={{ fontSize: '11px', color: 'rgba(226,232,240,0.35)', fontFamily: 'JetBrains Mono' }}>
              {fmtTime(snap.timestamp)}
            </span>
          </div>
          <div style={{
            padding: '8px 10px', borderRadius: '8px',
            background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.06)',
            maxHeight: '100px', overflow: 'hidden', position: 'relative',
          }}>
            <pre style={{
              margin: 0, fontFamily: 'JetBrains Mono, monospace', fontSize: '10px',
              color: 'rgba(226,232,240,0.55)', lineHeight: 1.4, whiteSpace: 'pre-wrap', wordBreak: 'break-all',
            }}>
              {snap.content.slice(0, 300)}{snap.content.length > 300 ? '...' : ''}
            </pre>
            {/* Fade out */}
            <div style={{
              position: 'absolute', bottom: 0, left: 0, right: 0, height: '30px',
              background: 'linear-gradient(transparent, #08080f)',
            }} />
          </div>
          {preview !== null && preview !== currentIdx && (
            <button
              onClick={() => handleRestore(preview)}
              disabled={restoring}
              style={{
                marginTop: '8px', width: '100%', padding: '7px', borderRadius: '8px',
                border: 'none', cursor: 'pointer',
                background: restoring ? 'rgba(34,197,94,0.3)' : 'linear-gradient(135deg, #14532d, #16a34a)',
                color: '#fff', fontWeight: '700', fontSize: '13px',
                boxShadow: '0 0 16px rgba(34,197,94,0.3)', transition: 'all 0.2s',
              }}
            >
              {restoring ? '✓ Restored!' : '⏪ Restore This Version'}
            </button>
          )}
        </div>
      )}

      {/* ── Timeline list ───────────────────────────────────────────── */}
      <div ref={listRef} style={{ flex: 1, overflowY: 'auto', padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {snapshots.length === 0 ? (
          <div style={{
            flex: 1, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '30px 16px',
          }}>
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>⏳</div>
            <p style={{ color: 'rgba(226,232,240,0.4)', fontSize: '13px' }}>
              Start typing — snapshots save automatically every few seconds
            </p>
          </div>
        ) : (
          snapshots.map((snap, i) => {
            const isActive = i === (preview !== null ? preview : currentIdx)
            return (
              <button
                key={i}
                onClick={() => { setPreview(i); handleRestore(i) }}
                onMouseEnter={() => setPreview(i)}
                onMouseLeave={() => setPreview(null)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  padding: '8px 10px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                  background: isActive ? 'rgba(34,197,94,0.12)' : 'rgba(255,255,255,0.03)',
                  borderLeft: `3px solid ${isActive ? '#22c55e' : 'transparent'}`,
                  transition: 'all 0.15s', textAlign: 'left',
                }}
              >
                {/* Dot */}
                <div style={{
                  width: '8px', height: '8px', borderRadius: '50%', flexShrink: 0,
                  background: isActive ? '#22c55e' : 'rgba(34,197,94,0.3)',
                  boxShadow: isActive ? '0 0 6px #22c55e' : 'none',
                }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '4px' }}>
                    <span style={{
                      fontSize: '12px', fontWeight: '600',
                      color: isActive ? '#22c55e' : '#e2e8f0',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>{snap.author}</span>
                    <span style={{ fontSize: '10px', color: 'rgba(226,232,240,0.3)', fontFamily: 'JetBrains Mono', flexShrink: 0 }}>
                      {fmtTime(snap.timestamp)}
                    </span>
                  </div>
                  <span style={{
                    fontSize: '11px', color: 'rgba(226,232,240,0.3)',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block',
                  }}>
                    {snap.content.split('\n').length} lines · {snap.content.length} chars
                  </span>
                </div>
              </button>
            )
          })
        )}
      </div>
    </div>
  )
}
