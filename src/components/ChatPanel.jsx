import { useState, useEffect, useRef } from 'react'
import * as Y from 'yjs'
import { WebsocketProvider } from 'y-websocket'

function formatTime(isoString) {
  return new Date(isoString).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
}

const QUICK_EMOJIS = ['👍', '🎉', '🤔', '💡', '🔥', '✅']

export default function ChatPanel({ roomName, username }) {
  const [messages, setMessages] = useState([])
  const [inputMessage, setInputMessage] = useState('')

  const messagesEndRef = useRef(null)
  const ydocRef = useRef(null)
  const providerRef = useRef(null)
  const ymessagesRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    if (!roomName) return
    const ydocChat = new Y.Doc()
    ydocRef.current = ydocChat
    const WS_URL  = import.meta.env.VITE_WS_URL || 'ws://localhost:4000'
    const provider = new WebsocketProvider(WS_URL, `${roomName}-chat`, ydocChat)
    providerRef.current = provider
    const ymessages = ydocChat.getArray('messages')
    ymessagesRef.current = ymessages
    setMessages(ymessages.toArray())
    const observer = () => setMessages(ymessages.toArray())
    ymessages.observe(observer)
    return () => {
      ymessages.unobserve(observer)
      provider.destroy()
      ydocChat.destroy()
    }
  }, [roomName])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = (text) => {
    const trimmed = text.trim()
    if (!trimmed || !ymessagesRef.current) return
    ymessagesRef.current.push([{
      id: `${Date.now()}-${Math.random()}`,
      user: username,
      text: trimmed,
      timestamp: new Date().toISOString()
    }])
    setInputMessage('')
    inputRef.current?.focus()
  }

  const handleSubmit = (e) => { e.preventDefault(); sendMessage(inputMessage) }
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(inputMessage) }
  }

  return (
    <div style={{
      width: '300px',
      flexShrink: 0,
      display: 'flex',
      flexDirection: 'column',
      background: 'var(--bg-surface)',
      borderLeft: '1px solid var(--border-dim)',
    }}>

      {/* Header */}
      <div style={{
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 18px',
        background: 'rgba(244,63,94,0.05)',
        borderBottom: '1px solid var(--border-dim)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '28px', height: '28px', borderRadius: '8px', flexShrink: 0,
            background: 'linear-gradient(135deg, #e11d48, #fb7185)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '14px', boxShadow: '0 0 16px rgba(244,63,94,0.3)',
          }}>💬</div>
          <span style={{ color: '#fff', fontWeight: '700', fontSize: '14px' }}>Community</span>
        </div>
        <span style={{
          fontSize: '11px', fontWeight: '800', padding: '2px 8px', borderRadius: '12px',
          background: 'rgba(244,63,94,0.12)',
          color: '#fb7185', border: '1px solid rgba(244,63,94,0.2)',
        }}>{messages.length}</span>
      </div>

      {/* Messages area */}
      <div style={{
        flex: 1, overflowY: 'auto', padding: '16px',
        display: 'flex', flexDirection: 'column', gap: '12px',
      }}>
        {messages.length === 0 ? (
          <div style={{
            flex: 1, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            textAlign: 'center', padding: '40px 20px',
          }}>
            <div style={{ fontSize: '32px', marginBottom: '12px', opacity: 0.5 }}>⌨️</div>
            <p style={{ color: '#94a3b8', fontSize: '14px', fontWeight: '600' }}>No messages yet</p>
            <p style={{ color: '#475569', fontSize: '12px', marginTop: '4px' }}>Spark the conversation!</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.user === username
            return (
              <div key={msg.id} style={{
                display: 'flex', flexDirection: 'column',
                alignItems: isMe ? 'flex-end' : 'flex-start',
              }}>
                {!isMe && (
                  <span style={{ fontSize: '11px', fontWeight: '700', marginBottom: '4px', color: '#fb7185', opacity: 0.8 }}>
                    {msg.user}
                  </span>
                )}
                <div style={{
                  maxWidth: '90%', padding: '10px 14px', borderRadius: '16px',
                  fontSize: '13px', lineHeight: 1.5, wordBreak: 'break-word',
                  ...(isMe
                    ? { background: 'linear-gradient(135deg, var(--rose-500), #e11d48)', color: 'white', borderBottomRightRadius: '4px', boxShadow: '0 4px 15px rgba(244,63,94,0.2)' }
                    : { background: 'var(--bg-panel)', color: '#f1f5f9', borderBottomLeftRadius: '4px', border: '1px solid var(--border-dim)' }
                  ),
                }}>
                  {msg.text}
                </div>
                <span style={{ fontSize: '10px', marginTop: '4px', color: '#475569', opacity: 0.7 }}>
                  {formatTime(msg.timestamp)}
                </span>
              </div>
            )
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Emoji Row */}
      <div style={{
        flexShrink: 0,
        display: 'flex', gap: '6px',
        padding: '0 12px 12px 12px',
      }}>
        {QUICK_EMOJIS.map(emoji => (
          <button
            key={emoji}
            onClick={() => sendMessage(emoji)}
            className="btn-premium btn-ghost"
            style={{
              flex: 1, padding: '4px 0', border: '1px solid var(--border-dim)',
              fontSize: '14px'
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(244,63,94,0.1)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)' }}
          >
            {emoji}
          </button>
        ))}
      </div>

      {/* Input */}
      <div style={{ flexShrink: 0, padding: '12px', borderTop: '1px solid var(--border-dim)', background: 'rgba(0,0,0,0.1)' }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '10px' }}>
          <input
            ref={inputRef}
            type="text"
            value={inputMessage}
            onChange={e => setInputMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            maxLength={500}
            style={{
              flex: 1, padding: '10px 14px', borderRadius: '12px',
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid var(--border-standard)',
              color: '#f1f5f9', fontSize: '13px',
              outline: 'none', fontFamily: 'inherit',
            }}
            onFocus={e => { e.target.style.borderColor = 'var(--rose-500)'; e.target.style.background = 'rgba(255,255,255,0.05)' }}
            onBlur={e => { e.target.style.borderColor = 'var(--border-standard)'; e.target.style.background = 'rgba(255,255,255,0.03)' }}
          />
          <button
            type="submit"
            disabled={!inputMessage.trim()}
            className="btn-premium btn-primary"
            style={{
              width: '42px', height: '40px', padding: 0,
              background: 'linear-gradient(135deg, #e11d48, #fb7185)',
              opacity: inputMessage.trim() ? 1 : 0.3,
            }}
          >➤</button>
        </form>
      </div>
    </div>
  )
}
