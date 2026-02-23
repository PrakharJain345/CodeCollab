import { useState } from 'react'

export default function Header({ roomName, username, userCount, isAdmin, users = [], showChat, onToggleChat, showAI, onToggleAI, showWhiteboard, onToggleWhiteboard, showHistory, onToggleHistory, onTogglePermission, onLeave }) {


  const [showUserList, setShowUserList] = useState(false)

  const otherUsers = users.filter(u => u.name !== username)

  return (
    <>
      {/* ── Main Header Bar ─────────────────────────────── */}
      <header style={{
        height: '64px',
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        background: 'linear-gradient(90deg, #0a001f 0%, #080c1f 50%, #0a0013 100%)',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        position: 'relative',
        zIndex: 50,
      }}>
        {/* Rainbow top line */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: '2px',
          background: 'linear-gradient(90deg, #7c3aed, #06b6d4, #ec4899)',
        }} />

        {/* LEFT — Logo + Room pill */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '34px', height: '34px', borderRadius: '10px', flexShrink: 0,
              background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '18px', boxShadow: '0 0 16px rgba(168,85,247,0.5)',
            }}>⚡</div>
            <span style={{
              fontSize: '18px', fontWeight: '800', letterSpacing: '-0.4px',
              background: 'linear-gradient(90deg, #a855f7, #06b6d4)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>CodeCollab</span>
          </div>

          {/* Room name pill */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '6px 14px', borderRadius: '8px',
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
          }}>
            <span style={{ fontSize: '11px', color: 'rgba(226,232,240,0.4)', fontWeight: '600', letterSpacing: '0.8px' }}>ROOM</span>
            <span style={{ fontSize: '13px', fontWeight: '700', color: '#e2e8f0', fontFamily: 'JetBrains Mono, monospace' }}>
              {roomName}
            </span>
          </div>
        </div>

        {/* RIGHT — Users button + username + leave */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>

          {/* History toggle button */}
          {onToggleHistory && (
            <button
              onClick={onToggleHistory}
              title="Toggle Code History"
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '8px 14px', borderRadius: '8px', cursor: 'pointer',
                background: showHistory ? 'rgba(34,197,94,0.15)' : 'rgba(255,255,255,0.05)',
                border: `1px solid ${showHistory ? 'rgba(34,197,94,0.5)' : 'rgba(255,255,255,0.1)'}`,
                color: showHistory ? '#22c55e' : 'rgba(226,232,240,0.4)',
                fontSize: '14px', fontWeight: '700',
                boxShadow: showHistory ? '0 0 16px rgba(34,197,94,0.25)' : 'none',
                transition: 'all 0.2s',
              }}
            >
              <span>📜</span>
              <span style={{ fontSize: '12px' }}>History</span>
            </button>
          )}

          {/* Whiteboard toggle button */}
          {onToggleWhiteboard && (
            <button
              onClick={onToggleWhiteboard}
              title="Toggle Whiteboard"
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '8px 14px', borderRadius: '8px', cursor: 'pointer',
                background: showWhiteboard ? 'rgba(6,182,212,0.18)' : 'rgba(255,255,255,0.05)',
                border: `1px solid ${showWhiteboard ? 'rgba(6,182,212,0.5)' : 'rgba(255,255,255,0.1)'}`,
                color: showWhiteboard ? '#06b6d4' : 'rgba(226,232,240,0.4)',
                fontSize: '14px', fontWeight: '700',
                boxShadow: showWhiteboard ? '0 0 16px rgba(6,182,212,0.25)' : 'none',
                transition: 'all 0.2s',
              }}
            >
              <span>🎨</span>
              <span style={{ fontSize: '12px' }}>Draw</span>
            </button>
          )}

          {/* AI toggle button */}
          {onToggleAI && (
            <button
              onClick={onToggleAI}
              title="Toggle AI Assistant"
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '8px 14px', borderRadius: '8px', cursor: 'pointer',
                background: showAI ? 'rgba(168,85,247,0.2)' : 'rgba(255,255,255,0.05)',
                border: `1px solid ${showAI ? 'rgba(168,85,247,0.5)' : 'rgba(255,255,255,0.1)'}`,
                color: showAI ? '#a855f7' : 'rgba(226,232,240,0.4)',
                fontSize: '14px', fontWeight: '700',
                boxShadow: showAI ? '0 0 16px rgba(168,85,247,0.3)' : 'none',
                transition: 'all 0.2s',
              }}
            >
              <span>🤖</span>
              <span style={{ fontSize: '12px' }}>AI</span>
            </button>
          )}


          {/* Chat toggle button */}
          {onToggleChat && (
            <button
              onClick={onToggleChat}
              title="Toggle Chat (Ctrl+Shift+C)"
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '8px 14px', borderRadius: '8px', cursor: 'pointer',
                background: showChat ? 'rgba(236,72,153,0.15)' : 'rgba(255,255,255,0.05)',
                border: `1px solid ${showChat ? 'rgba(236,72,153,0.4)' : 'rgba(255,255,255,0.1)'}`,
                color: showChat ? '#ec4899' : 'rgba(226,232,240,0.4)',
                fontSize: '14px', fontWeight: '700',
                boxShadow: showChat ? '0 0 16px rgba(236,72,153,0.2)' : 'none',
                transition: 'all 0.2s',
              }}
            >
              <span>💬</span>
              <span style={{ fontSize: '12px' }}>Chat</span>
            </button>
          )}

          {/* Users button */}
          <button
            onClick={() => setShowUserList(v => !v)}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '8px 16px', borderRadius: '8px', cursor: 'pointer',
              background: showUserList ? 'rgba(6,182,212,0.2)' : 'rgba(6,182,212,0.1)',
              border: `1px solid ${showUserList ? 'rgba(6,182,212,0.5)' : 'rgba(6,182,212,0.25)'}`,
              color: '#06b6d4', fontSize: '14px', fontWeight: '700',
              boxShadow: showUserList ? '0 0 20px rgba(6,182,212,0.3)' : 'none',
              transition: 'all 0.2s',
            }}
          >
            <span>👥</span>
            <span>{userCount} online</span>
          </button>

          {/* Username + admin badge */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '8px 14px', borderRadius: '8px',
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.08)',
          }}>
            {/* Pulse dot */}
            <div style={{ position: 'relative', width: '8px', height: '8px', flexShrink: 0 }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22c55e' }} />
            </div>
            <span style={{ fontSize: '14px', fontWeight: '600', color: '#e2e8f0' }}>{username}</span>
            {isAdmin && (
              <span style={{
                fontSize: '11px', fontWeight: '800', padding: '2px 8px', borderRadius: '6px',
                background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
                color: 'white', letterSpacing: '0.5px',
              }}>ADMIN</span>
            )}
          </div>

          {/* Leave button */}
          <button
            onClick={onLeave}
            style={{
              padding: '8px 18px', borderRadius: '8px', cursor: 'pointer',
              background: 'rgba(244,63,94,0.15)',
              border: '1px solid rgba(244,63,94,0.35)',
              color: '#f43f5e', fontSize: '14px', fontWeight: '700',
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(244,63,94,0.3)'; e.currentTarget.style.boxShadow = '0 0 18px rgba(244,63,94,0.35)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(244,63,94,0.15)'; e.currentTarget.style.boxShadow = 'none' }}
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
