import { useState, useRef, useEffect } from 'react'

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions'
const GROQ_MODEL = 'llama-3.3-70b-versatile'

const QUICK_ACTIONS = [
  { icon: '🔍', label: 'Explain', prompt: (code, lang) => `Explain this ${lang} code clearly and concisely:\n\`\`\`${lang}\n${code}\n\`\`\`` },
  { icon: '🐛', label: 'Fix bugs', prompt: (code, lang) => `Find and fix bugs in this ${lang} code. Show the corrected code and explain what was wrong:\n\`\`\`${lang}\n${code}\n\`\`\`` },
  { icon: '⚡', label: 'Optimize', prompt: (code, lang) => `Optimize this ${lang} code for performance and readability. Show improvements and explain why:\n\`\`\`${lang}\n${code}\n\`\`\`` },
  { icon: '🧪', label: 'Write tests', prompt: (code, lang) => `Write comprehensive unit tests for this ${lang} code:\n\`\`\`${lang}\n${code}\n\`\`\`` },
  { icon: '📝', label: 'Add comments', prompt: (code, lang) => `Add clear, helpful comments to this ${lang} code:\n\`\`\`${lang}\n${code}\n\`\`\`` },
]

function formatMarkdown(text) {
  // Minimal markdown rendering: code blocks, bold, inline code
  return text
    .replace(/```[\w]*\n?([\s\S]*?)```/g, (_, code) =>
      `<pre style="background:rgba(168,85,247,0.08);border:1px solid rgba(168,85,247,0.2);border-radius:8px;padding:10px 12px;margin:8px 0;overflow-x:auto;font-family:'JetBrains Mono',monospace;font-size:12px;color:#e2e8f0;white-space:pre-wrap">${code.trim()}</pre>`
    )
    .replace(/`([^`]+)`/g, '<code style="background:rgba(255,255,255,0.1);padding:2px 5px;border-radius:4px;font-family:\'JetBrains Mono\',monospace;font-size:12px;color:#a855f7">$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong style="color:#e2e8f0">$1</strong>')
    .replace(/\n/g, '<br/>')
}

async function askGroq(messages) {
  const res = await fetch(GROQ_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: messages,
      temperature: 0.7,
      max_tokens: 2048,
    }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err?.error?.message || `API error ${res.status}`)
  }
  const data = await res.json()
  return data.choices?.[0]?.message?.content || '(no response)'
}

export default function AIPanel({ getCode, language }) {
  const [messages, setMessages] = useState([])
  const [input, setInput]       = useState('')
  const [loading, setLoading]   = useState(false)
  const bottomRef = useRef(null)
  const inputRef  = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const send = async (prompt, isQuickAction = false) => {
    if (!prompt.trim() || loading) return
    const userMsg = { role: 'user', text: prompt }
    setMessages(prev => [...prev, userMsg])
    if (!isQuickAction) setInput('')
    setLoading(true)

    try {
      const code = getCode?.() || ''
      const systemContext = `You are a helpful coding assistant. 
Current Language: ${language}
Current Code in Editor:
\`\`\`${language}
${code}
\`\`\`
Always refer to this code context when answering questions.`

      // Build message combined with history for context
      const apiMessages = [
        { role: 'system', content: systemContext },
        ...messages.map(m => ({
          role: m.role === 'ai' ? 'assistant' : 'user',
          content: m.text
        })),
        { role: 'user', content: prompt }
      ]

      const reply = await askGroq(apiMessages)
      setMessages(prev => [...prev, { role: 'ai', text: reply }])
    } catch (err) {
      setMessages(prev => [...prev, { role: 'error', text: err.message }])
    } finally {
      setLoading(false)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }

  const handleQuickAction = (action) => {
    const code = getCode?.() || ''
    if (!code.trim()) {
      send(`(no code in editor yet)`)
      return
    }
    // For quick actions, we send the specific prompt instead of relying on the system injection alone
    // but the system context will still be there to reinforce it.
    send(action.prompt(code, language), true)
  }

  if (!GROQ_API_KEY) {
    return (
      <div style={{
        width: '300px', flexShrink: 0, display: 'flex', flexDirection: 'column',
        background: '#0c0c1e', borderLeft: '1px solid rgba(255,255,255,0.06)',
      }}>
        {/* Header */}
        <div style={{
          flexShrink: 0, display: 'flex', alignItems: 'center', gap: '8px',
          padding: '10px 16px',
          background: 'rgba(168,85,247,0.08)', borderBottom: '1px solid rgba(168,85,247,0.18)',
        }}>
          <div style={{
            width: '28px', height: '28px', borderRadius: '8px', flexShrink: 0,
            background: 'linear-gradient(135deg, #5b21b6, #a855f7)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px',
            boxShadow: '0 0 12px rgba(168,85,247,0.4)',
          }}>🤖</div>
          <span style={{ color: '#fff', fontWeight: '700', fontSize: '14px' }}>AI Assistant</span>
        </div>
        {/* Setup prompt */}
        <div style={{
          flex: 1, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          padding: '24px', textAlign: 'center',
        }}>
          <div style={{
            width: '48px', height: '48px', borderRadius: '14px', marginBottom: '16px',
            background: 'rgba(168,85,247,0.12)', border: '1px solid rgba(168,85,247,0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px',
          }}>🔑</div>
          <p style={{ color: '#e2e8f0', fontWeight: '700', fontSize: '14px', marginBottom: '8px' }}>Gemini API key needed</p>
          <p style={{ color: 'rgba(226,232,240,0.45)', fontSize: '12px', lineHeight: 1.6, marginBottom: '16px' }}>
            Get a free key at{' '}
            <a href="https://console.groq.com" target="_blank" rel="noreferrer"
              style={{ color: '#a855f7', textDecoration: 'underline' }}>console.groq.com</a>
            {' '}then add to your <code style={{ padding: '1px 5px', borderRadius: '4px', background: 'rgba(255,255,255,0.08)', fontSize: '11px' }}>.env</code>:
          </p>
          <div style={{
            width: '100%', padding: '10px 14px', borderRadius: '8px',
            background: 'rgba(168,85,247,0.08)', border: '1px solid rgba(168,85,247,0.2)',
            fontFamily: 'JetBrains Mono, monospace', fontSize: '11px',
            color: '#a855f7', textAlign: 'left', userSelect: 'all',
          }}>
            VITE_GROQ_API_KEY=gsk_...
          </div>
          <p style={{ color: 'rgba(226,232,240,0.3)', fontSize: '11px', marginTop: '10px' }}>Then restart dev server.</p>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      width: '300px', flexShrink: 0, display: 'flex', flexDirection: 'column',
      background: '#0c0c1e', borderLeft: '1px solid rgba(255,255,255,0.06)',
    }}>

      {/* Header */}
      <div style={{
        flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px 16px',
        background: 'rgba(168,85,247,0.08)', borderBottom: '1px solid rgba(168,85,247,0.18)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '28px', height: '28px', borderRadius: '8px', flexShrink: 0,
            background: 'linear-gradient(135deg, #5b21b6, #a855f7)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px',
            boxShadow: '0 0 12px rgba(168,85,247,0.4)',
          }}>🤖</div>
          <span style={{ color: '#fff', fontWeight: '700', fontSize: '14px' }}>AI Assistant</span>
        </div>
        {messages.length > 0 && (
          <button onClick={() => setMessages([])} style={{
            padding: '3px 9px', borderRadius: '6px', border: 'none', cursor: 'pointer',
            background: 'rgba(255,255,255,0.06)', color: 'rgba(226,232,240,0.45)', fontSize: '11px',
          }}>Clear</button>
        )}
      </div>

      {/* Quick actions */}
      <div style={{
        flexShrink: 0, padding: '10px 12px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        display: 'flex', flexWrap: 'wrap', gap: '6px',
      }}>
        {QUICK_ACTIONS.map(action => (
          <button
            key={action.label}
            onClick={() => handleQuickAction(action)}
            disabled={loading}
            style={{
              display: 'flex', alignItems: 'center', gap: '4px',
              padding: '5px 10px', borderRadius: '8px', cursor: 'pointer',
              background: 'rgba(168,85,247,0.1)', border: '1px solid rgba(168,85,247,0.2)',
              color: '#c4b5fd', fontSize: '12px', fontWeight: '600',
              transition: 'all 0.15s', opacity: loading ? 0.5 : 1,
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(168,85,247,0.22)'; e.currentTarget.style.borderColor = 'rgba(168,85,247,0.5)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(168,85,247,0.1)'; e.currentTarget.style.borderColor = 'rgba(168,85,247,0.2)' }}
          >
            <span>{action.icon}</span>
            <span>{action.label}</span>
          </button>
        ))}
      </div>

      {/* Messages */}
      <div style={{
        flex: 1, overflowY: 'auto', padding: '12px',
        display: 'flex', flexDirection: 'column', gap: '12px',
      }}>
        {messages.length === 0 && !loading && (
          <div style={{
            flex: 1, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '30px 16px',
          }}>
            <div style={{ fontSize: '36px', marginBottom: '10px' }}>🤖</div>
            <p style={{ color: 'rgba(226,232,240,0.4)', fontSize: '14px', fontWeight: '500' }}>
              Ask me anything about your code
            </p>
            <p style={{ color: 'rgba(226,232,240,0.25)', fontSize: '12px', marginTop: '4px', lineHeight: 1.5 }}>
              Use quick actions above or type a custom question below
            </p>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {/* Role label */}
            <span style={{
              fontSize: '11px', fontWeight: '700',
              color: msg.role === 'user' ? '#a855f7' : msg.role === 'error' ? '#f87171' : '#06b6d4',
            }}>
              {msg.role === 'user' ? '👤 You' : msg.role === 'error' ? '⚠️ Error' : '🤖 Gemini'}
            </span>
            {/* Message bubble */}
            <div style={{
              padding: '10px 12px', borderRadius: '10px',
              fontSize: '13px', lineHeight: 1.6,
              ...(msg.role === 'user'
                ? { background: 'rgba(168,85,247,0.12)', border: '1px solid rgba(168,85,247,0.2)', color: '#e2e8f0' }
                : msg.role === 'error'
                  ? { background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)', color: '#f87171' }
                  : { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', color: '#e2e8f0' }
              ),
            }}>
              {msg.role === 'ai'
                ? <div dangerouslySetInnerHTML={{ __html: formatMarkdown(msg.text) }} />
                : <span style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{msg.text}</span>
              }
            </div>
          </div>
        ))}

        {/* Loading indicator */}
        {loading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontSize: '11px', fontWeight: '700', color: '#06b6d4' }}>🤖 Gemini</span>
            <div style={{
              padding: '12px', borderRadius: '10px',
              background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)',
              display: 'flex', alignItems: 'center', gap: '10px',
            }}>
              <div style={{ display: 'flex', gap: '4px' }}>
                {[0, 1, 2].map(i => (
                  <div key={i} style={{
                    width: '7px', height: '7px', borderRadius: '50%',
                    background: '#a855f7',
                    animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite`,
                  }} />
                ))}
              </div>
              <span style={{ fontSize: '12px', color: 'rgba(226,232,240,0.45)' }}>Thinking...</span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ flexShrink: 0, padding: '10px 12px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <form onSubmit={(e) => { e.preventDefault(); send(input) }} style={{ display: 'flex', gap: '8px' }}>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Ask about your code..."
            disabled={loading}
            style={{
              flex: 1, padding: '9px 13px', borderRadius: '10px',
              background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(168,85,247,0.25)',
              color: '#e2e8f0', fontSize: '13px', outline: 'none', fontFamily: 'Inter, sans-serif',
              opacity: loading ? 0.6 : 1,
            }}
            onFocus={e => { e.target.style.border = '1px solid rgba(168,85,247,0.6)'; e.target.style.boxShadow = '0 0 0 3px rgba(168,85,247,0.1)' }}
            onBlur={e => { e.target.style.border = '1px solid rgba(168,85,247,0.25)'; e.target.style.boxShadow = 'none' }}
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            style={{
              padding: '9px 14px', borderRadius: '10px', border: 'none', cursor: 'pointer',
              background: 'linear-gradient(135deg, #5b21b6, #a855f7)',
              color: '#fff', fontWeight: '700', fontSize: '15px',
              boxShadow: input.trim() && !loading ? '0 0 14px rgba(168,85,247,0.4)' : 'none',
              opacity: input.trim() && !loading ? 1 : 0.35, transition: 'all 0.2s',
            }}
          >➤</button>
        </form>
      </div>
    </div>
  )
}
