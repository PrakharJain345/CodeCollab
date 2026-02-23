import { useState, useRef, useCallback, useEffect } from 'react'

import JoinRoomModal from './components/JoinRoomModal'
import Header from './components/Header'
import VideoPanel from './components/VideoPanel'
import CodeEditor from './components/CodeEditor'
import ChatPanel from './components/ChatPanel'
import AIPanel from './components/AIPanel'
import Whiteboard from './components/Whiteboard'
import HistoryPanel from './components/HistoryPanel'
import ErrorBoundary from './components/ErrorBoundary'
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts'
import './index.css'

export default function App() {
  const [isJoined, setIsJoined] = useState(false)
  const [username, setUsername] = useState('')
  const [roomName, setRoomName] = useState('')
  const [isAdmin, setIsAdmin]   = useState(false)
  const [users, setUsers]       = useState([])

  // UI toggles
  const [showChat, setShowChat]           = useState(true)
  const [showAI, setShowAI]               = useState(false)
  const [showWhiteboard, setWhiteboard]   = useState(false)
  const [showHistory, setShowHistory]     = useState(false)
  const [language, setLanguage]           = useState('javascript')

  // History state
  const [snapshots, setSnapshots]   = useState([])
  const [historyIdx, setHistoryIdx] = useState(0)

  const codeEditorRef = useRef(null)

  const handleJoin = async (name, room, _clientAdmin, password = '') => {
    setUsername(name)
    setRoomName(room)

    // Register/join room on the backend — determines real admin status
    try {
      const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:4000'
      const API    = WS_URL.replace(/^ws/, 'http')  // ws→http, wss→https
      const res    = await fetch(`${API}/api/rooms/join`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ name: room, username: name, password }),
      })
      const data = await res.json()

      if (!res.ok) {
        // Wrong password or server error — surface the error
        alert(data.error || 'Failed to join room')
        return
      }

      const admin = data.isAdmin
      setIsAdmin(admin)

      if (admin && data.adminToken) {
        // Store raw admin token in localStorage for this room
        localStorage.setItem(`adminToken:${room}`, data.adminToken)
      }

      // ── PERSISTENCE: URL and Session ────────────────────────
      sessionStorage.setItem('cc-username', name)
      const url = new URL(window.location)
      url.searchParams.set('room', room)
      window.history.pushState({}, '', url)

    } catch {
      // Backend unreachable — fall back to client-side admin flag
      console.warn('Backend unreachable — running in offline mode')
      setIsAdmin(_clientAdmin)
    }

    setIsJoined(true)
  }

  // ── AUTO-JOIN ON REFRESH ──────────────────────────────────────
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const room   = params.get('room')
    const user   = sessionStorage.getItem('cc-username')

    if (room && user && !isJoined) {
      // Auto-join if we have the room in URL and username in session
      handleJoin(user, room, false)
    }
  }, []) // eslint-disable-line

  const handleLeave = () => {
    setIsJoined(false)
    setUsername('')
    setRoomName('')
    setIsAdmin(false)
    setUsers([])
  }

  const handleUsersChange = useCallback((updatedUsers) => {
    setUsers(updatedUsers)
  }, [])

  const handleTogglePermission = useCallback((userId) => {
    // Just delegate to the editor, which now manages the persistent Y.Map
    codeEditorRef.current?.syncPermission?.(userId)
  }, [])

  // Provide current editor code to AIPanel
  const getEditorCode = useCallback(() => {
    return codeEditorRef.current?.getCode?.() || ''
  }, [])

  // Subscribe to history snapshots from CodeEditor
  useEffect(() => {
    // Give the editor time to mount and connect
    const timer = setTimeout(() => {
      const unsubscribe = codeEditorRef.current?.subscribeHistory?.(() => {
        const snaps = codeEditorRef.current?.getHistory?.() || []
        setSnapshots([...snaps])
        setHistoryIdx(snaps.length - 1)
      })
      return unsubscribe
    }, 1500)
    return () => clearTimeout(timer)
  }, [isJoined])

  // Permissions are now baked into the users array from CodeEditor
  const enrichedUsers = users 

  useKeyboardShortcuts({
    onToggleChat: () => setShowChat(v => !v),
  })

  if (!isJoined) return <JoinRoomModal onJoin={handleJoin} />

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-base)', overflow: 'hidden' }}>
      <ErrorBoundary>
        <Header
          roomName={roomName}
          username={username}
          userCount={users.length + 1}
          isAdmin={isAdmin}
          users={enrichedUsers}
          showChat={showChat}
          showAI={showAI}
          showWhiteboard={showWhiteboard}
          showHistory={showHistory}
          onToggleChat={() => setShowChat(v => !v)}
          onToggleAI={() => setShowAI(v => !v)}
          onToggleWhiteboard={() => setWhiteboard(v => !v)}
          onToggleHistory={() => setShowHistory(v => !v)}
          onTogglePermission={isAdmin ? handleTogglePermission : undefined}
          onLeave={handleLeave}
        />
      </ErrorBoundary>

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <ErrorBoundary>
          <VideoPanel roomName={roomName} username={username} />
        </ErrorBoundary>

        <ErrorBoundary>
          <CodeEditor
            ref={codeEditorRef}
            roomName={roomName}
            username={username}
            onUsersChange={handleUsersChange}
            onLanguageChange={setLanguage}
          />
        </ErrorBoundary>

        {showHistory && (
          <ErrorBoundary>
            <HistoryPanel
              snapshots={snapshots}
              currentIdx={historyIdx}
              onRestore={(idx) => {
                const snap = snapshots[idx]
                if (snap) {
                  codeEditorRef.current?.restoreSnapshot?.(snap.content)
                  setHistoryIdx(idx)
                }
              }}
            />
          </ErrorBoundary>
        )}

        {showWhiteboard && (
          <ErrorBoundary>
            <Whiteboard roomName={roomName} username={username} />
          </ErrorBoundary>
        )}

        {showChat && (
          <ErrorBoundary>
            <ChatPanel roomName={roomName} username={username} />
          </ErrorBoundary>
        )}

        {showAI && (
          <ErrorBoundary>
            <AIPanel getCode={getEditorCode} language={language} />
          </ErrorBoundary>
        )}
      </div>

      {/* Keyboard shortcuts hint bar */}
      <div style={{
        flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '24px',
        padding: '4px 20px',
        background: 'rgba(0,0,0,0.4)', borderTop: '1px solid rgba(255,255,255,0.04)',
        fontSize: '11px', color: 'rgba(226,232,240,0.2)',
      }}>
        {[['Ctrl+Shift+C', 'Toggle Chat'], ['Ctrl+Enter', 'Run Code'], ['Esc', 'Close panels']].map(([key, label]) => (
          <span key={key} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <kbd style={{
              padding: '1px 5px', borderRadius: '4px', fontSize: '10px',
              background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)',
              color: 'rgba(226,232,240,0.4)', fontFamily: 'JetBrains Mono, monospace',
            }}>{key}</kbd>
            <span>{label}</span>
          </span>
        ))}
      </div>
    </div>
  )
}
