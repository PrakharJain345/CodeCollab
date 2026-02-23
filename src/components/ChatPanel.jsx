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
      width: '280px',
      flexShrink: 0,
      display: 'flex',
      flexDirection: 'column',
      background: '#0c0c1e',
      borderLeft: '1px solid rgba(255,255,255,0.06)',
    }}>

      {/* Header */}
      <div style={{
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '10px 16px',
        background: 'rgba(236,72,153,0.08)',
        borderBottom: '1px solid rgba(236,72,153,0.18)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '28px', height: '28px', borderRadius: '8px', flexShrink: 0,
            background: 'linear-gradient(135deg, #be185d, #ec4899)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '14px', boxShadow: '0 0 12px rgba(236,72,153,0.4)',
          }}>💬</div>
          <span style={{ color: '#fff', fontWeight: '700', fontSize: '14px' }}>Chat</span>
        </div>
        <span style={{
          fontSize: '12px', fontWeight: '700', padding: '3px 9px', borderRadius: '20px',
          background: 'rgba(236,72,153,0.15)',
          color: '#ec4899', border: '1px solid rgba(236,72,153,0.25)',
        }}>{messages.length}</span>
      </div>

      {/* Messages area */}
      <div style={{
        flex: 1, overflowY: 'auto', padding: '12px',
        display: 'flex', flexDirection: 'column', gap: '10px',
      }}>
        {messages.length === 0 ? (
          <div style={{
            flex: 1, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            textAlign: 'center', padding: '40px 16px',
          }}>
            <div style={{ fontSize: '36px', marginBottom: '10px' }}>💬</div>
            <p style={{ color: 'rgba(226,232,240,0.4)', fontSize: '14px', fontWeight: '500' }}>No messages yet</p>
            <p style={{ color: 'rgba(226,232,240,0.25)', fontSize: '12px', marginTop: '4px' }}>Be the first to say hi! 👋</p>
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
                  <span style={{ fontSize: '11px', fontWeight: '700', marginBottom: '4px', color: '#ec4899', paddingLeft: '2px' }}>
                    {msg.user}
                  </span>
                )}
                <div style={{
                  maxWidth: '85%', padding: '8px 12px', borderRadius: '14px',
                  fontSize: '13px', lineHeight: 1.5, wordBreak: 'break-word',
                  ...(isMe
                    ? { background: 'linear-gradient(135deg, #be185d, #ec4899)', color: 'white', borderBottomRightRadius: '4px', boxShadow: '0 4px 14px rgba(236,72,153,0.3)' }
                    : { background: 'rgba(255,255,255,0.07)', color: '#e2e8f0', borderBottomLeftRadius: '4px', border: '1px solid rgba(255,255,255,0.08)' }
                  ),
                }}>
                  {msg.text}
                </div>
                <span style={{ fontSize: '11px', marginTop: '3px', color: 'rgba(226,232,240,0.3)', padding: '0 2px' }}>
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
        display: 'flex', gap: '4px',
        padding: '8px 12px',
        borderTop: '1px solid rgba(255,255,255,0.06)',
      }}>
        {QUICK_EMOJIS.map(emoji => (
          <button
            key={emoji}
            onClick={() => sendMessage(emoji)}
            style={{
              flex: 1, padding: '6px 0', borderRadius: '8px', cursor: 'pointer',
              fontSize: '14px', background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.08)', transition: 'background 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(236,72,153,0.15)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)' }}
          >
            {emoji}
          </button>
        ))}
      </div>

      {/* Input */}
      <div style={{ flexShrink: 0, padding: '10px 12px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '8px' }}>
          <input
            ref={inputRef}
            type="text"
            value={inputMessage}
            onChange={e => setInputMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            maxLength={500}
            style={{
              flex: 1, padding: '9px 13px', borderRadius: '10px',
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(236,72,153,0.25)',
              color: '#e2e8f0', fontSize: '13px',
              outline: 'none', fontFamily: 'Inter, sans-serif',
            }}
            onFocus={e => { e.target.style.border = '1px solid rgba(236,72,153,0.6)'; e.target.style.boxShadow = '0 0 0 3px rgba(236,72,153,0.1)' }}
            onBlur={e => { e.target.style.border = '1px solid rgba(236,72,153,0.25)'; e.target.style.boxShadow = 'none' }}
          />
          <button
            type="submit"
            disabled={!inputMessage.trim()}
            style={{
              padding: '9px 14px', borderRadius: '10px', border: 'none', cursor: 'pointer',
              background: 'linear-gradient(135deg, #be185d, #ec4899)',
              color: '#fff', fontWeight: '700', fontSize: '15px',
              boxShadow: inputMessage.trim() ? '0 0 14px rgba(236,72,153,0.4)' : 'none',
              opacity: inputMessage.trim() ? 1 : 0.4,
              transition: 'all 0.2s',
            }}
          >➤</button>
        </form>
      </div>
    </div>
  )
}
