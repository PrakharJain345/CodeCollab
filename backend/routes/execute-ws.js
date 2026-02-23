const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

// Helper to check if command exists (copied from execute.js logic)
async function cmdExists(cmd) {
  return new Promise(resolve =>
    require('child_process').exec(
      process.platform === 'win32' ? `where ${cmd}` : `which ${cmd}`,
      (err) => resolve(!err)
    )
  );
}

const TIMEOUT_MS = 60_000; // 1 minute limit for interactive sessions

const WANDBOX_COMPILERS = {
  typescript: 'typescript-5.2.2',
  python:     'cpython-3.11.0',
  java:       'openjdk-head',
  cpp:        'gcc-head',
};

async function runWithWandbox(language, code) {
  const compiler = WANDBOX_COMPILERS[language];
  if (!compiler) throw new Error(`${language} is not supported for execution.`);

  const res = await fetch('https://wandbox.org/api/compile.json', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, compiler, save: false }),
  });

  if (!res.ok) throw new Error(`Remote execution service error (${res.status})`);

  const data = await res.json();
  const compErr = data.compiler_error || '';
  const stderr  = compErr + (compErr && data.program_error ? '\n' : '') + (data.program_error || '');
  return {
    stdout:   data.program_output || '',
    stderr:   stderr,
    exitCode: parseInt(data.status ?? (stderr && !data.program_output ? '1' : '0'), 10),
    language: `${language} (Remote Fallback)`,
    version:  compiler
  };
}

function setupExecuteWS(ws, req) {
  let proc = null;
  let tmpDir = null;

  ws.on('message', async (message) => {
    try {
      const data = JSON.parse(message);

      // Start execution
      if (data.type === 'run') {
        const { language, code } = data;
        if (!code || !language) return ws.send(JSON.stringify({ type: 'error', message: 'Missing code or language' }));

        // Handler for remote execution (non-interactive fallback)
        const handleRemote = async () => {
          ws.send(JSON.stringify({ type: 'stdout', data: `💡 Local ${language} environment not found. Falling back to remote execution...\r\n` }));
          try {
            const result = await runWithWandbox(language, code);
            if (result.stdout) ws.send(JSON.stringify({ type: 'stdout', data: result.stdout }));
            if (result.stderr) ws.send(JSON.stringify({ type: 'stderr', data: result.stderr }));
            ws.send(JSON.stringify({ type: 'exit', code: result.exitCode }));
          } catch (err) {
            ws.send(JSON.stringify({ type: 'error', message: `Remote execution failed: ${err.message}` }));
          }
          cleanup();
        };

        tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cc-ws-'));
        let cmd = '';
        let args = [];

        switch (language) {
          case 'javascript':
            const jsFile = path.join(tmpDir, 'main.js');
            fs.writeFileSync(jsFile, code);
            cmd = process.execPath;
            args = [jsFile];
            break;
          case 'python':
            const pyCmd = await cmdExists('python3') ? 'python3' : (await cmdExists('python') ? 'python' : null);
            if (!pyCmd) return await handleRemote();
            const pyFile = path.join(tmpDir, 'main.py');
            fs.writeFileSync(pyFile, code);
            cmd = pyCmd;
            args = [pyFile];
            break;
          case 'cpp':
            if (!(await cmdExists('g++'))) return await handleRemote();
            const cppSrc = path.join(tmpDir, 'main.cpp');
            const cppBin = path.join(tmpDir, 'main.out');
            fs.writeFileSync(cppSrc, code);
            const compile = require('child_process').spawnSync('g++', ['-o', cppBin, cppSrc, '-std=c++17']);
            if (compile.status !== 0) {
              ws.send(JSON.stringify({ type: 'stderr', data: compile.stderr.toString() }));
              ws.send(JSON.stringify({ type: 'exit', code: compile.status }));
              return cleanup();
            }
            cmd = cppBin;
            args = [];
            break;
          case 'java':
            if (!(await cmdExists('javac'))) return await handleRemote();
            const match = code.match(/public\s+class\s+(\w+)/);
            const className = match ? match[1] : 'Main';
            const javaFile = path.join(tmpDir, `${className}.java`);
            fs.writeFileSync(javaFile, code);
            const jCompile = require('child_process').spawnSync('javac', [javaFile], { cwd: tmpDir });
            if (jCompile.status !== 0) {
              ws.send(JSON.stringify({ type: 'stderr', data: jCompile.stderr.toString() }));
              ws.send(JSON.stringify({ type: 'exit', code: jCompile.status }));
              return cleanup();
            }
            cmd = 'java';
            args = ['-cp', tmpDir, className];
            break;
          default:
            return ws.send(JSON.stringify({ type: 'error', message: `Language ${language} not supported interactive yet` }));
        }

        proc = spawn(cmd, args, {
          cwd: tmpDir,
          env: { ...process.env, NODE_ENV: 'production' },
          shell: false
        });

        proc.stdout.on('data', (chunk) => {
          ws.send(JSON.stringify({ type: 'stdout', data: chunk.toString() }));
        });

        proc.stderr.on('data', (chunk) => {
          ws.send(JSON.stringify({ type: 'stderr', data: chunk.toString() }));
        });

        proc.on('close', (code) => {
          ws.send(JSON.stringify({ type: 'exit', code }));
          cleanup();
        });

        proc.on('error', (err) => {
          ws.send(JSON.stringify({ type: 'error', message: err.message }));
          cleanup();
        });

        // Kill after timeout
        setTimeout(() => {
          if (proc) {
            proc.kill('SIGKILL');
            ws.send(JSON.stringify({ type: 'error', message: 'Execution timed out' }));
          }
        }, TIMEOUT_MS);
      }

      // Handle stdin
      if (data.type === 'stdin') {
        if (proc && proc.stdin.writable) {
          proc.stdin.write(data.data);
        }
      }

      // Handle kill/stop
      if (data.type === 'stop') {
        if (proc) proc.kill('SIGKILL');
      }

    } catch (err) {
      ws.send(JSON.stringify({ type: 'error', message: err.message }));
    }
  });

  function cleanup() {
    if (tmpDir) {
      try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch (_) {}
      tmpDir = null;
    }
    proc = null;
  }

  ws.on('close', () => {
    if (proc) proc.kill('SIGKILL');
    cleanup();
  });
}

module.exports = { setupExecuteWS };
