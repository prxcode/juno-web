import { exec, spawn } from 'child_process';
import { mkdtempSync, writeFileSync, rmSync, existsSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

export default function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { code, inputs } = req.body || {};

  if (typeof code !== 'string') {
    return res.status(400).json({ error: 'Missing code string in request body' });
  }

  if (!/public\s+class\s+Main\b/.test(code)) {
    return res.status(400).json({ error: 'Code must contain: public class Main' });
  }

  const workdir = mkdtempSync(join(tmpdir(), 'java-run-'));
  const javaFile = join(workdir, 'Main.java');

  writeFileSync(javaFile, code, 'utf8');

  exec(`javac Main.java`, { cwd: workdir, timeout: 15000 }, (compileErr, _stdout, compileStderr) => {
    if (compileErr) {
      cleanup(workdir);
      return res.status(200).json({ error: compileStderr || compileErr.message });
    }

    const child = spawn('java', ['-Xms32m', '-Xmx256m', 'Main'], { cwd: workdir });

    let stdout = '';
    let stderr = '';
    let timedOut = false;

    const timeoutMs = 8000;
    const timer = setTimeout(() => {
      timedOut = true;
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

    if (Array.isArray(inputs) && inputs.length > 0) {
      child.stdin.write(inputs.join('\n'));
    }
    child.stdin.end();
  });

  function cleanup(dir) {
    try { if (existsSync(dir)) rmSync(dir, { recursive: true, force: true }); } catch (e) {}
  }
}
