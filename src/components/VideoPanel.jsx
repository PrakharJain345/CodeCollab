import { useState } from 'react'

const JAAS_APP_ID = import.meta.env.VITE_JAAS_APP_ID

export default function VideoPanel({ roomName, username }) {
  const [loaded, setLoaded] = useState(false)

  // JaaS room URL — requires VITE_JAAS_APP_ID in .env
  const roomUrl = JAAS_APP_ID
    ? `https://8x8.vc/${JAAS_APP_ID}/codecollab-${roomName}#userInfo.displayName="${encodeURIComponent(username)}"&config.startWithAudioMuted=true&config.startWithVideoMuted=false&config.prejoinPageEnabled=false&config.disableDeepLinking=true`
    : null

  return (
    <div style={{
      width: '300px',
      flexShrink: 0,
      display: 'flex',
      flexDirection: 'column',
      background: 'var(--bg-surface)',
      borderRight: '1px solid var(--border-dim)',
    }}>

      {/* Header */}
      <div style={{
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 18px',
        background: 'rgba(6,182,212,0.05)',
        borderBottom: '1px solid var(--border-dim)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '28px', height: '28px', borderRadius: '8px', flexShrink: 0,
            background: 'linear-gradient(135deg, #0e7490, var(--cyan-500))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '14px', boxShadow: '0 0 16px rgba(6,182,212,0.3)',
          }}>🎥</div>
          <span style={{ color: '#fff', fontWeight: '700', fontSize: '14px' }}>Huddle</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{
            width: '7px', height: '7px', borderRadius: '50%',
            background: loaded ? 'var(--accent-success)' : 'var(--accent-warning)',
            boxShadow: loaded ? '0 0 8px var(--accent-success)' : '0 0 8px var(--accent-warning)',
          }} />
          <span style={{ fontSize: '11px', fontWeight: '600', color: '#64748b' }}>
            {roomUrl ? (loaded ? 'LIVE' : 'SYNCING') : 'SETUP'}
          </span>
        </div>
      </div>

      {/* iframe area */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>

        {/* No App ID — setup prompt */}
        {!roomUrl && (
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            padding: '32px 24px', textAlign: 'center',
            background: 'var(--bg-deep)',
          }}>
            <div style={{
              width: '56px', height: '56px', borderRadius: '18px', marginBottom: '20px',
              background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '24px', boxShadow: '0 0 40px rgba(6,182,212,0.1)',
            }}>🛡️</div>
            <p style={{ color: '#f1f5f9', fontWeight: '800', fontSize: '15px', marginBottom: '8px' }}>
              Enabling Video
            </p>
            <p style={{ color: '#64748b', fontSize: '12px', lineHeight: 1.6, marginBottom: '24px' }}>
              Add your <span style={{ color: 'var(--cyan-400)' }}>JaaS App ID</span> to the environment variables to unlock face-to-face collaboration.
            </p>
            <div style={{
              width: '100%', padding: '12px 14px', borderRadius: '10px',
              background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-standard)',
              fontFamily: 'JetBrains Mono, monospace', fontSize: '11px',
              color: 'var(--cyan-400)', textAlign: 'left',
            }}>
              VITE_JAAS_APP_ID=...
            </div>
            <a href="https://jaas.8x8.vc" target="_blank" rel="noreferrer"
              style={{ marginTop: '16px', color: '#64748b', fontSize: '11px', textDecoration: 'underline' }}>
              get free app id at jaas.8x8.vc
            </a>
          </div>
        )}

        {/* Loading spinner */}
        {roomUrl && !loaded && (
          <div style={{
            position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: '12px',
            background: 'var(--bg-deep)', zIndex: 2, pointerEvents: 'none',
          }}>
            <div style={{
              width: '32px', height: '32px', borderRadius: '50%',
              border: '2px solid rgba(6,182,212,0.1)',
              borderTopColor: 'var(--cyan-500)',
              animation: 'spin 0.8s linear infinite',
            }} />
            <p style={{ color: '#475569', fontSize: '12px', fontWeight: '600', letterSpacing: '0.05em' }}>CONNECTING...</p>
          </div>
        )}

        {/* JaaS iframe */}
        {roomUrl && (
          <iframe
            src={roomUrl}
            allow="microphone; camera; display-capture; fullscreen; autoplay"
            style={{
              width: '100%', height: '100%', border: 'none', display: 'block',
              opacity: loaded ? 1 : 0, transition: 'opacity 0.6s ease',
            }}
            onLoad={() => setLoaded(true)}
            title="Video Call"
          />
        )}
      </div>

      {/* Footer */}
      <div style={{
        flexShrink: 0, padding: '10px 18px',
        borderTop: '1px solid var(--border-dim)',
        fontSize: '11px', color: '#475569',
        background: 'rgba(0,0,0,0.1)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center'
      }}>
        <span>Secure Protocol 🔐</span>
        {JAAS_APP_ID && <span style={{ opacity: 0.6, fontSize: '10px' }}>{roomName.toUpperCase()}</span>}
      </div>
    </div>
  )
}
