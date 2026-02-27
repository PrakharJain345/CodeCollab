import { useState, useEffect } from 'react'

const LogoIcon = ({ size = 44 }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="logo-grad-modal" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#8b5cf6" />
        <stop offset="100%" stopColor="#06b6d4" />
      </linearGradient>
      <filter id="logo-glow-modal" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="1.5" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>
    </defs>
    <path 
      d="M16 2L28.1244 9V23L16 30L3.87564 23V9L16 2Z" 
      fill="url(#logo-grad-modal)" 
      fillOpacity="0.15" 
      stroke="url(#logo-grad-modal)" 
      strokeWidth="1.5"
    />
    <path 
      d="M16 8L22.9282 12V20L16 24L9.0718 20V12L16 8Z" 
      stroke="white" 
      strokeWidth="2.5" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      filter="url(#logo-glow-modal)"
    />
    <path 
      d="M16 12L19.4641 14V18L16 20L12.5359 18V14L16 12Z" 
      fill="white" 
      fillOpacity="0.8"
    />
  </svg>
)

const ADJECTIVES = ['swift', 'bright', 'calm', 'bold', 'quick', 'wild', 'wise', 'free']
const NOUNS = ['eagle', 'tiger', 'river', 'cloud', 'storm', 'ocean', 'mountain', 'forest']

function generateRandomRoom() {
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)]
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)]
  const num = Math.floor(Math.random() * 900) + 100
  return `${adj}-${noun}-${num}`
}

export default function JoinRoomModal({ onJoin }) {
  const [username, setUsername] = useState('')
  const [roomName, setRoomName] = useState('')
  const [errors, setErrors]     = useState({})
  const [recentRooms, setRecentRooms] = useState([])
  const [loadingRooms, setLoadingRooms] = useState(true)

  useEffect(() => {
    // Pre-fill from URL and Storage
    const params = new URLSearchParams(window.location.search)
    const room   = params.get('room')
    if (room) setRoomName(room)

    const savedUser = sessionStorage.getItem('cc-username')
    if (savedUser) setUsername(savedUser)

    const fetchRooms = async () => {
      try {
        const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:4000'
        const API    = WS_URL.replace(/^ws/, 'http')
        const res = await fetch(`${API}/api/rooms`)
        if (res.ok) {
          const data = await res.json()
          setRecentRooms(data.rooms || [])
        }
      } catch (err) {
        console.error('Failed to fetch rooms:', err)
      } finally {
        setLoadingRooms(false)
      }
    }
    fetchRooms()
  }, [])

  const validate = () => {
    const errs = {}
    if (username.trim().length < 2) errs.username = 'Display name too short'
    if (roomName.trim().length < 3) errs.roomName = 'Room name too short'
    else if (!/^[a-zA-Z0-9_-]+$/.test(roomName.trim())) errs.roomName = 'Invalid characters used'
    return errs
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    onJoin(username.trim(), roomName.trim(), false)
  }

  return (
    <div
      className="animate-mesh"
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Background Decor */}
      <div className="glow-spot" style={{ top: '-100px', right: '-100px' }} />
      <div className="glow-spot" style={{ bottom: '-150px', left: '-100px', background: 'radial-gradient(circle, rgba(6,182,212,0.1) 0%, transparent 70%)' }} />

      <div className="glass-strong card-shadow" style={{
        width: '100%',
        maxWidth: '1080px',
        height: '720px',
        display: 'flex',
        borderRadius: '32px',
        overflow: 'hidden',
        position: 'relative',
        zIndex: 1
      }}>
        {/* ── LEFT: Hero ─────────────────────────────── */}
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '60px 80px',
          background: 'rgba(255,255,255,0.02)',
          borderRight: '1px solid var(--border-standard)',
          position: 'relative'
        }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '60px' }}>
            <LogoIcon size={48} />
            <span className="text-gradient" style={{ fontSize: '26px', fontWeight: '800', letterSpacing: '-0.5px' }}>
              CodeCollab
            </span>
          </div>

          <h1 style={{
            fontSize: '56px', fontWeight: '800', color: '#ffffff',
            lineHeight: 1.05, letterSpacing: '-0.04em', marginBottom: '24px',
          }}>
            Evolve your <br />
            <span style={{ color: 'var(--violet-500)' }}>workflow together.</span>
          </h1>

          <p style={{ fontSize: '18px', color: '#94a3b8', lineHeight: 1.6, maxWidth: '440px', marginBottom: '64px' }}>
            The ultimate collaborative playground for modern teams. Code, draw, and communicate in real-time.
          </p>

          {/* Features */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px' }}>
            {[
              { icon: '💻', title: 'IDE-Grade Collaboration', desc: 'Monaco-powered editing with conflict-free Yjs sync.' },
              { icon: '🎥', title: 'Instant Video & Chat', desc: 'Crystal clear calls and group chat built right in.' },
              { icon: '🤖', title: 'Contextual AI Helper', desc: 'Intelligent coding assistance wherever you need it.' },
            ].map(f => (
              <div key={f.title} style={{ display: 'flex', gap: '18px', alignItems: 'flex-start' }}>
                <div style={{
                  width: '42px', height: '42px', borderRadius: '14px', flexShrink: 0,
                  background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px'
                }}>{f.icon}</div>
                <div>
                  <h4 style={{ color: '#f1f5f9', fontSize: '15px', fontWeight: '700' }}>{f.title}</h4>
                  <p style={{ color: '#64748b', fontSize: '13px', marginTop: '4px' }}>{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── RIGHT: Form ────────────────────────────── */}
        <div style={{
          width: '460px',
          display: 'flex',
          flexDirection: 'column',
          padding: '60px 48px',
          background: 'var(--bg-surface)'
        }}>
          <div style={{ marginBottom: '40px' }}>
            <h2 style={{ fontSize: '28px', fontWeight: '800', color: '#fff', marginBottom: '8px' }}>Join Session</h2>
            <p style={{ color: '#64748b', fontSize: '14px' }}>Ready to start collaborating? Jump in.</p>
          </div>

          <form onSubmit={handleSubmit} style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            {/* Display Name */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#64748b', marginBottom: '8px', letterSpacing: '0.05em' }}>
                DISPLAY NAME
              </label>
              <input
                type="text"
                value={username}
                onChange={e => { setUsername(e.target.value); setErrors(p => ({ ...p, username: undefined })) }}
                placeholder="How should others see you?"
                style={{
                  width: '100%', padding: '14px 18px', borderRadius: '12px',
                  background: 'rgba(255,255,255,0.03)',
                  border: `1px solid ${errors.username ? 'var(--accent-danger)' : 'var(--border-standard)'}`,
                  color: '#fff', fontSize: '15px', outline: 'none', transition: 'all 0.2s',
                  boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.2)'
                }}
                onFocus={e => e.target.style.borderColor = 'var(--violet-500)'}
                onBlur={e => e.target.style.borderColor = errors.username ? 'var(--accent-danger)' : 'var(--border-standard)'}
              />
              {errors.username && <p style={{ color: 'var(--accent-danger)', fontSize: '12px', marginTop: '6px' }}>{errors.username}</p>}
            </div>

            {/* Room Name */}
            <div style={{ marginBottom: '32px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#64748b', marginBottom: '8px', letterSpacing: '0.05em' }}>
                SPACE IDENTIFIER
              </label>
              <div style={{ display: 'flex', gap: '10px' }}>
                <input
                  type="text"
                  value={roomName}
                  onChange={e => { setRoomName(e.target.value); setErrors(p => ({ ...p, roomName: undefined })) }}
                  placeholder="project-aurora"
                  style={{
                    flex: 1, padding: '14px 18px', borderRadius: '12px',
                    background: 'rgba(255,255,255,0.03)',
                    border: `1px solid ${errors.roomName ? 'var(--accent-danger)' : 'var(--border-standard)'}`,
                    color: '#fff', fontSize: '15px', outline: 'none', transition: 'all 0.2s',
                    fontFamily: 'JetBrains Mono, monospace',
                    boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.2)'
                  }}
                  onFocus={e => e.target.style.borderColor = 'var(--violet-500)'}
                  onBlur={e => e.target.style.borderColor = errors.roomName ? 'var(--accent-danger)' : 'var(--border-standard)'}
                />
                <button
                  type="button"
                  onClick={() => { setRoomName(generateRandomRoom()); setErrors(p => ({ ...p, roomName: undefined })) }}
                  style={{
                    padding: '0 16px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)',
                    border: '1px solid var(--border-standard)', color: '#fff', cursor: 'pointer',
                    fontSize: '18px', transition: 'all 0.2s'
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                >🎲</button>
              </div>
            </div>

            <button type="submit" className="btn-premium btn-primary" style={{ height: '52px', fontSize: '16px', width: '100%' }}>
              Launch Workspace
            </button>

            <div style={{ marginTop: 'auto' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <div style={{ height: '1px', flex: 1, background: 'var(--border-dim)' }} />
                <span style={{ fontSize: '11px', fontWeight: '700', color: '#475569', letterSpacing: '0.1em' }}>ACTIVE SPACES</span>
                <div style={{ height: '1px', flex: 1, background: 'var(--border-dim)' }} />
              </div>

              {/* Minimal Room list */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '160px', overflowY: 'auto', paddingRight: '4px' }}>
                {recentRooms.slice(0, 3).map(room => (
                  <div
                    key={room.name}
                    onClick={() => setRoomName(room.name)}
                    style={{
                      padding: '10px 14px', borderRadius: '12px', background: 'rgba(255,255,255,0.02)',
                      border: '1px solid var(--border-dim)', cursor: 'pointer', display: 'flex',
                      alignItems: 'center', justifyContent: 'space-between', transition: 'all 0.2s'
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.borderColor = 'var(--indigo-500)' }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; e.currentTarget.style.borderColor = 'var(--border-dim)' }}
                  >
                    <span style={{ fontSize: '13px', fontWeight: '600', color: '#94a3b8' }}>{room.name}</span>
                    <span style={{ fontSize: '10px', color: 'var(--indigo-500)', background: 'rgba(99,102,241,0.1)', padding: '2px 6px', borderRadius: '4px' }}>
                      {room.language}
                    </span>
                  </div>
                ))}
                {recentRooms.length === 0 && !loadingRooms && (
                  <p style={{ color: '#475569', fontSize: '12px', textAlign: 'center', fontStyle: 'italic' }}>No public spaces available right now.</p>
                )}
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
