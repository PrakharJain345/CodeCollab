import Editor from '@monaco-editor/react'
import * as Y from 'yjs'
import { WebsocketProvider } from 'y-websocket'
import { MonacoBinding } from 'y-monaco'
import { useEffect, useRef, useState, useCallback, forwardRef, useImperativeHandle } from 'react'
import { Terminal } from 'xterm'
import { FitAddon } from 'xterm-addon-fit'
import 'xterm/css/xterm.css'

function getRandomColor() {
  const colors = ['#a855f7', '#06b6d4', '#ec4899', '#22c55e', '#f59e0b', '#3b82f6', '#14b8a6']
  return colors[Math.floor(Math.random() * colors.length)]
}

const LANGUAGES = [
  { value: 'javascript', label: 'JavaScript', icon: 'JS' },
  { value: 'typescript', label: 'TypeScript', icon: 'TS' },
  { value: 'python',     label: 'Python',     icon: 'PY' },
  { value: 'java',       label: 'Java',        icon: 'JV' },
  { value: 'cpp',        label: 'C++',         icon: 'C+' },
  { value: 'html',       label: 'HTML',        icon: 'HT' },
  { value: 'css',        label: 'CSS',         icon: 'CS' },
  { value: 'json',       label: 'JSON',        icon: 'JS' },
]

// Wandbox compiler IDs (free, no auth)
const WANDBOX_COMPILERS = {
  typescript: 'typescript-5.2.2',
  python:     'cpython-3.11.0',
  java:       'openjdk-head',
  cpp:        'gcc-head',
}

// Languages that can be executed
const EXECUTABLE = new Set(['javascript', 'typescript', 'python', 'java', 'cpp'])

// ── JavaScript: run in-browser, capture console output ─────────────────────
function runJavaScriptInBrowser(code) {
  const logs = []
  const origLog   = console.log
  const origError = console.error
  const origWarn  = console.warn

  console.log   = (...a) => logs.push(a.map(v => typeof v === 'object' ? JSON.stringify(v, null, 2) : String(v)).join(' '))
  console.error = (...a) => logs.push('[error] ' + a.map(String).join(' '))
  console.warn  = (...a) => logs.push('[warn]  ' + a.map(String).join(' '))

  let stderr = ''
  try {
    // eslint-disable-next-line no-new-func
    new Function(code)()
  } catch (e) {
    stderr = e.toString()
  } finally {
    console.log   = origLog
    console.error = origError
    console.warn  = origWarn
  }

  return {
    stdout: logs.join('\n'),
    stderr,
    exitCode: stderr ? 1 : 0,
    language: 'javascript',
    version: 'Browser (V8)',
  }
}

// ── Other languages: Wandbox (free, no auth required) ──────────────────────
async function runWithWandbox(language, code, attempt = 1) {
  const compiler = WANDBOX_COMPILERS[language]
  if (!compiler) throw new Error(`${language} is not supported for execution.`)

  let res
  try {
    res = await fetch('https://wandbox.org/api/compile.json', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, compiler, save: false }),
    })
  } catch {
    throw new Error('Network error — check your internet connection.')
  }

  // Retry once on transient server errors (500/503)
  if ((res.status === 500 || res.status === 503) && attempt < 3) {
    await new Promise(r => setTimeout(r, 1200 * attempt))
    return runWithWandbox(language, code, attempt + 1)
  }

  if (!res.ok) throw new Error(`Execution service error (${res.status}). Please try again.`)

  const data = await res.json()

  const compErr = data.compiler_error || ''
  const stderr  = compErr + (compErr && data.program_error ? '\n' : '') + (data.program_error || '')
  const stdout  = data.program_output || ''
  const exitCode = parseInt(data.status ?? (stderr && !stdout ? '1' : '0'), 10)

  return { stdout, stderr, exitCode, language, version: compiler }
}


// ── Main execution dispatcher ───────────────────────────────────────────────
async function executeCode(language, code) {
  if (!EXECUTABLE.has(language)) throw new Error(`${language.toUpperCase()} cannot be executed.`)

  // Try calling the backend executor first
  try {
    const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:4000'
    const API    = WS_URL.replace(/^ws/, 'http')
    const res    = await fetch(`${API}/api/execute`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ language, code }),
    })
    if (res.ok) {
        const data = await res.json()
        if (data.error) throw new Error(data.error)
        return data
    }
  } catch (err) {
    console.warn('Backend execution failed, falling back to client-side/wandbox:', err.message)
  }

  // Fallback
  if (language === 'javascript') return runJavaScriptInBrowser(code)
  return runWithWandbox(language, code)
}



const CodeEditor = forwardRef(function CodeEditor({ roomName, username, onUsersChange, onLanguageChange }, ref) {
  const [language, setLanguage] = useState('javascript')
  const handleLanguageChange = (lang) => {
    setLanguage(lang)
    setOutput(null)
    onLanguageChange?.(lang)
    // persist language to current file metadata
    const filesMap = filesMapRef.current
    if (filesMap && activeFileIdRef.current) {
      const cur = filesMap.get(activeFileIdRef.current) || {}
      filesMap.set(activeFileIdRef.current, { ...cur, language: lang })
    }
  }
  const [isReady, setIsReady]             = useState(false)
  const [connectionStatus, setConn]       = useState('connecting')
  const [canEdit, setCanEdit]             = useState(true)
  const [permToast, setPermToast]         = useState(null)
  const lastPermUpdateRef                 = useRef(0)

  // File Tabs state
  const [files, setFiles]               = useState([{ id: 'main', name: 'main.js', language: 'javascript' }])
  const [activeFileId, setActiveFileId] = useState('main')

  // Execution state
  const [isRunning, setIsRunning]   = useState(false)
  const [outputExpanded, setOutputExpanded] = useState(true)
  const terminalRef = useRef(null)
  const xtermRef = useRef(null)
  const fitAddonRef = useRef(null)
  const wsRef = useRef(null)

  const editorRef     = useRef(null)
  const ydocRef       = useRef(null)
  const providerRef   = useRef(null)
  const bindingRef    = useRef(null)
  const userColorRef  = useRef(getRandomColor())
  const toastTimerRef = useRef(null)
  const historyRef    = useRef(null)
  const snapTimerRef  = useRef(null)
  // File tabs refs
  const filesMapRef       = useRef(null)   // Y.Map('files')
  const modelsRef         = useRef({})     // { [fileId]: monaco.ITextModel }
  const monacoRef         = useRef(null)   // monaco instance
  const activeFileIdRef   = useRef('main') // kept in sync with activeFileId state

  const showToast = (type) => {
    setPermToast(type)
    clearTimeout(toastTimerRef.current)
    toastTimerRef.current = setTimeout(() => setPermToast(null), 3500)
  }

  useEffect(() => () => clearTimeout(toastTimerRef.current), [])

  // ── Yjs / WebRTC setup ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!roomName || !username) return
    const ydoc = new Y.Doc()
    ydocRef.current = ydoc
    const WS_URL  = import.meta.env.VITE_WS_URL || 'ws://localhost:4000'
    const provider = new WebsocketProvider(`${WS_URL}`, roomName, ydoc)
    providerRef.current = provider

    provider.awareness.setLocalStateField('user', {
      name: username, color: userColorRef.current, canEdit: true,
    })

    // ── Permissions Map setup ──────────────────────────────────────
    const permsMap = ydoc.getMap('permissions')
    const syncPermissions = () => {
      const pObj = permsMap.toJSON()
      // Notify parent about permission changes
      // This allows App.jsx to stay in sync with the persistent roles
      const users = Array.from(provider.awareness.getStates().entries())
        .filter(([, s]) => s.user)
        .map(([id, s]) => ({ 
          id, 
          name: s.user.name, 
          color: s.user.color, 
          canEdit: pObj[s.user.name] !== false // default to true
        }))
      onUsersChange(users)
    }
    permsMap.observe(syncPermissions)

    // ── Awareness handler (defensive) ──────────────────────────────
    const handleAwarenessChange = () => {
      const states     = provider.awareness.getStates()
      const myState    = states.get(provider.awareness.clientID)
      
      if (myState?.user) {
        const pObj = permsMap.toJSON()
        const myName = myState.user.name
        const allowed = pObj[myName] !== false

        setCanEdit(allowed)
        editorRef.current?.updateOptions({ readOnly: !allowed })
      }

      syncPermissions()
      setConnectionStatus('connected')
    }

    provider.awareness.on('change', handleAwarenessChange)

    // ── File Map setup ──────────────────────────────────────────────
    const filesMap = ydoc.getMap('files')
    filesMapRef.current = filesMap

    // Init default file if this is the first peer
    if (filesMap.size === 0) {
      filesMap.set('main', { id: 'main', name: 'main.js', language: 'javascript' })
    }

    const syncFiles = () => {
      const arr = Array.from(filesMap.entries()).map(([, v]) => v)
      setFiles(arr.length > 0 ? arr : [{ id: 'main', name: 'main.js', language: 'javascript' }])
    }
    filesMap.observe(syncFiles)
    syncFiles()

    // ── History snapshot recording ──────────────────────────────────
    const history = ydoc.getArray('history')
    historyRef.current = history
    const ytext = ydoc.getText('monaco')

    const saveSnapshot = () => {
      clearTimeout(snapTimerRef.current)
      snapTimerRef.current = setTimeout(() => {
        const content = ytext.toString()
        if (!content.trim()) return
        const last = history.length > 0 ? history.get(history.length - 1) : null
        if (last && last.content === content) return // no change
        history.push([{ content, timestamp: Date.now(), author: username }])
      }, 3000)
    }

    ytext.observe(saveSnapshot)

    return () => {
      clearTimeout(snapTimerRef.current)
      ytext.unobserve(saveSnapshot)
      filesMap.unobserve(syncFiles)
      permsMap.unobserve(syncPermissions)
      clearTimeout(toastTimerRef.current)
      provider.awareness.off('change', handleAwarenessChange)
      bindingRef.current?.destroy()
      bindingRef.current = null
      // Dispose all Monaco models
      Object.values(modelsRef.current).forEach(m => m?.dispose())
      modelsRef.current = {}
      provider.destroy()
      ydoc.destroy()
      wsRef.current?.close()
    }
  }, [roomName, username]) // eslint-disable-line

  // ── Terminal Setup ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!terminalRef.current) return

    const term = new Terminal({
      theme: {
        background: '#08080f',
        foreground: '#e2e8f0',
        cursor: '#a855f7',
        selection: '#3d3562',
      },
      fontFamily: 'JetBrains Mono, monospace',
      fontSize: 13,
      lineHeight: 1.2,
      convertEol: true,
      cursorBlinking: true,
    })

    const fitAddon = new FitAddon()
    term.loadAddon(fitAddon)
    term.open(terminalRef.current)
    fitAddon.fit()

    xtermRef.current = term
    fitAddonRef.current = fitAddon

    term.onData(data => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'stdin', data }))
      }
    })

    const handleResize = () => fitAddon.fit()
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      term.dispose()
    }
  }, [outputExpanded])

  useEffect(() => {
    if (outputExpanded && fitAddonRef.current) {
      setTimeout(() => fitAddonRef.current.fit(), 50)
    }
  }, [outputExpanded])

  // ── Monaco mount ────────────────────────────────────────────────────────────
  const handleEditorMount = (editor, monaco) => {
    monacoRef.current = monaco
    editorRef.current = editor

    monaco.editor.defineTheme('codecollab-dark', {
      base: 'vs-dark', inherit: true,
      rules: [
        { token: 'comment',         foreground: '5c6370', fontStyle: 'italic' },
        { token: 'keyword',         foreground: 'c678dd' },
        { token: 'string',          foreground: '98c379' },
        { token: 'number',          foreground: 'd19a66' },
        { token: 'operator',        foreground: '56b6c2' },
        { token: 'type',            foreground: 'e5c07b' },
        { token: 'function',        foreground: '61afef' },
        { token: 'variable',        foreground: 'e06c75' },
        { token: 'identifier',      foreground: 'abb2bf' },
        { token: 'tag',             foreground: 'e06c75' },
        { token: 'attribute.name',  foreground: 'd19a66' },
        { token: 'attribute.value', foreground: '98c379' },
      ],
      colors: {
        'editor.background':              '#0a0a14',
        'editor.foreground':              '#abb2bf',
        'editor.lineHighlightBackground': '#12122a',
        'editor.selectionBackground':     '#3d3562',
        'editorLineNumber.foreground':    '#3c3f58',
        'editorLineNumber.activeForeground': '#a855f7',
        'editorCursor.foreground':        '#a855f7',
        'scrollbarSlider.background':     '#a855f740',
        'scrollbarSlider.hoverBackground':'#a855f780',
        'editorWidget.background':        '#0f0f1f',
        'editorWidget.border':            '#2d2b55',
        'input.background':               '#12122a',
        'focusBorder':                    '#a855f7',
        'minimap.background':             '#08080f',
      }
    })
    monaco.editor.setTheme('codecollab-dark')

    if (!ydocRef.current || !providerRef.current) return

    // Create initial model for the active file
    const fileId = activeFileIdRef.current
    const ytext  = ydocRef.current.getText(`file-${fileId}`)
    // Also keep legacy 'monaco' text in sync for history
    const model  = monaco.editor.createModel('', 'javascript')
    modelsRef.current[fileId] = model
    editor.setModel(model)
    const binding = new MonacoBinding(ytext, model, new Set([editor]), providerRef.current.awareness)
    bindingRef.current = binding
    setIsReady(true)
    editor.updateOptions({ readOnly: false })
  }

  // ── File tab helpers ────────────────────────────────────────────────────────
  const switchFile = useCallback((fileId) => {
    if (!editorRef.current || !ydocRef.current || !providerRef.current || !monacoRef.current) return
    if (fileId === activeFileIdRef.current) return

    const monaco   = monacoRef.current
    const filesMap = filesMapRef.current
    const meta     = filesMap?.get(fileId)

    // Get or create Monaco model for this file
    let model = modelsRef.current[fileId]
    if (!model) {
      model = monaco.editor.createModel('', meta?.language || 'javascript')
      modelsRef.current[fileId] = model
    }

    // Rebind Yjs
    bindingRef.current?.destroy()
    const ytext   = ydocRef.current.getText(`file-${fileId}`)
    const binding = new MonacoBinding(ytext, model, new Set([editorRef.current]), providerRef.current.awareness)
    bindingRef.current = binding

    editorRef.current.setModel(model)
    monaco.editor.setModelLanguage(model, meta?.language || 'javascript')

    activeFileIdRef.current = fileId
    setActiveFileId(fileId)
    if (meta?.language) { setLanguage(meta.language); onLanguageChange?.(meta.language) }
    setOutput(null)
  }, [onLanguageChange])

  const EXT_MAP = { javascript: 'js', typescript: 'ts', python: 'py', java: 'java', cpp: 'cpp', html: 'html', css: 'css', json: 'json' }

  const addFile = useCallback(() => {
    if (!filesMapRef.current) return
    const id = `file-${Date.now()}`
    const ext = EXT_MAP[language] || 'txt'
    const names = Array.from(filesMapRef.current.values()).map(f => f.name)
    let name = `untitled.${ext}`
    let i = 2
    while (names.includes(name)) { name = `untitled${i++}.${ext}` }
    filesMapRef.current.set(id, { id, name, language })
    // Switch to new file after a tick (let Y.Map observer fire first)
    setTimeout(() => switchFile(id), 50)
  }, [language, switchFile])

  const removeFile = useCallback((fileId) => {
    if (!filesMapRef.current) return
    const remaining = Array.from(filesMapRef.current.keys()).filter(k => k !== fileId)
    if (remaining.length === 0) return // keep at least one file
    filesMapRef.current.delete(fileId)
    if (modelsRef.current[fileId]) {
      modelsRef.current[fileId].dispose()
      delete modelsRef.current[fileId]
    }
    if (activeFileIdRef.current === fileId) {
      setTimeout(() => switchFile(remaining[remaining.length - 1]), 50)
    }
  }, [switchFile])


  const handleRun = useCallback(async () => {
    if (isRunning || !editorRef.current || !xtermRef.current) return
    const code = editorRef.current.getValue()
    if (!code.trim()) return

    setIsRunning(true)
    setOutputExpanded(true)
    xtermRef.current.clear()
    xtermRef.current.focus()
    xtermRef.current.writeln(`\u001b[35m⚡ Executing ${language.toUpperCase()}...\u001b[0m`)

    const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:4000'
    const ws = new WebSocket(`${WS_URL}/api/execute-ws`)
    wsRef.current = ws

    ws.onopen = () => {
      ws.send(JSON.stringify({ type: 'run', language, code }))
    }

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data)
      if (msg.type === 'stdout') xtermRef.current.write(msg.data)
      if (msg.type === 'stderr') xtermRef.current.write(`\u001b[31m${msg.data}\u001b[0m`)
      if (msg.type === 'exit') {
        xtermRef.current.writeln(`\r\n\u001b[32mProcess exited with code ${msg.code}\u001b[0m`)
        setIsRunning(false)
        ws.close()
      }
      if (msg.type === 'error') {
        xtermRef.current.writeln(`\r\n\u001b[31mError: ${msg.message}\u001b[0m`)
        setIsRunning(false)
        ws.close()
      }
    }

    ws.onclose = () => {
      setIsRunning(false)
      wsRef.current = null
    }

    ws.onerror = (err) => {
      xtermRef.current.writeln(`\r\n\u001b[31mWebSocket connection error\u001b[0m`)
      setIsRunning(false)
    }

  }, [isRunning, language])

  const handleStop = useCallback(() => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'stop' }))
    }
  }, [])


  // ── Keyboard shortcuts ───────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') e.preventDefault()
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); handleRun() }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [handleRun])

  // ── Permission sync ──────────────────────────────────────────────────────────
  const syncPermission = (userId, newCanEdit) => {
    // We map permissions by USERNAME to make them survive reconnects
    const states = providerRef.current?.awareness.getStates()
    const target = states?.get(userId)
    if (target?.user?.name) {
      const permsMap = ydocRef.current.getMap('permissions')
      permsMap.set(target.user.name, newCanEdit)
    }
  }
  useImperativeHandle(ref, () => ({
    syncPermission,
    getCode: () => editorRef.current?.getValue() || '',
    getHistory: () => historyRef.current ? historyRef.current.toArray() : [],
    subscribeHistory: (cb) => {
      if (!historyRef.current) return () => {}
      historyRef.current.observe(cb)
      return () => historyRef.current?.unobserve(cb)
    },
    restoreSnapshot: (content) => {
      const editor = editorRef.current
      if (!editor) return
      const model = editor.getModel()
      model.pushEditOperations([], [{ range: model.getFullModelRange(), text: content }], () => null)
    },
  }))

  const canRun = EXECUTABLE.has(language)


  return (
    <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', position: 'relative' }}>

      {/* ── File Tabs ───────────────────────────────────────────────────── */}
      <div style={{
        flexShrink: 0, display: 'flex', alignItems: 'stretch',
        background: 'rgba(0,0,0,0.35)', borderBottom: '1px solid rgba(168,85,247,0.15)',
        overflowX: 'auto', overflowY: 'hidden',
      }}>
        {files.map(file => {
          const isActive = file.id === activeFileId
          return (
            <div
              key={file.id}
              onClick={() => switchFile(file.id)}
              onDoubleClick={() => {
                const newName = window.prompt('Rename file:', file.name)
                if (newName && newName.trim() && filesMapRef.current) {
                  filesMapRef.current.set(file.id, { ...file, name: newName.trim() })
                }
              }}
              title={`${file.name} — double-click to rename`}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '6px 14px 6px 12px', cursor: 'pointer', flexShrink: 0,
                borderRight: '1px solid rgba(255,255,255,0.05)',
                borderBottom: isActive ? '2px solid #a855f7' : '2px solid transparent',
                background: isActive ? 'rgba(168,85,247,0.1)' : 'transparent',
                color: isActive ? '#e2e8f0' : 'rgba(226,232,240,0.4)',
                fontSize: '12px', fontWeight: isActive ? '600' : '400',
                transition: 'all 0.15s', whiteSpace: 'nowrap', userSelect: 'none',
              }}
            >
              <span style={{ fontSize: '11px', opacity: 0.6 }}>
                {file.language === 'python' ? '🐍' : file.language === 'java' ? '☕' : file.language === 'cpp' ? '⚡' : file.language === 'html' ? '🌐' : '📄'}
              </span>
              <span>{file.name}</span>
              {files.length > 1 && (
                <button
                  onClick={e => { e.stopPropagation(); removeFile(file.id) }}
                  style={{
                    marginLeft: '2px', width: '16px', height: '16px', borderRadius: '4px',
                    border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: 'transparent', color: 'rgba(226,232,240,0.3)', fontSize: '12px', lineHeight: 1,
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(248,113,113,0.2)'; e.currentTarget.style.color = '#f87171' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(226,232,240,0.3)' }}
                >×</button>
              )}
            </div>
          )
        })}
        {/* New file button */}
        <button
          onClick={addFile}
          title="New file (add tab)"
          style={{
            display: 'flex', alignItems: 'center', gap: '4px',
            padding: '5px 12px', border: '1px solid rgba(168,85,247,0.3)', cursor: 'pointer',
            background: 'rgba(168,85,247,0.12)', color: 'rgba(168,85,247,0.9)',
            fontSize: '12px', fontWeight: '700', flexShrink: 0, borderRadius: '6px',
            margin: '4px 8px', transition: 'all 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(168,85,247,0.25)'; e.currentTarget.style.borderColor = '#a855f7' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(168,85,247,0.12)'; e.currentTarget.style.borderColor = 'rgba(168,85,247,0.3)' }}
        >＋ New File</button>
      </div>

      {/* ── Toolbar ─────────────────────────────────────────────────────── */}
      <div style={{
        flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '8px 16px',
        background: 'rgba(124,58,237,0.08)', borderBottom: '1px solid rgba(124,58,237,0.2)',
      }}>
        {/* Left */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '28px', height: '28px', borderRadius: '8px', flexShrink: 0,
            background: 'linear-gradient(135deg, #5b21b6, #a855f7)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '14px', boxShadow: '0 0 12px rgba(168,85,247,0.4)',
          }}>💻</div>

          <select
            value={language}
            onChange={(e) => handleLanguageChange(e.target.value)}
            style={{
              padding: '5px 10px', borderRadius: '8px', cursor: 'pointer',
              background: 'rgba(168,85,247,0.12)', border: '1px solid rgba(168,85,247,0.3)',
              color: '#e2e8f0', fontSize: '13px', fontWeight: '600', outline: 'none',
              fontFamily: 'Inter, sans-serif',
            }}
          >
            {LANGUAGES.map(l => <option key={l.value} value={l.value} style={{ background: '#1a1a2e' }}>{l.label}</option>)}
          </select>

          {/* Connection pill */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '5px 11px', borderRadius: '8px',
            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)',
          }}>
            <div style={{
              width: '7px', height: '7px', borderRadius: '50%',
              background: connectionStatus === 'connected' ? '#4ade80' : '#facc15',
              boxShadow: connectionStatus === 'connected' ? '0 0 6px #4ade80' : '0 0 6px #facc15',
            }} />
            <span style={{ fontSize: '12px', color: 'rgba(226,232,240,0.5)' }}>
              {connectionStatus === 'connected' ? 'Synced' : 'Connecting...'}
            </span>
          </div>

          {/* Read-only badge */}
          {!canEdit && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '5px',
              padding: '5px 11px', borderRadius: '8px',
              background: 'rgba(234,179,8,0.1)', border: '1px solid rgba(234,179,8,0.3)',
            }}>
              <span style={{ fontSize: '12px' }}>🔒</span>
              <span style={{ fontSize: '12px', fontWeight: '700', color: '#eab308' }}>Read Only</span>
            </div>
          )}
        </div>

        {/* Right — Run button */}
        <button
          onClick={handleRun}
          disabled={isRunning || !canRun}
          title={canRun ? 'Run (Ctrl+Enter)' : `${language.toUpperCase()} cannot be executed`}
          style={{
            display: 'flex', alignItems: 'center', gap: '7px',
            padding: '7px 18px', borderRadius: '9px', border: 'none', cursor: canRun ? 'pointer' : 'not-allowed',
            background: isRunning
              ? 'rgba(168,85,247,0.3)'
              : canRun
                ? 'linear-gradient(135deg, #5b21b6, #a855f7)'
                : 'rgba(255,255,255,0.07)',
            color: canRun ? '#fff' : 'rgba(226,232,240,0.3)',
            fontWeight: '700', fontSize: '13px',
            boxShadow: canRun && !isRunning ? '0 0 18px rgba(168,85,247,0.4)' : 'none',
            transition: 'all 0.2s',
          }}
        >
          {isRunning ? (
            <>
              <div style={{
                width: '13px', height: '13px', borderRadius: '50%',
                border: '2px solid transparent', borderTopColor: '#fff',
                animation: 'spin 0.8s linear infinite',
              }} />
              Running...
            </>
          ) : (
            <>▶ Run<span style={{ fontSize: '11px', opacity: 0.6 }}>Ctrl+↵</span></>
          )}
        </button>
      </div>

      {/* ── Editor + Output (flex column) ──────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>

        {/* Monaco fills remaining space */}
        <div style={{ flex: 1, position: 'relative', minHeight: 0 }}>
          {!isReady && (
            <div style={{
              position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', gap: '12px',
              background: '#0a0a14', zIndex: 10,
            }}>
              <div style={{
                width: '40px', height: '40px', borderRadius: '50%',
                border: '2px solid transparent', borderTopColor: '#a855f7', borderRightColor: '#06b6d4',
                animation: 'spin 0.9s linear infinite',
              }} />
              <p style={{ color: 'rgba(226,232,240,0.5)', fontSize: '14px' }}>Loading editor...</p>
            </div>
          )}
          <Editor
            height="100%"
            language={language}
            theme="codecollab-dark"
            onMount={handleEditorMount}
            options={{
              fontSize: 14, minimap: { enabled: true }, lineNumbers: 'on',
              automaticLayout: true, tabSize: 2, wordWrap: 'on',
              readOnly: !canEdit, cursorBlinking: 'smooth', smoothScrolling: true,
              scrollBeyondLastLine: false, fontFamily: 'JetBrains Mono, monospace',
              fontLigatures: true, renderLineHighlight: 'all',
            }}
            defaultValue={`// Welcome to CodeCollab! 🚀\n// Start typing — changes sync in real-time.\n// Press Ctrl+Enter to run your code.\n\nfunction hello(name) {\n  console.log(\`Happy coding, \${name}!\`);\n}\n\nhello('World');\n`}
          />
        </div>

        {/* ── Terminal Output Panel ───────────────────────────────────────────── */}
        <div style={{
          flexShrink: 0,
          borderTop: '1px solid rgba(168,85,247,0.3)',
          background: '#08080f',
          display: 'flex', flexDirection: 'column',
          height: outputExpanded ? '300px' : '38px',
          transition: 'height 0.25s ease',
          overflow: 'hidden',
          zIndex: 10,
        }}>
          {/* Output toolbar */}
          <div style={{
            flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '6px 14px',
            background: 'rgba(168,85,247,0.05)',
            borderBottom: '1px solid rgba(255,255,255,0.05)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '13px' }}>{isRunning ? '⏳' : '💻'}</span>
              <span style={{ fontSize: '12px', fontWeight: '700', color: '#a855f7' }}>
                Terminal {isRunning ? '(Running...)' : ''}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              {isRunning && (
                <button
                  onClick={handleStop}
                  style={{
                    padding: '3px 9px', borderRadius: '6px', border: 'none', cursor: 'pointer',
                    background: 'rgba(244,63,94,0.15)', color: '#f43f5e', fontSize: '12px', fontWeight: 'bold'
                  }}
                >⏹ Stop</button>
              )}
              <button
                onClick={() => setOutputExpanded(v => !v)}
                style={{
                  padding: '3px 9px', borderRadius: '6px', border: 'none', cursor: 'pointer',
                  background: 'rgba(255,255,255,0.06)', color: 'rgba(226,232,240,0.5)', fontSize: '12px',
                }}
              >{outputExpanded ? '▼ Collapse' : '▲ Expand'}</button>
              <button
                onClick={() => { xtermRef.current?.clear(); }}
                style={{
                  padding: '3px 9px', borderRadius: '6px', border: 'none', cursor: 'pointer',
                  background: 'rgba(255,255,255,0.06)', color: 'rgba(226,232,240,0.5)', fontSize: '12px',
                }}
              >🧹 Clear Terminal</button>
            </div>
          </div>

          {/* xterm container */}
          <div 
            ref={terminalRef}
            style={{ 
              flex: 1, 
              padding: '4px 8px',
              visibility: outputExpanded ? 'visible' : 'hidden',
              height: '100%'
            }} 
          />
        </div>
      </div>

      {/* ── Status bar ────────────────────────────────────────────────── */}
      <div style={{
        flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '4px 16px',
        background: 'rgba(124,58,237,0.08)', borderTop: '1px solid rgba(124,58,237,0.18)',
        fontSize: '11px', color: 'rgba(226,232,240,0.3)',
      }}>
        <span>Monaco Editor · Yjs WebRTC · Piston</span>
        <span style={{ color: 'rgba(168,85,247,0.7)', fontFamily: 'JetBrains Mono, monospace' }}>{roomName}</span>
      </div>

      {/* ── Permission toast ──────────────────────────────────────────── */}
      {permToast && (
        <div style={{ position: 'fixed', bottom: '28px', left: '50%', transform: 'translateX(-50%)', zIndex: 9999 }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            padding: '12px 22px', borderRadius: '14px',
            fontWeight: '700', fontSize: '14px', color: 'white', whiteSpace: 'nowrap',
            ...(permToast === 'locked'
              ? { background: 'linear-gradient(135deg, #92400e, #d97706)', boxShadow: '0 8px 32px rgba(217,119,6,0.5)' }
              : { background: 'linear-gradient(135deg, #14532d, #16a34a)', boxShadow: '0 8px 32px rgba(22,163,74,0.5)' }
            ),
          }}>
            <span style={{ fontSize: '18px' }}>{permToast === 'locked' ? '🔒' : '✏️'}</span>
            <span>{permToast === 'locked' ? 'Admin restricted your editing' : 'Admin granted you edit access'}</span>
          </div>
        </div>
      )}
    </div>
  )
})

export default CodeEditor
