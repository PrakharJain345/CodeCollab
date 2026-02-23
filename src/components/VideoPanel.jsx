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
      width: '280px',
      flexShrink: 0,
      display: 'flex',
      flexDirection: 'column',
      background: '#0c0c1e',
      borderRight: '1px solid rgba(255,255,255,0.06)',
    }}>

      {/* Header */}
      <div style={{
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '10px 16px',
        background: 'rgba(6,182,212,0.08)',
        borderBottom: '1px solid rgba(6,182,212,0.18)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '28px', height: '28px', borderRadius: '8px', flexShrink: 0,
            background: 'linear-gradient(135deg, #0e7490, #06b6d4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '14px', boxShadow: '0 0 12px rgba(6,182,212,0.4)',
          }}>🎥</div>
          <span style={{ color: '#fff', fontWeight: '700', fontSize: '14px' }}>Video</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{
            width: '7px', height: '7px', borderRadius: '50%',
            background: loaded ? '#4ade80' : '#facc15',
            boxShadow: loaded ? '0 0 6px #4ade80' : '0 0 6px #facc15',
          }} />
          <span style={{ fontSize: '12px', color: 'rgba(226,232,240,0.45)' }}>
            {roomUrl ? (loaded ? 'Live' : 'Connecting...') : 'Setup needed'}
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
            padding: '24px', textAlign: 'center',
            background: '#0c0c1e',
          }}>
            <div style={{
              width: '48px', height: '48px', borderRadius: '14px', marginBottom: '16px',
              background: 'rgba(6,182,212,0.12)', border: '1px solid rgba(6,182,212,0.25)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '22px', boxShadow: '0 0 30px rgba(6,182,212,0.15)',
            }}>🔑</div>
            <p style={{ color: '#e2e8f0', fontWeight: '700', fontSize: '14px', marginBottom: '8px' }}>
              JaaS App ID needed
            </p>
            <p style={{ color: 'rgba(226,232,240,0.45)', fontSize: '12px', lineHeight: 1.6, marginBottom: '18px' }}>
              Sign up free at{' '}
              <a href="https://jaas.8x8.vc" target="_blank" rel="noreferrer"
                style={{ color: '#06b6d4', textDecoration: 'underline' }}>jaas.8x8.vc</a>{' '}
              to get your App ID, then add it to your <code style={{
                padding: '1px 5px', borderRadius: '4px',
                background: 'rgba(255,255,255,0.08)', fontSize: '11px',
              }}>.env</code> file:
            </p>
            <div style={{
              width: '100%', padding: '10px 14px', borderRadius: '8px',
              background: 'rgba(6,182,212,0.08)', border: '1px solid rgba(6,182,212,0.2)',
              fontFamily: 'JetBrains Mono, monospace', fontSize: '11px',
              color: '#06b6d4', textAlign: 'left', userSelect: 'all',
            }}>
              VITE_JAAS_APP_ID=vpaas-magic-cookie-xxxx
            </div>
            <p style={{ color: 'rgba(226,232,240,0.3)', fontSize: '11px', marginTop: '12px' }}>
              Then restart the dev server.
            </p>
          </div>
        )}

        {/* Loading spinner — shown while roomUrl exists but not yet loaded */}
        {roomUrl && !loaded && (
          <div style={{
            position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: '10px',
            background: '#0c0c1e', zIndex: 2, pointerEvents: 'none',
          }}>
            <div style={{
              width: '36px', height: '36px', borderRadius: '50%',
              border: '2px solid transparent',
              borderTopColor: '#06b6d4', borderRightColor: '#a855f7',
              animation: 'spin 0.9s linear infinite',
            }} />
            <p style={{ color: 'rgba(226,232,240,0.5)', fontSize: '13px' }}>Joining video call...</p>
          </div>
        )}

        {/* JaaS iframe */}
        {roomUrl && (
          <iframe
            src={roomUrl}
            allow="microphone; camera; display-capture; fullscreen; autoplay"
            style={{
              width: '100%', height: '100%', border: 'none', display: 'block',
              opacity: loaded ? 1 : 0, transition: 'opacity 0.4s ease',
            }}
            onLoad={() => setLoaded(true)}
            title="Video Call"
          />
        )}
      </div>

      {/* Footer */}
      <div style={{
        flexShrink: 0, padding: '7px 14px',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        fontSize: '11px', color: 'rgba(226,232,240,0.25)',
        background: '#0c0c1e',
      }}>
        Powered by <span style={{ color: '#06b6d4' }}>JaaS · Jitsi</span>
        {JAAS_APP_ID && (
          <span style={{ float: 'right', color: 'rgba(6,182,212,0.4)', fontFamily: 'JetBrains Mono, monospace' }}>
            {roomName}
          </span>
        )}
      </div>
    </div>
  )
}
