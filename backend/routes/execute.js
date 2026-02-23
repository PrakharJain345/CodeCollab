const express = require('express')
const { spawn } = require('child_process')
const fs       = require('fs')
const path     = require('path')
const os       = require('os')
const router   = express.Router()

const TIMEOUT_MS   = 15_000   // 15 second wall-clock limit
const MAX_OUT_BYTES = 512_000  // 512 KB output cap per stream

const WANDBOX_COMPILERS = {
  typescript: 'typescript-5.2.2',
  python:     'cpython-3.11.0',
  java:       'openjdk-head',
  cpp:        'gcc-head',
}

async function runWithWandbox(language, code) {
  const compiler = WANDBOX_COMPILERS[language]
  if (!compiler) throw new Error(`${language} is not supported for execution.`)

  const res = await fetch('https://wandbox.org/api/compile.json', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, compiler, save: false }),
  })

  if (!res.ok) throw new Error(`Remote execution service error (${res.status})`)

  const data = await res.json()
  const compErr = data.compiler_error || ''
  const stderr  = compErr + (compErr && data.program_error ? '\n' : '') + (data.program_error || '')
  return {
    stdout:   data.program_output || '',
    stderr:   stderr,
    exitCode: parseInt(data.status ?? (stderr && !data.program_output ? '1' : '0'), 10),
    language: `${language} (Remote Fallback)`,
    version:  compiler
  }
}

// ── Run a command via spawn, collect stdout/stderr, enforce timeout ──────────
function runProcess(cmd, args, opts = {}) {
  return new Promise((resolve) => {
    const proc = spawn(cmd, args, {
      cwd:   opts.cwd,
      env:   { ...process.env, ...(opts.env || {}) },
      shell: false,
    })

    let stdout = ''
    let stderr = ''
    let killed = false

    const timer = setTimeout(() => {
      killed = true
      try { proc.kill('SIGKILL') } catch (_) {}
    }, TIMEOUT_MS)

    proc.stdout.on('data', (chunk) => {
      if (stdout.length < MAX_OUT_BYTES) stdout += chunk.toString('utf8')
    })
    proc.stderr.on('data', (chunk) => {
      if (stderr.length < MAX_OUT_BYTES) stderr += chunk.toString('utf8')
    })

    proc.on('close', (code) => {
      clearTimeout(timer)
      if (killed) {
        resolve({ stdout, stderr: `⏱ Execution timed out after ${TIMEOUT_MS / 1000}s\n${stderr}`, exitCode: 124 })
      } else {
        resolve({ stdout, stderr, exitCode: code ?? 0 })
      }
    })

    proc.on('error', (err) => {
      clearTimeout(timer)
      resolve({ stdout: '', stderr: `Failed to start process: ${err.message}`, exitCode: 1 })
    })
  })
}

// ── POST /api/execute ────────────────────────────────────────────────────────
router.post('/', async (req, res) => {
  const { language, code } = req.body
  if (!code || !language) {
    return res.status(400).json({ error: 'language and code are required' })
  }

  // Temp directory per request
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cc-'))

  try {
    let result

    switch (language) {

      // ── JavaScript ──────────────────────────────────────────────────────
      case 'javascript': {
        const file = path.join(tmpDir, 'main.js')
        fs.writeFileSync(file, code, 'utf8')
        result = await runProcess(process.execPath, [file])
        result.language = 'JavaScript (Node ' + process.version + ')'
        break
      }

      // ── TypeScript ──────────────────────────────────────────────────────
      case 'typescript': {
        const file = path.join(tmpDir, 'main.ts')
        fs.writeFileSync(file, code, 'utf8')
        // Try ts-node from local node_modules
        const tsNode = path.resolve(process.cwd(), 'node_modules/.bin/ts-node')
        if (fs.existsSync(tsNode)) {
          result = await runProcess(tsNode, ['--transpile-only', file])
          result.language = 'TypeScript (Local)'
        } else {
          // Fallback to Wandbox
          result = await runWithWandbox('typescript', code)
        }
        break
      }

      // ── Python ──────────────────────────────────────────────────────────
      case 'python': {
        const pyCmd = await cmdExists('python3') ? 'python3' : (await cmdExists('python') ? 'python' : null)
        if (pyCmd) {
          const file = path.join(tmpDir, 'main.py')
          fs.writeFileSync(file, code, 'utf8')
          result = await runProcess(pyCmd, [file])
          result.language = 'Python (Local)'
        } else {
          result = await runWithWandbox('python', code)
        }
        break
      }

      // ── Java ────────────────────────────────────────────────────────────
      case 'java': {
        if (await cmdExists('javac')) {
          const match     = code.match(/public\s+class\s+(\w+)/)
          const className = match ? match[1] : 'Main'
          const file      = path.join(tmpDir, `${className}.java`)
          fs.writeFileSync(file, code, 'utf8')

          const compile = await runProcess('javac', [file], { cwd: tmpDir })
          if (compile.exitCode !== 0) {
            return res.json({ ...compile, language: 'Java (Local)', stage: 'compilation' })
          }
          result = await runProcess('java', ['-cp', tmpDir, className])
          result.language = 'Java (Local)'
        } else {
          result = await runWithWandbox('java', code)
        }
        break
      }

      // ── C++ ─────────────────────────────────────────────────────────────
      case 'cpp': {
        if (await cmdExists('g++') || await cmdExists('clang++')) {
          const cppCmd = await cmdExists('g++') ? 'g++' : 'clang++'
          const src = path.join(tmpDir, 'main.cpp')
          const bin = path.join(tmpDir, 'main.out')
          fs.writeFileSync(src, code, 'utf8')

          const compile = await runProcess(cppCmd, ['-o', bin, src, '-std=c++17'])
          if (compile.exitCode !== 0) {
            return res.json({ ...compile, language: 'C++ (Local)', stage: 'compilation' })
          }
          result = await runProcess(bin, [])
          result.language = 'C++ (Local)'
        } else {
          result = await runWithWandbox('cpp', code)
        }
        break
      }

      default:
        return res.status(400).json({
          error: `Server-side execution not available for '${language}'. ` +
                 `Supported: javascript, typescript, python, java, cpp`,
        })
    }

    // Trim trailing whitespace and truncate if over limit
    result.stdout = trimOutput(result.stdout)
    result.stderr = trimOutput(result.stderr)
    return res.json(result)

  } catch (err) {
    return res.status(500).json({ error: err.message, stdout: '', stderr: err.message, exitCode: 1 })
  } finally {
    try { fs.rmSync(tmpDir, { recursive: true, force: true }) } catch (_) {}
  }
})

// ── Helpers ──────────────────────────────────────────────────────────────────
function trimOutput(str) {
  const s = str.trimEnd()
  if (s.length > 50_000) return s.slice(0, 50_000) + '\n... [output truncated at 50 KB]'
  return s
}

async function cmdExists(cmd) {
  return new Promise(resolve =>
    require('child_process').exec(
      process.platform === 'win32' ? `where ${cmd}` : `which ${cmd}`,
      (err) => resolve(!err)
    )
  )
}

module.exports = router
