import { spawn, exec } from 'child_process';
import { mkdtempSync, writeFileSync, rmSync, existsSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { fileURLToPath } from 'url';

// Express-style handler function
export async function runJavaHandler(req, res) {
  if (req.method !== 'POST') {
    res.writeHead(405, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ error: 'Method Not Allowed' }));
  }

  let body = '';
  req.on('data', chunk => body += chunk);
  req.on('end', () => {
    try {
      const { code, inputs } = JSON.parse(body);

      if (!code || typeof code !== 'string') {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: 'Missing Java code in request body' }));
      }

      if (!/public\s+class\s+Main\b/.test(code)) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: 'Java code must include: public class Main' }));
      }

      const workdir = mkdtempSync(join(tmpdir(), 'java-run-'));
      const javaFile = join(workdir, 'Main.java');

      writeFileSync(javaFile, code, 'utf8');

      exec(`javac Main.java`, { cwd: workdir, timeout: 10000 }, (compileErr, _stdout, compileStderr) => {
        if (compileErr) {
          cleanup(workdir);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ error: compileStderr || compileErr.message }));
        }

        const child = spawn('java', ['-Xms32m', '-Xmx256m', 'Main'], { cwd: workdir });
        let stdout = '';
        let stderr = '';
        let timedOut = false;

        const timer = setTimeout(() => {
          timedOut = true;
          try { child.kill('SIGKILL'); } catch (e) {}
        }, 8000);

        child.stdout.on('data', d => stdout += d.toString());
        child.stderr.on('data', d => stderr += d.toString());

        child.on('close', code => {
          clearTimeout(timer);
          cleanup(workdir);

          const payload = {};
          if (timedOut) {
            payload.error = 'Execution timed out.';
          } else if (code !== 0) {
            payload.error = stderr || `Exited with code ${code}`;
          } else {
            payload.output = stdout;
          }

          res.writeHead(200, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify(payload));
        });

        // Feed standard input
        if (Array.isArray(inputs) && inputs.length > 0) {
          child.stdin.write(inputs.join('\n'));
        }
        child.stdin.end();
      });

    } catch (e) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: 'Invalid JSON or internal error.' }));
    }
  });

  function cleanup(dir) {
    try {
      if (existsSync(dir)) rmSync(dir, { recursive: true, force: true });
    } catch (_) {}
  }
}
