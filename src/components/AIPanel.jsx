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
      width: '320px', flexShrink: 0, display: 'flex', flexDirection: 'column',
      background: 'var(--bg-surface)', borderLeft: '1px solid var(--border-dim)',
    }}>

      {/* Header */}
      <div style={{
        flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 18px',
        background: 'rgba(139,92,246,0.05)', borderBottom: '1px solid var(--border-dim)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '28px', height: '28px', borderRadius: '8px', flexShrink: 0,
            background: 'linear-gradient(135deg, var(--violet-600), #a78bfa)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px',
            boxShadow: '0 0 16px rgba(139,92,246,0.3)',
          }}>🤖</div>
          <span style={{ color: '#fff', fontWeight: '700', fontSize: '14px' }}>AI Expert</span>
        </div>
        {messages.length > 0 && (
          <button onClick={() => setMessages([])} className="btn-premium btn-ghost" style={{ padding: '2px 8px', fontSize: '10px' }}>
            Clear
          </button>
        )}
      </div>

      {/* Quick actions */}
      <div style={{
        flexShrink: 0, padding: '12px',
        borderBottom: '1px solid var(--border-dim)',
        display: 'flex', flexWrap: 'wrap', gap: '8px',
        background: 'rgba(0,0,0,0.1)'
      }}>
        {QUICK_ACTIONS.map(action => (
          <button
            key={action.label}
            onClick={() => handleQuickAction(action)}
            disabled={loading}
            className="btn-premium btn-ghost"
            style={{
              padding: '6px 12px', borderRadius: '10px',
              fontSize: '12px', fontWeight: '700',
              opacity: loading ? 0.5 : 1,
            }}
          >
            <span>{action.icon}</span>
            <span>{action.label}</span>
          </button>
        ))}
      </div>

      {/* Messages */}
      <div style={{
        flex: 1, overflowY: 'auto', padding: '16px',
        display: 'flex', flexDirection: 'column', gap: '16px',
      }}>
        {messages.length === 0 && !loading && (
          <div style={{
            flex: 1, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '30px 20px',
          }}>
            <div style={{ fontSize: '32px', marginBottom: '12px', opacity: 0.5 }}>⚡</div>
            <p style={{ color: '#94a3b8', fontSize: '14px', fontWeight: '600' }}>
              Intelligent Assistance
            </p>
            <p style={{ color: '#475569', fontSize: '12px', marginTop: '4px', lineHeight: 1.5 }}>
              I can explain logic, fix bugs, or optimize your code instantly.
            </p>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {/* Role label */}
            <span style={{
              fontSize: '10px', fontWeight: '800', letterSpacing: '0.05em',
              color: msg.role === 'user' ? 'var(--violet-400)' : msg.role === 'error' ? 'var(--accent-danger)' : 'var(--accent-secondary)',
            }}>
              {msg.role === 'user' ? 'YOU' : msg.role === 'error' ? 'ERROR' : 'CODECOLLAB AI'}
            </span>
            {/* Message bubble */}
            <div style={{
              padding: '12px 14px', borderRadius: '16px',
              fontSize: '13px', lineHeight: 1.6,
              ...(msg.role === 'user'
                ? { background: 'var(--bg-panel)', border: '1px solid var(--border-dim)', color: '#f1f5f9' }
                : msg.role === 'error'
                  ? { background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171' }
                  : { background: 'rgba(124,58,237,0.03)', border: '1px solid rgba(124,58,237,0.1)', color: '#f1f5f9' }
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <span style={{ fontSize: '10px', fontWeight: '800', color: 'var(--accent-secondary)' }}>CODECOLLAB AI</span>
            <div style={{
              padding: '14px', borderRadius: '16px',
              background: 'rgba(6,182,212,0.03)', border: '1px solid rgba(6,182,212,0.1)',
              display: 'flex', alignItems: 'center', gap: '12px',
            }}>
              <div style={{ display: 'flex', gap: '4px' }}>
                {[0, 1, 2].map(i => (
                  <div key={i} style={{
                    width: '6px', height: '6px', borderRadius: '50%',
                    background: 'var(--accent-secondary)',
                    animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite`,
                  }} />
                ))}
              </div>
              <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>Decoding...</span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ flexShrink: 0, padding: '12px', borderTop: '1px solid var(--border-dim)', background: 'rgba(0,0,0,0.1)' }}>
        <form onSubmit={(e) => { e.preventDefault(); send(input) }} style={{ display: 'flex', gap: '10px' }}>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Ask a question..."
            disabled={loading}
            style={{
              flex: 1, padding: '10px 14px', borderRadius: '12px',
              background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-standard)',
              color: '#f1f5f9', fontSize: '13px', outline: 'none',
              opacity: loading ? 0.6 : 1,
            }}
            onFocus={e => e.target.style.borderColor = 'var(--violet-500)'}
            onBlur={e => e.target.style.borderColor = 'var(--border-standard)'}
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="btn-premium btn-primary"
            style={{
              width: '42px', height: '40px', padding: 0,
              opacity: input.trim() && !loading ? 1 : 0.35,
            }}
          >➤</button>
        </form>
      </div>
    </div>
  )
}
