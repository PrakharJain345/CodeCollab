import { useState, useEffect } from 'react'

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
    if (username.trim().length < 2) errs.username = 'At least 2 characters'
    else if (username.trim().length > 30) errs.username = 'Max 30 characters'
    if (roomName.trim().length < 3) errs.roomName = 'At least 3 characters'
    else if (roomName.trim().length > 50) errs.roomName = 'Max 50 characters'
    else if (!/^[a-zA-Z0-9_-]+$/.test(roomName.trim())) errs.roomName = 'Letters, numbers, - and _ only'
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
      style={{
        minHeight: '100vh',
        display: 'flex',
        background: '#0a0a14',
      }}
    >
      {/* ── LEFT: Hero ─────────────────────────────── */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '60px 72px',
          borderRight: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '48px' }}>
          <div style={{
            width: '44px', height: '44px', borderRadius: '12px',
            background: 'linear-gradient(135deg, #6d28d9, #a855f7)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '22px', boxShadow: '0 0 24px rgba(168,85,247,0.3)',
          }}>⚡</div>
          <span style={{ fontSize: '22px', fontWeight: '700', color: '#fff', letterSpacing: '-0.3px' }}>
            CodeCollab
          </span>
        </div>

        {/* Headline */}
        <h1 style={{
          fontSize: '52px', fontWeight: '800', color: '#ffffff',
          lineHeight: 1.1, letterSpacing: '-1px', marginBottom: '20px',
          maxWidth: '520px',
        }}>
          Code together,<br />
          <span style={{ color: '#a855f7' }}>in real&#8209;time.</span>
        </h1>

        <p style={{ fontSize: '17px', color: 'rgba(226,232,240,0.5)', lineHeight: 1.7, maxWidth: '420px', marginBottom: '56px' }}>
          Share a room link and start collaborating instantly — with a live code editor, video, and chat all in one place.
        </p>

        {/* Feature pills */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {[
            { icon: '💻', label: 'Live Code Editor', desc: 'Monaco + real-time sync via WebRTC' },
            { icon: '🎥', label: 'Video Calls',      desc: 'Built-in Jitsi video — no account needed' },
            { icon: '💬', label: 'Team Chat',        desc: 'Persistent messages synced to the room' },
          ].map(f => (
            <div key={f.label} style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{
                width: '38px', height: '38px', borderRadius: '10px', flexShrink: 0,
                background: 'rgba(168,85,247,0.1)', border: '1px solid rgba(168,85,247,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px',
              }}>{f.icon}</div>
              <div>
                <p style={{ color: '#e2e8f0', fontWeight: '600', fontSize: '14px' }}>{f.label}</p>
                <p style={{ color: 'rgba(226,232,240,0.4)', fontSize: '13px', marginTop: '2px' }}>{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── RIGHT: Form ────────────────────────────── */}
      <div
        style={{
          width: '440px',
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '60px 48px',
        }}
      >
        <h2 style={{ fontSize: '26px', fontWeight: '700', color: '#fff', marginBottom: '8px', letterSpacing: '-0.3px' }}>
          Join a room
        </h2>
        <p style={{ color: 'rgba(226,232,240,0.4)', fontSize: '14px', marginBottom: '36px' }}>
          Enter your name and a room name to get started.
        </p>

        <form onSubmit={handleSubmit}>
          {/* Username */}
          <div style={{ marginBottom: '22px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: 'rgba(226,232,240,0.7)', marginBottom: '8px', letterSpacing: '0.3px' }}>
              YOUR NAME
            </label>
            <input
              type="text"
              value={username}
              onChange={e => { setUsername(e.target.value); setErrors(p => ({ ...p, username: undefined })) }}
              placeholder="e.g. Alice"
              autoFocus
              style={{
                width: '100%', padding: '12px 16px', borderRadius: '10px',
                background: 'rgba(255,255,255,0.05)',
                border: `1px solid ${errors.username ? '#f43f5e' : 'rgba(255,255,255,0.1)'}`,
                color: '#fff', fontSize: '15px', outline: 'none',
                fontFamily: 'Inter, sans-serif', boxSizing: 'border-box',
                transition: 'border-color 0.2s',
              }}
              onFocus={e => { if (!errors.username) e.target.style.borderColor = '#a855f7' }}
              onBlur={e => { if (!errors.username) e.target.style.borderColor = 'rgba(255,255,255,0.1)' }}
            />
            {errors.username && <p style={{ color: '#f43f5e', fontSize: '12px', marginTop: '6px' }}>{errors.username}</p>}
          </div>

          {/* Room Name */}
          <div style={{ marginBottom: '22px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: 'rgba(226,232,240,0.7)', marginBottom: '8px', letterSpacing: '0.3px' }}>
              ROOM NAME
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                value={roomName}
                onChange={e => { setRoomName(e.target.value); setErrors(p => ({ ...p, roomName: undefined })) }}
                placeholder="e.g. my-project"
                style={{
                  flex: 1, padding: '12px 16px', borderRadius: '10px',
                  background: 'rgba(255,255,255,0.05)',
                  border: `1px solid ${errors.roomName ? '#f43f5e' : 'rgba(255,255,255,0.1)'}`,
                  color: '#fff', fontSize: '15px', outline: 'none',
                  fontFamily: 'JetBrains Mono, monospace', boxSizing: 'border-box',
                  transition: 'border-color 0.2s',
                }}
                onFocus={e => { if (!errors.roomName) e.target.style.borderColor = '#a855f7' }}
                onBlur={e => { if (!errors.roomName) e.target.style.borderColor = 'rgba(255,255,255,0.1)' }}
              />
              <button
                type="button"
                title="Generate random room name"
                onClick={() => { setRoomName(generateRandomRoom()); setErrors(p => ({ ...p, roomName: undefined })) }}
                style={{
                  padding: '12px 14px', borderRadius: '10px', fontSize: '16px', cursor: 'pointer',
                  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                  transition: 'background 0.2s', color: '#fff',
                }}
                onMouseEnter={e => e.target.style.background = 'rgba(168,85,247,0.15)'}
                onMouseLeave={e => e.target.style.background = 'rgba(255,255,255,0.05)'}
              >🎲</button>
            </div>
            {errors.roomName
              ? <p style={{ color: '#f43f5e', fontSize: '12px', marginTop: '6px' }}>{errors.roomName}</p>
              : <p style={{ color: 'rgba(226,232,240,0.3)', fontSize: '12px', marginTop: '6px' }}>Letters, numbers, dashes and underscores</p>
            }
          </div>

          <div style={{ marginBottom: '28px', padding: '12px', background: 'rgba(168,85,247,0.05)', borderRadius: '10px', border: '1px solid rgba(168,85,247,0.1)' }}>
            <p style={{ color: '#e2e8f0', fontSize: '13px', fontWeight: '500' }}>
              🔒 Room Security
            </p>
            <p style={{ color: 'rgba(226,232,240,0.4)', fontSize: '12px', marginTop: '4px' }}>
              The first person to join this room will automatically become the Admin and can manage edit permissions.
            </p>
          </div>

          {/* Submit */}
          <button
            type="submit"
            style={{
              width: '100%', padding: '14px', borderRadius: '10px', border: 'none',
              background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
              color: '#fff', fontWeight: '700', fontSize: '15px', cursor: 'pointer',
              boxShadow: '0 4px 20px rgba(168,85,247,0.35)',
              transition: 'transform 0.15s, box-shadow 0.15s', fontFamily: 'Inter, sans-serif',
              marginBottom: '40px'
            }}
            onMouseEnter={e => { e.target.style.transform = 'translateY(-1px)'; e.target.style.boxShadow = '0 8px 28px rgba(168,85,247,0.5)' }}
            onMouseLeave={e => { e.target.style.transform = ''; e.target.style.boxShadow = '0 4px 20px rgba(168,85,247,0.35)' }}
          >
            Join Room →
          </button>

          {/* ── Public Rooms Browser ─────────────────────────────────── */}
          <div style={{ marginTop: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: '700', color: 'rgba(226,232,240,0.8)', letterSpacing: '0.5px' }}>
                ACTIVE PUBLIC ROOMS
              </h3>
              {loadingRooms && <div className="spinner-small" style={{ width: '12px', height: '12px', border: '2px solid rgba(168,85,247,0.3)', borderTopColor: '#a855f7', borderRadius: '50%' }} />}
            </div>

            {recentRooms.length === 0 && !loadingRooms ? (
              <div style={{ padding: '24px', borderRadius: '12px', border: '1px dashed rgba(255,255,255,0.08)', textAlign: 'center' }}>
                <p style={{ color: 'rgba(226,232,240,0.3)', fontSize: '13px' }}>No active public rooms yet.</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '8px', maxHeight: '220px', overflowY: 'auto', paddingRight: '4px' }}>
                {recentRooms.map(room => (
                  <div
                    key={room.name}
                    onClick={() => setRoomName(room.name)}
                    style={{
                      padding: '12px 14px', borderRadius: '10px', background: 'rgba(255,255,255,0.03)',
                      border: roomName === room.name ? '1px solid rgba(168,85,247,0.5)' : '1px solid rgba(255,255,255,0.05)',
                      cursor: 'pointer', transition: 'all 0.2s', position: 'relative', overflow: 'hidden'
                    }}
                    onMouseEnter={e => { if(roomName !== room.name) e.currentTarget.style.background = 'rgba(255,255,255,0.06)' }}
                    onMouseLeave={e => { if(roomName !== room.name) e.currentTarget.style.background = 'rgba(255,255,255,0.03)' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ color: '#fff', fontWeight: '600', fontSize: '14px' }}>{room.name}</span>
                      <span style={{ fontSize: '11px', color: 'rgba(226,232,240,0.4)', background: 'rgba(255,255,255,0.05)', padding: '2px 6px', borderRadius: '4px' }}>
                        {room.language}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '11px', color: 'rgba(168,85,247,0.6)' }}>
                         👤 {room.createdBy || 'Unknown'}
                      </span>
                      <span style={{ fontSize: '11px', color: 'rgba(226,232,240,0.3)' }}>
                        🕒 {new Date(room.lastActive).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}
