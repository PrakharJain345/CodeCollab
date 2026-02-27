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
      width: '320px', flexShrink: 0, display: 'flex', flexDirection: 'column',
      background: 'var(--bg-surface)', borderLeft: '1px solid var(--border-dim)',
    }}>

      {/* ── Header ──────────────────────────────────────────────────── */}
      <div style={{
        flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 18px',
        background: 'rgba(16,185,129,0.05)', borderBottom: '1px solid var(--border-dim)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '28px', height: '28px', borderRadius: '8px',
            background: 'linear-gradient(135deg, #059669, #10b981)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px',
            boxShadow: '0 0 16px rgba(16,185,129,0.3)',
          }}>📜</div>
          <span style={{ color: '#fff', fontWeight: '700', fontSize: '14px' }}>Timeline</span>
        </div>
        <span style={{ fontSize: '11px', fontWeight: '800', padding: '2px 8px', borderRadius: '12px', background: 'rgba(16,185,129,0.1)', color: '#34d399' }}>
          {snapshots.length}
        </span>
      </div>

      {/* ── Slider ──────────────────────────────────────────────────── */}
      {snapshots.length > 1 && (
        <div style={{
          flexShrink: 0, padding: '14px 18px',
          borderBottom: '1px solid var(--border-dim)',
          display: 'flex', flexDirection: 'column', gap: '8px',
          background: 'rgba(0,0,0,0.1)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', fontWeight: '700', color: '#475569', letterSpacing: '0.05em' }}>
            <span>ORIGIN</span>
            <span style={{ color: '#10b981' }}>HISTORY SCRUB</span>
            <span>LATEST</span>
          </div>
          <input
            type="range"
            min={0}
            max={snapshots.length - 1}
            value={preview !== null ? preview : currentIdx}
            onChange={e => setPreview(Number(e.target.value))}
            onMouseUp={e => handleRestore(Number(e.target.value))}
            onTouchEnd={e => handleRestore(Number(e.target.value))}
            style={{ width: '100%', accentColor: '#10b981', cursor: 'pointer', height: '4px', borderRadius: '2px' }}
          />
        </div>
      )}

      {/* ── Preview pane ────────────────────────────────────────────── */}
      {snap && (
        <div style={{
          flexShrink: 0, padding: '12px 16px', borderBottom: '1px solid var(--border-dim)',
          background: 'rgba(16,185,129,0.02)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                width: '6px', height: '6px', borderRadius: '50%',
                background: snap.author === 'Me' ? '#10b981' : '#06b6d4',
                boxShadow: `0 0 8px ${snap.author === 'Me' ? '#10b981' : '#06b6d4'}80`
              }} />
              <span style={{ fontSize: '12px', fontWeight: '800', color: '#f1f5f9' }}>{snap.author.toUpperCase()}</span>
            </div>
            <span style={{ fontSize: '11px', color: '#475569', fontWeight: '600' }}>
              {fmtTime(snap.timestamp)}
            </span>
          </div>
          <div style={{
            padding: '10px', borderRadius: '12px',
            background: 'var(--bg-panel)', border: '1px solid var(--border-standard)',
            maxHeight: '120px', overflow: 'hidden', position: 'relative',
          }}>
            <pre style={{
              margin: 0, fontFamily: 'var(--font-mono)', fontSize: '10px',
              color: '#94a3b8', lineHeight: 1.5, whiteSpace: 'pre-wrap', wordBreak: 'break-all',
            }}>
              {snap.content.slice(0, 300)}{snap.content.length > 300 ? '...' : ''}
            </pre>
            <div style={{
              position: 'absolute', inset: 'auto 0 0 0', height: '40px',
              background: 'linear-gradient(transparent, var(--bg-panel))',
            }} />
          </div>
          {preview !== null && preview !== currentIdx && (
            <button
              onClick={() => handleRestore(preview)}
              disabled={restoring}
              className="btn-premium btn-primary"
              style={{
                marginTop: '12px', width: '100%', padding: '8px',
                background: restoring ? 'rgba(5,150,105,0.4)' : 'linear-gradient(135deg, #059669, #10b981)',
                color: '#fff', fontSize: '12px',
              }}
            >
              {restoring ? '✓ SYNCED' : 'RESTORE VERSION'}
            </button>
          )}
        </div>
      )}

      {/* ── Timeline list ───────────────────────────────────────────── */}
      <div ref={listRef} style={{ flex: 1, overflowY: 'auto', padding: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {snapshots.length === 0 ? (
          <div style={{
            flex: 1, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '40px 20px',
          }}>
            <div style={{ fontSize: '32px', marginBottom: '12px', opacity: 0.5 }}>⌛</div>
            <p style={{ color: '#94a3b8', fontSize: '14px', fontWeight: '600' }}>
              No history yet
            </p>
            <p style={{ color: '#475569', fontSize: '12px', marginTop: '4px' }}>
              We'll auto-save versions as you collaborate.
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
                  display: 'flex', alignItems: 'center', gap: '12px',
                  padding: '10px 14px', borderRadius: '12px', border: '1px solid transparent', cursor: 'pointer',
                  background: isActive ? 'rgba(16,185,129,0.06)' : 'rgba(255,255,255,0.02)',
                  borderColor: isActive ? 'rgba(16,185,129,0.2)' : 'transparent',
                  transition: 'all 0.2s', textAlign: 'left',
                }}
              >
                <div style={{
                  width: '6px', height: '6px', borderRadius: '50%', flexShrink: 0,
                  background: isActive ? '#10b981' : '#334155',
                  boxShadow: isActive ? '0 0 8px #10b981' : 'none',
                }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                    <span style={{
                      fontSize: '12px', fontWeight: '700',
                      color: isActive ? '#e2e8f0' : '#94a3b8',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>{snap.author}</span>
                    <span style={{ fontSize: '10px', color: '#475569', fontWeight: '600', flexShrink: 0 }}>
                      {fmtTime(snap.timestamp)}
                    </span>
                  </div>
                  <span style={{
                    fontSize: '10px', color: '#475569', fontWeight: '500',
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
