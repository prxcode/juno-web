import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { mkdtempSync, writeFileSync, rmSync, existsSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { exec, spawn } from 'child_process';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
// allow CRA default dev server origin
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:3000';

app.use(cors({ origin: CORS_ORIGIN }));
app.use(express.json({ limit: '2mb' }));

app.get('/health', (_, res) => res.json({ ok: true }));

/**
 * POST /runJava
 * body: { code: string, inputs: string[] }
 * requires public class Main in code (backend enforces Main)
 */
app.post('/runJava', (req, res) => {
  try {
    const { code, inputs } = req.body || {};

    if (typeof code !== 'string') {
      return res.status(400).json({ error: 'Missing code string in request body' });
    }

    // simple safety check: require "public class Main"
    if (!/public\s+class\s+Main\b/.test(code)) {
      return res.status(400).json({ error: 'Code must contain: public class Main' });
    }

    const workdir = mkdtempSync(join(tmpdir(), 'java-run-'));
    const javaFile = join(workdir, 'Main.java');

    writeFileSync(javaFile, code, 'utf8');

    // compile
    exec(`javac Main.java`, { cwd: workdir, timeout: 15000 }, (compileErr, _stdout, compileStderr) => {
      if (compileErr) {
        cleanup(workdir);
        // return compiler stderr
        return res.status(200).json({ error: compileStderr || compileErr.message });
      }

      // run the program with a time limit and small heap settings
      const child = spawn('java', ['-Xms32m', '-Xmx256m', 'Main'], { cwd: workdir });

      let stdout = '';
      let stderr = '';
      let timedOut = false;

      const timeoutMs = 8000;
      const timer = setTimeout(() => {
        timedOut = true;
        // force kill
        try { child.kill('SIGKILL'); } catch (e) {}
      }, timeoutMs);

      child.stdout.on('data', (d) => { stdout += d.toString(); });
      child.stderr.on('data', (d) => { stderr += d.toString(); });

      child.on('error', (err) => {
        clearTimeout(timer);
        cleanup(workdir);
        return res.status(200).json({ error: `Failed to start JVM: ${err.message}` });
      });

      child.on('close', (code) => {
        clearTimeout(timer);
        const payload = {};
        if (timedOut) {
          payload.error = `Execution timed out after ${timeoutMs}ms`;
        } else if (code !== 0) {
          payload.error = stderr || `Process exited with code ${code}`;
        } else {
          payload.output = stdout;
        }
        cleanup(workdir);
        return res.status(200).json(payload);
      });

      // Feed inputs (array of lines) to stdin
      if (Array.isArray(inputs) && inputs.length > 0) {
        child.stdin.write(inputs.join('\n'));
      }
      child.stdin.end();
    });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Server failure' });
  }
});

function cleanup(dir) {
  try { if (existsSync(dir)) rmSync(dir, { recursive: true, force: true }); } catch (e) {}
}

app.listen(PORT, () => {
  console.log(`Server listening on ${PORT}`);
  console.log(`CORS origin allowed: ${CORS_ORIGIN}`);
});
