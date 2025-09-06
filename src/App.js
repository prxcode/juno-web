import React, { useEffect, useMemo, useState } from 'react';
import CodeEditor from './CodeEditor.js';
import './App.css';

const DEFAULT_CODE = `// Online Java Compiler
// Use this editor to write, compile and run your Java code online

public class Main { //keep this as public class Main
    public static void main(String[] args) {
        System.out.println("Hello Priyanshu!");
    }
}
`;

// ✅ CHANGE THIS TO YOUR RENDER BACKEND URL
const API_BASE = process.env.REACT_APP_API_BASE || 'https://juno-web-yw3y.onrender.com';

function toLines(s) {
  return (s || '').split(/\r?\n/);
}

function detectPublicClass(src) {
  const m = src.match(/public\s+class\s+(\w+)/);
  const name = m ? m[1] : null;
  return { name, isMain: name === 'Main' };
}

export default function App() {
  const [code, setCode] = useState(DEFAULT_CODE);
  const [inputs, setInputs] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const clsInfo = useMemo(() => detectPublicClass(code), [code]);
  const fileName = `${clsInfo.name || 'Main'}.java`;

  useEffect(() => {
    // Load code/input from share URL (if any)
    if (location.hash.length > 1) {
      try {
        const json = JSON.parse(decodeURIComponent(atob(location.hash.slice(1))));
        if (json.c) setCode(json.c);
        if (json.i) setInputs(json.i);
      } catch (_) {}
    }
  }, []);

  async function run() {
    setBusy(true);
    setOutput('');
    setError('');
    try {
      const response = await fetch(`${API_BASE}/runJava`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, inputs: toLines(inputs) }),
      });

      const data = await response.json();

      if (data.output) setOutput(data.output);
      if (data.error) setError(data.error);
    } catch (e) {
      setError(`Error: ${e.message}`);
    } finally {
      setBusy(false);
    }
  }

  function clearAll() {
    setCode(DEFAULT_CODE);
    setInputs('');
    setOutput('');
    setError('');
  }

  function saveLocal() {
    const blob = new Blob([code], { type: 'text/x-java' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  function copyShareUrl() {
    try {
      const payload = { c: code, i: inputs };
      const b64 = btoa(encodeURIComponent(JSON.stringify(payload)));
      const url = new URL(window.location.href);
      url.hash = b64;
      navigator.clipboard.writeText(url.toString());
      alert('Shareable URL copied to clipboard');
    } catch (e) {
      alert('Failed to copy share URL');
    }
  }

  return (
    <div className="app">
      <section className="panel editor-panel">
        <div className="header">
          <h2>Juno - Online Java Compiler</h2>
          <div className="toolbar">
            <button className="btn" onClick={saveLocal}>Download Code</button>
            <button className="btn secondary" onClick={clearAll}>Clear</button>
            <button className="btn run" onClick={run} disabled={busy}>
              {busy ? 'Running…' : 'Run'}
            </button>
          </div>
        </div>

        <div className="editor-container">
          <CodeEditor code={code} onChange={setCode} />
        </div>
      </section>

      <aside className="panel right-panel">
        <div className="header">
          <h2>Input & Output</h2>
          <div className="toolbar">
            <button className="btn secondary" onClick={copyShareUrl}>Share</button>
          </div>
        </div>

        <div className="stack">
          <div>
            <div className="subtle">Program input (multi-line):</div>
            <textarea
              className="textarea"
              value={inputs}
              onChange={(e) => setInputs(e.target.value)}
              placeholder="Input your data before running code"
            />
          </div>

          <div>
            <div className="subtle">Output:</div>
            <pre className={`output ${error ? 'error' : ''}`}>
              {error ? error : output || '—'}
            </pre>
          </div>

          <footer>
            © 2025 Developed by prxcode
          </footer>
        </div>
      </aside>
    </div>
  );
}
