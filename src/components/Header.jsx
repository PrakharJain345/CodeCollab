import { useState } from 'react'

const LogoIcon = () => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="logo-grad-main" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#8b5cf6" />
        <stop offset="100%" stopColor="#06b6d4" />
      </linearGradient>
      <filter id="logo-glow" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="1.5" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>
    </defs>
    {/* Background Hex */}
    <path 
      d="M16 2L28.1244 9V23L16 30L3.87564 23V9L16 2Z" 
      fill="url(#logo-grad-main)" 
      fillOpacity="0.15" 
      stroke="url(#logo-grad-main)" 
      strokeWidth="1.5"
    />
    {/* Interlocking Elements */}
    <path 
      d="M16 8L22.9282 12V20L16 24L9.0718 20V12L16 8Z" 
      stroke="white" 
      strokeWidth="2.5" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      filter="url(#logo-glow)"
    />
    <path 
      d="M16 12L19.4641 14V18L16 20L12.5359 18V14L16 12Z" 
      fill="white" 
      fillOpacity="0.8"
    />
  </svg>
)

export default function Header({ roomName, username, userCount, isAdmin, users = [], showChat, onToggleChat, showAI, onToggleAI, showWhiteboard, onToggleWhiteboard, showHistory, onToggleHistory, onTogglePermission, onLeave }) {
  const [showUserList, setShowUserList] = useState(false)
  const otherUsers = users.filter(u => u.name !== username)

  return (
    <>
      {/* ── Main Header Bar ─────────────────────────────── */}
      <header style={{
        height: '68px',
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        background: 'var(--bg-surface)',
        borderBottom: '1px solid var(--border-standard)',
        position: 'relative',
        zIndex: 50,
        boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
      }}>
        {/* TOP ACCENT LINE */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: '2px',
          background: 'linear-gradient(90deg, var(--violet-600), var(--cyan-500), var(--rose-500))',
          opacity: 0.8
        }} />

        {/* LEFT — Logo + Room pill */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
            <LogoIcon />
            <span className="text-gradient" style={{
              fontSize: '20px', fontWeight: '800', letterSpacing: '-0.5px',
            }}>CodeCollab</span>
          </div>

          {/* Room name pill */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '6px 14px', borderRadius: '10px',
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid var(--border-dim)',
          }}>
            <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', fontWeight: '700', letterSpacing: '1px' }}>ROOM</span>
            <span style={{ fontSize: '13px', fontWeight: '700', color: '#fff', fontFamily: 'JetBrains Mono, monospace' }}>
              {roomName}
            </span>
          </div>
        </div>

        {/* RIGHT — Tools & Profile */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>

          {/* History */}
          {onToggleHistory && (
            <button
              onClick={onToggleHistory}
              title="Code Timeline"
              className="btn-premium btn-ghost"
              style={{
                borderColor: showHistory ? 'var(--accent-success)' : 'var(--border-dim)',
                color: showHistory ? '#34d399' : '#94a3b8',
                background: showHistory ? 'rgba(16,185,129,0.08)' : 'rgba(255,255,255,0.03)',
              }}
            >
              <span style={{ fontSize: '16px' }}>🕒</span>
              <span style={{ fontSize: '13px' }}>History</span>
            </button>
          )}

          {/* Draw */}
          {onToggleWhiteboard && (
            <button
              onClick={onToggleWhiteboard}
              title="Collaborative Canvas"
              className="btn-premium btn-ghost"
              style={{
                borderColor: showWhiteboard ? 'var(--accent-secondary)' : 'var(--border-dim)',
                color: showWhiteboard ? 'var(--cyan-400)' : '#94a3b8',
                background: showWhiteboard ? 'rgba(6,182,212,0.08)' : 'rgba(255,255,255,0.03)',
              }}
            >
              <span style={{ fontSize: '16px' }}>🎨</span>
              <span style={{ fontSize: '13px' }}>Canvas</span>
            </button>
          )}

          {/* AI */}
          {onToggleAI && (
            <button
              onClick={onToggleAI}
              title="AI Assistant"
              className="btn-premium btn-ghost"
              style={{
                borderColor: showAI ? 'var(--accent-primary)' : 'var(--border-dim)',
                color: showAI ? '#a78bfa' : '#94a3b8',
                background: showAI ? 'rgba(124,58,237,0.1)' : 'rgba(255,255,255,0.03)',
              }}
            >
              <span style={{ fontSize: '16px' }}>🤖</span>
              <span style={{ fontSize: '13px' }}>AI</span>
            </button>
          )}

          {/* Chat */}
          {onToggleChat && (
            <button
              onClick={onToggleChat}
              title="Team Chat"
              className="btn-premium btn-ghost"
              style={{
                borderColor: showChat ? 'var(--rose-500)' : 'var(--border-dim)',
                color: showChat ? '#fb7185' : '#94a3b8',
                background: showChat ? 'rgba(244,63,94,0.08)' : 'rgba(255,255,255,0.03)',
              }}
            >
              <span style={{ fontSize: '16px' }}>💬</span>
              <span style={{ fontSize: '13px' }}>Chat</span>
            </button>
          )}

          <div style={{ width: '1px', height: '28px', background: 'var(--border-dim)', margin: '0 4px' }} />

          {/* Users button */}
          <button
            onClick={() => setShowUserList(v => !v)}
            className="btn-premium btn-ghost"
            style={{
              background: 'rgba(99,102,241,0.08)',
              borderColor: 'rgba(99,102,241,0.2)',
              color: '#818cf8'
            }}
          >
            <span>👥</span>
            <span>{userCount}</span>
          </button>

          {/* Profile Badge */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            padding: '6px 12px', borderRadius: '12px',
            background: 'var(--bg-panel)',
            border: '1px solid var(--border-dim)',
            boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.05)',
          }}>
            <div className="online-dot" />
            <span style={{ fontSize: '14px', fontWeight: '600', color: '#f1f5f9' }}>{username}</span>
            {isAdmin && (
              <span style={{
                fontSize: '10px', fontWeight: '800', padding: '2px 8px', borderRadius: '6px',
                background: 'linear-gradient(135deg, var(--violet-600), var(--indigo-600))',
                color: 'white', letterSpacing: '0.5px',
              }}>ADMIN</span>
            )}
          </div>

          {/* Leave button */}
          <button
            onClick={onLeave}
            className="btn-premium"
            style={{
              background: 'rgba(239,68,68,0.08)',
              border: '1px solid rgba(239,68,68,0.2)',
              color: '#f87171',
              padding: '8px 16px',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.15)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.08)' }}
          >
            Leave
          </button>
        </div>
      </header>

      {/* ── User List Panel (slides from top, full width) ── */}
      {showUserList && (
        <>
          {/* Backdrop */}
          <div
            onClick={() => setShowUserList(false)}
            style={{ position: 'fixed', inset: 0, zIndex: 40, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(2px)' }}
          />

          {/* Panel */}
          <div style={{
            position: 'fixed', top: '64px', left: '50%', transform: 'translateX(-50%)',
            width: '420px', borderRadius: '16px', overflow: 'hidden',
            background: '#0f0f1f', border: '1px solid rgba(168,85,247,0.25)',
            boxShadow: '0 32px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(168,85,247,0.1)',
            zIndex: 50, animation: 'fadeIn 0.2s ease',
          }}>
            {/* Panel header */}
            <div style={{
              padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              borderBottom: '1px solid rgba(255,255,255,0.07)',
              background: 'rgba(168,85,247,0.08)',
            }}>
              <div>
                <p style={{ color: '#a855f7', fontSize: '12px', fontWeight: '700', letterSpacing: '1px', textTransform: 'uppercase' }}>
                  Active Users
                </p>
                <p style={{ color: 'rgba(226,232,240,0.4)', fontSize: '13px', marginTop: '2px' }}>
                  {userCount} {userCount === 1 ? 'person' : 'people'} in this room
                  {isAdmin && ' · You are the admin'}
                </p>
              </div>
              <button
                onClick={() => setShowUserList(false)}
                style={{
                  width: '30px', height: '30px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)',
                  background: 'rgba(255,255,255,0.05)', color: 'rgba(226,232,240,0.6)',
                  fontSize: '16px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >×</button>
            </div>

            {/* User rows */}
            <div style={{ padding: '12px', maxHeight: '320px', overflowY: 'auto' }}>

              {/* Self row */}
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '12px 14px', borderRadius: '10px', marginBottom: '6px',
                background: 'rgba(168,85,247,0.08)', border: '1px solid rgba(168,85,247,0.15)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22c55e', flexShrink: 0 }} />
                  <span style={{ color: '#e2e8f0', fontWeight: '600', fontSize: '14px' }}>{username}</span>
                  <span style={{ color: 'rgba(226,232,240,0.35)', fontSize: '12px' }}>(You)</span>
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  {isAdmin && (
                    <span style={{
                      fontSize: '11px', fontWeight: '700', padding: '3px 10px', borderRadius: '6px',
                      background: 'rgba(168,85,247,0.2)', color: '#a855f7', border: '1px solid rgba(168,85,247,0.3)',
                    }}>Admin</span>
                  )}
                  <span style={{
                    fontSize: '11px', fontWeight: '700', padding: '3px 10px', borderRadius: '6px',
                    background: 'rgba(34,197,94,0.15)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.25)',
                  }}>✏️ Editing</span>
                </div>
              </div>

              {/* Other users */}
              {otherUsers.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '28px 0' }}>
                  <div style={{ fontSize: '32px', marginBottom: '8px' }}>👋</div>
                  <p style={{ color: 'rgba(226,232,240,0.4)', fontSize: '14px' }}>No other users yet</p>
                  <p style={{ color: 'rgba(226,232,240,0.25)', fontSize: '12px', marginTop: '4px' }}>
                    Share the room name to invite others
                  </p>
                </div>
              ) : (
                otherUsers.map(user => (
                  <div key={user.id} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '12px 14px', borderRadius: '10px', marginBottom: '6px',
                    background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22c55e', flexShrink: 0 }} />
                      <span style={{ color: '#e2e8f0', fontSize: '14px', fontWeight: '500' }}>{user.name}</span>
                    </div>

                    {isAdmin && onTogglePermission ? (
                      <button
                        onClick={() => onTogglePermission(user.id)}
                        style={{
                          padding: '6px 14px', borderRadius: '8px', cursor: 'pointer',
                          fontSize: '13px', fontWeight: '700', transition: 'all 0.2s',
                          ...(user.canEdit !== false
                            ? { background: 'rgba(34,197,94,0.15)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.3)' }
                            : { background: 'rgba(244,63,94,0.15)', color: '#f43f5e', border: '1px solid rgba(244,63,94,0.3)' }
                          ),
                        }}
                        onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.05)' }}
                        onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)' }}
                      >
                        {user.canEdit !== false ? '✏️ Can Edit' : '🔒 Read Only'}
                      </button>
                    ) : (
                      <span style={{
                        fontSize: '12px', fontWeight: '600', padding: '4px 10px', borderRadius: '6px',
                        background: user.canEdit !== false ? 'rgba(34,197,94,0.1)' : 'rgba(234,179,8,0.1)',
                        color: user.canEdit !== false ? '#22c55e' : '#eab308',
                        border: `1px solid ${user.canEdit !== false ? 'rgba(34,197,94,0.2)' : 'rgba(234,179,8,0.2)'}`,
                      }}>
                        {user.canEdit !== false ? '✏️ Editing' : '🔒 Viewing'}
                      </span>
                    )}
                  </div>
                ))
              )}
            </div>

            {isAdmin && otherUsers.length > 0 && (
              <div style={{
                padding: '12px 20px', borderTop: '1px solid rgba(255,255,255,0.07)',
                background: 'rgba(255,255,255,0.02)',
              }}>
                <p style={{ fontSize: '12px', color: 'rgba(226,232,240,0.3)', textAlign: 'center' }}>
                  Click a button to toggle edit access for that user
                </p>
              </div>
            )}
          </div>
        </>
      )}
    </>
  )
}
